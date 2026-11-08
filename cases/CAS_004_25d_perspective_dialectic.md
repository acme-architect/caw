# CASE: CAS_004_25D_PERSPECTIVE_DIALECTIC_AND_MATHEMATICAL_MODEL

- **Case ID:** `CAS_004`
- **Project:** `client-core`
- **Type:** `DIALECTIC_INQUEST`
- **Topic:** 2.5D Aksonometrik Perspektif, Zemin Eğimi ve Mermi Yörüngesi Sentezi
- **Authority:** ACME Lex Superior `v3.2.0` (`DoF = 0`, Article 5 Adversarial Twin Dynamics)
- **Status:** `INQUEST_ACTIVE`

---

## 1. DİYALEKTİK ÇATIŞMA (TEZ vs. ANTİTEZ)

### Tez (Node-A: Saf Estetik 2.5D Perspektif)
- Uçak $30^\circ$ açıyla üstten/yandan görünüyorsa, oyun dünyası da $30^\circ$ açılı bir zemin düzlemine sahip olmalıdır. Binalar, gemiler ve adalar izometrik derinlikle arkaya doğru kaçmalıdır.

### Antitez (Node-R: Hasmane Oyun Mekaniği & Hitbox Savcısı)
- Eğer zemin ve dünya izometrik kaçış açısına bürünürse, oyuncunun mermileri nereye gidecek? Düz $X$ ekseninde mi, yoksa açılı mı? 
- Düşman mermisi oyuncunun altından mı geçiyor, yoksa gövdesine mi çarpıyor?
- Klasik arcade shoot 'em up (shmup) oyunlarında (örn. *Viewpoint*, *Air Zonk*, *Carrier Air Wing*) izometrik sapma kontrol kabusuna dönüşür. Oyuncu $X/Y$ ekseninde kaçarken $Z$ derinlik algısı yüzünden mermileri yanlış yorumlar (Hitbox Parallax Illusion).

---

## 2. SENTEZ: "KABİNET / OBLİK AKSONOMETRİK PROJEKSİYON" (`DoF = 0`)

Oyun dünyasının matematiksel olarak hem 2.5D derinliğe sahip olması hem de oyun mekaniğinin deterministik ve pürüzsüz kalması için sektörün en üst standardı olan **Kabin Obliği (Cabinet Oblique Projection)** seçilir:

1. **Oyun Düzlemi (Playfield Plane):**
   - Hareket ve mermi hesaplamaları kesinlikle **Ortogonal $X-Y$ Düzlemindedir** ($Z_{fizik} = 0$).
   - Oyuncunun kontrolü $90^\circ$ diktir (Yukarı tam yukarı, Sağa tam sağa gider).
2. **Görsel Projeksiyon Matrisi (Visual Oblique Projection):**
   - Varlıkların çiziminde $Y$ eksenine hafif bir üst açı ($\alpha = 25^\circ$) ve derinlik sıkıştırması uygulanır:
     $$\begin{pmatrix} X_{ekran} \\ Y_{ekran} \end{pmatrix} = \begin{pmatrix} X_{fizik} \\ Y_{fizik} - Z_{irtifa} \cdot \cos(25^\circ) \end{pmatrix}$$
3. **Ölçekleme Kanunu (Scale Invariant):**
   - Uçak $1920 \times 1080$ ekranın tam olarak **genişliğinin $\%11$'ini, yüksekliğinin $\%6.5$'ini** kaplar:
     $$W_{jet} = 210\text{ px}, \quad H_{jet} = 70\text{ px}$$
4. **Zemin Derinliği (Oblique Ground Perspective):**
   - Ufuk çizgisi $Y = 480\text{ px}$ hizasındadır (Ekranın üst $\%45$'i gökyüzü, alt $\%55$'i açılı deniz/şehir).
   - Deniz ve otoyol katmanları $15^\circ$ eğimli kılavuz çizgileriyle arkadan öne doğru genişleyerek (trapezoid grid) 2.5D hissi verirken, oyun alanı dikeyde düz kalır.

