import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"

export default function TaskPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Tasks Page</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Tasks page content will be implemented here.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

