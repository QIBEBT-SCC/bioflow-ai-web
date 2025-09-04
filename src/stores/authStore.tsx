import {create} from 'zustand';
import {User, UserRole} from '@/types/auth.tsx';
import {authApi} from '@/services/auth';

interface AuthStore {
    user: User;
    isAuthenticated: boolean;
    isLoading: boolean;
    errorMsg: string;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
}

const visitorUser = {username: 'anonymous', email: 'anonymous@email.com', role: UserRole.VISITOR}

export const useAuthStore = create<AuthStore>((set) => ({
    user: visitorUser,
    isAuthenticated: false,
    isLoading: false,
    errorMsg: '',

    login: async (username: string, password: string) => {
        set({isLoading: true, errorMsg: ''});
        try {
            const token = await authApi.login(username, password);
            localStorage.setItem('token', token.access_token);
            const user = await authApi.getCurrentUser();
            set({user, isAuthenticated: true, isLoading: false});
        } catch (error) {
            set({
                errorMsg: error instanceof Error ? error.message : '登录失败',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({
            user: visitorUser,
            isAuthenticated: false,
            errorMsg: 'Session expired. Please login again.'
        });
    },

    loadUser: async () => {
        const token = localStorage.getItem('token');

        // 检查token是否存在且未过期
        if (!token || isTokenExpired(token)) {
            localStorage.removeItem('token');
            set({user: visitorUser, isAuthenticated: false});
            return;
        }

        set({isLoading: true, errorMsg: ''});
        try {
            const user = await authApi.getCurrentUser();
            set({user, isAuthenticated: true, isLoading: false});
        } catch (error) {
            localStorage.removeItem('token');
            set({
                user: visitorUser,
                isAuthenticated: false,
                isLoading: false,
                errorMsg: error instanceof Error ? error.message : '加载用户信息失败'
            });
        }
    },
}));

// Token 过期时间检查
export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const exp = payload.exp * 1000 // 转换为毫秒
        return Date.now() >= exp
    } catch {
        return true
    }
}