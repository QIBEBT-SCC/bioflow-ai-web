"use client"

import {useState} from "react"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {DatabasesList} from "@/components/resource/databases/databases-list"
import {DatabaseDetail} from "@/components/resource/databases/database-detail"
import {PlusCircle, Search} from "lucide-react"
import {DatabaseAddDialog} from "@/components/resource/databases/database-add-dialog"

export function DatabasesManager() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDbId, setSelectedDbId] = useState<number | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="搜索数据库..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    添加数据库
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardContent className="p-4">
                        <DatabasesList
                            searchQuery={searchQuery}
                            onSelectDatabase={(id) => setSelectedDbId(id)}
                            selectedDbId={selectedDbId}
                        />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardContent className="p-4">
                        {selectedDbId !== null ? (
                            <DatabaseDetail databaseId={selectedDbId}/>
                        ) : (
                            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                                请选择一个数据库查看详情
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DatabaseAddDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}/>
        </div>
    )
}
