---
font: system
---

# Getting Started with MD2Slides

Write ordinary Markdown first. Add one-line layout directives only when a slide needs a different structure.

## Minimal Syntax

A heading plus a paragraph is enough to make a clear slide.

```md
# My Topic

Write what this slide needs to say.
```

## Automatic Slide Breaks

`#` and `##` headings automatically start new slides.

- Use `#` for the deck title or major sections.
- Use `##` for normal slide titles.
- Organize content first; layout can come later.

## In-Slide Headings

### This Line Does Not Start a New Slide

`###` stays inside the current slide, so it works well for small sections within one slide.

The following paragraph still belongs to this slide.

## Lists and Steps

Use bullet lists for points and numbered lists for procedures.

- Start with the main idea.
- Add supporting examples.
- Preview the result.

1. Open the Markdown file.
2. Save your changes.
3. Check the slides in the browser.

## Quotes and Emphasis

Quotes are useful for sentences that should stand out.

> Clear content makes slide design easier.

Regular paragraphs can continue after a quote.

## Tables

Tables work well for compact comparisons.

| Markdown | Slide Result |
| --- | --- |
| `# Title` | Starts a new slide |
| `## Title` | Starts a new slide |
| `### Title` | Adds an in-slide heading |

## Code Blocks

Code blocks keep their original formatting, which makes them useful for commands, configuration, and examples.

```powershell
npm run dev -- examples/tutorial.md
```

```js
const title = "Plain Markdown";
console.log(title);
```

## Images

Standard Markdown images render directly in slides.

![Example visual](media/pattern.svg)

Image paths are resolved relative to the current Markdown file.

## Layout Examples

The previous slides used the default layout.

To change the structure, add a comment directive below the slide heading:

```md
<!-- slide: layout=image-right -->
```

The next slides demonstrate several layouts directly.

## Cover Slide

<!-- slide: layout=cover title="Cover<br>Slide" -->

Good for course openings, chapter breaks, and major topic changes.

## Image Right

<!-- slide: layout=image-right -->

![Example visual](media/pattern.svg)

- Image on the right
- Text on the left
- Useful for screenshots, workflows, and case studies

## Two Columns

<!-- slide: layout=two-col -->

**Left: Problem**

- Scattered content
- Unclear order
- Hidden emphasis

---

**Right: Approach**

- Split related ideas
- Compare side by side
- Explain one relationship per slide

## Quote Layout

<!-- slide: layout=quote class=accent -->

> A good slide helps the audience understand first, then remember.

## Compare Layout

<!-- slide: layout=compare -->

| Scenario | Basic Markdown | Recommended Layout |
| --- | --- | --- |
| Explanation | Title + paragraph | `default` |
| Screenshot walkthrough | Image + bullets | `image-right` |
| Before and after | Table | `compare` |

## Full Media

<!-- slide: layout=full -->

![Example visual](media/pattern.svg)

## Preview Workflow

Start live preview while writing:

```powershell
npm run dev -- examples/tutorial.md
```

Build static files when the deck is ready:

```powershell
npm run build -- examples/tutorial.md
```

Now the Markdown file is a presentable, offline-friendly HTML slide deck.
