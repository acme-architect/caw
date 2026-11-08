# CASE: CAS_002_ASSET_PIPELINE_RIGOR_AND_VISUAL_FIRST_INTERFACING

- **Case ID:** `CAS_002`
- **Project:** `client-core`
- **Type:** `PROCEDURAL_ESCALATION`
- **Reference Invariants:** `INV_AST_001_fidelity_tier`, `INV_AST_002_remake_paradigm`, `PRE_002`
- **Authority:** ACME Lex Superior `v3.2.0` (`DoF = 0`, Article 14 `INV-LOCAL-COUNTER-SCOPE-02`, Article 15 `INV-PIPELINE-EXPANSION`)
- **Status:** `RATIFIED_LOCAL_ESCALATED_UPSTREAM`

---

## 1. Empirik Hata Tespiti & Sürtünme Analizi (Friction Log)

1. **Gövde / Ekstremite Kırpılma Hatası (Extreme Aspect Ratio Truncation):**
   - *Kök Neden:* Savaş uçakları gibi yüksek en/boy oranına ($\approx 4:1$) sahip 2D nesnelerde, tek eksenli ölçekleme ($target\_height$) uygulandığında genişlik tuval sınırlarını aşmakta; burun ve kuyruk pikselleri kadraj dışına taşarak budanmaktadır.
2. **Kromatik Kenar Bozulması (White Fringe / Anti-Aliasing Bleed):**
   - *Kök Neden:* Beyaz arka planlı üretimlerde alfa eşikleme uygulandığında uçağın açık renkli gövde pikselleri ile arka plan pikselleri kaynaşmakta ve kenarlarda beyaz saçaklanma kalmaktadır.
3. **Perspektif Bozulması (Isometric Leakage):**
   - *Kök Neden:* Standart promptlarda model hafif üst/izometrik açılara kaçarak 2D side-scroller için gereken 0° ortografik düzlemi bozmaktadır.
4. **Metinsel İletişim Yetersizliği:**
   - *Kök Neden:* Görsel varlık geliştirmelerinde metin tabanlı açıklamalar denetim zaafı yaratmaktadır. Biyolojik mimarın denetimi daima yaşayan interaktif görsel doküman (artefakt) üzerinden yürütülmelidir.

---

## 2. Üst Norma İletilen Bağlayıcı Kurallar (Proposed Invariant Rules, `DoF = 0`)

### Kural 1: `INV-SPRITE-FIT-01` (Dual-Axis Bounding-Box Confinement)
Hiçbir 2D oyun varlığı tek eksenli sabit boyut ile ölçeklenemez. Ölçekleme faktörü daima iki eksenin minimumu alınarak hesaplanmak zorundadır:
$$\text{scale} = \min\left(\frac{W_{box} - 2 \cdot P}{W_{content}}, \frac{H_{box} - 2 \cdot P}{H_{content}}\right)$$
(Burada $P \ge 8\text{ px}$ güvenlik kenar payıdır). Bu kural ihlal edilirse `REJECT_TRUNCATED_SPRITE` kapısı tetiklenir.

### Kural 2: `INV-CHROMA-ISOLATION-02` (High-Contrast Chroma Key Requirement)
Görsel üretim motoruna iletilen promptlarda nesne rengiyle zıt kontrastlı arka plan rengi (askeri nesneler için saf yeşil `#00FF00` veya saf eflatun `#FF00FF`) zorunludur. Alfa kanalı ayrıştırması toleranslı renk anahtarı (Chroma Key Matting) ile yapılacaktır.

### Kural 3: `INV-ORTHO-PERSPECTIVE-03` (Zero-Roll-Pitch-Yaw Invariant)
Side-scroller oyun varlıkları için `Roll = 0°, Pitch = 0°, Yaw = 0°` kesin olarak kilitlenir. Prompt şablonuna `no 3/4 view, no isometric angle, zero perspective depth, pure elevation side-view` negatif kısıtları zorunlu eklenir.

### Kural 4: `INV-VISUAL-FIRST-DOC-04` (Mandatory Visual Artifact Gate)
Varlık veya sahne geliştirme adımlarında metinsel özet tek başına kabul edilemez. Üretilen her varlık, aynı anda `<conversation_artifact>/` altına render edilen interaktif görsel doküman (`.md` / `<img>`) üzerinden biyolojik mimara sunulmak zorundadır.

---

## 3. Upstream Dispatch Hazırlığı

- **Hedef Dal:** `cases/client-core/CAS_002_asset_pipeline_rigor`
- **Etki Alanı:** `norms/procedural/`, `templates/CAS_TEMPLATE.md`, `precedents/core/PRE_002`

