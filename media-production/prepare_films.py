import json,pathlib,subprocess,concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parent
FILMS=[
 dict(id='lushan',poemId='lb-lushan',title='望庐山瀑布',author='李白',era='唐',duration=60,voiceRate=110,tagline='从人间飞瀑，望见九天银河',location='庐山 · 山水想象',opening='走近庐山。晨光照着山峰，水雾中，升起一片紫烟。',ending='飞瀑与银河，在想象中相逢。再看一眼，你心中的庐山。',lines=['日照香炉生紫烟，','遥看瀑布挂前川。','飞流直下三千尺，','疑是银河落九天。'],scenes=[dict(start=0,end=19,panel=0,label='晨光 · 紫烟'),dict(start=19,end=32,panel=1,label='遥望 · 挂川'),dict(start=32,end=44,panel=2,label='飞瀑 · 千尺'),dict(start=44,end=60,panel=3,label='银河 · 九天')],music='明亮五声音阶 · 轻拨弦与气息长音',discussion='“三千尺”与“银河落九天”，怎样把眼前风景变成浪漫想象？'),
 dict(id='chunwang',poemId='df-chunwang',title='春望',author='杜甫',era='唐',duration=62,voiceRate=115,tagline='一城春色，写不尽家国之思',location='长安 · 757年春',opening='长安的春天，又来了。山河依旧，城中却是深深的草木。',ending='春花与鸟鸣，为什么让诗人落泪？再读一遍，听见他的牵挂。',lines=['国破山河在，','城春草木深。','感时花溅泪，','恨别鸟惊心。','烽火连三月，','家书抵万金。','白头搔更短，','浑欲不胜簪。'],scenes=[dict(start=0,end=23,panel=0,label='山河 · 草木'),dict(start=23,end=35,panel=1,label='春花 · 鸟鸣'),dict(start=35,end=48,panel=2,label='烽火 · 家书'),dict(start=48,end=62,panel=3,label='白头 · 牵挂')],music='低音五声旋律 · 稀疏拨弦与低缓长音',discussion='同样是春天，花与鸟为什么会触发家国之悲？'),
 dict(id='chibi',poemId='ss-nian',title='念奴娇·赤壁怀古',author='苏轼',era='宋',duration=66,voiceRate=155,tagline='一江风浪，与千古人物相逢',location='黄州 · 怀古想象',opening='站在黄州江边，让目光随大江远去。',ending='从千古英雄，回到眼前江月。听，江水仍在向前。',lines=['大江东去，浪淘尽，千古风流人物。','故垒西边，人道是，三国周郎赤壁。','乱石穿空，惊涛拍岸，卷起千堆雪。','江山如画，一时多少豪杰。','遥想公瑾当年，小乔初嫁了，雄姿英发。','羽扇纶巾，谈笑间，樯橹灰飞烟灭。','故国神游，多情应笑我，早生华发。','人生如梦，一尊还酹江月。'],scenes=[dict(start=0,end=21,panel=0,label='大江 · 千古'),dict(start=21,end=34,panel=1,label='乱石 · 惊涛'),dict(start=34,end=49,panel=2,label='历史想象 · 周瑜'),dict(start=49,end=66,panel=3,label='江月 · 回望')],music='宽广五声旋律 · 拨弦与低鼓，收束于月夜长音',discussion='词人怎样从周瑜的意气风发，写到自己的生命感受？')
]
for f in FILMS:
 f['speech']=[dict(key='title',text=f['title']+'。'+f['era']+'，'+f['author']+'。',rate=f['voiceRate']+5),dict(key='opening',text=f['opening'],rate=f['voiceRate']+10)]+[dict(key='line'+str(i),text=t,rate=f['voiceRate']) for i,t in enumerate(f['lines'])]+[dict(key='ending',text=f['ending'],rate=f['voiceRate']+10)]
 jobs=ROOT/'work'/f['id'];jobs.mkdir(parents=True,exist_ok=True)
 for sp in f['speech']:sp['file']=str(jobs/(sp['key']+'.aiff'))
def voice(job):
 f,sp=job
 # Speech-only homophones disambiguate classical polyphonic characters; displayed text remains the poem.
 spoken=sp['text']
 if f['id']=='chunwang':spoken=spoken.replace('不胜簪','不升簪')
 if f['id']=='chibi':spoken=spoken.replace('羽扇纶巾','羽扇关巾').replace('早生华发','早生花发').replace('一尊还酹江月','一尊环酹江月')
 subprocess.run(['say','-v','Tingting','-r',str(sp['rate']),'-o',sp['file'],spoken],check=True)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',sp['file']]))
 sp['length']=float(probe['format']['duration'])
 if sp['length']<.2:raise ValueError('empty narration '+sp['file'])
 return f['id'],sp['key'],round(sp['length'],2)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  for r in pool.map(voice,[(f,sp) for f in FILMS for sp in f['speech']]):print(*r,flush=True)
 (ROOT/'films.json').write_text(json.dumps(FILMS,ensure_ascii=False,indent=2))
