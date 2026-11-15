from collections import deque
from PIL import Image, ImageFilter

src = r"client\public\plane-ref.png"
img = Image.open(src).convert("RGBA")
w, h = img.size
px = img.load()


def looks_like_sky(r, g, b):
    """Sky in this photo is bright, cool grey-blue with modest chroma."""
    brightness = (r + g + b) / 3.0
    if brightness < 155:
        return False
    # cool cast: blue channel leading or equal
    if b + 2 < r:
        return False
    if g + 8 < r:
        return False
    # not dark metal / gear
    if brightness < 170 and max(r, g, b) - min(r, g, b) > 40:
        return False
    # typical sky band from samples ~180-235 brightness
    if brightness >= 170 and b >= 190 and g >= 180:
        return True
    if brightness >= 175 and b >= g - 5 and b >= r and (b - r) >= 6:
        return True
    if brightness >= 200 and abs(r - g) <= 20 and abs(g - b) <= 25 and b >= r:
        return True
    return False


visited = [[False] * w for _ in range(h)]
q = deque()


def try_seed(x, y):
    if visited[y][x]:
        return
    r, g, b, _ = px[x, y]
    if looks_like_sky(r, g, b):
        visited[y][x] = True
        q.append((x, y))


for x in range(w):
    try_seed(x, 0)
    try_seed(x, h - 1)
for y in range(h):
    try_seed(0, y)
    try_seed(w - 1, y)

# also seed a few interior sky pockets near top
for x in range(0, w, 20):
    for y in range(0, max(1, h // 5), 10):
        try_seed(x, y)

sky = [[False] * w for _ in range(h)]
while q:
    x, y = q.popleft()
    sky[y][x] = True
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if nx < 0 or ny < 0 or nx >= w or ny >= h or visited[ny][nx]:
            continue
        r, g, b, _ = px[nx, ny]
        if looks_like_sky(r, g, b):
            visited[ny][nx] = True
            q.append((nx, ny))

alpha = Image.new("L", (w, h), 255)
ap = alpha.load()
sky_count = 0
for y in range(h):
    for x in range(w):
        if sky[y][x]:
            ap[x, y] = 0
            sky_count += 1

print("sky pixels", sky_count, "of", w * h)

# close tiny holes in plane
alpha = alpha.filter(ImageFilter.MaxFilter(3))
alpha = alpha.filter(ImageFilter.MinFilter(3))
alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))

out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
op = out.load()
ap = alpha.load()
for y in range(h):
    for x in range(w):
        a = ap[x, y]
        if a < 18:
            continue
        r, g, b, _ = px[x, y]
        op[x, y] = (r, g, b, a)

bbox = out.getbbox()
print("bbox", bbox)
if bbox:
    pad = 4
    out = out.crop(
        (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad),
        )
    )

out = out.resize((max(1, out.width * 2), max(1, out.height * 2)), Image.Resampling.LANCZOS)
out.save(r"client\public\plane-cutout.png", optimize=True)
print("saved", out.size)
