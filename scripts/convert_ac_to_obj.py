import os

ac_path = 'assets/models/f-14b.ac'
obj_path = 'assets/models/f14.obj'

vertices = []
faces = []
materials = []

with open(ac_path, 'r', encoding='latin1') as f:
    lines = f.readlines()

print(f"Total lines in .ac: {len(lines)}")

i = 0
num_lines = len(lines)
base_v = 0

while i < num_lines:
    line = lines[i].strip()
    if line.startswith('MATERIAL'):
        parts = line.split()
        mat_name = parts[1].strip('"')
        try:
            rgb_idx = parts.index('rgb')
            r, g, b = float(parts[rgb_idx+1]), float(parts[rgb_idx+2]), float(parts[rgb_idx+3])
            materials.append((mat_name, r, g, b))
        except Exception:
            materials.append((mat_name, 0.7, 0.7, 0.7))
    elif line.startswith('numvert'):
        count = int(line.split()[1])
        base_v = len(vertices)
        for j in range(count):
            i += 1
            v_parts = lines[i].strip().split()
            vx, vy, vz = float(v_parts[0]), float(v_parts[1]), float(v_parts[2])
            vertices.append((vx, vy, vz))
    elif line.startswith('refs'):
        refs_count = int(line.split()[1])
        poly_indices = []
        for j in range(refs_count):
            i += 1
            idx = int(lines[i].strip().split()[0])
            poly_indices.append(base_v + idx + 1)
        if len(poly_indices) >= 3:
            faces.append(poly_indices)
    i += 1

print(f"Parsed: {len(vertices)} vertices, {len(faces)} faces, {len(materials)} materials")

with open(obj_path, 'w') as f_out:
    f_out.write("# Converted F-14 Tomcat from FlightGear open-source model\n")
    for v in vertices:
        # Scale and align
        f_out.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
    for poly in faces:
        face_str = " ".join(str(idx) for idx in poly)
        f_out.write(f"f {face_str}\n")

print(f"Successfully wrote OBJ: {obj_path} ({os.path.getsize(obj_path)} bytes)")

