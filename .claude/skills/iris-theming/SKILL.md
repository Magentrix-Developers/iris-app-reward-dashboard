---
name: iris-theming
description: CSS and styling guidelines for Iris Vue components. Use when writing or modifying CSS, SCSS, class attributes, or styling in Vue templates. Enforces iris-* wrapper system, BEM naming, dark mode theming, and component SCSS patterns.
user-invocable: false
---

## Core Rule: No Raw Tailwind

**Never use raw Tailwind utility classes in Vue templates.**

Every Tailwind utility has an `iris-` prefixed wrapper defined in `wrapper.scss`. Use the wrapper instead.

```html
<!-- WRONG -->
<div class="p-4 flex items-center gap-2 text-sm font-medium">

<!-- CORRECT -->
<div class="iris-p-4 iris-flex iris-items-center iris-gap-2 iris-text-sm iris-font-medium">
```

**Why?**
- Keeps Vue templates decoupled from Tailwind internals.
- If Tailwind class names change in a future upgrade, only `wrapper.scss` needs updating.
- Provides a single place to audit every utility in use.

---

## The iris- Wrapper Class System

### Where wrappers are defined

`src/shared/assets/scss/wrapper.scss` contains all utility wrappers grouped into logical sections:

| Section | Examples |
|---------|----------|
| Display | `iris-block`, `iris-inline`, `iris-hidden` |
| Position | `iris-relative`, `iris-absolute`, `iris-top-0`, `iris-left-2` |
| Flexbox | `iris-flex`, `iris-inline-flex`, `iris-flex-col`, `iris-items-center`, `iris-flex--between` |
| Flex combos | `iris-flex-center`, `iris-flex-between`, `iris-flex-end`, `iris-col-center`, `iris-btn-row` |
| Gap | `iris-gap-1` through `iris-gap-10` |
| Width | `iris-w-full`, `iris-w-48`, `iris-max-w-md`, `iris-min-w-0` |
| Height | `iris-h-full`, `iris-h-screen`, `iris-h-64` |
| Padding | `iris-p-0` through `iris-p-6`, `iris-px-*`, `iris-py-*`, `iris-pt-*`, `iris-pb-*`, etc. |
| Margin | `iris-m-4`, `iris-mx-auto`, `iris-mt-*`, `iris-mb-*`, `iris-ms-*`, `iris-me-*` |
| Space | `iris-space-y-2`, `iris-space-y-4` |
| Typography | `iris-text-xs` through `iris-text-7xl`, `iris-font-medium`, `iris-text-center` |
| Borders | `iris-border`, `iris-border-t`, `iris-rounded-lg`, `iris-shadow` |
| Colors | `iris-text-primary`, `iris-bg-bg-color-200`, `iris-border-border-color` |
| Cursor | `iris-cursor-pointer`, `iris-cursor-not-allowed` |
| Hover | `iris-hover-text-primary`, `iris-hover-bg-bg-color-200` |
| Transforms | `iris-rotate-90`, `iris-translate-x-1` |
| Transitions | `iris-transition-all`, `iris-duration-300`, `iris-ease-in-out` |
| Animation | `iris-animate-spin`, `iris-animate-pulse` |
| Icons | `iris-icon-xs`, `iris-icon-sm`, `iris-icon-md`, `iris-icon-lg` |
| Responsive | `iris-desktop-only`, `iris-mobile-only`, `iris-sm-up`, `iris-xs-only` |

### Combo classes (prefer these over combining multiple utilities)

When a pattern appears 3+ times, a combo class exists. **Always prefer the combo class:**

```html
<!-- WRONG: manually combining utilities -->
<div class="iris-flex iris-items-center iris-justify-between">

<!-- CORRECT: use the combo -->
<div class="iris-flex-between">
```

| Combo Class | Equivalent Raw |
|-------------|---------------|
| `iris-flex-center` | `flex items-center` |
| `iris-flex-between` | `flex items-center justify-between` |
| `iris-flex-end` | `flex items-center justify-end` |
| `iris-col-center` | `flex flex-col items-center` |
| `iris-btn-row` | `inline-flex items-center gap-2` |

### What if a wrapper does not exist?

**Do NOT immediately create a new wrapper.** Follow this priority order:

1. **Find an exact match** in `wrapper.scss` first — the class may already exist under a slightly different name.
2. **Find a close-enough match** and use it instead. Prefer consistency over pixel-perfection. Examples:
   - `p-1.5` → use `iris-p-2`
   - `gap-1.5` → use `iris-gap-2`
   - `py-2.5` → use `iris-py-3`
   - `px-2.5` → use `iris-px-3`
   - `mt-0.5` → use `iris-mt-1`
   - `pl-[26px]` → use `iris-pl-6` (24px)
   - `text-[13px]` → use `iris-text-sm` (14px)
   - `text-[11px]` → use `iris-text-xs` (12px)
   - `w-[280px]` → use `iris-w-72` (288px)
3. **Only add a new wrapper** if no existing class is close enough. Add it to `wrapper.scss` in the correct section:

```scss
.iris-px-8 { @apply px-8; }
```

Do **not** use the raw Tailwind class in the template. Do **not** add wrappers for arbitrary one-off values — find the nearest standard value instead.

### Utilities to avoid (use alternatives)

| Avoid | Use Instead | Why |
|-------|------------|-----|
| `iris-grid`, `iris-grid-cols-*` | `iris-flex iris-flex-wrap` + `iris-gap-*` | Flex with wrap covers all grid-like layouts; keeps utility count small |
| `iris-space-y-*` | `iris-gap-*` on a flex container, or `iris-mb-*` on children | Space utilities create implicit margins; explicit gap or margin is clearer |


---

## Component SCSS (BEM Classes)

For multi-property component styles, use **BEM-named classes** in dedicated SCSS files under `src/shared/assets/scss/components/`.

### Naming convention

```
.iris-{component}__{element}--{modifier}
```

Examples:
- `.iris-modal__header` — modal header
- `.iris-card--section` — card section variant
- `.iris-toast--success` — success toast variant

### File structure

```
src/shared/assets/scss/
  main.scss              -- Entry point (imports everything)
  wrapper.scss           -- All iris-* utility wrappers
  custom.scss            -- Misc global overrides
  _variables.css         -- CSS variable definitions (--mag-* values)
  components/
    _index.scss          -- Barrel file importing all component files (@use)
    _semantic-colors.scss -- Centralized semantic color mixins (success/danger/warning/info)
    _button.scss         -- Button styles (%iris-button extend pattern)
    _card.scss           -- Card & card section styles
    _modal.scss          -- Modal container, header, body, footer, backdrop
    _toast.scss          -- Toast notifications with variant colors
    _accordion.scss      -- Accordion / section styles
    _transition.scss     -- Vue transition animation classes
    _module-patterns.scss -- Shared module patterns
    _section-title.scss  -- Section title / label
    _datetime.scss       -- Date/time inputs + datepicker overrides
    _switch.scss         -- Toggle switch with RTL support
    _badge.scss          -- Badge styles
    _tabs.scss           -- Tab navigation
    _pagination.scss     -- Pagination controls
    _table.scss          -- Table styles
    _progress.scss       -- Progress bars
    _input.scss          -- Text input styles
    _checkbox.scss       -- Checkbox styles
    _radio.scss          -- Radio button styles
    _alert.scss          -- Alert messages
    _navbar.scss         -- Navbar styles
    _picklist.scss       -- Picklist/select styles
    _multiselectfilter.scss -- Multi-select filter
    _reference.scss      -- Reference field
    _search-box.scss     -- Search box
    _querybuilder.scss   -- Query builder
    _drawer.scss         -- Drawer/sidebar panel
    _applauncher.scss    -- App launcher
    _userdropdown.scss   -- User dropdown
    _messagebox.scss     -- Message box
    _range.scss          -- Range input
    _color.scss          -- Color picker
    _assetfield.scss     -- Asset field + tree view
    _darkmodetoggle.scss -- Dark mode toggle
    _simpledatepicker.scss -- Simple date picker
    _textformula.scss    -- Text formula
    _videobox.scss       -- Video box
    _logo.scss           -- Logo
    _instancetype.scss   -- Instance type
    _languagepicker.scss -- Language picker
```

All component SCSS files are imported via `_index.scss` using `@use` (not `@import`).

### Module-specific SCSS

```
src/modules/
  ai-assistant/assets/scss/_ai-settings.scss
  document-library/assets/scss/_file-selector.scss
  global-search/assets/scss/_global-search.scss
  navigation-menu/assets/scss/_navigation-menu.scss
  partner-program/assets/scss/_partner-program.scss
  translation-studio/assets/scss/_translation-studio.scss
  data-import/assets/scss/_data-import.scss
```

Module SCSS is imported in `_index.scss` using relative paths:
```scss
@use '../../../../modules/ai-assistant/assets/scss/ai-settings';
```

### When to create a component SCSS class vs using wrappers

| Situation | Approach |
|-----------|----------|
| Simple layout (padding, margin, flex) | Use `iris-*` wrapper classes |
| Repeated multi-property pattern (3+ times) | Create a BEM class in `_component.scss` |
| Complex interactive states (hover, focus, disabled) | Create a BEM class |
| One-off styling | Use `iris-*` wrappers; do not create a class for a single use |

### Reuse Existing SCSS First

All classes defined in `src/shared/assets/scss/components/` and `wrapper.scss` are **globally available** across the entire application. Before creating any new module SCSS class or adding new wrappers:

1. **Check existing component classes first.** Common patterns like cards (`iris-card--section`), badges (`iris-badge--success`), buttons (`iris-btn-primary`), inputs (`iris-input`), tabs (`iris-tabs__tab--pills`), section titles (`iris-section-title`), switches (`iris-switch`), tables (`iris-grid__*`), and pagination (`iris-pagination__*`) are already defined.
2. **Check existing wrapper classes.** Many utilities like spacing, colors, flex combos, and icon sizing already have `iris-*` wrappers. Always search `wrapper.scss` before assuming a class doesn't exist.
3. **Use the closest existing wrapper** instead of creating new ones. Round half-step values up to the nearest existing wrapper (e.g., `gap-1.5` → `iris-gap-2`, `py-1.5` → `iris-py-2`). This keeps the project consistent.
4. **Only create module-specific SCSS** when a class combo is repeated 3+ times within the same module and not covered by any existing component class.
5. **Never add inline styles.** If no iris-* class exists, either use the closest match or add a proper wrapper/BEM class. Inline `style=""` attributes are forbidden.

### Spacing Between Card Sections

When stacking multiple `iris-card--section` elements vertically, **do not wrap them in a flex container with `iris-gap-*`**. Instead, add `iris-mb-6` directly to each card (except the last one).

```html
<!-- WRONG: flex parent with gap creates inconsistent spacing -->
<div class="iris-flex iris-flex-col iris-gap-8">
  <div class="iris-card--section">...</div>
  <div class="iris-card--section">...</div>
</div>

<!-- CORRECT: margin on each card, matching ai-assistant pattern -->
<div class="iris-card--section iris-mb-6">...</div>
<div class="iris-card--section iris-mb-6">...</div>
<div class="iris-card--section">...</div> <!-- last card: no margin -->
```

**Why?** This matches the established pattern in `ai-assistant` and other modules. Using `iris-mb-6` gives consistent 1.5rem spacing between sections across all settings pages.

### Tables / Grids Inside Card Sections

**Always prefer the `<IrisGrid>` component over manual `<table>` markup.** Only use `<table>` or flex-based table layouts if IrisGrid cannot handle the specific use case.

When building manual tables (with `<table>` or flex divs), reuse the existing `iris-grid__*` BEM classes from `_table.scss` to match the IrisGrid look:

| Class | Purpose |
|-------|---------|
| `iris-grid__thead--with-bg` | Header background (`bg-bg-color-200`) |
| `iris-grid__thead-row` | Header row border |
| `iris-grid__th` | Header cell padding (`px-6 py-4`) |
| `iris-grid__td` | Data cell padding (`px-6 py-4`) |
| `iris-grid__row--hoverable` | Row hover (`bg-bg-color-300`) |
| `iris-grid__row--bordered` | Row bottom border |
| `iris-tabular-nums` | Tabular figures — apply to numeric `<td>` cells so digits align by column |

```html
<!-- Manual table matching IrisGrid styling -->
<table class="iris-w-full iris-border-collapse">
  <thead class="iris-grid__thead--with-bg">
    <tr class="iris-grid__thead-row">
      <th class="iris-grid__th iris-text-left">Name</th>
      <th class="iris-grid__th iris-text-left">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr class="iris-grid__row--hoverable iris-grid__row--bordered">
      <td class="iris-grid__td">Item</td>
      <td class="iris-grid__td">Active</td>
    </tr>
  </tbody>
</table>
```

When a card contains a grid/table, use **`iris-card--section-list`** instead of `iris-card--section`. This removes the all-around padding so the grid header background sits flush to the card edges. Add padding manually to non-grid content (title, description) using `iris-px-6 iris-pt-6`.

```html
<!-- WRONG: iris-card--section adds p-6 around everything, creating a gap between grid header and card edges -->
<div class="iris-card--section">
  <h2 class="iris-section-title">Recent Items</h2>
  <IrisGrid :value="items" :cols="columns" :showBorder="false" :showRounding="false" />
</div>

<!-- WRONG: manual table markup -->
<div class="iris-card--section">
  <table class="iris-w-full">...</table>
</div>

<!-- CORRECT: iris-card--section-list with manual padding on non-grid content -->
<div class="iris-card--section-list">
  <h2 class="iris-section-title iris-px-6 iris-pt-6">Recent Items</h2>
  <p class="iris-text-sm iris-text-muted iris-mb-4 iris-px-6">Optional description</p>
  <IrisGrid
    id="recent-items"
    :value="items"
    :cols="columns"
    :sortable="false"
    :showBorder="false"
    :showRounding="false"
  />
</div>
```

**Card class comparison:**

| Class | Padding | Use When |
|-------|---------|----------|
| `iris-card--section` | `p-6` (all sides) | Card contains only text, forms, buttons — no grids |
| `iris-card--section-list` | `pb-4` (bottom only) | Card contains an `IrisGrid` — grid header goes edge-to-edge |

**IrisGrid props for cards:**
- `:showBorder="false"` — card already provides the border
- `:showRounding="false"` — card already provides the rounding
- Use `slot` on `GridColumn` for custom cell rendering (e.g., formatted dates, links)

---

## Buttons

All buttons use classes from `_button.scss`. **Never manually compose button styles from utilities.**

### Architecture

Buttons use a **Sass `%iris-button` placeholder** (extend pattern). All variants `@extend %iris-button`:

```scss
%iris-button {
    @apply border border-primary rounded-sm
    font-medium text-sm px-3 py-2
    cursor-pointer
    disabled:opacity-50
    disabled:cursor-not-allowed
}

.iris-btn-primary {
    @extend %iris-button;
    @apply text-primary-text bg-primary
    hover:bg-primary-hover
    focus:border-border-focus focus:bg-primary-hover
}
```

### Available button classes

| Class | Appearance |
|-------|-----------|
| `iris-btn-primary` | Filled primary color, white text |
| `iris-btn-secondary` | Outlined, primary text, transparent bg |
| `iris-btn-light` | Border only (muted border) |
| `iris-btn-success` | Green filled |
| `iris-btn-danger` | Red filled |
| `iris-btn-warning` | Yellow filled |
| `iris-btn-ghost` | Transparent, hover shows border |
| `iris-btn-link` | Looks like a link, underline on hover |
| `iris-btn-outline-primary` | Outlined primary, fills on hover |
| `iris-btn-outline-secondary` | Outlined muted |
| `iris-btn-outline-success` | Outlined green |
| `iris-btn-outline-danger` | Outlined red |

### Size modifiers (add alongside a button class)

| Class | Size |
|-------|------|
| `iris-btn--xs` | Extra small |
| `iris-btn--sm` | Small |
| `iris-btn--md` | Medium / default |
| `iris-btn--lg` | Large |
| `iris-btn--xl` | Extra large |

### State classes

| Class | Effect |
|-------|--------|
| `iris-btn.is-loading` | Shows spinner, reduces opacity, cursor-wait |

### Buttons in modals

```html
<template #footer>
  <button class="iris-btn-secondary iris-w-full" @click="cancel">Cancel</button>
  <button class="iris-btn-primary iris-w-full" @click="save">Save</button>
</template>
```

Do **not** use `iris-modal__btn--submit` or `iris-modal__btn--cancel` — these do not exist.

---

## Radio Buttons

Use classes from `_radio.scss`. **Never manually style radio inputs with raw utilities.**

### Available classes

| Class | Purpose |
|-------|---------|
| `iris-radio__input` | Radio input element (w-4, h-4, themed focus ring, disabled states) |
| `iris-radio__label` | Radio label text (text-sm, font-medium) |
| `iris-radio__helper-text` | Helper/description text below label (text-xs, muted color) |

### Usage pattern

```html
<div class="iris-flex iris-items-center iris-gap-4">
  <input type="radio" id="option_a" value="a" v-model="selected" class="iris-radio__input" />
  <div>
    <label for="option_a" class="iris-radio__label">Option A</label>
    <p class="iris-radio__helper-text">Description of option A</p>
  </div>
</div>
```

### Radio cards (selectable card pattern)

For card-style radio selection (e.g., data-import target selection), create module-specific SCSS rather than composing in the template:

```scss
.iris-di__radio-card {
  @apply relative border rounded p-4 cursor-pointer transition-all;
}

.iris-di__radio-card--selected {
  border-color: var(--mag-primary-color);
  background-color: color-mix(in srgb, var(--mag-primary-color) 10%, transparent);
}
```

Use the BEM `--selected` modifier conditionally:
```html
<div :class="['iris-di__radio-card', { 'iris-di__radio-card--selected': value === selected }]">
```

---

## Badges (Status Indicators)

Use classes from `_badge.scss` for all status indicators, tags, and labels. **Never compose badge styles manually from utilities.**

### Available classes

| Class | Appearance |
|-------|-----------|
| `iris-badge` | Base badge (required) — inline-flex, p-2, text-xs, rounded-md |
| `iris-badge--primary` | Primary color tint |
| `iris-badge--secondary` | Neutral background (`bg-bg-color-200`) |
| `iris-badge--success` | Green (for active/enabled/healthy status) |
| `iris-badge--danger` | Red (for error/disabled/used status) |
| `iris-badge--warning` | Yellow (for pending/caution status) |
| `iris-badge--info` | Blue (for informational status) |

### Usage

```html
<!-- Status badges -->
<span class="iris-badge iris-badge--success">Enabled</span>
<span class="iris-badge iris-badge--warning">Pending</span>
<span class="iris-badge iris-badge--danger">Disabled</span>

<!-- Used backup code (badge + modifier) -->
<div class="iris-badge iris-badge--danger iris-line-through">ABC123</div>
```

---

## CSS Load Order & Specificity

### Load order in main.scss

```
1. Tailwind base/utilities
2. @layer base                (global border-color fix)
3. custom.scss                (misc global overrides)
4. flowbite-datepicker CSS    (before wrapper for z-index override)
5. wrapper.scss               (iris-* utility wrappers)
6. components/_index.scss     (BEM component classes — wins in specificity)
```

**Component SCSS always loads last**, so component classes override wrapper utilities at the same specificity.

### The `@layer base` border-color fix

The `border` utility only sets `border-style` and `border-width` — not `border-color`. The `@layer base` rule sets the project's border variable globally:

```scss
@layer base {
    *, ::before, ::after, ::backdrop {
        border-color: var(--mag-element-border-color);
    }
}
```

### Rules to avoid specificity conflicts

1. **Do not add wrapper utilities that are already set by a component class.** Check the component SCSS definition first.
2. **If you need to override a component class property**, modify the component SCSS itself (add a modifier or conditional class) rather than stacking wrapper utilities that will be overridden.
3. **Never include a class that has no effect.** Every class in a `class=""` attribute must contribute visually.

### Example: correct way to vary padding

```html
<!-- WRONG: iris-p-0 is overridden by iris-modal__body which sets px-6 py-4 -->
<div class="iris-modal__body iris-p-0">

<!-- CORRECT: conditionally apply the component class -->
<div :class="bodyPadding ? 'iris-modal__body' : ''">
```

---

## Dark Mode & Theming

### How it works

- Dark mode uses the **class-based** strategy (`darkMode: 'selector'` in `tailwind.config.js`).
- The `.dark` class is added to the `<html>` element.
- **All colors are CSS variables** (`--mag-*`) that automatically swap between light and dark. Most code needs **zero** `dark:` prefixes.

### Theme variables

| Tailwind Token | CSS Variable | Purpose |
|----------------|-------------|---------|
| `text-color` | `--mag-page-text-color` | Body text |
| `text-color-200` | `--mag-base-200` | Strong text |
| `text-color-300` | `--mag-base-300` | Medium text |
| `text-color-400` | `--mag-base-400` | Muted text |
| `bg-color` | `--mag-page-bg-color` | Page background |
| `bg-color-100` | `--mag-page-bg-100` | Overlay / subtle bg |
| `bg-color-200` | `--mag-page-bg-200` | Card / section bg |
| `bg-color-300` | `--mag-page-bg-300` | Hover bg |
| `border-color` | `--mag-element-border-color` | Default borders |
| `border-muted` | `--mag-element-border-muted-color` | Muted borders |
| `border-focus` | `--mag-element-border-focus-color` | Focus ring borders |
| `primary` | `--mag-primary-color` | Primary brand color |
| `primary-hover` | `--mag-primary-hover-color` | Primary hover |
| `primary-text` | `--mag-primary-text-color` | Text on primary bg |
| `secondary` | `--mag-secondary-color` | Secondary brand color |
| `nav-bg` | `--mag-nav-bg-color` | Sidebar nav bg |
| `nav-text` | `--mag-nav-text-color` | Sidebar nav text |
| `header-bg` | `--mag-header-bg-color` | Top header bg |
| `header-text` | `--mag-header-text-color` | Top header text |

### Rules

1. **Always use theme variable tokens** (`text-color`, `bg-color`, `primary`, etc.) instead of fixed colors.
2. **Do not add `dark:` prefixes** for colors that use CSS variables — they auto-swap.
3. The **only** place `dark:` may appear is inside component SCSS for fixed-color exceptions (see Fixed Colors Policy).
4. **Never use `dark:` in Vue templates.** All template classes must work in both light and dark mode without `dark:` prefixes. If a color needs a `dark:` variant, it belongs in component SCSS, not in a template `class=""` attribute.

```scss
// WRONG: hardcoded colors
.my-card { @apply bg-white dark:bg-gray-800; }

// WRONG: redundant dark variant on variable-based color
.my-card { @apply bg-bg-color-200 dark:bg-bg-color-200-dark; }

// CORRECT: CSS variable auto-swaps
.my-card { @apply bg-bg-color-200; }
```

### Primary Color with Opacity

When you need a lighter background using the primary color (e.g., for selected/active states in nav items, filter chips, or tabs), **always use `bg-primary/10`**. Do not use `/20`, `/30`, or other opacity levels unless there is a specific design reason.

```html
<!-- WRONG: inconsistent opacity levels -->
<div :class="isSelected ? 'bg-primary/20' : ''">
<div :class="isActive ? 'bg-secondary/10' : ''">

<!-- CORRECT: always bg-primary/10 for light primary backgrounds -->
<div :class="isSelected ? 'bg-primary/10 iris-text-primary' : ''">
```

**Rules:**
- Use `bg-primary/10` — not `bg-secondary/10` or `bg-primary/20`
- This ensures a consistent light-purple tint across the entire portal
- The `/10` opacity is the project standard; do not deviate without a specific reason
- Pair with `iris-text-primary` for text color on selected/active states

---

## Fixed Colors Policy

Hard-coded colors (e.g. `text-red-600`, `bg-green-500`) are **generally forbidden**.

### When fixed colors are acceptable

- **Status indicators**: success (green), danger (red), warning (yellow), info (blue)
- **Toast notifications** (`_toast.scss`)
- **Semantic badges** (`_badge.scss`)
- **Button variants**: `iris-btn-success`, `iris-btn-danger`, `iris-btn-warning`
- **Alert banners** (`_alert.scss`)

### Centralized Semantic Color Mixins

All fixed semantic colors are centralized in `_semantic-colors.scss` as Sass **mixins**. This is the single source of truth for success/danger/warning/info colors with proper dark mode support.

**File:** `src/shared/assets/scss/components/_semantic-colors.scss`

**Available mixins:**

| Mixin | Purpose | Light | Dark |
|-------|---------|-------|------|
| `sc.success` | Full bg+border+text | green-50, green-200, green-800 | green-800 border, green-400 text |
| `sc.danger` | Full bg+border+text | red-50, red-200, red-800 | red-800 border, red-400 text |
| `sc.warning` | Full bg+border+text | yellow-50, yellow-200, yellow-800 | yellow-800 border, yellow-400 text |
| `sc.info` | Full bg+border+text | blue-50, blue-200, blue-800 | blue-800 border, blue-400 text |
| `sc.text-success` | Text only | green-600 | green-400 |
| `sc.text-danger` | Text only | red-600 | red-400 |
| `sc.text-warning` | Text only | yellow-600 | yellow-400 |
| `sc.text-info` | Text only | blue-600 | blue-400 |
| `sc.icon-success` | Icon color | green-600 | green-400 |
| `sc.icon-bg-success` | Icon background | green-100 | green-800 |
| `sc.solid-success` | Filled button bg | green-600, white text | green-700 |
| `sc.solid-danger` | Filled button bg | red-600, white text | red-700 |
| `sc.outline-success` | Outline button | green-600 text+border | — |
| `sc.input-error` | Input error border | red-500 | red-500 |

(Same pattern for danger, warning, info variants of icon/icon-bg)

**Usage in component SCSS:**
```scss
@use 'semantic-colors' as sc;

.iris-alert--success {
  @include sc.success;
  .iris-alert__icon { @include sc.icon-success; }
}
```

**Usage in module SCSS:**
```scss
@use '../../../../shared/assets/scss/components/semantic-colors' as sc;

.iris-di__stat-card--success {
  @include sc.success;
}
```

**Standardized warning color:** All warning-related colors (including former orange and amber usages) are standardized to **yellow**. Do not use `text-orange-*` or `text-amber-*` — use `iris-text-warning` or `@include sc.text-warning` instead.

### Semantic text wrappers in templates

For inline semantic text colors in Vue templates, use these wrapper classes from `wrapper.scss`:

```html
<span class="iris-text-success">0</span>     <!-- green-600, dark: green-400 -->
<span class="iris-text-danger">1</span>      <!-- red-600, dark: red-400 -->
<span class="iris-text-warning">Pending</span> <!-- yellow-600, dark: yellow-400 -->
<span class="iris-text-info">Updated</span>   <!-- blue-600, dark: blue-400 -->
```

### Rules for fixed colors

1. Treat every fixed color as an **exception**.
2. **Never use raw fixed color classes in Vue templates.** Use `iris-text-success`, `iris-text-danger`, `iris-text-warning`, `iris-text-info` wrappers, or existing component classes (`iris-badge--success`, `iris-alert--danger`, etc.).
3. **In SCSS files**, use the centralized mixins from `_semantic-colors.scss` (`@include sc.success`, etc.) — never hardcode green/red/yellow/blue classes directly.
4. **Every component using semantic mixins automatically gets dark mode** — the mixin handles `:is(.dark &)` internally.
5. Fixed colors are allowed **only inside component/module SCSS** files via mixins, never in Vue templates directly.

---

## Color Token Simplification

### Use `iris-text-text-color` instead of `iris-text-text-color-200`

The `-200` variant is essentially the same as the base `text-color`. For consistency, always use `iris-text-text-color` for body/content text. Reserve `iris-text-muted` for secondary/helper text.

```html
<!-- WRONG: using -200 variant for body text -->
<span class="iris-text-text-color-200">Some text</span>

<!-- CORRECT: use base text-color -->
<span class="iris-text-text-color">Some text</span>

<!-- CORRECT: use iris-text-muted for secondary text -->
<span class="iris-text-muted">Helper text</span>
```

### Use `iris-hover-bg-bg-color-200` consistently for hover backgrounds

Do not use `iris-hover-bg-bg-color-100` or `iris-hover-bg-bg-color-300` in templates. For consistent hover behavior across the portal, always use `iris-hover-bg-bg-color-200`. For table row hovers, use `iris-grid__row--hoverable` or `@apply bg-bg-color-300` in component SCSS (matching the IrisGrid pattern).

### Use `iris-border-border-muted` for row/section borders

Do not use background color tokens for borders (e.g., `iris-border-bg-color-200`). Always use `iris-border-border-muted` for subtle dividers or `iris-border-border-color` for standard borders.

---

## Semantic Aliases

Use the semantic alias when available:

| Semantic Class | Equivalent | Defined In |
|----------------|-----------|------------|
| `iris-text-muted` | `color: var(--mag-base-400)` | `wrapper.scss` |
| `iris-section-title` | Section heading (text-lg, font-semibold, mb-6) | `_section-title.scss` |
| `iris-section-label` | Smaller bold label (font-bold, mb-2) | `_section-title.scss` |
| `iris-overlay` | Fixed fullscreen overlay with `color-mix()` transparency | `wrapper.scss` |

### Heading Hierarchy in Settings Pages

Use consistent heading classes across all settings/admin pages. The hierarchy is:

| Level | Class | HTML Tag | Use For |
|-------|-------|----------|---------|
| Card heading | `iris-section-title` | `<h2>` | Main heading inside each `iris-card--section` or `iris-card--section-list` |
| Status/compact label | `iris-section-label` | `<h5>` | Top-level status sections, compact card labels in user-facing pages |

```html
<!-- Card section heading — always use iris-section-title on <h2> -->
<div class="iris-card--section iris-mb-6">
  <h2 class="iris-section-title">Enforcement Mode</h2>
  <p class="iris-text-sm iris-text-muted iris-mb-4">Description text</p>
</div>

<!-- Status/compact label — use iris-section-label on <h5> -->
<div class="iris-card--section">
  <h5 class="iris-section-label">2FA Status</h5>
</div>
```

**Rules:**
- **Do not mix** `iris-section-title` and `iris-section-label` on `<h2>` tags within the same page
- **Do not compose heading styles manually** (e.g., `iris-text-lg iris-font-semibold`) — use the semantic class
- Card section headings are always `<h2 class="iris-section-title">`
- Smaller inline labels are always `<h5 class="iris-section-label">`

The `iris-overlay` class:
```scss
.iris-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center overflow-y-auto;
  background-color: color-mix(in srgb, var(--mag-page-bg-100) 40%, transparent);
}
```

---

## Adding New Styles

### Decision tree

```
Need a new style?
  |
  +--> Does an existing iris-* wrapper or component class cover it?
  |      YES --> Use it (even if it's slightly different, e.g. iris-p-2 for p-1.5)
  |      NO  |
  |          v
  +--> Is there a close-enough existing wrapper (within 1-2px)?
  |      YES --> Use the closest match. Do NOT create a new wrapper.
  |      NO  |
  |          v
  +--> Is it a single Tailwind utility with no close match?
  |      YES --> Add an iris-* wrapper to wrapper.scss (correct section)
  |      NO  |
  |          v
  +--> Is it a multi-property pattern used 3+ times?
  |      YES --> Create a BEM class in the appropriate _component.scss or module SCSS
  |      NO  |
  |          v
  +--> Use iris-* wrappers in the template (no new class needed)
```

### Creating shared component SCSS

1. Create `src/shared/assets/scss/components/_<name>.scss` (underscore prefix).
2. Add `@use '<name>';` to `_index.scss` (use `@use`, **not** `@import`).
3. Use BEM naming: `.iris-<name>`, `.iris-<name>__element`, `.iris-<name>--modifier`.

### Creating module-specific SCSS

1. Create `src/modules/<module>/assets/scss/_<name>.scss`.
2. Import in `_index.scss`:
   ```scss
   @use '../../../../modules/<module>/assets/scss/<name>';
   ```

---

## Flowbite & Syncfusion Exceptions

Flowbite and Syncfusion manipulate the DOM by toggling raw Tailwind classes via `classList`. These **must remain as raw Tailwind**:

| Raw Class | Purpose |
|-----------|---------|
| `hidden` | Show/hide dropdowns, modals |
| `flex` | Show elements (replaces `hidden`) |
| `translate-x-full` | Drawer slide-in/out |
| `translate-x-0` | Drawer open position |
| `opacity-0` | Fade transitions |
| `invisible` | Visibility toggle |

**Rule**: If Flowbite or Syncfusion programmatically toggles a class, that class must stay raw. Do **not** replace it with an `iris-` wrapper.

**How to tell**: Look for `data-drawer-*`, `data-modal-*`, `data-dropdown-*`, `data-collapse-*`, `data-accordion-*` attributes.

---

## Datepicker Patterns

### Load order

Datepicker CSS is imported in `main.scss` **before** `wrapper.scss` so that our overrides win.

### Z-index layering

| Element | z-index |
|---------|---------|
| Modal backdrop (`.iris-modal__backdrop`) | `z-40` |
| Datepicker dropdown | `z-index: 1130` |
| Modal overlay (`.iris-overlay`) | `z-50` |

### Dark mode overrides

All datepicker dark mode overrides are in `_datetime.scss` using `--mag-*` CSS variables:

```scss
.datepicker-picker { background-color: var(--mag-page-bg-200); }
.datepicker-cell:hover { background-color: var(--mag-page-bg-300); }
```

### Cascade fix

```scss
.datepicker.active.hidden { display: none !important; }
```

### Lifecycle

`IrisDateTime.vue` uses **programmatic** FlowbiteDatepicker init/destroy (not auto-init). This handles cleanup on modal close, auto-close on date select or click-outside, and prevents duplicate instances.

---

## Icon Sizing & Animation

Icons use dedicated sizing classes. **Do not use `iris-w-*` / `iris-h-*` pairs for icons.**

| Class | Pixels |
|-------|--------|
| `iris-icon-xs` | 16px |
| `iris-icon-sm` | 20px |
| `iris-icon-md` | 24px |
| `iris-icon-lg` | 32px |
| `iris-w-10 iris-h-10` | 40px (larger than iris-icon-lg) |
| `iris-w-12 iris-h-12` | 48px (empty-state illustration icons) |

**Never** use `iris-w-4 iris-h-4` for icons — use `iris-icon-xs` (16px) instead. The `iris-w-*/iris-h-*` pair is only acceptable for the 40px/48px empty-state sizes above.

### Spinning icons

Animation (`iris-animate-spin`) is **separate** from sizing. Only add spin on actual spinners/loaders:

```html
<!-- Static icon -->
<IrisIcon name="search" class="iris-icon-sm" />

<!-- Loading spinner -->
<IrisIcon name="spinner-third" class="iris-icon-md iris-animate-spin" />
```

---

## Loading Containers

```html
<div class="iris-flex-center iris-flex--center iris-p-4">
  <IrisIcon name="spinner-third" class="iris-icon-md iris-animate-spin" />
</div>
```

Do **not** use `iris-loading-container` or `iris-loading` — these do not exist.

---

## Vue Transitions

```html
<Transition name="iris-transition-expand">
  <div v-if="show">Content</div>
</Transition>
```

| Transition Name | Effect | Duration |
|-----------------|--------|----------|
| `iris-transition-expand` | Fade + vertical expand (max-height 0 to 500px) | 200ms |

---

## Responsive Classes

### Semantic responsive classes (preferred)

| Class | Behavior |
|-------|----------|
| `iris-desktop-only` | Hidden on mobile, visible from `md` up |
| `iris-mobile-only` | Visible on mobile, hidden from `md` up |
| `iris-sm-up` | Hidden on xs, visible from `sm` up |
| `iris-xs-only` | Visible on xs only, hidden from `sm` up |

### Breakpoint utilities

Use `iris-lg-*`, `iris-xl-*`, `iris-md-*` classes from wrapper.scss:

```html
<div class="iris-flex-col iris-lg-flex-row iris-gap-4 iris-lg-gap-20">
```

### Adding new responsive wrappers

Add to the **Responsive** section in `wrapper.scss`:

```scss
.iris-md-flex-row { @media (min-width: 768px) { flex-direction: row; } }
```

---

## Settings Page Consistency

All settings/admin pages (e.g., `ai-assistant`, `two-factor-auth`, `partner-program`) should follow the same layout patterns. Use the **ai-assistant module** (`src/modules/ai-assistant/views/Index.vue`) as the reference implementation.

### Standard settings page structure

```html
<IrisPageHeader :title="title" :breadcrumbs="breadcrumbs" />

<!-- Status section -->
<div class="iris-card--section iris-mb-6">
  <h5 class="iris-section-label">Status</h5>
  <!-- toggle, badge, etc. -->
</div>

<!-- Tab navigation -->
<div class="iris-tabs__container--underlined">...</div>

<!-- Tab content: stacked cards -->
<Transition name="iris-transition-expand" mode="out-in">
  <div v-if="selectedTab === 'settings'">
    <div class="iris-card--section iris-mb-6">
      <h2 class="iris-section-title">Section Heading</h2>
      <p class="iris-text-sm iris-text-muted iris-mb-4">Description</p>
      <!-- form controls -->
    </div>
    <div class="iris-card--section iris-mb-6">...</div>
    <div class="iris-card--section">...</div> <!-- last card: no margin -->
  </div>
</Transition>
```

### Key consistency rules

- Card spacing: `iris-mb-6` between cards (not flex gap)
- Card headings: `<h2 class="iris-section-title">` inside every card
- Description text: `iris-text-sm iris-text-muted iris-mb-4`
- Save button: `iris-btn-primary` right-aligned at bottom
- Loading spinner: `iris-flex-center iris-flex--center iris-py-6` with `<IrisIcon name="spinner-third" class="iris-icon-lg iris-animate-spin" />`

---

## Examples: Correct vs Incorrect

### Page layout

```html
<!-- WRONG -->
<div class="flex justify-between items-center mb-6">
  <h2 class="text-2xl font-bold">Settings</h2>
  <button class="bg-primary text-white px-3 py-2 rounded">Save</button>
</div>

<!-- CORRECT -->
<div class="iris-flex-between iris-mb-6">
  <h2 class="iris-section-title">Settings</h2>
  <button class="iris-btn-primary">Save</button>
</div>
```

### Card with section

```html
<!-- WRONG -->
<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">

<!-- CORRECT -->
<div class="iris-card--section">
```

### Color usage

```html
<!-- WRONG: hardcoded color -->
<p class="text-gray-700">Some text</p>

<!-- CORRECT: theme variable -->
<p class="iris-text-text-color">Some text</p>

<!-- CORRECT: semantic alias -->
<p class="iris-text-muted">Secondary text</p>
```

### Flowbite-controlled elements

```html
<!-- WRONG -->
<div data-modal-target="myModal" class="iris-hidden">

<!-- CORRECT: keep raw Tailwind for Flowbite-managed classes -->
<div data-modal-target="myModal" class="hidden">
```

### SCSS imports

```scss
// WRONG
@import 'button';

// CORRECT
@use 'button';
```

---

## Quick Reference: File Locations

| What | Where |
|------|-------|
| Utility wrappers | `src/shared/assets/scss/wrapper.scss` |
| Component SCSS | `src/shared/assets/scss/components/_*.scss` |
| Component index | `src/shared/assets/scss/components/_index.scss` |
| Module SCSS | `src/modules/<module>/assets/scss/_*.scss` |
| Tailwind config | `tailwind.config.js` |
| CSS variables | `src/shared/assets/scss/_variables.css` |
| Main entry | `src/shared/assets/scss/main.scss` |

## Quick Reference: Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Utility wrapper | `iris-{tailwind-name}` | `iris-p-4`, `iris-flex` |
| Component class | `iris-{component}__{element}` | `iris-modal__header` |
| Modifier | `iris-{component}--{variant}` | `iris-toast--success` |
| Module class | `iris-{module}__{element}` | `iris-ai-settings__form-grid` |
| Combo class | `iris-{semantic-name}` | `iris-flex-center`, `iris-btn-row` |
| Sass placeholder | `%iris-{name}` | `%iris-button` |

## Alerts & Banners

Use the existing `iris-alert` classes from `_alert.scss` for all alert/banner patterns. **Never compose alert styles manually from utilities.**

```html
<!-- WRONG: manual alert styling -->
<div class="bg-green-50 border border-green-200 text-green-800 rounded p-3">
  Success message
</div>

<!-- CORRECT: use iris-alert classes -->
<div class="iris-alert iris-alert--success">
  <iris-icon name="circle-check" class="iris-alert__icon iris-icon-sm" />
  <div class="iris-alert__content">Success message</div>
</div>
```

| Class | Appearance |
|-------|-----------|
| `iris-alert iris-alert--success` | Green — success messages |
| `iris-alert iris-alert--warning` | Yellow — warning messages |
| `iris-alert iris-alert--danger` | Red — error messages |
| `iris-alert iris-alert--info` | Blue — informational messages |
| `iris-alert iris-alert--primary` | Primary color tint — brand-related messages |

---

## Responsive & State Variants in Templates

Tailwind responsive (`md:`, `lg:`, `xl:`, `sm:`) and state (`disabled:`, `hover:`, `focus:`) variant prefixes **cannot be wrapped** with `iris-*` because `@apply` doesn't handle variant-only utilities. These must remain as raw Tailwind in templates:

```html
<!-- These are OK as raw Tailwind — responsive/state variants -->
<div class="iris-flex iris-flex-col md:flex-row md:items-start md:gap-0">
<button class="iris-btn-primary" disabled>  <!-- disabled states handled by %iris-button -->
<div class="hidden xl:inline">  <!-- responsive display toggle -->
```

**Rules:**
- `md:`, `lg:`, `xl:`, `sm:` responsive prefixes → keep raw
- `disabled:` state prefixes → keep raw (or use component SCSS which handles disabled)
- `group-hover:` → keep raw
- Arbitrary responsive values like `md:w-[35%]` → keep raw
- `bg-primary/10` and similar opacity-modified theme tokens → keep raw (custom tokens, not standard Tailwind)
- All non-variant classes must be `iris-*` wrapped

---

## Module SCSS Pattern (BEM for Modules)

When creating a new module, follow this established pattern for module-specific SCSS:

### Naming convention
```
.iris-{module-code}__{element}--{modifier}
```

Examples from existing modules:
- Translation Studio: `.iris-ts__nav-item`, `.iris-ts__toolbar`, `.iris-ts__textarea`
- Data Import: `.iris-di__radio-card`, `.iris-di__nav-bar`, `.iris-di__panel`

### What goes in module SCSS vs templates

| Pattern | Where |
|---------|-------|
| Single iris-* utility | Template `class=""` |
| 2 iris-* utilities combined | Template `class=""` |
| 3+ iris-* utilities repeated 3+ times | Module SCSS combo class |
| Fixed colors needing dark mode | Module SCSS with `:is(.dark &)` |
| Hover/focus with fixed colors | Module SCSS |
| Grid/responsive layouts (`grid grid-cols-*`) | Module SCSS (since `iris-grid-cols-*` doesn't exist) |
| Dynamic `:style` for computed values (e.g., progress bar width) | Template `:style` (acceptable exception) |

### Dark mode in module SCSS

**Preferred approach:** Use the centralized semantic color mixins from `_semantic-colors.scss`. These handle dark mode internally — no manual `:is(.dark &)` needed:

```scss
@use '../../../../shared/assets/scss/components/semantic-colors' as sc;

// CORRECT: mixin handles dark mode automatically
.iris-di__stat-card--success {
  @include sc.success;
}
```

**When mixins don't cover your case** (e.g., custom opacity, unique color combo), use `:is(.dark &)` manually:

```scss
// Custom pattern not covered by semantic mixins
.iris-di__row--unmapped {
  background-color: rgb(254 242 242 / 0.5);

  :is(.dark &) {
    background-color: rgb(127 29 29 / 0.1);
  }
}
```

**Rules:**
- **Always try `@include sc.*` first** — only use manual `:is(.dark &)` as a fallback
- `:is(.dark &)` is ONLY for fixed colors (green, red, yellow, blue) in SCSS files
- CSS variable colors (`var(--mag-*)`) NEVER need `:is(.dark &)` — they auto-swap
- `dark:` prefix is NEVER used in Vue templates

### Overflow and border-radius in panels with tables

When a panel (`rounded` + `border`) contains a table, the table header background and last-row hover can overflow the rounded corners. Fix this in module SCSS:

```scss
.iris-di__panel {
  @apply rounded shadow border;

  // Table wrapper clips backgrounds to rounded corners
  .iris-di__table-wrap {
    @apply overflow-hidden;
    border-radius: inherit;
  }
}
```

Then in the template, add the wrapper class to the table's container div:
```html
<div class="iris-di__panel">
  <div class="iris-overflow-x-auto iris-di__table-wrap">
    <table>...</table>
  </div>
</div>
```

**Important:** Do NOT put `overflow-hidden` on the panel itself if it contains dropdowns/select elements — they'll be clipped. Only put it on the table wrapper.

---

## IrisIcon Usage

Always use `<iris-icon>` instead of inline `<svg>` tags. IrisIcon loads icons from `src/shared/assets/data/svg.json` (FontAwesome Light weight by default).

### Import and usage
```html
<!-- Import -->
import IrisIcon from '@/shared/components/general-controls/IrisIcon.vue'

<!-- Template -->
<iris-icon name="circle-check" class="iris-icon-sm" />
```

### Font weight
Icons default to FontAwesome **Light**. For solid variants, use the `prefix` prop:
```html
<!-- Light (default) -->
<iris-icon name="circle-check" class="iris-icon-sm" />

<!-- Solid -->
<iris-icon name="circle-check" prefix="fas" class="iris-icon-sm" />
```

### Color
Icons inherit color from `currentColor`. Apply color to the `<iris-icon>` element or its parent:
```html
<iris-icon name="circle-check" class="iris-icon-sm iris-text-primary" />
```

### Common icon mappings

| Purpose | Icon Name | Notes |
|---------|-----------|-------|
| Success/Check | `circle-check` | Use `prefix="fas"` for solid |
| Error/Fail | `circle-xmark` | Use `prefix="fas"` for solid |
| Info | `circle-info` | |
| Loading spinner | `spinner-third` | Always add `iris-animate-spin` |
| Add/Create | `plus` | |
| Delete | `trash` | |
| Close | `xmark` | |
| Back arrow | `chevron-right` + `iris-rotate-180` | No `chevron-left` in svg.json |
| Next arrow | `chevron-right` | |
| Download | `arrow-down-from-bracket` | |
| Search | `magnifying-glass` | |
| Settings | `cog` | |

### Dynamic SVG paths
When icons come from data (e.g., `:d="target.icon"`), they cannot use IrisIcon — keep as inline `<svg>`. This is an acceptable exception.

---

## Checklist

- [ ] No raw Tailwind classes in templates (except Flowbite/Syncfusion exceptions and `md:`/`disabled:` responsive/state variants)
- [ ] All colors use theme variables (no hardcoded colors without dark mode support)
- [ ] No `dark:` prefixes in Vue templates — only allowed inside component SCSS for fixed-color exceptions
- [ ] No inline `style=""` attributes — use iris-* wrappers or BEM classes instead
- [ ] Every class in `class=""` has a visible effect (no dead code from specificity conflicts)
- [ ] Combo classes used where available
- [ ] Existing wrappers reused before creating new ones (round half-step values: `p-1.5` → `iris-p-2`)
- [ ] Icon sizing uses `iris-icon-xs/sm/md/lg`, not manual `iris-w-*/iris-h-*`
- [ ] `iris-animate-spin` only on actual spinners
- [ ] Loading containers use `iris-flex-center iris-flex--center` with `IrisIcon spinner-third`
- [ ] New wrapper utilities added to the correct section in `wrapper.scss`
- [ ] New component styles use BEM naming and are imported in `_index.scss` via `@use`
- [ ] SCSS uses `@use` not `@import`
- [ ] Flowbite-managed elements keep raw Tailwind classes
- [ ] Existing SCSS component classes reused before creating new ones
- [ ] No `iris-grid` / `iris-space-y-*` utilities — use flex + gap or margin instead
- [ ] Body text uses `iris-text-text-color`, not `iris-text-text-color-200` or `iris-text-text-color-300`
- [ ] Muted text uses `iris-text-muted`, not `iris-text-text-color-400`
- [ ] Primary light backgrounds use `bg-primary/10` consistently (not `/20` or `bg-secondary/10`)
- [ ] Hover backgrounds use `iris-hover-bg-bg-color-200` consistently (not `-100` or `-300`)
- [ ] Table row hovers use `iris-grid__row--hoverable` or `@apply bg-bg-color-300` in SCSS
- [ ] Borders use `iris-border-border-muted` or `iris-border-border-color` — never `iris-border-bg-color-*`
- [ ] Status indicators use `iris-badge iris-badge--*` classes, not manual color utilities
- [ ] Toggle switches use `iris-switch` / `iris-switch__input` / `iris-switch__toggle` classes
- [ ] Manual tables use `iris-grid__*` BEM classes to match IrisGrid styling
- [ ] Radio inputs use `iris-radio__input` / `iris-radio__label` / `iris-radio__helper-text`
- [ ] Tables prefer `IrisGrid` component over manual `<table>` markup
- [ ] Cards with grids use `iris-card--section-list` (not `iris-card--section`)
- [ ] Card spacing uses `iris-mb-6`, not flex parent with gap
- [ ] Headings are consistent: `<h2 class="iris-section-title">` for card headings
- [ ] Settings pages follow ai-assistant layout patterns
- [ ] Pagination uses `iris-pagination__*` classes from `_pagination.scss`
- [ ] Alert banners use `iris-alert iris-alert--*` classes from `_alert.scss`, not manual color utilities
- [ ] `md:`, `lg:`, `disabled:`, `group-hover:` variants kept as raw Tailwind (cannot be iris-wrapped)
- [ ] No inline `<svg>` tags — use `<iris-icon>` component (except for dynamic SVG paths from data)
- [ ] Spinners use `<iris-icon name="spinner-third" class="iris-icon-* iris-animate-spin" />`
- [ ] Module SCSS uses `:is(.dark &)` for fixed-color dark variants, never `dark:` prefix
- [ ] Panels with tables use a `table-wrap` class with `overflow-hidden` + `border-radius: inherit` (not on panel itself)
- [ ] `overflow-hidden` never on panels that contain dropdowns — only on table wrappers
- [ ] Semantic colors use centralized mixins from `_semantic-colors.scss` — never hardcode green/red/yellow/blue directly
- [ ] SCSS files importing semantic colors use `@use 'semantic-colors' as sc;` and `@include sc.*`
- [ ] Template semantic text uses `iris-text-success/danger/warning/info` wrappers, not raw `text-green-600` etc.
- [ ] Warning colors standardized to yellow — no `text-orange-*` or `text-amber-*`
- [ ] All former `dark:` SCSS patterns replaced with `@include sc.*` mixins that handle dark mode internally
- [ ] Numeric table columns use `iris-tabular-nums` so digits align across rows
- [ ] Empty-state illustration icons may use `iris-w-10 iris-h-10` (40px) or `iris-w-12 iris-h-12` (48px); never `iris-w-4 iris-h-4` (use `iris-icon-xs` instead)
- [ ] Radio-card selection patterns live in module SCSS with `iris-{module}__radio-card--selected`, not composed in templates
