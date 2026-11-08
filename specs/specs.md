# SPRITE CONTRACTS & SPECIFICATIONS: `specs/specs.md`

> **Normative Authority:** ACME Lex Superior `v3.2.0` (`DoF = 0`)  
> **Classification:** Living Data & Sprite Contracts Specification

---

## 1. F-14 SPRITE CONTRACT (`f14_sprite_contract`)

| Parametre | Standart Değer (`DoF = 0`) | Açıklama |
| :--- | :--- | :--- |
| **Frame Boyutu** | $128 \times 128\text{ px}$ | Her ayrık açı karesinin katı sınırları |
| **Grid Düzeni** | $4 \times 4$ Matris (veya $1 \times 16$ Tekil Şerit) | Toplam 16 kare ($2048 \times 128\text{ px}$ şerit veya $512 \times 512\text{ px}$ atlas) |
| **Renk Formatı** | RGBA (32-bit) | $\text{Alpha} = 0$ arka plan (Saf transparan, sıfır kalıntı) |
| **Pivot Koordinatı** | $(x: 64, y: 64)$ | Her karenin tam geometrik merkezi |
| **Açı Adımı ($\Delta \phi$)** | $22.5^\circ$ ($360^\circ / 16$) | $0.0^\circ$ ile $337.5^\circ$ arası sıralı eksenel rotasyon |
| **Projeksiyon Modeli** | Orthographic Camera | Sıfır FOV / Sıfır perspektif kaçışı |

---

## 2. KARE İNDEKS VE AÇI EŞLEŞTİRME TABLOSU

```text
Frame 00:   0.0° (Nötr Seviye Duruş)
Frame 01:  22.5°
Frame 02:  45.0°
Frame 03:  67.5°
Frame 04:  90.0° (Dikey Bıçak / Sırt)
Frame 05: 112.5°
Frame 06: 135.0°
Frame 07: 157.5°
Frame 08: 180.0° (Ters Uçuş / Inverted)
Frame 09: 202.5°
Frame 10: 225.0°
Frame 11: 247.5°
Frame 12: 270.0° (Dikey Bıçak / Karın)
Frame 13: 292.5°
Frame 14: 315.0°
Frame 15: 337.5°
```

