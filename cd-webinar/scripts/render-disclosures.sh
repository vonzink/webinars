#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
webinar_dir=$(cd -- "$script_dir/.." && pwd)
asset_dir="$webinar_dir/assets/documents"
render_dir=$(mktemp -d)
trap 'rm -rf -- "$render_dir"' EXIT

mkdir -p "$asset_dir"
pdftoppm -png -r 180 -f 2 -l 4 "$webinar_dir/references/loan-estimate-H24B.pdf" "$render_dir/le"
pdftoppm -png -r 180 -f 2 -l 6 "$webinar_dir/references/closing-disclosure-H25B.pdf" "$render_dir/cd"

for mapping in '2:1' '3:2' '4:3'; do
  source_page=${mapping%%:*}
  form_page=${mapping##*:}
  cp "$render_dir/le-$source_page.png" "$asset_dir/le-page-$form_page.png"
done

for mapping in '2:1' '3:2' '4:3' '5:4' '6:5'; do
  source_page=${mapping%%:*}
  form_page=${mapping##*:}
  cp "$render_dir/cd-$source_page.png" "$asset_dir/cd-page-$form_page.png"
done
