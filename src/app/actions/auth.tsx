"use server";

import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import type {Token, User} from "@/types/auth";

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 登录 Action
 */
export async function loginAction(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return {
            success: false,
            error: "Username and password are required",
        };
    }

    try {
        // 调用 FastAPI 登录接口
        const res = await fetch(`${FASTAPI_URL}/auth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                username,
                password,
            }),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({detail: "Login failed"}));
            return {
                success: false,
                error: error.detail || "Invalid credentials",
            };
        }

        const data: Token = await res.json();

        // 设置 httpOnly cookie（安全，防止 XSS）
        const cookieStore = await cookies();
        cookieStore.set("token", data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7天
            path: "/",
        });

        // 成功后返回成功标志
        return {success: true};
    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            error: "An error occurred during login",
        };
    }
}

/**
 * 登出 Action
 */
export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    redirect("/login");
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return null;
        }

        const res = await fetch(`${FASTAPI_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            // Token 无效，删除 cookie
            cookieStore.delete("token");
            return null;
        }

        return res.json();
    } catch (error) {
        console.error("Get current user error:", error);
        return null;
    }
}

/**
 * 验证 token 是否有效
 */
export async function validateToken(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}
