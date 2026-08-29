// /api/lark.js — Shared Lark/Feishu Bitable API helper
const LARK_API_BASE = process.env.LARK_API_BASE || 'https://open.larksuite.com';
const BASE_TOKEN = 'JJXAbiln8aKvZEsFjGkltBgHgre';
const TABLE_LOCAL = 'tblAk5bFBenUGZNp';
const TABLE_OVERSEAS = 'tblrNBVmEjBTlrTp';

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
  tokenExpiry = Date.now() + (data.expire - 60) * 1000;
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

async function createRecord(tableId, fields) {
  return larkRequest('POST',
    `/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records`,
    { fields }
  );
}

async function searchRecords(tableId, filter, sort, pageSize, pageToken) {
  const body = { page_size: pageSize || 100 };
  if (filter) body.filter = filter;
  if (sort && sort.length) body.sort = sort;
  if (pageToken) body.page_token = pageToken;
  return larkRequest('POST',
    `/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records/search`,
    body
  );
}

module.exports = {
  LARK_API_BASE, BASE_TOKEN, TABLE_LOCAL, TABLE_OVERSEAS,
  getTenantAccessToken, larkRequest, createRecord, searchRecords,
};
