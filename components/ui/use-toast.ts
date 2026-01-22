import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive";

type ToastInput = {
  title?: string;
  description?: string;
  duration?: number;
  variant?: ToastVariant;
};

/**
 * Lightweight wrapper around `sonner` so hooks can call `toast({ ... })`
 * similar to the shadcn API.
 */
export function useToast() {
  const toast = ({ title, description, duration, variant }: ToastInput) =>
    sonnerToast(title ?? description ?? "Notification", {
      description: title && description ? description : undefined,
      duration: duration ?? 4000,
      className:
        variant === "destructive"
          ? "bg-red-50 text-red-900 border border-red-200"
          : undefined,
    });

  return { toast };
}


