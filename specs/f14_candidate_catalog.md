# F-14 Tomcat 3D Model Aday Kataloğu

**Kapsam:** `solution-b` (Carrier Air Wing Remake)  
**Doktrin:** Gatekeeper / Pre-Flight Invariant (İndirme ve Render Yasak - Yalnızca Şartname Kataloğu)  
**Tarih:** 2026-11-08  
**Hedef Dosya:** `specs/f14_candidate_catalog.md`

---

## 1. Aday Karşılaştırma Matrisi

| No | Model Adı | Kaynak / URL | Lisans | Poligon (Poly/Vert) | Format | Ayrık Parça Durumu (Kanat, Dümen, Gövde) | Notlar & Varlık Uygunluğu |
|:--:|:---|:---|:---:|:---:|:---:|:---|:---|
| **01** | **FlightGear Official F-14B Tomcat** *(Mevcut Referans)* | [FlightGear FGAddon / FGMEMBERS f-14b](https://github.com/FGMEMBERS/f-14b) | **GPL-2.0+** | ~23.3k Verts / 30.4k Tris | `.ac` / `.obj` / `.xml` | **Tam Ayrık:** `wing_L`, `wing_R`, `tail-v-l`, `tail-v-r`, `gear`, `canopy`, `exhaust_nozzle` | Simülasyon kalitesinde tam havacılık hiyerarşisi. Kanat sweep pivotları ($20^\circ-68^\circ$) ve rudder açıları XML animasyon tanımlarıyla eşleşir. |
| **02** | **F14 Models (Poseable Wings)** | [Sketchfab / turtlerebooted](https://sketchfab.com/3d-models/f14-models-574d538d8272449191d4e0b04a8eef5e) | **CC-BY 4.0** | ~5.7k Tris / 3.1k Verts | `.gltf` / `.glb` / `.blend` | **Ayrık:** Kanatlar hareket ettirilebilir (poseable) ayrı nesneler olarak modellenmiş. | Low-poly / stilize retro arcade uyumlu. Dokusu basit ve net, render yükü minimum, CPS-1 remake için retro estetikle yüksek uyumlu. |
| **03** | **Low poly F14 Tomcat (Animated)** | [Sketchfab / S1Priv](https://sketchfab.com/3d-models/low-poly-f14-tomcat-animated-498c36fa33c64483a9ee4a460395ecba) | **CC-BY 4.0** | ~8.4k Tris / 4.6k Verts | `.gltf` / `.glb` / `.fbx` | **Tam Rigged:** Kanatlar, flaplar ve motor egzoz nozülleri ayrık ve animasyon kemiklerine bağlı. | Animasyonlu rig içerir. Kanat açılma/kapanma animasyonu hazır bake edilmiş, Three.js headless ortamında kemik/node bazlı döndürülebilir. |
| **04** | **Game Ready Low Poly F-14 Tomcat** | [Sketchfab / Nehhe](https://sketchfab.com/3d-models/game-ready-low-poly-f-14-tomcat-c4a19b3f72f64fb89564de789051030d) | **CC-BY 4.0** | ~12.5k Tris / 7.2k Verts | `.gltf` / `.glb` / `.fbx` | **Ayrık Düğümler:** Gövde, sol/sağ kanat, dikey stabilizatörler ve tekerlekler ayrık. | Oyun motorları (Unity/Unreal/Three.js) için optimize PBR texture map'lere (Albedo, Normal, Metallic/Roughness) sahip. |
| **05** | **F-14A Tomcat (Early) #3** | [Sketchfab / KojfDiscord](https://sketchfab.com/3d-models/f-14a-tomcat-early-3-custom-war-thunder-66779b76e1894d309279dc9cbe35dfc5) | **CC-BY 4.0** (Community Rip/Mod) | ~45k Tris / 28k Verts | `.gltf` / `.glb` / `.blend` | **Detaylı Parçalar:** Kanat pilonları, kanatlar, hava frenleri, kanopi ayrık. | Yüksek görsel doğruluk (War Thunder kaynaklı detay seviyesi). 128x128 ortografik render için poligon yoğunluğu fazladır ancak silüet kusursuzdur. |

---

## 2. Adayların Teknik Uygunluk Karşılaştırması

- **Aday 01 (FGAddon):** Simülasyon referansı, sıfır telif riski, eksiksiz parça hiyerarşisi (`wing_L`, `wing_R`, nozül, kuyruk). Halihazırda yerel script ile test edilen modeldir.
- **Aday 02 (turtlerebooted):** CPS-1 arcade piksel hissiyatına en yakın low-poly geometri; doğrudan GLB export desteği.
- **Aday 03 (S1Priv):** Rigged kemik mimarisi sayesinde kanat açısı Three.js içerisinde kemik rotasyonu ile doğrudan kontrol edilebilir.
- **Aday 04 (Nehhe):** Modern PBR materyaller ile 2.5D remake'in "yüksek çözünürlüklü arcade" vizyonuna en dengeli poligon/kalite oranı.
- **Aday 05 (KojfDiscord):** Maksimum yüzey detayı; ancak 128x128 sprite renderında mikrometre seviyesindeki detaylar piksel titreşimine (moire/subpixel aliasing) sebep olabilir.

---

## 3. Gatekeeper & Invariant Durumu
- Hiçbir 3D model depoya indirilmedi.
- Render motoru çalıştırılmadı.
- Açık kaynak ambarlar tarandı ve şartname mühürlendi.
- Biyolojik Mimar seçimi beklenmektedir.

