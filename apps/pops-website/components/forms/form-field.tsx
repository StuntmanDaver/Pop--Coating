import {
  Children,
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { Label } from "./label";

type ChildAttrs = HTMLAttributes<HTMLElement> & {
  id?: string;
  name?: string;
};

export interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export function FormField({
  label,
  name,
  required = false,
  error,
  helperText,
  children,
}: FormFieldProps) {
  const helpId = `${name}-help`;
  const message = error ?? helperText;
  const hasMessage = Boolean(message);

  const child = Children.only(children);

  const enhancedChild = isValidElement<ChildAttrs>(child)
    ? cloneElement(child, {
        id: child.props.id ?? name,
        name: child.props.name ?? name,
        "aria-invalid": error
          ? true
          : child.props["aria-invalid"],
        "aria-describedby": hasMessage
          ? [child.props["aria-describedby"], helpId]
              .filter(Boolean)
              .join(" ")
          : child.props["aria-describedby"],
      })
    : child;

  return (
    <div>
      <Label htmlFor={name}>
        {label}
        {required ? (
          <span className="text-pops-yellow-500"> *</span>
        ) : null}
      </Label>
      <div>{enhancedChild}</div>
      {hasMessage ? (
        <p
          id={helpId}
          className={
            error
              ? "mt-2 font-text text-sm text-danger-500"
              : "mt-2 font-text text-sm text-ink-400"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
