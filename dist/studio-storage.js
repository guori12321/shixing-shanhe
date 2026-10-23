// Store images and text in one transaction; keep the old localStorage file as a migration backup.
let studioDatabasePromise;
function openStudioDatabase(){
 if(!studioDatabasePromise)studioDatabasePromise=new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(Error('此浏览器暂不能保存作品，请允许网站使用本地存储。'));return;}
  const request=indexedDB.open('shixing-studio-works',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('state');
  request.onerror=()=>reject(request.error||Error('本地作品库无法打开。'));
  request.onblocked=()=>reject(Error('请关闭其他旧版创作坊页面，再刷新此页。'));
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
 });return studioDatabasePromise;
}
async function readStudioDatabase(){const db=await openStudioDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly'),request=tx.objectStore('state').get('main');tx.oncomplete=()=>resolve(request.result||null);tx.onabort=()=>reject(tx.error||Error('读取本地作品失败。'));});}
async function writeStudioDatabase(state){const db=await openStudioDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'main');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||Error('保存未完成，可能是本机存储空间不足。'));});}
async function mutateStudioDatabase(update){const db=await openStudioDatabase();return new Promise((resolve,reject)=>{
 const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),request=store.get('main');let next,failure;
 request.onsuccess=()=>{try{next=update(request.result||null);store.put(next,'main');}catch(error){failure=error;tx.abort();}};
 tx.oncomplete=()=>resolve(next);tx.onabort=()=>reject(failure||tx.error||Error('保存未完成，可能是本机存储空间不足。'));
});}
