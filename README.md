# 皮肤切换（Skin Switcher）

给 DeepSeek Harness Web/GUI 加一个**左侧边栏图标**，点开即是一面「风格墙」：十一种整体视觉风格，一键切换，全应用生效。

## 十一种风格

| 风格 | id | 观感 |
|---|---|---|
| 像素风 Pixel | `pixel` | 暖纸色底 + 硬投影 + 扫描线 + 全站直角 + 等宽字，像一台 8-bit 终端 |
| 终端 Terminal | `terminal` | 近黑绿字、无圆角、无阴影、扫描线、等宽字体 |
| 纸感 Paper | `paper` | 米白底、细黑边、衬线标题、接近零圆角，像打印稿 |
| 极光 Aurora | `aurora` | 深蓝紫底 + 半透明玻璃层 + 大圆角 + 柔和光晕 |
| 糖果 Candy | `candy` | 高饱和马卡龙色、超大圆角、胶囊按钮 |
| QQ 经典 QQ Classic | `qq` | 早期 QQ：天蓝渐变底、浅灰蓝面板、98 式凸起/按下立体边框、全直角、Tahoma + 宋体小字 |
| 日落 Sunset | `sunset` | 杏橙 → 玫瑰粉 → 紫罗兰的暖调渐变，面板浮在渐变之上 |
| 海洋 Ocean | `ocean` | 青碧 → 天蓝 → 靛蓝的冷调渐变，半透明表面像水面 |
| 霓虹 Cyber Neon | `cyber` | 近黑紫底 + 青光/洋红辉光，等宽字、清晰的棱角 |
| 薄荷 Mint | `mint` | 薄荷绿 → 水青 → 浅蓝，轻盈通透 |
| 雾霭 Mist | `mist` | 冷灰过渡到淡紫的中性渐变，克制不抢眼 |

第 12 个选项「默认外观」把一切还原成 Harness 原生配色、圆角与字体。

## 使用方法

1. 左侧边栏里有一个调色板图标（在插件 / Schedules / Context 图标之后），点它。
2. 在面板里点任意风格卡片 → 整个应用立刻换肤。
3. 点「默认外观」还原。
4. 选择会持久化：同时写入 `localStorage` 与 `dsh_skin` Cookie。Cookie 按主机名（不分端口）作用域，所以即使 DSH 每次启动换端口，偏好也不会丢。

## 分享给别人

本插件零依赖（`client.js` 只用 Harness 注入的 `React` / `ctx` / `styles` / `theme`），整包解压后可直接被插件管理器安装。安装目标就是 **`pnpm add` 认的 spec**：本地目录、本地 `.tgz`、`git+https://…`、注册表包名，四种都行。

### 1. 直接发文件（最快）

`dist/dsh-skin-switcher-1.3.0.zip`（解压得到一个 `dsh-skin-switcher/` 目录）或 `dist/local-dsh-skin-switcher-1.3.0.tgz`。对方解压后二选一：

- 「插件」页的安装框填该目录的**绝对路径**；
- 或命令行：`dsh plugin --profile desktop add D:\path\to\dsh-skin-switcher`（tgz 同理，换成 tgz 绝对路径）。

装完会在对方 profile 里生成 `link:` 依赖，刷新页面即出现侧边栏图标。

### 2. 放 GitHub，用 git 地址安装

```bash
cd D:\Projects\personal\deepseek-harness\dsh-skin-switcher
git init && git add . && git commit -m "dsh-skin-switcher 1.3.0"
git remote add origin https://github.com/BXCQ/dsh-skin-switcher.git && git push -u origin main
```

对方：`dsh plugin --profile desktop add git+https://github.com/BXCQ/dsh-skin-switcher.git`

`@local/…` 这个包名走 git/目录安装完全没问题；只有发 npm 才需要换成公开名（见下）。

### 3. 发 npm（需要换名）

`dsh-skin-switcher` 这个名字**已被别人占用**（v0.4.0，作者 zhtx2026，是另一个插件），所以要用 scope 或改名：

1. `package.json`：`name` 改成 `@<你的npm用户名>/dsh-skin-switcher`，删掉 `"private": true`，加 `"publishConfig": { "access": "public" }`；
2. `cordis.patch.yml` 里 insert 的 `name` **必须同步改**（它要和包名一致），`client.js` 里的 `PACKAGE_ID` 只是覆盖层来源标识，可不动；
3. `npm publish`。

对方：`dsh plugin --profile desktop add @<你的npm用户名>/dsh-skin-switcher`，或在插件页填同一个 spec。

### 4. 上架插件目录（可选）

- **自定义索引源**：插件市场只认 **JSON 索引（format 1）**，文件需 https 可达；在「插件」页启用实验性插件「自定义插件索引」，再到 Plugins → 发现 → 索引源里加自己的 URL。索引项的图标按索引 URL 相对解析，内联图标上限 32 KiB。
- **社区目录**：`awesome-dsh-plugin` 仓库（npm 包 `dsh-plugin-catalog`，jsDelivr 同步）接受 PR 加一条条目，插件市场和官网会自动收录。

两种索引格式的字段规范以官方文档为准，本仓库不代替它。

## 实现方式（为什么不会破坏原生主题）

- 颜色走 Client `theme` 服务的 **token 覆盖层**：`theme.overrideTokens('@local/dsh-skin-switcher', tokens)`。
  覆盖层叠在「当前主题」之上，不改主题注册表 —— 所以设置里的浅色/深色/跟随系统切换依旧正常工作，每种风格都同时提供 light 与 dark 两套 14 个 alias token。
- 形状与字体（圆角、阴影、字体族、扫描线叠层）通过 `styles.insert(css)` 注入一份包内样式表，切换时先销毁上一张，不会泄漏。
- **渐变风格与 QQ 经典另有一层机制**：token 只能装单色，装不下渐变，所以渐变画在页面画布（`html` 的 `background-image`）上，而它上面的每个表面（面板、菜单、侧边栏）都用对应的**半透明** alias token —— 于是渐变在底层透出来，面板仍是"磨砂玻璃"。
  - 渐变必须区分深浅色，因此渐变风格的样式表是**按当前配色方案构建**的：读取 `theme.getTheme().active.colorScheme`，并订阅 `theme/change`，在用户切浅色/深色（或跟随系统时系统方案变化）时重绘。
  - 读不到主题快照时（主题服务缺失），降级为 `@media (prefers-color-scheme: dark)` 兜底。
  - **脱离文档流的表面要自己补画布**：右侧停靠区（`[data-dockkit-host="dock"]`、`[data-dockkit-pane]`、`[data-dockkit-empty]`、`[data-dockkit-divider]`）和浮动文档窗（`[data-dockkit-float]`）在原生样式里**不画任何背景**，靠的是页面底色不透明；底色一旦半透明，展开的文档面板就会把下面的文字透出来（重叠/重影）。所以这些表面重复同一张 `background-attachment: fixed` 画布 —— 不透明、且与页面渐变逐像素对齐。
  - 画布只画在 dock 的单元格上，**不画 `.panel` 元素本身**：面板关闭时元素仍占着宽度（隐藏的是它的子元素），在它上面铺底色会在没开文档时也盖住内容。
- 面板本身只用 `--dsw-alias-*` token，因此面板也会跟着换肤（等于实时预览）；渐变风格的卡片预览画的是该风格自己的渐变缩略图。
- 主题服务缺失时不会报错：只应用形状/字体，并在控制台留下一条诊断；重置始终可达。

## 文件

```
package.json          # bundle 清单：dsh.bundle.patch + dsh.client.platform=web
cordis.patch.yml      # 插入一行：id dsh-skin-switcher → @local/dsh-skin-switcher
index.js              # Host 半部（空实现：本插件是纯前端能力）
client.js             # 全部逻辑：11+1 个皮肤定义、渐变构建、面板、侧边栏图标、持久化
locale/en.json        # 商店/插件列表里显示的标题与描述（英文）
locale/zh.json        # 同上（中文）
icon.svg              # 原创 64×64 调色板图标
test/harness.mjs      # 无浏览器集成测试（见下）
dist/                 # 分发产物：dsh-skin-switcher-1.3.0.zip + local-dsh-skin-switcher-1.3.0.tgz
```

## 新增一种风格

平面风格：在 `client.js` 里

1. 加一对 `MYSTYLE_LIGHT` / `MYSTYLE_DARK` 调色板（14 个 token 必须齐全，键见 `TOKEN_NAMES`）。
2. 在 `SKINS` 数组里加一项：`{id, preview:{...}, tokens: tokens(...), css: '...'}`。
3. 在 `DICT_EN` / `DICT_ZH` 加 `skin.mystyle.name` / `skin.mystyle.desc`。

渐变风格（含 QQ 经典）则第 2 步写 `css: gradientChrome({ light:{...}, dark:{...}, radius, font, extra })`，并在 `preview` 里补一个 `bgImage`（卡片缩略图用的渐变）；`chromeFor()` 会在每次应用/配色切换时用当前方案调用它。`extra` 是追加的 CSS 文本，用来放该风格独有的几何细节（例如 QQ 经典的 98 式立体边框）。

## 测试

```bash
cd D:\Projects\personal\deepseek-harness\dsh-skin-switcher
node test/harness.mjs
```

harness 用假的 `window.__ModuleLoader__` / `React` / `ctx` 真跑一遍 `client.js`，覆盖 75 条断言：两个插槽的注册内容、面板渲染出 11 张卡片、点选后 token 覆盖层的完整性与销毁、切换/重置的层叠清理、Cookie 回退恢复、主题服务缺失时的降级、未知 id 的容错，渐变风格的配色方案构建（浅/深读取、`theme/change` 重绘、同方案事件忽略、平面风格不受方案切换影响、监听随运行销毁、无主题快照时走 OS 兜底），QQ 经典风格（直角、天蓝画布、98 立体边框、年代字体栈、深色方案跟随、token 层不重复叠加），以及脱离文档流的表面（每个 dock 选择器都被覆盖、同一张 fixed 画布、面板元素本身不被涂色、深色方案同样生效、平面风格不需要补画布）。

## 卸载

在「插件」页面关闭或卸载 `@local/dsh-skin-switcher` 即可；它会先还原默认外观（覆盖层随 Client 运行结束一起销毁）。

## 已知限制

- 纯视觉、无浏览器截图验证：视觉呈现未经截图确认，其余（清单校验、插槽注册、逻辑行为）都有证据。
- 少数硬编码颜色的区域（如代码高亮、Markdown 内联色）不随 token 变化 —— 这是 Harness 主题机制本身的边界，不是本插件绕不过去。
- 渐变画在 `html` 画布上：如果某个界面区域自带不透明底色（非 token），那里会盖住渐变 —— 该风格下仍会显示半透明 surface 的色调，只是看不到渐变本身。右侧 dock 与浮动文档窗已由插件补画同款画布，其他第三方插件若自绘不透明表面则不在覆盖范围内。
- 侧边栏图标固定 30 号位（在插件 0 / 计划任务 10 / Context 20 之后）。

## 许可证

[MIT](LICENSE) © 2026 BXCQ
