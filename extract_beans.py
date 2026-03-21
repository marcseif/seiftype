from PIL import Image
import os

def get_blobs(img_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    visited = set()
    blobs = []
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 50 and r > 100 and r > g + 20 and g < 200 and b < 200 and (x, y) not in visited:
                q = [(x, y)]
                visited.add((x, y))
                blob_pixels = []
                while q:
                    cx, cy = q.pop(0)
                    blob_pixels.append((cx, cy))
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (1,1), (-1,1), (1,-1)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                            pr, pg, pb, pa = pixels[nx, ny]
                            if pa > 50 and pr > 100 and pr > pg + 20: 
                                visited.add((nx, ny))
                                q.append((nx, ny))
                if len(blob_pixels) > 20:
                    blobs.append(blob_pixels)
    
    results = []
    for bp in blobs:
        xs = [p[0] for p in bp]
        ys = [p[1] for p in bp]
        cx = sum(xs) / len(bp)
        cy = sum(ys) / len(bp)
        results.append({
            'cx': cx, 'cy': cy, 'pixels': bp, 'size': len(bp)
        })
    results.sort(key=lambda x: x['size'], reverse=True)
    return img, results

def extract_and_save(img, blob, name):
    w, h = img.size
    out = Image.new("RGBA", (w, h), (0,0,0,0))
    inp_pixels = img.load()
    out_pixels = out.load()
    
    # We copy over the exact bean pixels. 
    # To make the CSS coloration and glow completely controllable, we will make all non-transparent pixels pure white.
    # This way `drop-shadow` plus a `mix-blend-mode` or css tinting works perfectly, or we can just leave original colors.
    # Actually, original colors with drop-shadow works perfectly fine! Let's keep original colors and just bump brightness via CSS.
    for x, y in blob['pixels']:
        out_pixels[x, y] = inp_pixels[x, y]
        
    out.save(f"src/assets/images/{name}.png")

left_img, left_blobs = get_blobs("src/assets/images/leftpaw.png")
right_img, right_blobs = get_blobs("src/assets/images/rightpaw.png")

print(f"Left paw blobs: {len(left_blobs)}")
print(f"Right paw blobs: {len(right_blobs)}")

l_beans = left_blobs[1:6]
l_thumb = max(l_beans, key=lambda x: x['cy'])
l_fingers = [b for b in l_beans if b != l_thumb]
l_fingers.sort(key=lambda x: x['cx'])

extract_and_save(left_img, l_thumb, "l_thumb")
extract_and_save(left_img, l_fingers[0], "l_pinky")
extract_and_save(left_img, l_fingers[1], "l_ring")
extract_and_save(left_img, l_fingers[2], "l_middle")
extract_and_save(left_img, l_fingers[3], "l_index")

r_beans = right_blobs[1:6]
r_thumb = max(r_beans, key=lambda x: x['cy'])
r_fingers = [b for b in r_beans if b != r_thumb]
r_fingers.sort(key=lambda x: x['cx'])

extract_and_save(right_img, r_thumb, "r_thumb")
extract_and_save(right_img, r_fingers[0], "r_index")
extract_and_save(right_img, r_fingers[1], "r_middle")
extract_and_save(right_img, r_fingers[2], "r_ring")
extract_and_save(right_img, r_fingers[3], "r_pinky")

print("Successfully extracted exact bean images.")
