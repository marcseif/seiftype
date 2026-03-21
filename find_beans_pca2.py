from PIL import Image
import math

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
        
        # PCA for orientation and major/minor axes
        u20 = sum((x - cx)**2 for x in xs) / len(bp)
        u02 = sum((y - cy)**2 for y in ys) / len(bp)
        u11 = sum((x - cx)*(y - cy) for x, y in zip(xs, ys)) / len(bp)
        
        # Eigenvalues & Eigenvectors
        diff = u20 - u02
        angle = 0.5 * math.atan2(2 * u11, diff)
        
        # Lengths (approx mapping variance to ellipse dimensions)
        major = 4 * math.sqrt(abs(0.5 * (u20 + u02 + math.sqrt(diff**2 + 4 * u11**2))))
        minor = 4 * math.sqrt(abs(0.5 * (u20 + u02 - math.sqrt(diff**2 + 4 * u11**2))))

        # If major axis is horizontal but the ellipse should be drawn vertically and rotated, 
        # we might need to swap W and H and add 90 to angle to make it an ellipse drawn vertically then rotated,
        # or drawn horizontally then rotated. Let's just output W along major axis and H along minor axis.
        # IF we want width to be horizontal and height to be vertical, we must consider how CSS rotate works.
        # In CSS, rotate(deg) rotates clockwise from horizontal X-axis. Our PCA angle is from X-axis. 
        # So width = major, height = minor. 
        
        results.append({
            'cx': cx / w * 100,
            'cy': cy / h * 100,
            'w': major / w * 100,
            'h': minor / h * 100, # CSS height should be proportional to major if it was standing up, but here W is Major.
            # wait, if w > h, CSS will draw it horizontally, and then rotate it.
            # Let's adjust to width = minor, height = major, and rotate angle by 90 degrees so they stand up.
            'cw': minor / w * 100,
            'ch': major / h * 100,
            'cangle': math.degrees(angle) + 90, 
            'pixels': len(bp)
        })
    
    results.sort(key=lambda item: item['pixels'], reverse=True)
    return results

print("Left Paw:")
left_blobs = get_blobs("src/assets/images/leftpaw.png")
for i, b in enumerate(left_blobs):
    print(f"Blob {i}: center=({b['cx']:.2f}%, {b['cy']:.2f}%), cw={b['cw']:.2f}%, ch={b['ch']:.2f}%, cangle={b['cangle']:.2f}deg")

print("\nRight Paw:")
right_blobs = get_blobs("src/assets/images/rightpaw.png")
for i, b in enumerate(right_blobs):
    print(f"Blob {i}: center=({b['cx']:.2f}%, {b['cy']:.2f}%), cw={b['cw']:.2f}%, ch={b['ch']:.2f}%, cangle={b['cangle']:.2f}deg")
