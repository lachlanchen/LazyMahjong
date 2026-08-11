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

validate_pin() {
  local repository=$1
  local commit=$2
  local checksum=$3
  [[ "$repository" =~ ^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git$ ]] || die "Unapproved repository URL: $repository"
  [[ "$commit" =~ ^[0-9a-f]{40}$ ]] || die "Commit is not a full lowercase Git object ID: $commit"
  [[ "$checksum" =~ ^[0-9a-f]{64}$ ]] || die "Checksum is not a lowercase SHA-256: $checksum"
}

assert_local_directory() {
  local path=$1
  [[ -e "$path" ]] || die "Missing directory: $path"
  [[ -d "$path" && ! -L "$path" ]] || die "Refusing non-directory or symlink path: $path"
  local resolved
  resolved=$(realpath -e -- "$path")
  case "$resolved" in
    "$PROJECT_DIR/.local"|"$PROJECT_DIR/.local"/*) ;;
    *) die "Path escaped the project-local runtime tree: $path" ;;
  esac
}

LOCAL_DIR="$PROJECT_DIR/.local"
ENGINE_DIR="$LOCAL_DIR/engines"
MODEL_ROOT="$LOCAL_DIR/models"
MODEL_DIR="$MODEL_ROOT/mortal"

assert_local_directory "$LOCAL_DIR"
assert_local_directory "$ENGINE_DIR"
if [[ -e "$MODEL_ROOT" || -L "$MODEL_ROOT" ]]; then
  assert_local_directory "$MODEL_ROOT"
fi
if [[ -e "$MODEL_DIR" || -L "$MODEL_DIR" ]]; then
  assert_local_directory "$MODEL_DIR"
  model_symlink=$(find "$MODEL_DIR" -xdev -type l -print -quit)
  [[ -z "$model_symlink" ]] || die "Refusing symlink in the model directory: $model_symlink"
fi

verify_git_pin() {
  local target=$1
  local expected_commit=$2
  local expected_origin=$3
  local checked_file=$4
  local expected_checksum=$5
  validate_pin "$expected_origin" "$expected_commit" "$expected_checksum"
  assert_local_directory "$target"
  [[ -d "$target/.git" && ! -L "$target/.git" ]] || die "Checkout metadata must be a real directory: $target/.git"
  local top actual_commit actual_origin
  top=$(git -C "$target" rev-parse --show-toplevel)
  top=$(realpath -e -- "$top")
  [[ "$top" == "$target" ]] || die "Checkout escaped its expected path: $target"
  actual_commit=$(git -C "$target" rev-parse HEAD)
  [[ "$actual_commit" == "$expected_commit" ]] || die "Commit mismatch: $actual_commit"
  actual_origin=$(git -C "$target" remote get-url origin)
  [[ "$actual_origin" == "$expected_origin" ]] || die "Origin mismatch: $actual_origin"
  [[ -z "$(git -C "$target" status --porcelain --untracked-files=all)" ]] || die "Source checkout is not clean: $target"
  git -C "$target" cat-file -e "${expected_commit}^{commit}"
  [[ -f "$target/$checked_file" && ! -L "$target/$checked_file" ]] || die "Pinned evidence file is unsafe or missing: $target/$checked_file"
  printf '%s  %s\n' "$expected_checksum" "$target/$checked_file" | sha256sum --check --status || die "Checksum mismatch: $target/$checked_file"
}

verify_git_pin "$ENGINE_DIR/Mortal" "$MORTAL_COMMIT" "$MORTAL_REPOSITORY" "Cargo.lock" "$MORTAL_CARGO_LOCK_SHA256"
verify_git_pin "$ENGINE_DIR/mjai" "$MJAI_COMMIT" "$MJAI_REPOSITORY" "README.rdoc" "$MJAI_README_SHA256"

if [[ -d "$MODEL_DIR" ]]; then
  model_entry=$(find "$MODEL_DIR" -xdev -mindepth 1 -print -quit)
  if [[ -n "$model_entry" && "$MORTAL_MODEL_SHA256" == "UNAVAILABLE" ]]; then
    die "Unmanifested Mortal model content found; no reviewed upstream checksum exists."
  fi
  if [[ -n "$model_entry" ]]; then
    die "Model content remains disabled until a reviewed filename, size, and SHA-256 verifier is added."
  fi
fi

echo "Mortal and mjai source pins and evidence-file checksums verified."
