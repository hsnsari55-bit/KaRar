import bpy

# Varsayılan objeleri sil
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# İlk duvarı oluştur
bpy.ops.mesh.primitive_cube_add(
    location=(0, 0, 1.5)
)

wall = bpy.context.object
wall.name = "Wall_001"

# Boyutlandır
wall.scale.x = 2.5     # Uzunluk (5 metre)
wall.scale.y = 0.10    # Kalınlık (20 cm)
wall.scale.z = 1.5     # Yükseklik (3 metre)

print("İlk duvar oluşturuldu.")