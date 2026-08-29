import { Router } from 'express';
import { col } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

const router = Router();

// POST /api/college-register — College registers itself (one admin per college)
router.post('/', async (req, res) => {
  try {
    const { collegeName, collegeCode, email, password, name, department, established, address, website, accreditation, affiliation, streams } = req.body;

    if (!collegeName || !collegeCode || !email || !password || !name) {
      return res.status(400).json({ error: 'College name, code, admin email, password, and admin name are required' });
    }

    // Check if college code already exists
    const existingCollege = await col('colleges').findOne({ code: collegeCode.toUpperCase() });
    if (existingCollege) return res.status(409).json({ error: 'College with this code is already registered' });

    // Check if admin email already exists
    const existingUser = await col('users').findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email already registered' });

    // Check if any user already has this collegeCode as admin
    const existingAdmin = await col('users').findOne({ collegeCode: collegeCode.toUpperCase(), role: 'admin' });
    if (existingAdmin) {
      return res.status(409).json({ error: `This college already has an admin (${existingAdmin.name}). Contact them to get access.` });
    }

    // Create college
    const collegeId = `col-${uuid().substring(0, 8)}`;
    const college = {
      _id: collegeId,
      name: collegeName,
      code: collegeCode.toUpperCase(),
      established: established ? parseInt(established) : null,
      address: address || '',
      website: website || '',
      departments: department ? [department] : [],
      streams: streams ? streams.split(',').map(s => s.trim()) : [],
      accreditation: accreditation || 'Pending',
      affiliation: affiliation || '',
      totalStudents: 0,
      totalFaculty: 0,
      createdAt: new Date().toISOString(),
    };

    // Create admin user for this college
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminId = `adm-${uuid().substring(0, 8)}`;
    const adminUser = {
      _id: adminId,
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      department: department || '',
      collegeId,
      collegeCode: collegeCode.toUpperCase(),
      year: null,
      section: null,
      stream: null,
      createdAt: new Date().toISOString(),
    };

    await col('colleges').insertOne(college);
    await col('users').insertOne(adminUser);

    // Generate token and return
    const jwt = (await import('jsonwebtoken')).default;
    const JWT_SECRET = process.env.JWT_SECRET || 'reciprocity-secret-key-2026';
    const token = jwt.sign({ id: adminId, email, role: 'admin', name }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, _id, ...rest } = adminUser;
    res.status(201).json({
      message: 'College registered successfully',
      college: { id: collegeId, name: collegeName, code: collegeCode.toUpperCase() },
      user: { id: _id, ...rest },
      token,
    });
  } catch (err) {
    console.error('College registration error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// GET /api/college-register/unregistered — Stats
router.get('/unregistered', async (req, res) => {
  const allColleges = await col('college-directory').find().toArray();
  const registered = await col('colleges').find().toArray();
  const admins = await col('users').find({ role: 'admin' }).toArray();
  const registeredCodes = new Set(registered.map(c => c.code));
  const adminCollegeCodes = new Set(admins.filter(a => a.collegeCode).map(a => a.collegeCode));
  const unregistered = allColleges.filter(c => !adminCollegeCodes.has(c.code));
  res.json({ total: allColleges.length, registered: adminCollegeCodes.size, unregistered: unregistered.length });
});

// GET /api/college-register/directory — Search directory with pagination
router.get('/directory', async (req, res) => {
  const { q, state, type, university, page = 1, limit = 24, registered } = req.query;
  let colleges = await col('college-directory').find().toArray();
  const admins = await col('users').find({ role: 'admin' }).toArray();
  const registeredColleges = await col('colleges').find().toArray();
  const adminMap = {};
  admins.forEach(a => { if (a.collegeCode) adminMap[a.collegeCode] = a.name; });
  const regCodeSet = new Set(registeredColleges.map(c => c.code));

  // Enrich with admin + registered status
  let enriched = colleges.map(c => ({
    ...c,
    hasAdmin: !!adminMap[c.code],
    adminName: adminMap[c.code] || null,
    isRegistered: regCodeSet.has(c.code),
  }));

  // Filters
  if (q) {
    const query = q.toLowerCase();
    enriched = enriched.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.code?.toLowerCase().includes(query) ||
      c.state?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query) ||
      c.district?.toLowerCase().includes(query) ||
      c.university?.toLowerCase().includes(query)
    );
  }
  if (state) enriched = enriched.filter(c => c.state?.toLowerCase() === state.toLowerCase());
  if (type) enriched = enriched.filter(c => c.type?.toLowerCase() === type.toLowerCase());
  if (university) enriched = enriched.filter(c => c.university?.toLowerCase().includes(university.toLowerCase()));
  if (registered === 'true') enriched = enriched.filter(c => c.isRegistered);
  if (registered === 'false') enriched = enriched.filter(c => !c.isRegistered);

  const total = enriched.length;
  const pg = Math.max(1, parseInt(page));
  const lim = Math.min(100, Math.max(1, parseInt(limit) || 24));
  const totalPages = Math.ceil(total / lim);
  const offset = (pg - 1) * lim;

  res.json({
    colleges: enriched.slice(offset, offset + lim),
    total,
    page: pg,
    totalPages,
    limit: lim,
  });
});

// GET /api/college-register/states — List all states
router.get('/states', async (req, res) => {
  const colleges = await col('college-directory').find().toArray();
  const states = [...new Set(colleges.map(c => c.state).filter(Boolean))].sort();
  res.json(states);
});

// GET /api/college-register/map-data — State-wise clustering for map view
router.get('/map-data', async (req, res) => {
  const colleges = await col('college-directory').find().toArray();
  const registered = await col('colleges').find().toArray();
  const admins = await col('users').find({ role: 'admin' }).toArray();
  const adminMap = {};
  admins.forEach(a => { if (a.collegeCode) adminMap[a.collegeCode] = a.name; });
  const regCodeSet = new Set(registered.map(c => c.code));

  // State centroids for India (approximate lat/lng)
  const stateCoords = {
    'Andhra Pradesh': [15.91, 79.74], 'Arunachal Pradesh': [28.22, 97.50], 'Assam': [26.20, 92.94],
    'Bihar': [25.10, 85.31], 'Chhattisgarh': [21.27, 81.87], 'Goa': [15.40, 74.00],
    'Gujarat': [22.26, 71.19], 'Haryana': [29.06, 76.09], 'Himachal Pradesh': [31.10, 77.17],
    'Jharkhand': [23.61, 85.28], 'Karnataka': [15.32, 75.71], 'Kerala': [10.85, 76.27],
    'Madhya Pradesh': [22.97, 78.66], 'Maharashtra': [19.75, 75.71], 'Manipur': [24.66, 93.91],
    'Meghalaya': [25.47, 91.37], 'Mizoram': [23.16, 92.94], 'Nagaland': [26.16, 94.56],
    'Odisha': [20.95, 85.10], 'Punjab': [31.15, 75.34], 'Rajasthan': [27.02, 74.22],
    'Sikkim': [27.53, 88.51], 'Tamil Nadu': [11.13, 78.66], 'Telangana': [18.11, 79.02],
    'Tripura': [23.94, 91.99], 'Uttar Pradesh': [26.85, 80.91], 'Uttarakhand': [30.07, 79.02],
    'West Bengal': [22.99, 87.75], 'Delhi': [28.61, 77.21], 'Jammu & Kashmir': [33.78, 76.58],
    'Ladakh': [34.15, 77.58], 'Chandigarh': [30.73, 76.78], 'Puducherry': [11.94, 79.81],
    'Andaman & Nicobar Islands': [11.74, 92.72], 'Lakshadweep': [10.57, 72.64],
    'Dadra and Nagar Haveli': [20.18, 73.01], 'Daman and Diu': [20.43, 72.85],
  };

  // Group by state
  const stateMap = {};
  colleges.forEach(c => {
    const st = c.state || 'Unknown';
    if (!stateMap[st]) stateMap[st] = { state: st, count: 0, registered: 0, types: {} };
    stateMap[st].count++;
    if (regCodeSet.has(c.code)) stateMap[st].registered++;
    const t = c.type || 'Other';
    stateMap[st].types[t] = (stateMap[st].types[t] || 0) + 1;
  });

  const markers = Object.values(stateMap).map(s => ({
    ...s,
    lat: (stateCoords[s.state] || [20.59, 78.96])[0],
    lng: (stateCoords[s.state] || [20.59, 78.96])[1],
    topTypes: Object.entries(s.types).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count })),
  }));

  res.json(markers);
});

export default router;
