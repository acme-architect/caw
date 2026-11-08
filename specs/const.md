# CONSTRAINTS & INVARIANTS: `specs/const.md`

> **Normative Authority:** ACME Ecosystem (Lex Superior `v3.2.0`, `DoF = 0`)  
> **Classification:** Fiili Kod ve Çalışma Alanı Kısıtları

---

## 1. Fiziksel ve Donanımsal Kısıtlar (Runtime Environment)

1. **`CONST-NO-DEP` (Sıfır Harici Çalışma Zamanı Kütüphanesi):**
   - Phaser, PixiJS, Three.js veya harici bir oyun motoru KULLANILAMAZ.
   - Tüm render işlemleri saf **HTML5 Canvas 2D Context API** (`CanvasRenderingContext2D`) ile yürütülür.
   - Tüm ses sentezi saf **Web Audio API** (`AudioContext`) üzerinden osilatörler, gürültü düğümleri ve kazanç zarflarıyla yapılır.

2. **`CONST-TIMESTEP` (Deterministik Sabit Zaman Adımı):**
   - Fizik, çarpışma ve durum güncellemeleri sabit $\Delta t = 1/60\text{ s} \approx 16.666\text{ ms}$ ile hesaplanır.
   - Frame atlamalarında alt-adım tavanı ($dt_{sub} \le 0.033\text{ s}$) ile delta-spike koruması uygulanır.

3. **`CONST-ZERO-GC` (Render Döngüsünde Sıfır Çöp Tahsisi):**
   - Oyun döngüsü (`tick`/`draw`) sıcak yolunda kesinlikle dinamik heap tahsisi (`new Object()`, `new Array()`, `Array.filter()`, `Array.map()`) yapılamaz.
   - Mermiler (Bullets $\ge 500$), Parçacıklar (Particles $\ge 1000$) ve Düşmanlar (Enemies $\ge 100$) önceden tahsis edilmiş sabit kapasiteli **Nesne Havuzları (Object Pools)** ile yönetilir.
   - Bellek tavanı: $\le 64\text{ MB}$.

4. **`CONST-VIEWPORT` (Mantıksal ve Fiziksel Çözünürlük):**
   - Dahili mantıksal render alanı: **$1920 \times 1080$** (16:9 Full HD).
   - Canvas boyutu dinamik olarak tarayıcı penceresine göre `letterbox` (siyah kenar koruması) ile en-boy oranını bozmadan otomatik ölçeklenir.

5. **`CONST-DOF-0` (Sıfır Serbestlik Derecesi):**
   - Rastgele, şartnamede yer almayan sihirli sayılar (*magic numbers*) kod içinde bulunamaz.
   - Tüm hasar, hız, yarıçap ve süre parametreleri sabit konfigürasyon tablolarından beslenir.

6. **`INV-ASSET-LINEAGE-01` (Deterministik Varlık Soykütüğü & Content Hash Invalidation):**
   - Hiçbir türetilmiş varlık (spritesheet, atlas, ses) kaynak dosyasından bağımsız varoluşa sahip olamaz.
   - Her türev çıktı, üretildiği kaynak dosyanın (3D model, ses, SVG) SHA-256 içeriğine doğrudan kilitlenir.
   - Kaynak dosyanın hash değeri değiştiğinde ($H_{yeni} \ne H_{eski}$), türetilmiş çıktılar derhal `DIRTY` (bayat) ilan edilir ve çalışma zamanına kabul edilmeyerek zorunlu olarak yeniden fırınlanır (`re-bake`).

7. **`INV-SCAFFOLD-ONTOLOGY-01` (Tek Yönlü Şablon Örnekleme - Pull-Not-Push):**
   - Üst depolar (ACME ve domain çekirdekleri), alt şantiyelere doğrudan dosya yazamaz (push yasağı).
   - Tüm proje iskeleleri ve başlangıç sözleşmeleri üst deponun `templates/scaffolds/` kataloğundan alt şantiye tarafından tek seferlik çekilir (`instantiate/pull`).
   - Şantiye içindeki geçici kuluçka varlıkları yalnızca `.upstream/` altında tutulur.

8. **`INV-UPSTREAM-STAGING-01` (4 Kademeli Kelsen Süzgeci):**
   - Her vaka (`cases/`) çözüldüğünde ve kural doğrulandığında şu süzgeçten geçer:
     * **Seviye 1 (Lokal):** Projeye özgü uçuş/görsel verileri -> `specs/` içinde kalır.
     * **Seviye 2 (Alt Domain):** 2.5D izotropik derinlik ve soket kuralları -> `.upstream/acme-games-iso/`
     * **Seviye 3 (Domain):** Oyun döngüsü, 60 FPS delta zamanı, ses ducking -> `.upstream/acme-games/`
     * **Seviye 4 (Evrensel):** Deterministik $DoF=0$, hash soykütüğü -> `.upstream/acme/`

9. **`INV-TOOL-GRADUATION-01` (Yerel Araçların Üst Katmana Mezuniyeti - Tool Promotion):**
   - **Yaşam Döngüsü (3 Aşama):**
     * **Aşama 1 (Lokal İskele):** Araç `tools/` altında, doğrudan bu projeye (F-14 / asset yolları) bağlı olarak inşa edilir ve çalıştırılır.
     * **Aşama 2 (Parametrik Ayrıştırma):** Proje tamamlanırken araç hardcoded dosya yollarından ve modele özgü değişkenlerden arındırılır; jenerik sürükle-bırak / CLI formatına getirilir.
     * **Aşama 3 (Üst Katmana Terfi):** Genelleştirilen araç, ait olduğu katmanın kuluçka dizinine kopyalanır:
       - Derleme ve Hash Takip Araçları (örn. `check_assets.js` / `py`) -> `.upstream/acme/tools/`
       - 2.5D Fırınlama ve Soket Kalibratörleri (örn. `tuner.html` / `asset_viewer.html`) -> `.upstream/acme-games-iso/tools/`
   - **Çalışma Zamanı Yalıtımı (Runtime Isolation):**
     * `tools/` ve `.upstream/*/tools/` içindeki hiçbir araç, dağıtılacak oyunun (`src/`) nihai bundle'ına dahil edilemez (Zero-Leakage Invariant).

