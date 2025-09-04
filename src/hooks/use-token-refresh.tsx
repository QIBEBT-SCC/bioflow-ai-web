import {useEffect, useRef} from 'react';
import {useAuthStore} from '@/stores/authStore';
import {isTokenExpired} from '@/stores/authStore';

export const useTokenRefresh = () => {
    const {loadUser, logout} = useAuthStore();
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkAndRefreshToken = () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                return;
            }

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const exp = payload.exp * 1000; // 转换为毫秒
                const now = Date.now();
                const timeUntilExpiry = exp - now;

                // 如果token在5分钟内过期，尝试刷新
                if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0) {
                    loadUser().catch(() => {
                        // 如果刷新失败，登出用户
                        logout();
                    });
                }

                // 如果token已经过期，立即登出
                if (timeUntilExpiry <= 0) {
                    logout();
                    return;
                }

                // 设置下次检查时间（在token过期前5分钟）
                const nextCheckTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000); // 至少1分钟后检查
                
                if (refreshTimerRef.current) {
                    clearTimeout(refreshTimerRef.current);
                }

                refreshTimerRef.current = setTimeout(checkAndRefreshToken, nextCheckTime);
            } catch (error) {
                console.error('Token解析失败:', error);
                logout();
            }
        };

        // 立即检查一次
        checkAndRefreshToken();

        // 清理定时器
        return () => {
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [loadUser, logout]);

    return null;
};
