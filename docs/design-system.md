# Clinica Legarda interface

The application uses Tailwind v4 through `.postcssrc.json`. `src/styles.css` owns the font, clinic palette, canvas, border and shadow tokens. `src/styles/components.css` defines the small shared `ui-*` vocabulary; `src/styles/material.css` adapts Angular Material controls to those same tokens. Material retains calendar, select, dialog, focus and keyboard behavior.

## Build a screen

Use `ui-page` for the content width and responsive spacing, `app-page-header` for the title and actions, and `ui-card` for a section. Use `ui-section-title`, `ui-muted` and `ui-label` for hierarchy. Use `ui-button`, `ui-button-secondary`, `ui-button-danger` or `ui-button-ghost` according to the action's importance. Native buttons need an explicit type and an accessible name for icon-only actions. Forms retain their reactive controls and validation.

```html
<section class="ui-page">
  <app-page-header title="Clinic details" eyebrow="Management" description="Review clinic information.">
    <button type="button" class="ui-button" (click)="edit()">Edit clinic</button>
  </app-page-header>
  <section class="ui-card">Existing feature content</section>
</section>
```

## Shared components

| Component | Contract | Purpose |
| --- | --- | --- |
| `PageHeader` / `app-page-header` | required `title`; optional `eyebrow`, `description`; projected actions | One page heading and responsive action row |
| `StatusBadge` / `app-status-badge` | string `status` | Consistent text status with semantic color; preserves text cues |
| `EmptyState` / `app-empty-state` | required `title`; `description`, `icon`; projected action | A real empty result after loading finishes |
| `ClinicBrand` / `app-clinic-brand` | `subtitle` | Brand mark shared by public, auth and staff chrome |
| `AuthLayout` / `app-auth-layout` | required `title`; `eyebrow`, `description`; projected form | Common login, OTP and recovery layout |
| `StaffShell` / `app-staff-shell` | `menuItems`, `roleLabel`, `title`, `userName`, `busy`, `accountEnabled`; `account`/`logout` outputs; projected route | Persistent desktop sidebar and mobile Material drawer |
| `GenericTableComponent` / `app-generic-table` | Existing data, column and action inputs/outputs; `title`, `description`; optional `[table-filters]` projection | Search, sorting, pagination, scrolling, loading and empty results |
| `FormComponent` / `app-form` | Existing `form`, `fields`, `isLoading`, submit output; `framed`, `submitLabel`, `busyLabel`; projected controls | Shared responsive field grid and save state |
| `ListComponent` / `app-list` | Existing detail `data` and `labelMap`; projected detail sections | Readable labels/values and one full-width extension area |

Import a standalone component from `src/app/_shared/ui/<name>/<name>` into the screen's component imports. Keep API calls, authorization, form builders and payload rules in their existing feature/service locations. UI primitives have no service dependencies except the staff shell's viewport observer.

## Maintenance rules

- Change shared tokens before inventing another feature palette. Chart.js canvas colors mirror the tokens because canvas cannot consume CSS utility classes.
- Keep status text, semantic headings, visible focus, error messages and button labels. Color alone must never communicate status.
- Tables scroll within their card on narrow screens; the page should not overflow. Forms collapse to one column. Staff navigation changes to an overlay below 1024px.
- Show loading and failure separately from a successful empty result. Public services use the real dental catalog rather than static example offerings.
- Preserve Material calendar/time validation and role-specific action conditions. Do not replace these with cosmetic controls.
- Tests cover business behavior: authentication, permissions, scheduling, payloads and save outcomes. Verify presentation in the browser; do not create a unit test for every class or component.
- Production build and the existing business specs are the release checks. Do not expand unrelated legacy scaffold tests during a visual change.

## Verification commands

Use Node 20.19.2. Run `npm run test:business` for the focused authentication, permissions, membership, booking, appointment, reporting and patient-save checks, then `npm run build`. Set `CHROME_BIN` to an installed Chrome/Chromium executable if the test launcher cannot discover it. This focused command does not replace or rewrite the existing full-suite entry point.

## Light and dark mode

`ThemeService` sets `html[data-theme]` and native `color-scheme`. Fresh visits follow the device preference; `app-theme-toggle` saves a light/dark choice in browser storage across public/patient and staff pages. The head `public/theme-init.js` applies that choice before rendering; keep its key (`clinica-theme`) and validation rule in sync with the service. Denied storage falls back to session state. Device and other-tab listeners belong to the service and are removed on teardown.

Use `bg-surface`, `text-ink`, `text-muted`, `text-accent`, `text-accent-strong`, `bg-tint`, `bg-tint-strong`, `border-stroke` and semantic danger/warning tokens for content. Light defaults live in `styles.css`; screen dark values live in `styles/themes.css`. Keep `white` for text on fixed solid green chrome/artwork, rather than for cards/inputs. Material overlays inherit root tokens and color-scheme. Chart.js reads CSS tokens through `chart-theme.ts` and refreshes existing charts when the preference changes; report export colors remain independent. Print uses the light token palette.

The toggle is included once in public/mobile navigation and shared staff topbar. Standalone staff auth uses `AuthLayout.showThemeToggle`; patient auth already has the public header. Tests cover preference state and failure boundaries; verify visual contrast, calendar/dialog/menu/table/chart surfaces in both themes in the browser.
