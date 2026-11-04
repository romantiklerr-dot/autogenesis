import json, wave, sys
from vosk import Model, KaldiRecognizer, SetLogLevel
SetLogLevel(-1)
wf = wave.open('tight16k.wav', 'rb')
rec = KaldiRecognizer(Model('vosk_model/vosk-model-en-us-0.22-lgraph'), wf.getframerate())
rec.SetWords(True)
words = []
while True:
    d = wf.readframes(8000)
    if not d: break
    if rec.AcceptWaveform(d):
        words += json.loads(rec.Result()).get('result', [])
words += json.loads(rec.FinalResult()).get('result', [])
json.dump(words, open('words.json', 'w'))
# readable lines: break on gaps > 0.35 s
lines, cur = [], []
for w in words:
    if cur and w['start'] - cur[-1]['end'] > 0.35:
        lines.append(cur); cur = []
    cur.append(w)
lines.append(cur)
with open('transcript.txt', 'w') as fh:
    for l in lines:
        fh.write(f"[{l[0]['start']:7.2f}-{l[-1]['end']:7.2f}] " + ' '.join(w['word'] for w in l) + '\n')
print(len(words), 'words')
