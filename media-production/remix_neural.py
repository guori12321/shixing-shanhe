"""Remix neural voice with quieter score, without re-encoding the existing paintings."""
import json,subprocess,wave
import numpy as np
import render_films as r
r.SR=24000
films=json.loads((r.ROOT/'natural-timing.json').read_text())
for f in films:
 n=int(f['duration']*r.SR);voice=np.zeros((n,2),np.float32)
 for sp in f['speech']:
  key=sp['key'];cue=next(c for c in f['cues'] if c['kind']=='poem' and c['line']==int(key[4:])) if key.startswith('line') else next(c for c in f['cues'] if c['kind']==key)
  r.add_clip(voice,r.read_audio(sp['file'],1),cue['start'])
 music=r.score(f,f['duration'])*.72;ambience=r.soundscape(f,n)*.7
 duck=np.ones(n,np.float32)
 for c in f['cues']:
  a=max(0,int((c['start']-.3)*r.SR));b=min(n,int((c['end']+.5)*r.SR));duck[a:b]=.36
 # Smooth gain transitions avoid pumping between narration and music.
 kernel=np.ones(6000)/6000;duck=np.convolve(np.pad(duck,(3000,2999),mode='edge'),kernel,mode='valid')
 full=voice+music*duck[:,None]+ambience
 fade=np.minimum(1,np.arange(n)/r.SR/1.3)*np.minimum(1,(n-np.arange(n))/r.SR/2)
 full=np.tanh(full*1.1)*.88*fade[:,None]
 path=r.ROOT/'work'/f['id']/'neural'/'mix.wav'
 with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(r.SR);w.writeframes((full*32767).astype('<i2').tobytes())
 video=r.OUT/(f['id']+'.mp4');temp=video.with_suffix('.natural.mp4')
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(video),'-i',str(path),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000','-t',str(f['duration']),'-movflags','+faststart',str(temp)],check=True)
 temp.replace(video)
 (r.OUT/(f['id']+'.vtt')).write_text('WEBVTT\n\n'+'\n\n'.join(r.vtt_time(c['start'])+' --> '+r.vtt_time(c['end'])+'\n'+c['text'] for c in f['cues'])+'\n')
 print(f['id'],'remixed',flush=True)
manifest=[{k:f[k] for k in ['id','poemId','title','author','era','duration','tagline','location','music','discussion','scenes','cues']} for f in films]
(r.OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
