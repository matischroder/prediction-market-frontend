/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        palette: {
          bg: {
            light: "#f9fafb",
            dark: "#18181b",
          },
          card: {
            light: "#fff",
            dark: "#23232b",
          },
          text: {
            light: "#1f2937",
            dark: "#f3f4f6",
          },
          border: {
            light: "#e5e7eb",
            dark: "#2d2d36",
          },
          primary: {
            light: "#2563eb",
            dark: "#60a5fa",
          },
          accent: {
            light: "#fbbf24",
            dark: "#f59e42",
          },
        },
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
        },
        danger: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};
