#!/bin/bash

dir=$(dirname "$(pwd)")
source "$dir"/venv/bin/activate

python3 "$dir"/scripts/export_schedules.py >> \
            "$dir"/logs/judilibre/export.log  \
            2>> "$dir"/logs/judilibre/export.err