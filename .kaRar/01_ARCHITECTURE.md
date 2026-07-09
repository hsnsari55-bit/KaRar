KaRar OS Version : 1.0.0
Document Version : 1.0
Last Updated     : 2026-07-09
Status           : Active
Owner            : KaRar

# 01_ARCHITECTURE

> Bu belge KaRar'ın teknik mimarisini tanımlar.
> Burada anlatılan yapı, sistem geliştikçe genişleyebilir ancak temel veri akışı korunmalıdır.

---

# 1. System Overview

KaRar, 2 boyutlu mimari çizimleri analiz ederek profesyonel kalitede dijital yapı modelleri üreten yapay zekâ destekli bir mühendislik platformudur.

Sistem modülerdir.

Her modül yalnızca kendi görevini yapar.

Modüller ortak veri modeli üzerinden haberleşir.

---

# 2. High Level Pipeline

```
DXF
PDF
IFC
DWG (Future)
Revit (Future)

        │
        ▼

Parsing Engine

        │
        ▼

Geometry Engine

        │
        ▼

Semantic Engine

        │
        ▼

Topology Engine

        │
        ▼

Building Generator

        │
        ▼

Material Engine

        │
        ▼

Scene Generator

        │
        ▼

Render Engine

        │
        ▼

Output
```

---

# 3. Parsing Engine

Görevi;

- Dosyayı okumak
- Geometriyi çıkarmak
- Katmanları analiz etmek
- Ortak veri modelini oluşturmaktır.

Bu katman yalnızca veri okur.

Karar vermez.

---

# 4. Geometry Engine

Görevi;

- Çizgileri analiz etmek
- Yayları çözmek
- Polyline yapısını anlamak
- Ölçek dönüşümlerini yapmak
- Geometrik ilişkileri belirlemektir.

Bu katmanda yalnızca matematik bulunur.

---

# 5. Semantic Engine

Geometry tek başına yeterli değildir.

Bu katman geometriye anlam kazandırır.

Örneğin;

- Duvar
- Kapı
- Pencere
- Kolon
- Kiriş
- Döşeme
- Merdiven
- Oda

gibi mimari elemanlar burada belirlenir.

---

# 6. Topology Engine

Bu katman elemanlar arasındaki ilişkileri kurar.

Örneğin;

- Bu kapı hangi duvara ait?
- Bu pencere hangi odada?
- Hangi duvarlar birleşiyor?
- Hangi oda komşu?

KaRar'ın gerçek mühendislik zekâsı burada oluşmaya başlar.

---

# 7. Building Generator

Semantic ve Topology katmanlarından gelen bilgiler kullanılarak gerçek 3D yapı oluşturulur.

Bu aşamada;

- Duvarlar yükseltilir.
- Kapılar açılır.
- Pencereler oluşturulur.
- Döşemeler eklenir.
- Çatı oluşturulur.

---

# 8. Material Engine

3D modele uygun malzemeler atanır.

Örneğin;

- Beton
- Cam
- Ahşap
- Seramik
- Boya

Bu katman parametrik çalışır.

---

# 9. Scene Generator

Model;

- Kamera
- Işık
- Çevre
- Peyzaj
- Gökyüzü

ile birlikte render sahnesine hazırlanır.

---

# 10. Render Engine

Sistem;

oluşturulan dijital yapıyı

profesyonel kalitede

render almaya hazır hale getirir.

Render motoru değişebilir.

Mimari değişmez.

---

# 11. AI Decision Layer

KaRar yalnızca model oluşturmaz.

Eksik veya hatalı geometrileri analiz eder.

Gerekirse;

- birleştirir,
- düzeltir,
- tamamlar,

ve doğru mühendislik kararını üretmeye çalışır.

---

# 12. Common Data Model

Tüm modüller ortak veri modeli üzerinden haberleşir.

Hiçbir modül başka modülün iç yapısına bağımlı değildir.

Bu sayede sistem kolay geliştirilebilir.

---

# 13. Future Expansion

Gelecekte sisteme;

- IFC
- Digital Twin
- Quantity Takeoff
- Cost Analysis
- ERP
- CRM
- AI Assistant

gibi modüller eklenebilir.

Bu modüller mevcut mimariyi bozmaz.

---

# Architecture Principles

KaRar;

- Modülerdir.
- Ölçeklenebilirdir.
- Yapay zekâ desteklidir.
- Ortak veri modeli kullanır.
- Geometriyi anlamlandırır.
- Mimari ilişkileri kurar.
- Profesyonel dijital yapılar üretir.

Her yeni modül bu mimariye uygun geliştirilmelidir.
