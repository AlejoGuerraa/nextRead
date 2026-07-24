# AGENTS.md - NextRead Development Guide

# Project Overview

NextRead is a full-stack web application focused on helping users discover, rate and organize books.

The platform combines social features with personalized recommendations, achievements and profile customization.

The project follows a clean, scalable and maintainable architecture.

Technology Stack

Frontend
- React
- Vite
- React Router
- Axios
- Framer Motion

Backend
- Node.js
- Express
- Sequelize
- MySQL
- JWT
- bcrypt

---

# Development Philosophy

Always prioritize:

- Readability
- Maintainability
- Scalability
- Security
- Performance

Never implement quick fixes that reduce code quality.

Every feature should be built thinking about future growth.

Code should be easy to understand for any developer joining the project.

---

# Language

The entire codebase must be written in English.

This includes:

- Variables
- Functions
- Classes
- Interfaces
- Types
- Routes
- Endpoints
- Database tables
- Database columns
- Comments
- Documentation
- Commit messages

The user interface may remain in Spanish unless internationalization is implemented.

---

# Naming Conventions

## Variables

Use camelCase.

Example:

```
userName
favoriteBooks
recommendationScore
```

---

## Functions

Use snake_case.

Example:

```
create_user()
calculate_similarity()
get_recommendations()
```

---

## Classes

Use PascalCase.

Example:

```
UserService
RecommendationEngine
BookController
```

---

## Files

Use PascalCase whenever possible.

Examples:

```
UserController.js
BookService.js
RecommendationEngine.js
ProfilePage.jsx
BookCard.jsx
```

Utility files may use lowercase if appropriate.

Examples:

```
api.js
constants.js
helpers.js
```

---

## Database

Tables should use snake_case.

Examples

```
users
books
book_reviews
reading_lists
user_notifications
```

Columns should also use snake_case.

```
user_id
created_at
average_rating
book_cover
```

---

# Folder Organization

Respect the existing architecture.

Backend

- Routes
- Controllers
- Services
- Models
- Middlewares
- Utils

Frontend

- Pages
- Components
- Layouts
- Hooks
- Services
- Utils

Avoid creating unnecessary folders.

---

# Comments

Code should be self-explanatory whenever possible.

Only comment code that benefits from additional explanation.

Avoid obvious comments.

Bad:

```js
// Increment counter
counter++;
```

Good:

```js
// Calculate similarity using weighted genre and author scores.
```

---

# Documentation

The following should always be documented:

- Endpoints
- Middleware
- Complex functions
- Recommendation algorithms
- Authentication flow
- Database changes

Public methods should have a short description explaining their purpose.

---

# Endpoint Guidelines

Every endpoint should include a brief description explaining:

- Purpose
- Required authentication
- Parameters
- Expected responses

Use consistent HTTP status codes.

Example

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

500 Internal Server Error

---

# Middleware Guidelines

Every middleware should include a short description explaining:

- Why it exists
- When it executes
- What happens if validation fails

Middleware should have only one responsibility.

---

# Functions

Each function should have only one responsibility.

Avoid large functions.

If a function exceeds roughly 40 to 60 lines, consider splitting it into smaller functions.

Prefer composition over giant functions.

---

# Code Reuse

Avoid duplicated code.

If logic is repeated multiple times:

Extract it into:

- Service
- Helper
- Utility
- Custom Hook
- Middleware

---

# Security

Always assume user input is malicious.

Validate every request.

Never trust frontend validation.

Prevent:

- SQL Injection
- XSS
- CSRF
- Unauthorized access

Never expose sensitive information.

---

# Error Handling

Handle errors explicitly.

Return meaningful messages.

Avoid leaking internal implementation details.

Never leave empty catch blocks.

---

# Logging

Important actions should be logged.

Examples:

- Login
- Register
- Reviews
- Ratings
- Profile updates
- System errors

Avoid excessive logging.

---

# Performance

Think about performance before optimization becomes necessary.

Prefer:

- Pagination
- Lazy Loading
- Indexed queries
- Optimized Sequelize relations

Avoid unnecessary database queries.

---

# User Experience

Always provide feedback.

Users should always know if an action is:

- Loading
- Successful
- Failed

Never use browser alerts.

Use toast notifications.

Preferred library:

- Sonner

---

# Git Workflow

Branch naming:

```
feature/login
feature/recommendations

fix/profile-page

refactor/auth-service

docs/agents

hotfix/login
```

Commit messages should be written in English.

Prefer Conventional Commits.

Examples:

```
feat: add recommendation algorithm

fix: resolve login validation

refactor: simplify review service

docs: update AGENTS guide

style: format project with prettier
```

---

# Pull Requests

Every Pull Request should:

- Have a clear objective.
- Keep a single responsibility.
- Avoid unrelated changes.
- Be reviewed before merging.

---

# AI Instructions

When modifying this project:

- Respect the existing architecture.
- Avoid unnecessary dependencies.
- Do not rewrite working code without reason.
- Prefer incremental improvements.
- Explain important architectural decisions.
- Maintain consistency across the project.

If there are multiple possible implementations, choose the most maintainable one rather than the shortest.

---

# Final Checklist

Before considering a task finished, verify:

- Code follows project conventions.
- No duplicated logic.
- Proper validation exists.
- Errors are handled correctly.
- Security has been considered.
- Performance impact has been evaluated.
- Comments were added where appropriate.
- Documentation was updated if necessary.