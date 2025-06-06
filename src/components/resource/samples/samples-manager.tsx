"use client"

import {useState} from "react"
import {Input} from "@/components/ui/input.tsx"
import {Button} from "@/components/ui/button.tsx"
import {Card, CardContent} from "@/components/ui/card.tsx"
import {SamplesList} from "@/components/resource/samples/samples-list.tsx"
import {SampleDetail} from "@/components/resource/samples/sample-detail.tsx"
import {PlusCircle, Search} from "lucide-react"
import {SampleUploadDialog} from "@/components/resource/samples/sample-upload-dialog.tsx"

export function SamplesManager() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="搜索样本..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    上传样本
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardContent className="p-4">
                        <SamplesList
                            searchQuery={searchQuery}
                            onSelectSample={(id) => setSelectedSampleId(id)}
                            selectedSampleId={selectedSampleId}
                        />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardContent className="p-4">
                        {selectedSampleId ? (
                            <SampleDetail sampleId={selectedSampleId}/>
                        ) : (
                            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                                请选择一个样本查看详情
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <SampleUploadDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}/>
        </div>
    )
}
