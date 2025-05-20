import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {BaseToolNode} from "@/components/node-editor/node/base-node.tsx";
import {Input} from "@/components/ui/input.tsx";

export function JsonFilterNode() {
    const handles = {
        inputs: [
            {name: "json_data", description: "json data"},
        ],
        outputs: [
            {name: "dataframe", description: "dataframe"},
        ]
    }
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    const selectList = ["read1_after_filtering", "coverage_across_reference", "coverage_histogram"]

    const card = () => {
        return (
            <Card className="w-[300px] py-0 gap-0 bg-white shadow-lg">
                <CardHeader
                    className="nodeDragable h-8 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-lg flex flex-row items-center">
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
                <CardContent className="p-3" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
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
                <CardFooter className="h-4">
                    <div className="absolute bottom-2 right-2 flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    return (
        <BaseToolNode handles={handles} nodeComponent={card()}/>
    )
}

export function CutNode() {
    const handles = {
        inputs: [
            {name: "input_file", description: "input"},
        ],
        outputs: [
            {name: "top_lines", description: "output"},
        ]
    }
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    const card = () => {
        return (
            <Card className="w-[300px] py-0 gap-0 bg-white shadow-lg">
                <CardHeader
                    className="nodeDragable h-8 py-2 bg-gradient-to-r from-orange-500 to-amber-500  rounded-t-lg flex flex-row items-center">
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
                <CardContent className="p-3" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
                    <Label className="pb-2 font-medium">Head:</Label>
                    <Input className="bg-white" type="number"></Input>
                </CardContent>
                <CardFooter className="h-4">
                    <div className="absolute bottom-2 right-2 flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    return (
        <BaseToolNode handles={handles} nodeComponent={card()}/>
    )
}

export function FileListNode() {
    const handles = {
        inputs: [
            {name: "input_files", description: "files"},
        ],
        outputs: [
            {name: "file_list", description: "file list"},
        ]
    }

    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    const card = () => {
        return (
            <Card className="w-[300px] py-0 gap-0 bg-white shadow-lg">
                <CardHeader
                    className="nodeDragable h-8 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-lg flex flex-row items-center">
                    <CardTitle className="text-white">
                        File List (Space)
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
                <CardContent className="p-3" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
                    <Label className="pb-2 font-medium"></Label>
                </CardContent>
                <CardFooter className="h-4">
                    <div className="absolute bottom-2 right-2 flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    return (
        <BaseToolNode handles={handles} nodeComponent={card()}/>
    )
}