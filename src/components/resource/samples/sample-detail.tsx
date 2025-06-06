"use client"

import {useState} from "react"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx"
import {Button} from "@/components/ui/button.tsx"
import {Badge} from "@/components/ui/badge.tsx"
import {Card, CardContent} from "@/components/ui/card.tsx"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx"
import {Download, FileText, ImageIcon, Upload, X} from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx"

// Mock data for demonstration
const SAMPLE_FILE_TYPES = {
    0: {name: "测序数据 R1", icon: <FileText className="h-4 w-4"/>},
    1: {name: "测序数据 R2", icon: <FileText className="h-4 w-4"/>},
    2: {name: "光谱数据", icon: <FileText className="h-4 w-4"/>},
    3: {name: "图像数据", icon: <ImageIcon className="h-4 w-4"/>},
}

const MOCK_SAMPLE = {
    uid: "sample-1",
    sample_name: "样本 1",
    project_name: "项目 1",
    owner_name: "用户 A",
    create_time: "2023-05-15T08:30:00Z",
    meta_data: {
        species: "人类",
        tissue: "血液",
        collection_date: "2023-05-10",
        additional_info: "健康对照组",
    },
}

const MOCK_FILES = [
    {
        uid: "file-1",
        data_type: 0,
        file_path: "/data/samples/sample1_R1.fastq.gz",
        file_format: "FASTQ",
        file_size: 2500000000,
        md5_checksum: "a1b2c3d4e5f6g7h8i9j0",
        uploaded_time: "2023-05-15T09:15:00Z",
    },
    {
        uid: "file-2",
        data_type: 1,
        file_path: "/data/samples/sample1_R2.fastq.gz",
        file_format: "FASTQ",
        file_size: 2400000000,
        md5_checksum: "k1l2m3n4o5p6q7r8s9t0",
        uploaded_time: "2023-05-15T09:15:00Z",
    },
    {
        uid: "file-3",
        data_type: 3,
        file_path: "/data/samples/sample1_image.tiff",
        file_format: "TIFF",
        file_size: 150000000,
        md5_checksum: "u1v2w3x4y5z6a7b8c9d0",
        uploaded_time: "2023-05-15T10:30:00Z",
    },
]

export function SampleDetail() {
    const [activeTab, setActiveTab] = useState("info")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [fileToDelete, setFileToDelete] = useState<string | null>(null)

    // Format file size to human readable format
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    // Format date to local format
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    const handleDeleteFile = (fileId: string) => {
        setFileToDelete(fileId)
        setIsDeleteDialogOpen(true)
    }

    const confirmDeleteFile = () => {
        // Here you would implement the actual file deletion logic
        console.log(`Deleting file: ${fileToDelete}`)
        setIsDeleteDialogOpen(false)
        setFileToDelete(null)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{MOCK_SAMPLE.sample_name}</h2>
                    <p className="text-muted-foreground">
                        项目: {MOCK_SAMPLE.project_name} | 创建时间: {formatDate(MOCK_SAMPLE.create_time)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4"/>
                        添加文件
                    </Button>
                    <Button variant="destructive">
                        <X className="mr-2 h-4 w-4"/>
                        删除样本
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="info">基本信息</TabsTrigger>
                    <TabsTrigger value="files">文件管理</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">样本 ID</dt>
                                    <dd className="mt-1 text-sm">{MOCK_SAMPLE.uid}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">所有者</dt>
                                    <dd className="mt-1 text-sm">{MOCK_SAMPLE.owner_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">物种</dt>
                                    <dd className="mt-1 text-sm">{MOCK_SAMPLE.meta_data.species}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">组织类型</dt>
                                    <dd className="mt-1 text-sm">{MOCK_SAMPLE.meta_data.tissue}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">采集日期</dt>
                                    <dd className="mt-1 text-sm">{MOCK_SAMPLE.meta_data.collection_date}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">附加信息</dt>
                                    <dd className="mt-1 text-sm">{MOCK_SAMPLE.meta_data.additional_info}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="files">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>类型</TableHead>
                                    <TableHead>文件名</TableHead>
                                    <TableHead>格式</TableHead>
                                    <TableHead>大小</TableHead>
                                    <TableHead>上传时间</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_FILES.map((file) => (
                                    <TableRow key={file.uid}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {SAMPLE_FILE_TYPES[file.data_type as keyof typeof SAMPLE_FILE_TYPES].icon}
                                                <span>{SAMPLE_FILE_TYPES[file.data_type as keyof typeof SAMPLE_FILE_TYPES].name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{file.file_path.split("/").pop()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{file.file_format}</Badge>
                                        </TableCell>
                                        <TableCell>{formatFileSize(file.file_size)}</TableCell>
                                        <TableCell>{formatDate(file.uploaded_time)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon">
                                                    <Download className="h-4 w-4"/>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteFile(file.uid)}
                                                >
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除文件</AlertDialogTitle>
                        <AlertDialogDescription>此操作无法撤销。这将永久删除此文件及其所有相关数据。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteFile} className="bg-destructive text-destructive-foreground">
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
