# Design System: High-End Editorial AI Pipeline

## 1. Overview & Creative North Star
**Creative North Star: The Informed Curator**

This design system is engineered to transform a high-speed AI pipeline into a sophisticated editorial workspace. Moving away from the "generic SaaS" aesthetic, this system prioritizes the authority of the written word and the precision of algorithmic data. We achieve this through **Organic Brutalism**: a philosophy that combines rigid, functional layouts with the warmth of high-end print journalism. 

The experience must feel like a premium physical newspaper being assembled in real-time. We break the "template" look by using intentional white space, high-contrast typographic scales, and a sidebar that acts as a monolithic anchor against a "warm paper" canvas.

---

## 2. Colors & Surface Architecture

The palette is anchored in a professional, high-contrast editorial aesthetic.

### Tonal Palette
- **Deep Slate (Sidebar):** `#0A0A0C` (Foundation for focus and navigation)
- **Amber (Accent):** `#E8820C` (Human oversight, highlighting, and primary actions)
- **Paper White (Main BG):** `#F7F6F3` (Mimics high-grade newsprint to reduce eye strain)
- **Pure Surface:** `#FFFFFF` (Used only for cards to create a "lift" from the paper background)

### The "No-Line" Rule
To maintain a premium feel, **1px solid borders are prohibited for sectioning.** Large layout blocks must be separated by background color shifts alone. For example, a secondary utility panel should use `surface_container_low` (`#f4f3f0`) against the `surface` (`#faf9f6`) background. Boundaries are felt through tonal depth, not drawn with lines.

### Surface Hierarchy
We utilize a "Stacked Paper" metaphor. Instead of a flat grid, treat the UI as physical layers:
1.  **Level 0 (Base):** `surface` (`#faf9f6`) - The primary canvas.
2.  **Level 1 (Sections):** `surface_container` (`#efeeeb`) - Defines large workspace areas.
3.  **Level 2 (Active Cards):** `surface_container_lowest` (`#ffffff`) - For primary content modules.

---

## 3. Typography: The Editorial Voice

We employ a tri-font system to categorize information types instantly.

| Category | Typeface | Intent |
| :--- | :--- | :--- |
| **Editorial** | **Newsreader** | Headlines, Body Copy, Story Summaries. Conveys authority and "The News." |
| **Interface** | **Inter** | Buttons, Labels, Navigation, Tooltips. Provides functional clarity. |
| **Technical** | **DM Mono** | Model IDs, Confidence Scores, Metadata, Timestamps. Signals AI-generated data. |

### Typography Scale
- **Display-LG (Newsreader):** 3.5rem — For major dashboard milestones.
- **Headline-MD (Newsreader):** 1.75rem — For article titles within the pipeline.
- **Title-SM (Newsreader):** 1rem — For card headings.
- **Label-MD (Inter):** 0.75rem — All-caps for metadata labels to ensure "UI" is distinct from "Content."
- **Body-MD (Newsreader):** 0.875rem — Primary reading grade for AI-generated drafts.

---

## 4. Elevation & Depth

In line with the "Informed Curator" star, we avoid heavy shadows. Depth is achieved via **Tonal Layering**.

- **The Layering Principle:** To create hierarchy, place a `#FFFFFF` card on a `#F7F6F3` background. This "Soft Lift" provides enough contrast for the eye without the clutter of drop shadows.
- **Shadow Constraint:** Use only for floating elements (e.g., Modals, Context Menus).
  - **Ambient Shadow:** `0 1px 3px rgba(0,0,0,0.08)`. This mimics natural light hitting a sheet of paper.
- **The "Ghost Border":** Where accessibility requires a container boundary, use `outline_variant` (`#dcc2af`) at 20% opacity. It should be barely perceptible, serving as a suggestion of a boundary rather than a hard wall.

---

## 5. Components

### Sidebar Navigation
- **Width:** 256px.
- **Inactive:** Transparent background, `Secondary Text` color.
- **Active:** Background `#1E293B` (Slate-800) with a 4px left-aligned border of `Amber` (`#E8820C`). This creates a "marker" effect.

### Buttons & Inputs
- **Primary Button:** Background `#E8820C`, Text `#FFFFFF`, Radius 8px.
- **Secondary Button:** Ghost style with `outline_variant` (`#dcc2af`) at 20% opacity.
- **Input Fields:** Radius 8px. Use `DM Mono` for any input that feeds into an AI prompt to remind the user of the "Technical" nature of the interaction.

### Cards & Lists
- **The Divider Rule:** Forbid 1px horizontal dividers in lists. Use `Spacing-4` (1rem) or `Spacing-6` (1.5rem) of vertical white space to separate list items. 
- **Card Styling:** 12px border radius. Use `surface_container_lowest` (`#FFFFFF`) to pop against the warm background.

### Status Badges
- Use 8px radius. Text should be `Inter` Bold, 10px.
- **Success:** `#059669` (Green)
- **Error:** `#DC2626` (Red)
- **Warning:** `#D97706` (Amber)
- **Info:** `#2563EB` (Blue)
- *Note: Backgrounds of badges should be the status color at 10% opacity to maintain a "marker highlight" feel.*

---

## 6. Do's and Don'ts

### Do
- **Do** lean into asymmetry. If a content card is 2/3 of the screen, allow the right 1/3 to be empty "Paper" to emphasize focus.
- **Do** use `DM Mono` for confidence scores (e.g., "98% Match"). This validates the AI's presence.
- **Do** use `Newsreader` for any text that a reader would see on the front page of a newspaper.

### Don't
- **Don't** use 100% black text. Always use `Primary Text` (`#1A1A1A`) to maintain the "ink-on-paper" softness.
- **Don't** use gradients or blurs. The system relies on flat, confident color blocks and sophisticated type.
- **Don't** use lines to separate content sections. Rely on the `Spacing Scale` and `Surface Hierarchy` to define the architecture.
- **Don't** use icons as primary navigation without labels. In an editorial context, words are the primary vehicle of meaning.