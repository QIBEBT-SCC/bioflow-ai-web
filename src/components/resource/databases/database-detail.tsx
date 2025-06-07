"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {Edit, Trash2} from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {DatabaseEditDialog} from "@/components/resource/databases/database-edit-dialog"
import {useDB} from "@/hooks/use-resource.tsx";


interface DatabaseDetailProps {
    databaseId: number
}

export function DatabaseDetail({databaseId}: DatabaseDetailProps) {
    const {data: database} = useDB(databaseId);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    if (!database) {
        return (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">数据库不存在或已被删除</div>
        )
    }

    const confirmDelete = () => {
        // Here you would implement the actual deletion logic
        console.log(`Deleting database: ${databaseId}`)
        setIsDeleteDialogOpen(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{database.name}</h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4"/>
                        编辑
                    </Button>
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4"/>
                        删除
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="col-span-2">
                            <dt className="text-sm font-medium text-muted-foreground">描述</dt>
                            <dd className="mt-1 text-sm">{database.description}</dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-sm font-medium text-muted-foreground">路径</dt>
                            <dd className="mt-1 text-sm font-mono bg-muted p-1 rounded">{database.path}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">大小</dt>
                            <dd className="mt-1 text-sm">{database.size}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">最后更新</dt>
                            <dd className="mt-1 text-sm">{database.last_update}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除数据库</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作将从系统中移除此数据库的引用。数据库文件本身不会被删除，但系统将无法再访问它。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DatabaseEditDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} database={database}/>
        </div>
    )
}
