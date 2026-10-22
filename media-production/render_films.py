"""Render memory-bounded illustrated poetry films with timed narration and an original score."""
import json,math,pathlib,subprocess,wave,concurrent.futures
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
ROOT=pathlib.Path(__file__).resolve().parent
OUT=ROOT.parent/'dist/assets/films';OUT.mkdir(parents=True,exist_ok=True)
W,H,FPS,SR=1280,720,24,22050
FONT='/System/Library/Fonts/Supplemental/Songti.ttc'
SANS='/System/Library/Fonts/Hiragino Sans GB.ttc'
FONTS={s:ImageFont.truetype(FONT,s) for s in [18,22,24,28,32,36,40,50,58]}
SMALL=ImageFont.truetype(SANS,16)
FILMS=json.loads((ROOT/'films.json').read_text())
def read_audio(path,speed=1):
 path=pathlib.Path(path)
 if not path.is_absolute():path=ROOT/path
 args=['ffmpeg','-v','error','-i',str(path),'-af',f'atempo={speed},highpass=f=85,lowpass=f=8500','-f','f32le','-ar',str(SR),'-ac','1','pipe:1']
 a=np.frombuffer(subprocess.check_output(args),dtype=np.float32).copy()
 peak=np.max(np.abs(a))
 if peak<.001:raise ValueError('Silent narration')
 return a*(.72/peak)
def add_clip(track,a,start,pan=0):
 i=int(start*SR);a=a[:max(0,len(track)-i)]
 if not len(a):return
 track[i:i+len(a),0]+=a*math.sqrt((1-pan)/2)
 track[i:i+len(a),1]+=a*math.sqrt((1+pan)/2)
def note(freq,duration,kind='pluck'):
 t=np.arange(int(duration*SR))/SR
 if kind=='pluck':
  env=(1-np.exp(-t*90))*np.exp(-t*1.7)
  tone=sum(np.sin(2*np.pi*freq*n*t)*np.exp(-t*n*.4)/n**1.45 for n in range(1,7))
 else:
  env=np.minimum(1,t/.6)*np.minimum(1,(duration-t)/.9)
  tone=(np.sin(2*np.pi*freq*t+.01*np.sin(2*np.pi*4*t))+.15*np.sin(2*np.pi*freq*2*t))*.25
 return tone*env

def soundscape(f,n):
 rng=np.random.default_rng({'lushan':12,'chunwang':25,'chibi':42}[f['id']])
 noise=rng.standard_normal(n).astype(np.float32)
 # A soft low-frequency moving air/water bed, generated from noise rather than a recording.
 spectrum=np.fft.rfft(noise);freq=np.fft.rfftfreq(n,1/SR)
 shaped=np.fft.irfft(spectrum/np.maximum(freq,45)**.65,n=n).astype(np.float32)
 shaped/=max(np.std(shaped),1e-7)
 t=np.arange(n)/SR
 bed=shaped*(.006+.003*np.sin(t*.52))
 if f['id']!='chunwang':bed+=noise*.003*(.6+.4*np.sin(t*.8)**2)
 a=np.stack([bed,np.roll(bed,int(.025*SR))],axis=1)
 if f['id']=='chunwang':
  for st in [24,28,31]:
   tt=np.arange(int(.4*SR))/SR;chirp=np.sin(2*np.pi*(1500*tt+1800*tt*tt))*np.sin(np.pi*tt/.4)**2*.014
   add_clip(a,chirp,st,pan=.4)
 return a

def score(f,duration):
 n=int(duration*SR);music=np.zeros((n,2),np.float32)
 palettes={'lushan':([64,67,69,71,74,71,69,67,64,62,64,67],1.7), 'chunwang':([57,60,62,64,62,60,57,55,57,60],2.2),'chibi':([50,57,60,62,65,62,60,57,53,57,62,60],1.7)}
 melody,beat=palettes[f['id']]
 for i,st in enumerate(np.arange(1,duration-2,beat)):
  midi=melody[i%len(melody)];freq=440*2**((midi-69)/12)
  add_clip(music,note(freq,3)*.058,st,pan=.25*math.sin(i))
  if i%4==0:add_clip(music,note(freq/2,5,'flute')*.08,st,pan=-.25)
 for i,st in enumerate(np.arange(0,duration,7)):
  midi=melody[(i*3)%len(melody)]-12
  add_clip(music,note(440*2**((midi-69)/12),8,'flute')*.09,st,pan=.15)
 if f['id']=='chibi':
  for st in np.arange(32,49,2.0):
   tt=np.arange(int(.7*SR))/SR;drum=np.sin(2*np.pi*(65*tt-14*tt*tt))*np.exp(-tt*7)*.048
   add_clip(music,drum,st)
 # A small stereo reflection gives the sparse notes room without masking speech.
 delay=int(.28*SR);music[delay:,1]+=music[:-delay,0]*.18
 return music

def schedule_audio(f):
 d=f['duration'];voice=np.zeros((int(d*SR),2),np.float32)
 clips={sp['key']:read_audio(sp['file'],.82 if f['id']!='chibi' and sp['key'].startswith('line') else .9) for sp in f['speech']}
 durations={k:len(v)/SR for k,v in clips.items()}
 title_start=1.2;opening_start=title_start+durations['title']+.7
 start=max(opening_start+durations['opening']+1.2,15 if f['id']!='chibi' else 11)
 ending_start=d-1.8-durations['ending']
 lengths=[durations['line'+str(i)] for i in range(len(f['lines']))]
 available=ending_start-1.5-start-sum(lengths)
 if available<0:raise ValueError(f'Too much speech: {f["id"]}: {available}')
 gap=available/(len(lengths)-1)
 f['cues']=[dict(start=title_start,end=title_start+durations['title'],text=f['title']+' · '+f['author'],kind='title'),dict(start=opening_start,end=opening_start+durations['opening'],text=f['opening'],kind='opening')]
 for k,st in [('title',title_start),('opening',opening_start),('ending',ending_start)]:add_clip(voice,clips[k],st)
 cursor=start
 for i,text in enumerate(f['lines']):
  key='line'+str(i);length=durations[key];add_clip(voice,clips[key],cursor)
  f['cues'].append(dict(start=round(cursor,3),end=round(cursor+length,3),text=text,kind='poem',line=i))
  cursor+=length+gap
 f['cues'].append(dict(start=ending_start,end=d-1.8,text=f['ending'],kind='ending'))
 indices=[0,1,2,3] if f['id']=='lushan' else [0,2,4,6]
 poem=[c for c in f['cues'] if c['kind']=='poem']
 for i,sc in enumerate(f['scenes']):
  sc['start']=0 if i==0 else poem[indices[i]]['start']-.65
  sc['end']=d if i==3 else poem[indices[i+1]]['start']-.65
 music=score(f,d);ambience=soundscape(f,len(voice))
 duck=np.ones(len(voice),np.float32)
 for c in f['cues']:
  l=max(0,int((c['start']-.25)*SR));r=min(len(voice),int((c['end']+.45)*SR));duck[l:r]=.52
 music*=duck[:,None]
 full=voice+music+ambience
 fade=np.minimum(1,np.arange(len(full))/SR/1.3)*np.minimum(1,(len(full)-np.arange(len(full)))/SR/2)
 full*=fade[:,None]
 full=np.tanh(full*1.1)*.88
 path=ROOT/'work'/f['id']/'mix.wav'
 with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((full*32767).astype('<i2').tobytes())
 f['audio']=str(path)
 print(f['id'],'scheduled',round(start,1),'to',round(ending_start,1),'gap',round(gap,2),flush=True)
 return full

# Permanent soft gradients keep typography readable without a solid black card.
y=np.arange(H)[:,None];top=np.clip((120-y)/120,0,1)*100;bottom=np.clip((y-490)/230,0,1)*175
mask=np.maximum(top,bottom).astype(np.uint8);mask=np.repeat(mask,W,axis=1)
shade=Image.new('RGBA',(W,H),(8,18,22,0));shade.putalpha(Image.fromarray(mask))
cloud=Image.new('RGBA',(1000,180));cd=ImageDraw.Draw(cloud)
for cx,cy,rx,ry in [(170,90,160,45),(400,75,270,35),(700,100,240,40),(860,80,120,25)]:cd.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=(190,205,212,22))
cloud=cloud.filter(ImageFilter.GaussianBlur(24))
def center(draw,text,y,font,color=(251,245,222),stroke=1):
 box=draw.textbbox((0,0),text,font=font);x=(W-(box[2]-box[0]))/2
 draw.text((x,y),text,font=font,fill=color,stroke_width=stroke,stroke_fill=(5,12,18))
def wrap(text,maxchars=24):
 if len(text)<=maxchars:return [text]
 parts=[];line=''
 for c in text:
  line+=c
  if len(line)>=maxchars and c in '，。？！；、':parts.append(line);line=''
  elif len(line)>=maxchars+6:parts.append(line);line=''
 if line:parts.append(line)
 return parts

def make_frame(f,shots,t):
 scidx=next((i for i,s in enumerate(f['scenes']) if s['start']<=t<s['end']),3)
 sc=f['scenes'][scidx];u=(t-sc['start'])/max(1,sc['end']-sc['start'])
 def shotframe(index,progress):
  z=1.025+.085*progress if index%2==0 else 1.11-.07*progress
  sw,sh=int(W*z),int(H*z);im=shots[index].resize((sw,sh),Image.Resampling.BICUBIC)
  ox=int((sw-W)*(.25+.5*progress));oy=int((sh-H)*(.65-.3*progress))
  return im.crop((ox,oy,ox+W,oy+H)).convert('RGBA')
 frame=shotframe(scidx,u)
 # Brief dissolves bridge the four painted scenes.
 if scidx>0 and t-sc['start']<1.2:
  prev=shotframe(scidx-1,1);frame=Image.blend(prev,frame,max(0,(t-sc['start'])/1.2))
 atm=Image.new('RGBA',(W,H));dr=ImageDraw.Draw(atm)
 # Slow drift of valley mist / urban haze across independently moving layers.
 mistx=int(-260+(t*11)%600);misty=340 if f['id']!='chunwang' else 250
 atm.alpha_composite(cloud,(mistx,misty));atm.alpha_composite(cloud,(int(500-t*5)%1000-250,misty+100))
 if f['id']=='lushan':
  if scidx in [1,2]:
   for i in range(50):
    phase=(t*.34+i*.137)%1;x=(.48+.16*math.sin(i*3.7))*W;y=(.13+.72*phase)*H
    a=int(20+30*math.sin(phase*math.pi));dr.line((x,y,x-2,y+12+i%12),fill=(230,245,255,a),width=1+i%2)
   for i in range(30):
    x=(i*97+t*13)%W;y=430+80*math.sin(i+t*1.7);dr.ellipse((x,y,x+2,y+2),fill=(233,244,255,80))
  elif scidx==3:
   for i in range(45):
    x=(i*197.7)%W;y=(i*71.3)%330;a=int(80+90*math.sin(t*1.4+i)**2);dr.ellipse((x,y,x+2,y+2),fill=(230,237,255,a))
 elif f['id']=='chunwang':
  if scidx==1:
   for i in range(23):
    x=(i*129+t*(18+i%3*5))%(W+60)-30;y=(i*71+t*(11+i%4))%H
    r=3+i%3;ang=t+i;dx=math.cos(ang)*r;dy=math.sin(ang)*r
    dr.ellipse((x-r,y-r/2,x+r,y+r/2),fill=(234,189,187,90))
   for i in range(15):
    x=(i*103+t*3)%W;y=(i*57+t*70)%H;dr.line((x,y,x-3,y+15),fill=(219,226,230,22),width=1)
  elif scidx==2:
   pulse=18+int(10*math.sin(t*5));dr.ellipse((W*.57,H*.6,W*.68,H*.72),fill=(255,184,80,pulse))
   for i in range(12):
    x=150+i*70+12*math.sin(t*.8+i);y=230+(i*41-t*7)%250;dr.ellipse((x,y,x+2,y+2),fill=(239,214,160,45))
 else:
  if scidx==2:
   for i in range(24):
    x=(i*97+t*8)%W;y=H*.6-((t*16+i*23)%180);dr.ellipse((x,y,x+2,y+2),fill=(255,186,95,50))
  else:
   for i in range(18):
    x=(i*101+t*(7 if scidx!=1 else 22))%W;y=H*.58+(i*31)%140+8*math.sin(t*1.8+i)
    dr.arc((x,y,x+40+i%4*12,y+5),0,165,fill=(221,244,245,32+int(35*math.sin(t+i)**2)),width=1)
 frame=Image.alpha_composite(frame,atm);frame=Image.alpha_composite(frame,shade)
 d=ImageDraw.Draw(frame)
 d.text((45,26),f['title'],font=FONTS[28],fill=(246,237,210),stroke_width=1,stroke_fill=(11,24,28))
 d.text((47,68),f['era']+' · '+f['author']+'    /    '+sc['label'],font=SMALL,fill=(219,220,205))
 d.text((1030,32),'诗意场景 · 艺术复现',font=SMALL,fill=(219,220,205))
 if t<5.8:
  alpha=min(1,t/.9,max(0,(5.8-t)/1.1))
  title_layer=Image.new('RGBA',(W,H));td=ImageDraw.Draw(title_layer)
  center(td,f['title'],230,FONTS[58],(250,239,205,int(255*alpha)),stroke=1)
  center(td,f['tagline'],312,FONTS[24],(235,233,210,int(235*alpha)),stroke=0)
  frame=Image.alpha_composite(frame,title_layer);d=ImageDraw.Draw(frame)
 poems=[c for c in f['cues'] if c['kind']=='poem']
 active=next((c for c in reversed(poems) if c['start']<=t),None)
 nonpoem=next((c for c in f['cues'] if c['kind'] in ['opening','ending'] and c['start']-.2<=t<=c['end']+.3),None)
 if nonpoem:
  lines=wrap(nonpoem['text'],26)
  for j,l in enumerate(lines):center(d,l,H-112+(j-(len(lines)-1)/2)*34,FONTS[24],(226,229,214),1)
 elif active and t<max(c['end'] for c in poems)+1.5:
  lines=wrap(active['text'],25)
  if active['line']>0 and len(lines)==1:center(d,f['lines'][active['line']-1],H-136,FONTS[22],(177,189,184),0)
  for j,l in enumerate(lines):center(d,l,H-101+(j-(len(lines)-1)/2)*43,FONTS[36],(255,241,199),1)
 # Restrained cinematic progress indicator and closing imprint.
 d.line((45,H-29,W-45,H-29),fill=(200,211,204,45),width=2)
 d.line((45,H-29,45+(W-90)*min(1,t/f['duration']),H-29),fill=(205,181,119,190),width=2)
 if t>f['duration']-1.5:
  black=Image.new('RGBA',(W,H),(4,12,17,int(255*(t-f['duration']+1.5)/1.5)));frame=Image.alpha_composite(frame,black)
 if t<.7:frame=Image.blend(Image.new('RGBA',(W,H),(4,12,17,255)),frame,t/.7)
 return frame.convert('RGB')

def vtt_time(sec):
 ms=round(sec*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
def render(f):
 schedule_audio(f)
 sheet=Image.open(ROOT/(f['id']+'-storyboard.png')).convert('RGB');sw,sh=sheet.size
 shots=[]
 # Extract panels directly as film shots; preserve the generated source sheet.
 for x,y in [(0,0),(1,0),(0,1),(1,1)]:
  im=sheet.crop((x*sw//2+2,y*sh//2+2,(x+1)*sw//2-2,(y+1)*sh//2-2));iw,ih=im.size
  if iw/ih>W/H:
   want=int(ih*W/H);im=im.crop(((iw-want)//2,0,(iw+want)//2,ih))
  else:
   want=int(iw*H/W);im=im.crop((0,(ih-want)//2,iw,(ih+want)//2))
  shots.append(im.resize((W,H),Image.Resampling.LANCZOS))
 poster=make_frame(f,shots,2.5);poster.save(OUT/(f['id']+'-poster.jpg'),quality=90)
 work=ROOT/'work'/f['id'];(work/'preview').mkdir(exist_ok=True)
 for t in [3,20,35,50]:make_frame(f,shots,t).save(work/'preview'/f'{t}.jpg',quality=90)
 cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',f['audio'],'-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar',str(SR),'-t',str(f['duration']),'-movflags','+faststart',str(OUT/(f['id']+'.mp4'))]
 with (work/'encode.log').open('w') as log:
  proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=log)
  for n in range(int(f['duration']*FPS)):
   proc.stdin.write(make_frame(f,shots,n/FPS).tobytes())
   if n%(FPS*15)==0:print(f['id'],n//FPS,'/',f['duration'],'seconds',flush=True)
  proc.stdin.close();code=proc.wait()
  if code:raise RuntimeError((work/'encode.log').read_text())
 cues=sorted(f['cues'],key=lambda c:c['start'])
 (OUT/(f['id']+'.vtt')).write_text('WEBVTT\n\n'+'\n\n'.join(vtt_time(c['start'])+' --> '+vtt_time(c['end'])+'\n'+c['text'] for c in cues)+'\n')
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,sample_rate,channels','-of','json',str(OUT/(f['id']+'.mp4'))]))
 print(f['id'],'FINISHED',probe,flush=True)
 return f
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:result=list(pool.map(render,FILMS))
 (ROOT/'timing.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 manifest=[{k:f[k] for k in ['id','poemId','title','author','era','duration','tagline','location','music','discussion','scenes','cues']} for f in result]
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
