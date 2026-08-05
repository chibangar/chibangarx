import { create } from "zustand"

export type UpdateState = "idle" | "checking" | "available" | "downloading" | "downloaded" | "installing" | "error"

interface AdminState {
  isAdmin: boolean
  username: string
  country: string
  onlineCount: number
  setAdmin: (admin: boolean) => void
  setUsername: (name: string) => void
  setCountry: (country: string) => void
  setOnlineCount: (count: number) => void
  reset: () => void
}

const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  username: "",
  country: "",
  onlineCount: 0,
  setAdmin: (admin: boolean) => set({ isAdmin: admin }),
  setUsername: (name: string) => set({ username: name }),
  setCountry: (country: string) => set({ country: country }),
  setOnlineCount: (count: number) => set({ onlineCount: count }),
  reset: () =>
    set({
      isAdmin: false,
      username: "",
      country: "",
      onlineCount: 0,
    }),
}))

export default useAdminStore
