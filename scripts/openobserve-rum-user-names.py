"""Prepare a narrow nginx asset override for OpenObserve Enterprise v1.1.2.

Run on the VPS with Python 3. No token is needed; no RUM data is modified.
Unknown bundles fail closed instead of applying a partial patch.
"""

import argparse
import hashlib
import json
import pathlib
import re
import urllib.request


def download(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode("utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:5080")
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    html = download(base + "/")
    index = re.search(r'src="\./assets/(index-[^"/]+\.js)"', html)
    if not index:
        raise RuntimeError("Cannot identify the OpenObserve entry bundle")
    entry = download(base + "/web/assets/" + index.group(1))
    assets = set(re.findall(r'\./(AppSessions\.[A-Za-z0-9_-]+\.js)', entry))
    if len(assets) != 1:
        raise RuntimeError("Expected exactly one AppSessions bundle")
    asset = assets.pop()
    original = download(base + "/web/assets/" + asset)
    replacements = [
        (
            'accessorFn:e=>e.user_email||We',
            'accessorFn:e=>e.user_name||e.user_email||We',
        ),
        (
            'L.value.usr_email&&(g+="max(usr_email) as user_email,")',
            'L.value.usr_email&&(g+="max(usr_email) as user_email,"),'
            'L.value.usr_name&&(g+="max(usr_name) as user_name,")',
        ),
        (
            'user_email:F.user_email,',
            'user_name:F.user_name,user_email:F.user_email,',
        ),
        (
            'value:s.user_email||n(We)',
            'value:s.user_name||s.user_email||n(We)',
        ),
    ]
    patched = original
    for before, after in replacements:
        if patched.count(before) != 1:
            raise RuntimeError("Unsupported bundle; refusing partial patch: " + before)
        patched = patched.replace(before, after)

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / asset).write_text(patched, encoding="utf-8")
    (args.output / (asset + ".original")).write_text(original, encoding="utf-8")
    (args.output / "nginx-location.conf").write_text(
        f"location = /web/assets/{asset} {{\n"
        f"    alias /var/lib/openobserve-ui-overrides/{asset};\n"
        "    default_type application/javascript;\n"
        "    add_header Cache-Control 'no-store' always;\n"
        "}\n",
        encoding="utf-8",
    )
    manifest = {
        "asset": asset,
        "original_sha256": hashlib.sha256(original.encode()).hexdigest(),
        "patched_sha256": hashlib.sha256(patched.encode()).hexdigest(),
        "changes": len(replacements),
    }
    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
