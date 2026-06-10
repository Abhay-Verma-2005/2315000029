# Affordmed Campus Notification Platform — Full Stack Assessment

## What You're Building

A campus notification system where students get real-time updates about Placements, Events, and Results. You solve it stage by stage. Each stage builds on the previous one.

**Time Limit:** 3 Hours  
**Stack:** TypeScript/JavaScript (mandatory for full stack track)  
**Frontend:** React or Next.js only (no other frameworks)  
**Styling:** Material UI preferred, or vanilla CSS — ShadCN and other CSS libraries are banned  
**Run on:** `http://localhost:3000`

---

## Pre-Setup (Do This First)

### 1. Register on the Test Server

```
POST http://4.224.186.213/evaluation-service/register
```

```json
{
  "email": "your-college-email@college.edu",
  "name": "Your Full Name",
  "mobileNo": "9999999999",
  "githubUsername": "your-github-username",
  "rollNo": "your-roll-number",
  "accessCode": "code-sent-to-your-email"
}
```
```json
{
    "email": "abhay.verma_cs23@gla.ac.in",
    "name": "abhay verma",
    "rollNo": "2315000029",
    "accessCode": "RPsgYt",
    "clientID": "f612d6dd-1ee4-4175-8aba-3c79ef6a7b0a",
    "clientSecret": "NJmUDFdgtYXnVxdg"
}
```
**Response gives you `clientID` and `clientSecret` — save these immediately, you cannot retrieve them again.**

---

### 2. Get Auth Token

```
POST http://4.224.186.213/evaluation-service/auth
```

```json
{
  "email": "your-college-email@college.edu",
  "name": "Your Full Name",
  "rollNo": "your-roll-number",
  "accessCode": "code-sent-to-your-email",
  "clientID": "your-client-id",
  "clientSecret": "your-client-secret"
}
```
```json
{
    "token_type": "Bearer",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhYmhheS52ZXJtYV9jczIzQGdsYS5hYy5pbiIsImV4cCI6MTc4MTA3MjQyOSwiaWF0IjoxNzgxMDcxNTI5LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNzdjODU1M2ItNTdlYS00MzIzLTkyN2UtNTZjY2JlNGJkZjg1IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiYWJoYXkgdmVybWEiLCJzdWIiOiJmNjEyZDZkZC0xZWU0LTQxNzUtOGFiYS0zYzc5ZWY2YTdiMGEifSwiZW1haWwiOiJhYmhheS52ZXJtYV9jczIzQGdsYS5hYy5pbiIsIm5hbWUiOiJhYmhheSB2ZXJtYSIsInJvbGxObyI6IjIzMTUwMDAwMjkiLCJhY2Nlc3NDb2RlIjoiUlBzZ1l0IiwiY2xpZW50SUQiOiJmNjEyZDZkZC0xZWU0LTQxNzUtOGFiYS0zYzc5ZWY2YTdiMGEiLCJjbGllbnRTZWNyZXQiOiJOSm1VREZkZ3RZWG5WeGRnIn0.y0A0cOF1WOmv7HXGMq8RvUlju5PSJBl8uXM6pWMmWMw",
    "expires_in": 1781072429
}
```
**Response:** A Bearer token (`access_token`) — use this in all subsequent API calls as:
```
Authorization: Bearer <access_token>
```

---

### 3. Create Logging Middleware (Mandatory Before Any Code)

Create a **reusable package** (not inline console.log) with this function signature:

```typescript
Log(stack, level, package, message)
```

This function must call the Test Server Log API every time it's used:

```
POST http://4.224.186.213/evaluation-service/logs
Authorization: Bearer <access_token>
```

```json
{
  "stack": "backend",
  "level": "error",
  "package": "handler",
  "message": "received string, expected bool"
}
```

**Allowed values (lowercase only):**

| Field | Values |
|-------|--------|
| stack | `backend`, `frontend` |
| level | `debug`, `info`, `warn`, `error`, `fatal` |
| package (backend) | `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service` |
| package (frontend) | `api`, `component`, `hook`, `page`, `state`, `style` |
| package (both) | `auth`, `config`, `middleware`, `utils` |

Use `Log()` everywhere — no raw `console.log` allowed.

---
