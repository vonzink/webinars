#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
webinar_dir=$(cd -- "$script_dir/.." && pwd)
asset_dir="$webinar_dir/assets/documents"
render_dir=$(mktemp -d)
trap 'rm -rf -- "$render_dir"' EXIT

mkdir -p "$asset_dir"

# render <prefix> <pdf> <formPage:pdfPage>...   (mappings mirror source-manifest.json)
render() {
  local prefix=$1 pdf=$2; shift 2
  for mapping in "$@"; do
    local form_page=${mapping%%:*}
    local source_page=${mapping##*:}
    pdftoppm -png -r 180 -f "$source_page" -l "$source_page" \
      "$webinar_dir/references/$pdf" "$render_dir/$prefix-$form_page-tmp"
    mv "$render_dir/$prefix-$form_page-tmp"* "$asset_dir/$prefix-page-$form_page.png"
  done
}

render le loan-estimate-H24B.pdf 1:2 2:3 3:4
render le2 loan-estimate-refinance-H24D.pdf 1:2 2:3 3:4
render le3 loan-estimate-model-H24A.pdf 1:2 2:4 3:8
render cd closing-disclosure-H25B.pdf 1:2 2:3 3:4 4:5 5:6
render cd2 closing-disclosure-refinance-H25E.pdf 1:2 2:3 3:4 4:5 5:6
render cd3 closing-disclosure-refinance-cash-H25G.pdf 1:2 2:3 3:4 4:5 5:6
