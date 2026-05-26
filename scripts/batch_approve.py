"""Batch-approve all pending candidate stays."""
import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE_URL = os.environ.get("NEXT_PUBLIC_SERVER_URL", "http://localhost:3000")
API_KEY = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PAYLOAD_ADMIN_API_KEY", "")
DELAY = int(sys.argv[2]) if len(sys.argv) > 2 else 5


def api(method, path, data=None, timeout=120):
    headers = {
        "Authorization": f"users API-Key {API_KEY}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers=headers, method=method)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read())
        except (urllib.error.URLError, ConnectionRefusedError, OSError) as e:
            if attempt < 2:
                print(f"  retry {attempt+1}: {e}", flush=True)
                time.sleep(5 * (attempt + 1))
            else:
                raise


def main():
    print("Fetching pending candidates...", flush=True)
    data = api("GET", "/api/candidate-stays?depth=0&limit=500&fields=id,status")
    pending = [d["id"] for d in data["docs"] if d.get("status") == "pending"]
    print(f"Pending: {len(pending)}", flush=True)
    if not pending:
        print("Nothing to approve.")
        return

    ok = 0
    fail = 0
    for i, cid in enumerate(pending, 1):
        try:
            result = api("PATCH", f"/api/candidate-stays/{cid}", {"status": "approved"})
            ok += 1
            title = result.get("doc", {}).get("title", "?")[:40]
            print(f"[{i}/{len(pending)}] OK id={cid} \"{title}\" (ok={ok} fail={fail})", flush=True)
        except Exception as e:
            fail += 1
            print(f"[{i}/{len(pending)}] FAIL id={cid}: {str(e)[:100]}", flush=True)
        if i < len(pending):
            time.sleep(DELAY)

    print(f"\nDONE: ok={ok} fail={fail} total={len(pending)}")


if __name__ == "__main__":
    main()
