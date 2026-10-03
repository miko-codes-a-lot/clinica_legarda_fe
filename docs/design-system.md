# Clinica Legarda interface

The application uses Tailwind v4 through `.postcssrc.json`. `src/styles.css` owns the font, clinic palette, canvas, border and shadow tokens. `src/styles/components.css` defines the small shared `ui-*` vocabulary; `src/styles/material.css` adapts Angular Material controls to those same tokens. Material retains calendar, select, dialog, focus and keyboard behavior.

## Build a screen

Use `ui-page` for the content width and responsive spacing, `app-page-header` for the title and actions, and `ui-card` for a section. Use `ui-section-title`, `ui-muted` and `ui-label` for hierarchy. Use `ui-button`, `ui-button-secondary`, `ui-button-danger` or `ui-button-ghost` according to the action's importance. Native buttons need an explicit type and an accessible name for icon-only actions. Forms retain their reactive controls and validation.

Single native dropdowns use `ui-input`, which reserves space for a theme-aware chevron inset 1rem from the right edge. Keep the native `select` for keyboard behavior; multi-selects and listboxes retain their browser appearance. Forced-colors mode uses the native arrow.

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

Patient intake uses the shared staff `UserForm` for admin and super admin: `isWalkIn` starts unchecked and makes patient contacts optional while retaining validation of supplied contacts. `PatientAccountAccess` shares account status and later email-OTP activation guidance between both user details screens. Staff booking uses `isStaffBookablePatient`; patient booking uses `isOnlineBookablePatient`. Appointment `isWalkIn` labels a visit independently of account confirmation.

## Care workspace

The shared `care` routes serve scoped staff patient records, queue/check-in, visit records and treatment cases. `PatientLedgerView` serves staff manual entry forms and patient read-only balances from different projected API endpoints. Clinic closures reuse the same availability rules for booking and rescheduling. Use semantic `ui-card`, `ui-table`, input, alert and button styles for both themes; never render internal notes in the patient portal.

Patient My care receives only published completed summaries and public case/session fields. Print summary isolates the selected visit and uses paper colors. Installment amounts use integer PHP centavos through the exact decimal parser and formatter; do not use floating-point peso calculations.

## Interface icons

Use shared `Icon` / `app-icon` from `src/app/_shared/ui/icon/icon`. It renders a vendored subset of 24px Heroicons outline icons as native SVG, with currentColor and a consistent 1.5px stroke. 20px is the default; use `class="!size-6"` for 24px and `class="!size-8"` for 32px feature/empty-state icons. Apply existing semantic text colors to the host. Icons are decorative and hidden from accessibility; put readable text or an accessible name on the parent action.

```html
<button type="button" class="ui-button-secondary" aria-label="Edit clinic notes">
  <app-icon name="pencil-square" /> Edit notes
</button>
```

`icon-paths.ts` records pinned Heroicons 2.2.0 provenance and the centrally mapped compatibility names used by existing navigation/empty-state screens. New code should use canonical Heroicons names. The clinic tooth and closure calendar are local supplements with the same stroke language. Copy only needed SVG path data and retain upstream license; do not add icon fonts, arbitrary SVG markup, `innerHTML` or a runtime icon-package dependency. An unknown name shows a question-circle fallback. The MIT notice is shipped at `/licenses/heroicons-LICENSE.txt`.

Material still owns menu/calendar/button focus, keyboard behavior and native internal controls. Project an account-menu icon with `matMenuItemIcon`, or a calendar-toggle icon with `matDatepickerToggleIcon`. Staff account menus use `xPosition="before"`, `overlapTrigger=false`, and shared `account-menu` styling so their right edge aligns to the trigger with an 8px vertical gap.
