import { useEffect } from 'react';
import { toolApi } from '@/services/api';
import { useToolStore } from '@/stores/toolStore.tsx';

export function useToolArgs() {
    const { defaultArgs, setDefaultArgs } = useToolStore();

    useEffect(() => {
        if (Object.keys(defaultArgs).length === 0) {
            toolApi.getDefaultArgs().then(setDefaultArgs);
        }
    }, [defaultArgs, setDefaultArgs]);

    return defaultArgs;
} 