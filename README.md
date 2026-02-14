![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

This is a [Next.js](https://nextjs.org) project bootstrapped with [
`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Deployment

### Direct Deployment (Locally or on Clean Server)

To deploy the application directly:

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the Application:**
   ```bash
   pnpm build
   ```

3. **Start the Server:**
   ```bash
   pnpm start
   ```
   The application will be available at `http://localhost:3000`.

### Docker Deployment

To deploy using Docker with the pre-built image `aye1032/bioflow-ai-web`:

1. **Run the Container:**
   We recommend passing environment variables at runtime for security.

   ```bash
   # Using an env file (Recommended)
   docker run -d -p 3000:3000 --env-file .env.production --name bioflow-ai-web aye1032/bioflow-ai-web

   # OR passing variables individually
   docker run -d -p 3000:3000 \
     -e BACKEND_API_URL=http://your-backend-api.com/api/v1 \
     --name bioflow-ai-web \
     aye1032/bioflow-ai-web
   ```

2. **Access the Application:**
   Open [http://localhost:3000](http://localhost:3000) (or your server's IP) in your browser.

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BACKEND_API_URL` | **Required**. The internal URL for the backend API, used by the Next.js server. | - |
| `NEXT_PUBLIC_API_URL` | The base URL for the API as seen by the browser client. | `/api/v1` |
