import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const app = express();
const PORT = 3001;

// Database setup
const adapter = new JSONFile('db.json');
const defaultData = { users: [], sheets: [], sheet_rows: [], sessions: [] };
const db = new Low(adapter, defaultData);

await db.read();
db.data = db.data || defaultData;
await db.write();

app.use(cors());
app.use(express.json());

// Mock user (simulates Google OAuth)
const MOCK_USER = {
  id: 'mock-user-123',
  email: 'dev@localhost.com',
  user_metadata: { 
    full_name: 'Dev User',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev'
  },
  provider_token: 'mock-google-token-abc123'
};

// ============= AUTH ENDPOINTS =============

// Mock OAuth - returns session instantly
app.post('/auth/v1/token', async (req, res) => {
  const { grant_type, provider, code } = req.body;
  
  if (grant_type === 'password' || provider === 'google') {
    const session = {
      access_token: 'mock-session-token-' + Date.now(),
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      user: MOCK_USER,
      provider_token: MOCK_USER.provider_token
    };
    
    db.data.sessions.push(session);
    await db.write();
    
    return res.json(session);
  }
  
  res.status(400).json({ error: 'Invalid grant type' });
});

// Get session
app.get('/auth/v1/user', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  res.json(MOCK_USER);
});

// Sign out
app.post('/auth/v1/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// ============= DATABASE ENDPOINTS =============

// Get all sheets for user
app.get('/rest/v1/sheets', async (req, res) => {
  await db.read();
  const sheets = db.data.sheets.filter(s => s.user_id === MOCK_USER.id);
  res.json(sheets);
});

// Create sheet
app.post('/rest/v1/sheets', async (req, res) => {
  await db.read();
  const sheet = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    user_id: MOCK_USER.id,
    ...req.body
  };
  db.data.sheets.push(sheet);
  await db.write();
  res.status(201).json(sheet);
});

// Delete sheet
app.delete('/rest/v1/sheets', async (req, res) => {
  const sheetId = req.query.id?.replace('eq.', '');
  await db.read();
  db.data.sheets = db.data.sheets.filter(s => s.id !== sheetId);
  db.data.sheet_rows = db.data.sheet_rows.filter(r => r.sheet_id !== sheetId);
  await db.write();
  res.status(204).send();
});

// Get sheet rows
app.get('/rest/v1/sheet_rows', async (req, res) => {
  await db.read();
  const sheetId = req.query.sheet_id?.replace('eq.', '');
  const rows = db.data.sheet_rows.filter(r => r.sheet_id === sheetId);
  res.json(rows);
});

// Create sheet row
app.post('/rest/v1/sheet_rows', async (req, res) => {
  await db.read();
  const row = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...req.body
  };
  db.data.sheet_rows.push(row);
  await db.write();
  res.status(201).json(row);
});

// Search rows (RPC call)
app.post('/rest/v1/rpc/search_sheet_rows', async (req, res) => {
  await db.read();
  const { search_term = '', filter_sheet_ids = [] } = req.body;
  
  let results = db.data.sheet_rows;
  
  // Filter by sheet IDs
  if (filter_sheet_ids.length > 0) {
    results = results.filter(r => filter_sheet_ids.includes(r.sheet_id));
  }
  
  // Search in row_json
  if (search_term) {
    const term = search_term.toLowerCase();
    results = results.filter(r => {
      const jsonStr = JSON.stringify(r.row_json).toLowerCase();
      return jsonStr.includes(term);
    });
  }
  
  // Join with sheets
  const enriched = results.map(row => {
    const sheet = db.data.sheets.find(s => s.id === row.sheet_id);
    return { ...row, sheets: sheet };
  });
  
  res.json(enriched);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'local-dev' });
});

app.listen(PORT, () => {
  console.log(`🚀 Local backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: server/db.json`);
  console.log(`👤 Mock user: ${MOCK_USER.email}`);
});
