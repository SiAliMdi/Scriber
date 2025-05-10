#!/bin/bash

dir="$PWD"
echo "$dir"/backend/venv/bin/activate
source "$dir"/backend/venv/bin/activate

python3 "$dir"/backend/scripts/export_schedules.py >> \
            "$dir"/backend/logs/judilibre/export.log  \
            2>> "$dir"/backend/logs/judilibre/export.err
