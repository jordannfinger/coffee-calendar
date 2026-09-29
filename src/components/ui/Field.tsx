import { Children, cloneElement, isValidElement, type ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const descriptionId = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined;
  const describedChildren = Children.map(children, (child) => {
    if (!isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(child) || child.props.id !== htmlFor) return child;
    return cloneElement(child, {
      "aria-describedby": [child.props["aria-describedby"], descriptionId].filter(Boolean).join(" ") || undefined,
      "aria-invalid": error ? true : child.props["aria-invalid"],
    });
  });

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {describedChildren}
      {hint && !error && <p id={`${htmlFor}-hint`} className="text-xs text-foreground-muted">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-status-not-ready-text">
          {error}
        </p>
      )}
    </div>
  );
}

const baseInputClasses =
  "min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-foreground-muted/70 hover:border-foreground-muted/50 focus:border-brand disabled:cursor-not-allowed disabled:opacity-60";

export { baseInputClasses };
