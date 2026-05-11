/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        discord: {
          dark: {
            bg: "#313338",
            sidebar: "#2B2D31",
            tertiary: "#1E1F22",
            accent: "#5865F2",
            text: "#DBDEE1",
            muted: "#949BA4",
            header: "#F2F3F5",
          },
          light: {
            bg: "#FFFFFF",
            sidebar: "#F2F3F5",
            tertiary: "#E3E5E8",
            accent: "#5865F2",
            text: "#060607",
            muted: "#4E5058",
            header: "#2E3338",
          },
          blurple: "#5865F2",
          green: "#23A559",
          yellow: "#F0B232",
          red: "#F23F43",
        },
        primary: {
          DEFAULT: "#5865F2",
          foreground: "#FFFFFF",
        },
        background: {
          DEFAULT: "var(--background)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          container: "var(--surface-container)",
        },
        on: {
          surface: {
            DEFAULT: "var(--on-surface)",
            variant: "var(--on-surface-variant)",
          },
        }
      },
      borderRadius: {
        DEFAULT: "4px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        full: "9999px",
      },
      fontFamily: {
        headline: ["Manrope_700Bold"],
        body: ["Inter_400Regular"],
        label: ["Inter_600SemiBold"],
      },
    },
  },
  plugins: [],
};
