#!/bin/sh
set -e
# Non-interactive answer for the "dev push detected" warning on reused volumes.
printf 'y\n' | ./node_modules/.bin/payload migrate
exec node server.js
