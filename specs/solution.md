# SYSTEM SOLUTION & ARCHITECTURAL BLUEPRINT: `solution.md`

> **Normative Authority:** ACME Lex Superior `v3.2.0` (`DoF = 0`)  
> **Target Project:** `client-core` (Carrier Air Wing HD Remake)  
> **Status:** RATIFIED ARCHITECTURAL SPECIFICATION (SPEC ONLY - ZERO CODE)

---

## 1. MİMARİ STRATEJİ VE ÇÖZÜM FELSEFESİ

Bu çözüm; harici hiçbir oyun motoru veya kütüphane (Phaser, PixiJS, vb.) kullanmaksızın, doğrudan modern tarayıcıların saf **HTML5 Canvas 2D API** ve **WebAudio API** yetenekleri üzerinde sıfır çöp toplama yükü (**Zero-GC**) ile çalışan deterministik bir 60 FPS arcade motoru mimarisidir.

Tüm sistem, `specs/problem.md` dosyasında tespit edilen 10 yapısal boşluğu (`GAP-01` ila `GAP-10`) çözmek üzere 4 katmanlı bir modüler mimari olarak yapılandırılmıştır:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SUNUM & ARAYÜZ KATMANI                          │
│        Diegetic Avionics HUD + Hangar Armory Shop State Controller     │
├────────────────────────────────────────────────────────────────────────┤
│                       OYUN MANTIĞI & SİSTEMLER                         │
│   WeaponSystem (Vulcan L1-6) │ StageManager (Timeline) │ ItemDropSystem │
│   BossDreadnought (3-Faz FSM)│ DualEconomy (Fuel/Armor)│ CollisionSystem│
├────────────────────────────────────────────────────────────────────────┤
│                       FİZİK & RENDER KATMANI                           │
│   FighterRig (5-Durumlu Banking) │ ParallaxViewport (4-Katman Modulo)  │
│   CompoundHitbox (3-Hacim)       │ Canvas2DRenderer (Sprite/Particle)  │
├────────────────────────────────────────────────────────────────────────┤
│                       ÇEKİRDEK & DONANIM HATTI                         │
│   DeterministicClock (dt=1/60s)  │ BoundedObjectPools (Zero-GC)        │
│   AssetLoader (Preload/Fallback) │ AudioSynthesizer (Prosedürel DSP)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MODÜLER BİLEŞEN SÖZLEŞMELERİ (COMPONENT CONTRACTS)

### 2.1 Çekirdek Altyapı (`src/core/`)
1. **`Clock` (`DeterministicClock`):**
   - Sabit delta zaman $\Delta t = 1/60\text{ s}$ üretir.
   - Ekran yenileme hızı 120Hz/144Hz olsa dahi fizik adımlarını akümülatör ile $16.66\text{ ms}$'ye kilitler. Alt-adım tavanı $\le 0.033\text{ s}$.
2. **`ObjectPool` (`BoundedObjectPool`):**
   - Mermiler (500 adet), Düşmanlar (100 adet), Parçacıklar (1000 adet) ve Ganimetler (50 adet) için oyun başlamadan önce sabit bellek tahsis eder.
   - Çalışma anında (`tick`) asla `new` anahtar kelimesi çağrılmaz; $O(1)$ sürede serbest nesne alınır ve iade edilir (`Zero-GC`).
3. **`AssetLoader` (`PreloadTurnstile` - GAP-10 Çözümü):**
   - Oyun başlamadan önce tüm `.png` varlıklarını asenkron doğrular.
   - Eksik veya hatalı dosya tespit edilirse `ING_001` uyarınca karantinaya alır ve oyunun çökmemesi için deterministik geometrik yedek (*vector fallback*) çizer.

### 2.2 Pre-rendered 3D-to-2D Sprite Architecture (3D Model Tabanlı Render Hattı)
> **Not:** Difüzyon tabanlı 2D generatif sprite üretiminin ürettiği zamansal tutarsızlık ve geometrik deformasyonlar nedeniyle generatif hat tamamen iptal edilmiştir.
1. **Varlık Geometrisi:** Sabit ve deterministik F-14 3D Mesh (`.glb` / `.obj` veya usulüne uygun prosedürel Three.js mesh).
2. **Projeksiyon:** `OrthographicCamera` (Sıfır perspektif distorsiyonu, katı matematiksel izdüşüm).
3. **Dönüş Ekseni:** Z Ekseni (Heading / Yaw / Roll), 16 ayrık açı adımı ($22.5^\circ$ aralıklarla $360^\circ$ tam döngü).
4. **Render Motoru:** Headless Three.js / Puppeteer veya Python CLI render hattı.

### 2.3 Render ve Görsel Kinematik (`src/render/` & `src/game/`)
1. **`CanvasRenderer` (GAP-01 Çözümü):**
   - $1920 \times 1080$ mantıksal render tavanını yönetir; tarayıcı penceresine göre en-boy oranını bozmadan otomatik letterbox ölçeklemesi yapar.
   - Yeni üretilen şeffaf Full HD jet sprite'larını (`f14_hd.png`, vb.) tuvale tam ortalanmış ve kesintisiz aktarır.
2. **`FighterRig` (GAP-02 Çözümü):**
   - Dikey girdi türevine göre $-0.32\text{ rad}$ ile $+0.32\text{ rad}$ arasında sönümlü eğim hesaplar.
   - 5 ayrık duruma (`STEEP_CLIMB`, `MILD_CLIMB`, `NEUTRAL`, `MILD_DIVE`, `STEEP_DIVE`) göre sprite oryantasyonunu ve egzoz alevi koordinatlarını günceller.
3. **`PostProcessFX` (Kromatik Sapma / CAS_003):**
   - Ağır patlama ve mega bomba anlarında RGB kanallarını zıt eksenlere kaydırarak ($I \le 12\text{ px}$) sinematik şok dalgası ve optik sapma üretir; $250\text{ ms}$ içinde üstel sönümlenir.
4. **`ParallaxViewport` (GAP-09 Çözümü):**
   - 4 bağımsız katmanı (Gökyüzü $0.08\times$, Şehir $0.25\times$, Viyadük $0.60\times$, Deniz $0.90\times$) modulo kaydırma formülüyle ($x = -(X \cdot k) \pmod{1920}$) kesintisiz döngüye sokar.
4. **`CollisionEngine` (GAP-03 Çözümü):**
   - $4:1$ uçak gövdesi için 3 merkezli dairesel bileşik hitbox hacmini (Burun $r=14$, Gövde $r=20$, Kuyruk $r=16$) işletir.

### 2.3 Savaş, Ekonomi ve Boss Sistemleri (`src/game/`)
1. **`WeaponSystem` (GAP-06 Çözümü):**
   - 1'den 6'ya kadar seviyelenen Vulcan topu saçılma formülünü ve ikincil güdümlü mühimmatları ateşler.
2. **`ItemDropSystem` (GAP-06 Çözümü):**
   - Kırmızı öncü düşmanlar düştüğünde havada $2.0\text{ s}$ periyotla Kırmızı $\rightarrow$ Yeşil $\rightarrow$ Mavi renk değiştiren POW kapsülünü yönetir.
3. **`DualEconomySystem` (GAP-07 Çözümü):**
   - Zamanla eriyen yakıt ($1.5\text{ birim/s}$) ile zırh korumasını yönetir. Zırh bitince hasarın doğrudan yakıtı eritmesini ve sıfır yakıtta motorun susarak spiral dalışla çakılmasını sağlar.
4. **`BossDreadnought` (GAP-05 Çözümü):**
   - 3 fazlı modüler Uçan Kale durum makinesi: 4 Motor $\rightarrow$ 2 Taret $\rightarrow$ Açılan Reaktör Çekirdeği.
5. **`ShopManager` (GAP-08 Çözümü):**
   - Bölüm sonu hangar arayüzünde kazanılan fonların harcanmasını ve cephanenin bir sonraki bölüme taşınmasını garanti eder.

### 2.4 Ses Tasarımı (`src/audio/`)
1. **`AudioSynthesizer`:**
   - Sıfır dış ses dosyası bağımlılığıyla; WebAudio API osilatörleri, frekans modülasyonu ve beyaz gürültü filtreleriyle 60 FPS'e kilitli eşzamanlı gatling sesi, motor vızıltısı ve bas patlama sesleri üretir.

---

## 3. VERİ AKIŞI VE DÖNGÜ YAŞAM DÖNGÜSÜ

```text
[Tarayıcı requestAnimationFrame]
              │
              ▼
    [Clock.tick(currentTime)]
              │
              ├──> [Sabit 60 FPS Adımları (dt = 1/60s)]:
              │      1. InputBus.poll() (Klavye / Gamepad)
              │      2. FighterRig.update(dt) (Banking & Pozisyon)
              │      3. WeaponSystem.update(dt) (Mermi hareketleri)
              │      4. StageManager.update(dt) (Düşman spawn & Boss FSM)
              │      5. CollisionEngine.check() (3-Hacim Hitbox & Hasar)
              │      6. DualEconomy.update(dt) (Yakıt tüketimi & Can)
              │
              └──> [Interpolated Render]:
                     1. CanvasRenderer.clear() (Kamera sarsıntısı offseti)
                     2. ParallaxViewport.draw(scrollX)
                     3. ObjectPools.drawActive(Renderer)
                     4. HUDController.draw(Yakıt, Zırh, Skor, Silah)
```

---

## 4. DAĞITIM VE DOĞRULAMA PLANI
- Proje tek bir statik web kökü olarak çalışır (`index.html`).
- Hiçbir derleme (build), paketleme (bundler) veya npm bağımlılığı gerektirmez.
- Tüm mimari bileşenler `tests/` altındaki mekanik doğrulama testleriyle (`verify.py`) anayasal düzeyde kilitlenir.

