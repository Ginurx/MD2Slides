---
font: cn-sans
---

# Default

The default layout keeps the title on top and puts Markdown content in one readable column.

- Good for agenda pages, explanations, and normal narrative slides.
- Supports paragraphs, lists, quotes, code blocks, tables, images, and videos.

## Cover

<!-- slide: layout=cover title="Layout<br>Gallery" -->

Section opener / talk title / chapter divider

## Image Left

<!-- slide: layout=image-left -->

![Example visual](media/pattern.svg)

- Media appears on the left.
- Text remains on the right.
- Good for screenshot-led explanations.

## Image Right

<!-- slide: layout=image-right -->

![Example visual](media/pattern.svg)

- Text remains on the left.
- Media appears on the right.
- Good for case studies and product walkthroughs.

## Image Full

<!-- slide: layout=image-full -->

![Example visual](media/pattern.svg)

Caption text can sit over the media area when the slide needs one dominant visual.

## Full

<!-- slide: layout=full -->

![Full-page visual](media/pattern.svg)

## Two Columns

<!-- slide: layout=two-col -->

**Context**

- Problem
- Constraint
- Observation

---

**Decision**

- Approach
- Tradeoff
- Result

## Media

<!-- slide: layout=media -->

![Media-first visual](media/pattern.svg)

## Quote

<!-- slide: layout=quote class=accent -->

Markdown should stay easy to write. Presentation controls should stay predictable.

## Compare

<!-- slide: layout=compare -->

| Dimension | Before | After |
| --- | --- | --- |
| Input | Fixed file name | Any Markdown file |
| Assets | Fixed directory | Relative to deck |
| Tests | Parser only | Parser + browser checks |
