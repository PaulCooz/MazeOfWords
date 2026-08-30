import gzip
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote
from wordfreq import available_languages, zipf_frequency

# change lang and run `python assets/level/words_loader.py`
LANGUAGES = ["en", "ru"]

MIN_LEN = 4
MAX_LEN = 25
POS_TAGS = ("noun", "name")

USER_AGENT = "MazeOfWords/words_loader"
CHUNK = 1024 * 1024
WIKT_LANG_DATA = "https://en.wiktionary.org/wiki/Module:languages/data/2?action=raw"

LEVEL_DIR = Path(__file__).resolve().parent
ROOT = LEVEL_DIR.parents[1]
CACHE_DIR = LEVEL_DIR / "kaikki"
OUT_DIR = LEVEL_DIR / "words"


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8")


def load_lang_names(force: bool) -> dict:
    path = CACHE_DIR / "wikt-lang-names.json"
    if path.exists() and not force:
        return json.loads(path.read_text(encoding="utf-8"))

    print("Fetching Wiktionary language names")
    text = fetch_text(WIKT_LANG_DATA)
    names = dict(re.findall(r'm\["([^"]+)"\]\s*=\s*\{\s*"([^"]+)"', text))
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(names, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return names


def snapshot_urls(wikt_name: str, pos: str):
    enc = quote(wikt_name)
    stem = f"https://kaikki.org/dictionary/{enc}/pos-{pos}/kaikki.org-dictionary-{enc}-by-pos-{pos}"
    yield stem + ".jsonl.gz"
    yield stem + ".jsonl"


def download(url: str, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(dest.name + ".part")
    headers = {"User-Agent": USER_AGENT}
    done = tmp.stat().st_size if tmp.exists() else 0
    if done:
        headers["Range"] = f"bytes={done}-"

    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=60)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise FileNotFoundError(url) from e
        raise

    if getattr(resp, "status", 200) != 206:
        done = 0
        mode = "wb"
    else:
        mode = "ab"

    length = resp.headers.get("Content-Length")
    total = done + int(length) if length else 0
    try:
        with open(tmp, mode) as out:
            while True:
                chunk = resp.read(CHUNK)
                if not chunk:
                    break
                out.write(chunk)
                done += len(chunk)
                if total:
                    pct = done * 100 // total
                    print(f"\r  {done // (1024 * 1024)}/{total // (1024 * 1024)} MB ({pct}%)", end="", flush=True)
        print()
        tmp.replace(dest)
    finally:
        resp.close()


def ensure_snapshot(lang: str, wikt_name: str, pos: str, force: bool):
    gz = CACHE_DIR / f"{lang}-{pos}.jsonl.gz"
    raw = CACHE_DIR / f"{lang}-{pos}.jsonl"
    if not force:
        if gz.exists():
            print(f"Using cached {gz.name}")
            return gz
        if raw.exists():
            print(f"Using cached {raw.name}")
            return raw

    last_error = None
    for url in snapshot_urls(wikt_name, pos):
        dest = gz if url.endswith(".gz") else raw
        print(f"Downloading {url}")
        try:
            download(url, dest)
            return dest
        except FileNotFoundError as e:
            last_error = e
    print(f"  skip {lang} {pos}: not on kaikki.org ({last_error})")
    return None


def ingest(path: Path, lang: str, all_words: dict):
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8") as f:
        for line in f:
            obj = json.loads(line)
            word = obj.get("word")
            senses = obj.get("senses")
            if not word or not senses:
                continue
            if len(word) < MIN_LEN or len(word) > MAX_LEN or not word.isalpha() or word.isupper():
                continue

            frequency = zipf_frequency(word, lang)
            if frequency <= 0.0:
                continue
            if not word.islower():
                frequency *= 0.5

            for sense in senses:
                tags = sense.get("tags", [])
                if "form-of" in tags or "vulgar" in tags:
                    continue

                word_lower = word.lower()
                prev = all_words.get(word_lower)
                if prev is None:
                    all_words[word_lower] = {"word": word, "freq": frequency}
                else:
                    prev["freq"] = max(prev["freq"], frequency)
                break


def convert(lang: str, paths: list):
    all_words = {}
    for path in paths:
        print(f"Parsing {path.name}")
        ingest(path, lang, all_words)

    ranked = [t["word"] for t in sorted(all_words.values(), key=lambda item: item["freq"], reverse=True)]
    words_by_len = {}
    max_len = 0
    for word in ranked:
        n = len(word)
        max_len = max(max_len, n)
        words_by_len.setdefault(n, []).append(word)

    out = OUT_DIR / f"words_all_{lang}.txt"
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        for i in range(MIN_LEN, max_len + 1):
            for word in words_by_len.get(i, []):
                f.write(word)
                f.write("\n")

    print(f"Saved {len(ranked)} {lang} words -> {out}")


def main():
    force = "--force" in sys.argv
    names = load_lang_names(force)
    wordfreq_langs = available_languages()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for lang in LANGUAGES:
        if lang not in names:
            sys.exit(f"Unknown ISO 639-1 code {lang!r} (not in Wiktionary language data)")
        if lang not in wordfreq_langs:
            supported = ", ".join(sorted(wordfreq_langs))
            sys.exit(f"wordfreq has no data for {lang!r}. Supported: {supported}")

        wikt_name = names[lang]
        print(f"=== {lang} ({wikt_name}) ===")
        paths = []
        for pos in POS_TAGS:
            path = ensure_snapshot(lang, wikt_name, pos, force)
            if path:
                paths.append(path)
        if not paths:
            sys.exit(f"No noun/name dumps for {lang} ({wikt_name})")
        convert(lang, paths)


if __name__ == "__main__":
    main()
