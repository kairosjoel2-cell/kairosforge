import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "#0a0a0f",
        panel: "#111118",
        edge: "#1e1e28",
        accent: "#4f7cff",
        violet: "#8b5cf6",
      },
    },
  },
  plugins: [],
};

export default config;
