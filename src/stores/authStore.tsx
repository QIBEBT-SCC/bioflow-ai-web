import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {User, UserRole} from '@/types/auth.tsx';
import {authApi} from '@/services/auth';

interface AuthStore {
    user: User;
    isAuthenticated: boolean;
    isLoading: boolean;
    errorMsg: string;
    isInitialized: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    initializeAuth: () => Promise<void>;
    setLoading: (loading: boolean) => void;
}

const visitorUser = {username: 'anonymous', email: 'anonymous@email.com', role: UserRole.VISITOR}

// 辅助函数：验证token并获取用户信息
const validateTokenAndGetUser = async (token: string): Promise<User> => {
    if (isTokenExpired(token)) {
        throw new Error('Token已过期');
    }
    return await authApi.getCurrentUser();
};

// 辅助函数：设置访客状态
const setVisitorState = (set: any) => {
    set({
        user: visitorUser,
        isAuthenticated: false,
        isLoading: false,
        errorMsg: ''
    });
};

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: visitorUser,
            isAuthenticated: false,
            isLoading: false,
            errorMsg: '',
            isInitialized: false,

            setLoading: (loading: boolean) => {
                set({isLoading: loading});
            },

            login: async (username: string, password: string) => {
                set({isLoading: true, errorMsg: ''});
                try {
                    const token = await authApi.login(username, password);
                    localStorage.setItem('token', token.access_token);
                    const user = await authApi.getCurrentUser();
                    set({user, isAuthenticated: true, isLoading: false, errorMsg: ''});
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
                setVisitorState(set);
            },

            loadUser: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    setVisitorState(set);
                    return;
                }

                set({isLoading: true, errorMsg: ''});
                try {
                    const user = await validateTokenAndGetUser(token);
                    set({user, isAuthenticated: true, isLoading: false, errorMsg: ''});
                } catch (error) {
                    localStorage.removeItem('token');
                    setVisitorState(set);
                    set({errorMsg: error instanceof Error ? error.message : '加载用户信息失败'});
                }
            },

            initializeAuth: async () => {
                const token = localStorage.getItem('token');

                if (!token) {
                    set({isInitialized: true, isLoading: false});
                    return;
                }

                try {
                    set({isLoading: true});
                    const user = await validateTokenAndGetUser(token);
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        isInitialized: true,
                        errorMsg: ''
                    });
                } catch (error) {
                    localStorage.removeItem('token');
                    setVisitorState(set);
                    set({
                        isInitialized: true,
                        errorMsg: error instanceof Error ? error.message : '恢复会话失败'
                    });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                isInitialized: state.isInitialized,
            }),
        }
    )
);

// Token 过期时间检查
export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const exp = payload.exp * 1000
        return Date.now() >= exp
    } catch {
        return true
    }
}