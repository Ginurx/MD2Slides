import fs from "node:fs";
import path from "node:path";
import { parseDeck } from "../core/parseDeck.js";
import { copyReferencedAssets, normalizeAssetPath, rewriteAssetRefs, validateAssets } from "./assetRefs.js";

const virtualModuleId = "virtual:slides-data";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const assetPrefix = "/@md2slides-assets/";
const assetContentTypes = new Map([
  [".apng", "image/apng"],
  [".avif", "image/avif"],
  [".gif", "image/gif"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".mp4", "video/mp4"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webm", "video/webm"],
  [".webp", "image/webp"]
]);

export function resolveDeckOptions({ rootDir, sourcePath, title, outDir }) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedSource = path.resolve(resolvedRoot, sourcePath || path.join("examples", "basic.md"));

  return {
    rootDir: resolvedRoot,
    sourcePath: resolvedSource,
    sourceDir: path.dirname(resolvedSource),
    title: title || "",
    outDir: outDir || "dist"
  };
}

function getDeckTitle(deck, explicitTitle) {
  return explicitTitle || deck.slides[0]?.title || "MD2Slides";
}

function encodeAssetUrl(src) {
  if (/^(?:https?:|data:|blob:)/i.test(src)) {
    return "";
  }

  return `${assetPrefix}${encodeURIComponent(normalizeAssetPath(src))}`;
}

function setHtmlTitle(outDir, title) {
  const indexPath = path.join(outDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    return;
  }

  const html = fs
    .readFileSync(indexPath, "utf8")
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<script\s+type="module"\s+crossorigin\s+src=/g, "<script defer src=")
    .replace(/\s+crossorigin(?=\s+href=)/g, "");

  fs.writeFileSync(indexPath, html);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function createSlidesPlugin(deckOptions) {
  let config;
  let server;
  let lastDeckTitle = deckOptions.title || "MD2Slides";

  function readMarkdown() {
    return fs.readFileSync(deckOptions.sourcePath, "utf8");
  }

  function loadDeck() {
    const markdown = readMarkdown();
    const renderMarkdown =
      config?.command === "serve" ? rewriteAssetRefs(markdown, (src) => encodeAssetUrl(src)) : markdown;
    const deck = parseDeck(renderMarkdown, { sourcePath: deckOptions.sourcePath });
    const assetWarnings = validateAssets(markdown, deckOptions.sourceDir);
    const warnings = [...deck.warnings, ...assetWarnings];
    lastDeckTitle = getDeckTitle(deck, deckOptions.title);

    for (const warning of warnings) {
      console.warn(`[slides] ${warning}`);
    }

    return {
      ...deck,
      sourcePath: deckOptions.sourcePath,
      title: lastDeckTitle,
      warnings,
      generatedAt: new Date().toISOString()
    };
  }

  function reloadDeck(changedPath) {
    const normalizedChangedPath = path.resolve(changedPath);
    if (
      normalizedChangedPath !== deckOptions.sourcePath &&
      !normalizedChangedPath.startsWith(`${deckOptions.sourceDir}${path.sep}`)
    ) {
      return;
    }

    const mod = server?.moduleGraph.getModuleById(resolvedVirtualModuleId);
    if (mod) {
      server.moduleGraph.invalidateModule(mod);
    }
    server?.ws.send({ type: "full-reload", path: "*" });
  }

  return {
    name: "md2slides-data",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    buildStart() {
      this.addWatchFile(deckOptions.sourcePath);
      this.addWatchFile(deckOptions.sourceDir);
    },
    configureServer(viteServer) {
      server = viteServer;
      server.watcher.add([deckOptions.sourcePath, deckOptions.sourceDir]);
      server.watcher.on("add", reloadDeck);
      server.watcher.on("change", reloadDeck);
      server.watcher.on("unlink", reloadDeck);
      server.middlewares.use(assetPrefix, (request, response, next) => {
        try {
          const requestPath = decodeURIComponent((request.url ?? "").replace(/^\//, ""));
          const assetPath = path.resolve(deckOptions.sourceDir, normalizeAssetPath(requestPath));
          const relativeAssetPath = path.relative(deckOptions.sourceDir, assetPath);

          if (relativeAssetPath.startsWith("..") || path.isAbsolute(relativeAssetPath)) {
            response.statusCode = 403;
            response.end("Forbidden");
            return;
          }

          if (!fs.existsSync(assetPath)) {
            next();
            return;
          }

          response.setHeader("Cache-Control", "no-store");
          const contentType = assetContentTypes.get(path.extname(assetPath).toLowerCase());
          if (contentType) {
            response.setHeader("Content-Type", contentType);
          }
          fs.createReadStream(assetPath).pipe(response);
        } catch {
          next();
        }
      });
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) {
        return null;
      }

      return `export default ${JSON.stringify(loadDeck())};`;
    },
    handleHotUpdate(ctx) {
      reloadDeck(ctx.file);
      return [];
    },
    closeBundle() {
      const markdown = readMarkdown();
      const outDir = path.resolve(deckOptions.rootDir, config.build.outDir);
      copyReferencedAssets(markdown, deckOptions.sourceDir, outDir);
      setHtmlTitle(outDir, lastDeckTitle);
    }
  };
}
