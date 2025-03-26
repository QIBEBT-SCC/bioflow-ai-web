import {MainLayout} from "@/pages/main-layout.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useToolArgs} from '@/hooks/useToolArgs';

const queryClient = new QueryClient()

function App() {
    useToolArgs();

    return (
        <QueryClientProvider client={queryClient}>
            <MainLayout />
        </QueryClientProvider>
    );
}

export default App;
