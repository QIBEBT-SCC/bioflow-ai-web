![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Deployment

### Direct Deployment (Locally or on Clean Server)

To deploy the application directly:

1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

2.  **Build the Application:**
    ```bash
    pnpm build
    ```

3.  **Start the Server:**
    ```bash
    pnpm start
    ```
    The application will be available at `http://localhost:3000`.

### Docker Deployment

To deploy using Docker with the pre-built image `aye1032/bioflow-ai-web`:

1.  **Run the Container:**
    We recommend passing environment variables at runtime for security.

    ```bash
    # Using an env file (Recommended)
    docker run -d -p 3000:3000 --env-file .env.production --name bioflow-ai-web aye1032/bioflow-ai-web

    # OR passing variables individually
    docker run -d -p 3000:3000 \
      -e BACKEND_API_URL=http://api.example.com \
      --name bioflow-ai-web \
      aye1032/bioflow-ai-web
    ```

2.  **Access the Application:**
    Open [http://localhost:3000](http://localhost:3000) (or your server's IP) in your browser.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
