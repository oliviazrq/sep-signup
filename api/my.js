const { larkRequest, BASE_TOKEN, TABLE_LOCAL, TABLE_OVERSEAS } = require('./lark.js');

function extractTextField(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(function(v) { return v.text || v; }).join('');
  return val.text || String(val);
}

async function searchByUsername(tableId, username) {
  return larkRequest('POST', '/open-apis/bitable/v1/apps/' + BASE_TOKEN + '/tables/' + tableId + '/records/search', {
    filter: { conjunction: "and", conditions: [{ field_name: "TikTok 使用者名稱", operator: "is", value: [username] }] },
    page_size: 20
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  const username = req.query.username;
  if (!username) return res.status(400).json({ ok: false, message: '請提供 username' });

  try {
    const [localRes, overseasRes] = await Promise.all([searchByUsername(TABLE_LOCAL, username), searchByUsername(TABLE_OVERSEAS, username)]);
    const results = [];

    if (localRes.code === 0 && localRes.data && localRes.data.items) {
      localRes.data.items.forEach(function(item) {
        results.push({ track: '本地流量', username: extractTextField(item.fields['TikTok 使用者名稱']), slots: extractTextField(item.fields['申請時段']), period: extractTextField(item.fields['申請期數']), status: extractTextField(item.fields['審核狀態']) });
      });
    }
    if (overseasRes.code === 0 && overseasRes.data && overseasRes.data.items) {
      overseasRes.data.items.forEach(function(item) {
        results.push({ track: '海外流量', username: extractTextField(item.fields['TikTok 使用者名稱']), slots: extractTextField(item.fields['申請時段']), period: extractTextField(item.fields['申請期數']), status: extractTextField(item.fields['審核狀態']) });
      });
    }
    return res.status(200).json(results);
  } catch (err) {
    console.error('My records error:', err);
    return res.status(500).json({ ok: false, message: '查詢失敗' });
  }
};
