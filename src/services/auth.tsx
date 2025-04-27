import {api} from './api';
import type {Token, User} from '@/types/auth.tsx';

export const authApi = {
    login: async (username: string, password: string): Promise<Token> => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const {data} = await api.post<Token>('/auth/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return data;
    },

    getCurrentUser: async (): Promise<User> => {
        const {data} = await api.get<User>('/auth/me');
        return data;
    },
};