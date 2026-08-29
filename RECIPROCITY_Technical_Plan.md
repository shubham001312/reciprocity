# RECIPROCITY — Complete Technical Project Plan

**Tagline:** Accountability • Analysis • Academic Growth

---

## 1. System Overview

RECIPROCITY is a full-stack web platform with three user roles — **Admin, Professor, Student** — connected through a shared academic database. It tracks classes, attendance, taught topics, question papers, and marks, then generates analytics (attendance-vs-performance, notes-vs-paper similarity).

### 1.1 Core Modules
| Module | Owner Role | Function |
|---|---|---|
| Auth & User Management | All | Login, logout, role-based access, session handling |
| Class Recording | Professor | Log each class: date, subject, topic, duration |
| Attendance | Professor | Mark present/absent per class, auto-calculate % |
| Notes/Topics Repository | Professor | Upload/tag topics covered |
| Question Paper Upload & Similarity | Professor/Admin | Upload paper, run NLP similarity vs notes |
| Marks Entry | Professor/Admin | Record student marks per subject/exam |
| Analytics Engine | System | Attendance-vs-performance, similarity scoring |
| Dashboards | All | Role-specific visual summaries |
| Reports | All | Export PDF/Excel semester reports |

---

## 2. Tech Stack

### 2.1 Recommended Stack (MERN-based — best for a solo/small-team academic project, huge community support, easy to demo)

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React.js (Vite) + Tailwind CSS | Fast dev, component reuse across 3 dashboards |
| **State Management** | Redux Toolkit / React Context | Auth state, role-based UI |
| **Backend** | Node.js + Express.js | REST API, easy JWT integration |
| **Database** | MongoDB (Mongoose ODM) | Flexible schema for varied academic records |
| **Auth** | JWT (access + refresh tokens) + bcrypt | Stateless, scalable, secure password hashing |
| **File Storage** | Multer + local/S3 (question papers, notes PDFs) | Handles uploads cleanly |
| **Similarity Engine** | Python microservice (FastAPI) using spaCy / scikit-learn (TF-IDF + cosine similarity) or Sentence-BERT | Text similarity is a Python-strength task; keep it as a separate service called via REST |
| **Charts/Analytics** | Chart.js or Recharts (frontend) | Dashboards, attendance vs marks graphs |
| **PDF Report Generation** | pdf-lib / Puppeteer (Node) | Auto-generate semester reports |
| **Hosting (Frontend)** | Vercel / Netlify | Free tier, CI/CD from GitHub |
| **Hosting (Backend)** | Render / Railway | Free/low-cost Node hosting |
| **Database Hosting** | MongoDB Atlas (free tier) | Cloud-hosted, no local DB management |
| **Version Control** | Git + GitHub | Standard for academic submission + portfolio |

### 2.2 Alternative Stack (if your college mandates SQL / Java, common in MAKAUT-affiliated syllabi)

| Layer | Technology |
|---|---|
| Frontend | React.js or plain HTML/CSS/JS + Bootstrap |
| Backend | Spring Boot (Java) or Django (Python) |
| Database | MySQL / PostgreSQL |
| Auth | Spring Security + JWT, or Django's built-in auth |
| Similarity Engine | Python (scikit-learn) — native if using Django |

> Since your specialization is AI, the **MERN + Python microservice** stack is the stronger portfolio choice: it shows full-stack ability plus a genuine ML/NLP component, which is exactly what recruiters look for in 2030-track AI/ML roles.

---

## 3. Authentication & Authorization System

### 3.1 Roles
- **Admin** — manages professors, students, subjects, oversees all data
- **Professor** — logs classes, attendance, notes, uploads question papers, enters marks
- **Student** — views own attendance, marks, performance reports (read-only)

### 3.2 Signup / Login Flow
1. **Signup**: Admin creates Professor and Student accounts (institutional control — prevents fake accounts). Optionally allow self-signup with college email domain verification (e.g., `@makaut.ac.in` or your college domain) + OTP verification.
2. **Login**:
   - Email/Roll-Number + Password
   - Backend validates via bcrypt hash comparison
   - On success: issue **JWT access token** (short-lived, ~15 min) + **refresh token** (long-lived, ~7 days, stored as httpOnly cookie)
   - Access token carries `role` claim used for route protection
3. **Session Handling**:
   - Access token sent in `Authorization: Bearer <token>` header on every API call
   - Refresh token silently renews access token via `/auth/refresh` endpoint
4. **Logout**:
   - Clear httpOnly refresh cookie
   - Blacklist current access token (Redis or in-memory set with TTL) to prevent reuse until natural expiry
   - Frontend clears Redux/local auth state and redirects to login

### 3.3 Security Measures
- Passwords hashed with **bcrypt** (salt rounds ≥ 10) — never store plaintext
- **Role-Based Access Control (RBAC)** middleware on every protected route
- Input validation via `express-validator` / `zod`
- Rate limiting on `/auth/login` (e.g., `express-rate-limit`) to block brute-force attempts
- HTTPS enforced in production
- CORS restricted to known frontend origin
- Forgot-password flow via time-limited email token (nodemailer + JWT)

### 3.4 Auth API Endpoints
```
POST   /api/auth/signup          — Admin-only: create professor/student
POST   /api/auth/login           — Returns access + refresh token
POST   /api/auth/refresh         — Issue new access token
POST   /api/auth/logout          — Invalidate session
POST   /api/auth/forgot-password — Send reset link
POST   /api/auth/reset-password  — Set new password
GET    /api/auth/me              — Return logged-in user profile
```

---

## 4. Database Schema (MongoDB / Mongoose)

```
User {
  _id, name, email, passwordHash, role: [admin|professor|student],
  rollNumber (student only), department, createdAt
}

Subject {
  _id, name, code, semester, department
}

ClassRecord {
  _id, professorId, subjectId, date, topic, duration,
  studentsPresentCount, createdAt
}

Attendance {
  _id, classRecordId, studentId, status: [present|absent]
}

Note {
  _id, professorId, subjectId, title, content/fileUrl, topicsCovered: [String], createdAt
}

QuestionPaper {
  _id, subjectId, semester, fileUrl, uploadedBy, uploadedAt
}

SimilarityReport {
  _id, questionPaperId, subjectId, similarityScore,
  matchedTopics: [String], unmatchedTopics: [String], generatedAt
}

Marks {
  _id, studentId, subjectId, examType, marksObtained, maxMarks
}

Report {
  _id, type, generatedFor, dateRange, fileUrl, generatedAt
}
```

---

## 5. High-Level Architecture

```
[React Frontend] 
      |  (REST calls, JWT in headers)
      v
[Node.js/Express API Gateway] --- [MongoDB Atlas]
      |
      v (internal REST call)
[Python FastAPI Similarity Microservice] --- (TF-IDF / Sentence-BERT model)
      |
      v
[File Storage: Multer -> local/S3]
```

- Frontend never talks to the Python service directly — always routed through the main Express API (keeps auth centralized).
- Similarity microservice is stateless: receives `{notesText, questionPaperText}`, returns `{score, matchedTopics}`.

---

## 6. Note–Question Paper Similarity — Implementation Approach

1. Extract text from uploaded PDFs (`pdf-parse` on Node side, or `PyPDF2`/`pdfplumber` on Python side).
2. Preprocess: lowercase, remove stopwords, lemmatize (spaCy).
3. Vectorize both texts (TF-IDF baseline; Sentence-BERT embeddings for a stronger semantic version — good for showing AI depth).
4. Compute cosine similarity → percentage score.
5. Extract matched/unmatched topics by comparing topic keyword lists against paper sentences.
6. Return structured JSON to backend, store in `SimilarityReport`.

This is the strongest "AI" component of your project — worth documenting well since it directly showcases your AI specialization.

---

## 7. Project Roadmap / Milestones

| Phase | Duration (suggested) | Deliverable |
|---|---|---|
| 1. Planning & DB design | Week 1–2 | Finalized schema, wireframes |
| 2. Auth system | Week 3 | Signup/login/logout, RBAC working |
| 3. Class & Attendance module | Week 4–5 | CRUD for classes/attendance |
| 4. Notes & Question Paper upload | Week 6 | File upload working |
| 5. Similarity microservice | Week 7–8 | Python service returning scores |
| 6. Marks & Performance analytics | Week 9 | Attendance-vs-marks comparison |
| 7. Dashboards (all 3 roles) | Week 10–11 | Charts, quick actions |
| 8. Report generation (PDF) | Week 12 | Downloadable semester reports |
| 9. Testing & deployment | Week 13 | Hosted on Vercel/Render, demo-ready |

---

## 8. Suggested Folder Structure

```
reciprocity/
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/ (Login, AdminDash, ProfDash, StudentDash)
│   │   ├── components/
│   │   ├── redux/ or context/
│   │   └── api/ (axios instance with interceptors)
├── server/                 # Node/Express backend
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/ (auth.js, roleCheck.js)
│   └── server.js
├── similarity-service/     # Python FastAPI
│   ├── main.py
│   └── model/
└── README.md
```

---

## 9. Why This Stack Fits You

Given your AI/ML specialization and 2030 AI/ML Engineering target, this project is well-suited as a portfolio piece because it forces you to build: JWT auth (backend fundamentals), a real NLP similarity pipeline (your specialization), and full CRUD + analytics dashboards (product-thinking). It's demoable end-to-end and defensible in a viva since every module maps to a concrete, explainable technical decision.
