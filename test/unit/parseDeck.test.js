import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseDeck } from "../../src/core/parseDeck.js";

test("# and ## headings start slides, ### stays in the body", () => {
  const deck = parseDeck(`# One
body
### Detail
more
## Two
next
`);

  assert.equal(deck.slideCount, 2);
  assert.equal(deck.slides[0].title, "One");
  assert.match(deck.slides[0].markdown, /### Detail/);
  assert.equal(deck.slides[1].title, "Two");
});

test("frontmatter configures deck settings without creating a slide", () => {
  const deck = parseDeck(`---
font: serif
fontFamily: '"LXGW WenKai", "Noto Sans SC", sans-serif'
---

# One
body
`);

  assert.equal(deck.slideCount, 1);
  assert.equal(deck.settings.font, "serif");
  assert.equal(deck.settings.fontFamily, '"LXGW WenKai", "Noto Sans SC", sans-serif');
  assert.equal(deck.slides[0].sourceLine, 6);
});

test("deck settings default when frontmatter is absent", () => {
  const deck = parseDeck(`# One
body
`);

  assert.deepEqual(deck.settings, {
    font: "system",
    fontFamily: ""
  });
});

test("slide directive applies supported metadata", () => {
  const deck = parseDeck(`# One
<!-- slide: layout=image-right class=dark fit=scroll size=xl title="Custom Title" -->
![alt](x.png)
text
`);

  assert.equal(deck.slides[0].title, "Custom Title");
  assert.equal(deck.slides[0].layout, "image-right");
  assert.equal(deck.slides[0].theme, "dark");
  assert.equal(deck.slides[0].fit, "scroll");
  assert.equal(deck.slides[0].size, "xl");
});

test("layout variants used by examples are accepted", () => {
  const deck = parseDeck(readFileSync("examples/layouts.md", "utf8"));
  const layouts = new Set(deck.slides.map((slide) => slide.layout));

  for (const layout of ["cover", "image-right", "two-col", "compare", "full", "media", "quote"]) {
    assert.equal(layouts.has(layout), true, `${layout} should be present`);
  }
  assert.equal(deck.warnings.length, 0);
});

test("break directive creates an extra slide inside the current heading", () => {
  const deck = parseDeck(`# One
first page
<!-- slide: break layout=quote -->
second page
`);

  assert.equal(deck.slideCount, 2);
  assert.equal(deck.slides[0].title, "One");
  assert.equal(deck.slides[1].title, "One");
  assert.equal(deck.slides[1].layout, "quote");
});

test("hidden directive excludes slides from the rendered deck", () => {
  const deck = parseDeck(`# One
visible
## Hidden
<!-- slide: hidden -->
draft
## Two
<!-- slide: hidden=false -->
visible again
`);

  assert.equal(deck.slideCount, 2);
  assert.equal(deck.slides[0].title, "One");
  assert.equal(deck.slides[1].title, "Two");
  assert.doesNotMatch(deck.slides.map((slide) => slide.markdown).join("\n"), /draft/);
});

test("slide directives inside fenced code are preserved as markdown content", () => {
  const deck = parseDeck(`# One
\`\`\`md
<!-- slide: break layout=quote -->
\`\`\`
`);

  assert.equal(deck.slideCount, 1);
  assert.match(deck.slides[0].markdown, /slide: break/);
});

test("unknown directive values produce warnings and keep defaults", () => {
  const deck = parseDeck(`# One
<!-- slide: layout=unknown class=neon fit=grow size=giant hidden=maybe flavor=vanilla -->
body
`);

  assert.equal(deck.slides[0].layout, "default");
  assert.equal(deck.slides[0].theme, "light");
  assert.equal(deck.slides[0].fit, "shrink");
  assert.equal(deck.slides[0].size, "normal");
  assert.match(deck.warnings.join("\n"), /Unknown layout/);
  assert.match(deck.warnings.join("\n"), /Unknown class/);
  assert.match(deck.warnings.join("\n"), /Unknown fit mode/);
  assert.match(deck.warnings.join("\n"), /Unknown size/);
  assert.match(deck.warnings.join("\n"), /Unknown hidden value/);
  assert.match(deck.warnings.join("\n"), /Unknown slide directive key/);
});

test("overflow warning is emitted for dense shrink content", () => {
  const deck = parseDeck(readFileSync("test/fixtures/overflow.md", "utf8"));

  assert.match(deck.warnings.join("\n"), /Possible overflow/);
});

test("UTF-8 content, br title markers, and custom font frontmatter parse cleanly", () => {
  const deck = parseDeck(readFileSync("test/fixtures/unicode.md", "utf8"));

  assert.equal(deck.slideCount, 2);
  assert.equal(deck.slides[0].title, "中文标题 <br>English Title");
  assert.equal(deck.settings.fontFamily, '"Noto Serif SC", serif');
});
