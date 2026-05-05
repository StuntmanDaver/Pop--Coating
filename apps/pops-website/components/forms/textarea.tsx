import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "block w-full",
          "min-h-[120px] px-4 py-3",
          "rounded-sm border bg-ink-700 text-ink-100",
          "border-ink-600",
          "font-text text-base placeholder:text-ink-400",
          "transition-[border-color,box-shadow] duration-150 ease-out",
          "outline-none resize-y",
          "focus-visible:border-pops-yellow-500 focus-visible:ring-2 focus-visible:ring-pops-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800",
          "data-[error=true]:border-danger-500 aria-[invalid=true]:border-danger-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...rest}
      />
    );
  },
);
