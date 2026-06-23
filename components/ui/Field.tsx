import type {
  InputHTMLAttributes,
  JSX,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

type FieldBaseProps = {
  className?: string;
  error?: string;
  hint?: string;
  inputClassName?: string;
  label: string;
  labelClassName?: string;
};

type InputFieldProps = FieldBaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    textarea?: false;
  };

type TextareaFieldProps = FieldBaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    textarea: true;
  };

export function Field(props: InputFieldProps): JSX.Element;
export function Field(props: TextareaFieldProps): JSX.Element;
export function Field(props: InputFieldProps | TextareaFieldProps) {
  const {
    className,
    error,
    hint,
    id,
    inputClassName,
    label,
    labelClassName,
    textarea,
    ...rest
  } = props;

  const resolvedId = id ?? label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  const describedBy = [hint ? `${resolvedId}-hint` : null, error ? `${resolvedId}-error` : null]
    .filter(Boolean)
    .join(" ");

  const controlClassName = cn(
    "w-full rounded-[var(--radius-md)] border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground",
    "placeholder:text-foreground-muted/80",
    "transition-colors duration-200 motion-reduce:transition-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    "disabled:cursor-not-allowed disabled:opacity-55",
    inputClassName,
  );

  if (textarea) {
    const textareaProps = rest as TextareaHTMLAttributes<HTMLTextAreaElement>;

    return (
      <div className={cn("grid gap-2", className)}>
        <label className={cn("text-sm font-medium text-foreground", labelClassName)} htmlFor={resolvedId}>
          {label}
        </label>
        <textarea
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(controlClassName, "min-h-32 resize-y")}
          id={resolvedId}
          {...textareaProps}
        />
        {hint ? (
          <p className="text-sm text-foreground-muted" id={`${resolvedId}-hint`}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground" id={`${resolvedId}-error`}>
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const inputProps = rest as InputHTMLAttributes<HTMLInputElement>;

  return (
    <div className={cn("grid gap-2", className)}>
      <label className={cn("text-sm font-medium text-foreground", labelClassName)} htmlFor={resolvedId}>
        {label}
      </label>
      <input
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={controlClassName}
        id={resolvedId}
        {...inputProps}
      />
      {hint ? (
        <p className="text-sm text-foreground-muted" id={`${resolvedId}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground" id={`${resolvedId}-error`}>
          <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
