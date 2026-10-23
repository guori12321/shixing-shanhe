const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto'),root=path.resolve(__dirname,'..');
const load=file=>fs.readFileSync(path.join(root,'dist',file),'utf8');
const good={id:'test-card',poemId:'lb-lushan',mode:'image',title:'飞瀑构思',alias:'演示同学',prompt:'以“银河落九天”为依据，用水墨表现飞瀑与云雾的想象联系。',evidence:'银河落九天',imagination:'天上与人间的视觉过渡',artifactText:'',createdAt:new Date().toISOString(),feedback:['请说明你的文本依据。'],origin:'mine'};
const jpg='data:image/jpeg;base64,'+fs.readFileSync(path.join(root,'dist/assets/poem-images/gorges.jpg')).toString('base64');
const matching={...good,id:'matching',mode:'matching',direction:'poem',title:'给诗配图 · 飞瀑',evidence:'飞流直下三千尺',photo:{src:jpg,title:'课堂配图',origin:'upload',kind:'自己拍摄',credit:'课堂测试素材，来源见本站图集'}};
function harness(storage={db:null,legacy:null,fail:false}){
 const elements=new Map(),context={crypto:webcrypto,URL,URLSearchParams,TextEncoder,structuredClone,localStorage:{getItem:()=>storage.legacy?JSON.stringify(storage.legacy):null},document:{getElementById:id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',value:'',hidden:false});return elements.get(id);},querySelectorAll:()=>[]},
 readStudioDatabase:async()=>structuredClone(storage.db),mutateStudioDatabase:async update=>{if(storage.fail)throw Error('quota failure');const next=update(structuredClone(storage.db));storage.db=structuredClone(next);return structuredClone(next);}};
 vm.createContext(context);const source=load('studio.js').split("$('close').onclick=")[0];
 vm.runInContext(['curriculum.js','poetry-data.js','catalog-data.js','reading-works.js','library.js'].map(load).join('\n')+'\n'+source+`
 activeStudioTab=()=>{};refreshCredits=()=>{};renderStudioGallery=()=>{};notifyStudioRecordsChanged=()=>{};studioMessage=()=>{};
 const studioStorageReady=initializeStudioStorage();
 this.api={normalize:normalizeStudioRecord,importData:importStudioData,parse:parseStudioExchange,pack:studioExchangeData,state:()=>studioState,escape:escapeHtml,ready:studioStorageReady,commit:commitStudioState,feedback:saveStudioRecordFeedback};`,context);
 return {api:context.api,storage,context};
}
const pack=(works,version=2)=>JSON.stringify({kind:'shixing-poetry-studio',version,mode:'demo',works});
(async()=>{
 const h=harness({db:null,legacy:{credits:13,works:[good]},fail:false}),a=h.api;await a.ready;
 assert.equal(a.state().credits,13);assert.equal(h.storage.db.works[0].id,good.id,'legacy IDs survive migration');
 assert.equal(a.normalize({...good,mode:'constructor'}),null);assert.equal(a.normalize({...good,poemId:'unknown'}),null);assert.equal(a.normalize({...good,prompt:'x'.repeat(5000)}).prompt.length,1800);
 assert.equal(a.escape('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
 assert(a.normalize(matching));for(const src of ['javascript:alert(1)','data:image/svg+xml;base64,PHN2Zz4=','https://user:pass@example.com/a.jpg','http://example.com/a.jpg'])assert.equal(a.normalize({...matching,photo:{...matching.photo,src}}),null);
 assert.equal(a.normalize({...matching,evidence:'床前明月光'}),null);assert.equal(a.normalize({...matching,photo:{...matching.photo,credit:''}}),null);
 assert.equal(a.normalize({...matching,photo:{...matching.photo,src:jpg+'A'.repeat(2*1024*1024)}}),null,'oversized image rejected');
 await assert.rejects(a.importData(pack([matching,{...good,mode:'constructor'}])));assert.equal(a.state().works.length,1,'invalid bundle never partially imports');
 assert.equal(await a.importData(pack([matching,good])),2);assert.equal(a.state().credits,13,'imports do not alter credits');assert.equal(a.state().works[0].origin,'imported');assert.notEqual(a.state().works[0].id,matching.id);assert.equal(a.state().works[0].photo.src,jpg);
 const saved=await a.feedback(a.state().works[0],'我从水流的落差中看到了“飞流”的动势。');assert.equal(saved.feedback.length,2);assert.equal(h.storage.db.works[0].feedback.length,2);
 const exported=a.pack([saved]);assert.equal(exported.version,2);assert.equal(exported.works[0].photo.src,jpg);assert.equal(exported.works[0].photo.credit,matching.photo.credit);assert.equal(exported.works[0].feedback.length,2);
 const second=harness({db:null,legacy:null,fail:false});await second.api.ready;await second.api.importData(JSON.stringify(exported));assert.equal(second.api.state().works[0].feedback.length,2,'round-trip retains peer feedback');assert.equal(second.api.state().works[0].alias,matching.alias);
 const reloaded=harness(h.storage);await reloaded.api.ready;assert.equal(reloaded.api.state().works[0].photo.src,jpg);assert.equal(reloaded.api.state().works[0].feedback.length,2,'refresh retains images and comments');
 assert.equal(await second.api.importData(pack([good],1)),1,'version 1 files remain supported');
 for(let i=0;i<12;i++)await a.feedback(a.state().works[0],'追加点评'+i);assert.equal(a.state().works[0].feedback.length,14);assert.equal(a.state().works[0].feedback[0],matching.feedback[0],'earlier comments are never silently evicted');
 assert.equal(a.normalize({...matching,feedback:Array(101).fill('点评')}),null);
 await assert.rejects(a.importData(pack(Array.from({length:31},()=>good))));assert.equal(a.state().works.length,3);
 const before=JSON.stringify(a.state());h.storage.fail=true;await assert.rejects(a.importData(pack([matching])));assert.equal(JSON.stringify(a.state()),before,'failed storage cannot update memory or lose prior cards');
 await assert.rejects(a.feedback(a.state().works[0],'不能写入的点评'));assert.equal(JSON.stringify(a.state()),before);h.storage.fail=false;
 await Promise.all([a.commit(state=>({...state,credits:state.credits-1})),a.commit(state=>({...state,credits:state.credits-1}))]);assert.equal(a.state().credits,11,'queued writes do not overwrite each other');
 // Model a write from another page: a commit must use the database's latest collection.
 h.storage.db.works.push({...good,id:'other-page'});await a.commit(state=>({...state,credits:state.credits-1}));assert(a.state().works.some(r=>r.id==='other-page'));
 await a.commit(state=>({...state,works:Array.from({length:30},(_,i)=>({...good,id:'full-'+i}))}));const full=JSON.stringify(a.state());await assert.rejects(a.importData(pack([good])));assert.equal(JSON.stringify(a.state()),full,'capacity failures are atomic');
 await a.commit(state=>({...state,works:state.works.map((w,i)=>i? w:{...w,feedback:Array(100).fill('保留的点评')})}));await assert.rejects(a.feedback(a.state().works[0],'第101条'));assert.equal(a.state().works[0].feedback.length,100);
 assert.equal(a.normalize({...good,feedback:['<script>evil()</script>']}).feedback[0],'<script>evil()</script>');
 console.log('Studio: legacy migration, matching images, refresh, v1/v2 exchange, peer feedback, failed-write rollback, queued updates, quota limits and hostile media validation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
