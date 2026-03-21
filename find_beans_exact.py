from PIL import Image

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
    for idx, bp in enumerate(blobs):
        xs = [p[0] for p in bp]
        ys = [p[1] for p in bp]
        cx = sum(xs) / len(bp)
        cy = sum(ys) / len(bp)
        
        min_x = min(xs)
        max_x = max(xs)
        min_y = min(ys)
        max_y = max(ys)
        
        # We can calculate orientation by a bounding box that tightly wraps the blob,
        # but let's just create an exact clip-path masking polygon string for absolute perfection!
        
        results.append({
            'cx': cx / w * 100,
            'cy': cy / h * 100,
            'min_x': min_x / w * 100,
            'max_x': max_x / w * 100,
            'min_y': min_y / h * 100,
            'max_y': max_y / h * 100,
            'pixels': len(bp)
        })
    
    results.sort(key=lambda item: item['pixels'], reverse=True)
    return results

print("Left Paw:")
left_blobs = get_blobs("src/assets/images/leftpaw.png")
for i, b in enumerate(left_blobs):
    print(f"Blob {i}: cx={b['cx']:.2f}%, cy={b['cy']:.2f}%, bounds: w={b['max_x'] - b['min_x']:.2f}%, h={b['max_y'] - b['min_y']:.2f}%")
