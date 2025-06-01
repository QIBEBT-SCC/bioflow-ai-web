import {User} from "@/types/auth.tsx";

export enum Status {
    WAITING = 0,
    RUNNING = 1,
    ERROR = 2,
    SUCCESS = 3,
}

export interface TaskInstance {
    uid: string
    instance_uid: string
    owner_id: number
    name: string
    commands?: string
    result?: Record<string, any>
    status: Status

    create_time?: string;
    start_time?: string;
    end_time?: string;
}

export interface SimpleTask {
    uid: string
    name: string
    owner: User
    status: Status

    create_time?: string;
    start_time?: string;
    end_time?: string;
}

export interface ToolOutput {
    result?: Record<string, string>,
    log?: string,
    reports?: Record<string, string>
}

export interface TaskPublic {
    uid: string
    name: string
    owner: User
    commands?: string
    tool_output?: ToolOutput
    status: Status

    system?: string
    hostname: string

    create_time?: string;
    start_time?: string;
    end_time?: string;
}

export interface MonitorRecord {
    cpu_usage: number
    mem_usage: number
    mem_used: number
    io_in: number
    io_out: number
    time: string
}