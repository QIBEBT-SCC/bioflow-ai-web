"use client"

import {useState,useMemo} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {SearchIcon, PlusIcon, FileTextIcon, GlobeIcon} from "lucide-react"
import {CreateImageForm} from "./create-image-form"
import {ImageConfig} from "@/types/tool.tsx";
import {useCreateToolStore} from "@/stores/toolStore.tsx";
import {useSearchImages} from "@/hooks/use-tool.tsx";

export function ImageSelectionStep() {
    const [searchQuery, setSearchQuery] = useState("")
    const [showCreateForm, setShowCreateForm] = useState(false)

    const {currentImage, setCurrentImage} = useCreateToolStore()
    const {data: searchResults = []} = useSearchImages({name: searchQuery})

    // 获取完整镜像名称
    const getImageName = (imageConfig: ImageConfig) => {
        return `${imageConfig.registry}/${imageConfig.namespace}/${imageConfig.repository}:${imageConfig.tag}`
    }

    // 确保已选择的镜像始终包含在显示列表中
    const images = useMemo(() => {
        if (!currentImage?.uid) {
            return searchResults
        }

        const hasCurrentImage = searchResults.some(img => img.uid === currentImage.uid)
        if (hasCurrentImage) {
            return searchResults
        } else {
            return [currentImage, ...searchResults]
        }
    }, [searchResults, currentImage])

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
                <CreateImageForm/>
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
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                    <Input
                        placeholder="搜索镜像名称、描述或仓库地址..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* 镜像列表 */}
            <div className="space-y-4">
                {images.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="text-muted-foreground mb-4">
                                <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                                <p className="text-lg mb-2">未找到匹配的镜像</p>
                                <p className="text-sm">尝试调整搜索条件，或者创建一个新的镜像配置</p>
                            </div>
                            <Button onClick={() => setShowCreateForm(true)}>
                                <PlusIcon className="h-4 w-4 mr-2"/>
                                创建新镜像
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {images.map((image) => (
                            <Card
                                key={image.uid}
                                className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                                    currentImage?.uid === image.uid
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => setCurrentImage(image)}
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
                                                    <GlobeIcon className="h-4 w-4"/>
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
                                                    <FileTextIcon className="h-4 w-4"/>
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={currentImage?.uid === image.uid ? "default" : "outline"}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setCurrentImage(image)
                                            }}
                                        >
                                            {currentImage?.uid === image.uid ? "已选择" : "选择"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
