import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-md': '6px 6px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
      },
      fontFamily: {
        brutal: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        brutal: {
          yellow: '#FFE500',
          pink: '#FF6B9C',
          cyan: '#00D4FF',
          lime: '#C4F000',
          orange: '#FF8A00',
          violet: '#8B5CF6',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}

export default config
