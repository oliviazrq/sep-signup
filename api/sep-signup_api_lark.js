// /api/lark.js — Shared Lark/Feishu Bitable API helper
// Environment variables needed in Vercel:
//   LARK_APP_ID, LARK_APP_SECRET
//   LARK_API_BASE (optional, defaults to https://open.larksuite.com)

const LARK_API_BASE = process.env.LARK_API_BASE || 'https://open.larksuite.com';
const BASE_TOKEN = 'JJXAbiln8aKvZEsFjGkltBgHgre';
const TABLE_LOCAL = 'tblAk5bFBenUGZNp';   // 本地流量
const TABLE_OVERSEAS = 'tblrNBVmEjBTlrTp'; // 海外流量

let cachedToken = null;
let tokenExpiry = 0;

async function getTenantAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${LARK_API_BASE}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET,
    }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Lark auth failed: ${data.msg}`);
  cachedToken = data.tenant_access_token;
  tokenExpiry = Date.now() + (data.expire - 60) * 1000; // refresh 60s before expiry
  return cachedToken;
}

async function larkRequest(method, path, body = null) {
  const token = await getTenantAccessToken();
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${LARK_API_BASE}${path}`, opts);
  return res.json();
}

// Create a record in specified table
async function createRecord(tableId, fields) {
  return larkRequest('POST',
    `/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records`,
    { fields }
  );
}

// Search records by filter
async function searchRecords(tableId, filter = '', sort = [], pageSize = 100, pageToken = '') {
  const body = { page_size: pageSize };
  if (filter) body.filter = filter;
  if (sort.length) body.sort = sort;
  if (pageToken) body.page_token = pageToken;
  return larkRequest('POST',
    `/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records/search`,
    body
  );
}

// List records (simple GET with pagination)
async function listRecords(tableId, pageSize = 100, pageToken = '') {
  let path = `/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records?page_size=${pageSize}`;
  if (pageToken) path += `&page_token=${pageToken}`;
  return larkRequest('GET', path);
}

// Update a record
async function updateRecord(tableId, recordId, fields) {
  return larkRequest('PUT',
    `/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records/${recordId}`,
    { fields }
  );
}

// Get a single record
async function getRecord(tableId, recordId) {
  return larkRequest('GET',
    `/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records/${recordId}`
  );
}

module.exports = {
  LARK_API_BASE,
  BASE_TOKEN,
  TABLE_LOCAL,
  TABLE_OVERSEAS,
  getTenantAccessToken,
  larkRequest,
  createRecord,
  searchRecords,
  listRecords,
  updateRecord,
  getRecord,
};
