import { HTMLAttributes, ReactNode } from "react";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
};

export function Panel({ eyebrow, title, children, className = "", ...props }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()} {...props}>
      {(eyebrow || title) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <p className="panel-eyebrow">{eyebrow}</p>}
            {title && <h2 className="panel-title">{title}</h2>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
