import http from 'node:http';
import { AgendaService, NotFoundError } from './services/agenda-service.js';
import { ValidationError } from './domain/meeting.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    ...CORS_HEADERS
  });
  res.end(json);
}

export function sendNoContent(res) {
  res.writeHead(204, CORS_HEADERS);
  res.end();
}

export async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        // 1MB limit
        reject(new ValidationError('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch {
        reject(new ValidationError('Invalid JSON body'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export function createRequestHandler({ agendaService }) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;
      const method = req.method.toUpperCase();

      if (method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        return res.end();
      }

      // Meeting Routes
      const meetingIdMatch = pathname.match(/^\/api\/meetings\/([^/]+)$/);

      // GET /api/meetings
      if (method === 'GET' && pathname === '/api/meetings') {
        const date = url.searchParams.get('date') || undefined;
        const meetings = agendaService.getMeetingsByDate(date);
        return sendJson(res, 200, meetings);
      }

      // POST /api/meetings
      if (method === 'POST' && pathname === '/api/meetings') {
        const body = await readJsonBody(req);
        const meeting = agendaService.createMeeting(body);
        return sendJson(res, 201, { meeting });
      }

      // PUT /api/meetings/:id
      if (method === 'PUT' && meetingIdMatch) {
        const id = decodeURIComponent(meetingIdMatch[1]);
        const body = await readJsonBody(req);
        const meeting = agendaService.updateMeeting(id, body);
        return sendJson(res, 200, { meeting });
      }

      // DELETE /api/meetings/:id
      if (method === 'DELETE' && meetingIdMatch) {
        const id = decodeURIComponent(meetingIdMatch[1]);
        agendaService.deleteMeeting(id);
        return sendNoContent(res);
      }

      // 404 Route Not Found
      return sendJson(res, 404, { error: `Route not found: ${method} ${pathname}` });
    } catch (err) {
      if (err instanceof ValidationError) {
        return sendJson(res, 400, { error: err.message });
      }
      if (err instanceof NotFoundError) {
        return sendJson(res, 404, { error: err.message });
      }
      console.error('Unhandled request error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  };
}

export function createApp({ db, config = {} } = {}) {
  const agendaService = new AgendaService(db);
  const handler = createRequestHandler({ agendaService, config });
  const server = http.createServer(handler);
  server.agendaService = agendaService;
  return server;
}
