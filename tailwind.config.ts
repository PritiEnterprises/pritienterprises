import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        surface: {
          DEFAULT: "#f8fafc",
          card: "#ffffff",
          muted: "#f1f5f9",
        },
        navy: {
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 4px 16px -2px rgb(15 23 42 / 0.08)",
        "card-hover": "0 8px 30px -4px rgb(15 23 42 / 0.12)",
        sidebar: "4px 0 24px -4px rgb(0 0 0 / 0.15)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
