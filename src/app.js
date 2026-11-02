import http from 'node:http';
import { AgendaService, NotFoundError } from './services/agenda-service.js';
import { TaskService } from './services/task-service.js';
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

export function createRequestHandler({ agendaService, taskService }) {
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

      // Task Routes
      const taskIdMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);

      // GET /api/tasks
      if (method === 'GET' && pathname === '/api/tasks') {
        const date = url.searchParams.get('date') || undefined;
        const status = url.searchParams.get('status') || undefined;
        const priority = url.searchParams.get('priority') || undefined;
        const isFocus = url.searchParams.has('isFocus')
          ? url.searchParams.get('isFocus') === 'true'
          : undefined;

        const tasks = taskService.getTasksByDate(date, { status, priority, isFocus });
        return sendJson(res, 200, tasks);
      }

      // POST /api/tasks
      if (method === 'POST' && pathname === '/api/tasks') {
        const body = await readJsonBody(req);
        const task = taskService.createTask(body);
        return sendJson(res, 201, { task });
      }

      // PATCH /api/tasks/:id
      if (method === 'PATCH' && taskIdMatch) {
        const id = decodeURIComponent(taskIdMatch[1]);
        const body = await readJsonBody(req);
        const task = taskService.updateTask(id, body);
        return sendJson(res, 200, { task });
      }

      // DELETE /api/tasks/:id
      if (method === 'DELETE' && taskIdMatch) {
        const id = decodeURIComponent(taskIdMatch[1]);
        taskService.deleteTask(id);
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
  const taskService = new TaskService(db);
  const handler = createRequestHandler({ agendaService, taskService, config });
  const server = http.createServer(handler);
  server.agendaService = agendaService;
  server.taskService = taskService;
  return server;
}
