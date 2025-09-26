"use client"

import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {BaseNode} from "@/components/node-editor/node/base-node.tsx";
import {useState} from "react";
import {type Node, useNodeId, useNodesData, useReactFlow} from '@xyflow/react';
import {colorSchemes} from "@/components/node-editor/node/color.tsx";

interface CodeCardProps {
    nodeType: "code_R" | "code_python";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CodeCard({nodeType}: CodeCardProps) {
    const nodeId = useNodeId() ?? "";
    const nodeData = useNodesData<Node<{ args: { description: string, code: string } }, typeof nodeType>>(nodeId);
    const {updateNodeData} = useReactFlow();

    const [code, setCode] = useState<string>(nodeData?.data.args.code ?? "")
    const [prompt, setPrompt] = useState<string>(nodeData?.data.args.description ?? "")

    return (
        <div className="p-3">
            <div className="space-y-4">
                <div>
                    <Label className="pb-2 font-medium">Description (AI Prompt):</Label>
                    <Textarea
                        className="w-full h-[80px] text-sm resize-none overflow-y-auto border-gray-200 focus-visible:ring-indigo-500 focus-visible:ring-[2px] focus-visible:ring-offset-2"
                        placeholder="输入代码编写需求，作为AI编程的prompt..."
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value)
                        }}
                        onBlur={() => updateNodeData(nodeId, {args: {description: prompt, code: code}})}
                    />
                </div>
                <div>
                    <Label className="pb-2 font-medium">Code:</Label>
                    <Textarea
                        className="w-full h-[120px] text-sm resize-none overflow-y-auto border-gray-200 focus:ring-purple-500 focus:border-purple-500 font-mono"
                        placeholder="在这里编写或粘贴代码..."
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value)
                        }}
                        onBlur={() => updateNodeData(nodeId, {args: {description: prompt, code: code}})}
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    )
}

function RCodeNode() {
    const handles = {
        inputs: [
            {name: "input_files", description: "The files required by this code"}
        ],
        outputs: [
            {name: "output_folder", description: "The files required by this code"}
        ]
    };

    return (
        <BaseNode
            title="R Code"
            description="AI编程节点，用于编写和执行代码。包含描述区域（AI prompt）和代码区域。"
            color={colorSchemes.purple}
            handles={handles}
            nodeComponent={<CodeCard nodeType="code_R"/>}
        />
    )
}

function PythonCodeNode() {
    const handles = {
        inputs: [
            {name: "input_files", description: "The files required by this code"}
        ],
        outputs: [
            {name: "output_folder", description: "The files required by this code"}
        ]
    };

    return (
        <BaseNode
            title="Python Code"
            description="AI编程节点，用于编写和执行代码。包含描述区域（AI prompt）和代码区域。"
            color={colorSchemes.purple}
            handles={handles}
            nodeComponent={<CodeCard nodeType="code_python"/>}
        />
    )
}

export {
    RCodeNode,
    PythonCodeNode
}
