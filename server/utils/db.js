import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

let client;
let db;
let useMongo = false;

// ─── JSON file helpers ───
function jsonGet(name) {
  const p = join(DATA_DIR, `${name}.json`);
  if (!existsSync(p)) { writeFileSync(p, '[]', 'utf-8'); return []; }
  return JSON.parse(readFileSync(p, 'utf-8'));
}
function jsonSet(name, data) {
  writeFileSync(join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Collection proxy (works for both MongoDB and JSON) ───
function jsonCol(name) {
  let data = jsonGet(name);
  return {
    find: (filter = {}) => ({
      sort: (sortSpec = {}) => ({
        toArray: () => {
          let result = filterData(data, filter);
          const sortKey = Object.keys(sortSpec)[0];
          if (sortKey) {
            const dir = sortSpec[sortKey];
            result.sort((a, b) => {
              if (a[sortKey] < b[sortKey]) return dir === -1 ? 1 : -1;
              if (a[sortKey] > b[sortKey]) return dir === 1 ? 1 : -1;
              return 0;
            });
          }
          return Promise.resolve(result);
        },
      }),
      project: () => ({
        toArray: () => Promise.resolve(filterData(data, filter).map(({ password, ...r }) => r)),
      }),
      toArray: () => Promise.resolve(filterData(data, filter)),
    }),
    findOne: (filter) => Promise.resolve(filterData(data, filter)[0] || null),
    countDocuments: (filter = {}) => Promise.resolve(filterData(data, filter).length),
    insertOne: (doc) => { data.push(doc); jsonSet(name, data); return Promise.resolve(); },
    insertMany: (docs) => { data.push(...docs); jsonSet(name, data); return Promise.resolve(); },
    updateOne: (filter, update) => {
      const idx = data.findIndex(d => matchFilter(d, filter));
      if (idx >= 0) {
        if (update.$set) Object.assign(data[idx], update.$set);
        jsonSet(name, data);
      }
      return Promise.resolve();
    },
    deleteOne: (filter) => {
      data = data.filter(d => !matchFilter(d, filter));
      jsonSet(name, data);
      return Promise.resolve();
    },
    deleteMany: (filter) => {
      data = data.filter(d => !matchFilter(d, filter));
      jsonSet(name, data);
      return Promise.resolve();
    },
    bulkWrite: (ops) => {
      for (const op of ops) {
        if (op.updateOne) {
          const f = op.updateOne.filter;
          const u = op.updateOne.update;
          let idx = data.findIndex(d => matchFilter(d, f));
          if (idx >= 0) {
            if (u.$set) Object.assign(data[idx], u.$set);
          } else if (op.updateOne.upsert) {
            const doc = { ...f };
            if (u.$set) Object.assign(doc, u.$set);
            if (u.$setOnInsert) Object.assign(doc, u.$setOnInsert);
            data.push(doc);
          }
        }
      }
      jsonSet(name, data);
      return Promise.resolve();
    },
  };
}

function filterData(data, filter) {
  if (!filter || Object.keys(filter).length === 0) return data;
  return data.filter(d => matchFilter(d, filter));
}

function matchFilter(doc, filter) {
  for (const [key, val] of Object.entries(filter)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val.$in) {
        if (!val.$in.includes(doc[key])) return false;
      } else {
        for (const [op, v] of Object.entries(val)) {
          if (op === '$in') { if (!v.includes(doc[key])) return false; }
          else if (op === '$gt') { if (!(doc[key] > v)) return false; }
          else if (op === '$lt') { if (!(doc[key] < v)) return false; }
        }
      }
    } else if (Array.isArray(val)) {
      if (!val.includes(doc[key])) return false;
    } else {
      if (doc[key] !== val) return false;
    }
  }
  return true;
}

// ─── Public col() function ───
export function col(name) {
  if (useMongo) return db.collection(name);
  return jsonCol(name);
}

// ─── SRV DNS resolver (fixes Windows Node.js SRV resolution) ───
import dns from 'dns';
import { promisify } from 'util';
const resolveSrv = promisify(dns.resolveSrv).bind(dns);

async function resolveSrvUri(uri) {
  // Extract hostname from mongodb+srv://user:pass@HOSTNAME/db
  const match = uri.match(/@([^/]+)/);
  if (!match) return uri;
  const hostname = match[1];
  try {
    const records = await resolveSrv('_mongodb._tcp.' + hostname);
    const hosts = records.map(r => r.name + ':' + r.port).join(',');
    return uri.replace('@' + hostname, '@' + hosts).replace('mongodb+srv://', 'mongodb://');
  } catch { return uri; }
}

// ─── Connect ───
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.log('  ⚠ No MONGODB_URI — using JSON file storage'); await seedDefaults(); return; }

  const opts = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: true,
  };

  // Try original URI first
  try {
    client = new MongoClient(uri, opts);
    await client.connect();
    db = client.db('reciprocity');
    useMongo = true;
    console.log('  ✓ Connected to MongoDB Atlas');
  } catch (err) {
    // SRV DNS often fails on Windows — try manual resolution
    if (uri.includes('mongodb+srv://')) {
      try {
        const directUri = await resolveSrvUri(uri);
        if (directUri !== uri) {
          console.log('  ⟳ SRV resolution failed, trying direct connection...');
          client = new MongoClient(directUri, opts);
          await client.connect();
          db = client.db('reciprocity');
          useMongo = true;
          console.log('  ✓ Connected to MongoDB Atlas (direct)');
        }
      } catch {
        useMongo = false;
      }
    }
    if (!useMongo) {
      console.log('  ⚠ MongoDB Atlas unavailable — using JSON file storage');
      console.log('    (' + err.message.substring(0, 80) + ')');
    }
  }
  await seedDefaults();
}

export async function closeDB() {
  if (client) await client.close();
}

// College directory seed
import { seedCollegeDirectory } from './seed-colleges.js';

// ─── Seed defaults ───
async function seedDefaults() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ─── Colleges ───
  const collegesCol = col('colleges');
  if (await collegesCol.countDocuments() === 0) {
    await collegesCol.insertMany([
      { _id: 'col-001', name: 'MAKAUT University', code: 'WBUT', established: 2001, address: 'Salt Lake, Kolkata, WB', website: 'https://makautexam.net', departments: ['Computer Science & Engineering', 'Electronics & Communication', 'Information Technology', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'], accreditation: 'NAAC A+', affiliation: 'Autonomous', totalStudents: 12400, totalFaculty: 340 },
      { _id: 'col-002', name: 'Jadavpur University', code: 'JU', established: 1955, address: '188 Raja S.C. Mallick Rd, Kolkata', website: 'https://jadavpuruniversity.in', departments: ['Computer Science & Engineering', 'Electronics & Telecommunication', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering'], accreditation: 'NAAC A++', affiliation: 'State University', totalStudents: 10200, totalFaculty: 290 },
      { _id: 'col-003', name: 'Calcutta University', code: 'CU', established: 1857, address: '87/1 College Street, Kolkata', website: 'https://caluniv.ac.in', departments: ['Computer Science', 'Electronics', 'Statistics', 'Mathematics', 'Physics', 'Chemistry'], accreditation: 'NAAC A+', affiliation: 'State University', totalStudents: 22000, totalFaculty: 580 },
      { _id: 'col-004', name: 'Presidency University', code: 'PRESI', established: 1817, address: '86/1 College Street, Kolkata', website: 'https://presiuniv.ac.in', departments: ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Economics'], accreditation: 'NAAC A', affiliation: 'State University', totalStudents: 4500, totalFaculty: 140 },
      { _id: 'col-005', name: 'Heritage Institute of Technology', code: 'HITECH', established: 2001, address: 'Chandpur, Kolkata, WB', website: 'https://heritageit.edu', departments: ['Computer Science & Engineering', 'Electronics & Communication', 'Information Technology', 'Biotechnology'], accreditation: 'NAAC A', affiliation: 'MAKAUT Affiliated', totalStudents: 5600, totalFaculty: 160 },
    ]);
    console.log('  ✓ Seeded colleges');
  }

  // ─── Users (expanded with year/section/stream) ───
  const usersCol = col('users');
  if (await usersCol.countDocuments() === 0) {
    await usersCol.insertMany([
      // Admin
      { _id: 'admin-001', name: 'Admin — CSE Dept.', email: 'admin@makaut.ac.in', password: hashedPassword, role: 'admin', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: null, section: null, stream: null, createdAt: '2026-01-01T00:00:00Z' },
      // Professors
      { _id: 'prof-001', name: 'Dr. A. Sengupta', email: 'sengupta@makaut.ac.in', password: hashedPassword, role: 'professor', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: null, section: null, stream: 'CSE', createdAt: '2026-01-15T00:00:00Z' },
      { _id: 'prof-002', name: 'Dr. R. Banerjee', email: 'banerjee@makaut.ac.in', password: hashedPassword, role: 'professor', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: null, section: null, stream: 'CSE', createdAt: '2026-01-15T00:00:00Z' },
      { _id: 'prof-003', name: 'Prof. M. Dutta', email: 'dutta@makaut.ac.in', password: hashedPassword, role: 'professor', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: null, section: null, stream: 'CSE', createdAt: '2026-02-01T00:00:00Z' },
      { _id: 'prof-004', name: 'Dr. S. Roy', email: 'roy@makaut.ac.in', password: hashedPassword, role: 'professor', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: null, section: null, stream: 'CSE', createdAt: '2026-02-01T00:00:00Z' },
      { _id: 'prof-005', name: 'Dr. P. Ghosh', email: 'ghosh@makaut.ac.in', password: hashedPassword, role: 'professor', department: 'Electronics & Communication', collegeId: 'col-001', collegeCode: 'WBUT', year: null, section: null, stream: 'ECE', createdAt: '2026-02-10T00:00:00Z' },
      { _id: 'prof-006', name: 'Prof. K. Mitra', email: 'mitra@makaut.ac.in', password: hashedPassword, role: 'professor', department: 'Information Technology', collegeId: 'col-001', collegeCode: 'WBUT', year: null, section: null, stream: 'IT', createdAt: '2026-02-10T00:00:00Z' },
      // Students — Year 3 (Semester 5-6)
      { _id: 'stud-001', name: 'Shubham R.', email: '2024CSE0142@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2024CSE0142', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 3, section: 'A', stream: 'CSE', semester: 5, createdAt: '2024-07-01T00:00:00Z' },
      { _id: 'stud-002', name: 'Priya M.', email: '2024CSE0089@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2024CSE0089', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 3, section: 'A', stream: 'CSE', semester: 5, createdAt: '2024-07-01T00:00:00Z' },
      { _id: 'stud-003', name: 'Arjun K.', email: '2024CSE0201@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2024CSE0201', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 3, section: 'B', stream: 'CSE', semester: 5, createdAt: '2024-07-01T00:00:00Z' },
      { _id: 'stud-004', name: 'Sneha D.', email: '2024CSE0156@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2024CSE0156', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 3, section: 'A', stream: 'CSE', semester: 5, createdAt: '2024-07-01T00:00:00Z' },
      { _id: 'stud-005', name: 'Rohit B.', email: '2024CSE0078@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2024CSE0078', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 3, section: 'B', stream: 'CSE', semester: 5, createdAt: '2024-07-01T00:00:00Z' },
      // Students — Year 2 (Semester 3-4)
      { _id: 'stud-006', name: 'Ananya S.', email: '2025CSE0034@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2025CSE0034', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 2, section: 'A', stream: 'CSE', semester: 3, createdAt: '2025-07-01T00:00:00Z' },
      { _id: 'stud-007', name: 'Vikram P.', email: '2025CSE0112@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2025CSE0112', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 2, section: 'A', stream: 'CSE', semester: 3, createdAt: '2025-07-01T00:00:00Z' },
      { _id: 'stud-008', name: 'Meera N.', email: '2025CSE0067@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2025CSE0067', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 2, section: 'B', stream: 'CSE', semester: 3, createdAt: '2025-07-01T00:00:00Z' },
      // Students — Year 1 (Semester 1-2)
      { _id: 'stud-009', name: 'Ravi T.', email: '2026CSE0023@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2026CSE0023', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 1, section: 'A', stream: 'CSE', semester: 1, createdAt: '2026-07-01T00:00:00Z' },
      { _id: 'stud-010', name: 'Deepa L.', email: '2026CSE0091@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2026CSE0091', department: 'Computer Science & Engineering', collegeId: 'col-001', collegeCode: 'WBUT', year: 1, section: 'A', stream: 'CSE', semester: 1, createdAt: '2026-07-01T00:00:00Z' },
      { _id: 'stud-011', name: 'Sourav G.', email: '2026ECE0045@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2026ECE0045', department: 'Electronics & Communication', collegeId: 'col-001', collegeCode: 'WBUT', year: 1, section: 'A', stream: 'ECE', semester: 1, createdAt: '2026-07-01T00:00:00Z' },
      { _id: 'stud-012', name: 'Nisha J.', email: '2025IT0078@makaut.ac.in', password: hashedPassword, role: 'student', rollNumber: '2025IT0078', department: 'Information Technology', collegeId: 'col-001', collegeCode: 'WBUT', year: 2, section: 'A', stream: 'IT', semester: 3, createdAt: '2025-07-01T00:00:00Z' },
      // Admin for IT dept
      { _id: 'admin-002', name: 'Admin — ECE Dept.', email: 'admin.ece@makaut.ac.in', password: hashedPassword, role: 'admin', department: 'Electronics & Communication', year: null, section: null, stream: 'ECE', createdAt: '2026-01-01T00:00:00Z' },
    ]);
    console.log('  ✓ Seeded users');
  }

  // ─── Subjects (expanded across all semesters) ───
  const subjectsCol = col('subjects');
  if (await subjectsCol.countDocuments() === 0) {
    await subjectsCol.insertMany([
      // Semester 1
      { _id: 'subj-001', name: 'Engineering Mathematics I', code: 'BMA101', semester: 1, department: 'CSE', professorId: 'prof-003', credits: 4, year: 1 },
      { _id: 'subj-002', name: 'Engineering Physics', code: 'BPH101', semester: 1, department: 'CSE', professorId: 'prof-005', credits: 3, year: 1 },
      { _id: 'subj-003', name: 'Basic Electrical Engineering', code: 'BEE101', semester: 1, department: 'CSE', professorId: 'prof-004', credits: 3, year: 1 },
      // Semester 2
      { _id: 'subj-004', name: 'Engineering Mathematics II', code: 'BMA201', semester: 2, department: 'CSE', professorId: 'prof-003', credits: 4, year: 1 },
      { _id: 'subj-005', name: 'Engineering Chemistry', code: 'BCH201', semester: 2, department: 'CSE', professorId: 'prof-005', credits: 3, year: 1 },
      // Semester 3
      { _id: 'subj-006', name: 'Data Structures & Algorithms', code: 'BCSE301', semester: 3, department: 'CSE', professorId: 'prof-001', credits: 4, year: 2 },
      { _id: 'subj-007', name: 'Computer Organization', code: 'BCSE302', semester: 3, department: 'CSE', professorId: 'prof-002', credits: 4, year: 2 },
      { _id: 'subj-008', name: 'Discrete Mathematics', code: 'BMA301', semester: 3, department: 'CSE', professorId: 'prof-003', credits: 3, year: 2 },
      { _id: 'subj-009', name: 'Analog & Digital Electronics', code: 'BCSE303', semester: 3, department: 'CSE', professorId: 'prof-004', credits: 4, year: 2 },
      { _id: 'subj-010', name: 'Economics for Engineers', code: 'BHM301', semester: 3, department: 'CSE', professorId: 'prof-003', credits: 3, year: 2 },
      // Semester 4
      { _id: 'subj-011', name: 'Operating Systems', code: 'BCSE401', semester: 4, department: 'CSE', professorId: 'prof-001', credits: 4, year: 2 },
      { _id: 'subj-012', name: 'Database Management Systems', code: 'BCSE402', semester: 4, department: 'CSE', professorId: 'prof-006', credits: 4, year: 2 },
      { _id: 'subj-013', name: 'Theory of Computation', code: 'BCSE403', semester: 4, department: 'CSE', professorId: 'prof-003', credits: 3, year: 2 },
      { _id: 'subj-014', name: 'Computer Networks', code: 'BCSE404', semester: 4, department: 'CSE', professorId: 'prof-002', credits: 4, year: 2 },
      // Semester 5
      { _id: 'subj-015', name: 'Design & Analysis of Algorithms', code: 'BCSE501', semester: 5, department: 'CSE', professorId: 'prof-001', credits: 4, year: 3 },
      { _id: 'subj-016', name: 'Software Engineering', code: 'BCSE502', semester: 5, department: 'CSE', professorId: 'prof-006', credits: 3, year: 3 },
      { _id: 'subj-017', name: 'Compiler Design', code: 'BCSE503', semester: 5, department: 'CSE', professorId: 'prof-003', credits: 4, year: 3 },
      { _id: 'subj-018', name: 'Machine Learning', code: 'BCSE504', semester: 5, department: 'CSE', professorId: 'prof-001', credits: 4, year: 3 },
      { _id: 'subj-019', name: 'Artificial Intelligence', code: 'BCSE505', semester: 5, department: 'CSE', professorId: 'prof-002', credits: 3, year: 3 },
      // Semester 6
      { _id: 'subj-020', name: 'Deep Learning', code: 'BCSE601', semester: 6, department: 'CSE', professorId: 'prof-001', credits: 4, year: 3 },
      { _id: 'subj-021', name: 'Cloud Computing', code: 'BCSE602', semester: 6, department: 'CSE', professorId: 'prof-006', credits: 3, year: 3 },
      { _id: 'subj-022', name: 'Cryptography & Network Security', code: 'BCSE603', semester: 6, department: 'CSE', professorId: 'prof-004', credits: 4, year: 3 },
      // Semester 7
      { _id: 'subj-023', name: 'Internet of Things', code: 'BCSE701', semester: 7, department: 'CSE', professorId: 'prof-004', credits: 3, year: 4 },
      { _id: 'subj-024', name: 'Blockchain Technology', code: 'BCSE702', semester: 7, department: 'CSE', professorId: 'prof-006', credits: 3, year: 4 },
      { _id: 'subj-025', name: 'Big Data Analytics', code: 'BCSE703', semester: 7, department: 'CSE', professorId: 'prof-001', credits: 4, year: 4 },
      // Semester 8
      { _id: 'subj-026', name: 'Project & Seminar', code: 'BCSE801', semester: 8, department: 'CSE', professorId: 'prof-001', credits: 10, year: 4 },
      // ECE subjects
      { _id: 'subj-027', name: 'Signals & Systems', code: 'BECE301', semester: 3, department: 'Electronics & Communication', professorId: 'prof-005', credits: 4, year: 2 },
      { _id: 'subj-028', name: 'Electromagnetic Theory', code: 'BECE302', semester: 3, department: 'Electronics & Communication', professorId: 'prof-005', credits: 3, year: 2 },
      // IT subjects
      { _id: 'subj-029', name: 'Web Technologies', code: 'BIT401', semester: 4, department: 'Information Technology', professorId: 'prof-006', credits: 4, year: 2 },
      { _id: 'subj-030', name: 'Information Security', code: 'BIT501', semester: 5, department: 'Information Technology', professorId: 'prof-006', credits: 3, year: 3 },
    ]);
    console.log('  ✓ Seeded subjects');
  }

  // ─── Syllabus (expanded) ───
  const syllabusCol = col('syllabus');
  if (await syllabusCol.countDocuments() === 0) {
    await syllabusCol.insertMany([
      { _id: 'syll-006', subjectId: 'subj-006', topics: ['Arrays & Linked Lists', 'Stacks & Queues', 'Trees (BST, AVL, Red-Black)', 'Graphs (BFS, DFS)', 'Sorting Algorithms', 'Searching Algorithms', 'Hashing', 'Greedy Algorithms', 'Dynamic Programming', 'Backtracking'] },
      { _id: 'syll-007', subjectId: 'subj-007', topics: ['Number Systems', 'CPU Architecture', 'Memory Hierarchy', 'I/O Organization', 'Assembly Language', 'Pipeline Processing', 'RISC vs CISC', 'Bus Architecture'] },
      { _id: 'syll-008', subjectId: 'subj-008', topics: ['Propositional Logic', 'Set Theory', 'Relations & Functions', 'Graph Theory', 'Combinatorics', 'Number Theory', 'Boolean Algebra', 'Trees & Lattices'] },
      { _id: 'syll-009', subjectId: 'subj-009', topics: ['Semiconductor Devices', 'Diode Circuits', 'Transistor Amplifiers', 'Logic Gates', 'Combinational Circuits', 'Sequential Circuits', 'Counters & Registers', 'A/D & D/A Conversion'] },
      { _id: 'syll-010', subjectId: 'subj-010', topics: ['Microeconomics', 'Macroeconomics', 'Market Structures', 'Game Theory', 'Public Finance', 'International Trade'] },
      { _id: 'syll-011', subjectId: 'subj-011', topics: ['Process Management', 'Memory Management', 'File Systems', 'I/O Systems', 'Deadlocks', 'CPU Scheduling', 'Virtual Memory', 'Multithreading'] },
      { _id: 'syll-012', subjectId: 'subj-012', topics: ['ER Model', 'Relational Algebra', 'SQL', 'Normalization', 'Transaction Management', 'Indexing', 'Hashing', 'Distributed Databases'] },
      { _id: 'syll-015', subjectId: 'subj-015', topics: ['Divide & Conquer', 'Greedy Methods', 'Dynamic Programming', 'Backtracking', 'Branch & Bound', 'Graph Algorithms', 'NP-Completeness', 'Approximation Algorithms'] },
      { _id: 'syll-016', subjectId: 'subj-016', topics: ['Software Development Life Cycle', 'Requirements Engineering', 'Design Patterns', 'UML Diagrams', 'Agile Methods', 'Testing', 'Project Management', 'DevOps'] },
      { _id: 'syll-018', subjectId: 'subj-018', topics: ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'Random Forests', 'SVM', 'Neural Networks', 'Clustering', 'Dimensionality Reduction'] },
      { _id: 'syll-027', subjectId: 'subj-027', topics: ['Continuous & Discrete Signals', 'Fourier Transform', 'Laplace Transform', 'Z-Transform', 'Convolution', 'Sampling Theorem', 'Filter Design'] },
    ]);
    console.log('  ✓ Seeded syllabus');
  }

  // ─── Classes (expanded with year/semester/section/stream) ───
  const classesCol = col('classes');
  if (await classesCol.countDocuments() === 0) {
    await classesCol.insertMany([
      // Year 3, Sem 5, Section A — DSA
      { _id: 'cls-001', professorId: 'prof-001', subjectId: 'subj-015', date: '2026-08-18', topic: 'Divide & Conquer Paradigm', duration: 55, studentsPresent: 41, totalStudents: 46, year: 3, semester: 5, section: 'A', stream: 'CSE' },
      { _id: 'cls-002', professorId: 'prof-001', subjectId: 'subj-015', date: '2026-08-20', topic: 'Greedy Algorithms', duration: 55, studentsPresent: 38, totalStudents: 46, year: 3, semester: 5, section: 'A', stream: 'CSE' },
      { _id: 'cls-003', professorId: 'prof-001', subjectId: 'subj-015', date: '2026-08-22', topic: 'Dynamic Programming', duration: 55, studentsPresent: 29, totalStudents: 46, year: 3, semester: 5, section: 'A', stream: 'CSE' },
      { _id: 'cls-004', professorId: 'prof-001', subjectId: 'subj-015', date: '2026-08-25', topic: 'Graph Algorithms — BFS/DFS', duration: 55, studentsPresent: 43, totalStudents: 46, year: 3, semester: 5, section: 'A', stream: 'CSE' },
      { _id: 'cls-005', professorId: 'prof-001', subjectId: 'subj-018', date: '2026-08-27', topic: 'Linear Regression', duration: 55, studentsPresent: 40, totalStudents: 46, year: 3, semester: 5, section: 'A', stream: 'CSE' },
      // Year 3, Sem 5, Section B — AI
      { _id: 'cls-013', professorId: 'prof-002', subjectId: 'subj-019', date: '2026-08-19', topic: 'Introduction to AI', duration: 55, studentsPresent: 39, totalStudents: 44, year: 3, semester: 5, section: 'B', stream: 'CSE' },
      { _id: 'cls-014', professorId: 'prof-002', subjectId: 'subj-019', date: '2026-08-21', topic: 'Search Algorithms', duration: 55, studentsPresent: 42, totalStudents: 44, year: 3, semester: 5, section: 'B', stream: 'CSE' },
      { _id: 'cls-015', professorId: 'prof-002', subjectId: 'subj-019', date: '2026-08-26', topic: 'Knowledge Representation', duration: 55, studentsPresent: 37, totalStudents: 44, year: 3, semester: 5, section: 'B', stream: 'CSE' },
      // Year 2, Sem 3, Section A — OS
      { _id: 'cls-006', professorId: 'prof-001', subjectId: 'subj-011', date: '2026-08-19', topic: 'Process Management', duration: 55, studentsPresent: 44, totalStudents: 50, year: 2, semester: 3, section: 'A', stream: 'CSE' },
      { _id: 'cls-007', professorId: 'prof-001', subjectId: 'subj-011', date: '2026-08-21', topic: 'CPU Scheduling', duration: 55, studentsPresent: 48, totalStudents: 50, year: 2, semester: 3, section: 'A', stream: 'CSE' },
      { _id: 'cls-008', professorId: 'prof-001', subjectId: 'subj-011', date: '2026-08-26', topic: 'Memory Management', duration: 55, studentsPresent: 42, totalStudents: 50, year: 2, semester: 3, section: 'A', stream: 'CSE' },
      // Year 2, Sem 3 — DBMS
      { _id: 'cls-009', professorId: 'prof-006', subjectId: 'subj-012', date: '2026-08-20', topic: 'ER Model', duration: 50, studentsPresent: 46, totalStudents: 50, year: 2, semester: 3, section: 'A', stream: 'CSE' },
      { _id: 'cls-010', professorId: 'prof-006', subjectId: 'subj-012', date: '2026-08-25', topic: 'Normalization', duration: 50, studentsPresent: 44, totalStudents: 50, year: 2, semester: 3, section: 'A', stream: 'CSE' },
      // Year 1, Sem 1
      { _id: 'cls-011', professorId: 'prof-003', subjectId: 'subj-001', date: '2026-08-18', topic: 'Matrices & Determinants', duration: 55, studentsPresent: 52, totalStudents: 56, year: 1, semester: 1, section: 'A', stream: 'CSE' },
      { _id: 'cls-012', professorId: 'prof-003', subjectId: 'subj-001', date: '2026-08-22', topic: 'Eigen Values', duration: 55, studentsPresent: 50, totalStudents: 56, year: 1, semester: 1, section: 'A', stream: 'CSE' },
      // ECE class
      { _id: 'cls-016', professorId: 'prof-005', subjectId: 'subj-027', date: '2026-08-20', topic: 'Fourier Series', duration: 55, studentsPresent: 35, totalStudents: 40, year: 2, semester: 3, section: 'A', stream: 'ECE' },
      { _id: 'cls-017', professorId: 'prof-005', subjectId: 'subj-027', date: '2026-08-25', topic: 'Laplace Transform', duration: 55, studentsPresent: 38, totalStudents: 40, year: 2, semester: 3, section: 'A', stream: 'ECE' },
    ]);
    console.log('  ✓ Seeded classes');
  }

  // ─── Attendance (expanded) ───
  const attendanceCol = col('attendance');
  if (await attendanceCol.countDocuments() === 0) {
    const allStudents = await usersCol.find({ role: 'student' }).toArray();
    const classes = await classesCol.find().toArray();
    const records = [];
    for (const cls of classes) {
      const sectionStudents = allStudents.filter(s => s.section === cls.section && s.year === cls.year && s.stream === cls.stream);
      for (const stu of sectionStudents) {
        records.push({ _id: `att-${cls._id}-${stu._id}`, classId: cls._id, studentId: stu._id, status: Math.random() > 0.12 ? 'present' : 'absent', date: cls.date, teacherConfirmed: Math.random() > 0.3, teacherConfirmedAt: Math.random() > 0.3 ? '2026-08-28T10:00:00Z' : null, studentConfirmed: Math.random() > 0.7, locked: false });
      }
    }
    await attendanceCol.insertMany(records);
    console.log('  ✓ Seeded attendance');
  }

  // ─── Marks (expanded) ───
  const marksCol = col('marks');
  if (await marksCol.countDocuments() === 0) {
    const allStudents = await usersCol.find({ role: 'student' }).toArray();
    const records = [];
    const semesters = [1, 3, 5];
    for (const sem of semesters) {
      const subsForSem = await subjectsCol.find({ semester: sem }).toArray();
      for (const stu of allStudents) {
        if (sem === 1 && stu.year !== 1) continue;
        if (sem === 3 && stu.year !== 2) continue;
        if (sem === 5 && stu.year !== 3) continue;
        for (const sub of subsForSem) {
          if (sub.department !== stu.department) continue;
          records.push({ _id: `mark-${stu._id}-${sub._id}-ia`, studentId: stu._id, subjectId: sub._id, examType: 'Internal Assessment', marksObtained: Math.floor(Math.random() * 30) + 20, maxMarks: 50, semester: sem });
          records.push({ _id: `mark-${stu._id}-${sub._id}-se`, studentId: stu._id, subjectId: sub._id, examType: 'Semester Exam', marksObtained: Math.floor(Math.random() * 50) + 30, maxMarks: 100, semester: sem });
        }
      }
    }
    await marksCol.insertMany(records);
    console.log('  ✓ Seeded marks');
  }

  // ─── Notes ───
  const notesCol = col('notes');
  if (await notesCol.countDocuments() === 0) {
    await notesCol.insertMany([
      { _id: 'note-001', professorId: 'prof-001', subjectId: 'subj-015', title: 'D&C Algorithm Notes', topicsCovered: ['Divide & Conquer', 'Merge Sort', 'Quick Sort'], createdAt: '2026-08-18T10:00:00Z' },
      { _id: 'note-002', professorId: 'prof-001', subjectId: 'subj-015', title: 'Greedy Algorithms Notes', topicsCovered: ['Huffman Coding', 'Kruskal', 'Prim'], createdAt: '2026-08-20T10:00:00Z' },
      { _id: 'note-003', professorId: 'prof-001', subjectId: 'subj-018', title: 'ML Basics', topicsCovered: ['Linear Regression', 'Gradient Descent'], createdAt: '2026-08-27T10:00:00Z' },
      { _id: 'note-004', professorId: 'prof-002', subjectId: 'subj-019', title: 'AI Introduction', topicsCovered: ['Agents', 'Search', 'Knowledge'], createdAt: '2026-08-19T10:00:00Z' },
      { _id: 'note-005', professorId: 'prof-006', subjectId: 'subj-012', title: 'DBMS Fundamentals', topicsCovered: ['ER Model', 'Normalization', 'SQL'], createdAt: '2026-08-20T10:00:00Z' },
      { _id: 'note-006', professorId: 'prof-003', subjectId: 'subj-001', title: 'Engineering Math I', topicsCovered: ['Matrices', 'Determinants', 'Eigen Values'], createdAt: '2026-08-18T10:00:00Z' },
      { _id: 'note-007', professorId: 'prof-005', subjectId: 'subj-027', title: 'Signals & Systems Notes', topicsCovered: ['Fourier', 'Laplace', 'Z-Transform'], createdAt: '2026-08-20T10:00:00Z' },
    ]);
    console.log('  ✓ Seeded notes');
  }

  // ─── Questions ───
  const questionsCol = col('questions');
  if (await questionsCol.countDocuments() === 0) {
    await questionsCol.insertMany([
      { _id: 'q-001', subjectId: 'subj-015', semester: 5, title: 'Mid-Term — DAA', uploadedBy: 'prof-001', topics: ['D&C', 'Greedy', 'DP', 'Graphs'], similarityScore: 78, uploadedAt: '2026-08-20T14:00:00Z' },
      { _id: 'q-002', subjectId: 'subj-019', semester: 5, title: 'Quiz — AI Basics', uploadedBy: 'prof-002', topics: ['Search', 'Agents', 'Knowledge'], similarityScore: 65, uploadedAt: '2026-08-22T14:00:00Z' },
      { _id: 'q-003', subjectId: 'subj-012', semester: 3, title: 'Mid-Term — DBMS', uploadedBy: 'prof-006', topics: ['ER', 'Normalization', 'SQL'], similarityScore: 82, uploadedAt: '2026-08-24T14:00:00Z' },
      { _id: 'q-004', subjectId: 'subj-011', semester: 3, title: 'Mid-Term — OS', uploadedBy: 'prof-001', topics: ['Process', 'Scheduling', 'Memory'], similarityScore: 71, uploadedAt: '2026-08-24T14:00:00Z' },
      { _id: 'q-005', subjectId: 'subj-001', semester: 1, title: 'Math I — Internal', uploadedBy: 'prof-003', topics: ['Matrices', 'Determinants'], similarityScore: 88, uploadedAt: '2026-08-26T14:00:00Z' },
    ]);
    console.log('  ✓ Seeded question papers');
  }

  // ─── Notices ───
  const noticesCol = col('notices');
  if (await noticesCol.countDocuments() === 0) {
    await noticesCol.insertMany([
      { _id: 'ntc-001', title: 'Semester 5 Mid-Term Schedule', content: 'Mid-term examinations for Semester 5 will begin from September 15, 2026. Please check the detailed schedule on the notice board.', category: 'exam', priority: 'high', authorId: 'admin-001', authorRole: 'admin', createdAt: '2026-08-25T09:00:00Z', readBy: [] },
      { _id: 'ntc-002', title: 'Guest Lecture on AI/ML', content: 'Dr. Rajesh Kumar from IIT Delhi will deliver a guest lecture on "Recent Trends in Artificial Intelligence" on September 5, 2026 at 2:00 PM in Seminar Hall.', category: 'event', priority: 'normal', authorId: 'prof-001', authorRole: 'professor', createdAt: '2026-08-26T10:00:00Z', readBy: [] },
      { _id: 'ntc-003', title: 'Attendance Policy Update', content: 'Minimum 75% attendance is mandatory for end-semester examination eligibility. Students below 75% will be detained from appearing in exams.', category: 'general', priority: 'high', authorId: 'admin-001', authorRole: 'admin', createdAt: '2026-08-27T08:00:00Z', readBy: [] },
      { _id: 'ntc-004', title: 'Annual Day Celebration', content: 'The annual day celebration will be held on October 10, 2026. Cultural programs, prize distribution, and guest lectures are planned.', category: 'event', priority: 'normal', authorId: 'admin-001', authorRole: 'admin', createdAt: '2026-08-28T11:00:00Z', readBy: [] },
      { _id: 'ntc-005', title: 'Lab Practical Schedule', content: 'All lab practical examinations for odd semester will be conducted during the last week of November. Students should prepare their lab records.', category: 'exam', priority: 'normal', authorId: 'prof-002', authorRole: 'professor', createdAt: '2026-08-28T14:00:00Z', readBy: [] },
    ]);
    console.log('  ✓ Seeded notices');
  }

  // ─── Messages ───
  const messagesCol = col('messages');
  if (await messagesCol.countDocuments() === 0) {
    await messagesCol.insertMany([
      { _id: 'msg-001', from: 'prof-001', to: 'stud-001', content: 'Hello Shubham, your DAA assignment is excellent. Keep up the good work!', read: true, createdAt: '2026-08-25T10:00:00Z' },
      { _id: 'msg-002', from: 'stud-001', to: 'prof-001', content: 'Thank you, Professor! I have a doubt about the DP assignment. Can I visit during office hours?', read: true, createdAt: '2026-08-25T11:30:00Z' },
      { _id: 'msg-003', from: 'prof-001', to: 'stud-001', content: 'Sure, come tomorrow between 3-4 PM. We can discuss the knapsack problem approach.', read: false, createdAt: '2026-08-25T14:00:00Z' },
      { _id: 'msg-004', from: 'admin-001', to: 'prof-001', content: 'Dear Dr. Sengupta, please submit the mid-term question papers by September 10.', read: true, createdAt: '2026-08-26T09:00:00Z' },
      { _id: 'msg-005', from: 'prof-002', to: 'stud-003', content: 'Arjun, your AI project proposal needs more detail on the implementation approach.', read: false, createdAt: '2026-08-27T15:00:00Z' },
    ]);
    console.log('  ✓ Seeded messages');
  }

  // Seed college directory
  await seedCollegeDirectory();

  // Import 39k+ AICTE colleges
  const { importAICTEColleges } = await import('./import-39k-colleges.js');
  await importAICTEColleges();
}
