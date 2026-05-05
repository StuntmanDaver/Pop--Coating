import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "../../lib/utils";

const cardVariants = cva(
  [
    "rounded-sm border p-6",
    "transition-shadow duration-200 ease-out",
  ].join(" "),
  {
    variants: {
      tone: {
        dark: "bg-ink-700 text-ink-100 border-ink-600",
        light: "bg-paper text-ink-800 border-ink-200",
      },
      interactive: {
        true: "hover:shadow-3",
        false: "",
      },
    },
    defaultVariants: {
      tone: "dark",
      interactive: false,
    },
  },
);

type CardVariantProps = VariantProps<typeof cardVariants>;

export type CardProps = ComponentPropsWithoutRef<"div"> & CardVariantProps;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, tone, interactive, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ tone, interactive }), className)}
      {...rest}
    />
  );
});

export const CardHeader = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div">
>(function CardHeader({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 mb-4", className)}
      {...rest}
    />
  );
});

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<"h3">
>(function CardTitle({ className, ...rest }, ref) {
  return (
    <h3
      ref={ref}
      className={cn(
        "font-text text-lg font-bold leading-snug tracking-tight",
        className,
      )}
      {...rest}
    />
  );
});

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<"p">
>(function CardDescription({ className, ...rest }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm leading-relaxed opacity-80", className)}
      {...rest}
    />
  );
});

export const CardContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div">
>(function CardContent({ className, ...rest }, ref) {
  return <div ref={ref} className={cn(className)} {...rest} />;
});

export const CardFooter = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div">
>(function CardFooter({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-3 mt-6", className)}
      {...rest}
    />
  );
});
