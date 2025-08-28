"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, FileText, Globe } from "lucide-react"
import { CreateImageForm } from "./create-image-form"
import {ImageConfig, ToolImage} from "@/types/tool.tsx";

interface ImageSelectionStepProps {
    selectedImage: ToolImage | null
    onImageSelect: (image: ToolImage) => void
}

export function ImageSelectionStep({ selectedImage, onImageSelect }: ImageSelectionStepProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateForm, setShowCreateForm] = useState(false)

    // 模拟镜像数据
    const [images] = useState<ToolImage[]>([
        {
            uid: "fastp-0.24.0",
            name: "FastP",
            version: "0.24.0",
            description: "FastP 是一个用于 FASTQ 数据的全功能预处理工具。它可以进行质量控制、过滤、修剪和许多其他操作。",
            homepage: "https://github.com/OpenGene/fastp",
            paper_link: "https://academic.oup.com/bioinformatics/article/34/17/i884/5093234",
            image: {
                registry: "docker.io",
                namespace: "staphb",
                repository: "fastp",
                tag: "0.24.0",
            },
        },
        {
            uid: "bwa-0.7.17",
            name: "BWA",
            version: "0.7.17",
            description: "BWA 是一个用于将序列与大型参考基因组（如人类基因组）进行比对的软件包。",
            homepage: "https://github.com/lh3/bwa",
            paper_link: "https://arxiv.org/abs/1303.3997",
            image: {
                registry: "docker.io",
                namespace: "biocontainers",
                repository: "bwa",
                tag: "0.7.17",
            },
        },
        {
            uid: "samtools-1.17",
            name: "SAMtools",
            version: "1.17",
            description:
                "SAMtools 是一套用于处理高通量测序数据的工具。它可以读取/写入/编辑/索引/查看 SAM/BAM/CRAM 格式文件。",
            homepage: "https://www.htslib.org/",
            paper_link: "https://academic.oup.com/bioinformatics/article/25/16/2078/204688",
            image: {
                registry: "docker.io",
                namespace: "staphb",
                repository: "samtools",
                tag: "1.17",
            },
        },
    ])

    // 过滤镜像
    const filteredImages = images.filter(
        (image) =>
            image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            image.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${image.image.namespace}/${image.image.repository}`.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // 获取完整镜像名称
    const getImageName = (imageConfig: ImageConfig) => {
        return `${imageConfig.registry}/${imageConfig.namespace}/${imageConfig.repository}:${imageConfig.tag}`
    }

    // 处理新建镜像成功
    const handleImageCreated = (newImage: ToolImage) => {
        setShowCreateForm(false)
        onImageSelect(newImage)
    }

    if (showCreateForm) {
        return (
            <div>
                <div className="mb-6">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)} className="mb-4">
                        ← 返回镜像选择
                    </Button>
                    <h2 className="text-xl font-semibold">创建新镜像</h2>
                    <p className="text-muted-foreground">配置一个新的 Docker 镜像</p>
                </div>
                <CreateImageForm onImageCreated={handleImageCreated} />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">选择 Docker 镜像</h2>
                <p className="text-muted-foreground">选择一个现有的镜像或创建新的镜像配置</p>
            </div>

            {/* 搜索栏 */}
            <div className="mb-6">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="搜索镜像名称、描述或仓库地址..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        新建镜像
                    </Button>
                </div>
            </div>

            {/* 镜像列表 */}
            <div className="space-y-4">
                {filteredImages.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="text-muted-foreground mb-4">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg mb-2">未找到匹配的镜像</p>
                                <p className="text-sm">尝试调整搜索条件，或者创建一个新的镜像配置</p>
                            </div>
                            <Button onClick={() => setShowCreateForm(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                创建新镜像
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredImages.map((image) => (
                            <Card
                                key={image.uid}
                                className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                                    selectedImage?.uid === image.uid
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => onImageSelect(image)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{image.name}</CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary">{image.version}</Badge>
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {image.image.namespace}/{image.image.repository}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <CardDescription className="text-sm mb-4 line-clamp-3">{image.description}</CardDescription>

                                    <div className="mb-4">
                                        <p className="text-xs text-muted-foreground mb-1">Docker 镜像</p>
                                        <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                                            {getImageName(image.image)}
                                        </code>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            {image.homepage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.open(image.homepage, "_blank")
                                                    }}
                                                >
                                                    <Globe className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {image.paper_link && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.open(image.paper_link, "_blank")
                                                    }}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={selectedImage?.uid === image.uid ? "default" : "outline"}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onImageSelect(image)
                                            }}
                                        >
                                            {selectedImage?.uid === image.uid ? "已选择" : "选择"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* 选择提示 */}
            {selectedImage && (
                <Card className="mt-6 border-primary/50 bg-primary/5">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="font-medium">已选择镜像: {selectedImage.name}</span>
                            <Badge variant="secondary">{selectedImage.version}</Badge>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
