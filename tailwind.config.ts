import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EE2A2A',
          light: '#F15858',
          dark: '#C91E1E',
        },
        secondary: {
          DEFAULT: '#58A4B0',
          light: '#7BBAC4',
          dark: '#47848E',
        },
        dark: '#303036',
        light: '#FFFAFF',
        black: '#050401',
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'Helvetica', 'sans-serif'],
        heading: ['Raleway', 'Playfair Display', 'Rubik', 'sans-serif'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
