import json
from wordfreq import zipf_frequency

language = {
    "en": "English",
    "ru": "Russian"
}

MIN_LEN = 4
MAX_LEN = 25

for lang in language:
    files = [
        f"kaikki.org-dictionary-{language[lang]}-by-pos-noun.jsonl",
        f"kaikki.org-dictionary-{language[lang]}-by-pos-name.jsonl",
    ]

    allWords = dict()
    maxLen = 0

    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            for line in f:
                obj = json.loads(line)

                word = obj.get("word")
                if len(word) < MIN_LEN or len(word) > MAX_LEN or not word.isalpha() or word.isupper():
                    continue

                for sense in obj["senses"]:
                    tags = sense.get("tags", [])
                    frequency = zipf_frequency(word, lang)

                    if "form-of" in tags or "vulgar" in tags or frequency <= 0.0:
                        continue

                    isLower = word.islower()
                    if not isLower:
                        frequency *= 0.5

                    wordLower = word.lower()
                    maxLen = max(maxLen, len(word))
                    allWords[wordLower] = {
                        "word": allWords.get(wordLower, { "word": word })["word"],
                        "freq": max(allWords.get(wordLower, { "freq": 0 })["freq"], frequency)
                    }

    allWords = [t["word"] for t in sorted(allWords.values(), key=lambda word: word["freq"], reverse=True)]
    wordsByLen = dict()
    for word in allWords:
        if not len(word) in wordsByLen:
            wordsByLen[len(word)] = []
        wordsByLen[len(word)].append(word)

    with open(f"words_all_{lang}.txt", "w", encoding="utf-8", newline="\n") as f:
        for i in range(MIN_LEN, maxLen + 1):
            if i in wordsByLen:
                for word in wordsByLen[i]:
                    f.write(word)
                    f.write("\n")

    print(f"Saved {len(allWords)} {lang} words")
