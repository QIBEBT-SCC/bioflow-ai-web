import {Tag} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {NewTagDialog} from "@/components/project/new-tag-dialog.tsx";
import {colorClassMap} from '@/types/color.tsx';
import {projectApi} from '@/services/api.tsx';
import {useTagStore} from '@/stores/projectStore.tsx';
import {useEffect} from 'react';

export function TagList() {
    const {tags, setTags} = useTagStore();

    useEffect(() => {
        if (tags.length === 0) {
            projectApi.getTagList()
                .then(setTags)
                .catch(() => {/* 错误处理可扩展 */
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <aside className="w-full md:w-64 shrink-0">
            <div className="sticky top-6 space-y-6">
                <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-1"/>
                    <h2 className="text-lg font-medium">标签</h2>
                </div>

                <div className="space-y-2">
                    {tags.length === 0 && <div className="text-muted-foreground">加载中...</div>}
                    {tags.map(tag => (
                        <Button key={tag.name} variant="outline" className="w-full justify-start" size="sm">
                            <Badge className={`mr-2 border-0 ${colorClassMap[tag.color]}`}>{tag.name}</Badge>
                            <span className="text-muted-foreground ml-auto">{tag.project_count ? tag.project_count : '--'}</span>
                        </Button>
                    ))}
                </div>

                <NewTagDialog/>
            </div>
        </aside>
    )
}