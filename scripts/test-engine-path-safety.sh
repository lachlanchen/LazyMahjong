#!/usr/bin/env bash
set -euo pipefail
umask 077

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)
TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/mahjong-engine-safety.XXXXXX")

cleanup() {
  if [[ -d "$TEST_ROOT" && ! -L "$TEST_ROOT" ]]; then
    rm -rf -- "$TEST_ROOT"
  fi
}
trap cleanup EXIT

make_fixture() {
  local fixture=$1
  install -d -m 700 -- "$fixture/scripts" "$fixture/config"
  cp -- "$PROJECT_DIR/scripts/setup-engine-source.sh" "$fixture/scripts/"
  cp -- "$PROJECT_DIR/scripts/verify-engine-source.sh" "$fixture/scripts/"
  cp -- "$PROJECT_DIR/config/engine-pins.env" "$fixture/config/"
}

expect_rejection() {
  local label=$1
  shift
  local log="$TEST_ROOT/$label.log"
  if "$@" >"$log" 2>&1; then
    echo "Expected path-safety rejection: $label" >&2
    exit 1
  fi
  grep -Eqi 'symlink|escaped|unsafe|non-directory' "$log" || {
    echo "Path-safety rejection lacked an explicit reason: $label" >&2
    sed -n '1,80p' "$log" >&2
    exit 1
  }
}

OUTSIDE="$TEST_ROOT/outside"
install -d -m 700 -- "$OUTSIDE"

LOCAL_LINK_FIXTURE="$TEST_ROOT/local-link/project"
make_fixture "$LOCAL_LINK_FIXTURE"
ln -s -- "$OUTSIDE" "$LOCAL_LINK_FIXTURE/.local"
expect_rejection local-link bash "$LOCAL_LINK_FIXTURE/scripts/setup-engine-source.sh"

ENGINE_LINK_FIXTURE="$TEST_ROOT/engine-link/project"
make_fixture "$ENGINE_LINK_FIXTURE"
install -d -m 700 -- "$ENGINE_LINK_FIXTURE/.local/engines"
ln -s -- "$OUTSIDE" "$ENGINE_LINK_FIXTURE/.local/engines/Mortal"
expect_rejection engine-link bash "$ENGINE_LINK_FIXTURE/scripts/setup-engine-source.sh"

MODEL_LINK_FIXTURE="$TEST_ROOT/model-link/project"
make_fixture "$MODEL_LINK_FIXTURE"
install -d -m 700 -- "$MODEL_LINK_FIXTURE/.local/engines"
ln -s -- "$OUTSIDE" "$MODEL_LINK_FIXTURE/.local/models"
expect_rejection model-link bash "$MODEL_LINK_FIXTURE/scripts/verify-engine-source.sh"

echo "Engine and model setup paths reject symlink redirection."
