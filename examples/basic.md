---
font: cn-sans
fontFamily: ""
---

# MD2Slides

把 Markdown 直接变成可以演示、离线打开、打印成 PDF 的 HTML slides。

- `#` 和 `##` 会开启新页面
- `###` 会留在当前页面里
- 支持图片、视频、表格、引用和代码块

## 写作方式

### 当前页内的小标题

> 保持 Markdown 易读，同时用少量注释指令控制演示布局。

```md
<!-- slide: break layout=quote -->
一句适合单独放大的话。
```

## 图文页

<!-- slide: layout=image-right -->

![示例图](media/pattern.svg)

- 图片或视频会自动进入媒体区域
- 文本留在另一侧
- 适合讲案例、流程和截图

<!-- slide: break layout=quote title="保持简单" -->

先写内容，再用指令微调页面。
