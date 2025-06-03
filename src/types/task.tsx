import {User} from "@/types/auth.tsx";
import {RunInfo4Task} from "@/types/run.tsx";
import {ToolInfo4Task} from "@/types/tool.tsx";

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
    tool_output?: ToolOutput
    status: Status

    create_time?: string;
    start_time?: string;
    end_time?: string;
}

export interface SimpleTask {
    uid: string
    name: string
    owner: User
    run_instance: RunInfo4Task

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
    run_instance: RunInfo4Task
    tool: ToolInfo4Task
    system?: string
    hostname: string

    commands?: string
    tool_output?: ToolOutput

    status: Status


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