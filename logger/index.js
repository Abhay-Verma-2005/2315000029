const AUTH_URL = "http://4.224.186.213/evaluation-service/auth";
const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";

const CREDENTIALS = {
  email: "abhay.verma_cs23@gla.ac.in",
  name: "abhay verma",
  rollNo: "2315000029",
  accessCode: "RPsgYt",
  clientID: "f612d6dd-1ee4-4175-8aba-3c79ef6a7b0a",
  clientSecret: "NJmUDFdgtYXnVxdg"
};

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiry - 60) return cachedToken;

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS)
  });

  if (!res.ok && res.status !== 201) {
    throw new Error("Auth failed: " + res.status);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = data.expires_in;
  return cachedToken;
}

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = {
  backend: ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"],
  frontend: ["api", "component", "hook", "page", "state", "style"],
  both: ["auth", "config", "middleware", "utils"]
};

function getAllowedPackages(stack) {
  return [...(VALID_PACKAGES[stack] || []), ...VALID_PACKAGES.both];
}

async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.includes(stack)) return;
  if (!VALID_LEVELS.includes(level)) return;
  if (!getAllowedPackages(stack).includes(pkg)) return;

  try {
    const token = await getToken();
    const res = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ stack, level, package: pkg, message: String(message) })
    });
    if (!res.ok && res.status !== 201) {
      process.stderr.write("[Logger] Log API returned " + res.status + "\n");
    }
  } catch (e) {
    process.stderr.write("[Logger] " + e.message + "\n");
  }
}

module.exports = { Log, getToken };
