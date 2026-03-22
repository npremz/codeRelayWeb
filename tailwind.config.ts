import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "var(--color-void)",
        surface: "var(--color-surface)",
        elevated: "var(--color-elevated)",
        border: "var(--color-border)",
        "border-hover": "var(--color-border-hover)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        "text-faint": "var(--color-text-faint)",
        accent: "var(--color-accent)",
        "accent-light": "var(--color-accent-light)",
        "accent-glow": "var(--color-accent-glow)",
        hot: "var(--color-hot)",
        "hot-glow": "var(--color-hot-glow)",
        success: "var(--color-success)",
        "success-glow": "var(--color-success-glow)",
        warn: "var(--color-warn)",
        "warn-glow": "var(--color-warn-glow)",
        cyan: "var(--color-cyan)",
        "cyan-glow": "var(--color-cyan-glow)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)"
      }
    }
  },
  plugins: []
};

export default config;
