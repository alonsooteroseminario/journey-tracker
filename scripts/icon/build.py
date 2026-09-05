"""Single source of truth for the Prompt Wallet mark.

Emits two SVGs from one geometry, then rasterises every size the app and
Instagram need. Proportions are measured off the approved reference: wallet
1.68 wider than tall, outer chunks wider than tall, centre chunk squarer and
taller because it is the one being pulled out.
"""
import math, os
from PIL import Image, ImageDraw

REPO = "/home/alonsooteroseminario/source/repos/journey-tracker"
INK, VIOLET, MID, LIGHT = "#171331", "#5B50E8", "#7B6FFF", "#EAE8FF"
# A tint of MID, needed only in light mode: the outer chunks are LIGHT, which is
# invisible against a white plate. Same hue, enough step to read at 16px.
SOFT = "#B6AEFF"

THEMES = {
    # plate colour, outer-chunk colour, seam colour
    "dark":  dict(plate=INK,       chunk=LIGHT, seam=LIGHT, seam_op=0.22),
    "light": dict(plate="#FBFAFF", chunk=SOFT,  seam=LIGHT, seam_op=0.30),
}

def mark(theme):
    """Geometry is fixed; only three fills move between themes."""
    t = THEMES[theme]
    return [
        # x, y, w, h, rx, fill, rotation, pivot
        (27, 43, 74, 62, 9, t["chunk"], -14, (64, 74)),   # outer chunk, left
        (155, 43, 74, 62, 9, t["chunk"], 14, (192, 74)),  # outer chunk, right
        (86, 26, 84, 88, 11, MID, 0, None),               # the one being pulled out
        (24, 101, 208, 125, 18, VIOLET, 0, None),         # wallet body
        (24, 183, 208, 4, 0, t["seam"], 0, None),         # seam, drawn at low opacity
    ]

def plate(theme):
    return (0, 0, 256, 256, 56, THEMES[theme]["plate"], 0, None)

# The bare mark keeps the original fills: it is only ever used on dark or cream
# surfaces, where the pale chunks read.
MARK = mark("dark")
SEAM_OP = 0.22
PLATE = plate("dark")

# On the plate the mark is inset so it does not crowd the corners. Bare marks
# carry their own margin already, so they render at 1:1.
PLATE_SCALE = 0.84

# Where the rocket goes. "corner" needs the mark inset further or it collides
# with the left chunk; "wallet" sits in the clean violet field above the seam.
# The shipped placement. "corner" is kept because it was evaluated and is one
# word away, but it costs 10% of the mark's size to clear the left chunk and
# has nowhere to sit on the plate-less mark used for the Instagram avatar.
ROCKET_AT = "wallet"

PLACEMENTS = {
    None:     dict(scale=0.84, pos=None),
    "corner": dict(scale=0.76, pos=(36, 36, 42, -38)),
    "wallet": dict(scale=0.84, pos=(76, 142, 46, -38)),
}
_CX, _CY = 128, 126            # centre of the mark's bounding box

def fit(shape, scale):
    """Scale a shape about the mark's centre, re-centred in the 256 canvas."""
    if scale == 1:
        return shape
    x, y, w, h, rx, f, rot, piv = shape
    tx = lambda v: 128 + (v - _CX) * scale
    ty = lambda v: 128 + (v - _CY) * scale
    return (tx(x), ty(y), w * scale, h * scale, rx * scale, f, rot,
            (tx(piv[0]), ty(piv[1])) if piv else None)


# ── rocket ──────────────────────────────────────────────────────────────────
# Carried over from the Journey Tracker mark (docs/brand/legacy-icons/LoDi-*.png): same nose,
# porthole, fins and thrust, redrawn flat. The originals are heavy-outlined
# cartoons with an orange flame; an outline and a fourth colour would fight
# the wallet, so only the silhouette survives.
#
# Drawn in a local 100x100 box pointing straight up, then scaled, rotated and
# placed. Paths use only M / L / C / Z.
ROCKET = [
    ("M50,6 C64,20 71,34 71,50 L71,72 C71,81 62,87 50,87 C38,87 29,81 29,72 "
     "L29,50 C29,34 36,20 50,6 Z", LIGHT),                       # body
    ("M29,58 L12,88 L29,79 Z", MID),                             # fin, left
    ("M71,58 L88,88 L71,79 Z", MID),                             # fin, right
    ("M41,88 C45,101 55,101 59,88 Z", MID),                      # thrust
    ("circle 50 42 12", VIOLET),                                 # porthole
]


def _bezier(p0, p1, p2, p3, n=14):
    out = []
    for i in range(1, n + 1):
        t = i / n
        u = 1 - t
        out.append((u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
                    u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]))
    return out


def _points(path):
    """Flatten an M/L/C/Z path into a polygon in local 100x100 coordinates."""
    import re
    toks = re.findall(r"([MLCZ])([^MLCZ]*)", path)
    pts, cur, start = [], (0.0, 0.0), None
    for cmd, arg in toks:
        n = [float(v) for v in re.findall(r"-?\d+\.?\d*", arg)]
        if cmd == "M":
            cur = (n[0], n[1]); start = cur; pts.append(cur)
        elif cmd == "L":
            cur = (n[0], n[1]); pts.append(cur)
        elif cmd == "C":
            seg = _bezier(cur, (n[0], n[1]), (n[2], n[3]), (n[4], n[5]))
            pts += seg; cur = seg[-1]
        elif cmd == "Z" and start:
            pts.append(start); cur = start
    return pts


def rocket_xform(cx, cy, size, angle):
    """SVG transform placing the local 100-box centred at (cx, cy)."""
    k = size / 100.0
    return f"translate({cx} {cy}) rotate({angle}) scale({k}) translate(-50 -50)"


def rocket_pt(x, y, cx, cy, size, angle):
    """The same transform, applied to one point, for the PIL renderer."""
    import math
    k = size / 100.0
    x, y = (x - 50) * k, (y - 50) * k
    a = math.radians(angle)
    return (cx + x * math.cos(a) - y * math.sin(a),
            cy + x * math.sin(a) + y * math.cos(a))


def svg(with_plate, rocket=None, theme="dark"):
    place = PLACEMENTS[rocket]
    shapes = mark(theme)
    seam_op = THEMES[theme]["seam_op"]
    rows = []
    if with_plate:
        x, y, w, h, rx, f, _, _ = plate(theme)
        rows.append(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{f}"/>')
    scale = place["scale"] if with_plate else 1
    for i, shape in enumerate(shapes):
        x, y, w, h, rx, f, rot, piv = fit(shape, scale)
        x, y, w, h, rx = (round(v, 1) for v in (x, y, w, h, rx))
        if piv: piv = (round(piv[0], 1), round(piv[1], 1))
        op = f' opacity="{seam_op}"' if i == len(shapes) - 1 else ""
        tr = f' transform="rotate({rot} {piv[0]} {piv[1]})"' if rot else ""
        rx_ = f' rx="{rx}"' if rx else ""
        rows.append(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}"{rx_} fill="{f}"{op}{tr}/>')
    if place["pos"]:
        cx, cy, size, ang = place["pos"]
        rows.append(f'  <g transform="{rocket_xform(cx, cy, size, ang)}">')
        for dpath, fill in ROCKET:
            if dpath.startswith("circle"):
                _, ccx, ccy, cr = dpath.split()
                rows.append(f'    <circle cx="{ccx}" cy="{ccy}" r="{cr}" fill="{fill}"/>')
            else:
                rows.append(f'    <path d="{dpath}" fill="{fill}"/>')
        rows.append("  </g>")
    body = "\n".join(rows)
    note = ("A wallet with three prompt chunks fanned out of it: retrieval, which is the\n"
            "    product's whole argument. Generated by scripts/icon/build.py — edit the\n"
            "    geometry there, not here. Flat fills, three colours, no gradients.")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" '
            f'role="img" aria-label="Prompt Wallet">\n  <!--\n    {note}\n  -->\n{body}\n</svg>\n')

def render(px, with_plate, rocket=None, theme="dark", ss=8):
    place = PLACEMENTS[rocket]
    seam_op = THEMES[theme]["seam_op"]
    n, k = px * ss, px * ss / 256
    canvas = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    scale = place["scale"] if with_plate else 1
    shapes = ([plate(theme)] if with_plate else []) + [fit(m, scale) for m in mark(theme)]
    for i, (x, y, w, h, rx, f, rot, piv) in enumerate(shapes):
        layer = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        fill = Image.new("RGB", (1, 1), f).getpixel((0, 0))
        is_seam = (i == len(shapes) - 1)
        fill = fill + (int(255 * (seam_op if is_seam else 1)),)
        d.rounded_rectangle([x*k, y*k, (x+w)*k, (y+h)*k], radius=rx*k, fill=fill)
        if rot:
            layer = layer.rotate(-rot, resample=Image.BICUBIC, center=(piv[0]*k, piv[1]*k))
        canvas = Image.alpha_composite(canvas, layer)
    if place["pos"]:
        cx, cy, size, ang = place["pos"]
        layer = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        for dpath, f in ROCKET:
            fill = Image.new("RGB", (1, 1), f).getpixel((0, 0)) + (255,)
            if dpath.startswith("circle"):
                ccx, ccy, cr = (float(v) for v in dpath.split()[1:])
                pts = [rocket_pt(ccx + cr * math.cos(t/24*2*math.pi),
                                 ccy + cr * math.sin(t/24*2*math.pi), cx, cy, size, ang)
                       for t in range(24)]
            else:
                pts = [rocket_pt(x, y, cx, cy, size, ang) for x, y in _points(dpath)]
            d.polygon([(px_*k, py_*k) for px_, py_ in pts], fill=fill)
        canvas = Image.alpha_composite(canvas, layer)
    return canvas.resize((px, px), Image.LANCZOS)

def flat(im, bg):
    out = Image.new("RGB", im.size, bg)
    out.paste(im, (0, 0), im)
    return out

if __name__ == "__main__":
    R = ROCKET_AT
    # Light is the shipped theme. The plate all but disappears on a white
    # browser tab, which is fine because the violet mark carries the shape, and
    # it gives a clean white tile on dark surfaces where the dark plate merged.
    open(f"{REPO}/src/app/icon.svg", "w").write(svg(True, R, "light"))
    open(f"{REPO}/public/brand-mark.svg", "w").write(svg(False, R))
    # Dark plate, kept for the link preview card: that sits on cream, where a
    # near-white plate washes out.
    open(f"{REPO}/public/brand-icon-dark.svg", "w").write(svg(True, R, "dark"))

    render(1024, True, R, "light").save(f"{REPO}/public/brand-icon.png")
    render(1024, False, R).save(f"{REPO}/public/brand-mark.png")
    # iOS ignores transparency and masks its own corners, so ship it opaque
    flat(render(180, True, R, "light"), (251, 250, 255)).save(f"{REPO}/public/apple-icon.png")
    # referenced by src/hooks/useNotifications.ts, which 404d before this existed
    render(48, True, R, "light").save(f"{REPO}/public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    # Instagram crops to a circle, so the square plate would lose its corners:
    # the bare mark goes on a full-bleed cream ground instead.
    prof = Image.new("RGB", (1080, 1080), (240, 237, 230))
    m = render(int(1080 * 0.72), False, R)
    prof.paste(m, ((1080 - m.width) // 2, (1080 - m.height) // 2), m)
    prof.save(f"{REPO}/social-assets/pw-profile-1080.png")

    print("light: icon.svg, brand-icon.png, apple-icon.png, favicon.ico")
    print("dark:  brand-icon-dark.svg (link preview card, which sits on cream)")
    print("bare:  brand-mark.svg, brand-mark.png, pw-profile-1080.png")
