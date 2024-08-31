# AI绘画·薰衣草™

## 项目概述

AI绘画·薰衣草™ 是一个基于 Cloudflare Workers 的 Web 应用，它允许用户通过简单的界面生成 AI 图像。该应用集成了多种 AI 绘画模型，包括 DALL-E 3、Stable Diffusion 等，并提供了图片展览功能。

## 页面展示

<img width="1217" alt="屏幕截图 2024-08-31 094113" src="https://github.com/user-attachments/assets/9e1a6337-c7c4-44f9-ae02-f3eb5f431884">
<img width="1217" alt="屏幕截图 2024-08-31 094113" src="https://github.com/user-attachments/assets/6893d582-c01c-4570-88de-eed6eac860f5">
<img width="1197" alt="屏幕截图 2024-08-31 094245" src="https://github.com/user-attachments/assets/d33c266d-020b-4d3c-b998-b250c4ff7a20">

## 特性
- 多种 AI 模型选择
- 自定义图像尺寸
- 用户友好的界面
- 图片生成后自动保存到展览
- 响应式设计，适配多种设备

## 部署步骤

### 前提条件

- Cloudflare 账户
- 了解 Cloudflare Workers 和 KV 存储的基本概念

### 步骤 1: 创建 Cloudflare Worker

1. 登录到 Cloudflare 仪表板。
2. 导航到 "Workers & Pages"。
3. 点击 "创建应用程序"，选择 "Worker"。
4. 为您的 Worker 命名（例如 "ai-image-generator"）。

### 步骤 2: 设置 KV 命名空间

1. 在 Cloudflare 仪表板中，转到 "Workers & Pages" > "KV"。
2. 点击 "创建命名空间"，将其命名为 "GALLERY_IMAGES"。

### 步骤 3: 绑定 KV 命名空间到 Worker

1. 在您的 Worker 设置中，找到 "变量" 选项卡。
2. 在 "KV 命名空间绑定" 部分，添加一个新绑定。
3. 变量名称设置为 "GALLERY_IMAGES"，选择您刚才创建的 KV 命名空间。

### 步骤 4: 部署代码

1. 将提供的 HTML、JavaScript 和 Worker 代码复制到相应的文件中。
2. 在 Worker 的代码编辑器中，粘贴 `IMAGE-LVD.js` 的内容。
3. 创建两个新文件：`index.html` 和 `gallery.html`，分别粘贴相应的 HTML 内容。
4. 点击 "保存并部署"。

### 步骤 5: 配置环境变量

在 Worker 的 "变量" 选项卡中，添加以下环境变量：

- `DALLE_API_KEY`: 您的 DALL-E API 密钥
- `FLUX_API_KEY`: 您的 FLUX API 密钥
- `IMAGE_HOST_API_KEY`: 您的图片托管服务 API 密钥

## 使用方法

1. 访问您的 Worker URL（例如 `https://ai-image-generator.your-username.workers.dev`）。
2. 在界面上选择 AI 模型和图像尺寸。
3. 输入详细的提示词描述您想要生成的图像。
4. 点击 "生成图像" 按钮。
5. 等待图像生成完成，生成的图像将显示在页面上。
6. 点击 "查看图片展览" 可以浏览之前生成的所有图片。

## 注意事项

- 确保您有足够的 Cloudflare Workers 使用配额，因为图像生成可能会消耗大量资源。
- 定期检查您的 KV 存储使用情况，以避免超出限额。
- 图片生成可能需要一些时间，请耐心等待。
- 请遵守 AI 模型提供商的使用条款和政策。

## 故障排除

- 如果图像生成失败，检查控制台日志以获取更多信息。
- 确保所有 API 密钥都是有效的且未过期。
- 如果展览页面无法加载图片，检查 KV 存储是否正确配置。

## 安全性

- 请勿在客户端暴露任何 API 密钥。
- 考虑添加用户认证机制以防止滥用。
- 定期更新您的依赖项和 API 密钥。

## 贡献

欢迎提交问题和拉取请求来改进这个项目。

## 许可证

本项目采用 MIT 许可证。详情请见 [LICENSE](LICENSE) 文件。

---

© 2024 薰衣草Pub提供技术支持，保留所有权利。
