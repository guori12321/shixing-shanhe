// Ready-made OpenFreeMap cartography + Mapterhorn elevation, rendered by MapLibre.
// Only teaching routes and annotations are authored here; no invented terrain.
let mapStyle='relief',terrainMap=null,mapReady=false,lastMapSelection='',mapFaultTimer;
const mapCollection=features=>({type:'FeatureCollection',features});
const mapFeature=(geometry,properties)=>({type:'Feature',geometry,properties});
// Slightly curved schematic links separate outward and return journeys.
function routeCoordinates(a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],control=[(a[0]+b[0])/2-dy*.14,(a[1]+b[1])/2+dx*.14];
 return Array.from({length:25},(_,i)=>{const t=i/24,u=1-t;return [u*u*a[0]+2*u*t*control[0]+t*t*b[0],u*u*a[1]+2*u*t*control[1]+t*t*b[1]];});
}
function addRouteArrow(){
 const canvas=document.createElement('canvas');canvas.width=48;canvas.height=36;
 const ctx=canvas.getContext('2d');ctx.beginPath();ctx.moveTo(8,7);ctx.lineTo(37,18);ctx.lineTo(8,29);ctx.lineTo(15,18);ctx.closePath();
 ctx.fillStyle='#9b5a28';ctx.strokeStyle='#fff9e7';ctx.lineWidth=3;ctx.lineJoin='round';ctx.fill();ctx.stroke();
 terrainMap.addImage('travel-arrow',ctx.getImageData(0,0,48,36),{pixelRatio:2});
}
function terrainNotice(text){$('terrainStatus').textContent=text;$('terrainStatus').hidden=!text;}
function initMapView(){
 initGeography();initFrontiers();
 $('terrainFocus').onclick=()=>focusMapStop();
 document.querySelectorAll('[data-map-style]').forEach(button=>button.onclick=()=>{
  mapStyle=button.dataset.mapStyle;
  document.querySelectorAll('[data-map-style]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  if(!mapReady)return;
  terrainMap.setTerrain(mapStyle==='relief'?{source:'elevation',exaggeration:1.5}:null);
  terrainMap.easeTo({pitch:mapStyle==='relief'?60:0,duration:700});
 });
 try{
  terrainMap=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/bright',center:[111.5,32],zoom:4.6,pitch:50,bearing:-12,maxPitch:80,maxZoom:15,attributionControl:false,localIdeographFontFamily:'sans-serif',locale:{'NavigationControl.ZoomIn':'放大','NavigationControl.ZoomOut':'缩小','NavigationControl.ResetBearing':'恢复正北方向','AttributionControl.ToggleAttribution':'地图来源','AttributionControl.MapFeedback':'地图反馈'}});
 }catch(error){terrainNotice('此浏览器暂不支持三维地图，请使用支持 WebGL 的浏览器。仍可通过时间轴阅读全部诗文。');return;}
 terrainMap.getCanvas().setAttribute('aria-label','可缩放旋转的三维地理地图，亦可使用下方时间轴选择站点');
 terrainMap.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-left');
 terrainMap.addControl(new maplibregl.AttributionControl({compact:false,customAttribution:'<a href="https://www.naturalearthdata.com/" target="_blank">河湖 Natural Earth</a>'}),'bottom-right');
 new ResizeObserver(()=>terrainMap.resize()).observe($('map').parentElement);
 mapFaultTimer=setTimeout(()=>{if(!mapReady)terrainNotice('第三方地图连接较慢，请检查网络后点击重试。时间轴与诗文仍可使用。');},18000);
 $('terrainStatus').onclick=()=>{if(!mapReady)location.reload();};
 terrainMap.on('error',e=>{
  if(!mapReady)return;
  const url=e.error?.url||e.error?.message||'';
  if(/mapterhorn|elevation/.test(url))terrainNotice('高程暂未加载完成，可切换平面地图或稍后重试。');
 });
 terrainMap.on('load',()=>{
  clearTimeout(mapFaultTimer);
  // Keep the provider's natural landscape; omit modern transport, settlements,
  // buildings, boundaries and labels at every zoom. Teaching labels are added below.
  const modernLayers=new Set(['transportation','transportation_name','building','aeroway','aerodrome_label','boundary','landuse','place','poi','housenumber']);
  for(const layer of terrainMap.getStyle().layers){
   if(layer.type==='symbol'||modernLayers.has(layer['source-layer']))terrainMap.setLayoutProperty(layer.id,'visibility','none');
  }
  terrainMap.addSource('elevation',{type:'raster-dem',url:'https://tiles.mapterhorn.com/tilejson.json',tileSize:512,encoding:'terrarium',maxzoom:12});
  const firstSymbol=terrainMap.getStyle().layers.find(l=>l.type==='symbol')?.id;
  terrainMap.addLayer({id:'terrain-shade',type:'hillshade',source:'elevation',paint:{'hillshade-shadow-color':'#596c53','hillshade-highlight-color':'#f6f2dd','hillshade-exaggeration':.35}},firstSymbol);
  terrainMap.setTerrain(mapStyle==='relief'?{source:'elevation',exaggeration:1.5}:null);
  for(const id of ['poet-route','route-labels','poet-stops','teaching-water','water-labels','poem-landmarks','historical-frontier','frontier-labels'])terrainMap.addSource(id,{type:'geojson',data:mapCollection([])});
  terrainMap.addLayer({id:'water-lakes',type:'fill',source:'teaching-water',maxzoom:8,filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#80b5ba','fill-opacity':.45}});
  terrainMap.addLayer({id:'water-rivers',type:'line',source:'teaching-water',maxzoom:8,filter:['==',['geometry-type'],'LineString'],paint:{'line-color':'#368e9c','line-width':2,'line-opacity':.75}});
  terrainMap.addLayer({id:'water-names',type:'symbol',source:'water-labels',maxzoom:8,layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':12},paint:{'text-color':'#276c7a','text-halo-color':'#fffef5','text-halo-width':2}});
  terrainMap.addLayer({id:'frontier-soft',type:'line',source:'historical-frontier',maxzoom:8,paint:{'line-color':'#877496','line-width':12,'line-opacity':.12,'line-blur':5}});
  terrainMap.addLayer({id:'frontier-line',type:'line',source:'historical-frontier',maxzoom:8,paint:{'line-color':'#80678f','line-width':1.8,'line-opacity':.8,'line-dasharray':[4,3]}});
  terrainMap.addLayer({id:'frontier-names',type:'symbol',source:'frontier-labels',maxzoom:8,layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':12,'text-allow-overlap':false},paint:{'text-color':'#725e80','text-halo-color':'#fffcef','text-halo-width':2}});
  terrainMap.addLayer({id:'route-halo',type:'line',source:'poet-route',paint:{'line-color':'#fff9e7','line-width':6,'line-opacity':.9}});
  terrainMap.addLayer({id:'route-future',type:'line',source:'poet-route',filter:['==',['get','done'],false],paint:{'line-color':'#ab7953','line-width':2.5,'line-dasharray':[2,2],'line-opacity':.7}});
  terrainMap.addLayer({id:'route-done',type:'line',source:'poet-route',filter:['==',['get','done'],true],paint:{'line-color':'#a66535','line-width':3}});
  addRouteArrow();
  terrainMap.addLayer({id:'route-arrows',type:'symbol',source:'poet-route',layout:{'symbol-placement':'line-center','icon-image':'travel-arrow','icon-size':1.2,'icon-rotation-alignment':'map','icon-pitch-alignment':'viewport','icon-keep-upright':false,'icon-allow-overlap':true,'icon-ignore-placement':true},paint:{'icon-opacity':['case',['get','done'],1,.7]}});
  terrainMap.addLayer({id:'route-years',type:'symbol',source:'route-labels',layout:{'text-field':['get','yearLabel'],'text-font':['Noto Sans Regular'],'text-size':11,'text-variable-anchor':['bottom','top','left','right'],'text-radial-offset':1.2,'text-rotation-alignment':'viewport','text-pitch-alignment':'viewport','text-allow-overlap':false,'text-padding':4},paint:{'text-color':['case',['get','done'],'#80471e','#987452'],'text-halo-color':'#fffcef','text-halo-width':2}});
  terrainMap.addLayer({id:'landmark-points',type:'circle',source:'poem-landmarks',paint:{'circle-radius':5,'circle-color':'#f6f0d7','circle-stroke-color':'#6e8153','circle-stroke-width':2}});
  terrainMap.addLayer({id:'landmark-names',type:'symbol',source:'poem-landmarks',layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':11,'text-anchor':'top','text-offset':[0,1]},paint:{'text-color':'#5c704d','text-halo-color':'#fffef5','text-halo-width':2}});
  terrainMap.addLayer({id:'stop-halo',type:'circle',source:'poet-stops',filter:['==',['get','current'],true],paint:{'circle-radius':17,'circle-color':'#c59956','circle-opacity':.25}});
  terrainMap.addLayer({id:'stop-points',type:'circle',source:'poet-stops',paint:{'circle-radius':['case',['get','current'],8,5],'circle-color':['case',['get','imagined'],'#6d9890',['get','current'],'#ac6b38','#fff9e7'],'circle-stroke-color':'#9e7247','circle-stroke-width':2}});
  terrainMap.addLayer({id:'stop-names',type:'symbol',source:'poet-stops',layout:{'text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':['case',['get','current'],15,13],'text-anchor':'left','text-offset':[.9,0],'text-allow-overlap':false,'symbol-sort-key':['case',['get','current'],0,1]},paint:{'text-color':['case',['get','current'],'#82491e','#3c5745'],'text-halo-color':'#fffcef','text-halo-width':2}});
  const interactive=['route-years','route-arrows','stop-points','stop-names','landmark-points','landmark-names','water-rivers','water-lakes','water-names'];
  terrainMap.on('click',e=>{const features=terrainMap.queryRenderedFeatures([[e.point.x-5,e.point.y-5],[e.point.x+5,e.point.y+5]],{layers:interactive});const f=features.find(f=>f.source==='poet-stops')||features.find(f=>f.source==='poem-landmarks')||features[0];if(!f)return;if(f.source==='poet-stops'||f.source==='poet-route'||f.source==='route-labels')select(+f.properties.step);else showGeography(f.properties.topic);});
  terrainMap.on('mousemove',e=>{terrainMap.getCanvas().style.cursor=terrainMap.queryRenderedFeatures(e.point,{layers:interactive}).length?'pointer':'';});
  mapReady=true;terrainNotice('');drawMap();if(frontierVisible)focusFrontier();
 });
}
function drawMap(){
 const p=people[person],s=p.stops[step];$('terrainFocus').disabled=s[2]==null;
 if(!mapReady)return;
 drawFrontiers();
 if(frontierReading){for(const id of ['poet-stops','poet-route','route-labels','poem-landmarks','teaching-water','water-labels'])terrainMap.getSource(id).setData(mapCollection([]));return;}
 const groups=new Map();p.stops.forEach((s,i)=>{if(s[2]==null)return;if(!groups.has(s[1]))groups.set(s[1],[]);groups.get(s[1]).push(i);});
 const actual=p.stops.map((s,i)=>({s,i})).filter(({s})=>s[11].role==='行迹'&&s[2]!=null),route=actual.filter((x,i)=>!i||x.s[1]!==actual[i-1].s[1]);
 const stops=[...groups].map(([name,ids])=>{const i=ids.includes(step)?step:ids[0],s=p.stops[i],imagined=s[11].role==='诗中地点';return mapFeature({type:'Point',coordinates:[s[2],s[3]]},{step:i,current:ids.includes(step),imagined,label:(imagined?'◇ ':'')+name+(ids.length>1?' · '+ids.length+'篇':'')+(name===route[0]?.s[1]?'\n① '+route[0].s[0]:'')});});

 terrainMap.getSource('poet-stops').setData(mapCollection(stops));
 const legs=route.slice(1).map((b,i)=>mapFeature({type:'LineString',coordinates:routeCoordinates([route[i].s[2],route[i].s[3]],[b.s[2],b.s[3]])},{done:b.i<=step,step:b.i,yearLabel:(i+2)+' · '+b.s[0]}));
 terrainMap.getSource('poet-route').setData(mapCollection(legs));
 terrainMap.getSource('route-labels').setData(mapCollection(legs.map(f=>mapFeature({type:'Point',coordinates:f.geometry.coordinates[12]},f.properties))));
 terrainMap.getSource('teaching-water').setData(showWater&&waterData?waterData:mapCollection([]));
 terrainMap.getSource('water-labels').setData(mapCollection(showWater?Object.entries(waterTopics).map(([id,t])=>mapFeature({type:'Point',coordinates:t.anchor},{topic:id,name:t.name})):[]));
 // Water line features retain their Natural Earth group IDs for teaching popups.
 if(showWater&&waterData)terrainMap.getSource('teaching-water').setData(mapCollection(waterData.features.map(f=>({...f,properties:{...f.properties,topic:f.properties.group}}))));
 terrainMap.getSource('poem-landmarks').setData(mapCollection(showLandmarks?poemLandmarks.filter(m=>!groups.has(m.region)&&m.works.some(id=>p.stops.some(s=>s[11].id===id))).map(m=>mapFeature({type:'Point',coordinates:[m.lon,m.lat]},{name:m.name,topic:'landmark:'+m.id})):[]));
 const key=person+':'+step;
 if(key!==lastMapSelection){const changedPerson=lastMapSelection.split(':')[0]!==String(person),first=!lastMapSelection;lastMapSelection=key;if(changedPerson&&(!first||!new URLSearchParams(location.search).get('work')))overviewMap();else if(s[2]!=null)focusMapStop();else overviewMap();}
}
function focusMapStop(){
 if(!mapReady)return;
 const s=people[person].stops[step];if(s[2]==null)return;
 const mountain=poemLandmarks.some(m=>m.kind==='mountain'&&m.works.includes(s[11].id));
 terrainMap.flyTo({center:[s[2],s[3]],zoom:mountain?10.8:8.4,pitch:mapStyle==='relief'?65:0,bearing:-25,duration:1400,essential:false});
 $('mapQuote').classList.add('map-quote-quiet');
}
function overviewMap(){
 if(!mapReady)return;
 const stops=people[person].stops.filter(s=>s[2]!=null);if(!stops.length)return;
 const bounds=new maplibregl.LngLatBounds();stops.forEach(s=>bounds.extend([s[2],s[3]]));
 terrainMap.fitBounds(bounds,{padding:{top:100,bottom:110,left:65,right:65},pitch:mapStyle==='relief'?45:0,bearing:0,maxZoom:6,duration:1000});
 $('mapQuote').classList.remove('map-quote-quiet');
}
