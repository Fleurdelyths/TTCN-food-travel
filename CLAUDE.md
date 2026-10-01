# TTCN - Food & Travel Recommendation Platform Guidelines

## Project Context

A fullstack web application built with Next.js (App Router) for recommending food places and travel itineraries.

## Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: MySQL using `mysql2/promise` connection pool
- **Auth**: JWT (stored in HTTP-only cookies) & Bcrypt
- **Map Service**: Mapbox GL JS
- **HTTP Client**: Axios

## Folder Structure Rules

- `app/api/`: Backend RESTful API endpoints.
- `app/(auth)/`: Authentication pages (Login/Register).
- `components/`: Modular, reusable UI components.
- `lib/db.ts`: MySQL connection pool configuration.
- `lib/auth.ts`: JWT token creation & verification helpers.

## Code Style & Conventions

- Use TypeScript strict mode. Define interface/type for all API responses and component props.
- Keep components modular and functional.
- API endpoints must return standard JSON format: `{ success: boolean, message?: string, data?: any }`.
