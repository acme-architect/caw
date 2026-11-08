# PROBLEM MATRIX & STRUCTURAL GAP ANALYSIS (KÖK PROBLEM ANALİZİ)

> **Normative Authority:** ACME Ecosystem (Lex Superior `v3.2.0`, `DoF = 0`)  
> **Source Baseline:** Prototip Çekirdeği vs. Uçtan Uca Full HD Remake Hedefi  
> **Classification:** Living Gap Register

---

## 1. MEVCUT DURUM İLE HEDEF ARASINDAKİ BOŞLUK MATRİSİ

| No | Mühendislik Alanı | Mevcut Durum | Hedeflenen HD Remake Durumu | Kök Hata / Eksiklik (`DoF = 0`) |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | **Görsel Render Hattı (Visual Pipeline)** | Saf geometrik Canvas çizgileri ve ilkel poligonlar | Full HD ($1920 \times 1080$), alfa şeffaf 2D sprite'lar, dinamik namlu alevi ve parçacık ışıklandırması | Üretilen yeni HD şeffaf uçak sprite'ları (`assets/*_hd.png`) motora bağlanmadı; render motoru hala vektörel polygon arıyor. |
| **GAP-02** | **Uçak Kinematiği & Rig** | Sabit rotasyonlu matematiksel çizim | 5 duruma sahip sönümlü kanat eğimi (`damped banking rig`) ve dinamik afterburner alev animasyonu | Sprite tabanlı banking açısı ($Roll/Pitch$) sonlu durum makinesi ve motor egzoz koordinat bağlayıcısı yok. |
| **GAP-03** | **Çarpışma Geometrisi (Hitbox Mismatch)** | Tek bir merkez dairesel yarıçap ($dist < 22$) | Uçağın gövde, kanat ve burun hatlarını saran çoklu dairesel / yönlendirilmiş kutu (OBB/Compound Circle) | Uçağın gerçek silüeti $4:1$ en/boy oranında iken tek daire kullanılması mermilerin boşlukta çarpmasına veya uçağın burnundan hasar almamasına yol açıyor. |
| **GAP-04** | **Bölüm Tasarımı & Düşman Filosu** | Basit düz hatlı, tekdüze düşman spawn döngüsü | Orijinal Stage 1 ("Regain Tokyo"): Formasyon uçuşu yapan MiG jetleri, flak hücumbotları, viyadük füze tırları | Formasyon yöneticisi (`SquadronFormationManager`) ve araziye bağlı yer konuşlu düşman spawn mantığı eksik. |
| **GAP-05** | **Boss Mimarisi (Modüler İmha FSM)** | Tek bir can barına (`hp`) sahip büyük statik düşman | 3 fazlı, parçalanabilir Uçan Kale: 4x Dış motor $\rightarrow$ 2x Flak tareti $\rightarrow$ Açığa çıkan Reaktör Çekirdeği | Parça hiyerarşisi, alt bileşen hasar aktarımı ve kademeli enkaz/patlama durum makinesi yok. |
| **GAP-06** | **POW Kapsülü & Silah Seviyeleri** | Statik gold/fuel bırakan rastgele kutular | Havada süzülen, her $2.0\text{ s}$ periyotla renk değiştiren (Kırmızı $\rightarrow$ Yeşil $\rightarrow$ Mavi) ve 6 kademeli ana silah yükseltmesi | Renk değiştiren döngüsel FSM ve Level 1-6 mermi saçılma formülü kodlanmamış. |
| **GAP-07** | **Yakıt & Zırh İkili Hayatta Kalma Dengesi** | Basit can barı; yakıt sadece ekranda statik bir yüzde | Sürekli tükenen ($1.5\text{ birim/s}$), hasar aldıkça sızan yakıt; zırh kırılınca doğrudan yakıtı eriten ölüm mekaniği | Hasar öncelik hiyerarşisi (Armor $\rightarrow$ Fuel) ve acil durum irtifa kaybı (`Flameout Spiral`) FSM'i eksik. |
| **GAP-08** | **Mühimmat Dükkanı & Bütçe Döngüsü** | Basit bir HTML modal kutusu | Görev sonu USS Carl Vinson hangarında kazanılan fonlarla Vulcan, Phoenix, Kalkan ve Bomba satın alma döngüsü | Bölüm tamamlama geçişi, bütçe kalıcılığı (`funds ledger`) ve silah stok yönetim sözleşmesi bağlı değil. |
| **GAP-09** | **Paralaks Derinliği (Viewport Engine)** | Tekdüze kayan düz zemin | $1920 \times 1080$ çözünürlükte en az 4 bağımsız hızda kayan katman (Gökyüzü $\rightarrow$ Uzak Şehir $\rightarrow$ Viyadük $\rightarrow$ Deniz) | Sonsuz döngü modulo kaydırma ve katman derinlik ölçeklemesi eksik. |
| **GAP-10** | **Asset Yükleme Güvenliği (`ING_001`)** | Doğrudan HTML Image yüklemesi; dosya yoksa oyun çöküyor | Preload Turnstile, şeffaf PNG maskeleme, bozuk dosya karantinası ve prosedürel yedek (fallback) | Asenkron varlık yükleyici, bozuk asset izolasyonu ve zero-crash fallback katmanı yok. |

---

## 2. KÖK BLOKAJIN DERİN TESPİTİ

Proje, yalnızca kod yazma eksikliğinden değil; **3 temel yapısal kopukluktan** ötürü tıkanmıştır:
1. **Asset ile Render Ayrışması:** Üretilen yüksek çözünürlüklü şeffaf 2D sprite'lar ile render motorunun koordinat/çizim sözleşmesi eşleştirilmemiştir.
2. **Geometrik Uyuşmazlık:** Uçağın $4:1$ oranındaki silüeti ile arka plandaki dairesel çarpışma mantığı birbirini tutmamaktadır.
3. **Eksik Durum Makineleri (FSM):** POW renk döngüsü, Boss parçalanma fazları ve Yakıt/Zırh öncelik mekanizması deterministik durum makineleri olarak tasarlanmamıştır.
