import {useCallback} from 'react';
import {useAuthStore} from '@/stores/authStore';
import {useNavigate} from 'react-router-dom';

export const useAuth = () => {
    const {
        user,
        isAuthenticated,
        isLoading,
        errorMsg,
        login: storeLogin,
        logout: storeLogout,
        setLoading
    } = useAuthStore();

    const navigate = useNavigate();

    // 登录处理
    const login = useCallback(async (username: string, password: string) => {
        try {
            setLoading(true);
            await storeLogin(username, password);
            navigate('/home');
        } catch (error) {
            // 错误已经在store中处理
            console.error('登录失败:', error);
        }
    }, [storeLogin, navigate, setLoading]);

    // 登出处理
    const logout = useCallback(() => {
        storeLogout();
        navigate('/login');
    }, [storeLogout, navigate]);

    return {
        user,
        isAuthenticated,
        isLoading,
        errorMsg,
        login,
        logout,
        setLoading
    };
};
