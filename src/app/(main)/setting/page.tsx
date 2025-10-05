import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"

export default function SettingPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Settings Page</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Settings page content will be implemented here.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

