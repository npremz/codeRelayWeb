import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "var(--color-obsidian)",
        sand: "var(--color-sand)",
        signal: "var(--color-signal)",
        lime: "var(--color-lime)",
        steel: "var(--color-steel)",
        fog: "var(--color-fog)"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0, 0, 0, 0.3)"
      }
    }
  },
  plugins: []
};

export default config;
