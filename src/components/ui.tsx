"use client";

import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Panel({
  title,
  icon,
  action,
  children,
  className,
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx("rounded-3xl border border-line bg-surface p-5", className)}
      aria-label={title}
    >
      {title && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-wide text-muted uppercase">
            {icon}
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "secondary",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl px-5 text-[17px] font-medium transition-colors duration-150 active:scale-[0.98] disabled:opacity-50",
        variant === "primary" && "bg-accent text-on-accent active:bg-accent-strong",
        variant === "secondary" &&
          "border border-line-strong bg-surface-2 text-ink active:bg-surface-3",
        variant === "ghost" && "text-ink active:bg-surface-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Link styled like a button (for opening Google Calendar). */
export function LinkButton({
  href,
  children,
  className,
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: Variant;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-2xl px-5 text-[17px] font-medium transition-colors duration-150 active:scale-[0.98]",
        variant === "primary" && "bg-accent text-on-accent active:bg-accent-strong",
        variant === "secondary" &&
          "border border-line-strong bg-surface-2 text-ink active:bg-surface-3",
        variant === "ghost" && "text-ink active:bg-surface-2",
        className,
      )}
    >
      {children}
    </a>
  );
}

export function IconButton({
  label,
  children,
  className,
  active,
  ...props
}: ComponentProps<"button"> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-150 active:scale-95",
        active
          ? "border-transparent bg-accent text-on-accent"
          : "border-line-strong bg-surface-2 text-ink active:bg-surface-3",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-16 w-full items-center justify-between gap-6 rounded-2xl px-1 text-left"
    >
      <span>
        <span className="block text-[17px] font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[15px] text-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          "relative h-9 w-16 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-accent" : "bg-surface-3",
        )}
      >
        <span
          className={cx(
            "absolute top-1 left-1 size-7 rounded-full bg-white shadow transition-transform duration-200",
            checked && "translate-x-7",
          )}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-2xl bg-surface-2 p-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-12 flex-1 rounded-xl px-4 text-[16px] font-medium whitespace-nowrap transition-colors duration-150",
            o.value === value ? "bg-surface-3 text-ink shadow-sm" : "text-muted active:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
