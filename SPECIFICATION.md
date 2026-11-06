# CARRIER AIR WING: APEX PROTOCOL - SPECIFICATION
> **Standard:** Lex Superior v3.2.0 (`DoF = 0`)  
> **Project Name:** `client-core` (Air Superiority Engine)  
> **Classification:** High-Precision 60FPS Arcade Shoot 'Em Up Engine

---

## 1. INVARIANTS & BOUNDARIES (`DoF = 0`)

1. **`INV-FPS-01` (Deterministic Timestep & Frame Pacing):**
   - Sabit delta zaman (`dt = 1/60`) ile fizik ve mantık entegrasyonu; delta spike'larda alt adım (`sub-stepping`) koruması ($dt \le 0.033$).
   - Ekran yırtılması veya frame drop olmadan 60 FPS hedeflenir.

2. **`INV-MEM-01` (Zero Garbage Allocation in Render Loop):**
   - Parçacıklar (Particles), mermiler (Bullets), düşman nesneleri (Enemies) için Object Pool mimarisi.
   - Her frame başında `new Object()` veya `Array.filter` çöpü üretilmez; bellek tavanı $\le 64\text{ MB}$.

3. **`INV-AUDIO-01` (Polifonik Sıfır-Gecikme WebAudio Sentezi):**
   - Sıfır dış dosya bağımlılığı; procedürel FM/Subtractive sentezör, 4 kanallı arcade arpej/basit akor dizilimi, çift aşamalı filtreleme, patlama/top/füze için gürültü ve frekans modülasyonu.

4. **`INV-CAW-01` (Carrier Air Wing Özgün Mekanikleri):**
   - **Yakıt (Fuel) Tüketimi & Enerji Bütçesi:** Uçuş süresince yakıt tükenir; yakıt tankları toplanmazsa irtifa kaybedilir.
   - **Mühimmat Dükkanı (Mid-Mission Hangar Armory):** Görev aralarında toplanan savaş ganimeti (Funds) ile Vulcan yükseltmesi, Phoenix/Hellfire füzeleri, Kalkan (Armor) ve Taktik Nükleer Bomba tedariki.
   - **3 Özgün Savaş Uçağı (Distinct Flight Profiles):**
     - **F/A-18 Hornet:** Dengeli hız, Vulcan topu ve Sparrow hava-hava füzeleri.
     - **A-10 Thunderbolt II (Warthog):** Ağır zırh, 30mm GAU-8 Avenger gatling, Cluster anti-tank bombaları.
     - **F-14 Tomcat:** Yüksek sürat, çift kuyruk manevrası, Phoenix uzun menzilli füzeler.
   - **Çok Fazlı Boss Tasarımı:** Parçalanabilir taretler, zırh kapakları ve reaktör çekirdeği.

---

## 2. ACCEPTANCE CRITERIA (BOOLEAN DoD)

- [x] **DoD-1:** Sayfa yüklendiğinde WebAudio API ve 60 FPS döngüsü `requestAnimationFrame` ile başlatılır.
- [x] **DoD-2:** Tüm uçaklar, düşmanlar, patlamalar, mermiler ve katmanlı paralaks arka planlar sıfır harici görsel varlığı gerektirmeksizin saf Canvas vektör/prosedürel sanat olarak çizilir.
- [x] **DoD-3:** Yakıt, Zırh, Skor, Dükkan (Shop), Taktik Bomba, Özel Silahlar ve Boss barı eksiksiz çalışır.
- [x] **DoD-4:** Klavye (WASD / Yön tuşları + J/K/L/Space) ve dokunmatik/gamepad kontrolleri tam desteklenir.
- [x] **DoD-5:** Object pooling ile sürekli bellek stabilitesi sağlanır.

