# CASE: CAS_001_HD_REMAKE_ARCHITECTURAL_SPECIFICATION

- **Case ID:** `CAS_001`
- **Project:** `client-core`
- **Type:** `INCEPTION`
- **Classification:** Full HD Remake Specification (Inference from Capcom 1990 *Carrier Air Wing*)
- **Authority:** ACME Lex Superior `v3.2.0` (Article 16: `INV-INCEPTION-RIGOR`, Precedent `PRE_002`, `DoF = 0`)
- **Status:** `ACTIVE_ANALYSIS`

---

## 1. REMAKE INVARIANTS (`DoF = 0`)

Per **`PRE_002` (Remake Asset Fidelity & Zero-Primitive Taxonomy)**:
1. **`INV_AST_001` (Fidelity Tier):** Pixel-art ve ilkel poligon çizimleri kesin olarak yasaklanmıştır (`REJECT_PRIMITIVE_ASSET`). Çözünürlük standardı **Full HD ($1920 \times 1080$)** mantıksal render tavanı (16:9 modern ekran standardı) olarak kilitlenmiştir.
2. **`INV_AST_002` (Remake Paradigm Decoupling):** CPS-1 donanım kısıtlamaları (16 renk paleti, 384x224 çözünürlük) emüle edilmeyecek; yalnızca matematiksel oyun döngüsü (FSM, hit-stop, silah seviyeleri, yakıt ekonomisi) referans alınacaktır. Görsel ve işitsel sunum modern endüstri standardı dijital illüstrasyon, parçacık ışıklandırması ve yüksek kaliteli ses tasarımına dayanacaktır.

---

## 2. HD REMAKE STORYBOARD & SAHNE TOPOLOJİSİ

```text
[SCENE 0: NÜKLEER UÇAK GEMİSİ KALKIŞI (USS CARL VINSON HD)]
├─ Görsel Doku: Uçak gemisinin ıslak çelik güvertesi, buhar ejektörleri, 4K detaylı güverte personeli.
├─ Dinamik: Mancınık fırlatması, jet türbininde afterburner alevi, kamera sarsıntısı ve deniz yüzeyine alçak uçuş.
└─ Süre: 10 saniye (Non-interactive dinamik sekans).

[SCENE 1: KÖRFEZ & ŞEHİR KIYI TAARRUZU (REGAIN TOKYO HD)]
├─ Çok Katmanlı Paralaks:
│  ├─ Arka Plan 1: Gün batımı gökyüzü ve sisli gökdelen silüetleri.
│  ├─ Arka Plan 2: Yıkık asma köprüler, otoyol viyadükleri, yanan petrol tankerleri.
│  ├─ Ön Plan (Playfield): Yüksek çözünürlüklü düşman hücumbotları, flak bataryaları, jet formasyonları.
└─ Dalga Dinamiği: MiG-23 / Su-25 benzeri modern jet formasyonları; renk değiştiren POW kapsülleri.

[SCENE 2: ARA PATLAMA & ŞEHİR OTOYOL SAVAŞI]
├─ Zemin Tehlikeleri: Otoyol üzerinde hareket eden füze bataryası yüklü askeri tırlar ve zırhlı trenler.
└─ Pacing: Hızlı yer ve hava hedefleri arasında hedef önceliklendirme testi.

[SCENE 3: BÖLÜM SONU BOSS - AĞIR BOMBARDIMAN KALESİ (FLYING FORTRESS HD)]
├─ Tasarım: Devasa, çok motorlu hayalet/ağır bombardıman uçağı (B-2 / B-52 / XB-70 sentezi).
├─ Parçalanabilir HD Parçalar:
│  ├─ Faz 1: 4 adet ana jet türbini (zırh plakaları dökülür, duman ve yangın efektleri açılır).
│  ├─ Faz 2: Üst ve alt taret kuleleri (rotasyonel flak mermileri).
│  └─ Faz 3: Ana bomba yuvası ve lazer/füze çekirdeği.
└─ Patlama / Çöküş: Ekran sarsıntılı, kademeli yapısal parçalanma ve denize düşüş.

[SCENE 4: HANGAR DÜKKANI & GÖREV SONU (HANGAR ARMORY HD)]
├─ Görsel: Uçak bakım hangarı, teknisyenler ve mühimmat montaj vinçleri.
└─ Mekanik: Kazanılan fonlarla yüksek kaliteli Phoenix, Hellfire, Napalm ve Zırh satın alımı.
```

---

## 3. OYNANABİLİR 3 HD JET PROFİLİ (KİNETİK & GÖRSEL ÇIKARIM)

1. **F-14D Super Tomcat (Hava-Hava Üstünlüğü):**
   - Geometri: Değişken kanat geometrisi (hızlandıkça geriye açılan kanat animasyonu).
   - Silah: Yüksek kalibre Vulcan topu, çoklu Phoenix radar füzeleri.
2. **F/A-18F Super Hornet (Çok Rollü Dengeli Jet):**
   - Geometri: Dengeli manevra, hava freni ve kanat ucu Sidewinder füzeleri.
   - Silah: Dengeli atış frekansı, AGM Maverick hava-yer füzeleri.
3. **A-10C Thunderbolt II / A-6E İntruder Sentezi (Ağır Kara Taarruzu):**
   - Geometri: Titanyum zırh kaplama, çift turbo-fan motor.
   - Silah: 30mm GAU-8 Avenger gatling topu, güdümsüz cluster bombaları.
