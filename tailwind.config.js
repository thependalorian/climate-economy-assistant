/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ACT Brand Primary Colors
        'midnight-forest': {
          DEFAULT: '#001818',
          50: '#F0F8F8',
          100: '#E0F0F0',
          200: '#C2E1E1',
          300: '#A3D2D2',
          400: '#85C3C3',
          500: '#66B4B4',
          600: '#4D9090',
          700: '#336C6C',
          800: '#1A4848',
          900: '#001818',
          950: '#000C0C'
        },
        'moss-green': {
          DEFAULT: '#394816',
          50: '#F4F6F0',
          100: '#E9EDE1',
          200: '#D3DBC3',
          300: '#BDC9A5',
          400: '#A7B787',
          500: '#91A569',
          600: '#7B934B',
          700: '#65812D',
          800: '#4F6F0F',
          900: '#394816',
          950: '#2A360F'
        },
        'spring-green': {
          DEFAULT: '#B2DE26',
          50: '#F8FDE6',
          100: '#F1FBCD',
          200: '#E3F79B',
          300: '#D5F369',
          400: '#C7EF37',
          500: '#B2DE26',
          600: '#9BC41F',
          700: '#84AA18',
          800: '#6D9011',
          900: '#56760A',
          950: '#3F5C03'
        },
        'seafoam-blue': {
          DEFAULT: '#E0FFFF',
          50: '#FFFFFF',
          100: '#FFFFFF',
          200: '#FFFFFF',
          300: '#F8FFFF',
          400: '#F0FFFF',
          500: '#E0FFFF',
          600: '#C8FFFF',
          700: '#B0FFFF',
          800: '#98FFFF',
          900: '#80FFFF',
          950: '#68FFFF'
        },
        'sand-gray': {
          DEFAULT: '#EBE9E1',
          50: '#FFFFFF',
          100: '#FEFEFE',
          200: '#F8F7F3',
          300: '#F3F1EB',
          400: '#EFEDE7',
          500: '#EBE9E1',
          600: '#D9D5C9',
          700: '#C7C1B1',
          800: '#B5AD99',
          900: '#A39981',
          950: '#918569'
        },
        // ACT Brand Secondary Colors
        'mint': '#B2DE26', // Spring Green 30% tint
        'sage': '#6B8A3A', // Moss Green 60% tint
        'silver': '#4D5A5A', // Midnight Forest 30% tint
        // Standard colors for compatibility
        'white': '#FFFFFF',
        'black': '#001818', // Use Midnight Forest instead of pure black
        'gray': {
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E8EAED',
          300: '#DADCE0',
          400: '#BDC1C6',
          500: '#9AA0A6',
          600: '#80868B',
          700: '#5F6368',
          800: '#3C4043',
          900: '#202124'
        }
      },
      fontFamily: {
        // ACT Brand Typography
        'display': ['Helvetica', 'Arial', 'sans-serif'], // Title font
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'], // Body font
        'body': ['Inter', 'ui-sans-serif', 'system-ui']
      },
      fontSize: {
        // ACT Brand Typography Sizes with proper tracking
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.02em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '7xl': ['4.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '8xl': ['6rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '9xl': ['8rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }]
      },
      letterSpacing: {
        'act-tight': '-0.02em', // ACT Brand standard tracking
        'act-normal': '0em',
        'act-wide': '0.025em'
      },
      lineHeight: {
        'act-tight': '1.15', // ACT Brand heading line height
        'act-normal': '1.25', // ACT Brand body line height
        'act-relaxed': '1.5'
      },
      spacing: {
        // ACT Brand spacing based on logo grid system
        'act-xs': '0.25rem',
        'act-sm': '0.5rem',
        'act-md': '1rem',
        'act-lg': '1.5rem',
        'act-xl': '2rem',
        'act-2xl': '3rem',
        'act-3xl': '4rem'
      },
      borderRadius: {
        'act': '0.5rem', // ACT Brand standard border radius
        'act-lg': '0.75rem',
        'act-xl': '1rem'
      }
    }
  },
  plugins: []
};