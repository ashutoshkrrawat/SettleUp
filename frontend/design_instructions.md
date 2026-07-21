# System Instructions: Frontend Design System & Architecture

You are tasked with building/maintaining a frontend project matching the design aesthetics and technical stack of the **First-PR** application. Follow these instructions strictly to ensure the design, animations, theme responsiveness, and overall premium aesthetic remain uniform and consistent.

---

## 1. Core Technology Stack

All frontend work must utilize the following libraries and integrations:
- **Framework & Routing**: React (v19) + Vite + React Router DOM (v7)
- **Styling**: Tailwind CSS v4 (configured via `@theme` in CSS instead of `tailwind.config.js`)
- **Icons**: `lucide-react` (clean, outline-style vector icons)
- **Animations**: `framer-motion` (for page transitions, drawer slides, hover states, and keyframe micro-interactions)
- **UI Primitives**: Radix UI (accessible headless components, e.g., `@radix-ui/react-slot`, `tabs`, `dropdown-menu`)
- **Toasts**: `sonner` (clean, styled toast notifications)
- **Charts**: `recharts` (customized to match the color themes)

---

## 2. Global Color System & Theming (No Hardcoding)

Do **NOT** use hardcoded hex values (e.g. `#191a1b` or `#F3C84C`) in utility classes. Always use the predefined Tailwind/CSS variable theme mappings. The theme supports a **Subtle Cream Light Mode** and a **MonkeyType Terminal Dark Mode**.

### CSS Theme Setup (`frontend/src/index.css`)
Ensure these variable maps are declared inside your main CSS input file:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 8px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
```

### Theme Palettes
*   **Light Theme (Subtle Cream & Gold)**:
    *   `--background`: `#e5e2da` (Soft cream background)
    *   `--foreground`: `#1f1f1f` (Soft black text/elements)
    *   `--card`: `#ffffff` (Pure white card surfaces)
    *   --primary: `#F3C84C` (Amber gold primary action color)
    *   `--primary-hover`: `#d29402`
    *   `--secondary`: `#f3efe5` (Lighter cream background)
    *   `--muted-foreground`: `#7a7a7a` (Muted gray)
    *   `--border`: `#dbd7cb` (Low contrast cream-gray border)
*   **Dark Theme (MonkeyType Terminal)**:
    *   `--background`: `#191a1b` (Near black, warm terminal tone)
    *   `--foreground`: `#e8dcc8` (Warm cream text)
    *   `--card`: `#1e1f20` (Barely-lifted dark surface)
    *   `--primary`: `#79a617` (Olive green accent)
    *   `--primary-hover`: `#96cc20`
    *   `--secondary`: `#242526`
    *   `--muted-foreground`: `#7a7b7d`
    *   `--border`: `#2c2d2e` (Warm charcoal border)

---

## 3. Typography Rules

To achieve a clean, premium, high-readability developer aesthetic:
1.  **Font Family**: Use `"Poppins", sans-serif` as the primary font family.
2.  **Strict Weight Ceiling**: Force light and normal weights universally to prevent chunky layouts:
    ```css
    * {
      font-weight: 400 !important;
    }
    body, button, input, select, textarea {
      font-family: var(--font-sans), sans-serif;
      font-weight: 300 !important;
    }
    /* Let bold/black headers override where explicitly required (e.g. font-bold, font-black) */
    ```

---

## 4. Premium Visual Effects

Always include the following premium components and styling touches:

### 1. The Background Glow Backdrop
Place a glowing gradient background on the screen. It is fixed, remains in the background, and dynamically shifts colors between light and dark themes:
```css
body::before {
  content: "";
  position: fixed;
  top: -250px;
  right: -250px;
  width: 950px;
  height: 950px;
  border-radius: 999px;
  background: radial-gradient(circle,
      rgba(214, 170, 50, 0.65) 0%,
      rgba(214, 170, 50, 0.30) 22%,
      rgba(214, 170, 50, 0.12) 45%,
      transparent 72%);
  pointer-events: none;
  z-index: -1;
  transition: background 0.4s ease;
}

/* In dark mode, shift to subtle low-opacity olive green glow */
.dark body::before {
  background: radial-gradient(circle,
      rgba(121, 166, 23, 0.08) 0%,
      rgba(121, 166, 23, 0.04) 35%,
      transparent 65%);
}
```

### 2. High-Attention Action Button Shimmer
For buttons requiring high user attention (e.g., CTA, landing buttons), append the `.premium-btn-attention` class:
```css
@keyframes shimmer-sweep {
  0% { transform: translateX(-150%) skewX(-20deg); }
  40%, 100% { transform: translateX(150%) skewX(-20deg); }
}

.premium-btn-attention {
  position: relative !important;
  overflow: hidden !important;
}

.premium-btn-attention::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  ) !important;
  transform: translateX(-150%) skewX(-20deg);
  animation: shimmer-sweep 5s infinite ease-in-out !important;
}
```

---

## 5. UI Layout & Component Guidelines

*   **Layout Containering**: Use rounded cards and borders to divide panels (e.g., `rounded-2xl` or `rounded-3xl` for main panels, `rounded-xl` for standard elements).
*   **Borders**: Keep borders thin and translucent where appropriate (e.g., `border border-border/50` or `border border-border/10`).
*   **Shadows**: Use light custom glows and soft shadows instead of deep harsh blacks (e.g., `shadow-[0_8px_24px_-6px_rgba(121,166,23,0.6)]` for colored actions, and standard `shadow-sm` / `shadow-md` for cards).
*   **Bento Grids**: Arrange dashboard statistics and details using Bento Grids (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`).
*   **Framing/Layouts**: Wrap pages inside a modern master layout:
    *   A desktop sidebar panel + mobile sliding drawer panel.
    *   An inner page viewport using `overflow-y-auto` to allow independent scrolling.
    *   Padding values of `p-3 gap-3 md:p-6 md:gap-6`.

---

## 6. Interaction & Micro-Animations

Use `framer-motion` to make interactive elements feel fluid and responsive:
1.  **Button Hover/Tap**:
    ```jsx
    import { motion } from 'framer-motion';
    
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-primary text-primary-foreground rounded-2xl px-5 py-4 font-extrabold"
    >
      Click Action
    </motion.button>
    ```
2.  **Backdrop & Drawer Modals**: Combine `AnimatePresence` with spring transitions (`transition={{ type: "spring", damping: 25, stiffness: 200 }}`) for sidebar slide-ins.
3.  **Scrollbars**: Styled to match the theme (Gold in light mode, Olive Green in dark mode), using thin layouts (`w-2` / `h-2`) and pill-shaped rounded thumbs.
