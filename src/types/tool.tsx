export enum ToolType {
    DOCKER = 0,
    COMMAND_LINE = 1,
}

// 参数类型枚举
export enum ParamType {
    INPUT = 0,
    INPUT_POSITION = 1,
    OUTPUT = 2,
}

// 参数定义接口
export interface ParamDefine {
    name: string
    command: string
    param_type: ParamType
    is_file: boolean
    index?: number
    mount_path?: string
    description?: string
}

// 输出文件接口
export interface OutputFile {
    name: string
    file_path: string
    is_report: boolean
    is_log: boolean
    mount_path: string
    description?: string
}

export interface ToolTag {
    id: number;
    name: string;
}

export interface ToolGroup {
    id: number;
    name: string;
    parent_id?: number | null;
}

// 工具创建接口
export interface DockerToolCreate {
    name: string
    repository: string
    tag: string
    description: string
    homepage: string
    tool_tag: ToolTag[]
    command_template: string
    dynamic_params: ParamDefine[]
    static_params: string
    output_files: OutputFile[]
    mkdir_output: boolean
    use_temp_dir: boolean
    help_command: string
}

export interface SimpleToolInfo {
    uid: string
    name: string
    description: string
    tool_type: ToolType
    group_id?: number

    docker_image: string

    tags: ToolTag[]
}

export interface ToolInfo {
    uid: string
    name: string
    description: string
    homepage: string
    tool_type: ToolType
    group_id?: number

    command_template: string
    dynamic_params: ParamDefine[]
    static_params: string
    output_files: OutputFile[]

    help_command: string
    complete_command: string

    mkdir_output: boolean
    use_temp_dir: boolean

    docker_repo: string
    docker_tag: string

    tags: ToolTag[]
}

export interface ToolInfo4Task {
    uid: string
    name: string
    description: string

    output_files: OutputFile[]
}