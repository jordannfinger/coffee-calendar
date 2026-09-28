import { createServer } from "node:http";

const userId = "00000000-0000-4000-8000-000000000001";
const origin = "http://127.0.0.1:3100";
let coffees = [];
let pendingEmail = null;

function user() {
  return {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    is_anonymous: true,
    app_metadata: { provider: "anonymous", providers: ["anonymous"] },
    user_metadata: {},
    identities: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function session() {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", exp: now + 3600 })).toString("base64url");
  return {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
    refresh_token: "mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user: user(),
  };
}

function respond(res, status, body, headers = {}) {
  res.writeHead(status, {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization,apikey,content-type,x-client-info,x-supabase-api-version,prefer,accept-profile,content-profile",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-expose-headers": "content-range",
    "content-type": "application/json",
    ...headers,
  });
  res.end(body === null ? "" : JSON.stringify(body));
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:45217");
  if (req.method === "OPTIONS") return respond(res, 204, null);
  if (url.pathname === "/health") return respond(res, 200, { ok: true });
  if (url.pathname === "/__reset" && req.method === "POST") {
    coffees = [];
    pendingEmail = null;
    return respond(res, 200, { ok: true });
  }
  if (url.pathname === "/__state") {
    return respond(res, 200, { userId, pendingEmail, coffees: coffees.map(({ id, name }) => ({ id, name })) });
  }
  if (url.pathname === "/auth/v1/signup" && req.method === "POST") return respond(res, 200, session());
  if (url.pathname === "/auth/v1/token" && req.method === "POST") return respond(res, 200, session());
  if (url.pathname === "/auth/v1/user" && req.method === "GET") return respond(res, 200, user());
  if (url.pathname === "/auth/v1/user" && req.method === "PUT") {
    pendingEmail = (await readJson(req)).email ?? null;
    return respond(res, 200, user());
  }
  if (url.pathname === "/rest/v1/process_profiles" || url.pathname === "/rest/v1/brew_logs") {
    return respond(res, 200, []);
  }
  if (url.pathname === "/rest/v1/coffees" && req.method === "POST") {
    const input = await readJson(req);
    const row = { ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), share_token: null };
    coffees = [...coffees.filter((coffee) => coffee.id !== row.id), row];
    return respond(res, 201, { id: row.id });
  }
  if (url.pathname === "/rest/v1/coffees" && req.method === "GET") {
    const id = url.searchParams.get("id")?.replace(/^eq\./, "");
    const rows = id ? coffees.filter((coffee) => coffee.id === id) : coffees;
    const single = req.headers.accept?.includes("application/vnd.pgrst.object+json");
    return respond(res, 200, single ? rows[0] ?? null : rows, { "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
  }
  console.error(`Unhandled mock route: ${req.method} ${url.pathname}`);
  respond(res, 404, { message: `Unhandled mock route: ${req.method} ${url.pathname}` });
}).listen(45217, "127.0.0.1");
