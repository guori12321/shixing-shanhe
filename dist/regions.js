// Regional rollout is independent of the national curriculum catalog.
const studyRegions=[
 {id:'shanghai',name:'上海',status:'pilot',label:'首发参考版'},
 {id:'national',name:'全国课标',status:'reference',label:'通用参考'},
 {id:'jiangsu',name:'江苏',status:'planned',label:'待接入'},
 {id:'zhejiang',name:'浙江',status:'planned',label:'待接入'},
 {id:'beijing',name:'北京',status:'planned',label:'待接入'},
 {id:'guangdong',name:'广东',status:'planned',label:'待接入'}
];
function supportedStudyRegion(id){return studyRegions.some(r=>r.id===id&&r.status!=='planned');}
let sessionStudyRegion='shanghai';
function currentStudyRegion(){try{const id=localStorage.getItem('shixing-study-region');return supportedStudyRegion(id)?id:sessionStudyRegion;}catch{return sessionStudyRegion;}}
function selectStudyRegion(id){if(!supportedStudyRegion(id))return false;sessionStudyRegion=id;try{localStorage.setItem('shixing-study-region',id);}catch{}return true;}
function regionPriorityWork(w){return w.featured||w.meta.scope==='课标背诵';}
function initStudyRegions(){
 const host=document.getElementById('studyRegions');if(!host)return;
 host.innerHTML=`<div class="region-heading"><div><p class="eyebrow">按地区学习 · 上海先行</p><h2>你的语文课，在哪里？</h2></div><label>学习地区 <select id="studyRegionSelect" aria-describedby="regionDescription">${studyRegions.map(r=>`<option value="${r.id}" ${r.status==='planned'?'disabled':''}>${r.name} · ${r.label}</option>`).join('')}</select></label></div><p id="regionDescription"></p><div class="region-roadmap">${studyRegions.filter(r=>r.status==='planned').map(r=>`<span>${r.name}<small>待接入</small></span>`).join('')}</div><div class="region-bottom"><label><input type="checkbox" id="regionSupplements"> 同时展示教材、版本与衔接补充</label><button id="regionSources">地区依据与接入进度 ↗</button></div><p class="region-announcement" id="regionAnnouncement" aria-live="polite"></p>`;
 const select=document.getElementById('studyRegionSelect');select.value=currentStudyRegion();
 function refresh(){const sh=select.value==='shanghai';document.getElementById('regionDescription').textContent=sh?'上海首发参考版：默认展示课标背诵篇目与李白、杜甫、苏轼完整专题。当前使用全国课标作为学习起点；上海中考、高考的年度篇目清单尚待逐项核对，暂不标注“上海必考”。':'全国课标参考：展示全部已收录篇目，可继续按学段、作者和目录筛选。此视图不代表任何省市的完整考试范围。';document.getElementById('regionSupplements').checked=!sh;document.getElementById('regionSupplements').disabled=!sh;}
 refresh();select.onchange=()=>{if(!selectStudyRegion(select.value))return;refresh();libraryLimit=24;renderLibrary();updateRegionNav();document.getElementById('regionAnnouncement').textContent='已切换至'+select.options[select.selectedIndex].text+'，篇目列表已更新。';};
 document.getElementById('regionSupplements').onchange=()=>{libraryLimit=24;renderLibrary();};
 document.getElementById('regionSources').onclick=()=>showModal(`<p class="eyebrow">地区接入 · 2026年10月22日核对</p><h2>上海先行，逐地核对</h2><h3>上海 · 首发参考版</h3><p>地区入口与学习视图已上线。初中和高中暂共用已收录的2025日常修订版全国课标目录，另保留三位重点诗人的完整专题。这是学习参考，尚不是经逐项核定的上海年度考试清单。</p><p><a href="https://edu.sh.gov.cn/xxgk2_zdgz_rxgkyzs/20230412/ec0b8612c5c14970ad0260593696af43.html" target="_blank" rel="noopener noreferrer">上海市教委：初中学业水平考试实施办法 ↗</a>明确考试内容限定在课程标准范围内；这并不构成具体年度的背诵目录。</p><p><a href="https://www.shmeea.edu.cn/page/02300/20260104/19981.html" target="_blank" rel="noopener noreferrer">上海市教育考试院：2026春考语文试卷评析 ↗</a>说明考试还涉及诗歌鉴赏和文言综合阅读，不能仅凭背诵目录判断全部考试材料。</p><h3>江苏、浙江、北京、广东 · 待接入</h3><p>目前仅展示规划入口，暂不提供地区筛选结果。后续分别核对中考、普通高考的年份、教材版本、指定选段与官方依据，再启用对应选项。</p><h3>下一步：上海年度清单</h3><p>需按初中／高中、考试年份及实际教材逐项核对，区分背诵要求、教材阅读与课外鉴赏；核对后才增加地区篇目标记。全国课标覆盖率仍单独统计。</p>`);
}
function updateRegionNav(){const nav=document.getElementById('regionNav');if(nav)nav.textContent=currentStudyRegion()==='shanghai'?'上海 · 首发参考':'全国课标 · 参考';}
