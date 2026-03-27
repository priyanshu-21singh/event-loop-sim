import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:     '#020208',
        ngreen: '#00ffb3',
        ncyan:  '#00c8ff',
        npurple:'#b94fff',
        npink:  '#ff2060',
        norange:'#ff8800',
        nyellow:'#ffdd00',
        ndim:   '#1a1a3a',
        nmid:   '#4a5070',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono:     ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config