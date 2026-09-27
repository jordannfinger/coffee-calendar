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
    <div className="flex flex-col gap-1.5">
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
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60";

export { baseInputClasses };
