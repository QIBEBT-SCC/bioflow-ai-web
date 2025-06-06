import {create} from "zustand";

interface SidebarStore {
    activePage: string,
    setActivePage: (page: string) => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
    activePage: "Home",
    setActivePage: (page) => set({activePage: page}),
}))