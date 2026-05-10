"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

import { cn } from "../../lib/utils";

export type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(function Checkbox({ className, ...rest }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        // 44x44 tap target via padding around the visible 18x18 box
        "group inline-flex h-11 w-11 items-center justify-center",
        "rounded-sm",
        "outline-none",
        "focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          // Visible 18x18 box
          "flex h-[18px] w-[18px] items-center justify-center",
          "rounded-sm border-2 border-ink-400 bg-ink-700",
          "transition-colors duration-150 ease-out",
          "group-hover:border-ink-300",
          "group-data-[state=checked]:border-pops-yellow-500 group-data-[state=checked]:bg-pops-yellow-500",
          "group-data-[state=indeterminate]:border-pops-yellow-500 group-data-[state=indeterminate]:bg-pops-yellow-500",
          "group-aria-[invalid=true]:border-danger-500",
        )}
      >
        <CheckboxPrimitive.Indicator forceMount className="flex items-center justify-center">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            className={cn(
              "h-[14px] w-[14px] text-ink-900",
              "opacity-0 transition-opacity duration-150 ease-out",
              "group-data-[state=checked]:opacity-100",
              "group-data-[state=indeterminate]:opacity-100",
            )}
          >
            <path
              d="M3.5 8.5L6.5 11.5L12.5 5"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );
});
