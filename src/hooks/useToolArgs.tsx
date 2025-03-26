import { useEffect } from 'react';
import { toolApi } from '@/services/api';
import { useToolStore } from '@/stores/toolStore.tsx';

export function useToolArgs() {
    const { defaultArgs, setDefaultArgs } = useToolStore();

    useEffect(() => {
        if (!defaultArgs) {
            toolApi.getDefaultArgs().then(setDefaultArgs);
        }
    }, []);

    return defaultArgs;
} 