"use client"

import {Handle, Position} from '@xyflow/react';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";

// @ts-expect-error no need
export function ToolNode2in3out({data}) {
    return (
        <div className="flex justify-center px-0">
            <p className="absolute text-xs text-neutral-400 left-2 top-[65%] transform -translate-y-1/2">R1</p>
            <Handle
                id="in1"
                type="target"
                position={Position.Left}
                className="w-2.5 h-2.5 !top-[65%] rounded-full !bg-white border !border-green-300"
            />
            <p className="absolute text-xs text-neutral-400 left-2 top-[85%] transform -translate-y-1/2">R2</p>
            <Handle
                id="in2"
                type="target"
                position={Position.Left}
                className="w-2.5 h-2.5 !top-[85%] rounded-full !bg-white border !border-green-300"
            />
            <Card className="w-[350px] pt-0 gap-3">
                <CardHeader className="nodeDragable pt-2 bg-blue-50 rounded-t-xl">
                    <CardTitle>{data.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="pb-2">Args:</p>
                    <Textarea/>
                </CardContent>
                <CardFooter className="h-10"/>
            </Card>
            <p className="absolute text-xs text-neutral-400 right-2 top-[65%] transform -translate-y-1/2">R1</p>
            <Handle
                id="out1"
                type="source"
                position={Position.Right}
                className="w-2.5 h-2.5 !top-[65%] rounded-full !bg-white border !border-blue-300"
            />
            <p className="absolute text-xs text-neutral-400 right-2 top-[77.5%] transform -translate-y-1/2">R2</p>
            <Handle
                id="out2"
                type="source"
                position={Position.Right}
                className="w-2.5 h-2.5 !top-[77.5%] rounded-full !bg-white border !border-blue-300"
            />
            <p className="absolute text-xs text-neutral-400 right-2 top-[90%] transform -translate-y-1/2">Json Report</p>
            <Handle
                id="out3"
                type="source"
                position={Position.Right}
                className="w-2.5 h-2.5 !top-[90%] rounded-full !bg-white border !border-blue-300"
            />
        </div>
    );
}