import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {BaseToolNode} from "@/components/node-editor/base-node.tsx";

export function JsonFilterNode({id}: { id: string }) {
    const self_data = {
        prefix: id,
    }
    const handles = {
        inputs: [
            {id: 1, description: "json data"},
        ],
        outputs: [
            {id: 1, description: "dataframe"},
        ]
    }

    const card = () => {
        return (
            <Card className="w-[350px] py-0 gap-3 bg-gray-50 shadow-lg">
                <CardHeader className="nodeDragable h-8 py-2 bg-amber-600 rounded-t-xl flex flex-row items-center">
                    <CardTitle className="text-white">
                        Json Data Filter
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger><Info className="w-3 h-3 text-gray-300"/></TooltipTrigger>
                            <TooltipContent>
                                <p>文件路径输出</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent className="pt-6 pb-4">
                    <Label className="pb-2 font-medium">Key:</Label>
                    <Select>
                        <SelectTrigger className="w-[200px] bg-white">
                            <SelectValue placeholder="Select a fruit"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Fruits</SelectLabel>
                                <SelectItem value="apple">read1_after_filtering</SelectItem>
                                <SelectItem value="banana">Banana</SelectItem>
                                <SelectItem value="blueberry">Blueberry</SelectItem>
                                <SelectItem value="grapes">Grapes</SelectItem>
                                <SelectItem value="pineapple">Pineapple</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        )
    }

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={card()}/>
    )
}