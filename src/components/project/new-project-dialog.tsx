import {useState} from "react";
import {useCreateProject, useTagList} from "@/hooks/useProject.tsx";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Plus} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {TagSelector} from "@/components/tag-selector.tsx";
import {ToolTag} from "@/types/tool.tsx";

export function NewProjectDialog() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [is_public, setPublic] = useState(false)
    const [tags, setTags] = useState<ToolTag[]>([])
    const [open, setOpen] = useState(false)

    const {data: availableTags = []} = useTagList();
    const {mutate: createProject, isPending} = useCreateProject();

    const handleCreate = () => {
        if (!name) return;
        const newProject = {
            name: name,
            description: description,
            public: is_public,
            tag_ids: tags.map(tag => tag.id)
        }
        createProject(
            {project: newProject},
            {
                onSuccess: () => {
                    setOpen(false);
                    setName('');
                    setDescription('');
                    setPublic(false);
                    setTags([]);
                },
                onError: (e) => {
                    // 错误处理
                    console.log(e);
                }
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2"/>
                    新项目
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Tag</DialogTitle>
                    <DialogDescription>
                        Create new tag
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-row space-y-3">
                    <div className="flex space-y-2 pt-2">
                        <div className="flex-1/2 space-y-2 pt-2">
                            <Label htmlFor="name">Project Name</Label>
                            <Input
                                id="name"
                                placeholder="project name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 space-y-2 pt-2 pl-5">
                            <Label htmlFor="public">Public</Label>
                            <Checkbox
                                id="public"
                                className="mx-3 mt-2"
                                checked={is_public}
                                onCheckedChange={(checked) =>
                                    setPublic(checked as boolean)
                                }
                            />
                        </div>
                    </div>
                    <div className="space-y-2 pt-2">
                        <Label htmlFor="description">Project Description</Label>
                        <Textarea
                            id="description"
                            placeholder="project description"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 pt-2">
                        <Label>Project Tag</Label>
                        <TagSelector
                            availableTags={availableTags}
                            onChange={(tags) => setTags(tags)}
                            value={tags}
                            allowCreate={false}
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button type="button" onClick={handleCreate} disabled={isPending}>
                        {isPending ? '创建中...' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}