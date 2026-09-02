<p align="center">
  <img src="public/logo_and_text.svg" alt="BioFlow AI" width="420" />
</p>

# BioFlow AI Web

本仓库是 [BioFlow AI](https://github.com/QIBEBT-SCC/bioflow-ai) 的 Web 前端。主项目、后端服务及完整系统说明请前往 BioFlow AI 主仓库查看。

## 部署

部署前，请先启动 BioFlow AI 后端服务，并确认其 API 可以访问。

```bash
git clone https://github.com/QIBEBT-SCC/bioflow-ai-web.git
cd bioflow-ai-web

docker build -t bioflow-ai-web:latest .
docker run -d \
  --name bioflow-ai-web \
  --restart unless-stopped \
  -p 3000:3000 \
  -e BACKEND_API_URL="http://your-backend:8000/api/v1" \
  bioflow-ai-web:latest
```

`BACKEND_API_URL` 必须是前端容器可以访问的后端 API 地址。后端运行在宿主机时，可按运行环境使用：

- Windows / macOS：`http://host.docker.internal:8000/api/v1`
- Linux：为容器添加 `--add-host host.docker.internal:host-gateway`，并使用同一地址
- Docker Compose：使用后端服务名，例如 `http://bioflow-api:8000/api/v1`

部署完成后，在浏览器中访问 [http://localhost:3000](http://localhost:3000)，使用 BioFlow AI 账号登录即可。
