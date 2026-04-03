#!/bin/sh
echo -ne '\033c\033]0;The Villains Club\a'
base_path="$(dirname "$(realpath "$0")")"
"$base_path/The Villains Club.x86_64" "$@"
