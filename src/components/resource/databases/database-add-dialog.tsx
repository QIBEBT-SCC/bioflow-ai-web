"use client"

import type React from "react"

import {useState} from "react"
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

interface DatabaseAddDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DatabaseAddDialog({open, onOpenChange}: DatabaseAddDialogProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [path, setPath] = useState("")
    const [version, setVersion] = useState("")
    const [source, setSource] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would implement the actual database addition logic
        console.log({
            name,
            description,
            path,
            version,
            source,
        })
        onOpenChange(false)

        // Reset form
        setName("")
        setDescription("")
        setPath("")
        setVersion("")
        setSource("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>添加新数据库</DialogTitle>
                        <DialogDescription>添加生物信息数据库的引用。所有带 * 的字段为必填项。</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">数据库名称 *</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required/>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">描述</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="path">文件路径 *</Label>
                            <Input id="path" value={path} onChange={(e) => setPath(e.target.value)} required/>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="version">版本</Label>
                                <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="source">来源</Label>
                                <Input id="source" value={source} onChange={(e) => setSource(e.target.value)}/>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit">添加数据库</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
