# AXIS

**AXIS: Light & Dark Elemental Dominion** — monorepo for the game's three packages:

| Package | Path | Description |
|---|---|---|
| `axis-models` | [`models/`](./models) | Pure TypeScript game logic — board, rules, dealer, AI bots |
| `axis-server` | [`server/`](./server) | Node + Socket.IO authoritative game server |
| `axis-pwa` | [`pwa/`](./pwa) | Angular PWA client |

## Quick start

```bash
npm install            # links workspaces, installs all deps in one pass
npm run build          # build every package
npm test               # run tests in every package
npm run develop:server # dev-mode server with auto-reload
npm run start:pwa      # ng serve
```

`models` is a workspace dependency of `server` and `pwa`. Edits in `models/`
take effect in the consumers without a publish/install cycle.

## History

This repo was assembled from three formerly-separate repos via `git subtree add`,
preserving each one's commit history under its current path.
