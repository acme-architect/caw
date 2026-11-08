# CASE: CAS_005_F14_360_ROLL_CYCLE_LANDMARKS_AND_SPRITESHEET

- **Case ID:** `CAS_005`
- **Project:** `client-core`
- **Type:** `SPRITE_CALIBRATION_SPECIFICATION`
- **Axis of Motion:** $+Z$ Oblique Vector ($\theta = -19.9^\circ$, Flight Corridor)
- **Rotation Type:** $360^\circ$ Continuous Axial Roll (16 Discrete Phase Frames)
- **Step Angle:** $\Delta \phi = 360^\circ / 16 = 22.5^\circ$
- **Authority:** ACME Lex Superior `v3.2.0` (`DoF = 0`)
- **Status:** `SPEC_FROZEN`

---

## 1. 16 KARELİK EKSENEL DÖNÜŞ (AXIAL ROLL TABLE)

Tüm kareler aynı $+Z$ uçuş hattına (burnu sağa-yukarı $-19.9^\circ$ bakan aksonometrik hatta) kilitlidir. 
Uçak kendi boylamasına gövde omurgası ($+Z$) etrafında $360^\circ$ fıçı tonosu / tam eksenel dönüş (*Aileron Roll*) yapar:

| Kare No | Yuvarlanma Açısı ($\phi$) | Görünen Yüzey / Aerodinamik Anatomik Durum |
| :---: | :---: | :--- |
| **Frame 00** | $0.0^\circ$ | **Temel Duruş (Nötr):** Hafif sağa yatık 2.5D aksonometrik görünüm (Elimizdeki `f14_iso_hero.png`). |
| **Frame 01** | $22.5^\circ$ | Hafif içeri yatış (Bank In): Üst kanat yüzeyi genişler, kokpit tavanı hafif sola kayar. |
| **Frame 02** | $45.0^\circ$ | Dik açılı tırmanış yatışı: Sırt omurgası belirginleşir, sol kanat yukarı kalkar. |
| **Frame 03** | $67.5^\circ$ | Neredeyse dik sırt yatışı (Knife-Edge): Kanat üstü geniş profil, gövde incelir. |
| **Frame 04** | $90.0^\circ$ | **Tam Sırt / Dikey Bıçak Uçuşu (Dorsal Knife Edge):** Sırt profili, çift dikey kuyruklar tam seyirciye dik. |
| **Frame 05** | $112.5^\circ$ | Ters uçuşa geçiş (Inverted Ingress): Uçak sırtını arkaya vermeye başlar. |
| **Frame 06** | $135.0^\circ$ | $45^\circ$ Ters Uçuş: Kokpit alta doğru kayar, gövde altı tünelleri görünmeye başlar. |
| **Frame 07** | $157.5^\circ$ | Neredeyse tam ters uçuş: Motor hava alıkları ve gövde altı füzeler belirgin. |
| **Frame 08** | $180.0^\circ$ | **Tam Ters Uçuş (Inverted / Upside Down):** Kokpit aşağıda, gövde altı tünelleri ve kanat altı tam yukarıda. |
| **Frame 09** | $202.5^\circ$ | Ters uçuştan çıkış: Gövde altı sağa doğru dönmeye başlar. |
| **Frame 10** | $225.0^\circ$ | $45^\circ$ Alt Yatış: Sağ kanat altı ve alt motor hava girişi tam açıkta. |
| **Frame 11** | $247.5^\circ$ | Dik Karın Yatışı (Ventral Knife Edge): Karın profili seyirciye bakar. |
| **Frame 12** | $270.0^\circ$ | **Tam Karın Bıçak Uçuşu (Full Ventral View):** Karın tünelleri, Phoenix pilonları ve iniş kapağı hatları. |
| **Frame 13** | $292.5^\circ$ | Düz uçuşa toparlanma (Recovery): Kokpit tekrar üstten belirmeye başlar. |
| **Frame 14** | $315.0^\circ$ | Hafif alt-dış yatış: Uçak nötr 2.5D açısına yaklaşır. |
| **Frame 15** | $337.5^\circ$ | Son toparlanma: Nötr duruşa $22.5^\circ$ kala geçiş karesi. |

---

## 2. ÜRETİM VE DOĞRULAMA PLANI
- Her kare `assets/f14_roll_cycle/f14_roll_{00..15}.png` olarak $512 \times 256$ şeffaf RGBA formatında depolanır.
- Tüm kareler aynı $+Z$ merkez eksenine kilitlenecektir.

