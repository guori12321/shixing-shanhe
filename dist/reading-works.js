// The three mapped poets remain separate from the wider reading-only curriculum.
function workAuthor(w){return w.authorName||people[w.a]?.name||'古典文献';}
function getReadingWorks(){
 const featured=allWorks.map(w=>({...w,authorName:people[w.a].name,featured:true}));
 const others=typeof catalogRows==='undefined'?[]:catalogRows.map(r=>{
  const prose=r.category==='文言文',focus=prose?'梳理文意与论证；积累实词、虚词和特殊句式。':'梳理意象与情感；关注炼字、用典和表达方式。';
  const meta={id:r.id,stage:r.stage,scope:r.scope,kind:r.kind,role:'阅读篇目',course:r.course,category:r.category,selection:r.selection,textSource:r.source,dateNote:'本条用于篇目阅读，未据此推定创作地点或旅行路线。',focus,unit:r.unit};
  return {s:[r.era,'篇目阅读',null,null,'',r.title,r.text,focus,'以原文为依据进行阅读。先梳理句意，再结合上下文说明自己的理解；不要把文学描写直接当作历史记录。',r.category,prose?'找出中心观点或叙事线索，引用原句说明文章怎样展开。':'选择一个意象或关键词，引用原句说明情感怎样表达。',meta],a:null,i:null,meta,authorName:r.author,featured:false};
 });return [...featured,...others];
}
function findReadingWork(id){return getReadingWorks().find(w=>w.meta.id===id);}
function readingCategory(w){return w.meta.category||( ['诗','词','曲'].includes(w.meta.kind)?'诗词曲':'文言文');}
function readingUnits(w){return typeof catalogUnits==='undefined'?[]:catalogUnits.filter(u=>u.workId===w.meta.id);}
