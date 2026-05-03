import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          dark: '#085041',
          mid: '#0F6E56',
          deep: '#0F1A14',
        },
        amber: {
          DEFAULT: '#EF9F27',
          light: '#FAEEDA',
          dark: '#633806',
        },
        red: {
          DEFAULT: '#E24B4A',
          light: '#FCEBEB',
          dark: '#791F1F',
        },
        blue: {
          DEFAULT: '#378ADD',
          light: '#E6F1FB',
          dark: '#0C447C',
        },
        purple: {
          DEFAULT: '#7F77DD',
          light: '#EEEDFE',
          dark: '#3C3489',
        },
        offwhite: '#F7F6F2',
        charcoal: '#1A1A18',
        midgray: '#6B6B65',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
