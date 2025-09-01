import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./api/**/*.js"],
  theme: {
    extend: {
      animation: {
        "spin": "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;