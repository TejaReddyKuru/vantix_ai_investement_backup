# Authentication and Authorization

## Overview

Vish Capitals Friday uses a JWT-based authentication flow backed by the existing user and session models. Authentication is implemented entirely on the backend and keeps the current Phase 1/2 database schema intact.

## Core flow

1. User registers with email, password, and display name.
2. Password is hashed with bcrypt before storage.
3. A JWT access token is issued for authenticated requests.
4. A refresh token is stored as a hashed value in the existing `user_sessions` table.
5. Protected APIs require a bearer token.
6. Logout and refresh revoke or rotate the stored refresh session.

## Password security

- Uses bcrypt for hashing.
- Enforces minimum length and complexity requirements.
- Never stores plaintext values.
- Never returns hashes to the client.

## JWT lifecycle

- Access token lifetime: 15 minutes by default.
- Refresh token lifetime: 30 days by default.
- Refresh tokens are rotated on use.
- Revoked refresh sessions are rejected.

## RBAC

The auth layer is future-ready for roles. The current default roles are:

- USER: standard authenticated member
- ADMIN: users with `is_staff = True`

Reusable dependencies:

- `require_user`
- `require_admin`

## Session model

The existing `user_sessions` table is used to track:

- user id
- hashed refresh token
- device metadata
- IP address
- created/expiry timestamps
- revocation time

## Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/change-password`
- `POST /api/v1/auth/request-password-reset`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/request-email-verification`
- `POST /api/v1/auth/verify-email`

## Security headers

The FastAPI app includes security headers such as:

- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Content-Security-Policy`
- `Permissions-Policy`

## Audit

Authentication and account actions are logged to the existing `audit_logs` table.
