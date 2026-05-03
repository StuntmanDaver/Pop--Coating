import { forwardRef, type LabelHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, ...rest },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        "block mb-2 font-text text-sm font-medium text-ink-100",
        className,
      )}
      {...rest}
    />
  );
});
