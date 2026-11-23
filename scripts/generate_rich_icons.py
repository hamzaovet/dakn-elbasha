from PIL import Image
import os

# 1. Dakn El Basha: generate basha.ico and favicon.ico from dakn-logo.jpg
dakn_logo = r"D:\Work\dakn-elbasha\public\dakn-logo.jpg"
if os.path.exists(dakn_logo):
    im = Image.open(dakn_logo).convert("RGBA")
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    
    # Save to public/basha.ico and public/favicon.ico
    for out_name in ["basha.ico", "favicon.ico"]:
        out_p = os.path.join(r"D:\Work\dakn-elbasha\public", out_name)
        im.save(out_p, format="ICO", sizes=sizes)
        print("Generated", out_p, "size:", os.path.getsize(out_p))
        
    # Also update %LOCALAPPDATA%\DaknElBashaStandalone\basha.ico directly on this machine!
    local_p = os.path.expandvars(r"%LOCALAPPDATA%\DaknElBashaStandalone\basha.ico")
    os.makedirs(os.path.dirname(local_p), exist_ok=True)
    im.save(local_p, format="ICO", sizes=sizes)
    print("Updated local appdata icon:", local_p, "size:", os.path.getsize(local_p))

# 2. Meraya: generate meraya.ico and favicon.ico from logo.png
meraya_logo = r"D:\Work\meraya\public\logo.png"
if os.path.exists(meraya_logo):
    im = Image.open(meraya_logo).convert("RGBA")
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    
    for out_name in ["meraya.ico", "favicon.ico"]:
        out_p = os.path.join(r"D:\Work\meraya\public", out_name)
        im.save(out_p, format="ICO", sizes=sizes)
        print("Generated", out_p, "size:", os.path.getsize(out_p))
        
    # Also update %LOCALAPPDATA%\MerayaStandalone\meraya.ico directly on this machine!
    local_p = os.path.expandvars(r"%LOCALAPPDATA%\MerayaStandalone\meraya.ico")
    os.makedirs(os.path.dirname(local_p), exist_ok=True)
    im.save(local_p, format="ICO", sizes=sizes)
    print("Updated local appdata icon:", local_p, "size:", os.path.getsize(local_p))
