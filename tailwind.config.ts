import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        mytheme: {
        "primary": "#d1d5db",
                
        "secondary": "#d1d5db",
                
        "accent": "#86efac",
                
        "neutral": "#292524",
                
        "base-100": "#f3f4f6",
                
        "info": "#0000ff",
                
        "success": "#10b981",
                
        "warning": "#fde047",
                
        "error": "#f87171",
        },
      },
    ],
  },
};
export default config;
