"""Generate native-rate neural narration; preserve existing picture/subtitle timing."""
import asyncio,json,pathlib,subprocess
import edge_tts
ROOT=pathlib.Path(__file__).resolve().parent
async def main():
 films=json.loads((ROOT/'timing.json').read_text())
 for f in films:
  out=ROOT/'work'/f['id']/'neural';out.mkdir(parents=True,exist_ok=True)
  cues=f['cues']; cues[0]['start']=.25; poems=[c for c in cues if c['kind']=='poem']
  for sp in f['speech']:
   key=sp['key']; dest=out/(key+'.mp3')
   text=sp['text']
   cue=poems[int(key[4:])] if key.startswith('line') else next(c for c in cues if c['kind']==key)
   next_start=min([c['start'] for c in cues if c['start']>cue['start']]+[f['duration']-.8])
   # No pitch manipulation or time stretching. Punctuation retains phrase prosody.
   rate='-8%' if key.startswith('line') else '+0%'
   if not dest.exists():await edge_tts.Communicate(text,'zh-CN-YunxiNeural',rate=rate).save(str(dest))
   length=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(dest)]))
   if length>next_start-cue['start']-.15:raise ValueError(f'{f["id"]}/{key} needs {length:.2f}s; slot {next_start-cue["start"]:.2f}s')
   sp.update(file=str(dest.relative_to(ROOT)),length=length);cue['end']=round(cue['start']+length,3)
   print(f['id'],key,round(length,2),flush=True)
 (ROOT/'natural-timing.json').write_text(json.dumps(films,ensure_ascii=False,indent=2))
asyncio.run(main())
