import { cn } from "@/lib/utils"

interface TaskStatusBadgeProps {
    status: string
    className?: string
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return {
                    label: "Completed",
                    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                }
            case "RUNNING":
                return {
                    label: "Running",
                    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                }
            case "PENDING":
                return {
                    label: "Pending",
                    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
                }
            case "FAILED":
                return {
                    label: "Failed",
                    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                }
            default:
                return {
                    label: status,
                    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
                }
        }
    }

    const config = getStatusConfig(status)

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                config.className,
                className,
            )}
        >
      {config.label}
    </span>
    )
}
