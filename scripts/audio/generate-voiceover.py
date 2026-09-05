import base64, json, os, re, struct, sys, time, urllib.request, urllib.error

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT  = os.environ.get("AUDIO_OUT", os.path.dirname(os.path.abspath(__file__)))

def key():
    for line in open(os.path.join(REPO, ".env")):
        m = re.match(r'^\s*GEMINI_API_KEY\s*=\s*(.+)$', line)
        if m:
            return m.group(1).strip().strip('"').strip("'")
    sys.exit("GEMINI_API_KEY not found in .env")

# Direction, applied to every chapter so the read stays consistent.
STYLE = (
    "Read the following in a calm, measured, low register. Unhurried and flat, "
    "quietly certain. Like a postmortem, not an advertisement. Do not raise pitch "
    "at the end of sentences. Do not sound excited. Pause fully at each line break.\n\n"
)

CHAPTERS = {
  "00-cold": "You wrote a prompt that worked.\nNot okay. Worked.\nIt is gone.",
  "01-loss": "It happened on a Tuesday. You were three messages deep, fixing the output, and the fourth try landed.\nYou copied the result. You did not copy the prompt.\nIt is still in there. Somewhere behind four hundred conversations.",
  "02-why": "Chat history is not a filing system. It is a transcript.\nTranscripts are ordered by time, not by usefulness.\nYour best prompt and a question about a typo carry exactly the same weight.\nAnd search only helps when you already remember the words.",
  "03-tax": "So you rewrite it. And here is what that costs.\nYou do not start from your last version. You start from zero.\nFour rounds of fixing, paid again. Fourth time this month.\nEvery rewrite is a first draft.",
  "04-test": "Try this now. Think of the one prompt you would hate to lose.\nOpen your tool. Find it. Time yourself.\nMost people land near a minute. That is not a memory problem.",
  "05-reframe": "You do not have a prompt writing problem. You write good prompts. You proved that on Tuesday.\nYou have a retrieval problem.\nYour prompt is the asset. The chat log is just the receipt.",
}

MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-pro-preview-tts", "gemini-2.5-flash-preview-tts"]

def wav(pcm, rate=24000, ch=1, bits=16):
    ba = ch * bits // 8
    hdr = (b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " +
           struct.pack("<IHHIIHH", 16, 1, ch, rate, rate*ba, ba, bits) +
           b"data" + struct.pack("<I", len(pcm)))
    return hdr + pcm

def rate_from_mime(mime):
    m = re.search(r"rate=(\d+)", mime or "")
    return int(m.group(1)) if m else 24000

def synth(text, voice, model, api):
    body = json.dumps({
        "contents": [{"parts": [{"text": STYLE + text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api}"
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.load(r)
    part = d["candidates"][0]["content"]["parts"][0]["inlineData"]
    return base64.b64decode(part["data"]), rate_from_mime(part.get("mimeType"))

def run(name, text, voice, api):
    last = None
    for model in MODELS:
        for attempt in range(1, 4):
            try:
                pcm, rate = synth(text, voice, model, api)
                path = os.path.join(OUT, f"vo-{name}.wav")
                open(path, "wb").write(wav(pcm, rate))
                secs = len(pcm) / (rate * 2)
                print(f"  {name:12s} {voice:12s} {model:32s} {secs:6.2f}s  {len(pcm)//1024:5d} KB")
                return secs
            except urllib.error.HTTPError as e:
                last = f"{e.code} {e.read()[:200]!r}"
                if e.code in (429, 500, 503):
                    time.sleep(5 * attempt); continue
                break
            except Exception as e:
                last = repr(e); time.sleep(5 * attempt)
    print(f"  {name:12s} FAILED: {last}")
    return None

if __name__ == "__main__":
    api = key()
    voice = sys.argv[1] if len(sys.argv) > 1 else "Charon"
    only  = sys.argv[2] if len(sys.argv) > 2 else None
    total = 0
    for name, text in CHAPTERS.items():
        if only and only != name: continue
        s = run(name, text, voice, api)
        if s: total += s
    print(f"  {'TOTAL':12s} {total:6.2f}s of voiceover")
