import { HTMLAttributes, ReactNode } from "react";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  accent?: "default" | "accent" | "success" | "hot" | "warn" | "cyan";
  noPad?: boolean;
};

const accentBorderMap: Record<string, string> = {
  default: "",
  accent: "border-l-[3px] border-l-accent",
  success: "border-l-[3px] border-l-success",
  hot: "border-l-[3px] border-l-hot",
  warn: "border-l-[3px] border-l-warn",
  cyan: "border-l-[3px] border-l-cyan"
};

const accentEyebrowMap: Record<string, string> = {
  default: "text-accent-light",
  accent: "text-accent-light",
  success: "text-success",
  hot: "text-hot",
  warn: "text-warn",
  cyan: "text-cyan"
};

export function Panel({
  eyebrow,
  title,
  children,
  accent = "default",
  noPad = false,
  className = "",
  ...props
}: PanelProps) {
  const borderClass = accentBorderMap[accent] ?? "";
  const eyebrowColorClass = accentEyebrowMap[accent] ?? "text-accent-light";

  return (
    <section
      className={`panel ${borderClass} ${noPad ? "!p-0" : ""} ${className}`.trim()}
      {...props}
    >
      {(eyebrow || title) && (
        <header className={`${noPad ? "px-6 pt-5 pb-1" : "mb-5"}`}>
          {eyebrow && (
            <p className={`panel-eyebrow ${eyebrowColorClass}`}>{eyebrow}</p>
          )}
          {title && <h2 className="panel-title">{title}</h2>}
        </header>
      )}
      {children}
    </section>
  );
}
