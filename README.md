# The Natural Plate 🥗

> **A skill, not a rulebook.**

The Natural Plate is a meal planning app and static site for creating meal plans from a whole-food plant-based recipe bank. Browse recipes, plan your week, and generate a smart grocery list — all in one place.

Built with the [Ivy](https://github.com/rlnorthcutt/ivy) + [Lattice](https://github.com/rlnorthcutt/lattice) CSS ecosystem, Alpine.js, and designed to work as a fully static site on GitHub Pages.

## Philosophy

The Natural Plate is built on the **Natural Eating** framework — a practical, evidence-informed synthesis of macrobiotic wisdom and modern nutrition science. It's organized around five principles:

| Principle | Question to ask |
|-----------|----------------|
| **Whole** | Is this food close to how it grows in nature? |
| **Seasonal** | What is growing right now, where I live? |
| **Conditional** | What does my body need right now? |
| **Balanced** | Am I eating a wide variety of whole plant foods? |
| **Mindful** | Am I present for this meal? |

Read the full guide at [`docs.html`](docs.html).

## Features

- **Browse Recipes** — Grid of recipe cards with filters (season, meal, dietary, tags, search text). Click to expand full recipe details.
- **Meal Plan** — 7-day grid (Mon–Sun) with 4 meal slots (breakfast, lunch, snack, dinner). Assign recipes via dropdown. Save/load named plans to/from `localStorage`.
- **Grocery List** — Generate a consolidated grocery list from any meal plan. Ingredients grouped by category (produce, grains, legumes, pantry, condiments, dairy). Check-off capability.
- **Dark Mode** — Full light/dark theme support via the `<dark-mode-toggle>` web component, with a prepaint script to prevent flash of unstyled content.
- **Fully Static** — Works on GitHub Pages with no server-side dependencies. All recipes load from a static `recipes.json` index.

## Adding Recipes

Recipes are stored as Markdown files with YAML front matter in the [`recipes/`](recipes/) directory.

### 1. Create a new recipe file

Copy the template:

```bash
cp recipes/_TEMPLATE.md recipes/06-my-new-recipe.md
```

Edit the YAML front matter:

```yaml
---
title: "My New Recipe"
slug: my-new-recipe
# image: "/recipes/images/my-new-recipe.jpg"  # optional
servings: 4
prep_time: "15 min"
cook_time: "30 min"
total_time: "45 min"
season: ["spring", "summer"]
meal: ["dinner"]
dietary: ["vegan", "wfpb", "gluten-free"]
difficulty: "easy"
tags: ["batch-cook", "one-pot"]
ingredients:
  - name: "brown rice"
    amount: "1 cup"
    type: "grains"
    kind: "whole grain"
  - name: "onion"
    amount: "1 medium"
    type: "produce"
    kind: "allium"
---
```

Then write the body with `## Description`, `## Instructions`, and `## Notes` sections.

### 2. Rebuild the index

```bash
python3 build_index.py
```

This regenerates `recipes.json` with all recipes, their metadata, and consolidated taxonomies.

### Ingredient Types

Use these standardized `type` values for proper grocery list grouping:

| Type | Category |
|------|----------|
| `produce` | Fresh fruits and vegetables |
| `grains` | Rice, oats, bread, pasta, tortillas |
| `legumes` | Beans, lentils, tofu, tempeh |
| `pantry` | Oils, spices, canned goods, sweeteners |
| `condiments` | Sauces, vinegars, oils |
| `dairy` | Yogurt, cheese, milk alternatives |

## Local Development

```bash
# Serve the site locally (any static server works)
cd natural-plate
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in your browser.

### Prerequisites

- Python 3 (for `build_index.py`)
- A modern browser (for Alpine.js and the `<dark-mode-toggle>` component)

### Project Structure

```
natural-plate/
├── index.html                 # Landing page
├── app.html                   # Meal planner app (Alpine.js)
├── app.js                     # Alpine.js components
├── docs.html                  # Natural Eating guide
├── theme.css                  # Ivy/Lattice theme tokens
├── site.css                   # Site-specific styles
├── dark-mode-toggle.min.js    # Dark mode web component
├── README.md                  # This file
├── build_index.py             # Recipe index generator
├── recipes.json               # Auto-generated recipe index
├── recipes/                   # Recipe markdown files
│   ├── _TEMPLATE.md           # Recipe template
│   ├── 01-*.md                # Recipe files
│   └── ...
└── images/                    # Recipe images (empty — placeholder icons used)
```

## Deploying to GitHub Pages

1. Push this directory to a GitHub repository.
2. Go to **Settings → Pages**.
3. Set **Source** to "Deploy from a branch".
4. Set **Branch** to `main` (or your default branch) and folder to `/` (root).
5. Click **Save**.

The site will be live at `https://<your-username>.github.io/<repo-name>/`.

**Note:** All paths are relative (`./css`, `./js`, etc.), so the site works from any subpath.

## Built With

- [Ivy](https://github.com/rlnorthcutt/ivy) — Classless CSS baseline
- [Lattice](https://github.com/rlnorthcutt/lattice) — 12-column layout utility
- [Alpine.js](https://alpinejs.dev/) — Lightweight JavaScript framework
- [dark-mode-toggle](https://github.com/rlnorthcutt/dark-mode-toggle) — Web component for theme switching

## License

Content is licensed under [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

You are free to share and adapt the material for any non-commercial purpose, as long as you provide attribution. Commercial use requires permission.

Code (HTML, CSS, JavaScript, build scripts) is MIT — do what you want with it.
