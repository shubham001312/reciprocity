# Graph Report - RECIPROCITY  (2026-08-29)

## Corpus Check
- Corpus is ~3,634 words - fits in a single context window. You may not need a graph.

## Summary
- 51 nodes · 54 edges · 13 communities (7 shown, 6 thin omitted)
- Extraction: 74% EXTRACTED · 26% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Data Models & Sample Data
- Admin & Role Management
- Student Analytics & Marks
- Authentication & Security
- Professor Dashboard & Attendance
- NLP Similarity Pipeline
- System Architecture & Stack
- Charts & Visualization
- Deployment & Hosting
- Project Structure
- File Upload Handling
- PDF Report Generation
- State Management

## God Nodes (most connected - your core abstractions)
1. `MongoDB (Mongoose)` - 9 edges
2. `Notes-Paper Similarity Analysis` - 8 edges
3. `RECIPROCITY` - 7 edges
4. `Authentication System` - 6 edges
5. `Professor Dashboard` - 6 edges
6. `Role-Based Access Control (RBAC)` - 5 edges
7. `Analytics Engine` - 4 edges
8. `Attendance vs Marks Bar Chart` - 4 edges
9. `User Model` - 3 edges
10. `Python FastAPI Microservice` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Professor Role` --conceptually_related_to--> `Professor Dashboard`  [INFERRED]
  RECIPROCITY_Technical_Plan.md → RECIPROCITY_demo_DESIGN.html
- `Notes-Paper Similarity Analysis` --conceptually_related_to--> `Similarity Seal (Visual Score)`  [INFERRED]
  RECIPROCITY_Technical_Plan.md → RECIPROCITY_demo_DESIGN.html
- `Analytics Engine` --semantically_similar_to--> `Attendance vs Marks Bar Chart`  [INFERRED] [semantically similar]
  RECIPROCITY_Technical_Plan.md → RECIPROCITY_demo_DESIGN.html
- `Authentication System` --conceptually_related_to--> `Login Modal`  [INFERRED]
  RECIPROCITY_Technical_Plan.md → RECIPROCITY_demo_DESIGN.html
- `Role-Based Access Control (RBAC)` --conceptually_related_to--> `Role Tab Switcher`  [INFERRED]
  RECIPROCITY_Technical_Plan.md → RECIPROCITY_demo_DESIGN.html

## Hyperedges (group relationships)
- **NLP Similarity Analysis Pipeline** — reciprocity_technical_plan_md_notes_paper_similarity, reciprocity_technical_plan_md_tfidf, reciprocity_technical_plan_md_cosine_similarity, reciprocity_technical_plan_md_spacy, reciprocity_technical_plan_md_sentence_bert, reciprocity_technical_plan_md_fastapi [EXTRACTED 1.00]
- **Authentication & Security Stack** — reciprocity_technical_plan_md_auth_system, reciprocity_technical_plan_md_jwt_auth, reciprocity_technical_plan_md_rbac, reciprocity_technical_plan_md_bcrypt, reciprocity_technical_plan_md_jwt [EXTRACTED 1.00]
- **Demo UI Role Views** — reciprocity_demo_design_html_professor_dashboard, reciprocity_demo_design_html_student_dashboard, reciprocity_demo_design_html_admin_dashboard, reciprocity_demo_design_html_role_switcher, reciprocity_demo_design_html_login_modal [EXTRACTED 1.00]

## Communities (13 total, 6 thin omitted)

### Community 0 - "Data Models & Sample Data"
Cohesion: 0.20
Nodes (10): DSA (BCSE301), Prof. A. Sengupta, Shubham R. (Student), ClassRecord Model, MongoDB (Mongoose), Note Model, QuestionPaper Model, SimilarityReport Model (+2 more)

### Community 1 - "Admin & Role Management"
Cohesion: 0.29
Nodes (7): Admin Dashboard, Faculty Summary Table, Role Tab Switcher, Stat Register Row, Admin Role, Professor Role, Role-Based Access Control (RBAC)

### Community 2 - "Student Analytics & Marks"
Cohesion: 0.33
Nodes (7): Attendance vs Marks Bar Chart, Subject-wise Marks Table, Student Dashboard, Analytics Engine, Attendance-vs-Performance Analysis, Marks Model, Student Role

### Community 3 - "Authentication & Security"
Cohesion: 0.33
Nodes (6): Login Modal, Authentication System, bcrypt Password Hashing, Institutional Signup Rationale, JSON Web Token (JWT), JWT Authentication

### Community 4 - "Professor Dashboard & Attendance"
Cohesion: 0.40
Nodes (5): Attendance Register (Ledger), Professor Dashboard, Similarity Seal (Visual Score), Attendance Model, React.js (Vite)

### Community 5 - "NLP Similarity Pipeline"
Cohesion: 0.40
Nodes (5): Cosine Similarity, Notes-Paper Similarity Analysis, Sentence-BERT, spaCy NLP, TF-IDF Vectorization

### Community 6 - "System Architecture & Stack"
Cohesion: 0.40
Nodes (5): Python FastAPI Microservice, Similarity Microservice Design Rationale, Node.js + Express, Portfolio Design Rationale, RECIPROCITY

## Knowledge Gaps
- **22 isolated node(s):** `ClassRecord Model`, `Note Model`, `QuestionPaper Model`, `TF-IDF Vectorization`, `Cosine Similarity` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RECIPROCITY` connect `System Architecture & Stack` to `Data Models & Sample Data`, `Student Analytics & Marks`, `Authentication & Security`, `Professor Dashboard & Attendance`?**
  _High betweenness centrality (0.337) - this node is a cross-community bridge._
- **Why does `MongoDB (Mongoose)` connect `Data Models & Sample Data` to `Student Analytics & Marks`, `Professor Dashboard & Attendance`, `System Architecture & Stack`?**
  _High betweenness centrality (0.321) - this node is a cross-community bridge._
- **Why does `Authentication System` connect `Authentication & Security` to `Admin & Role Management`, `System Architecture & Stack`?**
  _High betweenness centrality (0.239) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Professor Dashboard` (e.g. with `Professor Role` and `React.js (Vite)`) actually correct?**
  _`Professor Dashboard` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ClassRecord Model`, `Note Model`, `QuestionPaper Model` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._