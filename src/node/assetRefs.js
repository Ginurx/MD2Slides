import fs from "node:fs";
import path from "node:path";

const REMOTE_ASSET_PATTERN = /^(?:https?:|data:|blob:)/i;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\(([^)]+)\)/g;
const HTML_MEDIA_PATTERN = /<(?:img|video|source)\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

export function isRemoteAsset(src) {
  return REMOTE_ASSET_PATTERN.test(src);
}

export function normalizeAssetPath(src) {
  const unwrapped = src.startsWith("<") && src.endsWith(">") ? src.slice(1, -1) : src;
  const cleaned = decodeURI(unwrapped)
    .replace(/^[.][/\\]/, "")
    .split("#")[0]
    .split("?")[0];

  return cleaned.replaceAll("\\", "/");
}

export function collectAssetRefs(markdown) {
  const refs = [];
  const lines = markdown.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const match of line.matchAll(MARKDOWN_IMAGE_PATTERN)) {
      refs.push({ src: match[1].trim(), line: index + 1, kind: "markdown" });
    }

    for (const match of line.matchAll(HTML_MEDIA_PATTERN)) {
      refs.push({ src: match[1].trim(), line: index + 1, kind: "html" });
    }
  });

  return refs;
}

export function collectLocalAssetRefs(markdown) {
  return collectAssetRefs(markdown)
    .filter((ref) => !isRemoteAsset(ref.src))
    .map((ref) => ({
      ...ref,
      normalizedPath: normalizeAssetPath(ref.src)
    }));
}

export function validateAssets(markdown, sourceDir) {
  return collectLocalAssetRefs(markdown).flatMap((ref) => {
    const absolutePath = path.resolve(sourceDir, ref.normalizedPath);

    if (fs.existsSync(absolutePath)) {
      return [];
    }

    return [`Missing asset at line ${ref.line}: ${ref.src}`];
  });
}

export function copyReferencedAssets(markdown, sourceDir, outDir) {
  const copied = [];
  const seen = new Set();

  for (const ref of collectLocalAssetRefs(markdown)) {
    if (seen.has(ref.normalizedPath)) {
      continue;
    }
    seen.add(ref.normalizedPath);

    const sourcePath = path.resolve(sourceDir, ref.normalizedPath);
    const targetPath = path.resolve(outDir, ref.normalizedPath);

    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const relativeTarget = path.relative(outDir, targetPath);
    if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    copied.push({ sourcePath, targetPath });
  }

  return copied;
}

export function rewriteAssetRefs(markdown, rewriter) {
  return markdown
    .replace(MARKDOWN_IMAGE_PATTERN, (match, rawSrc) => {
      const nextSrc = rewriter(rawSrc.trim());
      if (!nextSrc) {
        return match;
      }
      return match.replace(rawSrc, nextSrc);
    })
    .replace(HTML_MEDIA_PATTERN, (match, rawSrc) => {
      const nextSrc = rewriter(rawSrc.trim());
      if (!nextSrc) {
        return match;
      }
      return match.replace(rawSrc, nextSrc);
    });
}
