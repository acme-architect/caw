# NORM_ORTHOGRAPHIC_PROJECTION (2.5D İzometrik Derinlik ve Ortografik Kamera Normu)

**Kapsam:** ACME İzometrik Oyun Motoru Standardı (`acme-games-iso/`)  
**Kelsen Seviyesi:** Seviye 2 (Alt Domain / 2.5D Spasyal Kural Seti)  
**Yetki:** `DoF = 0`  
**Durum:** KULUÇKA / STAGED (`.upstream/acme-games-iso/`)

---

## 1. Kural Tanımı ve Şartname

1. **Sıfır Perspektif Distorsiyonu (Zero-Perspective Projection):**
   - 2.5D retro ve klasik arcade mekaniklerinde derinlik ekseninde nesne boyutunun mesafeye göre küçülüp büyümesi (perspektif konisi) kesinlikle yasaktır.
   - Tüm 3D'den 2D'ye render süreçleri matematiksel olarak saf **Orthographic Camera** projeksiyonu ile yürütülür.

2. **Ayrık Açı Adımları (Discrete Roll/Yaw Steps):**
   - Eksenel dönüş animasyonları sürekli keyframe interpolasyonu yerine, ayrık açı adımlarına ($360^\circ / N$, varsayılan $N=16$ kare, her adım $22.5^\circ$) bölünmüş sprite şeritleri olarak fırınlanır.
   - Uçağın veya nesnenin burnu $+Z$ doğrusal hareket koridoruna kilitlenir; roll dönüşü bu eksen etrafında gerçekleşir.

3. **İzotropik Piksel Ölçeği:**
   - Ekranda çizilen tüm kareler piksel bazında $1:1$ en-boy oranına ve sabit pivot merkezine ($x = \text{width}/2$, $y = \text{height}/2$) sahip olmak zorundadır.
