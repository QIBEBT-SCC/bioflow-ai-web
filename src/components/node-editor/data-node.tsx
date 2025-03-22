import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {BaseToolNode} from "@/components/node-editor/base-node.tsx";
import {Input} from "@/components/ui/input.tsx";

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

    const selectList = ["read1_after_filtering", "coverage_across_reference", "coverage_histogram"]

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
                                {selectList.map((item, index) => (
                                    <SelectItem value={item} key={index}>{item}</SelectItem>
                                ))}
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

export function CutNode({id}: { id: string }) {
    const self_data = {
        prefix: id,
    }
    const handles = {
        inputs: [
            {id: 1, description: "input"},
        ],
        outputs: [
            {id: 1, description: "output"},
        ]
    }

    const card = () => {
        return (
            <Card className="w-[350px] py-0 gap-3 bg-gray-50 shadow-lg">
                <CardHeader className="nodeDragable h-8 py-2 bg-amber-600 rounded-t-xl flex flex-row items-center">
                    <CardTitle className="text-white">
                        Text Cut
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
                    <Label className="pb-2 font-medium">Head:</Label>
                    <Input className="bg-white" type="number"></Input>
                </CardContent>
            </Card>
        )
    }

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={card()}/>
    )
}