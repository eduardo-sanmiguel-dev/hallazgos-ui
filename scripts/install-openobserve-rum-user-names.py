#!/usr/bin/python3 -I
"""Install the reviewed v1.1.2 RUM view override; run from a root-owned copy."""

import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import time


def main():
    if os.geteuid() != 0:
        raise SystemExit("Run the root-owned installer through sudo")
    asset = "AppSessions.11N7nOwp.js"
    content = (Path("/home/eduardo/openobserve/rum-user-names") / asset).read_bytes()
    expected = "eb168dc71846779b7888f819ba4baad115ca9ac3695edacbd483bd121ee27244"
    if hashlib.sha256(content).hexdigest() != expected:
        raise SystemExit("Bundle hash differs from the reviewed patch")

    config = Path("/etc/nginx/sites-available/logs.conf")
    original = config.read_bytes()
    include = b"    include /etc/nginx/snippets/openobserve-rum-user-names.conf;"
    marker = b"    server_name logs.comportarte.com;"
    if include not in original and marker not in original:
        raise SystemExit("Unexpected nginx configuration; no changes applied")
    backup = config.with_name(config.name + ".before-rum-names-" + str(time.time_ns()))
    shutil.copy2(config, backup)

    destination = Path("/var/lib/openobserve-ui-overrides")
    destination.mkdir(mode=0o755, parents=True, exist_ok=True)
    target = destination / asset
    target.write_bytes(content)
    target.chmod(0o644)
    snippet = Path("/etc/nginx/snippets/openobserve-rum-user-names.conf")
    snippet.write_text(
        f"location = /web/assets/{asset} {{\n"
        f"    alias /var/lib/openobserve-ui-overrides/{asset};\n"
        "    default_type application/javascript;\n"
        "    add_header Cache-Control 'no-store' always;\n"
        "}\n"
    )
    snippet.chmod(0o644)
    try:
        if include not in original:
            config.write_bytes(original.replace(marker, marker + b"\n" + include, 1))
        subprocess.run(["/usr/sbin/nginx", "-t"], check=True)
        subprocess.run(["/usr/bin/systemctl", "reload", "nginx"], check=True)
    except Exception:
        config.write_bytes(original)
        subprocess.run(["/usr/sbin/nginx", "-t"], check=False)
        subprocess.run(["/usr/bin/systemctl", "reload", "nginx"], check=False)
        raise
    print("Installed. Nginx backup:", backup)
    permission = Path("/etc/sudoers.d/openobserve-rum-temporal")
    if permission.exists():
        permission.unlink()
        print("Temporary sudo permission removed")


if __name__ == "__main__":
    main()
