# NORM_AUTHORING_TOOL_ISOLATION (Yazar Araçları ve Çalışma Zamanı Yalıtımı Normu)

**Kapsam:** ACME İzometrik Oyun Motoru Standardı (`acme-games-iso/tools/`)  
**Kelsen Seviyesi:** Seviye 2 (Alt Domain / Takımlama ve Yazarlık Mimarisi)  
**Yetki:** `DoF = 0` | Zero-Leakage Invariant  
**Durum:** KULUÇKA / STAGED (`.upstream/acme-games-iso/`)

---

## 1. Kural Tanımı ve Şartname

1. **Geliştirici Tezgâhı ve Runtime Kesin Ayrışımı (Strict Authoring Isolation):**
   - 2.5D izometrik oyun motorunda görsel kalibratörler, soket tuner araçları ve 3D'den 2D'ye render fırınlama boru hatları (`tools/`), son kullanıcıya dağıtılacak oyunun çalışma zamanından (`src/`, `index.html`) kesin olarak ayrılır.
   - Geliştirici tezgâhı 3D uzayda (WebGL, Three.js, Python/Blender CLI) serbestçe çalışır.
   - Çalışma zamanı motoruna (runtime) kesinlikle 3D kütüphaneler (`three.js`, `loaders`), dev araçları veya ham 3D modeller (`.obj`, `.glb`) sızdırılamaz.

2. **Yalnızca Deterministik Çıktı Aktarımı (Artifacts Only):**
   - Çalışma zamanına aktarılan tek varlıklar:
     * Fırınlanmış 2D sprite şeritleri veya atlasları (RGBA PNG).
     * 2D soket koordinat ve derinlik tabloları (`sockets.json`).
     * Deterministik hash kayıtları (`state.json`).

3. **Sıfır Sızıntı Değişmezi (Zero-Leakage Invariant):**
   - Dağıtım (bundle/dist) aşamasında `tools/` veya `.upstream/` klasörleri oyun paketine dahil edilemez.
   - Herhangi bir aracın runtime kod tabanında `import` veya `require` edilmesi derleme hatası (build failure) üretir.

