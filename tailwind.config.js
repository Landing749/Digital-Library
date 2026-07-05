/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm off-white "paper" tones used for backgrounds and cards.
        parchment: {
          50: '#faf6ee',
          100: '#f2eada',
          200: '#e6d9bd'
        },
        // Body text / neutral ink tones.
        ink: {
          500: '#6b6459',
          700: '#3f3a32',
          900: '#221f1a'
        },
        // Deep green used for the sidebar ("book stacks") and primary actions.
        stacks: {
          400: '#7d9482',
          600: '#3d5b47',
          700: '#31493a',
          800: '#24362b'
        },
        // Warm gold/brass accent for "in circulation" / borrowed states.
        brass: {
          500: '#b8863f',
          600: '#9c6f31'
        },
        // Red accent reserved for overdue / rejected / destructive states.
        overdue: {
          500: '#b1493f',
          600: '#943a31'
        }
      },
      fontFamily: {
        display: ['"Libre Caslon Text"', '"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        // Faint ruled lines, evoking an index/catalog card.
        'card-lines': 'repeating-linear-gradient(transparent, transparent 27px, rgba(34,31,26,0.05) 28px)'
      }
    }
  },
  plugins: []
};
