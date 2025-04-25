import {create} from 'zustand';
import type {User} from '@/types/auth';
import {authApi} from '@/services/auth';

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const token = await authApi.login(username, password);
            localStorage.setItem('token', token.access_token);
            const user = await authApi.getCurrentUser();
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : '登录失败',
                isLoading: false 
            });
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false });
    },

    loadUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ user: null, isAuthenticated: false });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const user = await authApi.getCurrentUser();
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ 
                user: null, 
                isAuthenticated: false, 
                isLoading: false,
                error: error instanceof Error ? error.message : '加载用户信息失败'
            });
        }
    },
})); 