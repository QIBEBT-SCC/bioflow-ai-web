// Calculate duration between start and end time (or now for running tasks)
import {format} from "date-fns";

export const getDuration = (start_time: string | undefined, end_time:string | undefined) => {
    if (!start_time) return "-"

    const startTime = new Date(start_time)
    const endTime = end_time ? new Date(end_time) : new Date()

    const durationMs = endTime.getTime() - startTime.getTime()
    const seconds = Math.floor(durationMs / 1000)

    if (seconds < 60) return `${seconds}s`

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return `${hours}h ${remainingMinutes}m`
}

export const formatTime = (timeString: string | undefined) => {
    if (!timeString) return "--"
    return format(new Date(timeString), "MM-dd HH:mm")
}