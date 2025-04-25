/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'midnight-forest': '#001818',
        'moss-green': '#394816',
        'spring-green': '#B2DE26',
        'seafoam-blue': '#E0FFFF',
        'sand-gray': '#EBE9E1',
      },
      borderRadius: {
        'btn': '0.5rem',
        'box': '1rem',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        act: {
          "primary": "#B2DE26",
          "secondary": "#394816",
          "accent": "#E0FFFF",
          "neutral": "#001818",
          "base-100": "#FFFFFF",
          "base-200": "#EBE9E1",
          "base-300": "rgba(178, 222, 38, 0.3)",
          "info": "#E0FFFF",
          "success": "#B2DE26",
          "warning": "#394816",
          "error": "#001818",
        },
      },
      "light",
    ],
  },
}
