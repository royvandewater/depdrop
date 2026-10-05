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

  existingUrls: string[];

  constructor(existingUrls: string[] = []) {
    this.existingUrls = existingUrls;
  }

  async hasTicketFor(alert: Alert) {
    return this.existingUrls.includes(alert.url);
  }

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

  describe("when a ticket already exists for one of the alerts", () => {
    let tracker: FakeTracker;
    let created: Alert[];

    beforeEach(async () => {
      tracker = new FakeTracker([alert(1).url]);
      created = await syncAlerts({ alerts: [alert(1), alert(2)], tracker });
    });

    it("creates a ticket only for the new alert", () => {
      expect(tracker.created).toEqual([alert(2)]);
    });

    it("returns the alerts it created tickets for", () => {
      expect(created).toEqual([alert(2)]);
    });
  });
});
