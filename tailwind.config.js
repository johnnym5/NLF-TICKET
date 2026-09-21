/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FBFBFA',
          inset: '#F4F6F4',
        },
        sage: {
          light: '#EAF4EE',
          base: '#D8EADF',
          hover: '#C2DEC9',
          deep: '#1E4D38',
          border: '#BEDBC7',
        },
        champagne: {
          light: '#FFF9ED',
          base: '#FEF3D6',
          badge: '#FCE6A8',
          text: '#8D6B1B',
          border: '#F9DC8A',
        },
        status: {
          successBg: '#DCFCE7',
          successText: '#166534',
          successBorder: '#86EFAC',
          duplicateBg: '#FEE2E2',
          duplicateText: '#991B1B',
          duplicateBorder: '#FCA5A5',
          pendingBg: '#FEF9C3',
          pendingText: '#854D0E',
          pendingBorder: '#FDE047',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
        'outline': '0 0 0 3px rgba(30, 77, 56, 0.15)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fadeOut': 'fadeOut 0.5s cubic-bezier(0.7, 0, 0.84, 0) forwards',
        'slideUp': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slideDown': 'slideDown 0.5s cubic-bezier(0.7, 0, 0.84, 0) forwards',
      }
    },
  },
  plugins: [],
}
