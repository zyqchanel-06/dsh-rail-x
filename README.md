# dsh-rail-x

**把 DSH 输入框附件栏里的删除按钮（✕）从「只在悬停时出现」改成常显。**

一个 30 行的客户端插件：一条 CSS，加一个自愈观察器。没有构建、没有依赖、不改宿主代码、卸载即复原。

> 适配：DSH 桌面版 `0.2.1-rc.2`（2026-10 实测）。兼容版本见下方「已知限制」。

---

## 解决的问题

DSH 输入框上方的草稿附件栏，每张附件右上角有个删除按钮。它的样式是 `opacity: 0`，只有鼠标悬停时才浮现。

触屏设备上根本没有悬停；用键盘或触控板的人也不容易「恰好停在那一个点上」。结果就是：**误粘了一张图，找不着删除入口，只能把它发出去，或者关掉整个会话重来。**

这个插件把按钮固定为常显（`opacity: .92`），鼠标移上去再放大到 `1.25` 倍并完全不透明，让「这里可以点」一眼可见。

---

## 怎么做的

全部逻辑在 [`lib/client.js`](lib/client.js)：

```js
'[class$="_remove"]{opacity:.92 !important;pointer-events:auto !important;cursor:pointer !important;...}'
'[class$="_remove"]:hover{opacity:1 !important;transform:scale(1.25)}'
```

- **选择器用 `[class$="_remove"]`**：DSH 的样式是 CSS Module，类名带哈希前缀（如 `ComposerItem_remove__a1b2c`），但后缀稳定。用后缀匹配既能命中，又不需要知道哈希。
- **`!important`**：宿主用内联/CSS Module 优先级压着，不改优先级盖不住。
- **注入前查重 + `MutationObserver` 自愈**：页面热更新或重渲染把 `<style>` 摘掉时，观察器会在下一帧补回来，不需要用户刷新。
- **宿主侧是空壳**：`lib/index.js` 只导出 `apply` / `inject` / `name` 三件套，`apply` 什么都不做——功能全在浏览器半边。

```
dsh-rail-x/
  lib/index.js       宿主侧入口（空实现，只为满足 cordis 插件契约）
  lib/client.js      浏览器侧：注入样式 + 自愈
  cordis.patch.yml   组合声明
  test/plugin.test.mjs  10 项契约测试
```

---

## 安装

```powershell
dsh plugin --profile desktop add github:zyqchanel-06/dsh-rail-x

# 本地目录（开发）
dsh plugin --profile desktop add "<本目录绝对路径>"
```

`dsh` 不在 PATH 时用安装目录里的 CLI：

```powershell
& "<DSH 安装目录>\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:zyqchanel-06/dsh-rail-x
```

装完**刷新页面一次**（`Ctrl+Shift+R`）。客户端条目在页面启动时读取，不刷新不会出现。

**卸载**：

```powershell
dsh plugin --profile desktop remove dsh-rail-x
```

去掉后样式表不再注入，删除按钮回到悬停才浮现的原样——不留 DOM 和 CSS 残留。

---

## 测试

```powershell
cd dsh-rail-x
node --test test/plugin.test.mjs
```

10 项，零依赖，跑的是**契约**而不是像素：入口文件存在、脚本能被解析、样式规则确实包含 `opacity` / `pointer-events` / `cursor`、`STYLE_ID` 与注入前的查重逻辑一致、观察器监听的是 `head`、客户端里不出现 `fetch` / `storage` / `eval`。

这些测试保护的是「以后改坏了会立刻发现」，不是「界面上长得对」——真实观感需要真机看。

---

## 已知限制

- **依赖类名后缀 `_remove`**。DSH 若改了 CSS Module 的命名规则，规则会失配、插件静默失效（不会报错、不会白屏，只是按钮回到原样）。这种情况下改 `lib/client.js` 里那两行选择器即可。
- **只作用于「草稿附件栏」**。会话里已经发出的消息、其他位置的删除按钮不一定用同一个类名，不受影响也不被修复。
- 放大倍数 `1.25` 是凭手感定的；附件很多、间距很紧时可能轻微压到相邻元素，可自行调小。
- 没有做亮/暗主题的差异化——`opacity` 与 `transform` 都与颜色无关，两种情况都成立。

---

## License

MIT
