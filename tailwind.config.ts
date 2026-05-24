import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        paper: "#f7f5ef",
        coal: "#2f332f",
        steel: "#52708a",
        amber: "#d59c28",
        moss: "#60735a"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(32, 33, 36, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
