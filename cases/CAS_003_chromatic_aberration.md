# CASE: CAS_003_CHROMATIC_ABERRATION_AND_KINETIC_SHOCKWAVE

- **Case ID:** `CAS_003`
- **Project:** `client-core`
- **Type:** `FEATURE_SPECIFICATION`
- **Feature:** Chromatic Aberration & Visual Shockwave FX (Kromatik Sapma)
- **Authority:** ACME Lex Superior `v3.2.0` (`DoF = 0`, Article 10 Zero-Rhetoric, Article 16 Inception)
- **Status:** `SPEC_FROZEN`

---

## 1. Operasyonel Amaç & Tetikleyiciler (Telos & Triggers)

Kromatik sapma (RGB kanal ayrışması), arcade hissini artıran kinetik bir görsel geri bildirim aracıdır. Rastgele veya sürekli açık kalarak göz yormaması için strictly bounded (kesin matematiksel sınırları olan) bir etki olarak tasarlanmıştır.

### Tetiklenme Durumları:
1. **Ağır Patlamalar (Heavy Explosion):** Boss parçası veya ağır zırhlı düşman imha edildiğinde ($I = 6.0\text{ px}$).
2. **Taktik Bomba (Tactical Bomb):** Ekranı temizleyen nükleer şok dalgası patladığında ($I = 12.0\text{ px}$).
3. **Kritik Hasar / Gövde Darbesi (Hull Breach):** Oyuncu büyük hasar aldığında ($I = 4.0\text{ px}$).

---

## 2. Matematiksel Model ve Sönümleme Zarfı (`DoF = 0`)

- **Maksimum Şiddet Tavanı:** $I_{max} = 12.0\text{ px}$ (Görsel deformasyonun oyunu oynanamaz hale getirmesini engeller).
- **Kanal Ayrışma Yönleri:**
  - Kırmızı Kanal ($R$): Sol-Üst vektör $\vec{d}_R = (-1, -0.5) \cdot I$
  - Yeşil Kanal ($G$): Merkez $\vec{d}_G = (0, 0)$ (Referans sabit)
  - Mavi Kanal ($B$): Sağ-Alt vektör $\vec{d}_B = (+1, +0.5) \cdot I$
- **Üstel Sönümleme (Decay Formula):**
  $$I_{t+1} = I_t \cdot e^{-\lambda \Delta t}, \quad \text{burada } \lambda = 14.0\text{ s}^{-1}$$
  ($I < 0.2\text{ px}$ olduğunda şiddet sıfırlanır; tam etki en fazla $250\text{ ms}$ sürer).

---

## 3. Saf Canvas 2D API Uygulama Yöntemi (Sıfır Dış Bağımlılık)

Harici WebGL/Shader kütüphanesi olmadan saf Canvas 2D'de 60 FPS performansla kromatik sapma üretme sözleşmesi:
1. Renderlanan ana oyun karesi bir `OffscreenCanvas` veya geçici buffer'a alınır.
2. Ana tuvalde kompozit modu (`globalCompositeOperation = 'screen'` veya `lighter`) kullanılır:
   - Buffer, sol offset $(-I_x, -I_y)$ ile sadece Kırmızı filtreyle çizilir.
   - Buffer, merkezde Yeşil filtreyle çizilir.
   - Buffer, sağ offset $(+I_x, +I_y)$ ile Mavi filtreyle çizilir.
3. $I = 0$ iken bu işlem tamamen atlanır (Bypass), sıfır performans maliyeti sağlanır.

