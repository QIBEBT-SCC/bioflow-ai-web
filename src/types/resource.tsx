export interface BioDbCreate {
    name: string
    description?: string
    path: string
    last_update: string
}

export interface BioDbSimple {
    id: number
    name: string
}

export interface BioDb {
    id: number
    name: string
    description?: string
    path: string
    size: string
    last_update: string
}