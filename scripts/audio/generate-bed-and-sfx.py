"""Ambient bed and interface SFX for post 01. Pure stdlib, no numpy."""
import array, math, os, random, wave

OUT = os.environ.get("AUDIO_OUT", os.path.dirname(os.path.abspath(__file__)))
DUR = 128.4          # full picture length
SR_M = 22050         # the pad has nothing above 2 kHz
SR_S = 44100         # clicks need the high end

def write_wav(path, samples, rate):
    w = wave.open(path, "wb")
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
    w.writeframes(samples.tobytes()); w.close()
    print(f"  {os.path.basename(path):16s} {len(samples)/rate:7.2f}s  {len(samples)*2//1024:6d} KB")

# ── Music bed ────────────────────────────────────────────────────────────────
# A minor, held. Two detuned oscillators per voice for slow beating, each voice
# on its own slow LFO so the texture drifts instead of sitting still.
VOICES = [
    # (hz,   level, lfo hz, detune hz, harmonics)
    (55.00,  0.34, 0.031, 0.09, [(1, 1.0), (2, 0.22)]),   # A1 root
    (110.00, 0.24, 0.043, 0.13, [(1, 1.0), (2, 0.16)]),   # A2
    (130.81, 0.15, 0.037, 0.11, [(1, 1.0)]),              # C3, the minor third
    (164.81, 0.13, 0.053, 0.15, [(1, 1.0)]),              # E3
    (261.63, 0.075, 0.029, 0.17, [(1, 1.0)]),             # C4
    (392.00, 0.045, 0.061, 0.19, [(1, 1.0)]),             # G4, minor seventh colour
]

def music():
    n = int(DUR * SR_M)
    out = array.array("h", bytes(2 * n))
    tau = 2 * math.pi
    for hz, lvl, lfo_hz, det, harms in VOICES:
        for mult, hamp in harms:
            for sign in (-1, 1):
                f = hz * mult + sign * det
                inc = tau * f / SR_M
                linc = tau * lfo_hz / SR_M
                ph = random.uniform(0, tau); lph = random.uniform(0, tau)
                a = lvl * hamp * 0.5
                for i in range(n):
                    # slow tremolo keeps it from reading as a held organ chord
                    env = 0.62 + 0.38 * (0.5 + 0.5 * math.sin(lph))
                    out[i] += int(32767 * a * env * math.sin(ph) * 0.30)
                    ph += inc; lph += linc
    # 3s in, 6s out, and duck the last stretch so the closing lines sit dry
    fi, fo = int(3 * SR_M), int(6 * SR_M)
    duck_at = int(118.0 * SR_M)
    for i in range(n):
        g = 1.0
        if i < fi: g = i / fi
        if i > n - fo: g = min(g, (n - i) / fo)
        if i > duck_at: g *= max(0.35, 1.0 - (i - duck_at) / (n - duck_at) * 0.65)
        if g != 1.0: out[i] = int(out[i] * g)
    write_wav(os.path.join(OUT, "music.wav"), out, SR_M)

# ── Interface SFX ────────────────────────────────────────────────────────────
def env_exp(i, ln, k=9.0):
    return math.exp(-k * i / ln)

def mix(buf, at_s, gen, rate=SR_S):
    start = int(at_s * rate)
    for i, v in enumerate(gen):
        j = start + i
        if 0 <= j < len(buf):
            s = buf[j] + int(v * 32767)
            buf[j] = max(-32768, min(32767, s))

def click(level=0.16, ms=14, tone=2600):
    ln = int(SR_S * ms / 1000)
    return [level * env_exp(i, ln, 14) * (0.6*math.sin(2*math.pi*tone*i/SR_S) + 0.4*random.uniform(-1,1)) for i in range(ln)]

def clack(level=0.08):
    ln = int(SR_S * 0.022)
    return [level * env_exp(i, ln, 16) * (0.35*math.sin(2*math.pi*1400*i/SR_S) + 0.65*random.uniform(-1,1)) for i in range(ln)]

def thud(level=0.30):
    ln = int(SR_S * 0.32)
    return [level * env_exp(i, ln, 7) * math.sin(2*math.pi*78*i/SR_S) for i in range(ln)]

def woosh(level=0.10, ms=420):
    ln = int(SR_S * ms / 1000)
    out = []
    lp = 0.0
    for i in range(ln):
        x = i / ln
        bell = math.sin(math.pi * x) ** 2
        lp = lp * 0.86 + random.uniform(-1, 1) * 0.14   # cheap lowpass on noise
        out.append(level * bell * lp * 3.0)
    return out

def rumble(level=0.045, secs=8.0):
    ln = int(SR_S * secs); out = []; lp = 0.0
    for i in range(ln):
        x = i / ln
        bell = min(1.0, min(x, 1 - x) * 8)
        lp = lp * 0.975 + random.uniform(-1, 1) * 0.025
        out.append(level * bell * lp * 6.0)
    return out

def stroke(level=0.13, ms=190):
    ln = int(SR_S * ms / 1000); out = []; lp = 0.0
    for i in range(ln):
        x = i / ln
        lp = lp * 0.80 + random.uniform(-1, 1) * 0.20
        out.append(level * (x ** 0.5) * (1 - x) ** 1.5 * lp * 5.0)
    return out

# Cue times on the retimed 128.4s picture.
CHAPTER_CUTS = [10.50, 35.30, 61.20, 85.10, 104.60]
CHIP_LANDS   = [67.40, 69.60, 71.20, 72.70]

def sfx():
    n = int(DUR * SR_S)
    buf = array.array("h", bytes(2 * n))
    random.seed(7)

    # typing under the cold open, irregular like real hands
    t = 0.55
    while t < 4.45:
        mix(buf, t, clack()); t += random.uniform(0.055, 0.135)

    mix(buf, 5.20, thud())                       # the card falls
    for c in CHAPTER_CUTS:                       # every chapter cut
        mix(buf, c - 0.14, woosh())
        mix(buf, c, click(0.13))
    mix(buf, 27.0, rumble(secs=8.3))             # the scroll
    for c in CHIP_LANDS:
        mix(buf, c, click(0.15, tone=1900))      # v1 through v4
    mix(buf, 74.60, click(0.30, ms=26, tone=900))  # the snap back
    t = 90.95                                    # stopwatch
    while t < 98.47:
        mix(buf, t, click(0.045, ms=8, tone=3400)); t += 0.5
    mix(buf, 108.10, stroke())                   # the strike-through
    write_wav(os.path.join(OUT, "sfx.wav"), buf, SR_S)

if __name__ == "__main__":
    print("synthesizing:")
    music()
    sfx()
