#!/usr/bin/env bash
# tools/test-accounts.sh — end-to-end check of the accounts API.
# Start the Worker first:  cd ff/worker && npx wrangler dev --port 8787 --local

B=${DRAFTLINE_API:-http://127.0.0.1:8787}
O="Origin: ${DRAFTLINE_ORIGIN:-http://localhost:8123}"
J='content-type: application/json'
pass=0; fail=0
ck() { # ck <label> <expected-substring> <actual>
  if [[ "$3" == *"$2"* ]]; then echo "  ok   $1"; pass=$((pass+1));
  else echo "  FAIL $1"; echo "       wanted: $2"; echo "       got:    $3"; fail=$((fail+1)); fi
}

NAME="klince+$RANDOM$RANDOM@outlook.com"
UPPER=$(echo "$NAME" | tr "[:lower:]" "[:upper:]")
PW="laredo"

echo "== bad origin is refused"
r=$(curl -s -H "Origin: https://evil.example" -H "$J" -d '{"name":"x","password":"yyyyyy"}' $B/api/signup)
ck "origin allowlist" "Origin not allowed" "$r"

echo "== signup"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$NAME\",\"password\":\"$PW\"}" $B/api/signup)
ck "returns a token" '"token"' "$r"
TOK=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

echo "== signup rules"
r=$(curl -s -H "$O" -H "$J" -d '{"name":"shorty","password":"abc"}' $B/api/signup)
ck "min password" "at least 6" "$r"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$NAME\",\"password\":\"another\"}" $B/api/signup)
ck "duplicate name" "already taken" "$r"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$UPPER\",\"password\":\"another\"}" $B/api/signup)
ck "duplicate is case-insensitive" "already taken" "$r"

echo "== login"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$NAME\",\"password\":\"$PW\"}" $B/api/login)
ck "correct password" '"token"' "$r"
TOK2=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"$NAME\",\"password\":\"wrong!\"}" $B/api/login)
ck "wrong password" "don't match" "$r"
r=$(curl -s -H "$O" -H "$J" -d '{"name":"nobody-at-all","password":"whatever"}' $B/api/login)
ck "unknown name gives the same message" "don't match" "$r"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"  $UPPER \",\"password\":\"$PW\"}" $B/api/login)
ck "login trims and folds case" '"token"' "$r"

echo "== session"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK" $B/api/session)
ck "valid token" "$NAME" "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer deadbeef" $B/api/session)
ck "junk token" "Not signed in" "$r"
r=$(curl -s -H "$O" $B/api/session)
ck "no token" "Not signed in" "$r"

echo "== state round trip (device A)"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK" $B/api/state)
ck "empty to start" '"rev":0' "$r"
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $TOK" \
    -d '{"rev":0,"state":"{\"picks\":[1,2,3]}","device":"Windows · Chrome"}' $B/api/state)
ck "first write is rev 1" '"rev":1' "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK2" $B/api/state)
ck "the other device sees it" 'picks' "$r"
ck "and the device label" 'Windows' "$r"

echo "== conflict"
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $TOK2" \
    -d '{"rev":0,"state":"{\"picks\":[9]}","device":"iPad · Safari"}' $B/api/state)
ck "stale rev is refused" '"conflict":true' "$r"
ck "and hands back the current state" 'picks' "$r"
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $TOK2" \
    -d '{"rev":1,"state":"{\"picks\":[9]}","device":"iPad · Safari"}' $B/api/state)
ck "current rev is accepted" '"rev":2' "$r"
r=$(curl -s -X PUT -H "$O" -H "$J" -H "Authorization: Bearer $TOK2" \
    -d '{"rev":0,"force":true,"state":"{\"picks\":[42]}","device":"iPad · Safari"}' $B/api/state)
ck "force overrides" '"rev":3' "$r"

echo "== isolation between accounts"
r=$(curl -s -H "$O" -H "$J" -d "{\"name\":\"other-$RANDOM\",\"password\":\"laredo2\"}" $B/api/signup)
TOK3=$(echo "$r" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK3" $B/api/state)
ck "a new account sees no one else's draft" '"rev":0' "$r"

echo "== logout"
r=$(curl -s -X POST -H "$O" -H "Authorization: Bearer $TOK" $B/api/logout)
ck "logout ok" '"ok":true' "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK" $B/api/session)
ck "token is dead after logout" "Not signed in" "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK2" $B/api/session)
ck "the other device stays signed in" "$NAME" "$r"

echo "== the Claude proxy is untouched at the root"
# Reaching the proxy's own validation is the proof that /api/ routing did not
# swallow the root. Which validation you hit depends on the target: a local dev
# run has no secret installed, a deployed one does and gets as far as the body.
r=$(curl -s -H "$O" -H "$J" -d '{"messages":[]}' $B/)
if [[ "$r" == *ANTHROPIC_API_KEY* ]]; then r="reached the proxy"; fi
if [[ "$r" == *"No messages"* ]];    then r="reached the proxy"; fi
ck "still its own endpoint" "reached the proxy" "$r"
r=$(curl -s -H "$O" -H "Authorization: Bearer $TOK2" $B/api/nonsense)
ck "unknown api route" "No such endpoint" "$r"

echo
echo "$pass passed, $fail failed"
exit $((fail > 0))
