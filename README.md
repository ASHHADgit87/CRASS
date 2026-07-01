# CRASS — AI Code Review & Security Scanner

**CRASS** is a full-stack web application built with **React.js** and **Supabase** for AI-powered code review and security scanning. It enables developers to upload projects, receive AI-generated code suggestions, analyze security reports, monitor project analytics, and manage scans through a modern, responsive interface.

---

# Architecture

CRASS follows a **Multi-Tier Client–Server Architecture**, separating the frontend, backend services, database, and AI processing to ensure scalability and maintainability.

| Layer | Responsibility |
|---|---|
| Frontend | React application, dashboards, code review interface |
| Backend | Supabase services and application logic |
| Database | Project, scan, user, and AI suggestion storage |
| AI Layer | Code review and security analysis |

---

# SaaS

CRASS is designed as a **Software as a Service (SaaS)** platform, allowing authenticated users to upload projects, perform AI-assisted code reviews, analyze security reports, and manage development workflows entirely through the browser.

---

# Features

## Frontend

| Feature | Description |
|---|---|
| Dashboard | View project statistics, recent scans, and security scores |
| Project Management | Upload projects, import GitHub repositories, and manage scans |
| Code Review | Syntax-highlighted editor with AI-generated suggestions |
| Scan Reports | Review code quality, security issues, recommendations, and charts |
| Analytics Dashboard | Visualize project trends and security insights |
| Profile & Settings | Manage account information and UI preferences |
| Responsive UI | Optimized for desktop, tablet, and mobile devices |

---

## Backend & Data Layer

| Feature | Description |
|---|---|
| Users | Secure user management with access policies |
| Projects | Owner-based project storage |
| Scans | Scan history associated with individual projects |
| AI Suggestions | AI review results linked to project scans |
| Integration Ready | Forms, validation, and frontend prepared for Supabase integration |

---

# Key Functionality

| Capability | Description |
|---|---|
| Project Upload | Upload and manage multiple projects |
| AI Code Review | Receive intelligent code improvement suggestions |
| Security Scanning | Identify potential vulnerabilities |
| Status Indicators | Color-coded badges for scan results and severity |
| Analytics | Charts showing project quality and security trends |
| Modular Components | Reusable React components for scalability |

---

# Workflow

```text
Upload Project
       ↓
Start AI Scan
       ↓
Code Review
       ↓
Security Analysis
       ↓
Generate Report
       ↓
View Analytics
```

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Charts | Chart.js, react-chartjs-2 |
| Code Editor | Monaco Editor |
| Backend | Supabase |
| Routing | React Router |
| State Management | Modular React Components |

---

# Live Demo

https://crass-three.vercel.app/

---

# Creator & Developer

**Muhammad Ashhadullah Zaheer**

LinkedIn: https://www.linkedin.com/in/muhammad-ashhadullah-zaheer-41194a340/
