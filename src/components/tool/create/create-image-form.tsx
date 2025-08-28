"use client"

import type React from "react"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {Card, CardContent} from "@/components/ui/card"
import {SaveIcon, HelpCircleIcon, ExternalLinkIcon} from 'lucide-react'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {ToolImage} from "@/types/tool.tsx";


interface CreateImageFormProps {
    onImageCreated: (image: ToolImage) => void
}

export function CreateImageForm({onImageCreated}: CreateImageFormProps) {
    const [image, setImage] = useState<ToolImage>({
        name: "",
        version: "",
        description: "",
        homepage: "",
        paper_link: "",
        image: {
            registry: "docker.io",
            namespace: "library",
            repository: "",
            tag: "latest",
        },
    })

    // 从镜像字符串解析配置
    const parseImageString = (imageStr: string) => {
        try {
            const imageGroup = imageStr.split(":")
            const tag = imageGroup.length > 1 ? imageGroup[1] : "latest"
            const urlGroup = imageGroup[0].split("/")

            let registry = "docker.io"
            let namespace = "library"
            let repository = ""

            switch (urlGroup.length) {
                case 3:
                    registry = urlGroup[0]
                    namespace = urlGroup[1]
                    repository = urlGroup[2]
                    break
                case 2:
                    namespace = urlGroup[0]
                    repository = urlGroup[1]
                    break
                case 1:
                    repository = urlGroup[0]
                    break
                default:
                    throw new Error("Invalid image format")
            }

            return {registry, namespace, repository, tag}
        } catch (error) {
            console.error("解析镜像字符串失败:", error)
            return null
        }
    }

    // 处理镜像字符串输入
    const handleImageStringChange = (imageStr: string) => {
        const parsed = parseImageString(imageStr)
        if (parsed && image.image) {
            setImage({
                ...image,
                image: parsed,
            })
        }
    }

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // 这里添加向后端发送数据的逻辑
            console.log("提交的镜像配置:", image)

            // 暂时直接调用回调
            onImageCreated({...image})
        } catch (error) {
            console.error("提交镜像配置时出错:", error)
            alert("创建镜像时出错，请重试")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardContent className="space-y-6">
                    {/* 快速输入 */}
                    <div className="space-y-2">
                        <Label htmlFor="image_string">
                            镜像地址（快速输入）
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircleIcon className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            输入完整的镜像地址，系统会自动解析各个字段。 格式：[registry]/[namespace]/repository:tag
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Input
                            id="image_string"
                            placeholder="例如: docker.io/staphb/fastp:0.24.0"
                            onChange={(e) => handleImageStringChange(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                工具名称 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={image.name}
                                onChange={(e) => setImage({...image, name: e.target.value})}
                                placeholder="例如: FastP"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="version">
                                版本 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="version"
                                value={image.version}
                                onChange={(e) => setImage({...image, version: e.target.value})}
                                placeholder="例如: 0.24.0"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            描述 <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={image.description}
                            onChange={(e) => setImage({...image, description: e.target.value})}
                            placeholder="工具的详细描述，包括主要功能和用途"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="homepage">
                                官方主页
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircleIcon className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>工具的官方网站或 GitHub 仓库地址</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <div className="flex">
                                <Input
                                    id="homepage"
                                    value={image.homepage}
                                    onChange={(e) => setImage({...image, homepage: e.target.value})}
                                    placeholder="https://github.com/OpenGene/fastp"
                                    type="url"
                                />
                                {image.homepage && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="ml-2 bg-transparent"
                                        onClick={() => window.open(image.homepage, "_blank")}
                                    >
                                        <ExternalLinkIcon className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paper_link">
                                相关论文
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircleIcon className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>工具相关的学术论文链接</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <div className="flex">
                                <Input
                                    id="paper_link"
                                    value={image.paper_link}
                                    onChange={(e) => setImage({...image, paper_link: e.target.value})}
                                    placeholder="https://academic.oup.com/bioinformatics/..."
                                    type="url"
                                />
                                {image.paper_link && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="ml-2 bg-transparent"
                                        onClick={() => window.open(image.paper_link, "_blank")}
                                    >
                                        <ExternalLinkIcon className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    <SaveIcon className="h-4 w-4 mr-2"/>
                    创建镜像
                </Button>
            </div>
        </form>
    )
}
