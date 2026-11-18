#!/usr/bin/env python3
"""Build the public feed from a raw database dump.

Usage: python3 tools/build_feed.py RAW.json

RAW.json is one JSON object with the keys items, digests, weeks, sources, skills,
categories, meta (arrays of {"id": ..., ...data}) and people (the list from the
private config/people document: [{"id","name","key"}]).

Writes feed.json (stories everyone may see) and p/<id>.json for each person:
the extra folders shared with that person, encrypted with AES-256-GCM using the
key in their personal link. Names and keys never appear in plain text.
"""
import base64, json, os, sys, glob

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
except ImportError:
    sys.exit("Install the cryptography package first: pip install cryptography")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def b64u_decode(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def b64(b):
    return base64.b64encode(b).decode()


def main(raw_path):
    raw = json.load(open(raw_path))
    cats = raw.get("categories") or []
    vis = {c.get("key") or c["id"]: (c.get("visibility") or "everyone") for c in cats}
    restricted = {k for k, v in vis.items() if v != "everyone"}

    feed = {}
    for k in ("digests", "weeks", "skills", "meta"):
        feed[k] = raw.get(k) or []
    feed["meta"] = [m for m in feed["meta"] if m.get("id") != "access"]
    feed["items"] = [i for i in raw.get("items") or [] if i.get("topic") not in restricted]
    feed["sources"] = [s for s in raw.get("sources") or [] if s.get("topic") not in restricted]
    feed["categories"] = [{k: v for k, v in c.items() if k != "people"} for c in cats]
    if not feed["items"]:
        sys.exit("No public items; refusing to write an empty feed.")
    with open(os.path.join(ROOT, "feed.json"), "w") as f:
        json.dump(feed, f, ensure_ascii=False, separators=(",", ":"))

    pdir = os.path.join(ROOT, "p")
    os.makedirs(pdir, exist_ok=True)
    keep = set()
    for person in raw.get("people") or []:
        pid, key = person.get("id"), person.get("key")
        if not pid or not key or not pid.isalnum():
            continue
        topics = [c.get("key") or c["id"] for c in cats
                  if c.get("visibility") == "some" and pid in (c.get("people") or [])]
        payload = {
            "name": person.get("name", ""),
            "topics": topics,
            "items": [i for i in raw.get("items") or [] if i.get("topic") in topics],
        }
        iv = os.urandom(12)
        ct = AESGCM(b64u_decode(key)).encrypt(iv, json.dumps(payload, ensure_ascii=False).encode(), None)
        with open(os.path.join(pdir, pid + ".json"), "w") as f:
            json.dump({"iv": b64(iv), "ct": b64(ct)}, f)
        keep.add(pid + ".json")
    for path in glob.glob(os.path.join(pdir, "*.json")):
        if os.path.basename(path) not in keep:
            os.remove(path)
    print(f"public items: {len(feed['items'])}, people files: {len(keep)}, private folders: {sorted(restricted)}")


if __name__ == "__main__":
    main(sys.argv[1])
