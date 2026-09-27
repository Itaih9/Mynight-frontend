#!/usr/bin/env bash
#
# Build the site and publish it to its S3 bucket (+ CloudFront cache bust).
#
# There was no deploy step in this repo — the build was going up by hand — so
# this makes it one reviewed command. It is DRY-RUN by default: it prints every
# command and changes nothing until you pass --confirm.
#
# Run it where your real AWS credentials live (your machine, the server, or CI),
# NOT from a sandbox with placeholder keys.
#
#   VITE_API_URL=https://api.mynight.co.il \
#   DEPLOY_BUCKET=your-frontend-bucket \
#   CLOUDFRONT_DISTRIBUTION_ID=E123ABC \
#     npm run deploy            # dry run: shows what it would do
#
#   ... same env ... npm run deploy -- --confirm     # actually deploy
#
# Required:
#   VITE_API_URL   the backend URL baked into the build (what the app calls)
#   DEPLOY_BUCKET  the S3 bucket that serves the site (NOT the media bucket)
# Optional:
#   CLOUDFRONT_DISTRIBUTION_ID  invalidated so visitors get the new build at once
#
# Flags:
#   --confirm   perform the deploy (otherwise every AWS/build step is only printed)
#   --prune     delete files in the bucket that are no longer in the build
#               (off by default: a wrong bucket with --prune would wipe a site)
#   --skip-build  reuse the existing dist/ instead of rebuilding
#
# Find the values if you don't know them (needs your real creds):
#   buckets:        aws s3 ls
#   distributions:  aws cloudfront list-distributions \
#                     --query "DistributionList.Items[].{Id:Id,Domain:DomainName,Aliases:Aliases.Items}"
#
set -euo pipefail

CONFIRM=0
PRUNE=0
SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --confirm) CONFIRM=1 ;;
    --prune) PRUNE=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    -h|--help) sed -n '2,40p' "$0"; exit 0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

fail() { echo "error: $*" >&2; exit 1; }

# Run from the repo root regardless of where the script was invoked.
cd "$(dirname "$0")/.."

command -v aws >/dev/null || fail "the AWS CLI is not installed (https://aws.amazon.com/cli/)"
command -v npm >/dev/null || fail "npm is not installed"
: "${VITE_API_URL:?set VITE_API_URL to your backend URL, e.g. https://api.mynight.co.il}"
: "${DEPLOY_BUCKET:?set DEPLOY_BUCKET to the S3 bucket that serves the site}"
DIST_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"

# In dry-run, print the command; otherwise run it. Either way it is visible.
run() {
  if [ "$CONFIRM" = 1 ]; then
    echo "+ $*"
    "$@"
  else
    echo "DRY-RUN would run: $*"
  fi
}

echo "== MyNight frontend deploy =="
echo "   bucket:       s3://$DEPLOY_BUCKET"
echo "   API baked in: $VITE_API_URL"
echo "   CloudFront:   ${DIST_ID:-"(none given — skipping cache invalidation)"}"
echo "   mode:         $([ "$CONFIRM" = 1 ] && echo LIVE || echo DRY-RUN)$([ "$PRUNE" = 1 ] && echo " +prune" || true)"
echo

# 1. Build. index.html is emitted with references to content-hashed asset files,
#    which is what makes the caching split below safe.
if [ "$SKIP_BUILD" = 1 ]; then
  echo "== skipping build (--skip-build); using existing dist/"
  [ -f dist/index.html ] || fail "dist/index.html not found; drop --skip-build"
else
  echo "== building"
  run env VITE_API_URL="$VITE_API_URL" npm run build
fi
# In a real dry run the build was not executed, so only assert this for real.
if [ "$CONFIRM" = 1 ] && [ ! -f dist/index.html ]; then fail "build produced no dist/index.html"; fi

DELETE_FLAG=""
[ "$PRUNE" = 1 ] && DELETE_FLAG="--delete"

# 2. Upload the hashed assets first, cached hard. Their names change whenever
#    their contents do, so "cache forever" can never serve a stale asset.
echo "== uploading hashed assets (cached 1 year, immutable)"
run aws s3 sync dist/ "s3://$DEPLOY_BUCKET/" \
  $DELETE_FLAG \
  --exclude index.html \
  --cache-control "public,max-age=31536000,immutable"

# 3. Upload index.html LAST and never cache it, so the new build goes live the
#    moment this finishes and every visitor's next load points at the new assets.
echo "== uploading index.html (no-cache, uploaded last)"
run aws s3 cp dist/index.html "s3://$DEPLOY_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html; charset=utf-8"

# 4. Bust CloudFront's copy of index.html. The assets are content-hashed, so
#    only the entry document needs invalidating — cheap and enough.
if [ -n "$DIST_ID" ]; then
  echo "== invalidating CloudFront /index.html and /"
  run aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths /index.html /
else
  echo "== no CLOUDFRONT_DISTRIBUTION_ID given; skipping invalidation"
  echo "   (visitors may see the old build until CloudFront's TTL on index.html expires)"
fi

echo
if [ "$CONFIRM" = 1 ]; then
  echo "Done. Open the site on a phone and download a few photos:"
  echo "  - saved as separate photos  -> the fix is live and CORS is fine."
  echo "  - still a single zip         -> CORS is blocking the browser fetch;"
  echo "    on the BACKEND run: node scripts/check-media-cors.js  (then --apply)"
else
  echo "This was a DRY RUN. Nothing changed. Re-run with --confirm to deploy."
fi
