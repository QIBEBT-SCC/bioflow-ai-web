"use client"


import {useState} from "react"
import {ArrowLeftIcon, ArrowRightIcon, CheckIcon} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {Link, useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {ImageSelectionStep} from "@/components/tool/create/image-select-step.tsx";
import {ToolConfigurationStep} from "@/components/tool/create/tool-config-step.tsx";
import {CreateConfirmationStep} from "@/components/tool/create/create-confirm-step.tsx";
import {useCreateToolStore} from "@/stores/toolStore.tsx";
import {toast} from "sonner";
import {useCreateTool} from "@/hooks/use-tool.tsx";

const steps = [
    {id: 1, title: "选择镜像", description: "选择或创建 Docker 镜像"},
    {id: 2, title: "配置工具", description: "设置工具参数和命令"},
    {id: 3, title: "确认创建", description: "确认配置并创建工具"},
]

export function AddToolPage() {
    const {t} = useTranslation();

    const [currentStep, setCurrentStep] = useState(1)

    const {currentImage, toolConfig,} = useCreateToolStore()
    const {mutate: createTool, isPending: isCreating} = useCreateTool()

    const navigate = useNavigate()

    // 处理下一步
    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1)
        }
    }

    // 处理上一步
    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    // 处理工具创建
    const handleCreateTool = async () => {
        console.log("创建工具:", {currentImage, toolConfig})

        createTool({tool: toolConfig}, {
            onSuccess: () => {
                toast.success("工具创建成功！")
                navigate('/tool')
            },
            onError: (error) => {
                console.error("创建工具失败:", error)
                toast.error("创建工具失败，请重试")
            }
        })
    }

    // 检查当前步骤是否可以继续
    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return currentImage !== null
            case 2:
                return toolConfig.name && toolConfig.command_template
            case 3:
                return true
            default:
                return false
        }
    }

    return (
        <SidebarInset className="h-screen flex flex-col">
            <header
                className="flex flex-col shrink-0 border-b">
                <div className="flex items-center gap-2 px-4 h-12 bg-background">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="!mr-2 !h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild>
                                    <Link to="/tool">
                                        Tools
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Add Tool</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto py-6 max-w-4xl">
                    <div className="mb-6">
                        <Link
                            to="/tool"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1"/>
                            {t("add_tool.back")}
                        </Link>
                        <h1 className="text-2xl font-bold">{t("add_tool.title")}</h1>
                        <p className="text-muted-foreground mt-1">{t("add_tool.sub_title")}</p>
                    </div>

                    {/* 进度条 */}
                    <Card className="mb-8 py-4">
                        <CardContent className="py-0">
                            <div className="flex items-center justify-between">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                                                    currentStep > step.id
                                                        ? "bg-green-500 text-white"
                                                        : currentStep === step.id
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {currentStep > step.id ? <CheckIcon className="h-5 w-5"/> : step.id}
                                            </div>
                                            <div className="mt-2 text-center">
                                                <div className="text-sm font-medium">{step.title}</div>
                                                <div className="text-xs text-muted-foreground">{step.description}</div>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? "bg-green-500" : "bg-muted"}`}/>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 步骤内容 */}
                    <div className="mb-8">
                        {currentStep === 1 && <ImageSelectionStep/>}
                        {currentStep === 2 && (<ToolConfigurationStep/>)}
                        {currentStep === 3 && <CreateConfirmationStep/>}
                    </div>

                    {/* 导航按钮 */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
                            <ArrowLeftIcon className="h-4 w-4 mr-2"/>
                            上一步
                        </Button>

                        <div className="text-sm text-muted-foreground">
                            第 {currentStep} 步，共 {steps.length} 步
                        </div>

                        {currentStep < steps.length ? (
                            <Button onClick={handleNext} disabled={!canProceed()}>
                                下一步
                                <ArrowRightIcon className="h-4 w-4 ml-2"/>
                            </Button>
                        ) : (
                            <Button onClick={handleCreateTool} className="bg-green-600 hover:bg-green-700" disabled={!canProceed() || isCreating}>
                                创建工具
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}
