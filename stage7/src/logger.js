import { getAccessToken } from "./auth";

const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = {
  backend: ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"],
  frontend: ["api", "component", "hook", "page", "state", "style"],
  both: ["auth", "config", "middleware", "utils"]
};

function getAllowedPackages(stack) {
  const stackPackages = VALID_PACKAGES[stack] || [];
  return [...stackPackages, ...VALID_PACKAGES.both];
}

async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.includes(stack)) return;
  if (!VALID_LEVELS.includes(level)) return;
  const allowed = getAllowedPackages(stack);
  if (!allowed.includes(pkg)) return;

  try {
    const token = await getAccessToken();
    await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ stack, level, package: pkg, message: String(message) })
    });
  } catch (_) {
    /* silently fail in frontend — don't block UI */
  }
}

export { Log };
