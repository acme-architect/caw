# 2.5D HARİTA, DİKEY SEVİYE GEÇİŞLERİ VE KATMAN YÖNETİMİ ŞARTNAMESİ

**Kapsam:** `solution-b` (Carrier Air Wing Remake)  
**Doktrin:** DoF = 0 | Çok Katmanlı İrtifa Mimarisi | Araç Değişimi | Z-Layering  
**Hedef:** `specs/map_layer_architecture.md`

---

## 1. 3D İrtifa (Z-Domain) ve Çoklu Ortam Seviyeleri

Oyun yalnızca su üstünde uçuşla sınırlı kalmayacak; dikey irtifa ekseni ($Z$) 4 ana biyom/katmana ayrılacaktır:

```text
┌────────────────────────────────────────────────────────┐
│ KATMAN 3: YÜKSEK İRTİFA / BULUT & HAVA KATMANI (Z > 120) │
│ - Hacimsel bulut bankları (Additive/Alpha Blend)      │
│ - Süpersonik şok dalgaları, yıldırım ve rüzgâr        │
│ - Araç: F-14 Tomcat / F/A-18 Hornet                   │
├────────────────────────────────────────────────────────┤
│ KATMAN 2: ORTA İRTİFA / KÖPRÜ & YER ÜSTÜ (Z = 0 .. 120)│
│ - Asma köprü pilonları, binalar, hava savunma kuleleri │
│ - Z=60 köprü yol tabliyesi, araç trafiği              │
│ - Araç: F-14 / F-18 / A-10 Thunderbolt II             │
├────────────────────────────────────────────────────────┤
│ KATMAN 1: SU YÜZEYİ & KIYI ŞERİDİ (Z = 0)              │
│ - Uçak gemisi güvertesi, yatlar, fırkateynler, dalgalar│
│ - İzdüşüm gölgeleri, torpido ve su sıçramaları        │
│ - Araç: Kalkış/İniş modunda uçaklar                   │
├────────────────────────────────────────────────────────┤
│ KATMAN 0: DENİZALTI & YER ALTI TÜNELLERİ (Z < 0)       │
│ - Z = -80 .. -200: Su altı kanyonları, batık denizaltı │
│ - Z = -100 .. -300: Dağ altı sığınakları, hangar tüneli│
│ - Araç Değişimi: Mini Denizaltı / Dalgıç Podu          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Araç Değişimi (Vehicle Transformation & Transition)

1. **Denizaltı / Sualtı Girişi ($Z < 0$):**
   - Belirli seviyelerde (örn. Bölüm 3: "Submarine Trench Base") oyuncu su yüzeyine iniş yaparak veya bir pod bırakarak **Mini Denizaltı (Submersible Pod)** aracına geçer.
   - Sualtı fizik parametreleri:
     * İleri sürtünme artar, manevra hızı düşer.
     * Mermiler yerine sonik torpidolar ve su kabarcığı (bubble trail) parçacıkları devreye girer.
     * Işıklandırma: Kostik su yansımaları (`caustics`) ve derin okyanus kararması.

2. **Yeraltı Tünelleri ve Sığınaklar:**
   - Dağ kütlesinin içine açılan dev hangar kapılarından giriş.
   - Üst tavan kapalıdır ($Z = 40$ tavan levhası, $Z = -40$ zemin rayları). Çarpışma kutuları dikey eksende kilitlenir.

---

## 3. Katman Yöneticisi (Layer Manager) Mimarisi

Her render karesinde grafik pipeline 6 ayrık katman tamponunda (Layer Pass) sırayla çalışır:

| Katman ID | Katman Adı | Derinlik ($Z$) | İçerik & Efektler | Blend Modu |
|:---:|:---|:---:|:---|:---:|
| **L-SUB** | `Underworld / Trench` | $Z < 0$ | Denizaltı kanyonları, batıklar, tünel rayları | Normal |
| **L-WATER** | `Water Surface` | $Z = 0$ | Okyanus düzlemi, köpükler, dalga ızgarası | Normal |
| **L-SHADOW**| `Shadow Projections` | $Z = 0.5$ | Köprü ayakları, binalar ve uçak gölgeleri | Multiply / Darken |
| **L-SURF** | `Surface Structures` | $0 \le Z \le 120$ | Köprü tabliyesi, kuleler, yatlar, düşmanlar | Normal (Z-Sorted) |
| **L-HERO** | `Player Aircraft / Sub`| $Z_{hero}$ | Oyuncu aracı, motor alevleri, namlu soketleri | Normal + Additive |
| **L-CLOUDS**| `Atmospheric Clouds` | $Z > 120$ | Yüksek irtifa bulut tabakaları, sis perdesi | Alpha Blend (0.6x) |

---

## 4. Harita Veri Formatı (`Map Data Contract`)

Bölümler JSON tabanlı hücre ve segment haritası (`map.json`) olarak tanımlanır:

```json
{
  "stage_id": "STAGE_01_OCEAN_STRAIT",
  "name": "Bosphorus Strait Infiltration",
  "corridor_length_y": 5000,
  "default_direction": "sw_to_ne",
  "biomes": [
    { "from_y": 0, "to_y": 1500, "type": "OPEN_OCEAN", "min_z": 0, "max_z": 200 },
    { "from_y": 1500, "to_y": 3000, "type": "SUSPENSION_BRIDGE", "min_z": 0, "max_z": 200 },
    { "from_y": 3000, "to_y": 4200, "type": "SUBMARINE_TRENCH", "min_z": -150, "max_z": 50, "vehicle_override": "SUB_POD" },
    { "from_y": 4200, "to_y": 5000, "type": "UNDERGROUND_HANGAR", "min_z": -60, "max_z": 40 }
  ],
  "cloud_layers": [
    { "altitude_z": 140, "density": 0.45, "speed_scale": 1.15, "opacity": 0.6 }
  ]
}
```
