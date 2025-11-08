export enum UserRole {
  VISITOR = 0,
  MEMBER = 1,
  ADMIN = 2,
}

export interface User {
  username: string
  email: string
  role: UserRole
}

export interface TokenResponse {
  access_token: string
  token_type: string
}