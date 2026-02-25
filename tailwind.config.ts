import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:        '#1a1209',
        parchment:  '#faf6ee',
        paper:      '#f0e9d6',
        vermillion: '#c0392b',
        gold:       '#d4a843',
        teal:       '#1a7a6e',
        sienna:     '#8b5a2b',
        spine:      '#2c1810',
        muted:      '#7a6a52',
        border:     '#c8b89a',
      },
      fontFamily: {
        sans:  ['var(--font-quicksand)', 'Quicksand', 'sans-serif'],
        serif: ['"Noto Serif JP"', 'Georgia', 'serif'],
        mono:  ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        card: '3px 3px 0 #c8b89a',
        'card-hover': '5px 5px 0 #c8b89a',
      },
    },
  },
  plugins: [],
}

export default config
