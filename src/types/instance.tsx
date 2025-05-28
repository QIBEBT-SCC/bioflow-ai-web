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