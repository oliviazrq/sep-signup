// /api/my.js — Vercel Serverless Function
// Looks up signup records by TikTok username from Bitable

const { searchRecords, TABLE_LOCAL, TABLE_OVERSEAS } = require('./lark.js');

export default async function handler(req, res) {
  // CORS
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
    // Search both tables for this username
    const filter = `CurrentValue.[TikTok 使用者名稱] = "${username}"`;

    const [localRes, overseasRes] = await Promise.all([
      searchRecords(TABLE_LOCAL, filter),
      searchRecords(TABLE_OVERSEAS, filter),
    ]);

    const results = [];

    if (localRes.code === 0 && localRes.data?.items) {
      for (const item of localRes.data.items) {
        results.push({
          record_id: item.record_id,
          track: '本地流量',
          username: item.fields['TikTok 使用者名稱']?.[0]?.text || item.fields['TikTok 使用者名稱'] || '',
          videoUrl: item.fields['推薦推流短影片連結']?.[0]?.text || '',
          slots: item.fields['申請時段']?.[0]?.text || item.fields['申請時段'] || '',
          period: item.fields['申請期數'] || '',
          status: item.fields['審核狀態'] || '待審核',
          note: item.fields['審核備註']?.[0]?.text || item.fields['審核備註'] || '',
          createdAt: item.fields['提交時間'] || item.created_time,
        });
      }
    }

    if (overseasRes.code === 0 && overseasRes.data?.items) {
      for (const item of overseasRes.data.items) {
        results.push({
          record_id: item.record_id,
          track: '海外流量',
          username: item.fields['TikTok 使用者名稱']?.[0]?.text || item.fields['TikTok 使用者名稱'] || '',
          videoUrl: item.fields['推薦推流短影片連結']?.[0]?.text || '',
          slots: item.fields['申請時段']?.[0]?.text || item.fields['申請時段'] || '',
          period: item.fields['申請期數'] || '',
          status: item.fields['審核狀態'] || '待審核',
          pk: item.fields['願意與海外主播PK'] || '',
          kyc: item.fields['掃碼授權完成'] || '',
          liveStudio: item.fields['LIVE Studio 權限'] || '',
          note: item.fields['審核備註']?.[0]?.text || item.fields['審核備註'] || '',
          createdAt: item.fields['提交時間'] || item.created_time,
        });
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error('My records error:', err);
    return res.status(500).json({ ok: false, message: '查詢失敗，請稍後再試' });
  }
}
