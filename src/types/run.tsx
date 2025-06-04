import {User} from "@/types/auth.tsx";
import {Status} from "@/types/task.tsx";

export interface Stats {
    total: number
    waiting: number
    running: number
    success: number
    error: number
}

export interface RunPublic {
    uid: string
    name: string
    owner: User
    status: Status
    task_stats: Stats
    create_time: string
    start_time: string
    end_time: string
}

export interface RunInfo4Task {
    uid: string
    name: string
}
