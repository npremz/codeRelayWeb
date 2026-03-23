#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist}"
BIN_NAME="relay-judge"

mkdir -p "$OUT_DIR"

CGO_ENABLED=0 go build -o "$OUT_DIR/$BIN_NAME" ./cmd/relay-judge
rm -rf "$OUT_DIR/subjects"
cp -R "$ROOT_DIR/subjects" "$OUT_DIR/subjects"

echo "Built:"
echo "  $OUT_DIR/$BIN_NAME"
echo "  $OUT_DIR/subjects"
