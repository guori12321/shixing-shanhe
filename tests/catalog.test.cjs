const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),c={};vm.createContext(c);
const load=f=>fs.readFileSync(path.join(root,'dist',f),'utf8');
vm.runInContext(['curriculum.js','poetry-data.js','catalog-data.js','reading-works.js'].map(load).join('\n')+'\nthis.model={works:getReadingWorks(),units:catalogUnits,stats:catalogStats,people,rows:catalogRows};',c);
const {works,units,stats,people,rows}=c.model;
assert.equal(works.length,215);assert.equal(new Set(works.map(w=>w.meta.id)).size,works.length);
assert.deepEqual(Array.from(people,p=>p.stops.length),[13,12,12]);
assert.equal(units.filter(u=>u.stage==='初中').length,60);assert.equal(units.filter(u=>u.stage==='高中').length,72);
assert.equal(units.filter(u=>u.stage==='高中'&&u.category==='文言文').length,32);
assert.equal(units.filter(u=>u.stage==='高中'&&u.category==='诗词曲').length,40);
for(const [course,count]of [['必修',10],['选择性必修',10],['选修',12]])assert.equal(units.filter(u=>u.stage==='高中'&&u.course===course).length,count);
for(const u of units){assert(works.some(w=>w.meta.id===u.workId),'unresolved curriculum unit '+u.unit);}
for(const w of works){assert(w.s[6].length>15,w.s[5]+' missing text');if(!w.featured){assert.equal(w.s[2],null);assert.equal(w.s[3],null);assert.equal(w.meta.role,'阅读篇目');}assert(!w.s[6].includes('\ufffd'));}
const text=id=>works.find(w=>w.meta.id===units.find(u=>u.unit===id).workId).s[6];
assert(text('J43').includes('天时不如地利'));assert(text('J43').includes('鱼，我所欲也'));assert(text('J43').includes('舜发于畎亩之中'));assert(!text('J43').includes('景春曰'));
assert(text('J26').startsWith('无言独上西楼'));assert(!text('J26').includes('金陵城上西楼'));
assert(text('J46').startsWith('伯牙鼓琴'));assert(text('J46').includes('钟子期死'));assert(!text('J46').includes('伯牙游于泰山之阴'));
assert(text('H16').includes('余家贫'));assert(text('H16').includes('归去来兮，田园将芜胡不归'));
assert(text('H50').includes('元和十年'));assert(text('H50').includes('浔阳江头夜送客'));
assert(text('H21').includes('孰能浊以静之徐清'));assert.equal((text('H21').match(/【第/g)||[]).length,8);
assert(text('H26').startsWith('惠子谓庄子曰'));assert(!text('H26').includes('北冥有鱼'));
assert.equal((text('H32').match(/【/g)||[]).length,6);assert.equal(text('H31').split('太尉执事').length-1,1);
assert.notEqual(text('J41'),text('H01'),'the two Analects selections must not be conflated');
assert.equal(rows.some(w=>['毛泽东','陈毅'].includes(w.author)),false,'classical-only supplemental import');
for(const title of ['鸿门宴','庖丁解牛','齐桓晋文之事','促织','苏武传（节选）','孔雀东南飞（并序）','氓','大学之道','《老子》四章'])assert(works.some(w=>w.s[5]===title),title);
assert.equal(stats.total,works.length);
console.log('Catalog: 215 readings; junior 60 / high 72 units; selections, prefaces, no invented traces, unique IDs passed.');
