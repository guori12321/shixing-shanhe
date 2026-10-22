const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),context={};vm.createContext(context);
vm.runInContext(['curriculum.js','poetry-data.js','catalog-data.js','reading-works.js','poem-images-data.js','poem-images.js'].map(f=>fs.readFileSync(path.join(root,'dist',f),'utf8')).join('\n')+';this.model={works:getReadingWorks(),assets:poemImageAssets,map:poemImageMap,stats:poemImageStats,imagesForWork}',context);
const {works,assets,map,stats,imagesForWork}=context.model;
assert.equal(stats.works,works.length);assert.equal(stats.placements,430);
for(const work of works){const images=imagesForWork(work);assert.equal(images.length,2,work.s[5]);for(const image of images){assert(image.note&&image.relation);assert(image.source.startsWith('https://commons.wikimedia.org/'));assert(!/^https?:/.test(image.src),'images must be bundled locally');assert(fs.existsSync(path.join(root,'dist',image.src)));}}
for(const [id,image]of Object.entries(assets)){assert(image.author&&image.license&&image.licenseUrl,'missing image attribution '+id);const bytes=fs.readFileSync(path.join(root,'dist',image.src));assert(bytes[0]===0xff&&bytes[1]===0xd8||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'not a JPEG or PNG: '+id);}
assert.deepEqual(Array.from(map['ss-xihu'].images,x=>x.asset),['xihu','westlake-painting']);
assert(assets['xuanzhou-painting'].author.includes('Traroth'),'retain photographer credit for licensed artwork photo');
assert(assets.moon.date.startsWith('1992'),'use photograph date rather than upload timestamp');
assert(map['lb-tianmu'].images.every(x=>x.note.includes('不是')||x.note.includes('不表示')),'comparative mountain images must not claim Tianmu location');
assert(map['df-shuxiang'].images[0].note.includes('不是诗中武侯祠'));
assert.equal(works.filter(w=>w.featured).length,37,'images must not add mapped traces');
console.log('Images: all 215 readings have two local images; file signatures, source credits, and geographic caveats passed.');
