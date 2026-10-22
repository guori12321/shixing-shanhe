// Compile editable image manifests without reassigning or overwriting human curation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const assets=JSON.parse(read('data/poem-image-assets.json')),map=JSON.parse(read('data/poem-image-map.json'));
const context={};vm.createContext(context);vm.runInContext(['curriculum.js','poetry-data.js','catalog-data.js','reading-works.js'].map(f=>read('dist/'+f)).join('\n')+';this.works=getReadingWorks()',context);
for(const work of context.works){const row=map[work.meta.id];assert(row?.images?.length>=2,work.s[5]+' must have at least two curated images');assert.equal(new Set(row.images.map(x=>x.asset)).size,row.images.length,'duplicate gallery asset');for(const image of row.images){assert(assets[image.asset],image.asset+' unresolved');assert(image.relation&&image.note,'image relationship required');}}
for(const [id,asset]of Object.entries(assets)){assert(asset.source?.startsWith('https://'),'source '+id);assert(asset.author&&asset.license&&asset.licenseUrl&&asset.type,'attribution '+id);assert(fs.existsSync(path.join(root,'dist',asset.src)),'missing local asset '+id);}
const stats={works:context.works.length,assets:Object.keys(assets).length,placements:Object.values(map).reduce((n,x)=>n+x.images.length,0),checked:'2026-10-22'};
fs.writeFileSync(path.join(root,'dist/poem-images-data.js'),'// Generated from editable image manifests; each asset retains its own license.\nconst poemImageAssets='+JSON.stringify(assets)+';\nconst poemImageMap='+JSON.stringify(map)+';\nconst poemImageStats='+JSON.stringify(stats)+';\n');
console.log('Images: '+JSON.stringify(stats));
