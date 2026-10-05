#!/usr/bin/env node
import { homedir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "./config.ts";
import { fetchOpenAlerts } from "./github.ts";
import { createLinearTracker } from "./linear.ts";
import { syncAlerts } from "./sync.ts";

const config = await loadConfig(join(homedir(), ".config", "depdrop", "config.json"));

const alerts = await fetchOpenAlerts({
  org: config.githubOrg,
  token: config.githubToken,
  fetch,
});
const tracker = await createLinearTracker({ apiKey: config.linearApiKey, teamKey: "SEC", fetch });
const created = await syncAlerts({ alerts, tracker });

for (const alert of created) {
  console.log(`Created ticket for ${alert.url}`);
}
console.log(`${alerts.length} open alerts, ${created.length} new tickets`);
