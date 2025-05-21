import {Check, ChevronDown, ChevronRight, Download} from "lucide-react"

import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {useState} from "react";

// 枚举类型定义
enum SampleFileType {
    SEQUENCING_R1 = 0,
    SEQUENCING_R2 = 1,
    SPECTRUM = 2,
    IMAGE = 3,
}

// 文件类型标签映射
const fileTypeLabels: Record<SampleFileType, string> = {
    [SampleFileType.SEQUENCING_R1]: "测序 R1",
    [SampleFileType.SEQUENCING_R2]: "测序 R2",
    [SampleFileType.SPECTRUM]: "光谱",
    [SampleFileType.IMAGE]: "图像",
}

// 文件类型颜色映射
const fileTypeColors: Record<SampleFileType, string> = {
    [SampleFileType.SEQUENCING_R1]: "bg-blue-100 text-blue-800",
    [SampleFileType.SEQUENCING_R2]: "bg-blue-100 text-blue-800",
    [SampleFileType.SPECTRUM]: "bg-purple-100 text-purple-800",
    [SampleFileType.IMAGE]: "bg-green-100 text-green-800",
}

// 示例数据
const sampleData = [
    {
        uid: "018e5a7d-0000-7000-8000-000000000001",
        owner_id: 1,
        project_id: 1,
        sample_name: "Patient_001",
        meta_data: {
            patient_id: "P001",
            collection_date: "2023-05-10",
            tissue_type: "Blood",
        },
        create_time: "2023-05-10T09:30:00Z",
        files: [
            {
                uid: "018e5a7d-0000-7000-8000-000000000101",
                sample_uid: "018e5a7d-0000-7000-8000-000000000001",
                data_type: SampleFileType.SEQUENCING_R1,
                file_path: "/data/samples/Patient_001_R1.fastq.gz",
                file_format: "FASTQ",
                file_size: 2500000000, // 2.5 GB
                md5_checksum: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
                uploaded_time: "2023-05-10T10:15:22Z",
            },
            {
                uid: "018e5a7d-0000-7000-8000-000000000102",
                sample_uid: "018e5a7d-0000-7000-8000-000000000001",
                data_type: SampleFileType.SEQUENCING_R2,
                file_path: "/data/samples/Patient_001_R2.fastq.gz",
                file_format: "FASTQ",
                file_size: 2400000000, // 2.4 GB
                md5_checksum: "p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1",
                uploaded_time: "2023-05-10T10:15:25Z",
            },
        ],
    },
    {
        uid: "018e5a7d-0000-7000-8000-000000000002",
        owner_id: 1,
        project_id: 1,
        sample_name: "Patient_002",
        meta_data: {
            patient_id: "P002",
            collection_date: "2023-05-12",
            tissue_type: "Tissue",
        },
        create_time: "2023-05-12T14:45:00Z",
        files: [
            {
                uid: "018e5a7d-0000-7000-8000-000000000201",
                sample_uid: "018e5a7d-0000-7000-8000-000000000002",
                data_type: SampleFileType.SEQUENCING_R1,
                file_path: "/data/samples/Patient_002_R1.fastq.gz",
                file_format: "FASTQ",
                file_size: 3100000000, // 3.1 GB
                md5_checksum: "q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
                uploaded_time: "2023-05-12T15:30:45Z",
            },
            {
                uid: "018e5a7d-0000-7000-8000-000000000202",
                sample_uid: "018e5a7d-0000-7000-8000-000000000002",
                data_type: SampleFileType.SEQUENCING_R2,
                file_path: "/data/samples/Patient_002_R2.fastq.gz",
                file_format: "FASTQ",
                file_size: 3000000000, // 3.0 GB
                md5_checksum: "f6e5d4c3b2a1z0y9x8w7v6u5t4s3r2q1",
                uploaded_time: "2023-05-12T15:30:48Z",
            },
            {
                uid: "018e5a7d-0000-7000-8000-000000000203",
                sample_uid: "018e5a7d-0000-7000-8000-000000000002",
                data_type: SampleFileType.IMAGE,
                file_path: "/data/samples/Patient_002_histology.tiff",
                file_format: "TIFF",
                file_size: 250000000, // 250 MB
                md5_checksum: "g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6",
                uploaded_time: "2023-05-12T16:15:30Z",
            },
        ],
    },
    {
        uid: "018e5a7d-0000-7000-8000-000000000003",
        owner_id: 2,
        project_id: 1,
        sample_name: "Patient_003",
        meta_data: {
            patient_id: "P003",
            collection_date: "2023-05-15",
            tissue_type: "Plasma",
        },
        create_time: "2023-05-15T11:20:00Z",
        files: [
            {
                uid: "018e5a7d-0000-7000-8000-000000000301",
                sample_uid: "018e5a7d-0000-7000-8000-000000000003",
                data_type: SampleFileType.SPECTRUM,
                file_path: "/data/samples/Patient_003_spectrum.mzML",
                file_format: "mzML",
                file_size: 1200000000, // 1.2 GB
                md5_checksum: "w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6",
                uploaded_time: "2023-05-15T12:45:33Z",
            },
        ],
    },
    {
        uid: "018e5a7d-0000-7000-8000-000000000004",
        owner_id: 2,
        project_id: 2,
        sample_name: "Patient_004",
        meta_data: {
            patient_id: "P004",
            collection_date: "2023-05-18",
            tissue_type: "Blood",
        },
        create_time: "2023-05-18T09:15:00Z",
        files: [
            {
                uid: "018e5a7d-0000-7000-8000-000000000401",
                sample_uid: "018e5a7d-0000-7000-8000-000000000004",
                data_type: SampleFileType.SEQUENCING_R1,
                file_path: "/data/samples/Patient_004_R1.fastq.gz",
                file_format: "FASTQ",
                file_size: 1800000000, // 1.8 GB
                md5_checksum: "m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6",
                uploaded_time: "2023-05-18T10:22:17Z",
            },
            {
                uid: "018e5a7d-0000-7000-8000-000000000402",
                sample_uid: "018e5a7d-0000-7000-8000-000000000004",
                data_type: SampleFileType.SEQUENCING_R2,
                file_path: "/data/samples/Patient_004_R2.fastq.gz",
                file_format: "FASTQ",
                file_size: 1700000000, // 1.7 GB
                md5_checksum: "b6a5z4y3x2w1v0u9t8s7r6q5p4o3n2m1",
                uploaded_time: "2023-05-18T10:22:20Z",
            },
            {
                uid: "018e5a7d-0000-7000-8000-000000000403",
                sample_uid: "018e5a7d-0000-7000-8000-000000000004",
                data_type: SampleFileType.IMAGE,
                file_path: "/data/samples/Patient_004_histology.tiff",
                file_format: "TIFF",
                file_size: 320000000, // 320 MB
                md5_checksum: "c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6",
                uploaded_time: "2023-05-18T11:30:15Z",
            },
            {
                uid: "018e5a7d-0000-7000-8000-000000000404",
                sample_uid: "018e5a7d-0000-7000-8000-000000000004",
                data_type: SampleFileType.SPECTRUM,
                file_path: "/data/samples/Patient_004_spectrum.mzML",
                file_format: "mzML",
                file_size: 950000000, // 950 MB
                md5_checksum: "s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6",
                uploaded_time: "2023-05-18T12:15:40Z",
            },
        ],
    },
]

// 格式化文件大小
function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function ProjectResourcesList() {
    const [expandedSamples, setExpandedSamples] = useState<Record<string, boolean>>({})

    // 切换样本展开状态
    const toggleSampleExpand = (sampleUid: string) => {
        setExpandedSamples((prev) => ({
            ...prev,
            [sampleUid]: !prev[sampleUid],
        }))
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle>样本文件</CardTitle>
                <CardDescription>显示所有原始数据文件及其详细信息</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead className="w-[180px]">样本名称</TableHead>
                            <TableHead>元数据</TableHead>
                            <TableHead className="w-[180px]">创建时间</TableHead>
                            <TableHead className="w-[100px]">文件数量</TableHead>
                            <TableHead className="w-[100px]">总大小</TableHead>
                            <TableHead className="w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sampleData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    没有找到符合条件的样本
                                </TableCell>
                            </TableRow>
                        ) : (
                            sampleData.map((sample) => (
                                <>
                                    <TableRow key={sample.uid} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell onClick={() => toggleSampleExpand(sample.uid)}>
                                            {expandedSamples[sample.uid] ? (
                                                <ChevronDown className="h-4 w-4"/>
                                            ) : (
                                                <ChevronRight className="h-4 w-4"/>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium" onClick={() => toggleSampleExpand(sample.uid)}>
                                            {sample.sample_name}
                                        </TableCell>
                                        <TableCell onClick={() => toggleSampleExpand(sample.uid)}>
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(sample.meta_data).map(([key, value]) => (
                                                    <Badge key={key} variant="outline" className="text-xs">
                                                        {key}: {value}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell onClick={() => toggleSampleExpand(sample.uid)}>
                                            {new Date(sample.create_time).toLocaleString()}
                                        </TableCell>
                                        <TableCell onClick={() => toggleSampleExpand(sample.uid)}>{sample.files.length}</TableCell>
                                        <TableCell onClick={() => toggleSampleExpand(sample.uid)}>
                                            {formatFileSize(sample.files.reduce((sum, file) => sum + file.file_size, 0))}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon">
                                                <Download className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    {expandedSamples[sample.uid] && (
                                        <TableRow className="bg-muted/30">
                                            <TableCell colSpan={7} className="p-0">
                                                <div className="p-4">
                                                    <h4 className="text-sm font-semibold mb-2">样本文件</h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-[120px]">文件类型</TableHead>
                                                                <TableHead>文件路径</TableHead>
                                                                <TableHead className="w-[100px]">格式</TableHead>
                                                                <TableHead className="w-[100px]">大小</TableHead>
                                                                <TableHead className="w-[120px]">MD5校验</TableHead>
                                                                <TableHead className="w-[180px]">上传时间</TableHead>
                                                                <TableHead className="w-[80px]">操作</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {sample.files.map((file) => (
                                                                <TableRow key={file.uid}>
                                                                    <TableCell>
                                                                        <Badge className={fileTypeColors[file.data_type]}>
                                                                            {fileTypeLabels[file.data_type]}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-xs">{file.file_path}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline">{file.file_format}</Badge>
                                                                    </TableCell>
                                                                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center">
                                                                            <Check className="h-4 w-4 text-green-500 mr-1"/>
                                                                            <span className="text-xs truncate w-16"
                                                                                  title={file.md5_checksum}>{file.md5_checksum.substring(0, 8)}...
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">
                                                                        {new Date(file.uploaded_time).toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Button variant="ghost" size="icon">
                                                                            <Download className="h-4 w-4"/>
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}