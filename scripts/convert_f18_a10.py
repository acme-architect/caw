import os
import re

def convert_ac_to_obj(ac_path, obj_path):
    print(f"Converting {ac_path} -> {obj_path}...")
    with open(ac_path, "r", errors="ignore") as f:
        lines = f.readlines()

    vertices = []
    faces = []
    current_mat = 0
    current_name = "default"

    i = 0
    vert_offset = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith("OBJECT"):
            parts = line.split()
            if len(parts) > 1:
                current_name = parts[1]
        elif line.startswith("name"):
            current_name = line.split()[1].replace('"', '')
        elif line.startswith("numvert"):
            n_vert = int(line.split()[1])
            vert_offset = len(vertices)
            for j in range(n_vert):
                i += 1
                v_parts = lines[i].strip().split()
                # Flightgear AC3D coordinates
                vertices.append((float(v_parts[0]), float(v_parts[1]), float(v_parts[2])))
        elif line.startswith("numsurf"):
            n_surf = int(line.split()[1])
            for _ in range(n_surf):
                i += 1
                surf_line = lines[i].strip()
                i += 1
                mat_line = lines[i].strip()
                i += 1
                refs_line = lines[i].strip()
                if refs_line.startswith("refs"):
                    n_refs = int(refs_line.split()[1])
                    surf_v_indices = []
                    for _ in range(n_refs):
                        i += 1
                        ref_parts = lines[i].strip().split()
                        local_idx = int(ref_parts[0])
                        surf_v_indices.append(vert_offset + local_idx + 1)
                    if len(surf_v_indices) >= 3:
                        for t in range(1, len(surf_v_indices) - 1):
                            faces.append((surf_v_indices[0], surf_v_indices[t], surf_v_indices[t+1]))
        i += 1

    with open(obj_path, "w") as f:
        f.write("# Converted from FlightGear AC3D\n")
        for v in vertices:
            f.write(f"v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
        for face in faces:
            f.write(f"f {face[0]} {face[1]} {face[2]}\n")
    print(f"Done {obj_path}: {len(vertices)} vertices, {len(faces)} faces.")

if __name__ == "__main__":
    convert_ac_to_obj("assets/models/f18.ac", "assets/models/f18.obj")
    convert_ac_to_obj("assets/models/a10.ac", "assets/models/a10.obj")

