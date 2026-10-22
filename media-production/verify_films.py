import json,subprocess,pathlib,re
from PIL import Image,ImageDraw
root=pathlib.Path(__file__).resolve().parent;out=root.parent/'dist/assets/films';manifest=json.loads((out/'manifest.json').read_text());sheet=Image.new('RGB',(1280,3*450),'#152b30')
for j,f in enumerate(manifest):
 file=out/(f['id']+'.mp4')
 p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height','-of','json',str(file)]))
 assert abs(float(p['format']['duration'])-f['duration'])<.1
 assert any(s['codec_type']=='audio' and s['codec_name']=='aac' for s in p['streams'])
 assert any(s.get('width')==1280 and s.get('height')==720 for s in p['streams'])
 assert len(f['scenes'])==4
 assert all(0<=c['start']<c['end']<=f['duration'] for c in f['cues'])
 subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True,stderr=subprocess.PIPE)
 # Verify motion from differing encoded frame checksums in each of the four shots.
 for k,sc in enumerate(f['scenes']):
  t=(sc['start']+sc['end'])/2
  a=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t),'-i',str(file),'-frames:v','2','-an','-f','framemd5','-'])
  hashes=[line.split(b',')[-1].strip() for line in a.splitlines() if not line.startswith(b'#')]
  assert len(hashes)==2 and hashes[0]!=hashes[1],(f['id'],'motion',k)
  dest=root/'work'/f['id']/'preview'/f'encoded-{k}.jpg'
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(file),'-frames:v','1',str(dest)],check=True)
  im=Image.open(dest);im.thumbnail((640,360));
  if k in [0,3]:sheet.paste(im,((k//3)*640,j*450))
 dr=ImageDraw.Draw(sheet);dr.text((20,j*450+370),f['id']+' | '+str(f['duration'])+' s | H.264 + AAC | 1280x720',fill='#e5dec9')
 print(f['id'],'PASS: decode, audio stream, duration, caption timings, 4 animated scenes',flush=True)
sheet.save(root/'qa-contact-sheet.jpg',quality=88)
