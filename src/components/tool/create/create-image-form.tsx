"use client"

import type React from "react"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {Card, CardContent} from "@/components/ui/card"
import {SaveIcon, HelpCircleIcon, ExternalLinkIcon} from 'lucide-react'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {useCreateImage} from "@/hooks/use-tool.tsx";
import {useCreateToolStore} from "@/stores/toolStore.tsx";
import {useTranslation} from "react-i18next";


export function CreateImageForm() {
    const {t} = useTranslation();
    const {currentImage, setCurrentImage} = useCreateToolStore()

    const createImageMutation = useCreateImage()

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
        if (parsed && currentImage.image) {
            setCurrentImage({
                ...currentImage,
                image: parsed,
                name: parsed.repository,
                version: parsed.tag
            })
        }
    }

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const new_image = await createImageMutation.mutateAsync({image: currentImage})
            setCurrentImage(new_image)
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
                            {t('tool.create.image_form.image_address')}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircleIcon className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            {t('tool.create.image_form.image_address_tooltip')}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Input
                            id="image_string"
                            placeholder={t('tool.create.image_form.image_address_placeholder')}
                            onChange={(e) => handleImageStringChange(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {t('tool.create.image_form.tool_name')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={currentImage.name}
                                onChange={(e) => setCurrentImage({...currentImage, name: e.target.value})}
                                placeholder={t('tool.create.image_form.tool_name_placeholder')}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="version">
                                {t('tool.create.image_form.version')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="version"
                                value={currentImage.version}
                                onChange={(e) => setCurrentImage({...currentImage, version: e.target.value})}
                                placeholder={t('tool.create.image_form.version_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            {t('tool.create.image_form.description')} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={currentImage.description}
                            onChange={(e) => setCurrentImage({...currentImage, description: e.target.value})}
                            placeholder={t('tool.create.image_form.description_placeholder')}
                            rows={4}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="homepage">
                                {t('tool.create.image_form.homepage')}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircleIcon className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('tool.create.image_form.homepage_tooltip')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <div className="flex">
                                <Input
                                    id="homepage"
                                    value={currentImage.homepage}
                                    onChange={(e) => setCurrentImage({...currentImage, homepage: e.target.value})}
                                    placeholder={t('tool.create.image_form.homepage_placeholder')}
                                    type="url"
                                />
                                {currentImage.homepage && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="ml-2 bg-transparent"
                                        onClick={() => window.open(currentImage.homepage, "_blank")}
                                    >
                                        <ExternalLinkIcon className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paper_link">
                                {t('tool.create.image_form.paper_link')}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircleIcon className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('tool.create.image_form.paper_link_tooltip')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Label>
                            <div className="flex">
                                <Input
                                    id="paper_link"
                                    value={currentImage.paper_link}
                                    onChange={(e) => setCurrentImage({...currentImage, paper_link: e.target.value})}
                                    placeholder={t('tool.create.image_form.paper_link_placeholder')}
                                    type="url"
                                />
                                {currentImage.paper_link && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="ml-2 bg-transparent"
                                        onClick={() => window.open(currentImage.paper_link, "_blank")}
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
                    {t('tool.create.image_form.create_image')}
                </Button>
            </div>
        </form>
    )
}
