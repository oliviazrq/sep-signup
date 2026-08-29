// /api/my.js — Vercel Serverless Function
// Looks up signup records by username

const records = [];

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ ok: false, message: '請提供 username' });
  }

  const normalized = username.toLowerCase();
  const matches = records.filter(
    (r) => r.username && r.username.toLowerCase() === normalized
  );

  return res.status(200).json(matches);
}
