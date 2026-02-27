![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

BioFlow AI Web 前端，基于 Next.js 构建。采用纯客户端渲染（CSR）架构，Next.js Server 仅承担静态资源托管和 `/api/v1` 反向代理职责。

## 技术栈

- **框架**：Next.js 16 (App Router, standalone 模式)
- **UI**：React 19 + Tailwind CSS v4 + shadcn/ui
- **状态管理**：TanStack Query v5 + Zustand
- **国际化**：next-intl（纯客户端模式）
- **AI 对话**：Vercel AI SDK (`@ai-sdk/react`)

## 本地开发

### 前置条件

- Node.js 22+
- pnpm 10+

### 启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认 http://localhost:3000）
pnpm dev
```

开发时后端地址配置在 `.env.development` 中：

```env
NEXT_PUBLIC_API_URL=/api/v1
BACKEND_API_URL=http://your-backend:8000/api/v1
```

## 生产部署

### 方式一：Docker（推荐）

```bash
# 构建镜像
docker build -t bioflow-ai-web:latest .

# 运行（需传入后端地址）
docker run -p 3000:3000 \
  -e BACKEND_API_URL="http://your-backend:8000/api/v1" \
  bioflow-ai-web:latest
```

**常见场景：**

```bash
# 后端在宿主机（Windows / macOS）
docker run -p 3000:3000 \
  -e BACKEND_API_URL="http://host.docker.internal:8000/api/v1" \
  bioflow-ai-web:latest

# 后端在宿主机（Linux，使用 host 网络）
docker run --network host \
  -e BACKEND_API_URL="http://127.0.0.1:8000/api/v1" \
  bioflow-ai-web:latest

# 自定义宿主机端口（映射到容器 3000）
docker run -p 3001:3000 \
  -e BACKEND_API_URL="http://your-backend:8000/api/v1" \
  bioflow-ai-web:latest
```

### 方式二：直接部署

```bash
pnpm install
pnpm build
BACKEND_API_URL=http://your-backend:8000/api/v1 pnpm start
```

## 环境变量

| 变量 | 说明 | 默认值 |
| :--- | :--- | :--- |
| `BACKEND_API_URL` | **运行时注入**。后端 API 的内网地址，仅 Next.js Server 可见，不暴露到浏览器。 | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_API_URL` | 客户端请求的 API 前缀，固定为相对路径，由 Next.js rewrites 代理到后端。 | `/api/v1` |

> **注意**：`BACKEND_API_URL` 不应写入 `.env.production`，应在运行时通过 `-e` 或系统环境变量注入，以避免后端地址硬编码进代码仓库。

## 架构说明

```
浏览器
  │  静态资源（HTML / CSS / JS）
  │  API 请求 → /api/v1/*
  ▼
Next.js Server（standalone）
  │  rewrites: /api/v1/* → BACKEND_API_URL/*
  ▼
后端 FastAPI
```

客户端认证通过 `access_token` Cookie + localStorage 管理，路由守卫由 `AuthGuard` / `GuestGuard` 组件在客户端执行。
