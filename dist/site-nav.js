// All pages use the same navigation and shared teaching/about dialogs.
(()=>{
const page=document.body.classList.contains('video-page')?'videos':document.body.classList.contains('library-page')?'library':'map';
const items=[['map','足迹地图','index.html'],['library','篇目书架','library.html'],['videos','诗意影院','videos.html']];
$('siteNav').innerHTML=items.map(([key,label,href])=>`<a href="${href}" ${page===key?'class="active" aria-current="page"':''}>${label}</a>`).join('')+'<button id="classroom">课堂锦囊</button><button id="about">关于本页</button>';
$('classroom').onclick=()=>showModal('<p class="eyebrow">给老师的课堂锦囊</p><h2>用一段旅程，讲一堂诗词课</h2><ol><li>导入（2 分钟）：选择诗人，观察他的足迹分布。</li><li>知人论世（5 分钟）：播放路线，串联地点与人生处境。</li><li>文本赏读（8 分钟）：点击城市，结合实景照片或朗诵影片赏析意象。</li><li>合作讨论（5 分钟）：点击“课堂提问”，用诗句支撑观点。</li><li>迁移写作：选择一座城市，为诗人写一封百字书信。</li></ol><p>初中建议聚焦意象与情感；高中可增加时代背景、艺术手法与同主题比较。朗诵影片中的场景为诗意艺术复现。</p>');$('about').onclick=()=>showModal('<p class="eyebrow">关于诗行山河</p><h2>让诗词，有可以抵达的地方</h2><p>这是面向初高中师生的互动教学演示，提供李白、杜甫、苏轼共37篇诗词与古文，关联精选行迹、诗中地点与待考地点。受“江山时序”的地图探索方式启发，界面与情境插画为本演示原创。</p><p>地图使用现代地理位置，未复原唐宋疆域。每条连线只表达精选地点的先后顺序，省略途中其他地点。插画与动画用于帮助想象诗歌意境。</p><p>当前为精选样本，不是完整年谱；有争议的系年已在故事中说明。正式教学前请与所用教材、注本核对。</p>');})();
