import { spawn } from 'node:child_process';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const uploadDirectory = join(projectRoot, 'public', 'uploads');
const galleryFile = join(uploadDirectory, 'gallery.json');
const settingsFile = join(uploadDirectory, 'settings.json');
const defaultSettings = {
  phoneNumber: '+33 7 81 73 85 58',
  whatsappNumber: '+33 7 81 73 85 58',
  emailAddress: 'Pricekaty85@gmail.com',
  studioAddress: '1 Allée du Pastel, 79200 Parthenay, France',
  studioCity: 'Parthenay',
  instagramHref: 'https://www.instagram.com/katypricenailsstudio/',
  facebookHref: 'https://www.facebook.com/share/p/19ops8VaGG/',
  servicePrices: { 'shade-match': '', 'classic-manicure': '', 'nail-design': '', 'nail-care': '' },
};
const outputDirectory = join(projectRoot, 'dist');
const sessionCookieName = 'pns_admin';
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const maxImageBytes = 8 * 1024 * 1024;
const maxJsonBytes = 12 * 1024 * 1024;
const sessions = new Map();
const loginFailures = new Map();

function loadLocalEnvironment() {
  const envFile = join(projectRoot, '.env');
  if (!existsSync(envFile)) return;

  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const entry = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!entry || entry[1] in process.env) continue;
    const value = entry[2].replace(/^(['"])(.*)\1$/, '$2');
    process.env[entry[1]] = value;
  }
}

loadLocalEnvironment();
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword || adminPassword.length < 16) {
  throw new Error('Set ADMIN_PASSWORD (at least 16 characters) in the private .env file or server environment.');
}
const expectedPasswordHash = createHash('sha256').update(adminPassword).digest();

function sendJson(response, statusCode, data, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  response.end(JSON.stringify(data));
}

async function readJson(request, limit = 64 * 1024) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > limit) throw Object.assign(new Error('Request is too large.'), { statusCode: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON.'), { statusCode: 400 });
  }
}

async function readGallery() {
  try {
    const gallery = JSON.parse(await readFile(galleryFile, 'utf8'));
    return Array.isArray(gallery) ? gallery : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeGallery(gallery) {
  const temporaryFile = `${galleryFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(gallery, null, 2), 'utf8');
  await rename(temporaryFile, galleryFile);
}

async function readSettings() {
  try {
    const value = JSON.parse(await readFile(settingsFile, 'utf8'));
    return {
      ...defaultSettings,
      ...value,
      servicePrices: { ...defaultSettings.servicePrices, ...(value.servicePrices ?? {}) },
    };
  } catch (error) {
    if (error.code === 'ENOENT') return defaultSettings;
    throw error;
  }
}

async function writeSettings(settings) {
  const temporaryFile = `${settingsFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(settings, null, 2), 'utf8');
  await rename(temporaryFile, settingsFile);
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validSocialUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function readCookie(request, name) {
  const prefix = `${name}=`;
  const cookie = (request.headers.cookie ?? '').split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

function getSession(request) {
  const token = readCookie(request, sessionCookieName);
  const expiresAt = sessions.get(token);
  if (!token || !expiresAt || expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return token;
}

function isRateLimited(ip) {
  const entry = loginFailures.get(ip);
  if (!entry) return false;
  if (entry.startedAt + 15 * 60 * 1000 < Date.now()) {
    loginFailures.delete(ip);
    return false;
  }
  return entry.count >= 8;
}

function recordLoginFailure(ip) {
  const entry = loginFailures.get(ip);
  if (!entry || entry.startedAt + 15 * 60 * 1000 < Date.now()) {
    loginFailures.set(ip, { count: 1, startedAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

function imageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', extension: '.jpg' };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { mime: 'image/png', extension: '.png' };
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', extension: '.webp' };
  return null;
}

async function handleApi(request, response) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return false;

  try {
    if (request.method === 'GET' && url.pathname === '/api/gallery') {
      sendJson(response, 200, await readGallery());
      return true;
    }

    if (request.method === 'GET' && url.pathname === '/api/settings') {
      sendJson(response, 200, await readSettings());
      return true;
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/session') {
      sendJson(response, 200, { authenticated: Boolean(getSession(request)) });
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/login') {
      const ip = request.socket.remoteAddress ?? 'unknown';
      if (isRateLimited(ip)) {
        sendJson(response, 429, { error: 'Слишком много попыток. Подождите 15 минут и попробуйте снова.' });
        return true;
      }
      const body = await readJson(request, 4096);
      const candidate = typeof body.password === 'string' ? body.password : '';
      const candidateHash = createHash('sha256').update(candidate).digest();
      if (!timingSafeEqual(candidateHash, expectedPasswordHash)) {
        recordLoginFailure(ip);
        sendJson(response, 401, { error: 'Неверный пароль.' });
        return true;
      }
      loginFailures.delete(ip);
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, Date.now() + sessionLifetimeMs);
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      sendJson(response, 200, { authenticated: true }, {
        'Set-Cookie': `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionLifetimeMs / 1000}${secure}`,
      });
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/logout') {
      sessions.delete(getSession(request));
      sendJson(response, 200, { authenticated: false }, {
        'Set-Cookie': `${sessionCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
      });
      return true;
    }

    if (request.method === 'PUT' && url.pathname === '/api/admin/settings') {
      if (!getSession(request)) {
        sendJson(response, 401, { error: 'Сначала войдите в админ-панель.' });
        return true;
      }
      const body = await readJson(request, 32 * 1024);
      const settings = {
        phoneNumber: cleanText(body.phoneNumber, 40),
        whatsappNumber: cleanText(body.whatsappNumber, 40),
        emailAddress: cleanText(body.emailAddress, 160),
        studioAddress: cleanText(body.studioAddress, 200),
        studioCity: cleanText(body.studioCity, 80),
        instagramHref: cleanText(body.instagramHref, 500),
        facebookHref: cleanText(body.facebookHref, 500),
        servicePrices: {},
      };
      const priceKeys = Object.keys(defaultSettings.servicePrices);
      for (const key of priceKeys) settings.servicePrices[key] = cleanText(body.servicePrices?.[key], 40);
      const invalidEmail = settings.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.emailAddress);
      if (invalidEmail || !validSocialUrl(settings.instagramHref) || !validSocialUrl(settings.facebookHref)) {
        sendJson(response, 400, { error: 'Проверьте адрес электронной почты и ссылки на соцсети.' });
        return true;
      }
      await writeSettings(settings);
      sendJson(response, 200, settings);
      return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/photos') {
      if (!getSession(request)) {
        sendJson(response, 401, { error: 'Сначала войдите в админ-панель.' });
        return true;
      }
      const body = await readJson(request, maxJsonBytes);
      const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : '';
      const description = typeof body.description === 'string' ? body.description.trim().slice(0, 240) : '';
      const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
      const match = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!title || !match) {
        sendJson(response, 400, { error: 'Добавьте название и выберите JPG, PNG или WebP.' });
        return true;
      }
      const bytes = Buffer.from(match[2], 'base64');
      const detectedType = imageType(bytes);
      if (bytes.length > maxImageBytes) {
        sendJson(response, 413, { error: 'Размер фотографии не должен превышать 8 МБ.' });
        return true;
      }
      if (!detectedType || detectedType.mime !== `image/${match[1]}`) {
        sendJson(response, 400, { error: 'Файл повреждён или его формат не поддерживается.' });
        return true;
      }
      const gallery = await readGallery();
      if (gallery.length >= 300) {
        sendJson(response, 409, { error: 'В галерее достигнут лимит в 300 загруженных фотографий.' });
        return true;
      }
      const id = randomUUID();
      const filename = `${id}${detectedType.extension}`;
      const imagePath = join(uploadDirectory, filename);
      await writeFile(imagePath, bytes, { flag: 'wx' });
      const photo = {
        id,
        title,
        description,
        image: `/uploads/${filename}`,
        categoryKey: 'storyCare',
        uploadedAt: new Date().toISOString(),
      };
      try {
        await writeGallery([...gallery, photo]);
      } catch (error) {
        await unlink(imagePath).catch(() => {});
        throw error;
      }
      sendJson(response, 201, photo);
      return true;
    }

    const deleteMatch = url.pathname.match(/^\/api\/admin\/photos\/([0-9a-f-]{36})$/i);
    if (request.method === 'DELETE' && deleteMatch) {
      if (!getSession(request)) {
        sendJson(response, 401, { error: 'Сначала войдите в админ-панель.' });
        return true;
      }
      const gallery = await readGallery();
      const photo = gallery.find((item) => item.id === deleteMatch[1]);
      if (!photo) {
        sendJson(response, 404, { error: 'Фотография не найдена.' });
        return true;
      }
      await writeGallery(gallery.filter((item) => item.id !== photo.id));
      const filename = photo.image?.startsWith('/uploads/') ? photo.image.slice('/uploads/'.length) : '';
      if (filename && !filename.includes('/') && !filename.includes('\\')) await unlink(join(uploadDirectory, filename)).catch(() => {});
      sendJson(response, 200, { deleted: true });
      return true;
    }

    sendJson(response, 404, { error: 'API route not found.' });
    return true;
  } catch (error) {
    sendJson(response, error.statusCode ?? 500, { error: error.statusCode ? error.message : 'Ошибка сервера.' });
    return true;
  }
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
};

function resolveInside(directory, relativePath) {
  const resolved = resolve(directory, relativePath);
  return resolved === directory || resolved.startsWith(`${directory}${sep}`) ? resolved : null;
}

async function serveStatic(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }
  const servingUpload = pathname.startsWith('/uploads/');
  const directory = servingUpload ? uploadDirectory : outputDirectory;
  const relativePath = servingUpload ? pathname.slice('/uploads/'.length) : pathname.replace(/^\/+/, '');
  let filePath = resolveInside(directory, relativePath || 'index.html');
  if (!filePath) {
    response.writeHead(400);
    response.end();
    return;
  }
  try {
    let info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = join(filePath, 'index.html');
      info = await stat(filePath);
    }
  } catch {
    if (servingUpload || extname(pathname)) {
      response.writeHead(404);
      response.end();
      return;
    }
    filePath = join(outputDirectory, 'index.html');
    try {
      await stat(filePath);
    } catch {
      response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Build the website with npm run build before starting the production server.');
      return;
    }
  }
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': servingUpload ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
}

async function ensureStorage() {
  await mkdir(uploadDirectory, { recursive: true });
  if (!existsSync(galleryFile)) await writeFile(galleryFile, '[]', 'utf8');
  if (!existsSync(settingsFile)) await writeFile(settingsFile, JSON.stringify(defaultSettings, null, 2), 'utf8');
}

function listen(server, port, host) {
  return new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(port, host, () => {
      server.removeListener('error', rejectListen);
      resolveListen();
    });
  });
}

async function startDevelopment() {
  await ensureStorage();
  const apiPort = Number(process.env.API_PORT ?? 3001);
  const apiServer = createServer((request, response) => {
    handleApi(request, response).then((handled) => {
      if (!handled) {
        sendJson(response, 404, { error: 'API route not found.' });
      }
    }).catch(() => sendJson(response, 500, { error: 'Ошибка сервера.' }));
  });
  await listen(apiServer, apiPort, '127.0.0.1');

  const vitePath = join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const viteProcess = spawn(process.execPath, [vitePath, '--host', process.env.HOST ?? '127.0.0.1', '--port', process.env.PORT ?? '5173'], {
    cwd: projectRoot,
    env: { ...process.env, API_PORT: String(apiPort) },
    stdio: 'inherit',
  });
  console.log(`Admin API is ready on port ${apiPort}.`);

  const closeServers = () => {
    viteProcess.kill();
    apiServer.close();
  };
  process.on('SIGINT', closeServers);
  process.on('SIGTERM', closeServers);
  viteProcess.on('exit', (code) => {
    apiServer.close();
    process.exitCode = code ?? 0;
  });
}

async function startProduction() {
  await ensureStorage();
  if (!existsSync(join(outputDirectory, 'index.html'))) throw new Error('Run npm run build before starting the production server.');
  const server = createServer((request, response) => {
    handleApi(request, response).then((handled) => handled || serveStatic(request, response)).catch(() => {
      if (!response.headersSent) sendJson(response, 500, { error: 'Ошибка сервера.' });
      else response.destroy();
    });
  });
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? '0.0.0.0';
  await listen(server, port, host);
  console.log(`Price Nails Studio is available on port ${port}; admin: /admin`);
}

if (process.argv.includes('--dev')) await startDevelopment();
else await startProduction();
