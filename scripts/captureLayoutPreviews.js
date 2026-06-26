import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(projectRoot, "docs", "layout-previews");
const host = "127.0.0.1";
const port = 4191;
const baseUrl = `http://${host}:${port}`;

const previews = [
  ["default", 1],
  ["cover", 2],
  ["image-left", 3],
  ["image-right", 4],
  ["image-full", 5],
  ["full", 6],
  ["two-col", 7],
  ["media", 8],
  ["quote", 9],
  ["compare", 10]
];

function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const poll = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(poll, 250);
      });
    };

    poll();
  });
}

function startServer() {
  return spawn(
    process.execPath,
    [
      "bin/md2slides.js",
      "dev",
      "examples/layouts.md",
      "--host",
      host,
      "--port",
      String(port),
      "--no-open"
    ],
    {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
}

async function capture() {
  fs.mkdirSync(outputDir, { recursive: true });

  const server = startServer();
  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  server.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[docs] preview server exited with code ${code}`);
    }
  });

  let browser;
  try {
    await waitForServer(baseUrl);

    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

    for (const [name, slideNumber] of previews) {
      await page.goto(`${baseUrl}/#slide-${slideNumber}`);
      await page.locator(`#slide-${slideNumber}.is-active .slide-stage`).waitFor();
      await page.waitForFunction(
        (selector) => {
          const slide = document.querySelector(selector);
          const images = Array.from(slide?.querySelectorAll("img") ?? []);
          return images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
        },
        `#slide-${slideNumber}.is-active`,
        { timeout: 5_000 }
      );
      await page.locator(`#slide-${slideNumber}.is-active .slide-stage`).screenshot({
        path: path.join(outputDir, `${name}.png`)
      });
      console.log(`[docs] captured ${name}.png`);
    }

    await browser.close();
  } finally {
    await browser?.close().catch(() => {});
    server.kill();
  }
}

capture().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
