import type { NextAuthOptions } from 'next-auth'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import type { User } from '@/types/auth'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // 调用 FastAPI 登录接口
          const res = await fetch(`${FASTAPI_URL}/auth/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              username: credentials.username,
              password: credentials.password,
            }),
          })

          if (!res.ok) {
            return null
          }

          const tokenData = await res.json()

          // 获取用户信息
          const userRes = await fetch(`${FASTAPI_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          })

          if (!userRes.ok) {
            return null
          }

          const user: User = await userRes.json()

          return {
            id: user.username,
            name: user.username,
            email: user.email,
            role: user.role,
            accessToken: tokenData.access_token,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 首次登录时，将用户信息存储到token中
      if (user) {
        token.role = user.role
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      // 将token中的信息传递给session
      if (token) {
        session.user.role = token.role
        session.accessToken = token.accessToken
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7天
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7天
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
