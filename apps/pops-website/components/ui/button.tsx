import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-sm",
    "font-text font-semibold text-sm",
    "px-6 py-3",
    "transition-[transform,box-shadow,opacity] duration-150 ease-out",
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-pops-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // Ensure children share width on loading by using a stable inline layout.
    "whitespace-nowrap select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:     "bg-pops-yellow-500 text-ink-900 shadow-2 hover:-translate-y-0.5 hover:bg-pops-yellow-300 hover:shadow-3",
        secondary:   "bg-transparent border border-ink-300 text-ink-100 hover:border-pops-yellow-500 hover:text-pops-yellow-300",
        ghost:       "bg-transparent text-ink-300 hover:text-pops-yellow-300",
        destructive: "bg-danger-500 text-paper hover:bg-danger-500/90",
        dark:        "bg-ink-900 text-pops-yellow-500 border border-ink-700 hover:bg-ink-800 hover:border-pops-yellow-500/60",
        outline:     "bg-transparent border border-ink-500 text-ink-100 hover:border-pops-yellow-500 hover:text-pops-yellow-300",
      },
      size: {
        default: "h-11",
        compact: "h-9 px-5 py-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariantProps & {
    asChild?: boolean;
    isLoading?: boolean;
  };

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    isLoading = false,
    disabled,
    type,
    children,
    ...rest
  },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  const mergedClassName = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    // Slot forwards props to the single child; do not inject loading UI here
    // (asChild is for wrapping anchors/links — they don't have a loading state).
    return (
      <Comp ref={ref} className={mergedClassName} {...rest}>
        {children}
      </Comp>
    );
  }

  // Loading swaps children for a centered spinner while preserving width.
  // We render the original children invisibly (aria-hidden) so the layout
  // box keeps its measured width, then absolutely-position the spinner.
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={mergedClassName}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? (
        <span className="relative inline-flex items-center justify-center">
          <span aria-hidden="true" className="invisible inline-flex items-center gap-2">
            {children}
          </span>
          <span className="absolute inset-0 inline-flex items-center justify-center">
            <Spinner />
          </span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});
