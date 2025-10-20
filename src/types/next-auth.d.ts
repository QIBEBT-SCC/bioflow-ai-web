import type { UserRole } from './auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: UserRole
    }
  }

  interface User {
    role?: UserRole
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole
    accessToken?: string
  }
}
