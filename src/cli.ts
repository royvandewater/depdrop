#!/usr/bin/env node
import { homedir } from "node:os";
import { join } from "node:path";
import { parseCliArgs, usage } from "./args.ts";
import { loadConfig } from "./config.ts";
import { fetchOpenAlerts } from "./github.ts";
import { createLinearTracker } from "./linear.ts";
import { syncAlerts } from "./sync.ts";

const { help, dryRun } = parseCliArgs(process.argv.slice(2));

if (help) {
  console.log(usage);
  process.exit(0);
}

const config = await loadConfig(join(homedir(), ".config", "depdrop", "config.json"));

const alerts = await fetchOpenAlerts({
  org: config.githubOrg,
  token: config.githubToken,
  fetch,
});
const tracker = await createLinearTracker({ apiKey: config.linearApiKey, teamKey: "SEC", fetch });
const created = await syncAlerts({ alerts, tracker, dryRun });

const verb = dryRun ? "Would create" : "Created";
for (const alert of created) {
  console.log(`${verb} ticket for ${alert.url}`);
}
console.log(
  `${alerts.length} open alerts, ${created.length} new tickets${dryRun ? " (dry run)" : ""}`,
);
