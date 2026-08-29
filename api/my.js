// /api/my.js — Vercel Serverless Function
// Looks up signup records by TikTok username from Bitable

const { larkRequest, BASE_TOKEN, TABLE_LOCAL, TABLE_OVERSEAS } = require('./lark.js');

function extractTextField(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(function(v) { return v.text || v; }).join('');
  if (val.text) return val.text;
  return String(val);
}

async function searchByUsername(tableId, username) {
  const body = {
    filter: {
      conjunction: "and",
      conditions: [{
        field_name: "TikTok 使用者名稱",
        operator: "is",
        value: [username]
      }]
    },
    page_size: 20
  };
  return larkRequest('POST',
    `/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records/search`,
    body
  );
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ ok: false, message: '請提供 username' });
  }

  try {
    const [localRes, overseasRes] = await Promise.all([
      searchByUsername(TABLE_LOCAL, username),
      searchByUsername(TABLE_OVERSEAS, username),
    ]);

    const results = [];

    if (localRes.code === 0 && localRes.data?.items) {
      for (const item of localRes.data.items) {
        results.push({
          record_id: item.record_id,
          track: '本地流量',
          username: extractTextField(item.fields['TikTok 使用者名稱']),
          videoUrl: extractTextField(item.fields['推薦推流短影片連結']),
          slots: extractTextField(item.fields['申請時段']),
          period: extractTextField(item.fields['申請期數']),
          status: extractTextField(item.fields['審核狀態']),
          createdAt: item.fields['提交時間'] || '',
        });
      }
    }

    if (overseasRes.code === 0 && overseasRes.data?.items) {
      for (const item of overseasRes.data.items) {
        results.push({
          record_id: item.record_id,
          track: '海外流量',
          username: extractTextField(item.fields['TikTok 使用者名稱']),
          videoUrl: extractTextField(item.fields['推薦推流短影片連結']),
          slots: extractTextField(item.fields['申請時段']),
          period: extractTextField(item.fields['申請期數']),
          status: extractTextField(item.fields['審核狀態']),
          createdAt: item.fields['提交時間'] || '',
        });
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error('My records error:', err);
    return res.status(500).json({ ok: false, message: '查詢失敗，請稍後再試' });
  }
};
