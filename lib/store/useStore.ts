import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Profile, Hospital } from "@/lib/types";

interface AppState {
  // User
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // Hospital
  currentHospital: Hospital | null;
  setCurrentHospital: (hospital: Hospital | null) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Theme
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;

  // Queue filters
  queueFilters: {
    status?: string;
    search?: string;
  };
  setQueueFilters: (filters: { status?: string; search?: string }) => void;

  // Appointment filters
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
      // User
      profile: null,
      setProfile: (profile) => set({ profile }),

      // Hospital
      currentHospital: null,
      setCurrentHospital: (hospital) => set({ currentHospital: hospital }),

      // UI State
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Notifications
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

      // Theme
      theme: "light",
      setTheme: (theme) => set({ theme }),

      // Queue filters
      queueFilters: {},
      setQueueFilters: (filters) => set({ queueFilters: filters }),

      // Appointment filters
      appointmentFilters: {},
      setAppointmentFilters: (filters) => set({ appointmentFilters: filters }),
    }),
    {
      name: "hospital-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
