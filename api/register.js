// /api/register.js — Vercel Serverless Function
// Stores signup records in Vercel KV or falls back to in-memory (demo)

const records = [];

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const body = req.body;
  if (!body || !body.username || !body.track) {
    return res.status(400).json({ ok: false, message: '缺少必填欄位' });
  }

  const record = {
    username: body.username,
    videoUrl: body.videoUrl || '',
    track: body.track === 'A' ? '賽道 A｜本地流量' : '賽道 B｜海外流量',
    slots: body.slots || [],
    participatedAug: body.participatedAug || null,
    overseasKycScanned: body.overseasKycScanned || null,
    overseasWillingPk: body.overseasWillingPk || null,
    overseasHasLiveStudio: body.overseasHasLiveStudio || null,
    status: '待審核',
    createdAt: new Date().toISOString(),
  };

  records.push(record);

  return res.status(200).json({ ok: true, record });
}
