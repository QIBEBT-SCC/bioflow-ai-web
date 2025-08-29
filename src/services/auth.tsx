import {api} from './api';
import type {Token, User} from '@/types/auth.tsx';

export const authApi = {
    login: async (username: string, password: string): Promise<Token> => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        return await api.post<Token>('/auth/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    },

    getCurrentUser: async (): Promise<User> => {
        return await api.get<User>('/auth/me');
    },
};