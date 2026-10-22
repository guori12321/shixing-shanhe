"""Build the reading library from the checked manifest and classical source caches.
Usage: python3 scripts/build_curriculum_catalog.py /path/to/source-cache
Required: junior.json, high.json, high-reference.txt, featured.json.
Raw corpus caches are not distributed; see docs/CURRICULUM_COVERAGE.md.
"""
import hashlib,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CACHE=Path(sys.argv[1])
manifest=json.loads((ROOT/'data/curriculum-manifest.json').read_text())
junior=json.loads((CACHE/'junior.json').read_text()); high=json.loads((CACHE/'high.json').read_text()); featured=json.loads((CACHE/'featured.json').read_text())
reference=(CACHE/'high-reference.txt').read_text()
J_SOURCE='https://github.com/tangyuan0821/Junior-Middle-School-poetry/blob/master/poetry.json'
H_SOURCE='https://github.com/clover-tree/gaokao-poetry/blob/master/poetry.json'
R_SOURCE='https://www.hnwu.edu.cn/ewebeditor/uploadfile/20231006195220323.pdf'
def norm(s):
 s=s.replace('邹忌讽秦王纳谏','邹忌讽齐王纳谏').replace('曾晳','曾皙').replace('陶潜','陶渊明');return re.sub(r'[《》\s·、，。\[\]【】]','',s).replace('（并序）','').replace('（节选）','')
def find(rows,title,author=None):
 aliases={'无题（相见时难别亦难）':'无题','相见欢（无言独上西楼）':'相见欢','满江红（小住京华）':'满江红','渔家傲（天接云涛连晓雾）':'渔家傲','水调歌头·明月几时有':'水调歌头','浣溪沙（一曲新词酒一杯）':'浣溪沙','书愤（其一）':'书愤（早岁那知世事艰）'}
 title=aliases.get(title,title); candidates=[r for r in rows if norm(r['title'])==norm(title)]
 if author and len(candidates)>1:candidates=[r for r in candidates if author in r['author'] or r['author'] in author]
 if not candidates:raise ValueError('Missing source: '+title)
 return candidates[0]
def clean_pdf(s):
 lines=[l.strip() for l in s.splitlines() if not re.fullmatch(r'\s*\d{1,3}\s*',l) and not re.fullmatch(r'\s*（[^）]+）\s*',l)]
 return ''.join(lines).replace('\u2003','').replace(' ','')
def between(start,end):
 a=reference.index(start,reference.index('（三） 选修（11 篇）',reference.index('高中阶段背诵经典篇目目录')+2000));b=reference.index(end,a+len(start));return clean_pdf(reference[a+len(start):b])
elective={
 '《老子》八章':between('1.《老子》八章','2.季氏将伐颛臾'),
 '季氏将伐颛臾':between('2.季氏将伐颛臾','3.大学'),
 '大学（节选）':between('3.大学','4.中庸'),
 '中庸（节选）':between('4.中庸','5.《孟子》一则'),
 '《孟子》一则（浩然之气）':between('5.《孟子》一则','6.逍遥游'),
 '逍遥游（五石之瓠）':between('6.逍遥游','7.《谏逐客书》'),
 '谏逐客书':between('7.《谏逐客书》','8.《兰亭集序》'),
 '兰亭集序':between('8.《兰亭集序》','9.滕王阁序'),
 '滕王阁序':between('9.滕王阁序','10.黄冈竹楼记'),
 '黄冈竹楼记':between('10.黄冈竹楼记','11.上枢密韩太尉书'),
 '上枢密韩太尉书':between('11.上枢密韩太尉书','二．古代文论选段（6 篇）'),
 '古代文论选段（六则）':between('二．古代文论选段（6 篇）','三．诗词曲（40 首）')
}
# The older university handout has a shortened variant of chapter 15 and a duplicated letter.
# Restore the complete received chapter beginning used in the 2025 appendix; no modern notes.
lao=elective['《老子》八章'];lao=re.sub(r'\(3\).*?\(4\)','(3)古之善为士者，微妙玄通，深不可识。夫唯不可识，故强为之容：豫兮若冬涉川；犹兮若畏四邻；俨兮其若客；涣兮若冰之将释；敦兮其若朴；旷兮其若谷；混兮其若浊。孰能浊以静之徐清？孰能安以久动之徐生？保此道者不欲盈。夫唯不盈，故能蔽而新成。(4)',lao)
lao=lao.replace('企者不立','跂者不立').replace('天之道，利而不害，圣人之道','天之道，利而不害；圣人之道');elective['《老子》八章']=re.sub(r'\((\d)\)',lambda m:'\n\n【第'+{'1':'八','2':'十二','3':'十五','4':'二十二','5':'二十四','6':'二十七','7':'三十三','8':'八十一'}[m[1]]+'章】\n',lao).strip()
elective['《孟子》一则（浩然之气）']=elective['《孟子》一则（浩然之气）'].split('“敢问何谓浩然之气？”',1)[1].split('“何谓知言？”',1)[0];elective['《孟子》一则（浩然之气）']='“敢问何谓浩然之气？”'+elective['《孟子》一则（浩然之气）']
elective['上枢密韩太尉书']=elective['上枢密韩太尉书'].split('又幸矣！',1)[0]+'又幸矣！'
elective['滕王阁序']=elective['滕王阁序'].split('滕王高阁临江渚',1)[0].rstrip('：')+'。'
elective['古代文论选段（六则）']=elective['古代文论选段（六则）'].replace('其中胸中之竹','其实胸中之竹').replace('回头蓦见','蓦然回首')
# Split the anthology into six named selections while retaining one curriculum unit.
for i,name in enumerate(['毛诗序','典论论文','诗品序','与元九书','题画','人间词话'],1):
 elective['古代文论选段（六则）']=re.sub(rf'{i}\.\s*{name}', '\n\n【'+name.replace('典论论文','典论·论文')+'】\n',elective['古代文论选段（六则）'])
elective['古代文论选段（六则）']=elective['古代文论选段（六则）'].strip()
for name,author in [('毛诗序','《毛诗》'),('典论·论文','曹丕'),('诗品序','钟嵘'),('与元九书','白居易'),('题画','郑燮'),('人间词话','王国维')]:
 elective['古代文论选段（六则）']=elective['古代文论选段（六则）'].replace('【'+name+'】','【'+name+' · '+author+'】')
# Required prefaces are absent from the 60-item machine-readable source.
pipa_preface='元和十年，予左迁九江郡司马。明年秋，送客湓浦口，闻舟中夜弹琵琶者，听其音，铮铮然有京都声。问其人，本长安倡女，尝学琵琶于穆、曹二善才。年长色衰，委身为贾人妇。遂命酒，使快弹数曲。曲罢悯然，自叙少小时欢乐事，今漂沦憔悴，转徙于江湖间。予出官二年，恬然自安，感斯人言，是夕始觉有迁谪意。因为长句，歌以赠之，凡六百一十六言，命曰《琵琶行》。'
gui_preface='余家贫，耕植不足以自给。幼稚盈室，瓶无储粟，生生所资，未见其术。亲故多劝余为长吏，脱然有怀，求之靡途。会有四方之事，诸侯以惠爱为德，家叔以余贫苦，遂见用于小邑。于时风波未静，心惮远役，彭泽去家百里，公田之利，足以为酒。故便求之。及少日，眷然有归欤之情。何则？质性自然，非矫厉所得。饥冻虽切，违己交病。尝从人事，皆口腹自役。于是怅然慷慨，深愧平生之志。犹望一稔，当敛裳宵逝。寻程氏妹丧于武昌，情在骏奔，自免去职。仲秋至冬，在官八十余日。因事顺心，命篇曰《归去来兮》。乙巳岁十一月也。'
# 2025 junior composite selections differ materially from the older reference handout.
meng=find(junior,'《孟子》三章')['content'];fish=find(junior,'鱼我所欲也')['content'];dedao=meng.split('得道多助，失道寡助：',1)[1].split('富贵不能淫：',1)[0];sheng=meng.split('生于忧患，死于安乐：',1)[1]
special_j={
 '相见欢（无言独上西楼）':'无言独上西楼，月如钩。寂寞梧桐深院锁清秋。剪不断，理还乱，是离愁。别是一般滋味在心头。',
 '《孟子》三则':'【鱼我所欲也】\n'+fish+'\n\n【得道多助，失道寡助】\n'+dedao+'\n\n【生于忧患，死于安乐】\n'+sheng,
 '北冥有鱼':find(junior,'《庄子》二则')['content'].split('北冥有鱼：',1)[1].split('庄子与惠子游于濠梁之上：',1)[0],
 '虽有嘉肴':find(junior,'《礼记》二则')['content'].split('虽有嘉肴：',1)[1].split('大道之行也：',1)[0],
 '伯牙鼓琴':'伯牙鼓琴，钟子期听之。方鼓琴而志在太山，钟子期曰：“善哉乎鼓琴，巍巍乎若太山。”少选之间而志在流水，钟子期又曰：“善哉乎鼓琴，汤汤乎若流水。”钟子期死，伯牙破琴绝弦，终身不复鼓琴，以为世无足复为鼓琴者。',
 '送东阳马生序（节选）':find(junior,'送东阳马生序')['content'].split('况才之过于余者乎',1)[0]+'况才之过于余者乎？'
}
# Some titles are absent from the textbook corpus; copy only the ancient original from the reference.
for title,opening,end in [('卖炭翁','卖炭翁，伐薪烧炭南山中。','半匹红纱一丈绫，系向牛头充炭直。'),('无题（相见时难别亦难）','相见时难别亦难','青鸟殷勤为探看。')]:
 start=reference.index(opening,reference.index('7～9 年级（60 篇）',10000));finish=reference.index(end,start)+len(end);special_j[title]=clean_pdf(reference[start:finish])
sel={'J43':'鱼我所欲也；得道多助，失道寡助；生于忧患，死于安乐','J44':'北冥有鱼……亦若是则已矣','J45':'虽有嘉肴','J46':'伯牙鼓琴……世无足复为鼓琴者','J59':'余幼时即嗜学……况才之过于余者乎','H10':'全文（含原文自评段；部分教材可能删节）','H01':'课标指定的十二章（与初中十二章不同）','H02':'学不可以已……用心躁也（课标指定三段）','H03':'屈平疾王听之不聪也……虽与日月争光可也','H12':'大道之行也……是谓大同','H14':'古者富贵而名摩灭……难为俗人言也','H16':'并序','H21':'第8、12、15、22、24、27、33、81章','H23':'古之欲明明德于天下者……壹是皆以修身为本','H24':'喜怒哀乐之未发……万物育焉；博学之……人十能之，己千之','H25':'敢问何谓浩然之气……而又害之','H26':'惠子谓庄子曰……则夫子犹有蓬之心也夫','H32':'毛诗序、典论·论文、诗品序、与元九书、题画、人间词话六组选段；按一条计','H35':'帝高阳之苗裔兮……来吾道夫先路','H50':'并序','H71':'仅【正宫】【端正好】'}
eras={}
for era,names in [('先秦','老子 庄子 荀子 屈原 《论语》 《孟子》 《诗经》 《左传》 《战国策》 《吕氏春秋》'),('汉代','汉乐府 《古诗十九首》 贾谊 司马迁 《礼记》 曹操'),('魏晋南北朝','陶渊明 陶弘景 王羲之 李密 鲍照 郦道元 北朝民歌 刘桢 曹植'),('唐代','王勃 陈子昂 王湾 王维 崔颢 岑参 刘禹锡 白居易 李贺 杜牧 李商隐 韩愈 柳宗元 魏征 高适 张若虚 温庭筠 刘长卿 王绩 王建 许浑 韦应物 孟浩然'),('五代','李煜'),('宋代','范仲淹 晏殊 王安石 李清照 陆游 辛弃疾 文天祥 欧阳修 周敦颐 苏洵 苏辙 黄庭坚 秦观 周邦彦 张孝祥 姜夔 刘克庄 柳永 陈与义 杨万里 朱熹 朱敦儒 吴均'),('元代','马致远 张养浩 王实甫'),('明代','宋濂 张岱 王磐 夏完淳'),('清代','龚自珍 姚鼐 秋瑾 纳兰性德')]:
 for name in names.split():eras[name]=era
eras['吴均']='南朝梁';eras['刘桢']='东汉末年';eras['刘义庆']='南朝宋';eras['蒲松龄']='清代';eras['纪昀']='清代'
# Fix author attribution from bibliography rather than treating a compilation as a single writer.
fix_authors={'咏雪':'《世说新语》','《论语》十二章':'《论语》','木兰诗':'北朝民歌','《庄子》二则':'《庄子》','《礼记》二则':'《礼记》','《孟子》三章':'《孟子》'}
def format_text(text,category):
 text=text.replace('𪭢金','摐金').replace('\r','').strip()
 if '\n' not in text:
  if category=='诗词曲':text=re.sub(r'([。！？])',r'\1\n',text).strip()
  else:text=re.sub(r'([。！？][”’]?)(?=[^”’。！？])',r'\1\n',text).strip()
 return text
rows=[]; units=[]; consumed=set();used_feature=set()
def feature_for(title,author):
 aliases={'水调歌头':'水调歌头·明月几时有','渔家傲':'','浣溪沙':''}
 for f in featured:
  if f['author']!=author:continue
  if norm(f['title'])==norm(title) or title=='水调歌头·明月几时有' and f['id']=='ss-shuidiao':return f
 return None
for unit in manifest['units']:
 title=unit['title'];author=unit['author'];stage=unit['stage'];u=unit['unit'];feature=feature_for(title,author)
 if feature:
  used_feature.add(feature['id']);units.append({**unit,'workId':feature['id'],'selection':sel.get(u,'全文')});continue
 if unit['source']=='elective':text=elective[title];source=R_SOURCE
 elif stage=='初中':
  if title in special_j:text=special_j[title];source=R_SOURCE if title in ['卖炭翁','无题（相见时难别亦难）'] else J_SOURCE
  else:r=find(junior,title,author);text=r['content'];consumed.add(r['title']);source=J_SOURCE
 else:
  r=find(high,title,author);text=r['content'];source=H_SOURCE
  if title=='归去来兮辞（并序）':text='【序】\n'+gui_preface+'\n\n【辞】\n'+text
  if title=='琵琶行':text='【序】\n'+pipa_preface+'\n\n【诗】\n'+text;title='琵琶行（并序）'
  if title=='劝学':text=text.removeprefix('君子曰：')
  if title=='项脊轩志':text=text.replace('…………','\n\n项脊生曰：“蜀清守丹穴，利甲天下，其后秦皇帝筑女怀清台。刘玄德与曹操争天下，诸葛孔明起陇中。方二人之昧昧于一隅也，世何足以知之？余区区处败屋中，方扬眉、瞬目，谓有奇景。人知之者，其谓与坎井之蛙何异？”\n\n')
  if title.startswith('子路、'):author='《论语》'
 uid='catalog-'+u.lower();selection=sel.get(u,'全文');kind='古文' if unit['category']=='文言文' else ('曲' if any(x in title for x in ['天净沙','山坡羊','朝天子','长亭送别']) else '诗词')
 rows.append(dict(id=uid,title=title,author=author,era=eras.get(author,'古代'),stage=stage,scope='课标背诵',course=unit['course'],category=unit['category'],kind=kind,text=format_text(text,unit['category']),selection=selection,source=source,unit=u))
 units.append({**unit,'workId':uid,'selection':selection})
# Add old textbook corpus classics, clearly separate from the current appendix.
core_names={norm(u['title']) for u in units if u['stage']=='初中'}
for r in junior:
 title=r['title'];author=fix_authors.get(title,r['author'])
 if author in ['毛泽东','陈毅'] or feature_for(title,author) or norm(title) in core_names or title in consumed or title in ['《孟子》三章','《庄子》二则','《礼记》二则','鱼我所欲也','送东阳马生序','渔家傲','相见欢','满江红']:continue
 if title=='浣溪沙' and author=='晏殊':continue
 # Same original with a more descriptive featured title should stay one featured work.
 if author in ['李白','杜甫','苏轼']:continue
 category='文言文' if len(r['content'])>180 or any(t in title for t in ['劝学','咏雪','期行','穿井','忧天','卖油翁','细柳','陈涉世家','辱使命','核舟','诫子书','与朱元思书']) else '诗词曲'
 uid='catalog-extra-'+hashlib.sha1((title+author+r['content'][:12]).encode()).hexdigest()[:10]
 rows.append(dict(id=uid,title=title,author=author,era=eras.get(author,'古代'),stage='初中',scope='版本补充',course='旧版教材整理',category=category,kind='古文' if category=='文言文' else '诗词',text=format_text(r['content'],category),selection='教材整理文本；不同版本可能节选不同',source=J_SOURCE,unit=None))
# Textbook components outside the 2025 junior composite selections.
for title,text,author in [
 ('富贵不能淫',meng.split('富贵不能淫：',1)[1].split('生于忧患，死于安乐：',1)[0],'《孟子》'),
 ('庄子与惠子游于濠梁之上',find(junior,'《庄子》二则')['content'].split('庄子与惠子游于濠梁之上：',1)[1],'《庄子》'),
 ('大道之行也',find(junior,'《礼记》二则')['content'].split('大道之行也：',1)[1],'《礼记》')]:
 rows.append(dict(id='catalog-extra-'+hashlib.sha1(title.encode()).hexdigest()[:10],title=title,author=author,era='先秦至汉代',stage='初中',scope='版本补充',course='旧版教材整理',category='文言文',kind='古文',text=format_text(text,'文言文'),selection='教材整理选段，不混入2025课标条目计数',source=J_SOURCE,unit=None))
# Additional textbook classics are separate from the nationally specified recitation units.
for r in json.loads((ROOT/'data/textbook-supplements.json').read_text()):
 rows.append(dict(id='catalog-textbook-'+hashlib.sha1(r['title'].encode()).hexdigest()[:10],title=r['title'],author=r['author'],era=r['era'],stage='高中',scope='教材补充',course='高中教材补充',category=r['category'],kind='古文' if r['category']=='文言文' else '戏曲' if '窦娥' in r['title'] else '诗词',text=format_text(r['text'],r['category']),selection=r['selection'],source=r['source'],unit=None))
for r in rows:
 if r['unit']=='J46':r['source']='https://ctext.org/lv-shi-chun-qiu/ben-wei/zhs'
 if r['unit'] in ['H10','H16']:r['source']=R_SOURCE
 if r['unit']=='H50':r['source']='https://zh.wikisource.org/zh/琵琶引'
 if r['unit']=='J26':r['source']=R_SOURCE
 if r['unit']=='J03':r['text']=r['text'].replace('飰','饭')
 if r['unit']=='H55':r['text']=r['text'].replace('𪩘','巘')
# Keep the omitted modern-corpus entries out: this library is specifically classical poetry/prose.
for r in rows:
 r['author']={'陶潜':'陶渊明','诗经':'《诗经》','《诗经·邶风》':'《诗经》','《诗经·秦风》':'《诗经》','刘义庆组织编写（《世说新语》）':'《世说新语》'}.get(r['author'],r['author'])
 r['era']=eras.get(r['author'],r['era'])
 assert '……' not in r['text'],r['title']
 assert len(r['text'])>15,(r['title'],'empty')
 assert '注释：' not in r['text'],r['title']
 assert '\ufffd' not in r['text'],r['title']
assert len(units)==132 and len([u for u in units if u['stage']=='高中'])==72
assert len(used_feature)==19,used_feature
stats=dict(total=len(featured)+len(rows),newWorks=len(rows),featuredWorks=37,juniorUnits=60,highUnits=72,sourceEdition=manifest['edition'],checked=manifest['checked'])
output='// Classical text dataset adapted under CC BY-SA 4.0; see assets/catalog/attribution.json.\nconst catalogStats='+json.dumps(stats,ensure_ascii=False)+';\nconst catalogUnits='+json.dumps(units,ensure_ascii=False,separators=(',',':'))+';\nconst catalogRows='+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\n'
(ROOT/'dist/catalog-data.js').write_text(output)
assets=ROOT/'dist/assets/catalog';assets.mkdir(parents=True,exist_ok=True)
meta={'license':'CC BY-SA 4.0 (curated dataset arrangement; ancient originals are public domain)','licenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/','contributors':['汤圆 / tangyuan0821','Clover Yan / clover-tree','诗行山河：目录对照、选段与校正'],'sources':[J_SOURCE,H_SOURCE,R_SOURCE],'inputSha256':{name:hashlib.sha256((CACHE/name).read_bytes()).hexdigest() for name in ['junior.json','high.json','high-reference.txt']},'corrections':['2025初中孟子三则使用鱼我所欲也、得道多助、生于忧患三段','伯牙选用吕氏春秋的伯牙鼓琴，非列子旧选段','琵琶行与归去来兮辞补齐课标要求的序文','高中老子第15章补足通行本文；删除手稿现代注释','上枢密韩太尉书删除参考汇编重复段落','古代文论选段按课标一条、内部六则整理','摐金字形及题画、人间词话明显录入错误校正']}
(assets/'attribution.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
meta['sources']+=sorted({r['source'] for r in rows if r['scope']=='教材补充'})
meta['contributors']+=['hantang/yuwen（仅古典原文，不含教材注释与学习提示）','维基文库贡献者（孔雀东南飞通行古籍文本）']
(assets/'attribution.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
(ROOT/'data/curriculum-coverage.json').write_text(json.dumps({'stats':stats,'units':units},ensure_ascii=False,indent=2))
print(json.dumps(stats,ensure_ascii=False))
