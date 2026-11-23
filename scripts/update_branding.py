path = r"D:\Work\dakn-elbasha\app\(standalone)\coordinator\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("تم تنسيق وتأكيد الموعد في صالون صدام 👑", "تم تنسيق وتأكيد الموعد في صالونات وسبا الباشا 👑")
content = content.replace("صالون صدام", "صالونات وسبا الباشا VIP")
content = content.replace("Saddam Salon", "دقن الباشا وحمام الباشا")
content = content.replace('src="/logo.jpg"', 'src="/dakn-logo.jpg"')
content = content.replace('localStorage.getItem("saddam_staff_user")', 'localStorage.getItem("basha_staff_user") || localStorage.getItem("saddam_staff_user")')

# Also add Orca Tech signature in footer if not present
if "Orca Tech" not in content:
    content = content.replace(
      '<span>نظام التنسيق الذكي</span>',
      '<span>نظام التنسيق الذكي • تطوير شركة أوركا للحلول البرمجية (Orca Tech) 🐬 • 01018671000</span>'
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("[OK] Branding updated in coordinator page!")
