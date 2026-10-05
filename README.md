# depdrop

Creates a ticket on the Linear "Security & Governance" (SEC) team for every open Dependabot alert in a GitHub org. Each ticket gets a Linear attachment pointing at the alert URL; alerts that already have one are skipped.

## Usage

```sh
pnpm install --config.minimumReleaseAgeStrict=true
GITHUB_ORG=acme GITHUB_TOKEN=... LINEAR_API_KEY=... pnpm start
```

- `GITHUB_TOKEN`: needs `security_events` / "Dependabot alerts: read" on the org.
- `LINEAR_API_KEY`: Linear personal API key with access to the SEC team.
