#!/usr/bin/env python3
"""Site search v2 eval harness (spec: specs/site-search-v2.spec.md, Phase A step 1).

Runs the cases in tools/search-eval.json against the live AI Search endpoint
and reports hit@1, hit@3 and mean reciprocal rank (MRR), overall and split by
kind (keyword / conversational).

Python 3 stdlib only. Costs one semantic query per case (25 cases = 25
queries against the 1,000/month budget). Run it sparingly.

Usage:
    python tools/search-eval.py [--boost] [--rewrite] [--rerank] [--json-out PATH]
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit

ENDPOINT = "https://143cf7a6-834c-406c-b5ea-62e00f4de7bd.search.ai.cloudflare.com/search"
ORIGIN = "https://copilotplaybook.com"
CASES_PATH = "tools/search-eval.json"
SLEEP_SECONDS = 2.1
TOP_N = 10


def load_cases(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def url_to_relative_path(url):
    """Convert an absolute copilotplaybook.com URL (or a bare path) to the
    relative page path used in sitemap.xml / search-eval.json."""
    if not url:
        return url
    if url.startswith("http://") or url.startswith("https://"):
        parts = urlsplit(url)
        path = parts.path
    else:
        path = url

    if path in ("", "/"):
        return "index.html"
    if path.endswith("/"):
        path = path + "index.html"
    path = path.lstrip("/")
    if path == "":
        path = "index.html"
    return path


def build_options(args):
    retrieval = {"max_num_results": 20}
    options = {"retrieval": retrieval}

    if args.boost:
        retrieval["boost_by"] = [{"field": "priority", "direction": "desc"}]
    if args.rewrite:
        options["query_rewrite"] = {"enabled": True}
    if args.rerank:
        options["reranking"] = {"enabled": True}

    return options


def run_query(query, ai_search_options):
    body = {
        "messages": [{"role": "user", "content": query}],
        "ai_search_options": ai_search_options,
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        method="POST",
        headers={
            "Origin": ORIGIN,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/129.0.0.0 Safari/537.36",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        return json.loads(raw.decode("utf-8"))


def ranked_pages_from_response(resp):
    """Dedupe result chunks by item.key in rank order, return a list of
    relative page paths."""
    chunks = (((resp or {}).get("result") or {}).get("chunks")) or []
    seen = set()
    pages = []
    for chunk in chunks:
        item = chunk.get("item") or {}
        key = item.get("key")
        if key is None:
            continue
        if key in seen:
            continue
        seen.add(key)
        pages.append(url_to_relative_path(key))
    return pages


def first_acceptable_rank(ranked_pages, expect):
    expect_set = set(expect)
    for i, page in enumerate(ranked_pages[:TOP_N], start=1):
        if page in expect_set:
            return i
    return None


def fmt_rank(rank):
    return str(rank) if rank is not None else "-"


def summarize(results):
    n = len(results)
    if n == 0:
        return {"hit@1": 0.0, "hit@3": 0.0, "mrr": 0.0, "n": 0}
    hit1 = sum(1 for r in results if r["rank"] == 1)
    hit3 = sum(1 for r in results if r["rank"] is not None and r["rank"] <= 3)
    mrr_sum = sum((1.0 / r["rank"]) if r["rank"] else 0.0 for r in results)
    return {
        "hit@1": hit1 / n,
        "hit@3": hit3 / n,
        "mrr": mrr_sum / n,
        "n": n,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="Site search v2 eval harness")
    parser.add_argument("--boost", action="store_true",
                         help="add retrieval.boost_by=[{field: priority, direction: desc}]")
    parser.add_argument("--rewrite", action="store_true",
                         help="add query_rewrite={enabled: true}")
    parser.add_argument("--rerank", action="store_true",
                         help="add reranking={enabled: true}")
    parser.add_argument("--json-out", default=None,
                         help="path to write raw per-case results as JSON")
    args = parser.parse_args()

    cases = load_cases(CASES_PATH)
    ai_search_options = build_options(args)

    results = []
    request_count = 0

    print(f"Running {len(cases)} cases against {ENDPOINT}")
    print(f"ai_search_options: {json.dumps(ai_search_options)}")
    print()

    for i, case in enumerate(cases):
        cid = case["id"]
        query = case["query"]
        expect = case["expect"]
        kind = case["kind"]

        error_note = None
        ranked_pages = []
        try:
            resp = run_query(query, ai_search_options)
            request_count += 1
            ranked_pages = ranked_pages_from_response(resp)
        except urllib.error.HTTPError as e:
            request_count += 1
            try:
                body = e.read().decode("utf-8", errors="replace")
            except Exception:
                body = ""
            error_note = f"HTTP {e.code}: {body[:200]}"
        except urllib.error.URLError as e:
            request_count += 1
            error_note = f"URL error: {e.reason}"
        except Exception as e:
            request_count += 1
            error_note = f"error: {e}"

        rank = None if error_note else first_acceptable_rank(ranked_pages, expect)

        results.append({
            "id": cid,
            "query": query,
            "kind": kind,
            "expect": expect,
            "rank": rank,
            "top3": ranked_pages[:3],
            "error": error_note,
        })

        if i < len(cases) - 1:
            time.sleep(SLEEP_SECONDS)

    # Table
    print(f"{'ID':<5} {'KIND':<14} {'RANK':<5} TOP-3 PAGES")
    print("-" * 100)
    for r in results:
        top3_str = ", ".join(r["top3"]) if r["top3"] else "(none)"
        if r["error"]:
            top3_str = f"ERROR: {r['error']}"
        print(f"{r['id']:<5} {r['kind']:<14} {fmt_rank(r['rank']):<5} {top3_str}")

    print()

    overall = summarize(results)
    by_kind = {}
    for kind in sorted(set(r["kind"] for r in results)):
        by_kind[kind] = summarize([r for r in results if r["kind"] == kind])

    print("Summary")
    print("-" * 40)
    print(f"Overall (n={overall['n']}): hit@1={overall['hit@1']:.3f}  "
          f"hit@3={overall['hit@3']:.3f}  MRR={overall['mrr']:.3f}")
    for kind, s in by_kind.items():
        print(f"  {kind:<14} (n={s['n']}): hit@1={s['hit@1']:.3f}  "
              f"hit@3={s['hit@3']:.3f}  MRR={s['mrr']:.3f}")

    print()
    print(f"Requests made: {request_count}")

    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as f:
            json.dump({
                "ai_search_options": ai_search_options,
                "results": results,
                "summary": {"overall": overall, "by_kind": by_kind},
                "request_count": request_count,
            }, f, indent=2, ensure_ascii=False)
        print(f"Wrote raw results to {args.json_out}")

    sys.exit(0)


if __name__ == "__main__":
    main()
