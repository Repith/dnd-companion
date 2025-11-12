/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "dnd-primary": "#8B5A3C",
        "dnd-secondary": "#D4AF37",
        "dnd-accent": "#722F37",
      },
    },
  },
  plugins: [],
};
