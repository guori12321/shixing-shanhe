// Original classroom schematics from cited historical-geography descriptions.
// These partial, deliberately generalized lines are not digitized national boundaries.
let frontierVisible=false,frontierProfile='tang',frontierReading=null,frontierPerson=-1;
const frontierProfiles={
 tang:{name:'唐 · 河西—陇右',period:'开元—天宝时期（约730—750年代）',label:'唐蕃边防带 · 局部概略',bounds:[[93.5,33.9],[105,41.5]],line:[[94.3,39.4],[96,39],[97.5,38.5],[99.1,38],[100.4,37.5],[101,36.4],[101.5,35.9]],labels:[['河西走廊',98.1,39.4],['吐蕃方向',98,36],['赤岭（今日月山）',101.08,36.48]],note:'仅概括祁连山—赤岭一带的边防关系。赤岭会盟后仍有战争、城堡易手；这条线不表示某一年的逐堡控制线，也不包含安西、北庭或唐朝完整疆域。玉门关、阳关是关隘，不能直接当作整个唐代的国界。',sources:[['唐蕃竞争与青海、赤岭军镇（中国藏学研究中心）','https://www.tibetology.ac.cn/2020-09/21/content_41698588.htm'],['唐代疆域考证（中央研究院史语所）','https://www1.ihp.sinica.edu.tw/jp/Publications/Bulletin/971/Article/801']]},
 songxia:{name:'北宋 · 环庆—鄜延',period:'康定—庆历时期（约1040—1044年）',label:'宋夏边防带 · 局部概略',bounds:[[105.5,34.7],[111,39]],line:[[106.5,37],[107.2,36.8],[107.7,36.7],[108.2,37],[108.8,37.2],[109.5,37.2]],labels:[['西夏方向',107.7,38],['庆州一带',107.88,36.02],['延州一带',109.49,36.6]],note:'展示环庆、鄜延与西夏对峙的区域关系，虚线是教学概念线，未逐城寨复原。范仲淹《渔家傲》的创作地点与年份有不同考证，不能据此把诗中“孤城”钉死在某个城堡。这里不是同一时期宋辽的边界。',sources:[['范仲淹〈渔家傲〉系年与地望考证（四川大学）','https://lj.scu.edu.cn/info/1074/6661.htm'],['庆阳地方志：范仲淹与大顺军','https://www.gsdfszw.org.cn/gsxz/qys_275/qyxz/201708/P020170814648732627052.pdf']]},
 songliao:{name:'北宋 · 白沟河段',period:'澶渊之盟后至北宋末以前（约1005—1120年）',label:'宋辽界河带 · 局部概略',bounds:[[114.5,37.4],[118.1,40.1]],line:[[116.02,39.12],[116.32,39.09],[116.58,39.1],[116.85,39.06],[117.15,39.05]],labels:[['辽方向',116.5,39.6],['北宋方向',116.5,38.55],['白沟—霸州一带',116.2,39.08]],note:'仅用白沟—霸州一段说明宋辽界河关系。古今河道已有变化，线形是区域示意，不是古河道测绘；不覆盖西段山地边界，也不能用于解释宋夏或南宋与金的战线。',sources:[['宋辽时期的白沟沿线（河北省文旅厅）','https://whly.hebei.gov.cn/c/2023-10-26/574329.html'],['宋辽疆界研究述评（中国人民大学）','https://iqh.ruc.edu.cn/old/zglsdlyj/lsdl_xsdt/ztsp/51893571673c4c919c415d792bc5bbc8.htm']]}
};
function frontierForWork(w){const t=w?.s?.[5]||'';if(t==='渔家傲·秋思')return 'songxia';if(['使至塞上','白雪歌送武判官归京'].includes(t))return 'tang';return null;}
function initFrontiers(){
 const query=new URLSearchParams(location.search),key=query.get('frontier'),reading=query.get('reading');
 if(frontierProfiles[key]){frontierVisible=true;frontierProfile=key;const candidate=reading?findReadingWork(reading):null;frontierReading=frontierForWork(candidate)?candidate:null;}
 $('frontierToggle').onclick=()=>{frontierVisible=!frontierVisible;if(frontierVisible&&!frontierReading)frontierProfile=person===2?'songliao':'tang';updateFrontierControls();drawFrontiers();if(frontierVisible)focusFrontier();};
 $('frontierPeriod').onchange=e=>{frontierProfile=e.target.value;updateFrontierControls();drawFrontiers();focusFrontier();};
 $('frontierFocus').onclick=focusFrontier;$('frontierSources').onclick=showFrontierSources;updateFrontierControls();
}
function updateFrontierControls(){
 if(!$('frontierToggle'))return;const p=frontierProfiles[frontierProfile];$('frontierToggle').setAttribute('aria-pressed',String(frontierVisible));$('frontierPanel').hidden=!frontierVisible;$('frontierPeriod').value=frontierProfile;$('frontierPeriodLabel').textContent=p.period;$('frontierBrief').textContent=frontierReading?'正在阅读：'+workAuthor(frontierReading)+'《'+frontierReading.s[5]+'》。'+(frontierProfile==='tang'&&frontierReading.s[5].startsWith('白雪')?'轮台在西域，本图只展示河西—陇右局部，未绘轮台周围边界。':''):'选定时期的边疆背景；与当前作品的系年对照使用。';
}
function drawFrontiers(){
 if(!mapReady||!terrainMap.getSource('historical-frontier'))return;const p=frontierProfiles[frontierProfile];
 terrainMap.getSource('historical-frontier').setData(mapCollection(frontierVisible?[mapFeature({type:'LineString',coordinates:p.line},{name:p.label})]:[]));
 terrainMap.getSource('frontier-labels').setData(mapCollection(frontierVisible?p.labels.map(([name,lon,lat])=>mapFeature({type:'Point',coordinates:[lon,lat]},{name})):[]));
}
function focusFrontier(){if(mapReady&&frontierVisible)terrainMap.fitBounds(frontierProfiles[frontierProfile].bounds,{padding:65,pitch:25,bearing:0,duration:900});}
function showFrontierSources(){const p=frontierProfiles[frontierProfile];showModal(`<p class="eyebrow">历史地理 · 课堂示意</p><h2>${p.name}</h2><p>${p.period}</p><p>${p.note}</p><h3>怎样读这条线</h3><p>淡紫色虚线表示参考边防带，坐标由本站根据研究中的地理关系概括绘制。它不是完整国界数据，也不表示精确范围或法律界线；未考定区段留空。政权名称仅用于理解当时历史背景。紫线与金色诗人行迹用途不同。</p><h3>资料依据</h3>${p.sources.map(([name,url])=>`<p><a href="${url}" target="_blank" rel="noopener noreferrer">${name} ↗</a></p>`).join('')}<p>底图仍是现代山川。古代关隘、河流和势力范围会变迁，阅读时须对照作品年代与教材历史地图；不把不同时期叠成一条固定国界。</p>`);}
function renderFrontierReading(){
 if(!$('frontierToggle'))return;
 if(frontierPerson!==person){frontierPerson=person;if(!frontierReading){frontierProfile=person===2?'songliao':'tang';updateFrontierControls();drawFrontiers();}}
 document.querySelector('.timeline').hidden=!!frontierReading;
 if(!frontierReading)return;document.querySelectorAll('[data-person]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});$('bio').innerHTML='<h3>独立篇目 · 边疆背景</h3><p>这是书架中的边塞诗阅读，不计入三位诗人的足迹。选择上方任一诗人，可继续探索他的山河行旅。</p>';const w=frontierReading;$('mapTitle').textContent='边塞阅读 · '+w.s[5];document.querySelector('.map-head small').textContent='历史边疆 · 局部概略';$('reset').textContent='↺ 全览边疆';document.querySelector('.map-legend').hidden=true;$('mapQuote').textContent='历史边疆背景 · 不作为作者行迹';$('terrainFocus').hidden=true;$('mapQuote').hidden=true;$('waterToggle').hidden=true;$('landmarkToggle').hidden=true;document.querySelectorAll('[data-person] em').forEach(e=>e.textContent='○');
 $('detail').innerHTML=`<div class="frontier-reading"><p class="eyebrow">边塞诗 · 时代背景</p><h2>${escapeHtml(w.s[5])}</h2><p>${escapeHtml(workAuthor(w))} · ${escapeHtml(w.s[0])}</p><div class="reader-text">${escapeHtml(w.s[6])}</div>${workImageGallery(w,true)}<p>先看时代与边防，再读关塞、征人和思乡。本图不推定作者的旅行路线。</p><button id="frontierRead">原文与篇目依据 ↗</button><a href="library.html?work=${w.meta.id}">回篇目书架 →</a><p class="scope-footnote">左侧三位重点诗人始终保留；选择一位即可返回他的足迹。</p></div>`;$('frontierRead').onclick=()=>readWork(w.meta.id);bindWorkImages();
}
function clearFrontierReading(){if(!frontierReading)return;frontierReading=null;frontierVisible=false;frontierPerson=-1;$('terrainFocus').hidden=false;$('mapQuote').hidden=false;$('waterToggle').hidden=false;$('landmarkToggle').hidden=false;document.querySelector('.timeline').hidden=false;lastMapSelection='';document.querySelector('.map-head small').textContent='行迹与诗中地点';$('reset').textContent='↺ 全览路线';document.querySelector('.map-legend').hidden=false;history.replaceState(null,'','index.html');updateFrontierControls();drawFrontiers();}
