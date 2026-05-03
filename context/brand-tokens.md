# Realtor Wisdom — Brand Tokens

## Colors

| Token | Hex | Usage |
|---|---|---|
| `teal.DEFAULT` | `#1D9E75` | Primary brand color — buttons, key accents, RIS positive |
| `teal.light` | `#E1F5EE` | Soft teal background — cards, pills |
| `teal.dark` | `#085041` | Headings on light bg, borders on dark |
| `teal.mid` | `#0F6E56` | Hover state, mid-depth accents |
| `teal.deep` | `#0F1A14` | Deep background (deal room, dark surfaces) |
| `amber.DEFAULT` | `#EF9F27` | Pending / in-progress / belief capital |
| `amber.light` | `#FAEEDA` | Soft amber background |
| `amber.dark` | `#633806` | Amber text on light bg |
| `red.DEFAULT` | `#E24B4A` | Blocked / gap / risk |
| `red.light` | `#FCEBEB` | Soft red background |
| `red.dark` | `#791F1F` | Red text on light bg |
| `blue.DEFAULT` | `#378ADD` | Information / system / institutional |
| `blue.light` | `#E6F1FB` | Soft blue background |
| `blue.dark` | `#0C447C` | Blue text on light bg |
| `purple.DEFAULT` | `#7F77DD` | Real Wisdom AI accents |
| `purple.light` | `#EEEDFE` | Soft purple background |
| `purple.dark` | `#3C3489` | Purple text on light bg |
| `offwhite` | `#F7F6F2` | Page background (light surfaces) |
| `charcoal` | `#1A1A18` | Body text |
| `midgray` | `#6B6B65` | Secondary text, captions |

## Typography

- **Headings:** DM Serif Display (Google Fonts) — fall back to Georgia, serif.
- **Body & UI:** DM Sans (Google Fonts) — fall back to -apple-system, BlinkMacSystemFont, sans-serif.
- Self-host both in `public/fonts/` for production. Use `next/font/google` in dev.

## Tailwind config

Paste this into `tailwind.config.ts` under `theme.extend`:

```ts
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
  serif: ['DM Serif Display', 'Georgia', 'serif'],
  sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
},
```

## Status mapping (use everywhere)

| Status | Color |
|---|---|
| `done` / `approved` / `confirmed` | `teal` |
| `pending` / `in_loi` / `active` / `todo` | `amber` |
| `blocked` / `gap` | `red` |
| `info` / `system` | `blue` |
| `real_wisdom` / `ai` / `belief_capital` | `purple` |

## Surfaces

- **Light surface:** `offwhite` (`#F7F6F2`) page bg, white cards, `charcoal` text.
- **Dark surface (deal room):** `teal.deep` (`#0F1A14`) page bg, slightly lifted cards, `offwhite` text.
- **Real Wisdom panel:** `purple.light` background or dark variant `#1A1832`, with `purple` accents.
