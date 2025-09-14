"use client"

import {useCallback, useState} from "react"
import {useDropzone} from "react-dropzone"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"

import {Upload, File, ImageIcon, X, CheckCircle} from "lucide-react"
import {useTranslation} from "react-i18next"

interface FileUploadProps {
    onFileUpload: (files: File[]) => void
    maxFiles?: number
    maxSize?: number // in bytes
    acceptedTypes?: string[]
    disabled?: boolean
}

export function FileUpload({
                               onFileUpload,
                               maxFiles = 5,
                               maxSize = 10 * 1024 * 1024, // 10MB
                               acceptedTypes = ["image/*", "text/*", ".pdf", ".doc", ".docx"],
                               disabled = false,
                           }: FileUploadProps) {
    const {t} = useTranslation();
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const validFiles = acceptedFiles.filter((file) => {
                if (file.size > maxSize) {
                    console.error(`文件 ${file.name} 超过大小限制`)
                    return false
                }
                return true
            })

            if (validFiles.length > 0) {
                setUploadedFiles((prev) => [...prev, ...validFiles])
                // 立即调用回调函数，让父组件处理文件上传
                onFileUpload(validFiles)
            }
        },
        [maxSize, onFileUpload],
    )

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        maxFiles,
        disabled,
        accept: acceptedTypes.reduce(
            (acc, type) => {
                acc[type] = []
                return acc
            },
            {} as Record<string, string[]>,
        ),
    })

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const formatFileSize = (bytes: number) => {
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    }

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) {
            return <ImageIcon className="w-5 h-5 text-blue-500"/>
        }
        return <File className="w-5 h-5 text-gray-500"/>
    }

    return (
        <Card className="p-6">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed border-accent/50 rounded-lg p-8 text-center transition-colors ${
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-accent cursor-pointer"
                } ${
                    isDragActive ? "border-accent bg-accent/5" : ""
                }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-accent"/>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium">
                            {disabled
                                ? t('chat.file_upload_disabled')
                                : isDragActive
                                    ? t('chat.drag_files_here')
                                    : t('chat.drag_or_click_upload')
                            }
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{t('chat.supported_formats', {size: formatFileSize(maxSize)})}</p>
                    </div>
                    <Button variant="outline" size="sm" disabled={disabled}>
                        {t('chat.select_files')}
                    </Button>
                </div>
            </div>

            {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium">{t('chat.selected_files', {count: uploadedFiles.length})}</h4>
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeFile(index)}
                                        className="h-6 w-6 p-0"
                                        disabled={disabled}
                                    >
                                        <X className="w-3 h-3"/>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <CheckCircle className="w-3 h-3 text-green-500"/>
                                    <span className="text-xs text-green-600">{t('chat.file_selected')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
