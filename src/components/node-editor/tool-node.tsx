"use client"

import {Handle, Position} from '@xyflow/react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import { useState, useEffect } from 'react';

export function ToolNode2in3out({data}: {
    data: {
        title: string,
        description: string,
        in1Description: string,
        in2Description: string,
        out1Description: string,
        out2Description: string,
        out3Description: string,
        defaultArgs: string
    }
}) {
    const [args, setArgs] = useState(data.defaultArgs);

    useEffect(() => {
        setArgs(data.defaultArgs);
    }, [data.defaultArgs]);

    return (
        <div className="flex justify-center relative">
            <p className="absolute text-xs text-neutral-400 left-5 top-12 transform -translate-y-1/2">{data.in1Description}</p>
            <Handle
                id="in1"
                type="target"
                position={Position.Left}
                className="w-2.5 h-2.5 !top-12 !left-2.5 rounded-full border-2 border-green-400 !bg-white shadow-sm transition-all duration-200 hover:scale-110"
            />
            <p className="absolute text-xs text-neutral-400 left-5 top-18 transform -translate-y-1/2">{data.in2Description}</p>
            <Handle
                id="in2"
                type="target"
                position={Position.Left}
                className="w-2.5 h-2.5 !top-18 !left-2.5 rounded-full border-2 border-green-400 !bg-white shadow-sm transition-all duration-200 hover:scale-110"
            />
            <Card className="w-[350px] py-0 gap-3 bg-gray-50 shadow-lg">
                <CardHeader className="nodeDragable h-8 py-2 bg-fuchsia-400 rounded-t-xl flex flex-row items-center">
                    <CardTitle>
                        {data.title}
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger><Info className="w-3 h-3 text-gray-600"/></TooltipTrigger>
                            <TooltipContent>
                                <p>{data.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent className="pt-11 pb-4">
                    <Label className="pb-2 font-medium">Args:</Label>
                    <Textarea
                        className="h-[80px] text-sm resize-none bg-white overflow-y-auto !focus:ring-1"
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
                id="out1"
                type="source"
                position={Position.Right}
                className="w-2.5 h-2.5 !top-12 !right-2.5 rounded-full !bg-white border-2 !border-blue-400 shadow-sm transition-all duration-200 hover:scale-110"
            />
            <p className="absolute text-xs text-neutral-400 right-5 top-18 transform -translate-y-1/2">{data.out2Description}</p>
            <Handle
                id="out2"
                type="source"
                position={Position.Right}
                className="w-2.5 h-2.5 !top-18 !right-2.5 rounded-full !bg-white border-2 !border-blue-400 shadow-sm transition-all duration-200 hover:scale-110"
            />
            <p className="absolute text-xs text-neutral-400 right-5 top-24 transform -translate-y-1/2">{data.out3Description}</p>
            <Handle
                id="out3"
                type="source"
                position={Position.Right}
                className="w-2.5 h-2.5 !top-24 !right-2.5 rounded-full !bg-white border-2 !border-blue-400 shadow-sm transition-all duration-200 hover:scale-110"
            />
        </div>
    );
}