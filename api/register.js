const { createRecord, TABLE_LOCAL, TABLE_OVERSEAS } = require('./lark.js');

function getPeriod(slots) {
  if (!slots || !slots.length) return null;
  const first = slots[0];
  if (typeof first === 'object' && first.periodId) {
    const pid = String(first.periodId);
    if (pid === 'p1' || pid === '1') return '第一期';
    if (pid === 'p2' || pid === '2') return '第二期';
    if (pid === 'p3' || pid === '3') return '第三期';
    if (pid === 'p4' || pid === '4') return '第四期';
    return null;
  }
  const str = typeof first === 'string' ? first : (first.day || '');
  const dayMatch = str.match(/(\d+)\/(\d+)/);
  if (!dayMatch) return null;
  const day = parseInt(dayMatch[2]);
  if (day <= 7) return '第一期';
  if (day <= 14) return '第二期';
  if (day <= 21) return '第三期';
  return '第四期';
}

function slotsToText(slots) {
  if (!slots || !slots.length) return '';
  return slots.map(function(s) {
    if (typeof s === 'string') return s;
    return (s.day || '') + '（' + (s.weekday || '') + '）' + (s.time || '');
  }).join('\n');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  const body = req.body;
  if (!body || !body.username || !body.track) return res.status(400).json({ ok: false, message: '缺少必填欄位' });

  try {
    const period = getPeriod(body.slots);
    const slotsText = slotsToText(body.slots);

    if (body.track === 'A') {
      const fields = { 'TikTok 使用者名稱': body.username, '申請時段': slotsText, '賽道': '本地流量', '審核狀態': '待審核' };
      if (body.videoUrl) fields['推薦推流短影片連結'] = body.videoUrl;
      if (period) fields['申請期數'] = period;
      const result = await createRecord(TABLE_LOCAL, fields);
      if (result.code !== 0) return res.status(500).json({ ok: false, message: result.msg || 'failed' });
      return res.status(200).json({ ok: true, record_id: result.data?.record?.record_id });
    } else {
      const fields = { 'TikTok 使用者名稱': body.username, '申請時段': slotsText, '賽道': '海外流量', '審核狀態': '待審核', '掃碼授權完成': body.overseasKycScanned === 'yes' ? '是' : '否', '願意與海外主播PK': body.overseasWillingPk === 'yes' ? '是' : '否', 'LIVE Studio 權限': body.overseasHasLiveStudio === 'yes' ? '是' : '否' };
      if (body.videoUrl) fields['推薦推流短影片連結'] = body.videoUrl;
      if (period) fields['申請期數'] = period;
      const result = await createRecord(TABLE_OVERSEAS, fields);
      if (result.code !== 0) return res.status(500).json({ ok: false, message: result.msg || 'failed' });
      return res.status(200).json({ ok: true, record_id: result.data?.record?.record_id });
    }
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ ok: false, message: '伺服器錯誤，請稍後再試' });
  }
};
