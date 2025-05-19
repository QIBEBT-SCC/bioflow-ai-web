export interface HandleDefine {
    name: string
    description: string
}

export interface ToolArgPublic {
    uid: string
    name: string
    description: string
    input_handles: HandleDefine[]
    output_handles: HandleDefine[]
    optional_params: string
}