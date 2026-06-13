import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#147a72',
        'primary-light': '#1a9c90',
        'primary-dark': '#0e5c56',
        accent: '#1a9c90',
        'accent-light': '#2ab8ad',
        background: '#0D1117',
        'background-light': '#161B22',
        'background-card': '#1A1F26',
        surface: '#21262D',
        'surface-light': '#30363D',
        text: '#FFFFFF',
        'text-secondary': '#8B949E',
        'text-muted': '#6E7681',
        success: '#1a9c90',
        warning: '#F0A500',
        error: '#F85149',
        info: '#58A6FF',
        border: '#30363D',
        'border-light': '#484F58',
      },
    },
  },
};

export default config;
