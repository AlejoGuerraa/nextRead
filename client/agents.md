# AGENTS.md - NextRead Frontend

## Project

NextRead is a social platform where users discover, rate and organize books.

This folder contains the Frontend built with:

* React
* Vite
* React Router
* Axios
* Framer Motion

The focus is creating a modern, fast and intuitive experience.

---

# Main Goals

Prioritize:

* User Experience
* Maintainability
* Accessibility
* Performance
* Reusable components

Avoid unnecessary complexity.

Prefer small, incremental refactors over large architectural changes.

Do not introduce libraries, patterns or abstractions unless they solve a concrete problem in the existing codebase.

---

# Project Structure

Keep a clean separation between:

* Pages
* Components
* Layouts
* Hooks
* Services
* Utils
* Context

Avoid giant components.

Extract reusable UI whenever possible.

Page-specific business logic should progressively move into Hooks or Services when a page becomes too complex.

Do not reorganize the entire project into feature folders unless explicitly required by the task.

---

# API Calls

All HTTP requests must use the centralized Axios client:

`src/services/api.js`

Do not create independent Axios instances.

Do not use `fetch()` for API requests when the centralized API client can be used.

Services should encapsulate domain-specific API operations when appropriate.

Preferred architecture:

```text
Pages / Components
        ↓
      Hooks
        ↓
    Services
        ↓
      api.js
        ↓
      Backend
```

Avoid placing repeated API calls and request logic directly inside multiple components.

When working with Axios responses, use the Axios response structure correctly, for example:

```js
const response = await api.get('/endpoint');
const data = response.data;
```

Do not treat Axios responses like native `fetch()` responses (`response.ok`, `response.json()`, etc.).

---

# Authentication

Authentication is handled using JWT.

The current authentication architecture uses:

* `src/context/AuthContext.jsx`
* `src/hooks/useAuth.js`
* `src/services/authService.js`
* `ProtectedRoute.jsx`

`AuthProvider` must wrap the application at the root level.

Components and pages that need authentication state should use:

```js
const { user, isAuthenticated, loading, login, logout, refreshUser } = useAuth();
```

Do not create alternative authentication contexts or duplicate authentication hooks.

Authentication persistence is handled by `authService.js`.

The authentication service is responsible for operations such as:

* Reading the stored token
* Reading the stored user
* Storing the authentication session
* Clearing the authentication session
* Logging in
* Validating the current session

Do not duplicate token/session persistence logic inside individual components.

The frontend currently uses `localStorage` for authentication persistence. Do not move authentication to another storage mechanism unless explicitly requested.

Do not reintroduce direct authentication state management in individual pages when the same state is already available through `useAuth()`.

Protected pages must redirect unauthenticated users to:

`/acceso`

Protected routes must wait for the authentication bootstrap to finish before deciding whether the user should be redirected.

Users without authentication cannot:

* Rate books
* Comment
* Follow users
* Create lists
* Edit profile

---

# Authentication Refactoring Rules

The authentication architecture has already been centralized.

When modifying authentication:

* Prefer `useAuth()` for authentication state.
* Prefer `authService.js` for authentication API/session operations.
* Keep `AuthContext` responsible for global authentication state.
* Keep persistence details inside `authService.js`.
* Do not duplicate calls to `storeAuthSession()`.
* Do not add another authentication context.
* Do not create another mechanism for reading the JWT.
* Do not bypass `api.js` for authenticated requests.
* Preserve the existing JWT flow and backend contract.

The current flow is:

```text
Login
  ↓
useAuth()
  ↓
AuthContext
  ↓
authService.js
  ↓
api.js
  ↓
Backend
```

Session restoration follows the same centralized architecture.

Do not refactor authentication further unless the task specifically requires it.

---

# Forms

Prefer React Hook Form.

Future validations should use Zod.

Never rely only on frontend validation.

---

# Notifications

Do NOT use:

```js
alert()
```

Use toast notifications instead.

Preferred library:

* Sonner

Success, error and warning messages should always use toasts.

---

# Styling

Maintain a consistent visual identity.

Use shared colors.

Avoid hardcoded styles whenever possible.

Components should remain visually consistent.

Do not introduce a new CSS framework or styling system unless explicitly requested.

---

# Animations

Use Framer Motion only where animations improve the experience.

Avoid excessive animations.

Keep interactions smooth.

---

# Performance

Implement:

* Lazy Loading
* Pagination
* Memoization when necessary

Avoid unnecessary renders.

Optimize images whenever possible.

Do not add memoization or other optimizations without a concrete reason.

---

# Routing

Use React Router.

Protected routes must verify authentication through the existing authentication system.

Avoid duplicated routing logic.

Do not duplicate authentication checks inside every protected page when `ProtectedRoute` already handles route protection.

---

# Components

Components should:

* Be reusable.
* Have one responsibility.
* Receive clear props.
* Avoid business logic whenever possible.

Business logic belongs inside Hooks or Services.

Do not extract code into a Hook merely to move a large amount of code elsewhere.

Before creating a new Hook, determine whether the logic is:

* Reusable
* Page-specific
* Authentication-related
* API/service-related
* UI-only

Keep abstractions proportional to the complexity they solve.

---

# Pages

Pages are responsible primarily for composing the UI.

When a page becomes too complex:

1. Identify its responsibilities.
2. Separate API/domain operations into Services when appropriate.
3. Move reusable or page-specific stateful logic into Hooks when justified.
4. Extract reusable UI into Components.
5. Keep the final page focused on composition and presentation.

Do not turn Hooks into replacements for giant components.

Do not change the behavior or visual appearance of a page during a structural refactor unless explicitly requested.

---

# Services

Services contain API/domain operations that should not be duplicated across components.

Authentication operations belong to:

`src/services/authService.js`

General HTTP communication belongs to:

`src/services/api.js`

When introducing a new service, keep it focused on a specific domain or responsibility.

Avoid creating generic "god services" that contain unrelated functionality.

---

# User Experience

Always provide feedback.

* Loading states
* Error states
* Empty states
* Success messages

Never leave the user wondering what happened.

---

# Accessibility

Use semantic HTML.

Always provide `alt` attributes for meaningful images.

Use buttons instead of clickable `div`s.

Maintain keyboard accessibility.

---

# Refactoring Principles

NextRead is being refactored progressively.

When modifying existing code:

* Preserve current functionality.
* Preserve existing routes and backend contracts.
* Avoid unnecessary breaking changes.
* Do not rewrite working code without a concrete reason.
* Prefer small, verifiable changes.
* Do not migrate technologies unless explicitly requested.
* Do not introduce state-management libraries such as Redux or Zustand unless explicitly requested.
* Do not introduce data-fetching libraries unless explicitly requested.
* Do not introduce Tailwind, Sass, CSS Modules or another styling architecture unless explicitly requested.

Before removing a file, component or dependency, verify that it is not being used elsewhere.

---

# Current Architecture Status

The authentication refactor has already been implemented.

Current authentication responsibilities are:

```text
AuthContext.jsx
    ↓
Global authentication state

useAuth.js
    ↓
Access point for components/pages

authService.js
    ↓
Authentication API + session persistence

api.js
    ↓
Centralized Axios client

ProtectedRoute.jsx
    ↓
Protected route access
```

The authentication refactor is considered complete.

Future refactors should build on this architecture instead of creating parallel authentication mechanisms.

---

# Future Goals

The project will eventually include:

* Recommendation system
* Achievements
* Collectible profile banners
* Collectible profile icons
* Personalized reading lists
* Analytics
* Better search system

All new features should respect the existing architecture.

---

# Before Finishing Any Task

Always verify:

* Responsive Design
* Accessibility
* Performance
* Reusability
* Readability
* User Experience
* Existing functionality remains intact
* No unnecessary architectural changes were introduced
* API calls use the centralized API client
* Authentication changes respect `AuthContext`, `useAuth` and `authService`

For structural refactors, run the available build/check commands before finishing the task and report the result.
