import path from "path"
import tailwindcss from "@tailwindcss/vite"
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            // 字符串简写写法：
            // http://localhost:5173/foo
            // -> http://localhost:4567/foo
            '/api': {
                target: 'http://172.18.19.113:8000',
                changeOrigin: true
            },
        },
    },
})
