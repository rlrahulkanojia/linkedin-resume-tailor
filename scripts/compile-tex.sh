#!/usr/bin/env bash
# Compile a .tex file (downloaded from the LinkedIn Resume Tailor extension) to PDF.
# Usage:
#   ./compile-tex.sh resume_OpenAI_Senior_Engineer.tex
#
# Requires a LaTeX distribution. Install with:
#   Debian/Ubuntu: sudo apt install texlive-latex-recommended texlive-fonts-recommended
#   macOS:         brew install --cask basictex   (then: sudo tlmgr update --self)
#   Windows:       https://miktex.org/download
set -e
if [ $# -lt 1 ]; then
  echo "Usage: $0 <file.tex>"; exit 1
fi
TEX="$1"
OUT="$(dirname "$TEX")"
ENGINE="pdflatex"
command -v "$ENGINE" >/dev/null || ENGINE="xelatex"
command -v "$ENGINE" >/dev/null || { echo "No LaTeX engine found. Install texlive or basictex."; exit 2; }
"$ENGINE" -interaction=nonstopmode -output-directory="$OUT" "$TEX"
PDF="${TEX%.tex}.pdf"
if [ -f "$PDF" ]; then
  echo "✓ $PDF"
  command -v xdg-open >/dev/null && xdg-open "$PDF" >/dev/null 2>&1 || true
  command -v open >/dev/null && open "$PDF" >/dev/null 2>&1 || true
else
  echo "✗ compile failed"; exit 3
fi
