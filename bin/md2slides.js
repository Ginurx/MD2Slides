#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const DEFAULT_COMMAND = "dev";
const VALID_COMMANDS = new Set(["dev", "build", "preview"]);

function printHelp() {
  console.log(`Usage:
  md2slides [dev|build|preview] [deck.md] [options]

Options:
  --title <title>     Override document title
  --outDir <dir>      Build output directory, default: dist
  --host <host>       Dev/preview host, default: 127.0.0.1
  --port <port>       Dev/preview port
  --open              Open browser on dev start
  --no-open           Do not open browser on dev start
  -h, --help          Show this help

Examples:
  npm run dev -- examples/basic.md
  npm run build -- examples/layouts.md
  node ./bin/md2slides.js dev path/to/deck.md --host 127.0.0.1 --port 5173 --no-open`);
}

function readArgs(argv) {
  const options = {
    command: DEFAULT_COMMAND,
    deck: "",
    title: "",
    outDir: "",
    host: "127.0.0.1",
    port: "",
    open: true,
    passthrough: []
  };

  const args = [...argv];
  if (args[0] && VALID_COMMANDS.has(args[0])) {
    options.command = args.shift();
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "--title") {
      options.title = args[++index] ?? "";
      continue;
    }

    if (arg === "--outDir") {
      options.outDir = args[++index] ?? "";
      continue;
    }

    if (arg === "--host") {
      options.host = args[++index] ?? options.host;
      continue;
    }

    if (arg === "--port") {
      options.port = args[++index] ?? "";
      continue;
    }

    if (arg === "--open") {
      options.open = true;
      continue;
    }

    if (arg === "--no-open") {
      options.open = false;
      continue;
    }

    if (arg.startsWith("--")) {
      options.passthrough.push(arg);
      continue;
    }

    if (!options.deck) {
      options.deck = arg;
      continue;
    }

    options.passthrough.push(arg);
  }

  return options;
}

function resolveDeckPath(deck) {
  const defaultDeck = path.join(projectRoot, "examples", "basic.md");
  return path.resolve(process.cwd(), deck || defaultDeck);
}

function runVite(options) {
  const viteBin = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
  const viteArgs = [];

  if (options.command === "build") {
    viteArgs.push("build");
  } else if (options.command === "preview") {
    viteArgs.push("preview");
  } else {
    viteArgs.push("--host", options.host);
    if (options.port) {
      viteArgs.push("--port", options.port);
    }
  }

  if (options.command === "preview") {
    viteArgs.push("--host", options.host);
    if (options.port) {
      viteArgs.push("--port", options.port);
    }
  }

  viteArgs.push(...options.passthrough);

  const child = spawn(process.execPath, [viteBin, ...viteArgs], {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      MD2SLIDES_SOURCE: resolveDeckPath(options.deck),
      MD2SLIDES_TITLE: options.title,
      MD2SLIDES_OUT_DIR: options.outDir,
      MD2SLIDES_OPEN: options.open ? "1" : "0"
    }
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

const options = readArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

runVite(options);
