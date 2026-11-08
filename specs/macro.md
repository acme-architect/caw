# MİMARİ İCRA MAKROSU & SİSTEMLER SÖZLEŞMESİ: `specs/macro.md`

> **Norm:** ACME Lex Superior `v3.2.0` (`DoF = 0`, Article 16 `INV-MACRO-REPRODUCIBILITY-01`)  
> **Durum:** SPECIFICATION ONLY (Sıfır Kod / Tamamlanmış Deterministik Makro Tasarımı)  
> **Kapsam:** Stage 1 ("Regain Tokyo") Dikey Kesiti (Vertical Slice) & Varlık / Projeksiyon Standartları

---

## 1. ASSET CALIBRATION MACRO (F-14 TOMCAT)

Tüm kahraman uçak görsel varlıkları ve türetilmiş sprite/soket verileri aşağıdaki deterministik kalibrasyon parametrelerine kilitlenmiştir:

```yaml
asset_id: hero_f14_tomcat
source_model: "assets/models/f14.glb"
camera:
  projection: "orthographic"
  pitch_deg: 22.5
  fov: 0
rotation_angles: 16 # 0° .. 337.5° (22.5° steps)
resolution:
  frame_width: 512
  frame_height: 256
  sheet_layout: "16x1 horizontal strip (8192x256) or 4x4 atlas (2048x1024)"
invariants:
  - "child.isMesh: DoubleSide = true (Backface culling disabled)"
  - "child.material.transparent = false (Disable missing alpha transparency)"
  - "child.castShadow = true, child.receiveShadow = true"
sockets:
  engine_L:
    position_local: [-18.5, -4.2, -42.0]
    purpose: "Left afterburner flame & particle emitter"
  engine_R:
    position_local: [18.5, -4.2, -42.0]
    purpose: "Right afterburner flame & particle emitter"
  gun_muzzle:
    position_local: [-6.8, -1.5, 34.0]
    purpose: "M61A1 Vulcan cannon muzzle flash and projectile spawn"
  nav_light_L:
    position_local: [-52.0, 1.8, -12.0]
    purpose: "Port wingtip red strobe light"
  nav_light_R:
    position_local: [52.0, 1.8, -12.0]
    purpose: "Starboard wingtip green strobe light"
```

### 1.1 Varlık Soykütüğü ve Fırınlama DAG (Lineage Build Step)
- **DEPENDS:** `["assets/models/f14.glb"]`
- **INPUTS:** `["assets/models/f14.glb"]`
- **OP:** `"python scripts/render_spritesheet.py --model assets/models/f14.glb --angles 16 --pitch 22.5 --out .tmp/f14_sheet.png"`
- **OUT:** `".tmp/f14_sheet.png"`
- **ASSERT:** `file_exists(".tmp/f14_sheet.png") && verify_hash_updated("assets/models/f14.glb")`
- **PRE_FLIGHT:** `"python scripts/check_assets.py"`

---

## 2. WORLD FLOW & PROJECTION MACRO

Oyun dünyası 3D Kartezyen uzayda ($X, Y, Z$) modellenir ve ekrana 2.5D diyagonal aksonometrik projeksiyon matrisi ile yansıtılır.

### 2.1 İzdüşüm Matrisi (Axonometric Flight Corridor)
Ana uçuş koridoru $Y$ eksenindedir (Sol-Alt $\rightarrow$ Sağ-Üst / Viewpoint arcade standardı). Sahne ters yönde (Sağ-Üst $\rightarrow$ Sol-Alt) akar.

$$\begin{aligned}
relY &= Y_{world} - CameraY \\
ScreenX &= \frac{W_{canvas}}{2} + (X_{world} - relY) \times 1.5 \\
ScreenY &= \frac{H_{canvas}}{2} + (X_{world} + relY) \times 0.75 - Z_{world} \times 1.2
\end{aligned}$$

- $W_{canvas} = 1920$, $H_{canvas} = 1080$ (16:9 Full HD).
- Dikey derinlik çarpanı: $Z_{ratio} = 1.2$ ($Z$ ekseni arttıkça nesne dikeyde yukarı yükselir ve gölgesinden ayrılır).
- Görsel Gölge İzdüşümü: $Z_{world} = 0$ (Su/Zemin düzleminde):
  $$\begin{aligned}
  ShadowX &= ScreenX \\
  ShadowY &= \frac{H_{canvas}}{2} + (X_{world} + relY) \times 0.75
  \end{aligned}$$

### 2.2 Katman ve Hız Ayrışımı (Speed Layer Decomposition)
Köprü pilonları, tabliye ve ayaklar gibi rijit yapılar asla hız gradyanı ile parçalanamaz ($1.0\times$ locked). Hız ayrışımı yalnız derinlik katmanları arasında geçerlidir:

| Katman Kodu | Katman Tanımı | İrtifa ($Z_{world}$) | Hız Katsayısı | Render Sırası & Notlar |
| :--- | :--- | :--- | :--- | :--- |
| **L-SUB** | Denizaltı Kanyonu / Derin Hendek | $[-100, -20]$ | $0.60\times$ | Sualtı kayaları, batık kalıntıları, koyu mavi sis |
| **L-WATER** | Deniz Yüzeyi & Dalga Matrisi | $[0]$ | $0.75\times$ | İzotropik dalga deseni ve dinamik köpükler |
| **L-SHADOW**| Gölgeler | $[0.1]$ | $1.00\times$ | Araç ve yapıların zemine düşen yarı şeffaf gölgeleri |
| **L-SURF**  | Rijit Yapılar & Kara / Deniz Taşıtları | $[0, 40]$ | $1.00\times$ | Asma köprü (ayak+tabliye+kule), hücumbotlar, konvoy |
| **L-HERO**  | Aktif Uçuş / Çatışma Koridoru | $[60, 100]$ | $1.00\times$ | F-14 Tomcat ($Z=80$), düşman uçakları, mermiler, POW |
| **L-CLOUDS**| Üst İrtifa Bulut Örtüsü & Sis | $[120, 180]$ | $1.15\times$ | Yarı saydam sirrüs bulutları, atmosferik duman |

---

## 3. STAGE 01 EXECUTION TIMELINE (10-MINUTE MACRO)

Carrier Air Wing Operasyonu: **"Regain Tokyo"** dikey kesiti (00:00 - 10:00). Zaman deterministik frame sayısına ($60\text{ FPS}$, $\Delta t = 1/60\text{ s}$) bağlıdır.

```text
00:00        01:30             04:00               07:00              09:00        10:00
  ├── Katapult ──┼── Körfez & Flak ──┼── Viyadük Konvoyu ──┼── Boss: Dreadnought ──┼── Hangar ──┤
  │ (Launch)     │   (Hücumbotlar)   │   (Köprü / Tren)    │   (Fortress Gunship)  │   (Landing)│
```

### 3.1 Faz Ayrımı ve Olay Dağılımı

1. **[00:00 - 00:30] CATAPULT LAUNCH (Kalkış Sekansı):**
   - Taşıyıcı gemi (USS Nimitz güvertesi) $Y \in [0, 500]$.
   - $T=0$: Katapult buharı salınımı, afterburner ateşlemesi ($Z=10 \rightarrow 80$).
   - $T=15\text{s}$: Güverte sonu, deniz seviyesine yükseliş, HUD ve kontrollerin oyuncuya devri.

2. **[00:30 - 02:30] WAVE 1: KÖRFEZ DEVRİYESİ (MiG-21 Formasyonları):**
   - 3 dalga halinde 5'li MiG-21 V-formasyonu ($Z=80$).
   - 3. dalganın filo lideri (Kırmızı boyalı): İmha edildiğinde periyodik POW Kapsülü düşürür.
   - Deniz seviyesinde ($Z=0$) 4 hücumbot: Çapraz flak atışları ($V_b = 350\text{ px/s}$).

3. **[02:30 - 05:00] WAVE 2: ASMA KÖPRÜ VE VİYADÜK YARMASI:**
   - Dev asma köprü kuleleri ($Z \in [0, 120]$) arasından uçuş.
   - Tabliye üzerinde seyreden hava savunma zırhlı konvoyu ($Y$ ekseninde $1.0\times$ hız).
   - Mi-24 Hind helikopterleri alçak irtifadan ($Z=40$) roket salvo atışı yapar.

4. **[05:00 - 08:30] WAVE 3: FORTRESS DREADNOUGHT (Boss Karşılaşması):**
   - Siren ve radyo anonsu: "WARNING: HEAVY AIR CRUISER APPROACHING".
   - 3 Fazlı Boss Mimarisi:
     * **Faz 1 (Motorlar):** 4 yan motor ($4 \times 150\text{ HP}$). Gövde zırhı $\%90$ hasar absorpsiyonunda.
     * **Faz 2 (Taretler):** Üst ve alt flak bataryaları ($2 \times 200\text{ HP}$). Spiral mermi paterni.
     * **Faz 3 (Çekirdek):** Açılan plazma reaktörü ($800\text{ HP}$). İmha olunca parçalanarak denize düşüş animasyonu.

5. **[08:30 - 10:00] ARRESTING GEAR LANDING & HANGAR ARMORY:**
   - Uçak gemisine geri dönüş yaklaşması, iniş takımlarının açılması ($Z \rightarrow 10$).
   - 3 numaralı yakalama teline (3-wire) takılma ve duruş.
   - Görev sonu skor/para dökümü ve Hangar Mağazası (Silah upgrade, Zırh, AIM-54 Phoenix ikmali).

---

## 4. ACCEPTANCE GATES (DoD - DEFINITION OF DONE)

Bir sürümün veya kod icrasının kabul edilebilmesi için aşağıdaki kapıların tamamı yeşil olmalıdır:

1. **GATE-COMPILATION-01:**
   - Kod tabanı sıfır harici paket veya derleyici gerektirmeden, modern tarayıcıda doğrudan (`file://` veya hafif statik HTTP sunucuyla) çalışır.
   - Tarayıcı konsolunda hiçbir syntax, runtime veya kaynak yükleme (404) hatası bulunamaz (`Zero Console Error`).

2. **GATE-ASSET-LINEAGE-01:**
   - `python scripts/check_assets.py` komutu tüm 3D modeller ve türev varlıklar için hash doğrulaması yaparak 0 hata kodu (`exit code 0`) döndürür.

3. **GATE-DETERMINISTIC-FPS-01:**
   - Fizik ve mantıksal motor sabit 60 FPS ($\Delta t = 16.666\text{ ms}$) altında, bellek sızıntısı olmadan (GC çöp tahsisi sıfıra yakın, bellek $\le 64\text{ MB}$) kesintisiz icra edilir.

4. **GATE-PROJECTION-FIDELITY-01:**
   - 2.5D aksonometrik projeksiyon matrisi, belirtilen formül ($1.5$ yatay, $0.75$ dikey, $1.2$ $Z$ çarpanı) ile kusursuz paralaks ve gölge izdüşümü üretir; rijit nesnelerde yırtılma oluşmaz.
