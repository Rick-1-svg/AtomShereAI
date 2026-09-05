#!/usr/bin/env node

const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

loadEnvFile(path.resolve(process.cwd(), '.env'));

const PORT = Number(process.env.API_PORT || 3001);
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash-lite-preview-09-2025';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_GEO_URL = 'https://api.openweathermap.org/geo/1.0';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent`;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (!process.env[key]) process.env[key] = value;
  }
}

function requireEnv(name, value) {
  if (!value) throw new Error(`${name} is not configured in .env`);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

async function proxyGet(response, targetUrl) {
  const upstreamResponse = await fetch(targetUrl);
  const body = await upstreamResponse.text();
  response.writeHead(upstreamResponse.status, {
    'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  response.end(body);
}

function openWeatherUrl(baseUrl, requestUrl, extraParams = {}) {
  requireEnv('OPENWEATHER_API_KEY', OPENWEATHER_API_KEY);
  const targetUrl = new URL(baseUrl);
  for (const [key, value] of requestUrl.searchParams) targetUrl.searchParams.set(key, value);
  for (const [key, value] of Object.entries(extraParams)) targetUrl.searchParams.set(key, value);
  targetUrl.searchParams.set('appid', OPENWEATHER_API_KEY);
  return targetUrl;
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    response.end();
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  try {
    if (request.method === 'GET' && requestUrl.pathname === '/health') {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/weather') {
      await proxyGet(response, openWeatherUrl(`${OPENWEATHER_BASE_URL}/weather`, requestUrl, { units: 'metric' }));
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/forecast') {
      await proxyGet(response, openWeatherUrl(`${OPENWEATHER_BASE_URL}/forecast`, requestUrl, { units: 'metric' }));
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/air-quality') {
      await proxyGet(response, openWeatherUrl(`${OPENWEATHER_BASE_URL}/air_pollution`, requestUrl));
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/geo/direct') {
      await proxyGet(response, openWeatherUrl(`${OPENWEATHER_GEO_URL}/direct`, requestUrl));
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/geo/reverse') {
      await proxyGet(response, openWeatherUrl(`${OPENWEATHER_GEO_URL}/reverse`, requestUrl));
      return;
    }

    if (request.method === 'POST' && requestUrl.pathname === '/gemini') {
      requireEnv('GEMINI_API_KEY', GEMINI_API_KEY);
      const { prompt } = await readJson(request);
      if (typeof prompt !== 'string' || !prompt.trim()) {
        sendJson(response, 400, { error: 'A prompt is required' });
        return;
      }

      const upstreamResponse = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      });
      const data = await upstreamResponse.json();
      if (!upstreamResponse.ok) {
        sendJson(response, upstreamResponse.status, data);
        return;
      }

      sendJson(response, 200, data);
      return;
    }

    sendJson(response, 404, { error: 'Route not found' });
  } catch (error) {
    console.error('API proxy error:', error);
    sendJson(response, 500, { error: error instanceof Error ? error.message : 'API proxy request failed' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API proxy listening on http://localhost:${PORT}`);
});
