import React, {createContext, useContext, useEffect, ReactNode} from 'react';
import {useAuthStore} from '@/stores/authStore';
import {useTokenRefresh} from '@/hooks/use-token-refresh';

interface AuthContextType {
    isAuthenticated: boolean;
    isInitialized: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    const {initializeAuth, isInitialized, isLoading, isAuthenticated} = useAuthStore();

    // 使用token刷新钩子
    useTokenRefresh();

    useEffect(() => {
        if (!isInitialized) {
            initializeAuth();
        }
    }, [isInitialized, initializeAuth]);

    const value: AuthContextType = {
        isAuthenticated,
        isInitialized,
        isLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
