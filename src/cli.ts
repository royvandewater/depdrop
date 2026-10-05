#!/usr/bin/env node
import assert from "node:assert";
import { fetchOpenAlerts } from "./github.ts";
import { createLinearTracker } from "./linear.ts";
import { syncAlerts } from "./sync.ts";

const { GITHUB_ORG, GITHUB_TOKEN, LINEAR_API_KEY } = process.env;
assert(GITHUB_ORG, new Error("GITHUB_ORG is required"));
assert(GITHUB_TOKEN, new Error("GITHUB_TOKEN is required"));
assert(LINEAR_API_KEY, new Error("LINEAR_API_KEY is required"));

const alerts = await fetchOpenAlerts({ org: GITHUB_ORG, token: GITHUB_TOKEN, fetch });
const tracker = await createLinearTracker({ apiKey: LINEAR_API_KEY, teamKey: "SEC", fetch });
const created = await syncAlerts({ alerts, tracker });

for (const alert of created) {
  console.log(`Created ticket for ${alert.url}`);
}
console.log(`${alerts.length} open alerts, ${created.length} new tickets`);
