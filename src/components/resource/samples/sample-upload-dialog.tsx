"use client"

import type React from "react"

import {useState} from "react"
import {Button} from "@/components/ui/button.tsx"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx"
import {Input} from "@/components/ui/input.tsx"
import {Label} from "@/components/ui/label.tsx"
import {Textarea} from "@/components/ui/textarea.tsx"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx"
import {FileUploader} from "@/components/resource/samples/file-uploader.tsx"

interface SampleUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SampleUploadDialog({open, onOpenChange}: SampleUploadDialogProps) {
    const [sampleName, setSampleName] = useState("")
    const [projectId, setProjectId] = useState("")
    const [species, setSpecies] = useState("")
    const [tissue, setTissue] = useState("")
    const [additionalInfo, setAdditionalInfo] = useState("")
    const [files, setFiles] = useState<{ file: File; type: string }[]>([])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would implement the actual upload logic
        console.log({
            sampleName,
            projectId,
            species,
            tissue,
            additionalInfo,
            files,
        })
        onOpenChange(false)
    }

    const addFile = (file: File, type: string) => {
        setFiles((prev) => [...prev, {file, type}])
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    // Mock projects for demonstration
    const MOCK_PROJECTS = [
        {id: "1", name: "项目 1"},
        {id: "2", name: "项目 2"},
        {id: "3", name: "项目 3"},
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>上传新样本</DialogTitle>
                        <DialogDescription>填写样本信息并上传相关文件。所有带 * 的字段为必填项。</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sample-name">样本名称 *</Label>
                                <Input id="sample-name" value={sampleName} onChange={(e) => setSampleName(e.target.value)} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="project">项目 *</Label>
                                <Select value={projectId} onValueChange={setProjectId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择项目"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MOCK_PROJECTS.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="species">物种</Label>
                                <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tissue">组织类型</Label>
                                <Input id="tissue" value={tissue} onChange={(e) => setTissue(e.target.value)}/>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="additional-info">附加信息</Label>
                            <Textarea
                                id="additional-info"
                                value={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>样本文件</Label>
                            <FileUploader files={files} onAddFile={addFile} onRemoveFile={removeFile}/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit">上传样本</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
