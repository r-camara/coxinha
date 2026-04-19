#!/usr/bin/env bash
# Download models for Coxinha.
#
# Default: Whisper base (lighter, ~150MB) + pyannote segmentation + wespeaker.
# Use --parakeet to fetch Parakeet TDT v3 INT8 (~550MB).
# Use --whisper-large to fetch Whisper large-v3 (~3GB, better quality).

set -euo pipefail

VAULT_DIR="${VAULT_DIR:-$HOME/coxinha}"
MODELS_DIR="$VAULT_DIR/.coxinha/models"
mkdir -p "$MODELS_DIR"

WANT_WHISPER_BASE=1
WANT_WHISPER_LARGE=0
WANT_PARAKEET=0
WANT_PYANNOTE=1

for arg in "$@"; do
  case "$arg" in
    --parakeet) WANT_PARAKEET=1 ;;
    --whisper-large) WANT_WHISPER_LARGE=1 ;;
    --no-whisper) WANT_WHISPER_BASE=0 ;;
    --no-pyannote) WANT_PYANNOTE=0 ;;
    --all) WANT_WHISPER_LARGE=1; WANT_PARAKEET=1 ;;
    *) echo "unknown arg: $arg"; exit 1 ;;
  esac
done

download() {
  local url="$1"
  local dest="$2"
  if [[ -f "$dest" ]]; then
    echo "ok $dest already exists"
    return
  fi
  echo "downloading $(basename "$dest")..."
  curl -L --fail --progress-bar -o "$dest" "$url"
}

if [[ "$WANT_WHISPER_BASE" == 1 ]]; then
  echo "== Whisper base =="
  download \
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin" \
    "$MODELS_DIR/ggml-base.bin"
fi

if [[ "$WANT_WHISPER_LARGE" == 1 ]]; then
  echo "== Whisper large-v3 =="
  download \
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin" \
    "$MODELS_DIR/ggml-large-v3.bin"
fi

if [[ "$WANT_PARAKEET" == 1 ]]; then
  echo "== Parakeet TDT 0.6B v3 INT8 =="
  PARAKEET_DIR="$MODELS_DIR/parakeet-tdt-0.6b-v3-int8"
  mkdir -p "$PARAKEET_DIR"
  # Exact URLs from the ONNX INT8 release on HuggingFace.
  # TODO: confirm final paths once they stabilize.
  download \
    "https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx/resolve/main/encoder-model.int8.onnx" \
    "$PARAKEET_DIR/encoder-model.int8.onnx"
  download \
    "https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx/resolve/main/decoder_joint-model.int8.onnx" \
    "$PARAKEET_DIR/decoder_joint-model.int8.onnx"
  download \
    "https://huggingface.co/istupakov/parakeet-tdt-0.6b-v3-onnx/resolve/main/vocab.txt" \
    "$PARAKEET_DIR/vocab.txt"
fi

if [[ "$WANT_PYANNOTE" == 1 ]]; then
  echo "== pyannote segmentation + wespeaker =="
  download \
    "https://github.com/thewh1teagle/pyannote-rs/releases/download/v0.1.0/segmentation-3.0.onnx" \
    "$MODELS_DIR/segmentation-3.0.onnx"
  download \
    "https://github.com/thewh1teagle/pyannote-rs/releases/download/v0.1.0/wespeaker_en_voxceleb_CAM++.onnx" \
    "$MODELS_DIR/wespeaker_en_voxceleb_CAM++.onnx"
fi

echo ""
echo "Models installed under $MODELS_DIR"
echo ""
echo "Update $VAULT_DIR/.coxinha/config.toml to point at the files you downloaded."
