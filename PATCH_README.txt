PATCH: 更详细的 /api/list 调试版本

说明：
- 将 functions/api/list.js 替换为这个文件，它在返回 images 时会附带原始 KV 值（raw）、raw 类型和长度、以及 JSON 解析错误信息（parseError），方便排查为什么前端提示 "invalid json response"。
- 如果你看到 raw 是 XML（<?xml ...>），说明请求并没有落到 Functions，而是被对象存储或其它服务处理 — 这通常意味着 Functions 路由没有正确部署或路径错误。

部署建议：
1. 只替换 functions/api/list.js（或把整个 functions/api/ 覆盖），保留其他文件不变。
2. 访问: https://你的域名/api/list?dir=你的目录 名，观察响应（Network -> Response）。
3. 若 Response 仍是 XML，请把该 Response 文本完整粘给我（非截图）。

包含文件：
- functions/api/list.js  （调试版）
- public/open_debug.js   （可选，打开调试窗口）
