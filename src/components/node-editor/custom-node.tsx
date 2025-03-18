import {Handle, Position} from '@xyflow/react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

// @ts-expect-error no need
export function TextUpdaterNode({data}) {
    return (
        <div className="flex justify-center px-0">
            <Handle
                type="target"
                position={Position.Left}
            />
            <Card className="w-[350px] pt-0">
                <CardHeader className="py-2 bg-blue-50 rounded-t-xl">
                    <CardTitle>{data.title}</CardTitle>
                    <CardDescription>Deploy your new project in one-click.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" placeholder="Name of your project"/>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="framework">Framework</Label>
                                <Select>
                                    <SelectTrigger id="framework">
                                        <SelectValue placeholder="Select"/>
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value="next">Next.js</SelectItem>
                                        <SelectItem value="sveltekit">SvelteKit</SelectItem>
                                        <SelectItem value="astro">Astro</SelectItem>
                                        <SelectItem value="nuxt">Nuxt.js</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <p className="absolute text-sm text-neutral-600 right-2 bottom-1/5 transform translate-y-1/2">R1</p>
            <Handle
                id="a"
                title="R1"
                type="source"
                style={{top: "80%"}}
                position={Position.Right}
                className="w-3 h-3 top-4/5 rounded-full !bg-white border"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                style={{left: "20%"}}
            />
        </div>
    );
}