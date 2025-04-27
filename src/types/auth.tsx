export enum UserRole {
    VISITOR = 0,
    MEMBER = 1,
    ADMIN = 2,
}

export interface Token {
    access_token: string;
    token_type: string;
}

export interface User {
    username: string;
    email: string;
    role: UserRole;
} 