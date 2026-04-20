import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        "sf-pro": [
          "var(--font-sf-pro)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "sans-serif",
        ],
        sans: [
          "var(--font-sf-pro)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-secondary": "var(--surface-secondary)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        cal: {
          peach: {
            50: "#fdf6f4", 100: "#fbeee9", 200: "#f7ddd3", 300: "#f2c4b3",
            400: "#e9a089", 500: "#de7c60", 600: "#cb5a40", 700: "#aa4633",
            800: "#8c3b2e", 900: "#74352b",
          },
          charcoal: {
            50: "#f5f5f6", 100: "#e6e6e7", 200: "#d0d0d2", 300: "#aeaeb2",
            400: "#86868b", 500: "#6b6b70", 600: "#5a5a5f", 700: "#4d4d51",
            800: "#434346", 900: "#3a3a3d", 950: "#1a1a1e",
          },
        },
        coral: {
          50: "#fff5f1", 100: "#ffe5da", 200: "#ffc7b1", 300: "#ffa484",
          400: "#fb7e56", 500: "#f15a2b", 600: "#de4416", 700: "#b93611",
          800: "#932d13", 900: "#752814",
        },
        amber: {
          50: "#fff9eb", 100: "#fff0c7", 200: "#ffe088", 300: "#ffc848",
          400: "#ffb01e", 500: "#f58b09", 600: "#d96b06", 700: "#b24b09",
          800: "#913a0f", 900: "#77300f",
        },
        teal: {
          50: "#effefb", 100: "#c7fef4", 200: "#90fbea", 300: "#51efdb",
          400: "#1fd9c4", 500: "#08beab", 600: "#02988b", 700: "#057970",
          800: "#0a5f5a", 900: "#0d4f4b",
        },
        violet: {
          50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
          400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9",
          800: "#5b21b6", 900: "#4c1d95",
        },
        emerald: {
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
          400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
          800: "#065f46", 900: "#064e3b",
        },
        rose: {
          50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af",
          400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c",
          800: "#9f1239", 900: "#881337",
        },
        sky: {
          50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc",
          400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1",
          800: "#075985", 900: "#0c4a6e",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "cal-sm": "0 1px 3px -1px rgba(0, 0, 0, 0.04), 0 2px 6px -2px rgba(0, 0, 0, 0.04)",
        cal: "0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 4px 16px -4px rgba(0, 0, 0, 0.04)",
        "cal-lg": "0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.06)",
        "cal-xl": "0 8px 20px -4px rgba(0, 0, 0, 0.08), 0 16px 40px -8px rgba(0, 0, 0, 0.08)",
        neumorphic:
          "0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 4px 16px -4px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)",
        "neumorphic-lg":
          "0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)",
        "tab-bar":
          "0 -2px 10px -2px rgba(0, 0, 0, 0.04), 0 4px 20px -4px rgba(0, 0, 0, 0.08)",
        "glow-coral":
          "0 12px 32px -12px rgba(241, 90, 43, 0.45), 0 0 0 1px rgba(241, 90, 43, 0.08)",
        "glow-amber":
          "0 12px 32px -12px rgba(245, 139, 9, 0.45), 0 0 0 1px rgba(245, 139, 9, 0.08)",
        "glow-teal":
          "0 12px 32px -12px rgba(8, 190, 171, 0.4), 0 0 0 1px rgba(8, 190, 171, 0.08)",
        "glow-violet":
          "0 12px 32px -12px rgba(139, 92, 246, 0.45), 0 0 0 1px rgba(139, 92, 246, 0.08)",
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #fb7e56 0%, #f15a2b 40%, #8b5cf6 100%)",
        "gradient-header":
          "linear-gradient(120deg, rgba(251,126,86,0.18) 0%, rgba(245,139,9,0.12) 35%, rgba(139,92,246,0.18) 100%)",
        "gradient-teal-violet":
          "linear-gradient(135deg, #1fd9c4 0%, #8b5cf6 100%)",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "safe-top": "env(safe-area-inset-top, 0px)",
      },
    },
  },
  plugins: [],
};

export default config;
