![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

This is a [Next.js](https://nextjs.org) project bootstrapped with [
`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Development

To run the application in development mode:

```bash
pnpm dev
# or on a custom port (e.g., 3001)
pnpm dev -- -p 3001
```

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
   # or on a custom port
   pnpm start -- -p 3001
   ```
   The application will be available at `http://localhost:3000` (or your custom port).

### Docker Deployment

To deploy using Docker with the pre-built image:

1. **Build the Image (if not already built):**
   ```bash
   docker build -t bioflow-ai-web:dev-0.1.0 .
   ```

2. **Run the Container:**
   You can customize the port and backend URL.

   - **Standard Run (Port 3000):**
     ```bash
     docker run -p 3000:3000 \
       -e BACKEND_API_URL="http://host.docker.internal:8000/api/v1" \
       bioflow-ai-web:dev-0.1.0
     ```

   - **Custom Port (e.g., 3001):**
     Map host port 3001 to container port 3000.
     ```bash
     docker run -p 3001:3000 \
       -e BACKEND_API_URL="http://host.docker.internal:8000/api/v1" \
       bioflow-ai-web:dev-0.1.0
     ```
     Access at `http://localhost:3001`.

   - **Host Networking (Linux only):**
     If the backend is on localhost, you can use host networking.
     ```bash
     docker run --network host \
       -e BACKEND_API_URL="http://127.0.0.1:8000/api/v1" \
       bioflow-ai-web:dev-0.1.0
     ```

**Note on Backend Connection:**
- If your backend is running on the host machine (outside Docker), use `host.docker.internal` (Windows/Mac) or the host IP (Linux) in `BACKEND_API_URL`.
- The container listens on port 3000 internally. Always map your desired host port to container port 3000 (e.g., `-p <host_port>:3000`).

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BACKEND_API_URL` | **Required**. The internal URL for the backend API, used by the Next.js server. | - |
| `NEXT_PUBLIC_API_URL` | The base URL for the API as seen by the browser client. | `/api/v1` |
