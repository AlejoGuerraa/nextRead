# AGENTS.md - NextRead Backend

## Project

NextRead is a social platform for book lovers. Users can discover books, rate them, write reviews, create reading lists, unlock achievements and receive personalized recommendations.

This folder contains the Backend API built with:

- Node.js
- Express
- Sequelize
- MySQL
- JWT
- bcrypt

The backend follows a REST API architecture.

---

# Main Goals

Prioritize:

- Security
- Scalability
- Readability
- Maintainability
- Performance

Never sacrifice code quality for shorter implementations.

---

# Architecture

Follow this separation of responsibilities:

- Routes
- Controllers
- Services
- Models
- Middlewares
- Utils / Helpers

Controllers should stay as small as possible.

Business logic belongs inside Services.

Avoid putting large amounts of logic inside routes.

---

# Database

Use Sequelize whenever possible.

Avoid Raw SQL unless there is a strong performance reason.

Whenever raw SQL is used:

- Use replacements / parameterized queries.
- Never concatenate user input into SQL strings.
- Prevent SQL Injection at all costs.

Create indexes for frequently searched fields.

Always think about scalability before modifying the database schema.

---

# Validation

Always validate incoming data.

Use Zod schemas before reaching controllers.

Never trust client-side validation.

Validate:

- body
- params
- query

---

# Authentication

Authentication uses JWT.

Passwords must always be hashed with bcrypt.

Protected routes must verify authentication before executing business logic.

Never expose sensitive information.

---

# Security

Current security stack:

- Helmet
- CORS
- JWT
- bcrypt

When adding new endpoints:

- Validate permissions.
- Return proper HTTP status codes.
- Avoid exposing internal errors.
- Create enviroment variables and create them in .env

---

# Logging

Morgan is used during development.

Future logging should be centralized.

Important events should be registered inside the system log (Bitácora).

Examples:

- Login
- Register
- Password changes
- Reviews
- Ratings
- Follow / Unfollow
- Important system errors

---

# API Design

Prefer REST conventions.

Use meaningful endpoint names.

Return consistent JSON responses.

Example:

{
    success: true,
    message: "...",
    data: {}
}

or

{
    success: false,
    message: "...",
    errors: []
}

---

# Performance

Prefer optimized queries.

Avoid N+1 queries.

Use eager loading only when necessary.

Paginate large collections.

Think about indexes before blaming Sequelize.

---

# Code Style

Prefer readability over clever code.

Avoid duplicated logic.

Extract reusable code into Services or Utils.

Use descriptive variable names.

Keep functions focused on one responsibility.

---

# Recommendations System

Recommendation quality is one of the core goals of NextRead.

Future recommendation logic should consider:

- Ratings
- Genres
- Authors
- Internal tags
- Reading history
- User preferences
- Similar users

Do not implement recommendation logic directly inside controllers.

---

# Before Finishing Any Task

Always verify:

- Security
- Validation
- Error handling
- Performance
- Readability
- Scalability