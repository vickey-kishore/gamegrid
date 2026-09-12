import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      background: "#0B1020",
      foreground: "#ffffff",
      gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
      },
      cyan: {
        400: "#22d3ee",
        500: "#06b6d4",
        600: "#0891b2",
      },
      pink: {
        400: "#f472b6",
        500: "#ec4899",
        600: "#db2777",
      },
      amber: {
        400: "#fbbf24",
        500: "#f59e0b",
        600: "#d97706",
      },
      emerald: {
        400: "#34d399",
        500: "#10b981",
        600: "#059669",
      },
      white: "#ffffff",
      black: "#000000",
    },
  },
  plugins: [],
};

export default config;