import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useUpdateChatHistory} from "@/hooks/use-chat.tsx";

interface EditDialogProps {
    open: boolean,
    onOpenChange: (value: boolean) => void,
    value: string,
    onValueChange: (value: string) => void,
    id: string | null,
    onIdChange: (value: string | null) => void
}

export function EditDialog({open, onOpenChange, value, onValueChange, id, onIdChange}: EditDialogProps) {
    const updateHistoryMutation = useUpdateChatHistory();

    const editHistoryDescription = async (historyId: string, newDescription: string) => {
        try {
            await updateHistoryMutation.mutateAsync({
                sessionId: historyId,
                description: newDescription
            });
        } catch (error) {
            console.error('Failed to update description:', error);
        }
    }

    const resetState = () => {
        onIdChange(null);
        onValueChange("");
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>编辑对话描述</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        value={value}
                        onChange={(e) => onValueChange(e.target.value)}
                        placeholder="输入对话描述..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && id) {
                                editHistoryDescription(id, value).then(resetState)
                            }
                        }}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={() => {
                                if (id) {
                                    editHistoryDescription(id, value).then(resetState)
                                }
                            }}
                            disabled={!value.trim()}
                        >
                            保存
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}