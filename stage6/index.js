const { Log, getToken } = require("../logger");

const API_BASE = "http://4.224.186.213/evaluation-service";
const WEIGHT = { Placement: 3, Result: 2, Event: 1 };
const MAX_LIMIT = 10;

async function fetchNotifications(page, limit) {
  const token = await getToken();
  const url = API_BASE + "/notifications?page=" + page + "&limit=" + limit;

  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) {
    const text = await res.text();
    await Log("backend", "error", "handler", "API error " + res.status + ": " + text);
    throw new Error("API returned " + res.status + ": " + text);
  }

  return res.json();
}

async function fetchAllNotifications() {
  let all = [];
  let page = 1;

  await Log("backend", "info", "service", "Fetching all notifications (limit=" + MAX_LIMIT + " per page)");

  while (true) {
    const data = await fetchNotifications(page, MAX_LIMIT);
    const batch = data.notifications || [];
    if (batch.length === 0) break;
    all = all.concat(batch);
    await Log("backend", "debug", "service", "Page " + page + ": " + batch.length + " items (total: " + all.length + ")");
    if (batch.length < MAX_LIMIT) break;
    page++;
  }

  await Log("backend", "info", "service", "Total fetched: " + all.length);
  return all;
}

function getTopN(notifications, n) {
  return [...notifications]
    .sort(function (a, b) {
      var wd = WEIGHT[b.Type] - WEIGHT[a.Type];
      if (wd !== 0) return wd;
      return new Date(b.Timestamp) - new Date(a.Timestamp);
    })
    .slice(0, n);
}

function printTable(list) {
  var line = "=".repeat(110);
  var dash = "-".repeat(110);

  process.stdout.write("\n" + line + "\n");
  process.stdout.write("  TOP 10 PRIORITY NOTIFICATIONS\n");
  process.stdout.write(line + "\n\n");

  process.stdout.write(
    "  " +
    "#".padEnd(5) +
    "Type".padEnd(15) +
    "Weight".padEnd(10) +
    "Message".padEnd(45) +
    "Timestamp".padEnd(25) +
    "\n"
  );
  process.stdout.write("  " + dash + "\n");

  list.forEach(function (n, i) {
    process.stdout.write(
      "  " +
      String(i + 1).padEnd(5) +
      n.Type.padEnd(15) +
      String(WEIGHT[n.Type]).padEnd(10) +
      n.Message.substring(0, 43).padEnd(45) +
      n.Timestamp.padEnd(25) +
      "\n"
    );
  });

  process.stdout.write("\n" + line + "\n");
}

async function main() {
  try {
    await Log("backend", "info", "handler", "Priority inbox started");

    var all = await fetchAllNotifications();

    if (all.length === 0) {
      await Log("backend", "warn", "handler", "No notifications found");
      process.stdout.write("No notifications found.\n");
      return;
    }

    var top = getTopN(all, 10);

    await Log("backend", "info", "handler", "Top " + top.length + " computed from " + all.length + " total");

    printTable(top);

    process.stdout.write("\nJSON Output:\n\n");
    process.stdout.write(JSON.stringify(top, null, 2) + "\n");

    await Log("backend", "info", "handler", "Done");
  } catch (err) {
    await Log("backend", "fatal", "handler", "Failed: " + err.message);
    process.stderr.write("Error: " + err.message + "\n");
    process.exit(1);
  }
}

main();
