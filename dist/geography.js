// Reuse physical geometry from Natural Earth; landmark anchors reuse the site's regional coordinates.
let waterData=null,showWater=true,showLandmarks=true;
const waterTopics={
 yangtze:{name:'长江',kind:'river',anchor:[116.9,30.7],works:['lb-jingmen','lb-huanghe','lb-baidi','df-denggao','ss-nian'],note:'以长江作为阅读线索，比较送别、漂泊与怀古。地图展示现代概化河道，金色行迹弧线只表示本站精选地点的先后关系。'},
 jinsha:{name:'金沙江',kind:'river',anchor:[101.8,27.7],works:[],note:'长江上游水系的地理参考。此图层没有为诗人增加行程，也不表示本页作品写于这条河流附近。'},
 yellow:{name:'黄河',kind:'river',anchor:[116,36.7],works:['lb-jiangjin'],note:'可结合《将进酒》的黄河意象阅读。诗中出现黄河，不等于可以据此确定作者当时站在黄河岸边。'},
 han:{name:'汉江',kind:'river',anchor:[110.2,32.7],works:[],note:'现代水系参考，帮助观察长安、长江中游一带的空间关系。不据河道推定作者的具体交通路线。'},
 gan:{name:'赣江',kind:'river',anchor:[115.4,27.7],works:[],note:'用于观察江西水系与鄱阳湖一带的位置关系。河道和湖岸为现代概化资料，不是唐宋复原。'},
 'min-sichuan':{name:'岷江',kind:'river',anchor:[104.2,29.1],works:[],note:'四川盆地南部的水系参考。古今河名、支流与作品中地点的对应，仍需结合教材注释核对。'},
 fuchun:{name:'富春江',kind:'river',anchor:[119.45,29.7],works:[],note:'浙江水系参考。保留 Natural Earth 的富春江命名范围，不把这条数据直接扩写成完整的钱塘江流域。'},
 xiang:{name:'湘江',kind:'river',anchor:[112.7,27.2],works:[],note:'湖南水系参考，可与潭州、岳阳和洞庭湖的位置对照；未将地理邻近自动当成作品内容。'},
 huai:{name:'淮河',kind:'river',anchor:[115.1,32.4],works:[],note:'淮河的现代概化线形，用于提供区域地理背景；本站不以此重建古代水运网络。'},
 jialing:{name:'嘉陵江',kind:'river',anchor:[106.1,32.5],works:[],note:'四川、重庆一带的水系参考。古代具体行程仍以相关作品与年谱材料为依据。'},
 wei:{name:'渭河',kind:'river',anchor:[107.3,34.5],works:[],note:'长安与秦州附近的区域地理参考，不代表当前行迹线沿渭河航行。'},
 dongting:{name:'洞庭湖',kind:'lake',anchor:[112.4,28.9],works:['df-yueyang'],note:'与《登岳阳楼》一起观察湖泊、楼与诗人视野的关系。湖岸线经过概化，水域范围也会变化，不表示唐代湖面。'},
 poyang:{name:'鄱阳湖',kind:'lake',anchor:[116.3,29.2],works:['ss-shizhong'],note:'可联系《石钟山记》中的彭蠡、湖口阅读；现代湖岸线不用于证明苏轼当年的精确行舟位置。'},
 tai:{name:'太湖',kind:'lake',anchor:[120.2,31.2],works:[],note:'江南湖泊的地理参考。显示水域不意味着本站三位作者在此均有已收录作品。'}
};
const poemLandmarks=[
 {id:'lushan',name:'庐山',kind:'mountain',region:'庐山',lon:115.99,lat:29.55,works:['lb-lushan','ss-xilin']},
 {id:'taishan',name:'泰山',kind:'mountain',region:'泰山',lon:117.1,lat:36.25,works:['df-wangyue']},
 {id:'songshan',name:'嵩山',kind:'mountain',region:'嵩山',lon:112.96,lat:34.49,works:['lb-jiangjin']},
 {id:'tianmu',name:'天姥山',kind:'mountain',region:'天姥山',lon:120.91,lat:29.29,works:['lb-tianmu'],note:'这里与梦游文本关联，不能据梦境把它算作李白真实行迹。'},
 {id:'huanghe-tower',name:'黄鹤楼',kind:'building',region:'黄鹤楼',lon:114.3,lat:30.55,works:['lb-huanghe']},
 {id:'baidi',name:'白帝城',kind:'building',region:'白帝城',lon:109.58,lat:31.04,works:['lb-baidi']},
 {id:'yueyang-tower',name:'岳阳楼',kind:'building',region:'岳阳',lon:113.1,lat:29.38,works:['df-yueyang'],source:'https://www.yueyang.gov.cn/yyskl/58123/58124/58129/content_1612371.html'},
 {id:'dufu-cottage',name:'杜甫草堂',kind:'building',region:'成都',lon:104.07,lat:30.67,works:['df-kezhi','df-maowu']},
 {id:'west-lake',name:'西湖',kind:'lake',region:'杭州',lon:120.15,lat:30.25,works:['ss-xihu']},
 {id:'shizhong',name:'石钟山',kind:'mountain',region:'湖口',lon:116.22,lat:29.74,works:['ss-shizhong']}
];
function initGeography(){
 for(const [id,key] of [['waterToggle','water'],['landmarkToggle','landmarks']])$(id).onclick=()=>{if(key==='water')showWater=!showWater;else showLandmarks=!showLandmarks;$(id).setAttribute('aria-pressed',String(key==='water'?showWater:showLandmarks));drawMap();};
 fetch('assets/map/water.json').then(r=>{if(!r.ok)throw Error('water');return r.json();}).then(d=>{waterData=d;$('mapLayerStatus').textContent='河流湖泊参考图层已加载';drawMap();}).catch(()=>{$('mapLayerStatus').textContent='河湖图层暂不可用，行迹地图仍可使用';});
}
function showGeography(id){const landmark=id.startsWith('landmark:'),t=landmark?poemLandmarks.find(m=>m.id===id.slice(9)):waterTopics[id];if(!t)return;stop();const works=t.works.map(id=>allWorks.find(w=>w.meta.id===id)).filter(Boolean);showModal(`<div class="geography-reader"><p class="eyebrow">${landmark?'诗文地标 · 区域示意':'河流湖泊 · 现代地理参考'}</p><h2>${t.name}</h2><p>${t.note||(landmark?'地标点沿用本站教学站点的区域坐标，用于全国尺度阅读，不是建筑的精确定位。':'')}</p>${landmark?'<p class="geo-caution">这是地理参考图层，不据此为任何诗人增加行迹。具体作品的亲历、诗中地点和系年说明，请打开原文核对。</p>':''}<h3>${works.length?'从这里，读一首诗':'读图小提示'}</h3>${works.length?works.map(w=>`<button class="geo-work" data-geo-work="${w.meta.id}"><strong>${w.s[5]}</strong><small>${people[w.a].name} · ${w.s[0]} · ${w.meta.role}</small><span>原文与站点 →</span></button>`).join(''):'<p>蓝色水系与金色行迹线用途不同：前者帮助定位，后者串联精选人生片段。河流邻近某站点，不足以证明作品在河岸写成。</p>'}<div class="geography-source"><h3>来源与读图边界</h3>${landmark?`<p>位置沿用本站相关作品的区域坐标，不新增精确定位结论。${t.source?`<a href="${t.source}" target="_blank" rel="noopener noreferrer">地标资料参考 ↗</a>`:''}</p>`:'<p>Made with Natural Earth · 公版矢量数据；本站筛选、中文标注并重新配色。</p><a href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/" target="_blank" rel="noopener noreferrer">河流数据 ↗</a> · <a href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-lakes/" target="_blank" rel="noopener noreferrer">湖泊数据 ↗</a> · <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">许可说明 ↗</a><p>现代概化河道、湖岸线，不是唐宋水系复原，也不用于精确导航。</p>'}</div></div>`);document.querySelectorAll('[data-geo-work]').forEach(b=>b.onclick=()=>openWork(b.dataset.geoWork));}
