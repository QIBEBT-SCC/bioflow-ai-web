"use client"

import type React from "react"

import {useState, useRef} from "react"
import {Button} from "@/components/ui/button.tsx"
import {Badge} from "@/components/ui/badge.tsx"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx"
import {FileText, Upload, X} from "lucide-react"

interface FileUploaderProps {
    files: { file: File; type: string }[]
    onAddFile: (file: File, type: string) => void
    onRemoveFile: (index: number) => void
}

export function FileUploader({files, onAddFile, onRemoveFile}: FileUploaderProps) {
    const [selectedType, setSelectedType] = useState("0")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onAddFile(e.target.files[0], selectedType)
            // Reset the input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    // Format file size to human readable format
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const FILE_TYPES = [
        {value: "0", label: "测序数据 R1"},
        {value: "1", label: "测序数据 R2"},
        {value: "2", label: "光谱数据"},
        {value: "3", label: "图像数据"},
    ]

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="选择文件类型"/>
                    </SelectTrigger>
                    <SelectContent>
                        {FILE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex-1">
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange}/>
                    <Button type="button" variant="outline" className="w-full" onClick={triggerFileInput}>
                        <Upload className="mr-2 h-4 w-4"/>
                        选择文件
                    </Button>
                </div>
            </div>

            {files.length > 0 && (
                <div className="rounded-md border">
                    <div className="p-4">
                        <h4 className="mb-2 font-medium">已选文件</h4>
                        <ul className="space-y-2">
                            {files.map((fileItem, index) => {
                                const fileType = FILE_TYPES.find((t) => t.value === fileItem.type)?.label || "未知类型"

                                return (
                                    <li key={index} className="flex items-center justify-between rounded-md border p-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4"/>
                                            <span className="font-medium">{fileItem.file.name}</span>
                                            <Badge variant="outline">{fileType}</Badge>
                                            <span className="text-sm text-muted-foreground">{formatFileSize(fileItem.file.size)}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => onRemoveFile(index)}
                                        >
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
