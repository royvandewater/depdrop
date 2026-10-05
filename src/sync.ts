export type Alert = {
  url: string;
  repository: string;
  number: number;
  packageName: string;
  ecosystem: string;
  severity: string;
  summary: string;
  ghsaId: string;
  cveId: string | null | undefined;
  manifestPath: string;
  vulnerableVersionRange: string;
  patchedVersion: string | null | undefined;
};

export interface Tracker {
  hasTicketFor(alert: Alert): Promise<boolean>;
  createTicket(alert: Alert): Promise<void>;
}

export const syncAlerts = async ({
  alerts,
  tracker,
  dryRun,
}: {
  alerts: Alert[];
  tracker: Tracker;
  dryRun: boolean;
}) => {
  const created: Alert[] = [];
  for (const alert of alerts) {
    if (await tracker.hasTicketFor(alert)) continue;
    if (!dryRun) await tracker.createTicket(alert);
    created.push(alert);
  }
  return created;
};
