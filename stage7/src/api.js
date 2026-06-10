import { getAccessToken } from "./auth";
import { Log } from "./logger";

const API_BASE = "http://4.224.186.213/evaluation-service";
const MAX_LIMIT = 10;

async function fetchNotifications(page = 1, limit = MAX_LIMIT, notificationType = null) {
  await Log("frontend", "info", "api", `Fetching notifications page=${page} limit=${limit} type=${notificationType}`);

  const safeLimit = Math.min(limit, MAX_LIMIT);
  let url = `${API_BASE}/notifications?page=${page}&limit=${safeLimit}`;
  if (notificationType) {
    url += `&notification_type=${notificationType}`;
  }

  try {
    const token = await getAccessToken();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const text = await response.text();
      await Log("frontend", "error", "api", `API error: ${response.status} - ${text}`);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    await Log("frontend", "debug", "api", `Received ${(data.notifications || []).length} notifications`);
    return data;
  } catch (error) {
    await Log("frontend", "error", "api", `Fetch failed: ${error.message}`);
    throw error;
  }
}

async function fetchAllNotifications() {
  await Log("frontend", "info", "api", "Fetching all notifications for priority inbox");
  let all = [];
  let page = 1;

  while (true) {
    const data = await fetchNotifications(page, MAX_LIMIT);
    const batch = data.notifications || [];
    if (batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < MAX_LIMIT) break;
    page++;
  }

  await Log("frontend", "info", "api", `Total fetched: ${all.length}`);
  return all;
}

export { fetchNotifications, fetchAllNotifications };
