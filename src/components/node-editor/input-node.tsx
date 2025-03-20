import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {BaseToolNode} from "@/components/node-editor/base-node.tsx";

const FileCard = (
    {
        data,
    }: {
        data: {
            prefix: string,
            title: string;
            description: string;
            defaultArgs: string;

        };
    }) => {
    const [args, setArgs] = useState(data.defaultArgs);

    useEffect(() => {
        setArgs(data.defaultArgs);
    }, [data.defaultArgs, data.prefix]);

    return (
        <Card className="w-[350px] py-0 gap-3 bg-gray-50 shadow-lg">
            <CardHeader className="nodeDragable h-8 py-2 bg-emerald-600 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">
                    {data.title}
                </CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-gray-300"/></TooltipTrigger>
                        <TooltipContent>
                            <p>{data.description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent className="pt-5 pb-4">
                <Label className="pb-2 font-medium">File:</Label>
                <Input
                    className="text-sm bg-white !focus:ring-1"
                    placeholder="Enter arguments here..."
                    value={args}
                    onChange={(e) => {
                        setArgs(e.target.value);
                    }}
                />
            </CardContent>
        </Card>
    )
}

export function FileInputNode({id, data}: { id: string; data: { defaultArgs: string } }) {
    const self_data = {
        title: "File Input",
        prefix: id,
        description: "load file from local path",
        defaultArgs: data.defaultArgs
    }
    const handles = {
        inputs: [],
        outputs: [
            {id: 1, description: "output file"},
        ]
    }

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<FileCard data={self_data}/>}/>
    )
}