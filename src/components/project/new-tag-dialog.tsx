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
import {projectApi} from '@/services/api.tsx';
import {useTagStore} from '@/stores/projectStore.tsx';

export function NewTagDialog() {
    const [name, setName] = useState('')
    const [color, setColor] = useState("red")
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const setTags = useTagStore(state => state.setTags);

    const handleCreate = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await projectApi.newTag(name, color);
            // 创建成功后刷新标签列表
            const tags = await projectApi.getTagList();
            setTags(tags);
            setOpen(false);
        } catch (e) {
            // 可扩展错误提示
            console.log(e)
        } finally {
            setName('');
            setColor('red');
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                        <Label htmlFor="name">Tag Name</Label>
                        <Input
                            id="name"
                            placeholder="tag name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="color">Color</Label>
                        <Button className={`mr-2 ${colorClassMap[color]} border-0`}>标签颜色</Button>
                        <div className="grid grid-cols-11 gap-2">
                            {colorList.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    type="button"
                                    className={`h-5 w-5 rounded-full border border-gray-200 ${colorClassMap[presetColor]} transition-all hover:scale-110`}
                                    onClick={() => setColor(presetColor)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button type="button" onClick={handleCreate} disabled={loading}>
                        {loading ? '创建中...' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}