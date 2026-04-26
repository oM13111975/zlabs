# ZLabs Portal — Comprehensive Technical Documentation

> **Version:** 2.0 | **Last Updated:** April 2026 | **Environment:** IST (UTC+5:30)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack — Complete Breakdown](#2-tech-stack--complete-breakdown)
3. [System Architecture](#3-system-architecture)
4. [Database Models & Relationships](#4-database-models--relationships)
5. [API Reference](#5-api-reference)
6. [Feature Documentation — Every Module](#6-feature-documentation--every-module)
7. [Email Notification System](#7-email-notification-system)
8. [Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)
9. [Frontend Page Reference](#9-frontend-page-reference)
10. [Authentication & Security](#10-authentication--security)
11. [AWS Deployment Guide](#11-aws-deployment-guide)
12. [Pre-Deployment Checklist & Improvements Required](#12-pre-deployment-checklist--improvements-required)

---

## 1. Project Overview

ZLabs Portal is a full-stack internal management platform build for Zeex Labs that manages the complete talent lifecycle from internship to permanent employment. It provides:

- A **public-facing Careers page** for applicants to submit applications.
- A **role-gated internal portal** for admins, team heads, mentors, and team members to manage operations.
- An **automated email pipeline** for task assignments, feedback, reminders, and credential delivery.
- A **dual task system**: public-token-based tasks for interns and portal-authenticated tasks for permanent employees.

---

## 2. Tech Stack — Complete Breakdown

### 2.1 Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | **Django** | >= 6.0 | Web framework, ORM, admin panel |
| API | **Django REST Framework** | >= 3.17 | REST API endpoints and serialization |
| Auth | **SimpleJWT** | >= 5.5 | JWT token-based authentication |
| CORS | **django-cors-headers** | >= 4.9 | Cross-origin request handling |
| Environment | **django-environ** | >= 0.11.0 | `.env` file variable management |
| Image Processing | **Pillow** | >= 12.0 | Avatar and image uploads |
| Runtime | **Python** | 3.10+ | Language runtime |
| Database (Dev) | **SQLite** | — | Local development database |
| Database (Prod) | **PostgreSQL** | 14+ | Production database (recommended) |
| File Storage (Dev) | **Local filesystem** | — | `/media/` directory |
| File Storage (Prod) | **AWS S3** | — | Recommended for production |

### 2.2 Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | **React** | 18+ | Component-based UI |
| Build Tool | **Vite** | 5+ | Fast dev server and production bundler |
| Language | **JavaScript (ES6+)** | — | Application logic |
| Routing | **React Router DOM** | v6 | Client-side page navigation |
| Icons | **Lucide React** | — | Consistent icon library |
| HTTP Client | **Axios** | — | API communication |
| State Management | **React Context API** | — | Auth state (user, role, token) |
| Styling | **Vanilla CSS** | — | Custom design system with CSS Variables |
| Fonts | **Google Fonts (Inter)** | — | Primary UI typeface |

### 2.3 Infrastructure (Current — Development)

| Service | Tool |
|---|---|
| Backend Server | `py manage.py runserver` on port `8000` |
| Frontend Dev Server | `npm run dev` via Vite on port `5173` |
| Proxy | Vite built-in proxy (forwards `/api/` to `:8000`) |
| Database | SQLite file `db.sqlite3` |
| Email | SMTP via Gmail (or Console in dev) |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                    │
│              React + Vite (Port 5173)                   │
└─────────────────────┬───────────────────────────────────┘
                      │  HTTP/HTTPS (Axios)
                      ▼
┌─────────────────────────────────────────────────────────┐
│               Django REST Framework                     │
│                  (Port 8000)                            │
│  ┌─────────┐ ┌──────────────┐ ┌─────────┐ ┌─────────┐  │
│  │  users  │ │ internships  │ │  tasks  │ │  teams  │  │
│  └─────────┘ └──────────────┘ └─────────┘ └─────────┘  │
│  ┌──────────┐ ┌────────────────────┐                    │
│  │ projects │ │   activity_logs    │                    │
│  └──────────┘ └────────────────────┘                    │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
   ┌───────────┐           ┌───────────────────┐
   │  SQLite   │           │  /media/ files    │
   │ db.sqlite3│           │  (uploads, CVs)   │
   └───────────┘           └───────────────────┘
```

### 3.1 Request Flow

1. Browser makes request → Vite Dev Server
2. If path starts with `/api/`, Vite proxies it to `http://localhost:8000`
3. Django authenticates JWT token from `Authorization: Bearer <token>` header
4. Permission class validates the user's role
5. View processes logic and returns JSON response
6. React updates UI

### 3.2 Authentication Flow

```
Login → POST /api/auth/login/ → Returns { access_token, refresh_token, user, role }
         │
         ▼
Tokens stored in localStorage (AuthContext)
         │
         ▼
All requests: Header: Authorization: Bearer <access_token>
         │
         ▼
access_token expires in 8 hours → use refresh_token (valid 7 days)
```

---

## 4. Database Models & Relationships

### 4.1 Users App

**`UserProfile`** — extends Django's built-in `User` model

| Field | Type | Description |
|---|---|---|
| `user` | OneToOneField → `User` | Links to Django auth user |
| `role` | CharField | `super_admin`, `admin`, `mentor`, `team_head`, `team_member`, `intern` |
| `phone` | CharField | Contact number |
| `bio` | TextField | Short biography |
| `avatar` | ImageField | Profile picture stored in `/media/avatars/` |
| `created_at` | DateTimeField | Auto-set on creation |
| `updated_at` | DateTimeField | Auto-updated on save |

### 4.2 Internships App

**`OpenPosition`** — Publishable job openings shown on Careers page

| Field | Type | Description |
|---|---|---|
| `role` | CharField | One of 8 internship roles (unique) |
| `title` | CharField | Display title |
| `description` | TextField | Full role description |
| `requirements` | TextField | Skills/qualifications needed |
| `duration` | CharField | e.g., "3 months" |
| `is_open` | BooleanField | Controls visibility on Careers page |

**`Application`** — Submitted internship applications

| Field | Type | Description |
|---|---|---|
| `name` | CharField | Applicant's full name |
| `email` | EmailField (unique) | Applicant's email |
| `phone` | CharField | Contact number |
| `role_applied_for` | CharField | One of 8 role choices |
| `skills` | TextField | Comma-separated skills |
| `cover_letter` | TextField | Motivation statement |
| `resume` | FileField | PDF uploaded to `/media/resumes/` |
| `status` | CharField | `pending`, `accepted`, `rejected` |
| `reviewed_by` | FK → User | Admin who took action |
| `rejection_reason` | TextField | Reason sent to applicant |

**`InternProfile`** — Active intern record created on acceptance

| Field | Type | Description |
|---|---|---|
| `user` | OneToOneField → User | Linked after conversion (null until then) |
| `application` | OneToOneField → Application | Source application |
| `mentor` | FK → User | Assigned mentor/team member |
| `is_ready_for_team` | BooleanField | Flagged by mentor |
| `converted_at` | DateTimeField | Timestamp of employee conversion |
| `domain` | CharField | Specialization area |
| `current_round` | IntegerField | Active internship round (1-5) |

### 4.3 Tasks App

**`Task`** — Core unit of work assignment

| Field | Type | Description |
|---|---|---|
| `title` | CharField | Task name |
| `description` | TextField | Full task brief |
| `deadline` | DateTimeField | Due date/time |
| `attachment` | FileField | Reference file from mentor |
| `assigned_to` | FK → User | Assigned to a portal user (employee) |
| `assigned_intern` | FK → InternProfile | Assigned to a pre-login intern |
| `assigned_by` | FK → User | Creator (mentor/admin) |
| `team` | FK → Team | Team context |
| `project` | FK → Project | Project context |
| `status` | CharField | `pending`, `submitted`, `reviewed`, `in_progress`, `completed` |
| `task_type` | CharField | `intern` (public token) or `team` (portal-only) |
| `round_number` | IntegerField | Internship round (1-5) |
| `submission_token` | UUIDField | Unique token for public submission URL |

**`TaskSubmission`** — Work submitted by intern/member

| Field | Type | Description |
|---|---|---|
| `task` | OneToOneField → Task | Parent task |
| `text_response` | TextField | Written submission |
| `file_upload` | FileField | Uploaded file |
| `submitted_at` | DateTimeField | Submission timestamp |
| `submitter_email` | EmailField | Email used for verification |

**`TaskFeedback`** — Mentor's evaluation

| Field | Type | Description |
|---|---|---|
| `task` | OneToOneField → Task | Parent task |
| `feedback_text` | TextField | Qualitative feedback |
| `given_by` | FK → User | Mentor who reviewed |
| `rating` | IntegerField | Score from 1-5 |

**`WorkLog`** — Progress notes on a task

| Field | Type | Description |
|---|---|---|
| `task` | FK → Task | Parent task |
| `user` | FK → User | Who logged it |
| `log_text` | TextField | Free-form progress note |

### 4.4 Teams & Projects

**`Team`**

| Field | Type | Description |
|---|---|---|
| `name` | CharField | Team identifier |
| `domain` | CharField | Specialization (e.g., Design, Dev) |
| `head` | FK → User | Team Head user |

**`TeamMembership`** — M2M join table

| Field | Type | Description |
|---|---|---|
| `user` | FK → User | Member |
| `team` | FK → Team | Their team |

**`Meeting`**

| Field | Type | Description |
|---|---|---|
| `title` | CharField | Meeting name |
| `meeting_link` | URLField | Zoom/Google Meet URL |
| `scheduled_at` | DateTimeField | When it occurs |
| `team` | FK → Team | Owning team |

**`Project`**

| Field | Type | Description |
|---|---|---|
| `name` | CharField | Project name |
| `description` | TextField | Brief |
| `team` | FK → Team | Owning team |
| `members` | M2MField → User | Assigned members |
| `status` | CharField | `planning`, `active`, `on_hold`, `completed` |

### 4.5 Activity Logs

**`ActivityLog`** — Audit trail for all key actions

| Event Type | Trigger |
|---|---|
| `task_created` | New task assigned |
| `task_updated` | Task modified |
| `task_submitted` | Submission received |
| `feedback_given` | Mentor reviews task |
| `role_converted` | Intern promoted |
| `application_submitted` | New application received |
| `application_accepted` | Admin accepts applicant |
| `application_rejected` | Admin rejects applicant |
| `intern_ready` | Mentor marks intern ready |
| `team_created` | New team added |
| `project_created` | New project added |
| `mentor_assigned` | Mentor linked to intern |

---

## 5. API Reference

**Base URL:** `http://localhost:8000/api/`

### 5.1 Authentication (`/api/auth/`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| POST | `/auth/login/` | Public | Login, returns JWT tokens |
| POST | `/auth/register/` | Admin | Create new user account |
| GET | `/auth/me/` | Authenticated | Get current user & role |
| GET | `/auth/users/` | Admin | List all portal users |
| GET | `/auth/mentors/` | Admin/Manager | List eligible mentors |
| GET | `/auth/analytics/` | Admin | Dashboard KPI stats |

### 5.2 Internships (`/api/internships/`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/internships/positions/` | Public | List open job positions |
| POST | `/internships/apply/` | Public | Submit an application |
| GET | `/internships/applications/` | Admin | List all applications (filterable) |
| POST | `/internships/applications/:id/accept/` | Admin | Accept applicant, create intern profile |
| POST | `/internships/applications/:id/reject/` | Admin | Reject with reason |
| GET | `/internships/interns/` | Admin/Mentor | List intern profiles |
| GET | `/internships/interns/:id/` | Admin/Mentor | View single intern profile |
| POST | `/internships/interns/:id/assign-mentor/` | Admin | Assign a mentor |
| POST | `/internships/interns/:id/mark-ready/` | Mentor | Flag intern as ready for promotion |
| POST | `/internships/interns/:id/convert/` | Admin | Convert intern to employee |
| PATCH | `/internships/interns/:id/update-round/` | Admin/Mentor | Advance intern to next round |

### 5.3 Tasks (`/api/tasks/`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/tasks/` | Authenticated | List tasks (role-filtered) |
| POST | `/tasks/` | Manager | Create and assign a task |
| GET/PUT | `/tasks/:id/` | Authenticated | Get or update a task |
| PATCH | `/tasks/:id/status/` | Authenticated | Update task status |
| POST | `/tasks/:id/feedback/` | Manager | Submit evaluation & rating |
| POST | `/tasks/:id/remind/` | Manager | Send deadline reminder email |
| POST | `/tasks/:id/submit-internal/` | Authenticated | Portal-based task submission (employees) |
| GET | `/tasks/submit/:token/` | Public | View task for public submission |
| POST | `/tasks/submit/:token/` | Public | Submit task via public token URL |

### 5.4 Teams (`/api/teams/`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET/POST | `/teams/` | Admin | List/create teams |
| GET/PUT/DELETE | `/teams/:id/` | Admin | Manage single team |
| GET/POST | `/teams/meetings/` | Authenticated | List/create meetings |

### 5.5 Projects (`/api/projects/`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET/POST | `/projects/` | Authenticated | List/create projects |
| GET/PUT/DELETE | `/projects/:id/` | Manager | Manage single project |

### 5.6 Activity Logs (`/api/activity-logs/`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/activity-logs/` | Admin | Paginated audit trail |

---

## 6. Feature Documentation — Every Module

### 6.1 Public Careers Page

**URL:** `/careers`  
**Access:** No login required

- Displays all `OpenPosition` entries with `is_open=True`.
- Applicants fill a form with: Name, Email, Phone, Role Selection, Skills, Cover Letter, Resume (PDF).
- On submission, a new `Application` record is created with `status=pending`.
- The system sends an acknowledgement email to the applicant.

---

### 6.2 Application Management

**URL:** `/admin/applicants` (Admin only)

- Lists all applications with filters: Status (Pending/Accepted/Rejected), Role, Text Search.
- **Accept Flow:**
  1. Admin clicks "Accept."
  2. A modal allows optionally assigning a Mentor immediately.
  3. An `InternProfile` is created linked to the `Application`.
  4. A welcome email is dispatched to the intern explaining the process.
- **Reject Flow:**
  1. Admin provides optional reason.
  2. Application status set to `rejected`.

---

### 6.3 Intern Directory & Profiles

**URL:** `/admin/interns` or `/team/interns` or `/team-head/interns`

- **Directory View:** Table showing all interns with task progress bar, mentor name, and submission status badge.
- **Filter:** Role-based: Admins see all; Mentors/Team Members see only their assigned interns; Team Heads see interns they mentor.
- **Profile View:** Comprehensive single-intern dashboard with:
  - **Internship Pipeline** — Visual 5-step round tracker.
  - **Assign New Task** — Form to create and email an intern task.
  - **Task History** — Table of all past tasks with status, submission, and feedback.
  - **Sidebar:** Contact info, PDF Resume link, Mentor info, Promotion card.

---

### 6.4 Internship Round System (1–5)

- Organized as 5 progressive rounds.
- Each round has its own tasks.
- When a mentor reviews a task tied to the intern's current round, the system automatically increments `current_round`.
- Round 5 completion is a signal to mark the intern as "Ready for Team."

---

### 6.5 Convert Intern to Employee

**Trigger:** "Promote to Employee" button on the Intern Profile sidebar.

**Workflow:**
1. Admin fills conversion form: Target Role (`team_member` or `team_head`), Team Assignment.
2. Admin can customize the welcome email subject and body using dynamic placeholders:
   - `[[NAME]]` — Intern's first name
   - `[[ROLE]]` — Assigned role
   - `[[USERNAME]]` — Generated username
   - `[[PASSWORD]]` — Generated temporary password
   - `[[LOGIN_URL]]` — Direct link to the portal login
3. System backend automatically:
   - Creates a Django `User` account.
   - Generates a secure 10-character password (`letters + digits + !@#$`).
   - Sets `UserProfile.role` to the selected role.
   - Creates a `TeamMembership` record.
   - Records `InternProfile.converted_at`.
   - Logs `role_converted` in `ActivityLog`.
4. Welcome email with credentials is dispatched immediately.

---

### 6.6 Task System — Dual Architecture

#### 6.6.1 Intern Tasks (Round-Based)
- Assigned by Mentors/Admins to `InternProfile` records.
- Each task has a UUID-based `submission_token`.
- Submission link: `https://yourapp.com/submit/{token}` — no login needed.
- Intern must verify their registered email before viewing the submission form.
- On submit, the mentor receives an email notification.

#### 6.6.2 Project Tasks (Portal-Only)
- Assigned to portal `User` accounts (permanent employees).
- Linked to a `Project`.
- Submission only via authenticated portal (not via email link).
- Members see **only their own assigned tasks**.
- Admins/Team Heads see tasks for their team/projects.

---

### 6.7 Task Feedback & Evaluation

- Mentors/Admins review tasks with:
  - Written `feedback_text`
  - Numerical `rating` (1-5 stars)
- Task status changes from `submitted` → `reviewed`.
- A feedback notification email is sent to the intern/member.
- Rating is displayed on the intern's profile history.

---

### 6.8 Task Reminders

- Managers can send a one-click reminder email to the task assignee.
- Email includes task title, deadline, and the submission link.

---

### 6.9 Team Management

**URL:** `/admin/teams`

- Create teams with Name, Domain, and Team Head assignment.
- View team hierarchy: Head at top, Members below.
- Manage team memberships (add/remove members).
- Each team can have multiple projects.

---

### 6.10 Project Management

**URL:** `/admin/projects` or `/team/projects`

- Create projects linked to a specific team.
- Assign individual members to a project (M2M).
- Project statuses: Planning → Active → On Hold → Completed.
- Project Tasks are created within project context.

---

### 6.11 Meeting Scheduler

- Team Heads and Admins can schedule meetings for their teams.
- Fields: Title, Description, Meeting Link (Zoom/Meet URL), Date & Time.
- All team members see upcoming meetings on their dashboard.

---

### 6.12 Hierarchy Visualization

**URL:** `/admin/hierarchy`

- Visual org-chart of the company.
- Shows Team Head → Team Members chain for each team.
- Non-interactive read-only view for administrative reference.

---

### 6.13 Activity Log

**URL:** `/admin/logs`

- Paginated, chronological audit trail.
- Captures: who did what, to which record, and when.
- Includes team context where applicable.
- Useful for investigations and compliance.

---

### 6.14 Role-Specific Dashboards

| Role | Dashboard URL | Key Stats |
|---|---|---|
| Admin / Super Admin | `/admin` | Pending Apps, Active Interns, Team Stats, Recent Activity |
| Team Member / Mentor | `/team` | My Tasks, My Interns, Team Meetings |
| Team Head | `/team-head` | Team Overview, Projects, My Interns, Meetings |

---

## 7. Email Notification System

All emails are sent via Django's `send_mail` using SMTP (configurable via `.env`).

| Email Event | Recipient | Trigger |
|---|---|---|
| Application Acknowledgement | Applicant | On application submit |
| Application Accepted | Applicant/Intern | Admin accepts application |
| Task Assigned | Intern/Member | New task created |
| Task Submission Notification | Mentor | Intern submits task |
| Task Feedback | Intern/Member | Mentor provides review |
| Deadline Reminder | Intern/Member | Mentor clicks "Remind" |
| Welcome / Credentials | New Employee | Intern converted to employee |

**Email placeholders system** (used in custom templates):  
`[[NAME]]` `[[ROLE]]` `[[USERNAME]]` `[[PASSWORD]]` `[[LOGIN_URL]]` `[[DESCRIPTION]]` `[[DEADLINE]]` `[[SENDER]]` `[[SUBMISSION_URL]]`

---

## 8. Role-Based Access Control (RBAC)

| Permission | super_admin | admin | team_head | mentor | team_member | intern |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View all applications | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Accept/Reject applications | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all interns | ✅ | ✅ | Own only | Own only | Own only | ❌ |
| Assign mentors | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Convert intern to employee | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | Team only | ✅ | ✅ | ❌ |
| View tasks | All | All | Team's | Own+assigned | Own only | Token only |
| Give feedback | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit tasks (portal) | — | — | — | ✅ | ✅ | Token |
| Manage teams | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage projects | ✅ | ✅ | Team only | View | View | ❌ |
| Schedule meetings | ✅ | ✅ | Team only |  View | View | ❌ |
| View activity logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 9. Frontend Page Reference

| Page | Route | Role |
|---|---|---|
| Login | `/login` | Public |
| Careers | `/careers` | Public |
| Public Task Submit | `/submit/:token` | Public |
| Admin Dashboard | `/admin` | Admin/Super Admin |
| Applicants | `/admin/applicants` | Admin |
| Interns Directory | `/admin/interns` | Admin |
| Intern Profile | `/admin/interns/:id` | Admin |
| Teams | `/admin/teams` | Admin |
| Projects | `/admin/projects` | Admin |
| Intern Tasks | `/admin/tasks/interns` | Admin |
| Project Tasks | `/admin/tasks/projects` | Admin |
| Hierarchy | `/admin/hierarchy` | Admin |
| Users | `/admin/users` | Admin |
| Activity Logs | `/admin/logs` | Admin |
| Team Member Dashboard | `/team` | Mentor/Member |
| My Interns (Member) | `/team/interns` | Mentor/Member |
| Intern Profile (Member) | `/team/interns/:id` | Mentor/Member |
| Team Member Tasks | `/team/tasks/interns` | Mentor/Member |
| Team Head Dashboard | `/team-head` | Team Head |
| My Interns (Head) | `/team-head/interns` | Team Head |
| Team Members | `/team-head/members` | Team Head |

---

## 10. Authentication & Security

### Current Setup

- **JWT Tokens:** Access token (8hrs) + Refresh token (7 days).
- **Role validation** on every protected endpoint via custom `Permission` classes.
- **Email verification** for public task submissions (intern must match registered email).
- **CORS:** Currently open (`CORS_ALLOW_ALL_ORIGINS = True`) — **must be restricted in production**.
- **Secret Key:** Read from `.env` file.
- **Debug:** `False` in production via `.env`.

### Passwords

- Intern-to-Employee conversion generates a 10-character password with letters, digits, and `!@#$`.
- Django's built-in password validators enforce strength for manual registrations.

---

## 11. AWS Deployment Guide

### 11.1 Recommended Architecture

```
Internet
    │
    ▼
┌──────────────┐
│  CloudFront  │  ← CDN for frontend (caching, SSL)
│  (+ WAF)     │
└──────┬───────┘
       │
┌──────▼───────┐        ┌──────────────────┐
│  S3 Bucket   │        │  ALB (Load       │
│  (React SPA) │        │  Balancer)       │
└──────────────┘        └──────┬───────────┘
                                │
                    ┌───────────▼────────────┐
                    │  ECS / EC2 (Django)    │
                    │  + Gunicorn + Nginx    │
                    └───────────┬────────────┘
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
        ┌───────────┐   ┌──────────────┐  ┌──────────────┐
        │  RDS      │   │  S3 (Media   │  │  SES (Email) │
        │(PostgreSQL│   │  files)      │  │              │
        └───────────┘   └──────────────┘  └──────────────┘
```

### 11.2 Step-by-Step Deployment

#### Step 1 — Database: AWS RDS (PostgreSQL)

```
1. Create an RDS PostgreSQL instance (db.t3.micro for dev, db.t3.medium for prod).
2. Place it in a private subnet (no public access).
3. Create a security group allowing only your backend ECS/EC2 to connect on port 5432.
4. Update settings.py:
```

```python
# requirements.txt — add this:
psycopg2-binary>=2.9

# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),  # RDS endpoint
        'PORT': '5432',
    }
}
```

#### Step 2 — Media Storage: AWS S3

```
1. Create an S3 bucket: zlabs-media-prod
2. Block all public access (use signed URLs).
3. Install: pip install django-storages boto3
```

```python
# settings.py
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_STORAGE_BUCKET_NAME = 'zlabs-media-prod'
AWS_S3_REGION_NAME = 'ap-south-1'  # Mumbai
AWS_DEFAULT_ACL = None
MEDIA_URL = f'https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/'
```

#### Step 3 — Email: AWS SES

```
1. Verify your domain (zlabs.com) in SES.
2. Move SES out of sandbox for production sending.
3. Create SMTP credentials.
```

```ini
# .env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=email-smtp.ap-south-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<SES-SMTP-USER>
EMAIL_HOST_PASSWORD=<SES-SMTP-PASSWORD>
DEFAULT_FROM_EMAIL=ZLabs Portal <noreply@zlabs.com>
```

#### Step 4 — Backend Server: ECS (Fargate) or EC2

**With EC2:**

```bash
# Install dependencies
pip install gunicorn

# Gunicorn command (in production)
gunicorn core.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120

# Nginx config (proxy to gunicorn)
server {
    listen 80;
    server_name api.zlabs.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /media/ {
        # Serve from S3 or local (if local)
        alias /var/www/zlabs/media/;
    }
}
```

#### Step 5 — Frontend: S3 + CloudFront

```bash
# Build React app
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://zlabs-web-prod/ --delete

# CloudFront distribution:
# - Origin: S3 bucket
# - Redirect HTTP to HTTPS
# - Error pages: 404 → /index.html (for React Router)
# - Custom domain: app.zlabs.com
```

#### Step 6 — SSL Certificates: AWS Certificate Manager (ACM)

```
1. Request a certificate for *.zlabs.com
2. Attach to CloudFront (frontend)
3. Attach to ALB (backend API)
```

#### Step 7 — Secrets: AWS Secrets Manager

```
Store these in Secrets Manager (never hardcode):
- SECRET_KEY
- DB_PASSWORD
- EMAIL_HOST_PASSWORD
- AWS_SECRET_ACCESS_KEY
```

---

## 12. Pre-Deployment Checklist & Improvements Required

### 12.1 Critical Security Fixes (MUST DO before going live)

| # | Issue | Fix |
|---|---|---|
| 1 | `CORS_ALLOW_ALL_ORIGINS = True` | Restrict to `CORS_ALLOWED_ORIGINS = ['https://app.zlabs.com']` |
| 2 | `SECRET_KEY` has insecure default | Generate a strong random key and store in Secrets Manager |
| 3 | `DEBUG = True` in dev | Ensure `DEBUG=False` and `ALLOWED_HOSTS=['api.zlabs.com']` in prod `.env` |
| 4 | SQLite in production | Switch to PostgreSQL via RDS |
| 5 | Media files on local disk | Move to S3 with `django-storages` |
| 6 | Email via dev console | Configure AWS SES for real email delivery |
| 7 | JWT tokens in localStorage | Consider `httpOnly` cookies for better XSS protection |
| 8 | No rate limiting on login | Implement `django-ratelimit` on `/api/auth/login/` |
| 9 | CORS middleware ordering | Ensure `CorsMiddleware` is first in `MIDDLEWARE` list |

### 12.2 Performance Improvements

| # | Improvement | Tool |
|---|---|---|
| 1 | Add database caching for analytics | Redis (ElastiCache) + `django-redis` |
| 2 | Background email sending | Celery + SQS (don't block requests with email) |
| 3 | API rate limiting | `djangorestframework-ratelimit` |
| 4 | DB query optimization | Add `select_related`/`prefetch_related` to all list views |
| 5 | Static file compression | WhiteNoise or serve via CloudFront |
| 6 | Pagination on all endpoints | Already partially implemented — ensure all list views add `?page=` |

### 12.3 Feature Improvements (Nice to Have)

| Priority | Feature | Value |
|---|---|---|
| High | Intern portal login page | Interns can login to view their own task history |
| High | Password Reset / "Forgot Password" | Currently missing for all roles |
| High | File type validation on uploads | Only allow PDF/Doc for resumes, PDF/Zip for submissions |
| Medium | Dashboard charts (Recharts/Chart.js) | Visual progress analytics |
| Medium | Notification bell in UI | In-app notification center |
| Medium | Round auto-advancement logic | Currently manual — could auto-advance on all tasks reviewed |
| Low | Dark/Light mode toggle | User preference saved in profile |
| Low | Bulk task import via CSV | For large intern cohorts |

### 12.4 Production Environment Variables (.env)

```ini
# Django
SECRET_KEY=<generate-with-python-c-"import-secrets;print(secrets.token_hex(50))">
DEBUG=False
ALLOWED_HOSTS=api.zlabs.com

# Database (RDS)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=zlabs_db
DB_USER=zlabs_admin
DB_PASSWORD=<strong-password>
DB_HOST=<rds-endpoint>.rds.amazonaws.com

# Email (SES)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=email-smtp.ap-south-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<ses-username>
EMAIL_HOST_PASSWORD=<ses-password>
DEFAULT_FROM_EMAIL=ZLabs Portal <noreply@zlabs.com>

# AWS S3
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_STORAGE_BUCKET_NAME=zlabs-media-prod
AWS_S3_REGION_NAME=ap-south-1

# Frontend
FRONTEND_URL=https://app.zlabs.com
```

---

*Documentation prepared for ZLabs Portal v2.0*  
*Architecture designed for secure, scalable AWS deployment*  
*Contact the development team for clarifications on any section above.*
