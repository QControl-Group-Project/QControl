import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Profile, Business } from "@/lib/types";

interface AppState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  currentHospital: Business | null;
  setCurrentHospital: (business: Business | null) => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;

  queueFilters: {
    status?: string;
    search?: string;
  };
  setQueueFilters: (filters: { status?: string; search?: string }) => void;

  appointmentFilters: {
    status?: string;
    date?: string;
    search?: string;
  };
  setAppointmentFilters: (filters: {
    status?: string;
    date?: string;
    search?: string;
  }) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),

      currentHospital: null,
      setCurrentHospital: (business) => set({ currentHospital: business }),

      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      theme: "light",
      setTheme: (theme) => set({ theme }),

      queueFilters: {},
      setQueueFilters: (filters) => set({ queueFilters: filters }),

      appointmentFilters: {},
      setAppointmentFilters: (filters) => set({ appointmentFilters: filters }),
    }),
    {
      name: "business-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
