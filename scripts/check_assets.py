"""
check_assets.py - Deterministic Asset Dependency DAG & Content Hash Invalidation Controller
Standard: ACME Lex Superior v3.2.0 (INV-ASSET-LINEAGE-01, DoF = 0)
Reference: specs/const.md, specs/state.json, specs/macro.md

Checks cryptographic SHA-256 hashes of source assets against specs/state.json.
- If matches: Emits UP-TO-DATE (Cache Hit) and bypasses execution (Principle of Least Action).
- If dirty/missing: Automatically triggers the declared build step in specs/macro.md,
  re-bakes the asset, and updates specs/state.json.
"""

import sys
import os
import json
import hashlib
import subprocess
from datetime import datetime, timezone

STATE_PATH = os.path.join("specs", "state.json")

def compute_sha256(filepath):
    if not os.path.exists(filepath):
        return None
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def load_state():
    if not os.path.exists(STATE_PATH):
        return {"version": "1.0.0", "protocol": "INV-ASSET-LINEAGE (DoF = 0)", "assets": {}}
    with open(STATE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_state(state):
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def check_and_bake():
    state = load_state()
    assets = state.get("assets", {})
    all_clean = True
    
    print("[ASSET_DAG] Verifying asset dependency graph and cryptographic hashes...")
    
    for target_asset, meta in assets.items():
        source_path = meta.get("source")
        recorded_hash = meta.get("source_sha256")
        
        current_hash = compute_sha256(source_path)
        if current_hash is None:
            print(f"[ERROR] Source asset missing: {source_path}")
            sys.exit(1)
            
        target_exists = os.path.exists(target_asset)
        
        # Check cache hit condition
        if target_exists and current_hash == recorded_hash:
            print(f"  -> {target_asset} is UP-TO-DATE (Cache Hit, SHA-256: {current_hash[:12]}...)")
            meta["status"] = "CLEAN"
        else:
            reason = "Source Hash Mismatch" if current_hash != recorded_hash else "Target Missing"
            print(f"  -> {target_asset} is DIRTY ({reason})! Triggering re-bake...")
            all_clean = False
            
            # Execute re-bake command per specs/macro.md [SECTION: ASSET CALIBRATION MACRO]
            cmd = [
                sys.executable,
                "scripts/render_spritesheet.py",
                "--obj", source_path,
                "--angles", "16",
                "--out", target_asset
            ]
            print(f"     Executing: {' '.join(cmd)}")
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode != 0:
                print(f"[RE-BAKE FAILED]\n{res.stderr}")
                sys.exit(1)
                
            # Update state with new hash
            meta["source_sha256"] = current_hash
            meta["rendered_at"] = datetime.now(timezone.utc).isoformat()
            meta["status"] = "CLEAN"
            print(f"     [SUCCESS] Re-baked and sealed with new hash: {current_hash[:12]}...")
            
    save_state(state)
    if all_clean:
        print("[ASSET_DAG] All pipeline assets are CLEAN. Zero unnecessary work performed.")
    else:
        print("[ASSET_DAG] All dirty assets successfully re-baked and state synchronized.")

if __name__ == "__main__":
    check_and_bake()

