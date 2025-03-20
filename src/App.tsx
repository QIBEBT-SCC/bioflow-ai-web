import {MainLayout} from "@/pages/main-layout.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <MainLayout/>
        </QueryClientProvider>

    )
}

export default App
