# Product authority contract

This product implements the workspace teaching contract locally:

| Operation | Implementation |
| --- | --- |
| `initialState(config, seed)` | `src/domain/engine.ts` builds and deals a replayable seeded wall. |
| `legalActions(state, actorId)` | Emits the complete action list only for the active seat. |
| `applyAction(state, candidate)` | Recomputes the legal list, validates the opaque state-bound ID, and returns an immutable state. |
| `publicView(state, viewerId)` | Reveals one authorized hand and removes seed, wall order, opponent draws, and private hands. |
| `evaluate(state)` | Returns only exact completion/exhaustion facts; advanced score remains unsettled. |
| `previewAction(state, candidate)` | Calculates a hypothetical lesson without mutation; a draw never reveals the next hidden tile. |

An internal authority token covers the complete authority state and active
actor. It is never included in `PublicGameView` or the candidate envelope.
`candidate_id` is an opaque digest that covers that token, actor, and canonical
action. The separately labeled `viewToken` is derived only from the redacted
view, so changing concealed opponent tiles or wall order cannot change it.

Persistence uses a separate monotonic `revision`, stores the canonical complete
candidate envelope with each bounded `client_request_id`, and compares both on
replay. Human and automated browser writes share one same-origin Web Lock before
revision compare-and-swap; a stale snapshot is rejected and reloaded rather than
written as a fallback. This browser remains a reference authority for a
standalone lesson. Production multiplayer must put full state, secrets, and a
transactional CAS behind a server API.

## Variant boundary

The shared exact subset is a 136-tile four-player wall, authorized turn order,
draw/discard, sequential call windows, chow/chii, pung/pon, kong/kan, standard
four-groups-and-pair completion, seven pairs, visible waits, and exhaustive wall
completion. Names change by profile; tile mechanics remain deterministic.

- Riichi does not yet decide yaku, riichi declaration, furiten, dora, dead-wall
  replacement draws, fu/han, payments, abortive draws, or simultaneous ron.
- MCR does not yet decide the 81 fan patterns, eight-point minimum, flowers,
  replacement mechanics, robbing a kong, or settlement.
- Hong Kong does not yet decide house-specific fan/laak minimums, flowers,
  bonus tiles, limit hands, or payments.

An open kan currently draws from the ordinary live wall and is visibly labeled
as part of the initial teaching subset. A complete shape is never presented as
proof of a score-valid win under an unsupported advanced profile catalog.

## Evidence boundary

- **Exact:** wall count, legality, actor, tile identities, calls, visible river
  observations, and exact shape completion.
- **Calculated:** waits, visible-copy ukeire, and a comparative shape index.
- **Authored:** safety cautions, value-route prompts, likely-response language,
  and transferable strategy.
- **Engine/model:** reserved and absent in the default build.

No heuristic is labeled as probability, confidence, score, or physical energy.
