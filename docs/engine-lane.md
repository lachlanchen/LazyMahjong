# Optional Mortal / mjai analysis lane

Status: **documented and disabled**. No source checkout, binary, container, or
model weight is bundled. The deterministic app remains fully functional without
this lane.

## Primary-source review and pins

- [Mortal upstream](https://github.com/Equim-chan/Mortal) describes a four-player
  Japanese Riichi AI and an mjai interface. Source is AGPL-3.0. Pin:
  `0cff2b52982be5b1163aa9a62fb01f03ce91e0d2` on `main`, resolved 2026-08-11.
- [Mortal build documentation](https://mortal.ekyu.moe/user/build.html) requires
  Python and Rust, builds `libriichi`, and leaves PyTorch installation to the
  operator. This is not an in-browser dependency.
- [Mortal's author's model statement](https://gist.github.com/Equim-chan/cf3f01735d5d98f1e7be02e94b288c56)
  says there is no official plan to release trained parameters. Therefore this
  repository does not name, fetch, trust, or redistribute unofficial weights.
- [Original mjai server/protocol repository](https://github.com/gimite/mjai) is
  New BSD licensed. Pin: `312c0c6f8446ca69ecc58e246840bffdad656541`
  on `master`, resolved 2026-08-11.
- [mjai-reviewer](https://github.com/Equim-chan/mjai-reviewer) documents Mortal
  as an mjai-compatible review engine and separately notes that a trained model
  is required. It is Apache-2.0; reviewed reference pin:
  `2dc5ec5c8b28517cfb45f57eb21536d9a8f67aa9`.

The exact pins and independent SHA-256 checks for Mortal's `Cargo.lock` and
mjai's `README.rdoc` live in `config/engine-pins.env`.

## Safe setup posture

`scripts/setup-engine-source.sh` is an explicit, source-only future setup. When
an operator runs it, it checks out the exact content-addressed commits under the
ignored `.local/engines/` tree, then runs `scripts/verify-engine-source.sh`.
Verification checks origin, commit, clean worktree, Git object presence, and the
pinned file SHA-256 values. Both scripts reject symlink/path redirection outside
the ignored project-local tree, and setup stages a new checkout before promoting
it. A project-local non-blocking lock prevents duplicate setup jobs. Neither
script builds anything or downloads weights.

If any file appears under `.local/models/mortal/` while the approved model hash
is `UNAVAILABLE`, verification fails closed. A future model addition requires:

1. provenance and license review;
2. an exact artifact URL, size, and lowercase SHA-256;
3. isolated inference with time/memory limits;
4. recorded model and feature-schema versions;
5. offline evaluation before learner-facing use.

## Adapter boundary

Mortal is Riichi-only and must never analyze MCR or Hong Kong sessions. A future
server adapter may convert a viewer-redacted, state-bound Riichi event stream to
mjai and request action values. It must then:

1. map returned actions to the current deterministic legal candidates;
2. reject unmatched/stale/illegal actions;
3. return evidence only—never mutate state;
4. label policy/value output as engine estimates;
5. keep hidden opponent hands and future wall order out of explanations; and
6. bind every response to state token, actor, engine pin, and search settings.

AGPL network-deployment obligations require legal review before offering a
modified Mortal service. The MIT license of this UI does not relicense Mortal.
