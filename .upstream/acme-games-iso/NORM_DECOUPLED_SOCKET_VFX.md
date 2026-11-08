# NORM_DECOUPLED_SOCKET_VFX (Ayrık Soket VFX ve Parçacık Mimari Normu)

**Kapsam:** ACME İzometrik Oyun Motoru Standardı (`acme-games-iso/`)  
**Kelsen Seviyesi:** Seviye 2 (Alt Domain / Görsel Katman ve Soket Mimarisi)  
**Yetki:** `DoF = 0`  
**Durum:** KULUÇKA / STAGED (`.upstream/acme-games-iso/`)

---

## 1. Kural Tanımı ve Şartname

1. **Efekt Fırınlama Yasağı (No Baked VFX In Mesh/Sprites):**
   - Motor alevleri (afterburner/exhaust plume), silah namlu parlamaları (muzzle flash), seyrüsefer flaşörleri ve mermi izleri kesinlikle 3D modelin geometrisine veya 2D sprite şeridinin içine fırınlanamaz.
   - Tüm sprite dokuları şeffaf (Alpha = 0) ve saf araç gövdesini içerecek şekilde temiz tutulur.

2. **2D Ekran Soket Haritası (`sockets.json`):**
   - 3D dünyadaki kritik bağlantı noktaları (`muzzle`, `engine_L`, `engine_R`, `wingtip_L`, `wingtip_R`) her render karesi için ortografik projeksiyonla 2D piksel uzayına (`x, y, depth_z`) aktarılır.
   - Çalışma zamanı motoru (runtime), bu JSON koordinat tablosunu okuyarak ilgili efektleri araç üzerine dinamik olarak bağlar.

3. **Derinlik ve Katmanlama Sıralaması (Z-Depth Sorting):**
   - Her soket noktası taşıdığı `depth_z` değeri sayesinde, aracın $360^\circ$ roll manevrası sırasında gövdenin arkasında mı yoksa önünde mi kaldığını matematiksel olarak runtime'a bildirir.
   - Arkada kalan efektler (örn. ters uçuşta üstte kalan egzoz alevi) doğru render katmanında çizilir.

