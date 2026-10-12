import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || 'gpt-6-astra';
const buckets = new Map();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

async function readJson(req, limit = 12_000) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > limit) throw new Error('Request too large.');
  }
  return JSON.parse(body || '{}');
}

function rateLimited(key) {
  const now = Date.now();
  const entry = buckets.get(key) || { start: now, count: 0 };
  if (now - entry.start > 60_000) { entry.start = now; entry.count = 0; }
  entry.count++;
  buckets.set(key, entry);
  return entry.count > 20;
}

async function coach(req, res) {
  const ip = req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) return send(res, 429, { error: 'You’ve sent several messages. Please wait a minute and try again.' });
  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: 'Please send a valid, short chat message.' }); }
  const language = body.language === 'Hindi' ? 'Hindi' : 'English';
  const lesson = String(body.lesson || 'French basics').slice(0, 160);
  const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  const input = messages
    .filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
  if (!input.length || input.at(-1).role !== 'user') return send(res, 400, { error: 'Write a question or sentence first.' });
  if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'The AI coach is not connected yet. Add OPENAI_API_KEY to the server environment and restart the site.' });

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        instructions: `You are a warm, precise French language tutor for a school website. Teach French from beginner through advanced. Explain in ${language}; include French examples with English glosses when helpful. The learner is studying: ${lesson}. Correct mistakes gently and explain one useful reason. For conversation practice, ask one natural follow-up at a time. Keep responses concise, structured, and age-appropriate. Do not claim to assess spoken pronunciation from text.`,
        input,
        max_output_tokens: 550
      }),
      signal: AbortSignal.timeout(30_000)
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = upstream.status === 401 ? 'The AI key was rejected. Check the server’s OPENAI_API_KEY.' : 'The AI service could not answer just now. Please try again.';
      console.error('AI provider error:', upstream.status, result.error?.message || 'No details');
      return send(res, 502, { error: message });
    }
    const reply = result.output_text || result.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
    if (!reply) return send(res, 502, { error: 'The AI returned an empty reply. Please try again.' });
    return send(res, 200, { reply });
  } catch (error) {
    console.error('AI coach request failed:', error.message);
    return send(res, 502, { error: 'The AI service could not be reached. Please try again in a moment.' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health') return send(res, 200, { ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
  if (url.pathname === '/api/coach' && req.method === 'POST') return coach(req, res);
  if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'API route not found.' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  let requested;
  try { requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname); }
  catch { return send(res, 400, { error: 'Invalid path.' }); }
  const file = path.resolve(root, `.${requested}`);
  if (!file.startsWith(root + path.sep)) return send(res, 403, { error: 'Forbidden.' });
  try {
    const info = await stat(file);
    if (!info.isFile()) return send(res, 404, { error: 'Not found.' });
    const data = await readFile(file);
    return send(res, 200, data, mime[path.extname(file)] || 'application/octet-stream');
  } catch { return send(res, 404, { error: 'Not found.' }); }
});

server.listen(port, () => console.log(`L’Académie du Français is running at http://localhost:${port}`));
