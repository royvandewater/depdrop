# depdrop

Creates a ticket on a Linear team for every open Dependabot alert in a GitHub org. Each ticket gets a Linear attachment pointing at the alert URL; alerts that already have one are skipped.

## Usage

Create `~/.config/depdrop/config.json`:

```json
{
  "githubOrg": "acme",
  "githubToken": "...",
  "linearApiKey": "...",
  "linearTeamKey": "SEC"
}
```

- `githubToken`: needs `security_events` / "Dependabot alerts: read" on the org.
- `linearApiKey`: Linear personal API key with access to the team.
- `linearTeamKey`: key of the Linear team to create tickets on (e.g. `SEC`).

Then run:

```sh
pnpm install --config.minimumReleaseAgeStrict=true
pnpm start
```

Preview without creating tickets:

```sh
pnpm start --dry-run
```
