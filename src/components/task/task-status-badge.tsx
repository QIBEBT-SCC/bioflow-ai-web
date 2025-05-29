import {Status} from "@/types/instance.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {AlertCircle, CheckCircle2, Loader2, EllipsisIcon} from "lucide-react";

export function TaskStatusBadge({status}: { status: Status }) {
    if (status === Status.SUCCESS) {
        return (
            <Badge
                variant="outline"
                className="bg-green-50 text-green-600 border-green-200 flex items-center"
            >
                <CheckCircle2 className="h-3 w-3 mr-1"/>
                已完成
            </Badge>
        )
    }

    if (status === Status.RUNNING) {
        return (
            <Badge
                variant="outline"
                className="bg-blue-50 text-blue-600 border-blue-200 flex items-center"
            >
                <Loader2 className="h-3 w-3 mr-1 animate-spin"/>
                进行中
            </Badge>
        )
    }

    if (status === Status.ERROR) {
        return (
            <Badge
                variant="outline"
                className="bg-red-50 text-red-600 border-red-200 flex items-center"
            >
                <AlertCircle className="h-3 w-3 mr-1"/>
                失败
            </Badge>
        )
    }

    return (
        <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200 flex items-center"
        >
            <EllipsisIcon className="h-3 w-3 mr-1"/>
            等待中
        </Badge>
    )
}
