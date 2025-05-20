export interface ProjectTag {
    id: number;
    name: string;
    color: string;
    project_count?: number;
}

export interface ProjectCreateProp {
    name: string;
    description: string;
    public: boolean;
    tag_ids: number[];
}

export interface Project {
    id: number;
    owner_name: string;
    name: string;
    description: string;
    starred: boolean;
    create_time: string;
    update_time: string;
    tags: ProjectTag[];
}