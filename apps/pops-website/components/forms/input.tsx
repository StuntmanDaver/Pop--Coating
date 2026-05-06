import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type ?? "text"}
      className={cn(
        "block w-full",
        "h-11 px-4",
        "rounded-sm border bg-ink-800/90 text-ink-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        "border-ink-500",
        "font-text text-base placeholder:text-ink-400",
        "transition-[border-color,box-shadow] duration-150 ease-out",
        "outline-none",
        "focus-visible:border-pops-yellow-500 focus-visible:ring-2 focus-visible:ring-pops-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800",
        "data-[error=true]:border-danger-500 aria-[invalid=true]:border-danger-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
});
