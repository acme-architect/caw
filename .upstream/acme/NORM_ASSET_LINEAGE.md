# NORM_ASSET_LINEAGE (Deterministik Varlık Soykütüğü ve Hash Kilidi)

**Kapsam:** ACME Evrensel Çekirdek Kuralı (`acme/`)  
**Kelsen Seviyesi:** Seviye 4 (Evrensel Doktrin / Lex Superior)  
**Yetki:** `DoF = 0`  
**Durum:** KULUÇKA / STAGED (`.upstream/acme/`)

---

## 1. Kural Tanımı ve Şartname

1. **Varlık Bağımlılık Bağı (Asset Dependency DAG):**
   - Hiçbir türetilmiş varlık (derlenmiş sprite şeridi, atlas, optimize edilmiş ses dosyası, LOD mesh'i) kaynak dosyasından (ham 3D model, SVG, WAV) bağımsız bir varoluşa sahip olamaz.
   - Her türetilmiş çıktı, doğrudan üretildiği kaynak dosyanın kriptografik özetine (`SHA-256`) mühürlenir.

2. **Otomatik Geçersiz Kılma (Invalidation On Hash Mismatch):**
   - Kaynak dosyanın hash değeri değiştiğinde ($H_{\text{yeni}} \ne H_{\text{eski}}$), bu kaynaktan türetilen tüm varlıklar anında ve koşulsuz olarak `DIRTY` (bayat/geçersiz) ilan edilir.
   - Çalışma zamanı motoru (runtime engine) `DIRTY` statüsündeki varlıkları belleğe alamaz ve çalıştırmayı reddeder.

3. **Yeniden Fırınlama Yükümlülüğü (Mandatory Re-Bake):**
   - Şantiye veya derleme boru hattı (`asm.md` / `check_assets`), bayat varlık tespit edildiğinde derhal ilgili derleme/render adımını tetikleyerek yeni çıktıyı üretmek ve güncel hash damgasını durum defterine (`state.json`) yazmakla yükümlüdür.

