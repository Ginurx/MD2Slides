---
font: cn-sans
---

# MD2Slides 入门

先写普通 Markdown，再按需要加一行 layout 指令，就能预览成一页页 slides。

## 最小写法

一个标题，加上一段正文，就是一张清楚的页面。

```md
# 我的主题

这里写这一页要讲的内容。
```

## 自动分页

`#` 和 `##` 会自动开启新的 slide。

- `#` 适合整份文档的标题
- `##` 适合每一页的标题
- 写作时先按内容分段，不需要先想布局

## 页内小标题

### 这一行不会新开一页

`###` 会留在当前 slide 里，适合放页内的小节标题。

继续写正文时，内容仍然属于这一页。

## 列表和步骤

用列表整理要点，用数字写操作顺序。

- 先写主题
- 再补充例子
- 最后预览效果

1. 打开 Markdown 文件
2. 保存修改
3. 切到浏览器查看 slides

## 引用和重点

引用适合放一句想让观众记住的话。

> 先把内容写清楚，页面效果会自然跟上。

普通段落可以继续放在引用之后。

## 表格

表格适合做小型对比。

| Markdown | Slide 效果 |
| --- | --- |
| `# 标题` | 新建一页 |
| `## 标题` | 新建一页 |
| `### 标题` | 当前页小标题 |

## 代码块

代码块会按原样排版，适合展示命令、配置或示例。

```powershell
npm run dev -- examples/tutorial.md
```

```js
const title = "普通 Markdown";
console.log(title);
```

## 图片

普通 Markdown 图片会直接显示在 slide 中。

![示例图](media/pattern.svg)

图片路径相对当前 Markdown 文件所在目录。

## Layout 样例

前面的页面都使用默认 layout。

需要改变版式时，在当前页标题下面加一行注释指令：

```md
<!-- slide: layout=image-right -->
```

下面几页会直接预览不同 layout 的效果。

## Cover 封面页
<!-- slide: layout=cover title="Cover<br>封面页" -->

适合课程开场、章节切换或重要主题登场。

## Image Right 图文页
<!-- slide: layout=image-right -->

![示例图](media/pattern.svg)

- 图片放在右侧
- 文字放在左侧
- 适合讲截图、流程和案例

## Two Columns 双栏
<!-- slide: layout=two-col -->

**左侧：问题**

- 内容太散
- 顺序不清楚
- 重点不明显

---

**右侧：做法**

- 拆成两栏
- 左右对照
- 一页讲清一组关系

## Quote 大字句
<!-- slide: layout=quote class=accent -->

> 好的 slide 先让观众看懂，再让他们记住。

## Compare 对比表
<!-- slide: layout=compare -->

| 场景 | 默认写法 | 推荐 layout |
| --- | --- | --- |
| 普通说明 | 标题 + 段落 | default |
| 截图讲解 | 图片 + 要点 | image-right |
| 前后对比 | 表格 | compare |

## Full 整页媒体
<!-- slide: layout=full -->

![示例图](media/pattern.svg)

## 预览方式

写的时候启动实时预览：

```powershell
npm run dev -- examples/tutorial.md
```

完成后构建静态文件：

```powershell
npm run build -- examples/tutorial.md
```

这样就可以把 Markdown 变成可演示、可离线打开的 HTML slides。
