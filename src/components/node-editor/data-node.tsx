import {Handle, Position, useStore} from "@xyflow/react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

export function DataSelectNode({data}: {
    data: {
        prefix: string
    }
}) {
    const edges = useStore((state) => state.edges);

    const isHandleConnected = (handleId: string) => {
        return edges.some(edge => edge.sourceHandle === handleId || edge.targetHandle === handleId);
    };

    return (
        <div className="flex justify-center relative">
            {/* Input handles */}
            <p className="absolute text-xs text-neutral-400 left-5 top-12 transform -translate-y-1/2">json input</p>
            <Handle
                id={`${data.prefix}-in1`}
                type="target"
                position={Position.Left}
                className={`w-2.5 h-2.5 !top-12 !left-2.5 rounded-full border-2 border-green-400 shadow-sm transition-all duration-200 hover:scale-110 ${isHandleConnected(`${data.prefix}-in1`) ? '!bg-green-400' : '!bg-white'}`}
            />

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
                            <SelectValue placeholder="Select a fruit" />
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

            {/* Output handles */}
            <p className="absolute text-xs text-neutral-400 right-5 top-12 transform -translate-y-1/2">dataframe</p>
            <Handle
                id={`${data.prefix}-out1`}
                type="source"
                position={Position.Right}
                className={`w-2.5 h-2.5 !top-12 !right-2.5 rounded-full border-2 !border-blue-400 shadow-sm transition-all duration-200 hover:scale-110 ${isHandleConnected(`${data.prefix}-out1`) ? '!bg-blue-400' : '!bg-white'}`}
            />
        </div>
    );
}