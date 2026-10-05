import { parseArgs } from "node:util";

export const usage = `Usage: depdrop [options]

Creates a ticket on the configured Linear team for every open Dependabot alert
in the configured GitHub org. Alerts that already have a ticket are skipped.

Config is read from ~/.config/depdrop/config.json.

Options:
  --dry-run   Show which tickets would be created without creating them
  -h, --help  Show this help`;

export const parseCliArgs = (argv: string[]) => {
  const { values } = parseArgs({
    args: argv,
    options: {
      help: { type: "boolean", short: "h", default: false },
      "dry-run": { type: "boolean", default: false },
    },
  });
  return { help: values.help, dryRun: values["dry-run"] };
};
