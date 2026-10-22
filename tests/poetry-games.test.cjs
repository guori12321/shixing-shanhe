const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={URL,URLSearchParams};vm.createContext(c);
for(const name of ['curriculum','poetry-data','catalog-data','reading-works','library','poetry-games']){let source=fs.readFileSync(`${__dirname}/../dist/${name}.js`,'utf8');if(name==='poetry-games')source=source.replace(/\ninitPoetryGames\(\);\s*$/,'');vm.runInContext(source,c);}
const run=s=>vm.runInContext(s,c);
assert.equal(run('gameWorks().length'),136);
assert(run("gameWorks().every(w=>!['诫子书','与朱元思书','窦娥冤（节选）'].includes(w.s[5]))"));
assert(run("gameSearchWorks('李白 瀑布').some(w=>w.meta.id==='lb-lushan')"));
assert.equal(run("gameSearchWorks('完全无此篇目').length"),0);
for(const url of ['javascript:alert(1)','data:image/svg+xml,evil','http://example.com/a.png','https://user:pass@example.com/a.png','not a url']){c.badUrl=url;assert.equal(run('gameImageUrl(badUrl)'),null);}
assert.equal(run("gameImageUrl('https://example.com/photo.jpg?size=900')"),'https://example.com/photo.jpg?size=900');
assert(run("gameQuoteMatches('飞流直下三千尺，\\n疑是银河落九天。','“飞流直下三千尺，疑是银河落九天。”')"));
assert.equal(run("gameQuoteMatches('日照香炉生紫烟','紫烟')"),false);
assert.equal(run("gameQuoteMatches('日照香炉生紫烟','床前明月光')"),false);
run("this.d={workId:'lb-lushan',photo:{src:'https://example.com/photo.jpg',title:'我的照片',origin:'url',kind:'网上找到',credit:'摄影者与原图网址'},quote:'飞流直下三千尺',reason:'图中的瀑布从高高的山崖落下，呼应诗里的飞流与落差。',difference:'照片里没有银河。'}");
assert.equal(run('validateGamePair(d)'),'');
for(const [field,value]of [['workId','unknown'],['photo',null],['quote','床前明月光'],['reason','好看']]){c.changed={...c.d,[field]:value};assert(run('validateGamePair(changed)').length>0);}
assert(run("validateGamePair({...d,photo:{...d.photo,credit:''}})").length>0);
assert(run("validateGamePair({...d,workId:'ss-chengtian'})").length>0);
run("poetryGame.drafts.poem.reason='先写下的理由';poetryGame.mode='photo';");assert.equal(run('currentGame().reason'),'');run("poetryGame.mode='poem'");assert.equal(run('currentGame().reason'),'先写下的理由');
const html=run("gameCardHtml({...d,mode:'photo',reason:'<script>alert(1)</script>',difference:'<img src=x onerror=alert(2)>'},d.photo.src)");
assert(!html.includes('<script>'));assert(!html.includes('<img src=x'));assert(html.includes('&lt;script&gt;'));assert(html.includes('default-src \'none\''));assert(html.includes('摄影者与原图网址'));assert(html.includes('李白'));assert(html.includes('飞流直下三千尺'));
console.log('Poetry games: 136 poetic readings; search, two independent drafts, quote validation, photo sources, safe URLs and escaped export passed.');
