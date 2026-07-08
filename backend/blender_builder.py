import bpy
import json
import os
import math

print("==========================================")
print("     KaRar 3D İnşa Motoru Devrede...")
print("==========================================")

# 1. Sahneyi temizle (Varsayılan küp, ışık, kamera silinir)
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 2. Okunacak dosya (Örnek olarak villa1'i ayağa kaldırıyoruz)
json_yolu = r"C:\KaRar\outputs\villa1.json"
DUVAR_YUKSEKLIK = 2.8  # Metre cinsinden duvar yüksekliği
DUVAR_KALINLIK = 0.2   # Metre cinsinden duvar kalınlığı

if os.path.exists(json_yolu):
    with open(json_yolu, "r", encoding="utf-8") as f:
        walls = json.load(f)
    
    print(f"Toplam {len(walls)} adet duvar işleniyor...")
    
    for idx, wall in enumerate(walls):
        # Sadece LINE (başlangıç ve bitişi olan) duvarları çiziyoruz
        if "start" in wall and "end" in wall:
            x1, y1 = wall["start"][0], wall["start"][1]
            x2, y2 = wall["end"][0], wall["end"][1]
            
            # AutoCAD mm cinsindeyse Blender metreye çeviriyoruz (Örn: 3000mm = 3m)
            # Eğer çizimin zaten metre cinsindeyse aşağıdaki "/ 1000" kısımlarını silebilirsin
            x1, y1, x2, y2 = x1 / 1000, y1 / 1000, x2 / 1000, y2 / 1000
            
            # Duvarın orta noktasını hesapla
            mid_x = (x1 + x2) / 2
            mid_y = (y1 + y2) / 2
            
            # Duvarın uzunluğunu ve açısını hesapla
            length = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            angle = math.atan2(y2 - y1, x2 - x1)
            
            # Sıfır uzunluklu hatalı çizgileri atla
            if length < 0.01:
                continue
                
            # Blender'da duvar oluştur (Küp ekle, boyutlandır ve döndür)
            bpy.ops.mesh.primitive_cube_add(location=(mid_x, mid_y, DUVAR_YUKSEKLIK / 2))
            duvar_objesi = bpy.context.active_object
            duvar_objesi.name = f"Duvar_{idx}"
            
            # Boyutları ayarla (X: Kalınlık, Y: Uzunluk, Z: Yükseklik)
            # Blender küpleri varsayılan 2x2x2 geldiği için scale değerlerini yarıya bölüyoruz
            duvar_objesi.scale = (DUVAR_KALINLIK / 2, length / 2, DUVAR_YUKSEKLIK / 2)
            
            # Z ekseninde duvarı doğru açıya döndür (Blender Y eksenini baz aldığı için açıya 90 derece ekliyoruz)
            duvar_objesi.rotation_euler[2] = angle + math.radians(90)

    print("🚀 3D Duvarlar başarıyla örüldü!")
else:
    print(f"❌ HATA: {json_yolu} dosyası bulunamadı! Önce save_clusters.py çalışmalı.")
