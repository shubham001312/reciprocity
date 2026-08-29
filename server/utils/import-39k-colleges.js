import { col } from './db.js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const STATES_DIR = 'C:/Users/shubh/AppData/Local/Temp/indian-colleges-data/data/states';

// State slug to readable name
const STATE_MAP = {
  'andaman-and-nicobar-islands': 'Andaman & Nicobar Islands',
  'andhra-pradesh': 'Andhra Pradesh',
  'arunachal-pradesh': 'Arunachal Pradesh',
  'assam': 'Assam',
  'bihar': 'Bihar',
  'chandigarh': 'Chandigarh',
  'chhattisgarh': 'Chhattisgarh',
  'dadra-and-nagar-haveli': 'Dadra & Nagar Haveli',
  'daman-and-diu': 'Daman & Diu',
  'delhi': 'Delhi',
  'goa': 'Goa',
  'gujarat': 'Gujarat',
  'haryana': 'Haryana',
  'himachal-pradesh': 'Himachal Pradesh',
  'jammu-and-kashmir': 'Jammu & Kashmir',
  'jharkhand': 'Jharkhand',
  'karnataka': 'Karnataka',
  'kerala': 'Kerala',
  'madhya-pradesh': 'Madhya Pradesh',
  'maharashtra': 'Maharashtra',
  'manipur': 'Manipur',
  'meghalaya': 'Meghalaya',
  'mizoram': 'Mizoram',
  'nagaland': 'Nagaland',
  'odisha': 'Odisha',
  'puducherry': 'Puducherry',
  'punjab': 'Punjab',
  'rajasthan': 'Rajasthan',
  'sikkim': 'Sikkim',
  'tamil-nadu': 'Tamil Nadu',
  'telangana': 'Telangana',
  'tripura': 'Tripura',
  'uttar-pradesh': 'Uttar Pradesh',
  'uttarakhand': 'Uttarakhand',
  'west-bengal': 'West Bengal',
};

// Type mapping
const TYPE_MAP = {
  'Government': 'Government',
  'Govt aided': 'Government Aided',
  'Private-Self Financing': 'Private',
  'State Government University': 'State University',
  'State Private University': 'Private University',
  'Central University': 'Central University',
  'Deemed to be University(Govt)': 'Deemed University',
  'Deemed to be University(Pvt)': 'Deemed University',
};

// Generate a short code from name
function generateCode(name, idx) {
  // Try to get initials
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 1);
  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
  }
  return `COL${idx}`;
}

export async function importAICTEColleges() {
  const dir = col('college-directory');
  if (await dir.countDocuments() > 150) {
    console.log(`  ✓ College directory already has ${await dir.countDocuments()} entries — skipping import`);
    return;
  }

  // Gracefully skip if local data directory doesn't exist (e.g. on Render/cloud)
  if (!existsSync(STATES_DIR)) {
    console.log('  ⚠ AICTE data directory not found — skipping import (local dev only)');
    return;
  }

  const files = readdirSync(STATES_DIR).filter(f => f.endsWith('.json'));
  let totalImported = 0;
  const docs = [];

  for (const file of files) {
    const stateSlug = file.replace('.json', '');
    const stateName = STATE_MAP[stateSlug] || stateSlug;
    const colleges = JSON.parse(readFileSync(join(STATES_DIR, file), 'utf-8'));

    for (let i = 0; i < colleges.length; i++) {
      const c = colleges[i];
      const code = generateCode(c.institute_name, totalImported + i);
      const instType = TYPE_MAP[c.institution_type] || c.institution_type || 'Unknown';
      const streams = [];
      // Extract programmes if available
      if (c.programmes) {
        for (const prog of Object.values(c.programmes)) {
          if (prog.course_name) streams.push(prog.course_name);
        }
      }

      docs.push({
        _id: `dir-${c.aicte_id}`,
        name: c.institute_name,
        code: code,
        aicteId: c.aicte_id,
        state: stateName,
        district: c.district || '',
        city: c.district || '',
        address: c.address || '',
        type: instType,
        institutionType: c.institution_type || '',
        university: c.university || '',
        women: c.women === 'Y',
        minority: c.minority === 'Y',
        streams: streams.slice(0, 10),
        departments: streams.slice(0, 5),
        established: null,
        accreditation: 'AICTE Approved',
        affiliation: c.university || '',
        website: '',
        totalStudents: 0,
        totalFaculty: 0,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Insert in batches of 500
  for (let i = 0; i < docs.length; i += 500) {
    await dir.insertMany(docs.slice(i, i + 500));
  }

  totalImported = docs.length;

  console.log(`  ✓ Imported ${totalImported} AICTE colleges into directory (from state files with university + programmes data)`);
}
