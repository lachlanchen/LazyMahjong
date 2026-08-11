# Product authority contract

This product implements the workspace teaching contract locally:

| Operation | Implementation |
| --- | --- |
| `initialState(config, seed)` | `src/domain/engine.ts` builds and deals a replayable seeded 136-tile source represented as one generic undealt draw pile. |
| `legalActions(state, actorId)` | Emits the complete action list only for the active seat. |
| `applyAction(state, candidate)` | Recomputes the legal list, validates the opaque state-bound ID, and returns an immutable state. |
| `publicView(state, viewerId)` | Reveals one authorized hand and removes seed, wall order, opponent draws, private hands, non-viewer claim eligibility, and hidden Pass events. |
| `evaluate(state)` | Returns only supported tile-shape completion and draw-pile exhaustion facts; scoring eligibility remains unsettled. |
| `previewAction(state, candidate)` | Calculates a hypothetical lesson without mutation; Draw never reveals its hidden tile or post-Draw calculated analysis before confirmation. |

An internal authority token covers the complete authority state and active
actor. It is never included in `PublicGameView` or the candidate envelope.
`candidate_id` is an opaque digest that covers that token, actor, and canonical
action. The separately labeled `viewToken` is derived only from the redacted
view, so changing concealed opponent tiles or wall order cannot change it.
While an undisclosed claim queue is resolving, a non-claimant sees the same
next-seat Draw envelope and chronicle as a position with no eligible claim. The
authoritative queue and its legal candidates remain intact; a declared call or
completion becomes public normally.
The monotonic persistence revision remains internal authority metadata; learner
DOM and saved-table summaries expose only the viewer-safe phase and view token,
so an extra concealed Pass cannot be inferred from a revision counter.

Persistence uses a separate monotonic `revision`, stores the canonical complete
candidate envelope with each bounded `client_request_id`, and compares both on
replay. Human and automated browser writes share one same-origin Web Lock before
revision compare-and-swap; a stale snapshot is rejected and reloaded rather than
written as a fallback. This browser remains a reference authority for a
standalone lesson. Production multiplayer must put full state, secrets, and a
transactional CAS behind a server API.

## Variant boundary

The shared exact subset is a 136-tile four-player source represented as one
generic undealt draw pile, authorized turn order, draw/discard, sequential
single-resolution call windows, chow/chii, pung/pon,
kong/kan, standard four-groups-and-pair completion, profile-declared seven
pairs, supported-shape completing kinds, and exhaustive draw-pile completion.
Names change by profile; tile mechanics remain deterministic.

- Riichi seven pairs requires seven distinct pair kinds. Riichi does not yet
  decide yaku, riichi declaration, furiten, dora, dead-wall replacement draws,
  fu/han, payments, abortive draws, or simultaneous ron.
- MCR seven pairs counts pair units, so a concealed four-of-a-kind contributes
  two; this supports the Seven Pairs + Tile Hog shape interaction. MCR does not
  yet decide the 81 fan patterns, eight-point minimum, flowers, replacement
  mechanics, robbing a kong, or settlement.
- This Hong Kong teaching profile explicitly requires seven distinct pair
  kinds. House definitions that count a four-of-a-kind twice, house-specific
  fan/laak minimums, flowers, bonus tiles, limit hands, and payments are not
  implemented.

Ron/Tsumo and their profile equivalents end this teaching-subset hand only when
the supported tile-shape test passes. They do not establish yaku/fan, furiten,
minimum-value, payment, or other scoring eligibility.

An open kan draws from the same generic undealt pile and is legal only while a
supplemental tile exists; dead-wall, dora, replacement-draw, and robbing-kong
mechanics are not modeled. With an empty pile, kan is unavailable. Pon and chi
remain legal, lead directly to the caller's required discard, and then resume
claim resolution; if every response passes, the hand ends exhaustively. A
direct discard likewise advances to the next Draw only while an undealt tile
exists, otherwise all-pass resolution ends the hand exhaustively.

## Evidence boundary

- **Exact:** generic undealt draw-pile count, legality, actor, tile identities,
  calls, visible river observations, supported shape completion, and the
  exhaustive set of tile kinds that complete a supported shape when hand arity
  permits it. This is not proof of yaku, fan minimum, furiten clearance, or a
  score-valid win.
- **Calculated:** supported-pattern shanten distance, shanten-reducing tile kinds,
  unseen-copy ukeire, and tile-family shape signals. “Unseen” is exactly four
  minus the copies visible to that viewer; it is not known undealt draw-pile
  inventory or draw probability. Discard ordering uses shanten first, unseen-copy ukeire
  second, and improving-kind count third. The visible UI groups physically
  equivalent copies, preserves equal ranks, discloses ties, and uses canonical
  tile order only after all three teaching criteria are equal.
- **Authored:** Pass as the cautious study lead when profile value is unavailable,
  safety cautions, value-route prompts, likely-response language, and
  transferable strategy. Forced Draw is Exact; completion leads are Exact only
  for supported tile shape and action legality within the teaching subset;
  discard/call shape comparisons are Calculated.
- **Engine/model:** reserved and absent in the default build.

No heuristic is labeled as probability, confidence, score, or physical energy.
The calculation input is limited to the authorized hand plus public rivers and
melds. Changing concealed opponents or wall order cannot change a teaching
analysis, its public-view binding token, its grouped rank, or its suggested tile
type. Deterministic bot discards likewise use only the acting bot's own tile
types and copies, never the wall or another concealed hand.
