import { forwardRef, type ComponentPropsWithoutRef } from "react";

type ContainerProps = ComponentPropsWithoutRef<"div">;

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ className, children, ...rest }, ref) {
    const base = "pops-px-page mx-auto w-full max-w-[1280px]";
    return (
      <div ref={ref} className={className ? `${base} ${className}` : base} {...rest}>
        {children}
      </div>
    );
  },
);
