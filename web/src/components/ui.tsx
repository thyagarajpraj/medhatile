import { cn } from "@/src/lib/cn";

const buttonBase =
  "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export function PrimaryButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        buttonBase,
        "bg-gradient-to-br from-brand-900 to-brand-800 text-white shadow-lg shadow-brand-900/25 hover:shadow-xl hover:shadow-brand-900/30",
        className,
      )}
      {...props}
    />
  );
}

export function GhostButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        buttonBase,
        "border border-slate-200 bg-white/90 text-brand-900 shadow-sm hover:border-slate-300 hover:bg-white",
        className,
      )}
      {...props}
    />
  );
}

export function NavLink({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        buttonBase,
        "border border-slate-200 bg-white/80 text-brand-900 shadow-sm hover:bg-white",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-4xl rounded-[1.75rem] border border-white/50 bg-white/60 shadow-2xl shadow-brand-900/10 backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

export function Shell<E extends React.ElementType = "div">({
  as,
  className,
  ...props
}: React.ComponentPropsWithoutRef<E> & { as?: E }) {
  const Component = as ?? "div";
  return <Component className={cn("min-h-screen px-4 py-6 sm:px-6 sm:py-8", className)} {...props} />;
}

export function Muted({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-slate-500", className)} {...props} />;
}

export function StatusBanner({
  variant = "info",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "info" | "error" }) {
  return (
    <div
      className={cn(
        "mb-4 rounded-2xl px-4 py-3 text-sm font-medium",
        variant === "error" ? "bg-rose-50 text-rose-700" : "bg-brand-50 text-brand-700",
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("grid gap-2 text-sm font-semibold text-slate-700", className)} {...props} />;
}

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-brand-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
        className,
      )}
      {...props}
    />
  );
}

export function SelectInput({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-brand-900 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
