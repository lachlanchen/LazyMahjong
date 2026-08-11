#!/usr/bin/env bash
set -euo pipefail
umask 077

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)
# shellcheck disable=SC1091
source "$PROJECT_DIR/config/engine-pins.env"

die() {
  echo "$*" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || die "git is required"
command -v realpath >/dev/null 2>&1 || die "realpath is required"
command -v flock >/dev/null 2>&1 || die "flock is required"

validate_pin() {
  local repository=$1
  local commit=$2
  [[ "$repository" =~ ^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git$ ]] || die "Unapproved repository URL: $repository"
  [[ "$commit" =~ ^[0-9a-f]{40}$ ]] || die "Commit is not a full lowercase Git object ID: $commit"
}

ensure_owned_directory() {
  local path=$1
  [[ ! -L "$path" ]] || die "Refusing symlink directory: $path"
  [[ ! -e "$path" || -d "$path" ]] || die "Expected a directory: $path"
  if [[ ! -e "$path" ]]; then
    install -d -m 700 -- "$path"
  fi
  local resolved
  resolved=$(realpath -e -- "$path")
  case "$resolved" in
    "$PROJECT_DIR/.local"|"$PROJECT_DIR/.local"/*) ;;
    *) die "Path escaped the project-local runtime tree: $path" ;;
  esac
}

assert_checkout() {
  local target=$1
  local repository=$2
  [[ -d "$target" && ! -L "$target" ]] || die "Unsafe source checkout path: $target"
  [[ -d "$target/.git" && ! -L "$target/.git" ]] || die "Checkout metadata must be a real directory: $target/.git"
  local resolved top origin
  resolved=$(realpath -e -- "$target")
  top=$(git -C "$target" rev-parse --show-toplevel)
  top=$(realpath -e -- "$top")
  [[ "$resolved" == "$target" && "$top" == "$target" ]] || die "Checkout escaped its expected path: $target"
  origin=$(git -C "$target" remote get-url origin)
  [[ "$origin" == "$repository" ]] || die "Unexpected origin for $target: $origin"
  [[ -z "$(git -C "$target" status --porcelain --untracked-files=all)" ]] || die "Source checkout is not clean: $target"
}

LOCAL_DIR="$PROJECT_DIR/.local"
ENGINE_DIR="$LOCAL_DIR/engines"
ensure_owned_directory "$LOCAL_DIR"
ensure_owned_directory "$ENGINE_DIR"

LOCK_FILE="$LOCAL_DIR/engine-setup.lock"
[[ ! -L "$LOCK_FILE" ]] || die "Refusing symlink lock file: $LOCK_FILE"
[[ ! -e "$LOCK_FILE" || -f "$LOCK_FILE" ]] || die "Unsafe engine setup lock: $LOCK_FILE"
exec 9>"$LOCK_FILE"
chmod 600 -- "$LOCK_FILE"
flock -n 9 || die "Another Mahjong engine setup is already running."

TEMP_ROOT=""
cleanup() {
  if [[ -n "$TEMP_ROOT" && -d "$TEMP_ROOT" && ! -L "$TEMP_ROOT" ]]; then
    rm -rf -- "$TEMP_ROOT"
  fi
}
trap cleanup EXIT

checkout_pin() {
  local repository=$1
  local commit=$2
  local target=$3
  validate_pin "$repository" "$commit"
  [[ ! -L "$target" ]] || die "Refusing symlink checkout target: $target"
  [[ ! -e "$target" || -d "$target" ]] || die "Checkout target is not a directory: $target"

  if [[ ! -e "$target" ]]; then
    TEMP_ROOT=$(mktemp -d "$ENGINE_DIR/.checkout.XXXXXX")
    local staged="$TEMP_ROOT/source"
    git clone --filter=blob:none --no-checkout -- "$repository" "$staged"
    git -C "$staged" fetch --depth=1 origin "$commit"
    git -C "$staged" checkout --detach "$commit"
    assert_checkout "$staged" "$repository"
    mv -T -- "$staged" "$target"
    rmdir -- "$TEMP_ROOT"
    TEMP_ROOT=""
  else
    assert_checkout "$target" "$repository"
    local actual_commit
    actual_commit=$(git -C "$target" rev-parse HEAD)
    if [[ "$actual_commit" != "$commit" ]]; then
      git -C "$target" fetch --depth=1 origin "$commit"
      git -C "$target" checkout --detach "$commit"
    fi
  fi

  assert_checkout "$target" "$repository"
  [[ "$(git -C "$target" rev-parse HEAD)" == "$commit" ]] || die "Commit mismatch after checkout: $target"
}

checkout_pin "$MORTAL_REPOSITORY" "$MORTAL_COMMIT" "$ENGINE_DIR/Mortal"
checkout_pin "$MJAI_REPOSITORY" "$MJAI_COMMIT" "$ENGINE_DIR/mjai"

"$SCRIPT_DIR/verify-engine-source.sh"

echo "Pinned source is ready under .local/engines."
echo "No engine was built and no model weight was downloaded or enabled."
