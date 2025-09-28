EdgeOne 随机图（中文版）

部署说明：
- 将 functions/ 下的文件部署为 Pages Functions。
- 将 public/ 下的文件放到静态站点根目录。
- 绑定 KV namespace 名称为 "wj"（或 "WJ"）。
- 管理密码已写入 login.js 为 "Dd112211"（硬编码），仅用于测试。

接口说明：
- POST /api/upload  body: { dir, url }  -> 添加图片或创建目录（如果 url 为空字符串则只创建目录）
- GET  /api/list      -> 列出目录
- GET  /api/list?dir=name -> 列出目录内图片
- POST /api/delete body: { dir, url } (删除图片) 或 { dir, deleteDir:true } (删除目录)
- POST /api/login body: { password } -> 登录，设置 auth=1 cookie
