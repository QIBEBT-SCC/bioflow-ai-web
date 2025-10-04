// export function JsonFilterNode() {
//     const handles = {
//         inputs: [
//             {name: "json_data", description: "json data"},
//         ],
//         outputs: [
//             {name: "dataframe", description: "dataframe"},
//         ]
//     }
//     const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))
//
//     const selectList = ["read1_after_filtering", "coverage_across_reference", "coverage_histogram"]
//
//     const card = () => {
//         return (
//             <Card className="w-[300px] py-0 gap-0 bg-white shadow-lg">
//                 <CardHeader
//                     className="nodeDragable h-8 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-lg flex flex-row items-center">
//                     <CardTitle className="text-white">
//                         Json Data Filter
//                     </CardTitle>
//                     <TooltipProvider>
//                         <Tooltip>
//                             <TooltipTrigger><InfoIcon className="w-3 h-3 text-gray-300"/></TooltipTrigger>
//                             <TooltipContent>
//                                 <p>文件路径输出</p>
//                             </TooltipContent>
//                         </Tooltip>
//                     </TooltipProvider>
//                 </CardHeader>
//                 <CardContent className="p-3" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
//                     <Label className="pb-2 font-medium">Key:</Label>
//                     <Select>
//                         <SelectTrigger className="w-[200px] bg-white">
//                             <SelectValue placeholder="Select a fruit"/>
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectGroup>
//                                 {selectList.map((item, index) => (
//                                     <SelectItem value={item} key={index}>{item}</SelectItem>
//                                 ))}
//                             </SelectGroup>
//                         </SelectContent>
//                     </Select>
//                 </CardContent>
//                 <CardFooter className="h-4">
//                     <div className="absolute bottom-2 right-2 flex space-x-1">
//                         <div className="w-2 h-2 rounded-full bg-amber-400"></div>
//                         <div className="w-2 h-2 rounded-full bg-orange-400"></div>
//                         <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
//                     </div>
//                 </CardFooter>
//             </Card>
//         )
//     }
//
//     return (
//         <BaseToolNode handles={handles} nodeComponent={card()}/>
//     )
// }

import { memo, useMemo } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node.tsx'
import { colorSchemes } from '@/components/node-editor/node/color.tsx'
import type { HandleDefine } from '@/types/node.tsx'

const COPY2FOLDER_HANDLES = {
    inputs: [
        {
            name: 'files',
            description: 'All files to be copied over',
        },
    ] as HandleDefine[],
    outputs: [
        {
            name: 'folder',
            description: 'Folder path containing all files',
        },
    ] as HandleDefine[],
}
const Copy2FolderNode = memo(function Copy2FolderNode() {
    const nodeComponent = useMemo(() => <div />, [])
    return (
        <BaseNode
            title='Copy To Folder'
            description='Copy files from multiple input sources to the same folder.'
            handles={COPY2FOLDER_HANDLES}
            color={colorSchemes.orange}
            nodeComponent={nodeComponent}
        />
    )
})

export { Copy2FolderNode }
