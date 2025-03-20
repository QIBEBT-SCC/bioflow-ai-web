import {useEffect, useState} from "react";
import {Handle, Position, useStore} from "@xyflow/react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";

export function FileInputNode({data}: {
    data: {
        prefix: string,
        out1Description: string,
        defaultArgs: string
    }
}) {
    const [args, setArgs] = useState(data.defaultArgs);
    const edges = useStore((state) => state.edges);

    useEffect(() => {
        setArgs(data.defaultArgs);
    }, [data.defaultArgs]);

    const isHandleConnected = (handleId: string) => {
        return edges.some(edge => edge.sourceHandle === handleId || edge.targetHandle === handleId);
    };

    return (
        <div className="flex justify-center relative">
            <Card className="w-[350px] py-0 gap-3 bg-gray-50 shadow-lg">
                <CardHeader className="nodeDragable h-8 py-2 bg-emerald-600 rounded-t-xl flex flex-row items-center">
                    <CardTitle className="text-white">
                        File Input
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
                <CardContent className="pt-2 pb-4">
                    <Label className="pb-2 font-medium">File:</Label>
                    <Input
                        className="text-sm bg-white !focus:ring-1"
                        placeholder="Enter arguments here..."
                        value={args}
                        onChange={(e) => {
                            setArgs(e.target.value);
                            data.defaultArgs = e.target.value;
                        }}
                    />
                </CardContent>
            </Card>

            {/* Output handles */}
            <p className="absolute text-xs text-neutral-400 right-5 top-12 transform -translate-y-1/2">{data.out1Description}</p>
            <Handle
                id={`${data.prefix}-out1`}
                type="source"
                position={Position.Right}
                className={`w-2.5 h-2.5 !top-12 !right-2.5 rounded-full border-2 !border-blue-400 shadow-sm transition-all duration-200 hover:scale-110 ${isHandleConnected(`${data.prefix}-out1`) ? '!bg-blue-400' : '!bg-white'}`}
            />
        </div>
    );
}