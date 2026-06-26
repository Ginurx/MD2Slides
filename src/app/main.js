import deck from "virtual:slides-data";
import "./styles.css";

const app = document.querySelector("#app");
const DEFAULT_FONT = "system";
const DEFAULT_THEME = "auto";
const THEME_PRESETS = {
  auto: "Auto",
  light: "Light",
  dark: "Dark",
  accent: "Accent"
};
const FONT_PRESETS = {
  system: {
    label: "System",
    family: 'Inter, "Segoe UI", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif'
  },
  "cn-sans": {
    label: "CN Sans",
    family: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Segoe UI", Arial, sans-serif'
  },
  serif: {
    label: "Serif",
    family: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, Georgia, serif'
  },
  mono: {
    label: "Mono",
    family: '"Cascadia Code", "JetBrains Mono", Consolas, "Noto Sans Mono CJK SC", monospace'
  }
};
const state = {
  index: 0,
  overview: false,
  theme: DEFAULT_THEME,
  font: DEFAULT_FONT,
  fontFamily: ""
};
let deckSnapFrame = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getInitialIndex() {
  const match = window.location.hash.match(/slide-(\d+)/);
  if (!match) {
    return 0;
  }
  return clamp(Number(match[1]) - 1, 0, deck.slides.length - 1);
}

function sanitizeFontFamily(value) {
  return String(value ?? "").trim();
}

function getPresetFont(font) {
  return Object.hasOwn(FONT_PRESETS, font) ? font : DEFAULT_FONT;
}

function getPresetTheme(theme) {
  return Object.hasOwn(THEME_PRESETS, theme) ? theme : DEFAULT_THEME;
}

function getUrlThemeChoice() {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme");

  return theme ? getPresetTheme(theme) : DEFAULT_THEME;
}

function getDeckFontChoice() {
  const settings = deck.settings ?? {};
  const fontFamily = sanitizeFontFamily(settings.fontFamily);

  if (fontFamily) {
    return {
      font: DEFAULT_FONT,
      fontFamily
    };
  }

  return {
    font: getPresetFont(settings.font),
    fontFamily: ""
  };
}

function getUrlFontChoice() {
  const params = new URLSearchParams(window.location.search);
  const fontFamily = sanitizeFontFamily(params.get("fontFamily"));

  if (fontFamily) {
    return {
      font: DEFAULT_FONT,
      fontFamily
    };
  }

  const font = params.get("font");
  if (font && Object.hasOwn(FONT_PRESETS, font)) {
    return {
      font,
      fontFamily: ""
    };
  }

  return null;
}

function getInitialFontChoice() {
  return getUrlFontChoice() ?? getDeckFontChoice();
}

function getFontFamily(choice) {
  return choice.fontFamily || FONT_PRESETS[getPresetFont(choice.font)].family;
}

function getSlideHash() {
  return `#slide-${state.index + 1}`;
}

function replaceUrl({ search = window.location.search, hash = window.location.hash || getSlideHash() } = {}) {
  window.history.replaceState(null, "", `${window.location.pathname}${search}${hash}`);
}

function writeFontUrl(choice) {
  const url = new URL(window.location.href);

  if (choice.fontFamily) {
    url.searchParams.delete("font");
    url.searchParams.set("fontFamily", choice.fontFamily);
  } else {
    url.searchParams.delete("fontFamily");
    url.searchParams.set("font", getPresetFont(choice.font));
  }

  replaceUrl({
    search: url.search,
    hash: window.location.hash || getSlideHash()
  });
}

function clearFontUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("font");
  url.searchParams.delete("fontFamily");
  replaceUrl({
    search: url.search,
    hash: window.location.hash || getSlideHash()
  });
}

function writeThemeUrl(theme) {
  const url = new URL(window.location.href);
  const preset = getPresetTheme(theme);

  if (preset === DEFAULT_THEME) {
    url.searchParams.delete("theme");
  } else {
    url.searchParams.set("theme", preset);
  }

  replaceUrl({
    search: url.search,
    hash: window.location.hash || getSlideHash()
  });
}

function syncThemeControls() {
  const preset = document.querySelector(".theme-preset");

  if (preset) {
    preset.value = state.theme;
  }
}

function applyThemeChoice(theme, { updateUrl = false } = {}) {
  state.theme = getPresetTheme(theme);

  for (const preset of Object.keys(THEME_PRESETS)) {
    if (preset !== DEFAULT_THEME) {
      document.body.classList.toggle(`theme-override-${preset}`, state.theme === preset);
    }
  }

  syncThemeControls();

  if (updateUrl) {
    writeThemeUrl(state.theme);
  }
}

function syncFontControls() {
  const preset = document.querySelector(".font-preset");
  const custom = document.querySelector(".font-custom");

  if (preset) {
    preset.value = state.fontFamily ? DEFAULT_FONT : state.font;
  }

  if (custom) {
    custom.value = state.fontFamily;
  }
}

function applyFontChoice(choice, { updateUrl = false } = {}) {
  state.font = getPresetFont(choice.font);
  state.fontFamily = sanitizeFontFamily(choice.fontFamily);
  document.documentElement.style.setProperty(
    "--deck-font-family",
    getFontFamily({
      font: state.font,
      fontFamily: state.fontFamily
    })
  );
  syncFontControls();

  if (updateUrl) {
    writeFontUrl({
      font: state.font,
      fontFamily: state.fontFamily
    });
  }

  const activeSlide = document.querySelector(".slide.is-active");
  if (activeSlide) {
    shrinkToFit(activeSlide);
    document.fonts?.ready.then(() => shrinkToFit(activeSlide));
  }
}

function setFontPanelOpen(open) {
  const panel = document.querySelector(".font-panel");
  const toggle = document.querySelector(".font-toggle");

  if (!panel || !toggle) {
    return;
  }

  panel.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));

  if (open) {
    setThemePanelOpen(false);
  }
}

function isFontPanelOpen() {
  return document.querySelector(".font-panel")?.hidden === false;
}

function setThemePanelOpen(open) {
  const panel = document.querySelector(".theme-panel");
  const toggle = document.querySelector(".theme-toggle");

  if (!panel || !toggle) {
    return;
  }

  panel.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));

  if (open) {
    setFontPanelOpen(false);
  }
}

function isThemePanelOpen() {
  return document.querySelector(".theme-panel")?.hidden === false;
}

function firstMediaElement(content) {
  return content.querySelector("img, video");
}

function prepareMediaElement(media) {
  if (media.tagName.toLowerCase() !== "video") {
    return;
  }

  media.controls = true;

  if (!media.hasAttribute("preload")) {
    media.setAttribute("preload", "metadata");
  }

  if (!media.hasAttribute("playsinline")) {
    media.setAttribute("playsinline", "");
  }
}

function isEmptyElement(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  return (
    node.textContent.trim() === "" &&
    !node.querySelector("img, video, iframe, object, embed, svg, canvas, table, pre, ul, ol, blockquote")
  );
}

function hasMeaningfulContent(content) {
  return Array.from(content.childNodes).some((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim() !== "";
    }

    return node.nodeType === Node.ELEMENT_NODE && !isEmptyElement(node);
  });
}

function createMediaPane(content) {
  const media = firstMediaElement(content);
  if (!media) {
    return null;
  }

  prepareMediaElement(media);

  const mediaParent = media.parentElement;
  const pane = document.createElement("div");
  pane.className = "media-pane";
  if (media.tagName.toLowerCase() === "video") {
    pane.classList.add("has-video");
  }
  mediaParent?.removeChild(media);
  if (mediaParent && isEmptyElement(mediaParent)) {
    mediaParent.remove();
  }
  pane.append(media);
  return pane;
}

function applyFullMediaLayout(content, pane) {
  const caption = document.createElement("div");
  caption.className = "full-caption";
  while (content.firstChild) {
    caption.append(content.firstChild);
  }

  content.classList.add("full-media");
  content.append(pane);
  if (hasMeaningfulContent(caption)) {
    content.append(caption);
  }
}

function splitContent(content) {
  const children = Array.from(content.childNodes).filter((node) => {
    return node.nodeType !== Node.TEXT_NODE || node.textContent.trim() !== "";
  });

  const left = document.createElement("div");
  const right = document.createElement("div");
  left.className = "column";
  right.className = "column";

  const dividerIndex = children.findIndex((child) => {
    return child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "hr";
  });

  if (dividerIndex !== -1) {
    children.forEach((child, index) => {
      if (index === dividerIndex) {
        child.remove();
        return;
      }

      (index < dividerIndex ? left : right).append(child);
    });

    return [left, right];
  }

  const midpoint = Math.ceil(children.length / 2);

  children.forEach((child, index) => {
    (index < midpoint ? left : right).append(child);
  });

  return [left, right];
}

function renderTitle(titleElement, titleText) {
  const parts = String(titleText).split(/<br\s*\/?>/i);
  titleElement.replaceChildren();

  parts.forEach((part, index) => {
    if (index > 0) {
      titleElement.append(document.createElement("br"));
    }
    titleElement.append(document.createTextNode(part));
  });
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function applyLayout(slideElement, slide) {
  const content = slideElement.querySelector(".slide-content");

  if (["image-left", "image-right", "media"].includes(slide.layout)) {
    const pane = createMediaPane(content);
    if (!pane) {
      return;
    }

    if (slide.layout === "media" && !hasMeaningfulContent(content)) {
      applyFullMediaLayout(content, pane);
      return;
    }

    const textPane = document.createElement("div");
    textPane.className = "text-pane";
    while (content.firstChild) {
      textPane.append(content.firstChild);
    }

    content.classList.add("split");
    if (slide.layout === "image-left" || slide.layout === "media") {
      content.append(pane, textPane);
    } else {
      content.append(textPane, pane);
    }
    return;
  }

  if (slide.layout === "image-full") {
    const pane = createMediaPane(content);
    if (!pane) {
      return;
    }

    applyFullMediaLayout(content, pane);
    return;
  }

  if (slide.layout === "two-col") {
    content.classList.add("columns");
    const [left, right] = splitContent(content);
    content.replaceChildren(left, right);
    return;
  }

  if (slide.layout === "compare") {
    content.classList.add("compare");
  }

  if (slide.layout === "quote") {
    content.classList.add("quote");
  }
}

function shrinkToFit(slideElement) {
  if (!slideElement.classList.contains("fit-shrink")) {
    return;
  }

  const stage = slideElement.querySelector(".slide-stage");
  const body = slideElement.querySelector(".slide-body");
  const minScale = 0.72;
  let scale = 1;

  slideElement.classList.remove("is-overflowing");
  body.style.setProperty("--content-scale", scale);

  while (
    scale > minScale &&
    (body.scrollHeight > stage.clientHeight || body.scrollWidth > stage.clientWidth)
  ) {
    scale -= 0.04;
    body.style.setProperty("--content-scale", scale.toFixed(2));
  }

  if (body.scrollHeight > stage.clientHeight || body.scrollWidth > stage.clientWidth) {
    slideElement.classList.add("is-overflowing");
  }
}

function renderSlide(slide) {
  const section = document.createElement("section");
  section.className = `slide theme-${slide.theme} layout-${slide.layout} fit-${slide.fit} size-${slide.size}`;
  section.id = slide.id;
  section.dataset.index = slide.index + 1;

  const stage = document.createElement("div");
  stage.className = "slide-stage";

  const body = document.createElement("article");
  body.className = "slide-body";

  const title = document.createElement("h1");
  title.className = "slide-title";
  renderTitle(title, slide.title);

  const content = document.createElement("div");
  content.className = "slide-content";
  content.innerHTML = slide.html;

  body.append(title, content);
  stage.append(body);
  section.append(stage);
  applyLayout(section, slide);

  return section;
}

function updateStatus() {
  const current = deck.slides[state.index];
  document.querySelector(".progress-fill").style.width = `${((state.index + 1) / deck.slides.length) * 100}%`;
  document.querySelector(".page-input").value = state.index + 1;
  document.querySelector(".source-line").textContent = `line ${current.sourceLine}`;
}

function jumpFromProgress(event) {
  if (event.detail === 0) {
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const targetIndex = clamp(Math.floor(ratio * deck.slides.length), 0, deck.slides.length - 1);
  showSlide(targetIndex);
}

function resetPageInput() {
  document.querySelector(".page-input").value = state.index + 1;
}

function hasWindowFocus() {
  return typeof document.hasFocus === "function" ? document.hasFocus() : true;
}

function shouldDisableSlideTransition() {
  return document.visibilityState === "hidden" || !hasWindowFocus();
}

function clearDeckSnapFrame() {
  if (!deckSnapFrame) {
    return;
  }

  cancelAnimationFrame(deckSnapFrame);
  deckSnapFrame = 0;
}

function restoreDeckTransition(deckElement) {
  clearDeckSnapFrame();
  deckSnapFrame = requestAnimationFrame(() => {
    deckSnapFrame = requestAnimationFrame(() => {
      deckElement.classList.remove("is-snapping");
      deckSnapFrame = 0;
    });
  });
}

function snapDeckToActiveSlide({ restoreTransition = false } = {}) {
  const deckElement = document.querySelector(".deck");

  if (!deckElement) {
    return;
  }

  if (state.overview) {
    if (restoreTransition && !shouldDisableSlideTransition()) {
      restoreDeckTransition(deckElement);
    }
    return;
  }

  clearDeckSnapFrame();
  deckElement.classList.add("is-snapping");
  document.documentElement.style.setProperty("--active-slide", state.index);
  deckElement.getBoundingClientRect();

  if (restoreTransition && !shouldDisableSlideTransition()) {
    restoreDeckTransition(deckElement);
  }
}

function commitPageInput() {
  const input = document.querySelector(".page-input");
  const rawValue = input.value.trim();
  const pageNumber = Number(rawValue);

  if (!rawValue || !Number.isFinite(pageNumber)) {
    resetPageInput();
    return;
  }

  showSlide(clamp(Math.trunc(pageNumber), 1, deck.slides.length) - 1);
}

function showSlide(nextIndex, { pushHash = true } = {}) {
  if (shouldDisableSlideTransition()) {
    snapDeckToActiveSlide();
  }

  state.index = clamp(nextIndex, 0, deck.slides.length - 1);
  document.documentElement.style.setProperty("--active-slide", state.index);

  for (const slide of document.querySelectorAll(".slide")) {
    slide.classList.toggle("is-active", Number(slide.dataset.index) === state.index + 1);
  }

  if (pushHash) {
    replaceUrl({ hash: getSlideHash() });
  }

  updateStatus();
  shrinkToFit(document.querySelector(".slide.is-active"));

  if (shouldDisableSlideTransition()) {
    snapDeckToActiveSlide();
  }
}

function setOverview(enabled) {
  state.overview = enabled;
  document.body.classList.toggle("overview", enabled);
}

function go(delta) {
  if (state.overview) {
    setOverview(false);
  }
  showSlide(state.index + delta);
}

function bindControls() {
  document.addEventListener("keydown", (event) => {
    if (event.target.closest(".page-input")) {
      return;
    }

    if (event.target.closest(".font-panel") || event.target.closest(".theme-panel")) {
      if (event.key === "Escape") {
        setFontPanelOpen(false);
        setThemePanelOpen(false);
      }
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (["ArrowRight", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      go(1);
    }

    if (["ArrowLeft", "PageUp", "Backspace"].includes(event.key)) {
      event.preventDefault();
      go(-1);
    }

    if (event.key === "Home") {
      showSlide(0);
    }

    if (event.key === "End") {
      showSlide(deck.slides.length - 1);
    }

    if (event.key.toLowerCase() === "o") {
      setOverview(!state.overview);
    }

    if (event.key.toLowerCase() === "f") {
      document.documentElement.requestFullscreen?.();
    }

    if (event.key === "Escape") {
      setFontPanelOpen(false);
      setThemePanelOpen(false);
      setOverview(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (isFontPanelOpen() && !event.target.closest(".font-panel") && !event.target.closest(".font-toggle")) {
      setFontPanelOpen(false);
    }

    if (isThemePanelOpen() && !event.target.closest(".theme-panel") && !event.target.closest(".theme-toggle")) {
      setThemePanelOpen(false);
    }
  });

  window.addEventListener("hashchange", () => {
    showSlide(getInitialIndex(), { pushHash: false });
  });

  window.addEventListener("resize", () => {
    shrinkToFit(document.querySelector(".slide.is-active"));
  });

  window.addEventListener("blur", () => {
    snapDeckToActiveSlide();
  });

  window.addEventListener("focus", () => {
    snapDeckToActiveSlide({ restoreTransition: true });
  });

  document.addEventListener("visibilitychange", () => {
    snapDeckToActiveSlide({ restoreTransition: document.visibilityState === "visible" });
  });

  document.querySelector(".deck").addEventListener("click", (event) => {
    const slide = event.target.closest(".slide");
    if (!slide) {
      return;
    }

    if (state.overview) {
      setOverview(false);
      showSlide(Number(slide.dataset.index) - 1);
    }
  });
}

function render() {
  state.index = getInitialIndex();
  const deckTitle = deck.title || "MD2Slides";
  document.title = deckTitle;
  const themeOptions = Object.entries(THEME_PRESETS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
  const fontOptions = Object.entries(FONT_PRESETS)
    .map(([value, preset]) => `<option value="${value}">${preset.label}</option>`)
    .join("");

  app.innerHTML = `
    <main class="deck-shell">
      <div class="deck" aria-label="${escapeAttribute(deckTitle)} slides"></div>
      <footer class="hud">
        <button class="progress" type="button" aria-label="Jump to slide by progress" title="Jump to slide">
          <span class="progress-fill"></span>
        </button>
        <button class="icon-button prev" type="button" aria-label="Previous slide" title="Previous slide">&lt;</button>
        <label class="counter" aria-label="Current slide">
          <input class="page-input" type="number" min="1" max="${deck.slides.length}" inputmode="numeric">
          <span class="page-total">/ ${deck.slides.length}</span>
        </label>
        <button class="icon-button next" type="button" aria-label="Next slide" title="Next slide">&gt;</button>
        <button class="icon-button theme-toggle" type="button" aria-label="Theme" title="Theme" aria-expanded="false">Th</button>
        <div class="theme-panel" hidden>
          <label class="font-field">
            <span>Theme</span>
            <select class="theme-preset">${themeOptions}</select>
          </label>
        </div>
        <button class="icon-button font-toggle" type="button" aria-label="Font" title="Font" aria-expanded="false">Aa</button>
        <div class="font-panel" hidden>
          <label class="font-field">
            <span>Preset</span>
            <select class="font-preset">${fontOptions}</select>
          </label>
          <label class="font-field">
            <span>Custom</span>
            <input class="font-custom" type="text" spellcheck="false" placeholder='"LXGW WenKai", sans-serif'>
          </label>
          <div class="font-actions">
            <button class="font-apply" type="button">Apply</button>
            <button class="font-reset" type="button">Reset</button>
          </div>
        </div>
        <button class="icon-button overview-toggle" type="button" aria-label="Toggle overview" title="Toggle overview">O</button>
        <button class="icon-button fullscreen" type="button" aria-label="Fullscreen" title="Fullscreen">F</button>
        <span class="keyboard-hint">Left/Right - Home/End</span>
        <span class="source-line"></span>
      </footer>
    </main>
  `;

  const deckElement = document.querySelector(".deck");
  deckElement.append(...deck.slides.map(renderSlide));

  document.querySelector(".prev").addEventListener("click", () => go(-1));
  document.querySelector(".next").addEventListener("click", () => go(1));
  document.querySelector(".progress").addEventListener("click", jumpFromProgress);
  document.querySelector(".page-input").addEventListener("change", commitPageInput);
  document.querySelector(".page-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitPageInput();
      event.currentTarget.blur();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      resetPageInput();
      event.currentTarget.blur();
    }
  });
  document.querySelector(".font-toggle").addEventListener("click", () => {
    setFontPanelOpen(!isFontPanelOpen());
  });
  document.querySelector(".theme-toggle").addEventListener("click", () => {
    setThemePanelOpen(!isThemePanelOpen());
  });
  document.querySelector(".theme-preset").addEventListener("change", (event) => {
    applyThemeChoice(event.target.value, { updateUrl: true });
  });
  document.querySelector(".font-preset").addEventListener("change", (event) => {
    applyFontChoice(
      {
        font: event.target.value,
        fontFamily: ""
      },
      { updateUrl: true }
    );
  });
  document.querySelector(".font-apply").addEventListener("click", () => {
    const fontFamily = sanitizeFontFamily(document.querySelector(".font-custom").value);
    const font = document.querySelector(".font-preset").value;
    applyFontChoice({ font, fontFamily }, { updateUrl: true });
  });
  document.querySelector(".font-custom").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      document.querySelector(".font-apply").click();
    }
  });
  document.querySelector(".font-reset").addEventListener("click", () => {
    clearFontUrl();
    applyFontChoice(getDeckFontChoice());
  });
  document.querySelector(".overview-toggle").addEventListener("click", () => setOverview(!state.overview));
  document.querySelector(".fullscreen").addEventListener("click", () => document.documentElement.requestFullscreen?.());

  bindControls();
  applyThemeChoice(getUrlThemeChoice());
  applyFontChoice(getInitialFontChoice());
  showSlide(state.index, { pushHash: false });

  if (deck.warnings?.length) {
    console.groupCollapsed(`Slides generated with ${deck.warnings.length} warning(s)`);
    deck.warnings.forEach((warning) => console.warn(warning));
    console.groupEnd();
  }
}

render();

