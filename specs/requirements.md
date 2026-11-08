# LIVING REQUIREMENTS SPECIFICATION: `specs/requirements.md`

> **Normative Authority:** ACME Ecosystem (Lex Superior `v3.2.0`, `DoF = 0`)  
> **Traceability:** Linked to [CAS_001](../cases/CAS_001_inception_storyboard.md) and [CAS_002](../cases/CAS_002_asset_pipeline_rigor.md)

---

## 1. Fonksiyonel İsterler (Functional Requirements)

### [FR-001] Uçak Kontrolü ve Kinematik Damped Rig
- **FR-001.1:** Oyuncu 3 savaş jetinden birini seçebilir: F-14 Tomcat (Hızlı, hava odaklı), F/A-18 Hornet (Dengeli çok rollü), A-10 Thunderbolt II (Ağır zırh, yavaş sürat).
- **FR-001.2:** Dikey hareket sırasında (Yukarı/Aşağı tuşları) uçak sprite'ı sönümlü bir durum makinesiyle (`damped banking rig`) 5 kademeli rotasyon/eğim sergilemelidir (Nötr, Eğimli Yukarı, Tam Yukarı, Eğimli Aşağı, Tam Aşağı).
- **FR-001.3:** İtki seviyesine göre egzoz çıkışında dinamik afterburner parçacık/alev efekti render edilmelidir.

### [FR-002] Silah ve Cephane Sistemleri
- **FR-002.1:** Ana Vulcan Topu: Sürekli ateşleme (rapid fire), 1'den 6'ya kadar kademeli seviye yükselmesi (Level 1 tek mermi $\rightarrow$ Level 6 geniş mermi akışı).
- **FR-002.2:** Renk Değiştiren POW Kapsülü: Belirli kırmızı öncü düşmanlar yok edildiğinde serbest kalan, havada her $2.0\text{ s}$ periyotla rengi değişen (Kırmızı = Yayılım, Yeşil = Hızlı Düz, Mavi = Ağır Füze) kapsül döngüsü.
- **FR-002.3:** İkincil Mühimmat: Dükkandan satın alınan AGM-65 Maverick / AIM-54 Phoenix füzeleri (sınırlı cephane).
- **FR-002.4:** Taktik Nükleer / Mega Bomba: Ekrandaki tüm mermileri silen ve tüm düşmanlara yüksek alan hasarı veren şok dalgası mekaniği.

### [FR-003] Uçuş Enerjisi ve Hayatta Kalma (Fuel / Armor Economy)
- **FR-003.1:** Yakıt sayacı her saniye sabit hızla azalır ($1.5\text{ birim/saniye}$).
- **FR-003.2:** Hasar alındığında önce Zırh (Armor/Shield) tükenir; zırh bittiğinde hasar doğrudan Yakıt (Fuel) rezervini tüketir.
- **FR-003.3:** Yakıt sıfıra ulaştığında uçak irtifa kaybederek spiral patlamayla `GAMEOVER` durumuna geçer. Düşmanlardan düşen yakıt bidonları yakıtı $+40\text{ birim}$ yeniler.

### [FR-004] Çok Katmanlı Paralaks Kaydırma (Parallax Viewport)
- **FR-004.1:** $1920 \times 1080$ çözünürlükte en az 4 bağımsız hızda kayan katman:
  - Katman 0: Gökyüzü ve bulut tabakası (0.1x hız).
  - Katman 1: Uzak Tokyo şehir silüeti ve Fuji dağı (0.3x hız).
  - Katman 2: Yıkık asma köprüler, kıyı tesisleri ve viyadükler (0.7x hız).
  - Katman 3: Deniz yüzeyi ve dalga efektleri (1.0x hız).

### [FR-005] Düşman Formasyonları ve Aşama Akışı (Stage 1: Regain Tokyo)
- **FR-005.1:** Dalga 1: MiG-21/23 avcı formasyonları (Sinüzoidal uçuş yolu).
- **FR-005.2:** Dalga 2: Yer/deniz hedefleri (Uçaksavar flak botları, zırhlı tırlar).
- **FR-005.3:** Dalga 3 (Boss - Ağır Bombardıman Uçan Kale): 
  - 4 adet yok edilebilir dış türbin motoru.
  - 2 adet döner flak tareti.
  - Zırhı kırılan ve açığa çıkan reaktör çekirdeği.

### [FR-006] Görev Sonu Hangar Mühimmat Dükkanı (Hangar Armory)
- **FR-006.1:** Boss yenildiğinde oyun duraklar ve hangar dükkanı açılır.
- **FR-006.2:** Görevde kazanılan fonlarla (Bounty Funds) Zırh tamiri, Vulcan seviyesi, Phoenix/Napalm ve Bomba satın alımı yapılabilir.

---

## 2. Fonksiyonel Olmayan İsterler (Non-Functional Requirements)

### [NFR-001] Performans ve Kare Hızı
- **Metrik:** Kararlı **60 FPS** (Frame time $\le 16.67\text{ ms}$).
- **Doğrulama:** Render döngüsünde bellek tahsisi $0\text{ B/frame}$; sıfır GC stuttering.

### [NFR-002] Girdi Gecikmesi (Input Latency)
- **Metrik:** Klavye, dokunmatik veya Gamepad komutunun ekrana yansıma gecikmesi $\le 1\text{ frame}$ ($16.6\text{ ms}$).

### [NFR-003] Ses Sentezi ve Gecikme
- **Metrik:** WebAudio API AudioContext üzerinden gerçek zamanlı sıfır gecikmeli procedural sentez. Harici ses dosyası indirme beklemesi sıfır ($0\text{ ms}$).

### [NFR-004] Görsel Standart & Varlık Bütünlüğü
- **Metrik:** Tüm uçaklar ve nesneler `INV-SPRITE-FIT-01` ve `INV_AST_001` uyarınca Full HD ($1920 \times 1080$) çözünürlükle orantılı, tam ortografik yan profilden, kesilmemiş ve şeffaf RGBA olarak render edilir.

### [NFR-005] Kinetik Görsel Efektler ve Kromatik Sapma (Chromatic Aberration)
- **Metrik:** Ağır patlamalarda, taktik bomba infilakında ve kritik hasar anlarında dinamik RGB kanal ayrışması (Kromatik Sapma) tetiklenir.
- **Sınır:** Maksimum ayrışma tavanı $I_{max} = 12.0\text{ px}$, sönümleme katsayısı $\lambda = 14.0\text{ s}^{-1}$ (Etki süresi $\le 250\text{ ms}$). Normal uçuşta etki $0\text{ px}$ (bypass) kalarak 60 FPS tavanını korur.

