"""
render_spritesheet.py - Articulated Parametric 3D Model Renderer with Socket Projection
Standard: ACME Lex Superior v3.2.0 (DoF = 0)
Requirements:
1. Scene Graph Articulation:
   - Parametric wing sweep (--sweep [20..68] deg)
   - Parametric rudder / bank tilt (--bank [-15..15] deg)
2. Decoupled VFX Socket Projection:
   - Projects 3D socket points into 2D pixel space for each frame:
     * engine_L, engine_R (afterburner origins)
     * muzzle (Vulcan cannon muzzle)
     * wingtip_L, wingtip_R (navigation strobe lights)
   - Outputs specs/f14_sockets.json
3. Zero-fluff decoupled rendering (No embedded VFX inside mesh).
"""

import sys
import os
import math
import json
import argparse
from PIL import Image, ImageDraw
import numpy as np

def build_articulated_f14(sweep_deg=20.0, rudder_deg=0.0):
    """
    Constructs an articulated F-14 airframe with discrete scene graph nodes:
    - Fuselage / Center Body
    - Wing_L (Pivoting around port wing glove pivot)
    - Wing_R (Pivoting around starboard wing glove pivot)
    - Rudder_L / Rudder_R (Twin canted vertical rudders pivoting on yaw axis)
    - Socket landmarks
    """
    # Wing pivot locations in airframe space
    pivot_l = np.array([-0.1, 0.05, 0.42])
    pivot_r = np.array([-0.1, 0.05, -0.42])
    
    # Sweep angle: 20 deg (unswept subsonic) to 68 deg (fully swept supersonic)
    sweep_rad = math.radians(sweep_deg - 20.0)
    
    # 1. Base Fuselage Geometry
    fuse_verts = {
        'nose': np.array([2.1, 0.0, 0.0]),
        'muzzle': np.array([1.4, -0.12, -0.15]), # Vulcan M61A1 port nose position
        'canopy_front': np.array([0.9, 0.18, 0.0]),
        'canopy_top': np.array([0.4, 0.32, 0.0]),
        'canopy_rear': np.array([-0.1, 0.22, 0.0]),
        
        'spine_mid': np.array([-0.4, 0.18, 0.0]),
        'spine_rear': np.array([-1.2, 0.12, 0.0]),
        'tail_center': np.array([-1.8, 0.02, 0.0]),
        
        'chin_bottom': np.array([0.6, -0.18, 0.0]),
        'belly_mid': np.array([-0.4, -0.18, 0.0]),
        
        # Twin TF30 / F110 Engine Nacelles
        'intake_l_top': np.array([0.2, -0.05, 0.36]),
        'intake_l_bot': np.array([0.2, -0.22, 0.36]),
        'nozzle_l': np.array([-1.75, -0.08, 0.34]), # engine_L socket
        
        'intake_r_top': np.array([0.2, -0.05, -0.36]),
        'intake_r_bot': np.array([0.2, -0.22, -0.36]),
        'nozzle_r': np.array([-1.75, -0.08, -0.34]), # engine_R socket
        
        # Tailplane Stabilators
        'stab_l_root': np.array([-1.3, -0.05, 0.42]),
        'stab_l_tip': np.array([-1.8, -0.05, 0.88]),
        'stab_r_root': np.array([-1.3, -0.05, -0.42]),
        'stab_r_tip': np.array([-1.8, -0.05, -0.88]),
    }
    
    # 2. Articulated Wing_L (Pivots around pivot_l on horizontal Y-axis)
    # At 20 deg: wingtip extends out to Z = 1.65. Sweeping shifts it back to -X and in to Z
    base_wing_l_tip = np.array([-0.45, 0.0, 1.35]) # relative to pivot
    base_wing_l_rear = np.array([-0.85, 0.0, 0.15])
    
    # Rotate around Y axis by -sweep_rad (sweeping backwards)
    cos_s, sin_s = math.cos(-sweep_rad), math.sin(-sweep_rad)
    rot_matrix_l = np.array([
        [cos_s, 0, sin_s],
        [0, 1, 0],
        [-sin_s, 0, cos_s]
    ])
    
    swept_tip_l = pivot_l + rot_matrix_l.dot(base_wing_l_tip)
    swept_rear_l = pivot_l + rot_matrix_l.dot(base_wing_l_rear)
    
    # 3. Articulated Wing_R (Symmetric)
    base_wing_r_tip = np.array([-0.45, 0.0, -1.35])
    base_wing_r_rear = np.array([-0.85, 0.0, -0.15])
    
    cos_sr, sin_sr = math.cos(sweep_rad), math.sin(sweep_rad)
    rot_matrix_r = np.array([
        [cos_sr, 0, sin_sr],
        [0, 1, 0],
        [-sin_sr, 0, cos_sr]
    ])
    swept_tip_r = pivot_r + rot_matrix_r.dot(base_wing_r_tip)
    swept_rear_r = pivot_r + rot_matrix_r.dot(base_wing_r_rear)
    
    # 4. Articulated Twin Rudders (Canted 5 deg outwards, can deflect by rudder_deg)
    rudder_rad = math.radians(rudder_deg)
    rud_cos, rud_sin = math.cos(rudder_rad), math.sin(rudder_rad)
    
    # Base vertical tailfin tips
    rudder_l_tip = np.array([-1.65, 0.78, 0.42 + 0.15 * rud_sin])
    rudder_r_tip = np.array([-1.65, 0.78, -0.42 + 0.15 * rud_sin])
    
    # Assemble all vertices
    all_verts = {}
    all_verts.update(fuse_verts)
    all_verts['wing_l_pivot'] = pivot_l
    all_verts['wing_l_tip'] = swept_tip_l # wingtip_L socket
    all_verts['wing_l_rear'] = swept_rear_l
    
    all_verts['wing_r_pivot'] = pivot_r
    all_verts['wing_r_tip'] = swept_tip_r # wingtip_R socket
    all_verts['wing_r_rear'] = swept_rear_r
    
    all_verts['tail_l_root'] = np.array([-1.05, 0.16, 0.30])
    all_verts['tail_l_tip'] = rudder_l_tip
    all_verts['tail_r_root'] = np.array([-1.05, 0.16, -0.30])
    all_verts['tail_r_tip'] = rudder_r_tip
    
    # Faces with naval tactical cel-shading colors
    faces = [
        # Nose & Cockpit
        (['nose', 'canopy_front', 'canopy_top', 'canopy_rear', 'spine_mid'], (150, 160, 172)),
        (['canopy_front', 'canopy_top', 'canopy_rear'], (50, 190, 235)), # Canopy glass
        (['nose', 'chin_bottom', 'belly_mid', 'spine_mid'], (125, 134, 145)),
        
        # Engine Nacelles (Port & Starboard)
        (['intake_l_top', 'intake_l_bot', 'nozzle_l', 'spine_rear'], (95, 102, 112)),
        (['intake_r_top', 'intake_r_bot', 'nozzle_r', 'spine_rear'], (90, 98, 108)),
        
        # Wings (Articulated Swept)
        (['wing_l_pivot', 'wing_l_tip', 'wing_l_rear'], (165, 174, 185)),
        (['wing_r_pivot', 'wing_r_tip', 'wing_r_rear'], (160, 170, 180)),
        
        # Stabilators
        (['stab_l_root', 'stab_l_tip', 'tail_center'], (140, 148, 158)),
        (['stab_r_root', 'stab_r_tip', 'tail_center'], (135, 144, 154)),
        
        # Twin Rudders
        (['tail_l_root', 'tail_l_tip', 'nozzle_l'], (175, 185, 196)),
        (['tail_r_root', 'tail_r_tip', 'nozzle_r'], (170, 180, 192)),
    ]
    
    # 3D Socket definitions (Landmarks)
    sockets_3d = {
        'engine_L': all_verts['nozzle_l'],
        'engine_R': all_verts['nozzle_r'],
        'muzzle': all_verts['muzzle'],
        'wingtip_L': all_verts['wing_l_tip'],
        'wingtip_R': all_verts['wing_r_tip'],
    }
    
    return all_verts, faces, sockets_3d

def rotate_x(v, angle_rad):
    x, y, z = v
    cos_a, sin_a = math.cos(angle_rad), math.sin(angle_rad)
    return np.array([x, y * cos_a - z * sin_a, y * sin_a + z * cos_a])

def project_orthographic_vertex(v, roll_rad, heading_rad, pitch_rad, scale, cx, cy):
    v_rolled = rotate_x(v, roll_rad)
    x, y, z = v_rolled
    
    # Heading (Yaw)
    cos_h, sin_h = math.cos(heading_rad), math.sin(heading_rad)
    xh = x * cos_h + z * sin_h
    zh = -x * sin_h + z * cos_h
    yh = y
    
    # Pitch
    cos_p, sin_p = math.cos(pitch_rad), math.sin(pitch_rad)
    xp = xh * cos_p - yh * sin_p
    yp = xh * sin_p + yh * cos_p
    
    sx = cx + xp * scale
    sy = cy - yp * scale
    return sx, sy, zh

def render_frame_with_sockets(all_verts, faces, sockets_3d, roll_deg, frame_size=128):
    frame = Image.new('RGBA', (frame_size, frame_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    
    roll_rad = math.radians(roll_deg)
    # +Z flight corridor orientation: Heading = 24 deg, Pitch = -18 deg
    heading_rad = math.radians(24.0)
    pitch_rad = math.radians(-18.0)
    
    scale = 30.0 # Bounded to fit strictly within 128x128
    cx, cy = frame_size / 2.0, frame_size / 2.0 # Strict Pivot (64, 64)
    
    # Project all mesh vertices
    projected = {}
    for k, v in all_verts.items():
        projected[k] = project_orthographic_vertex(v, roll_rad, heading_rad, pitch_rad, scale, cx, cy)
        
    # Project 3D sockets into 2D pixel coordinates
    sockets_2d = {}
    for name, s_3d in sockets_3d.items():
        sx, sy, sz = project_orthographic_vertex(s_3d, roll_rad, heading_rad, pitch_rad, scale, cx, cy)
        sockets_2d[name] = {
            'x': round(float(sx), 2),
            'y': round(float(sy), 2),
            'depth_z': round(float(sz), 3)
        }
        
    # Depth sort faces (Painter's Algorithm)
    sorted_faces = []
    for f_keys, col in faces:
        avg_z = sum(projected[vk][2] for vk in f_keys) / len(f_keys)
        sorted_faces.append((avg_z, f_keys, col))
    sorted_faces.sort(key=lambda item: item[0])
    
    # Render polygons with crisp 2D cel-shaded outline
    for _, f_keys, base_col in sorted_faces:
        pts = [(projected[vk][0], projected[vk][1]) for vk in f_keys]
        if len(pts) >= 3:
            draw.polygon(pts, fill=base_col, outline=(35, 42, 50, 255))
            
    return frame, sockets_2d

def main():
    parser = argparse.ArgumentParser(description="Parametric 3D F-14 Sprite & Socket Renderer")
    parser.add_argument("--angles", type=int, default=16, help="Angles count")
    parser.add_argument("--sweep", type=float, default=20.0, help="Wing sweep angle (20 to 68 deg)")
    parser.add_argument("--bank", type=float, default=0.0, help="Rudder deflection angle (-15 to 15 deg)")
    parser.add_argument("--out", type=str, default=".tmp/f14_sheet.png", help="Spritesheet output path")
    parser.add_argument("--sockets-out", type=str, default="specs/f14_sockets.json", help="Socket JSON path")
    parser.add_argument("--frame-size", type=int, default=128, help="Frame size")
    args = parser.parse_args()
    
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(args.sockets_out)), exist_ok=True)
    
    # 1. Articulate 3D Model with parametric sweep and rudder bank
    all_verts, faces, sockets_3d = build_articulated_f14(sweep_deg=args.sweep, rudder_deg=args.bank)
    
    f_size = args.frame_size
    step_deg = 360.0 / args.angles
    sheet_w = args.angles * f_size
    sheet_h = f_size
    
    spritesheet = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    all_frames_sockets = []
    
    print(f"[PARAMETRIC_RENDER] Rendering 3D model (Sweep: {args.sweep}°, Rudder: {args.bank}°, Angles: {args.angles})...")
    
    for idx in range(args.angles):
        roll = idx * step_deg
        frame, s_2d = render_frame_with_sockets(all_verts, faces, sockets_3d, roll, f_size)
        spritesheet.paste(frame, (idx * f_size, 0), frame)
        
        # Offset sockets relative to global spritesheet strip and local frame
        frame_meta = {
            'frame_index': idx,
            'roll_angle_deg': round(roll, 1),
            'local_frame_bounds': {'x': idx * f_size, 'y': 0, 'width': f_size, 'height': f_size},
            'pivot': {'x': 64.0, 'y': 64.0},
            'sockets': s_2d
        }
        all_frames_sockets.append(frame_meta)
        print(f"  Frame {idx:02d} ({roll:5.1f}°): Muzzle=({s_2d['muzzle']['x']}, {s_2d['muzzle']['y']}) | Eng_L=({s_2d['engine_L']['x']}, {s_2d['engine_L']['y']})")
        
    spritesheet.save(args.out, 'PNG')
    
    # Write Sockets Contract JSON
    sockets_manifest = {
        'version': '1.0.0',
        'contract': 'f14_sprite_contract',
        'parametric_state': {
            'wing_sweep_deg': args.sweep,
            'rudder_deflection_deg': args.bank,
            'total_frames': args.angles,
            'frame_size': f_size
        },
        'frames': all_frames_sockets
    }
    
    with open(args.sockets_out, 'w', encoding='utf-8') as f:
        json.dump(sockets_manifest, f, indent=2)
        
    print(f"[SUCCESS] Spritesheet saved: {args.out} ({sheet_w}x{sheet_h})")
    print(f"[SUCCESS] Socket table saved: {args.sockets_out}")

if __name__ == '__main__':
    main()
