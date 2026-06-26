# MD2Slides

MD2Slides 是一个本地 Markdown 转 HTML slides 的工作区工具。它把 Markdown 在 Vite 构建或预览时解析成 16:9 的 slide deck，最终产物是静态文件，可以离线打开、发布到网页，或用浏览器打印成 PDF。

这个项目适合把不同主题的 Markdown 讲稿快速换成可演示的网页 slides。

## 特性

- **纯 Markdown 写作**：`#` / `##` 自动分页，HTML 注释手动分页。
- **多种内置布局**：default、cover、image-left/right、image-full、full、two-col、media、quote、compare。
- **三种主题与四种字号**：light / dark / accent、normal / large / xl / hero。
- **内容自适应**：`fit=shrink` 自动缩放，`fit=scroll` 滚动浏览。
- **本地素材智能复制**：只复制 Markdown 实际引用的本地图片/视频，保持相对路径。
- **浏览器即播放器**：键盘翻页、Overview 模式、全屏、页码跳转、字体面板。
- **URL 深链**：`#slide-3` 可直接定位到第 3 页。
- **静态输出**：构建产物可离线使用，也支持浏览器打印导出 PDF。

---

## 目录

- [快速开始](#快速开始)
  - [CLI 参数](#cli-参数)
- [演示控制](#演示控制)
- [Markdown 规则](#markdown-规则)
  - [自动分页](#自动分页)
  - [手动分页](#手动分页)
  - [文档级配置（Frontmatter）](#文档级配置frontmatter)
- [Slide 指令](#slide-指令)
- [布局预览](#布局预览)
- [主题、适配和字号](#主题适配和字号)
- [字体](#字体)
- [素材规则](#素材规则)
- [构建、预览和 PDF](#构建预览和-pdf)
- [文档预览图](#文档预览图)
- [测试](#测试)
- [目录结构](#目录结构)

---

## 快速开始

本项目是纯 JavaScript 工作区工具，不需要 TypeScript 编译。安装依赖后即可运行：

1. 安装依赖：

   ```powershell
   npm install
   ```

2. 启动开发服务器并打开示例：

   ```powershell
   npm run dev -- examples/tutorial.md
   ```

   `dev` 启动 Vite 开发服务器，实时解析 Markdown，保存后浏览器热更新，适合写作和调试阶段。

3. 编辑 `examples/tutorial.md`，浏览器会同步刷新。

4. 完成后构建静态产物：

   ```powershell
   npm run build -- examples/tutorial.md
   ```

   `build` 把当前 Markdown 编译成可离线使用的静态 HTML，并复制实际引用的本地图片/视频到输出目录，默认放在 `dist/`。

5. 预览或部署：

   ```powershell
   npm run preview -- examples/tutorial.md
   ```

   `preview` 启动静态服务器加载 `dist/` 里的内容，用来检查最终效果，或配合浏览器打印导出 PDF。

   也可以直接把 `dist/` 目录部署到任意静态托管服务，或用浏览器打开 `dist/index.html`。

### CLI 参数

| 参数 | 适用命令 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `dev` | - | - | 启动 Vite 开发服务器，实时解析 Markdown，保存后浏览器热更新。 |
| `build` | - | - | 构建静态 HTML 到输出目录，并复制 Markdown 实际引用的本地素材。 |
| `preview` | - | - | 启动静态服务器，预览 `build` 生成的产物。 |
| `[deck.md]` | `dev` / `build` / `preview` | `examples/basic.md` | 输入 Markdown 文件。素材路径相对该文件解析。 |
| `--title <title>` | `dev` / `build` | 首个 slide 标题或 `MD2Slides` | 覆盖浏览器标题和 deck 标题。 |
| `--outDir <dir>` | `build` | `dist` | 构建输出目录。 |
| `--host <host>` | `dev` / `preview` | `127.0.0.1` | 本地服务监听地址。 |
| `--port <port>` | `dev` / `preview` | Vite 自动选择 | 本地服务端口。 |
| `--open` | `dev` | 开启 | 启动后打开浏览器。 |
| `--no-open` | `dev` | - | 启动后不打开浏览器。 |
| `-h`, `--help` | 所有命令 | - | 显示帮助。 |

除了 npm scripts，也可以直接调用 CLI：

```powershell
node ./bin/md2slides.js dev examples/basic.md --host 127.0.0.1 --port 5173 --no-open
node ./bin/md2slides.js build examples/layouts.md --outDir dist-layouts --title "Layout Gallery"
node ./bin/md2slides.js preview examples/layouts.md --host 127.0.0.1 --port 4173
```

如果想在本机任意目录使用 `md2slides` 命令，可以在项目根目录执行：

```powershell
npm link
md2slides dev F:\path\to\deck.md --no-open
```

示例含义：以开发模式打开 `F:\path\to\deck.md`，`--no-open` 表示启动后不要自动打开浏览器，适合已经在浏览器里手动访问地址，或只需要后台服务的场景。

---

## 演示控制

| 操作 | 作用 |
| --- | --- |
| `ArrowRight` / `Space` / `PageDown` | 下一页 |
| `ArrowLeft` / `Backspace` / `PageUp` | 上一页 |
| `Home` | 第一页 |
| `End` | 最后一页 |
| `O` | 切换 overview 模式 |
| `F` | 请求浏览器全屏 |
| 页码输入框 | 输入页码并按 Enter 跳转 |
| 主题面板 | 全局切换 Auto / Light / Dark / Accent 配色 |
| 字体面板 | 切换字体预设或输入自定义 `font-family` |

URL hash 支持深链，例如 `#slide-3` 会直接打开第 3 页。
URL 参数支持运行时设置，例如 `?theme=dark`、`?font=mono` 或 `?fontFamily=...`。

---

## Markdown 规则

### 自动分页

`#` 和 `##` 会开启新 slide，`###` 及更深标题会留在当前 slide 内。

```md
# 第一页

这里是第一页正文。

### 页内小标题

仍然在第一页。

## 第二页

这里开始第二页。
```

### 手动分页

用 HTML 注释指令在当前章节中强制开启新 slide：

```md
# AI Dungeon

第一页内容。

<!-- slide: break -->

第二页内容，会继承上一页标题。
```

代码块里的 slide 指令不会生效，会作为普通 Markdown 内容保留：

````md
```md
<!-- slide: break layout=quote -->
```
````

### 文档级配置（Frontmatter）

Markdown 开头可以放 frontmatter：

```md
---
font: cn-sans
fontFamily: ""
---

# 第一页
```

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `font` | `system` | 字体预设。支持 `system`、`cn-sans`、`serif`、`mono`。 |
| `fontFamily` | 空 | 自定义 CSS `font-family`。非空时优先于 `font`。 |

---

## Slide 指令

指令格式：

```md
<!-- slide: [break] key=value key=value hidden -->
```

完整示例：

```md
<!-- slide: break layout=image-right class=dark fit=scroll size=xl title="自定义标题" hidden -->
```

| 参数 | 取值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `break` | 裸标记 | - | 在当前位置开启新 slide，并把后续参数应用到新 slide。 |
| `layout` | `default` / `image-left` / `image-right` / `image-full` / `full` / `two-col` / `media` / `cover` / `quote` / `compare` | `default` | 控制页面结构。 |
| `class` | `light` / `dark` / `accent` | `light` | 控制配色主题。 |
| `fit` | `shrink` / `scroll` | `shrink` | 内容超出时自动缩小或滚动。 |
| `size` | `normal` / `large` / `xl` / `hero` | `normal` | 正文字号等级。 |
| `title` | 任意文本 | 当前标题 | 覆盖 slide 标题。可用 `<br>` 手动换行。 |
| `hidden` | `hidden` / `hidden=true` / `hidden=false` | `false` | 从最终 deck 中隐藏该 slide。 |

不带 `break` 时，参数应用到当前 slide。带 `break` 时，会先结束当前 slide，再创建一个继承标题的新 slide。

---

## 布局预览

预览图由 `npm run docs:previews` 从 `examples/layouts.md` 自动生成。每张图都是真实播放器的截图。

### `layout=default`

普通标题 + 单栏正文，适合大多数说明页、议程页和过渡页。

![default layout](docs/layout-previews/default.png)

```md
# Default

- Normal content
- Lists, quotes, code and tables
```

### `layout=cover`

封面页、章节页或强分隔页。标题字号更大，并带装饰线。

![cover layout](docs/layout-previews/cover.png)

```md
<!-- slide: layout=cover title="Layout<br>Gallery" -->

Section opener
```

### `layout=image-left`

第一张图片或视频放左侧，剩余内容放右侧。

![image-left layout](docs/layout-previews/image-left.png)

```md
<!-- slide: layout=image-left -->

![Screenshot](media/example.png)

- Point one
- Point two
```

### `layout=image-right`

第一张图片或视频放右侧，剩余内容放左侧。适合讲截图、案例和产品流程。

![image-right layout](docs/layout-previews/image-right.png)

```md
<!-- slide: layout=image-right -->

![Screenshot](media/example.png)

- Point one
- Point two
```

### `layout=image-full`

第一张图片或视频成为主视觉，剩余文字作为说明层。

![image-full layout](docs/layout-previews/image-full.png)

```md
<!-- slide: layout=image-full -->

![Screenshot](media/example.png)

Caption text
```

### `layout=full`

隐藏标题，内容铺满 16:9 画布。适合整页截图、视频或单张大图。

![full layout](docs/layout-previews/full.png)

```md
<!-- slide: layout=full -->

![Full image](media/example.png)
```

### `layout=two-col`

正文拆成左右两栏。推荐用独立一行 `---` 明确分隔左右内容。

![two-col layout](docs/layout-previews/two-col.png)

```md
<!-- slide: layout=two-col -->

Left column

---

Right column
```

### `layout=media`

媒体优先布局。如果 slide 只有媒体，就按全媒体方式显示；如果还有文字，会形成媒体 + 文本布局。

![media layout](docs/layout-previews/media.png)

```md
<!-- slide: layout=media -->

![Demo](media/example.png)
```

### `layout=quote`

居中放大正文，适合核心观点、引用或一句话结论。

![quote layout](docs/layout-previews/quote.png)

```md
<!-- slide: layout=quote class=accent -->

One strong sentence.
```

### `layout=compare`

优化表格字号和排版，适合对比、前后变化和决策表。

![compare layout](docs/layout-previews/compare.png)

```md
<!-- slide: layout=compare -->

| Item | Before | After |
| --- | --- | --- |
| Input | Fixed | Flexible |
```

---

## 主题、适配和字号

### 配色主题

| 指令 | 效果 |
| --- | --- |
| `class=light` | 默认浅色主题。 |
| `class=dark` | 深色 slide 舞台，适合视频、截图或夜间演示。 |
| `class=accent` | 强调主题，适合 quote、过渡页或重点页。 |

播放器底部的主题面板可以临时覆盖整份 deck 的配色。选择 `Auto` 会恢复 Markdown 中逐页设置的 `class=...`，选择 `Light`、`Dark` 或 `Accent` 会写入 URL 参数，例如 `?theme=dark`。

### 内容适配

| 指令 | 效果 |
| --- | --- |
| `fit=shrink` | 默认行为。内容超出时自动缩小，无法完全容纳时标记 overflow。 |
| `fit=scroll` | 正文区域允许滚动，适合长表格或参考资料页。 |

### 字号

| 指令 | 效果 |
| --- | --- |
| `size=normal` | 默认正文大小。 |
| `size=large` | 放大正文，适合短列表。 |
| `size=xl` | 更大正文，适合目录或少量关键词。 |
| `size=hero` | 超大正文，适合一句话或数字。 |

---

## 字体

MD2Slides 提供四种字体预设，可通过 frontmatter 或播放器中的字体面板切换。

| 预设 | 说明 |
| --- | --- |
| `system`（默认） | 系统无衬线字体栈，兼顾中西文显示。 |
| `cn-sans` | 中文字体优先的无衬线栈。 |
| `serif` | 宋体/衬线风格，适合正式或阅读型内容。 |
| `mono` | 等宽字体，适合代码或技术主题。 |

通过 frontmatter 指定：

```md
---
font: cn-sans
---
```

也可以通过 `fontFamily` 指定任意自定义字体栈：

```md
---
fontFamily: '"LXGW WenKai", "PingFang SC", sans-serif'
---
```

> **提示**：自定义 `fontFamily` 优先级高于 `font` 预设。

---

## 素材规则

本地素材路径相对 Markdown 文件所在目录解析：

```md
![Image](assets/example.png)
<video src="assets/demo.mp4" controls></video>
```

构建时只复制 Markdown 实际引用到的本地素材，并保持相对路径。远程 URL、`data:`、`blob:` 不会复制。

支持的素材引用形式：

```md
![Markdown image](media/a.png)
![Path with spaces](<media/space file.png>)
<img src="media/b.png">
<video src="media/c.mp4" controls preload="metadata"></video>
<source src="media/d.webm">
```

---

## 演示控制

| 操作 | 作用 |
| --- | --- |
| `ArrowRight` / `Space` / `PageDown` | 下一页 |
| `ArrowLeft` / `Backspace` / `PageUp` | 上一页 |
| `Home` | 第一页 |
| `End` | 最后一页 |
| `O` | 切换 overview 模式 |
| `F` | 请求浏览器全屏 |
| 页码输入框 | 输入页码并按 Enter 跳转 |
| 主题面板 | 全局切换 Auto / Light / Dark / Accent 配色 |
| 字体面板 | 切换字体预设或输入自定义 `font-family` |

---

## 构建、预览和 PDF

1. 构建静态产物：

   ```powershell
   npm run build -- examples/layouts.md
   ```

   这会生成可离线使用的静态文件，默认输出到 `dist/` 目录。

2. 本地预览构建结果：

   ```powershell
   npm run preview -- examples/layouts.md
   ```

   这会启动一个静态文件服务器，加载 `dist/` 里的内容，方便确认最终效果。

3. 导出 PDF：

   用浏览器打开 preview 地址后，通过「打印 → 另存为 PDF」即可导出。打印样式按 16:9、每页一个 slide 输出。

> **提示**：推荐使用 Chrome/Edge 的「另存为 PDF」，纸张尺寸选择 A4 或自定义 16:9（297mm × 167mm），边距设为「无」。

---

## 文档预览图

重新生成 README 中的布局预览图：

```powershell
npm run docs:previews
```

脚本会启动本地 dev server，打开 `examples/layouts.md`，并把每种 layout 的截图写入 `docs/layout-previews/`。

---

## 测试

```powershell
npm test
```

测试包含：

- Markdown 解析单元测试。
- 素材引用解析、校验和复制测试。
- Playwright 浏览器测试，覆盖显示、键盘、按钮、hash、overview、字体面板和布局 DOM。

---

## 目录结构

```text
MD2Slides/
  bin/md2slides.js              CLI 入口
  src/core/parseDeck.js         Markdown 解析核心
  src/node/                     Vite 插件、素材解析和复制
  src/app/                      浏览器播放器和样式
  examples/basic.md             默认示例
  examples/layouts.md           布局图库示例
  docs/layout-previews/         README 使用的布局预览图
  scripts/captureLayoutPreviews.js
  test/                         单元测试和 Playwright 测试
```

---

## 发布源码包

生成可分发的源码 zip 包：

```powershell
npm run release:zip
```

脚本会读取 `package.json` 中的 `name`，按 `<name>-yyyyMMdd.zip` 命名，并输出到 `releases/` 目录，例如：

```text
releases/md2slides-workspace-20260626.zip
```

源码包会包含源码、测试、文档、示例和 README 使用的 `docs/layout-previews/` 预览图；会排除 `node_modules/`、`dist/`、`dist-*`、`test-results/`、`playwright-report/`、`.git/` 和 `releases/` 等本地生成目录。
