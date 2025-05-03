import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Plus} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useState} from "react";
import {colorClassMap, colorList} from "@/types/color.tsx";



export function NewTagDialog() {
    const [name, setName] = useState('')
    const [color, setColor] = useState("red")

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2"/>
                    添加新标签
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Tag</DialogTitle>
                    <DialogDescription>
                        Create new tag
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-row px-4 space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Email</Label>
                        <Input
                            id="name"
                            placeholder="tag name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Color</Label>
                        <Button className={`mr-2 ${colorClassMap[color]} border-0`}>标签颜色</Button>
                        <div className="grid grid-cols-11 gap-2">
                            {colorList.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    className={`h-5 w-5 rounded-full border border-gray-200 ${colorClassMap[presetColor]} transition-all hover:scale-110`}
                                    onClick={() => setColor(presetColor)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button type="button">
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}