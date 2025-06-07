"use client"

import type React from "react"

import {useState, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {BioDb} from "@/types/resource.tsx";

interface DatabaseEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    database: BioDb
}

export function DatabaseEditDialog({open, onOpenChange, database}: DatabaseEditDialogProps) {
    const [name, setName] = useState(database.name)
    const [description, setDescription] = useState(database.description)
    const [path, setPath] = useState(database.path)
    const [lastUpdate, setLastUpdate] = useState(database.last_update)

    // Update form when database changes
    useEffect(() => {
        if (open) {
            setName(database.name)
            setDescription(database.description)
            setPath(database.path)
            setLastUpdate(database.last_update)
        }
    }, [database, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would implement the actual database update logic
        console.log({
            id: database.id,
            name: name,
            description: description,
            path: path,
            last_update: lastUpdate,
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>编辑数据库</DialogTitle>
                        <DialogDescription>修改数据库信息。所有带 * 的字段为必填项。</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">数据库名称 *</Label>
                            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required/>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">描述</Label>
                            <Textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-path">文件路径 *</Label>
                            <Input id="edit-path" value={path} onChange={(e) => setPath(e.target.value)} required/>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="version">更新时间</Label>
                            <Input id="version" value={lastUpdate} onChange={(e) => setLastUpdate(e.target.value)}/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit">保存更改</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
