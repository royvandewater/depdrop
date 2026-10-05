import { beforeEach, describe, expect, it } from "vitest";
import { syncAlerts, type Alert, type Tracker } from "./sync.ts";

const alert = (number: number): Alert => ({
  url: `https://github.com/acme/widgets/security/dependabot/${number}`,
  repository: "acme/widgets",
  number,
  packageName: "lodash",
  ecosystem: "npm",
  severity: "high",
  summary: "Prototype pollution in lodash",
  ghsaId: "GHSA-xxxx-yyyy-zzzz",
  cveId: "CVE-2026-0001",
  manifestPath: "package.json",
  vulnerableVersionRange: "< 4.17.21",
  patchedVersion: "4.17.21",
});

class FakeTracker implements Tracker {
  created: Alert[] = [];

  async createTicket(alert: Alert) {
    this.created.push(alert);
  }
}

describe("syncAlerts", () => {
  describe("when there are no existing tickets", () => {
    let tracker: FakeTracker;

    beforeEach(async () => {
      tracker = new FakeTracker();
      await syncAlerts({ alerts: [alert(1)], tracker });
    });

    it("creates a ticket for the alert", () => {
      expect(tracker.created).toEqual([alert(1)]);
    });
  });
});
