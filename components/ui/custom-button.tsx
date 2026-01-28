import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

const CustomButton = ({ children, className, ...props }: Props) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default CustomButton;