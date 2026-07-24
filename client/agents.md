# AGENTS.md - NextRead Frontend

## Project

NextRead is a social platform where users discover, rate and organize books.

This folder contains the Frontend built with:

- React
- Vite
- React Router
- Axios
- Framer Motion

The focus is creating a modern, fast and intuitive experience.

---

# Main Goals

Prioritize:

- User Experience
- Maintainability
- Accessibility
- Performance
- Reusable components

Avoid unnecessary complexity.

---

# Project Structure

Keep a clean separation between:

- Pages
- Components
- Layouts
- Hooks
- Services
- Utils

Avoid giant components.

Extract reusable UI whenever possible.

---

# API Calls

Never call axios directly inside multiple components.

Always use the centralized API client.

Example:

services/api.js

All requests should go through that client.

---

# Authentication

Authentication is handled using JWT.

Protected pages must redirect unauthenticated users to the Landing Page.

Users without authentication cannot:

- Rate books
- Comment
- Follow users
- Create lists
- Edit profile

---

# Forms

Prefer React Hook Form.

Future validations should use Zod.

Never rely only on frontend validation.

---

# Notifications

Do NOT use:

alert()

Use toast notifications instead.

Preferred library:

- Sonner

Success, error and warning messages should always use toasts.

---

# Styling

Maintain a consistent visual identity.

Use shared colors.

Avoid hardcoded styles whenever possible.

Components should remain visually consistent.

---

# Animations

Use Framer Motion only where animations improve the experience.

Avoid excessive animations.

Keep interactions smooth.

---

# Performance

Implement:

- Lazy Loading
- Pagination
- Memoization when necessary

Avoid unnecessary renders.

Optimize images whenever possible.

---

# Routing

Use React Router.

Protected routes must verify authentication.

Avoid duplicated routing logic.

---

# Components

Components should:

- Be reusable.
- Have one responsibility.
- Receive clear props.
- Avoid business logic whenever possible.

Business logic belongs inside Hooks or Services.

---

# User Experience

Always provide feedback.

Loading...

Error states.

Empty states.

Success messages.

Never leave the user wondering what happened.

---

# Accessibility

Use semantic HTML.

Always provide alt attributes.

Use buttons instead of clickable divs.

Maintain keyboard accessibility.

---

# Future Goals

The project will eventually include:

- Recommendation system
- Achievements
- Collectible profile banners
- Collectible profile icons
- Personalized reading lists
- Analytics
- Better search system

All new features should respect the existing architecture.

---

# Before Finishing Any Task

Always verify:

- Responsive Design
- Accessibility
- Performance
- Reusability
- Readability
- User Experience