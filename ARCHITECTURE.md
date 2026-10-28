# Medistry app: how the code is organised

Read this before adding or moving a file. Every rule here is a rule, not a suggestion; the ones
marked **(lint)** fail `npm run lint` when broken.

This file is about where code goes. The visual design of every signed-in screen comes from the
design repository (Arhaan's prototype) and is carried here by the design kit in `src/components/ui/`.

## 1. The layers

```
src/
  app/            Routes. A folder is a URL. Owns pages, layouts and the page's own pieces.
  components/
    ui/           The design kit: shared, presentational, used by more than one area.
    landing/      The public homepage. Frozen: it keeps its own globals.css, ui.tsx and
                  ContourField. Dashboards never import from it.
  services/       The ONLY code that talks to the backend. One file per backend area.
  types/          The app's data shapes, one file per domain (appointment, doctor, lab...).
  hooks/          Shared React hooks (useApiResource, useNow).
  lib/            Plain helpers with no UI: HTTP client, session, formatting, units, storage.
  config/env.ts   The ONLY file that reads environment variables.
```

Data flows one way:

```
page.tsx  ->  services/xService.ts  ->  lib/http/apiClient.ts  ->  backend
   |                 |
   |                 +-- maps raw backend JSON (PascalCase, many shapes) to types/x.ts
   +-- passes typed data as props to components (route-local or components/ui)
```

### Who may import what

| From                     | May import                                                     | Never                                  |
| ------------------------ | -------------------------------------------------------------- | -------------------------------------- |
| `app/<area>/**`          | services, components, hooks, lib, types, its own area          | another area's folder (lint)           |
| `components/**`          | other components, hooks, lib, types                            | services, config/env (lint)            |
| `services/**`            | lib, types, other services                                     | React, next, components (lint)         |
| `lib/**`, `types/**`     | lib, types, config/env                                         | services, components, app              |

## 2. A route folder (the patient dashboard is the reference)

Every screen follows the shape of `src/app/dashboard/`:

```
src/app/dashboard/appointments/
  page.tsx                       The route. Loads data via services, composes components.
  AppointmentsPage.module.css    Styles for this page only.
  components/                    Pieces used ONLY by this page (and its child routes).
    AppointmentCard.tsx
    AppointmentCard.module.css
```

- Folders are `kebab-case` because they are URLs (`lab-tests`, `doctor-dashboard`).
- Component files are `PascalCase.tsx`, one exported component per file, default export, named
  the same as the file. Its stylesheet sits beside it with the same name: `X.tsx` + `X.module.css`.
- Hooks are `useSomething.ts`; services are `somethingService.ts`; types are `something.ts`.
- A page's own stylesheet is imported as `styles`. Kit stylesheets keep descriptive names:
  `surfaceStyles`, `furnitureStyles`, `formStyles`, `layoutStyles`.
- Code shared by several pages of ONE area lives in that area's own folders, e.g.
  `src/app/doctor-dashboard/components/` and `src/app/doctor-dashboard/styles/`. Nested pages
  import it by alias: `@/app/doctor-dashboard/components/AppointmentRow`. An area never imports
  another area (lint): the patient dashboard cannot import from the doctor dashboard.
- If a second AREA needs a component, move it to `src/components/ui/` in the same change.
- Every file starts with a short comment saying what it is for and anything non-obvious about it.

### The two dashboards

Every signed-in layout wraps its content in `<AppTheme>` (`src/components/ui/AppTheme.tsx`), which
applies the dashboard design tokens. The landing page does not.

| Area             | URL                 | Folder                         | Shell (layout)                         |
| ---------------- | ------------------- | ------------------------------ | -------------------------------------- |
| Patient          | `/dashboard/...`    | `src/app/dashboard/`           | `dashboard/components/PatientShell`    |
| Doctor           | `/doctor-dashboard/...` | `src/app/doctor-dashboard/` | `doctor-dashboard/components/DoctorShell` |
| Sign-in          | `/sign-in`          | `src/app/sign-in/`             | none                                   |
| Onboarding       | `/onboarding`       | `src/app/onboarding/`          | none                                   |
| Video call       | `/consultation/[appointmentId]` | `src/app/consultation/` | none (used by both roles)        |

## 3. Talking to the backend

- **Only `src/lib/http/apiClient.ts` calls `fetch`** (lint). It adds the base URL, the
  `Authorization: Bearer` header, parses JSON, and throws `ApiError` (with `.status`) when the
  status is not 2xx or the body says `success: false`.
- **Only `src/services/*` call `apiRequest`.** Each service file starts with the list of endpoints
  it calls. Each function returns app types from `src/types/`, never raw backend JSON. Raw-shape
  quirks (`AppointmentId` vs `id`, `data.data` vs `data`) are handled once, in the service's
  mapper (`toAppointment`, `toAddress`...).
- **Pages load data with `useApiResource`** so loading, error and empty states look the same
  everywhere. Show errors with `ErrorNotice`, waiting with `LoadingSkeleton`.
- An endpoint the backend does not have yet is still called by its proposed path, and the screen
  shows a plain "not available yet" state on 404 (`ApiError.isMissingEndpoint`). Every such
  endpoint is listed, with its request and response, in `docs/backend/`. Nothing is mocked.
- Third parties with secret keys (Redcliffe Labs, Razorpay secret) are called by the backend only.
  The browser never holds a secret.

## 4. Single sources of truth

| Thing                          | Lives in                                   | Never                                    |
| ------------------------------ | ------------------------------------------ | ---------------------------------------- |
| Colours, radii, easing, type   | `src/components/ui/styles/appTheme.css` (dashboards) | hex values in a component      |
| Backend URL and env values     | `src/config/env.ts`                        | `process.env` anywhere else              |
| Access token and signed-in user| `src/lib/session/authSession.ts`           | `localStorage` anywhere else (lint)      |
| Date and time wording          | `src/lib/format/dateTime.ts`               | `toLocaleDateString` in a component      |
| Money wording                  | `src/lib/format/money.ts`                  | hand-built `₹` strings                   |
| Kg/lb, cm/ft units             | `src/lib/units/measurementUnits.ts`        | unit maths in a component                |
| A data shape                   | `src/types/<domain>.ts`                    | redeclaring a type in a page             |
| Icons                          | `@phosphor-icons/react`                    | any other icon library (lint)            |
| Confirmations                  | `useToast()` or a `Sheet`                  | `alert()` / `confirm()` (lint)           |

## 5. Before you open a pull request

1. `npm run lint` and `npm run build` pass.
2. The screen works at 390px wide and 1440px wide with no sideways scroll.
3. Loading, error, empty and success states all exist.
4. New endpoints are documented in `docs/backend/`.
5. No commented-out code. Git remembers old code; the file should show only what runs.
