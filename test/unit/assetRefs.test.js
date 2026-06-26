import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  collectAssetRefs,
  collectLocalAssetRefs,
  copyReferencedAssets,
  normalizeAssetPath,
  rewriteAssetRefs,
  validateAssets
} from "../../src/node/assetRefs.js";

test("collectAssetRefs finds markdown and html media sources", () => {
  const refs = collectAssetRefs(`
![A](media/a.png)
<img src="media/b.png">
<video src='media/c.mp4'></video>
<source src="media/d.webm">
![Remote](https://example.com/x.png)
`);

  assert.deepEqual(
    refs.map((ref) => ref.src),
    ["media/a.png", "media/b.png", "media/c.mp4", "media/d.webm", "https://example.com/x.png"]
  );
});

test("local asset refs normalize spaces, wrappers, query, hash, and windows separators", () => {
  const refs = collectLocalAssetRefs(`
![A](<media/space file.png?cache=1#v>)
![B](.\\media\\b.png)
![Remote](https://example.com/x.png)
`);

  assert.deepEqual(
    refs.map((ref) => ref.normalizedPath),
    ["media/space file.png", "media/b.png"]
  );
});

test("normalizeAssetPath decodes and strips url fragments", () => {
  assert.equal(normalizeAssetPath("<./media/space%20file.png#hash>"), "media/space file.png");
});

test("validateAssets reports missing local files and ignores remote urls", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "md2slides-assets-"));
  fs.mkdirSync(path.join(tempDir, "media"));
  fs.writeFileSync(path.join(tempDir, "media", "exists.png"), "");

  const warnings = validateAssets(
    `
![Exists](media/exists.png)
![Missing](media/missing.png)
![Remote](https://example.com/remote.png)
`,
    tempDir
  );

  assert.deepEqual(warnings, ["Missing asset at line 3: media/missing.png"]);
});

test("copyReferencedAssets copies each referenced local asset once", () => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "md2slides-source-"));
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "md2slides-out-"));
  fs.mkdirSync(path.join(sourceDir, "media"));
  fs.writeFileSync(path.join(sourceDir, "media", "exists.svg"), "<svg></svg>");

  const copied = copyReferencedAssets(
    `
![One](media/exists.svg)
<img src="media/exists.svg">
`,
    sourceDir,
    outDir
  );

  assert.equal(copied.length, 1);
  assert.equal(fs.existsSync(path.join(outDir, "media", "exists.svg")), true);
});

test("rewriteAssetRefs updates local and remote refs according to callback", () => {
  const rewritten = rewriteAssetRefs(
    `
![A](media/a.png)
<img src="https://example.com/b.png">
`,
    (src) => (src.startsWith("http") ? "" : `/assets/${src}`)
  );

  assert.match(rewritten, /!\[A]\(\/assets\/media\/a\.png\)/);
  assert.match(rewritten, /https:\/\/example\.com\/b\.png/);
});
