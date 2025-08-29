import {create} from 'zustand';
import {DockerToolCreate, ToolImage} from "@/types/tool.tsx";
import {devtools} from "zustand/middleware";

interface CreateToolStore {
    currentImage: ToolImage
    toolConfig: DockerToolCreate

    setCurrentImage: (image: ToolImage) => void
    setToolConfig: (toolConfig: DockerToolCreate) => void
}

export const useCreateToolStore = create<CreateToolStore>()(
    devtools(
        (set) => ({
            currentImage: {
                name: "",
                version: "",
                description: "",
                homepage: "",
                paper_link: "",
                image: {
                    registry: "docker.io",
                    namespace: "library",
                    repository: "",
                    tag: "latest",
                },
            },

            toolConfig: {
                name: "",
                image_uid: "",
                description: "",
                help_doc_uid: "",
                group_id: 1,
                tags: [],
                command_template: "",
                dynamic_params: [],
                static_params: "",
                file_mounts: [],
                mkdir_output: true,
                use_temp_dir: false,
            },

            setCurrentImage: (image: ToolImage) => {
                set((state) => ({
                    currentImage: image,
                    toolConfig: {
                        ...state.toolConfig,
                        image_uid: image.uid,
                        name: image.name
                    },
                }));
            },
            setToolConfig: (toolConfig: DockerToolCreate) => {
                set({toolConfig: toolConfig});
            }
        }),
        {name: "create-tool-store"}
    )
)

interface ToolNodeStore {
    currentGroupId?: number;
    setCurrentGroupId: (id?: number) => void;
}

export const useToolNodeStore = create<ToolNodeStore>((set) => ({
    currentGroupId: undefined,
    setCurrentGroupId: (id) => set({currentGroupId: id}),
}))