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
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 10px 28px -4px rgba(15, 23, 42, 0.1), 0 4px 10px -2px rgba(15, 23, 42, 0.05)',
        'elevated': '0 20px 45px -8px rgba(15, 23, 42, 0.16), 0 8px 18px -4px rgba(30, 77, 56, 0.1)',
        '3d': '0 18px 40px -6px rgba(15, 23, 42, 0.16), 0 8px 16px -4px rgba(15, 23, 42, 0.08), inset 0 1.5px 0 rgba(255, 255, 255, 0.9)',
        '3d-btn': '0 10px 24px -4px rgba(30, 77, 56, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
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
