// All pages use the same navigation and shared teaching/about dialogs.
(()=>{
const page=document.body.classList.contains('studio-page')?'studio':document.body.classList.contains('video-page')?'videos':document.body.classList.contains('library-page')?'library':'map';
const items=[['map','足迹地图','index.html'],['library','篇目书架','library.html'],['videos','诗意影院','videos.html'],['studio','诗意创作坊','studio.html']];
$('siteNav').innerHTML=items.map(([key,label,href])=>`<a href="${href}" ${page===key?'class="active" aria-current="page"':''}>${label}</a>`).join('')+'<button id="classroom">课堂锦囊</button><button id="about">关于本页</button>';
$('classroom').onclick=()=>showTeachingHub();$('about').onclick=()=>showModal('<p class="eyebrow">关于诗行山河</p><h2>让诗词，有可以抵达的地方</h2><p>这是面向初高中师生的互动教学演示，以李白、杜甫、苏轼37篇作品为重点人物专题，关联精选行迹、诗中地点与待考地点；书架另含初高中2025课标古诗文全目录与教材版本补充。受“江山时序”的地图探索方式启发，界面与情境插画为本演示原创。</p><p>地图使用现代地理位置，未复原唐宋疆域。每条连线只表达精选地点的先后顺序，省略途中其他地点。插画与动画用于帮助想象诗歌意境。</p><p>当前为精选样本，不是完整年谱；有争议的系年已在故事中说明。正式教学前请与所用教材、注本核对。</p>');})();
