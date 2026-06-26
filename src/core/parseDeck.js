import MarkdownIt from "markdown-it";

const VALID_LAYOUTS = new Set([
  "default",
  "image-left",
  "image-right",
  "image-full",
  "full",
  "two-col",
  "media",
  "cover",
  "quote",
  "compare"
]);

const VALID_CLASSES = new Set(["dark", "light", "accent"]);
const VALID_FITS = new Set(["shrink", "scroll"]);
const VALID_SIZES = new Set(["normal", "large", "xl", "hero"]);
const VALID_BOOLEAN_VALUES = new Set(["true", "false"]);
const DEFAULT_SETTINGS = {
  font: "system",
  fontFamily: ""
};

const md = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: true
});

function cleanHeadingText(text) {
  return text.replace(/\s+#+\s*$/, "").trim();
}

function parseFrontmatterValue(rawValue) {
  const value = rawValue.trim();
  const quote = value[0];

  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1);
  }

  return value;
}

function parseFrontmatter(markdown, warnings) {
  const source = markdown.replace(/^\uFEFF/, "");
  const lines = source.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    return {
      lines,
      lineOffset: 0,
      settings: { ...DEFAULT_SETTINGS }
    };
  }

  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (endIndex === -1) {
    warnings.push("Unclosed frontmatter block at line 1");
    return {
      lines,
      lineOffset: 0,
      settings: { ...DEFAULT_SETTINGS }
    };
  }

  const settings = { ...DEFAULT_SETTINGS };
  for (let index = 1; index < endIndex; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) {
      warnings.push(`Unknown frontmatter entry at line ${index + 1}: ${line}`);
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = parseFrontmatterValue(line.slice(separator + 1));

    if (key === "font") {
      settings.font = value || DEFAULT_SETTINGS.font;
      continue;
    }

    if (key === "fontFamily") {
      settings.fontFamily = value;
    }
  }

  return {
    lines: lines.slice(endIndex + 1),
    lineOffset: endIndex + 1,
    settings
  };
}

function createSlide({ title = "", line = 1, meta = {} } = {}) {
  return {
    title,
    line,
    layout: meta.layout ?? "default",
    theme: meta.class ?? "light",
    fit: meta.fit ?? "shrink",
    size: meta.size ?? "normal",
    hidden: meta.hidden ?? false,
    bodyLines: []
  };
}

function parseDirective(raw, line, warnings) {
  const parts = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  const meta = {};
  let breakSlide = false;

  for (const part of parts) {
    if (part === "break") {
      breakSlide = true;
      continue;
    }

    if (part === "hidden") {
      meta.hidden = true;
      continue;
    }

    const separator = part.indexOf("=");
    if (separator === -1) {
      warnings.push(`Unknown slide directive token at line ${line}: ${part}`);
      continue;
    }

    const key = part.slice(0, separator);
    let value = part.slice(separator + 1);
    value = value.replace(/^["']|["']$/g, "");

    if (key === "layout") {
      if (VALID_LAYOUTS.has(value)) {
        meta.layout = value;
      } else {
        warnings.push(`Unknown layout at line ${line}: ${value}`);
      }
      continue;
    }

    if (key === "class") {
      if (VALID_CLASSES.has(value)) {
        meta.class = value;
      } else {
        warnings.push(`Unknown class at line ${line}: ${value}`);
      }
      continue;
    }

    if (key === "fit") {
      if (VALID_FITS.has(value)) {
        meta.fit = value;
      } else {
        warnings.push(`Unknown fit mode at line ${line}: ${value}`);
      }
      continue;
    }

    if (key === "size") {
      if (VALID_SIZES.has(value)) {
        meta.size = value;
      } else {
        warnings.push(`Unknown size at line ${line}: ${value}`);
      }
      continue;
    }

    if (key === "title") {
      meta.title = value;
      continue;
    }

    if (key === "hidden") {
      if (VALID_BOOLEAN_VALUES.has(value)) {
        meta.hidden = value === "true";
      } else {
        warnings.push(`Unknown hidden value at line ${line}: ${value}`);
      }
      continue;
    }

    warnings.push(`Unknown slide directive key at line ${line}: ${key}`);
  }

  return { breakSlide, meta };
}

function hasBody(slide) {
  return slide.bodyLines.some((line) => line.trim().length > 0);
}

function estimateOverflow(slide) {
  if (slide.fit !== "shrink") {
    return false;
  }

  const markdown = slide.bodyLines.join("\n");
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  const mediaCount = (markdown.match(/!\[[^\]]*]\([^)]+\)|<(?:img|video)\b/gi) ?? []).length;
  const tableRows = markdown.split(/\r?\n/).filter((line) => /^\s*\|.*\|\s*$/.test(line)).length;
  const listItems = markdown.split(/\r?\n/).filter((line) => /^\s*[-*+]\s+/.test(line)).length;

  return plainText.length > 1500 || mediaCount > 3 || tableRows > 9 || listItems > 12;
}

function renderSlide(slide, index, warnings) {
  const markdown = slide.bodyLines.join("\n").trim();

  if (estimateOverflow(slide)) {
    warnings.push(
      `Possible overflow on slide ${index + 1} near line ${slide.line}: "${slide.title || "Untitled"}"`
    );
  }

  return {
    id: `slide-${index + 1}`,
    index,
    title: slide.title,
    layout: slide.layout,
    theme: slide.theme,
    fit: slide.fit,
    size: slide.size,
    sourceLine: slide.line,
    markdown,
    html: markdown ? md.render(markdown) : ""
  };
}

export function parseDeck(markdown, options = {}) {
  const warnings = [];
  const { lines, lineOffset, settings } = parseFrontmatter(markdown, warnings);
  const slides = [];
  let current = null;
  let inFence = false;
  let fenceMarker = "";

  function finishCurrent() {
    if (!current) {
      return;
    }

    slides.push(current);
  }

  function applyMeta(slide, meta) {
    if (meta.layout) {
      slide.layout = meta.layout;
    }
    if (meta.class) {
      slide.theme = meta.class;
    }
    if (meta.fit) {
      slide.fit = meta.fit;
    }
    if (meta.size) {
      slide.size = meta.size;
    }
    if (meta.title) {
      slide.title = meta.title;
    }
    if (typeof meta.hidden === "boolean") {
      slide.hidden = meta.hidden;
    }
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1 + lineOffset;
    const fenceMatch = line.match(/^(```+|~~~+)/);

    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }
    }

    const directive = !inFence && line.match(/^\s*<!--\s*slide:\s*(.*?)\s*-->\s*$/);
    if (directive) {
      if (!current) {
        current = createSlide({ line: lineNumber });
      }

      const { breakSlide, meta } = parseDirective(directive[1], lineNumber, warnings);
      const shouldBreak = breakSlide && hasBody(current);

      if (shouldBreak) {
        const inheritedTitle = current.title;
        finishCurrent();
        current = createSlide({
          title: meta.title ?? inheritedTitle,
          line: lineNumber,
          meta
        });
      } else {
        applyMeta(current, meta);
      }
      return;
    }

    const heading = !inFence && line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading && heading[1].length <= 2) {
      finishCurrent();
      current = createSlide({
        title: cleanHeadingText(heading[2]),
        line: lineNumber
      });
      return;
    }

    if (!current) {
      if (line.trim() === "") {
        return;
      }
      current = createSlide({ line: lineNumber });
    }

    current.bodyLines.push(line);
  });

  finishCurrent();

  const visibleSlides = slides.filter((slide) => !slide.hidden);
  const renderedSlides = visibleSlides.map((slide, index) => renderSlide(slide, index, warnings));

  return {
    sourcePath: options.sourcePath ?? "",
    settings,
    slideCount: renderedSlides.length,
    slides: renderedSlides,
    warnings
  };
}
