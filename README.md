# 诗行山河 · Shixing Shanhe

[English](README.en.md) · 简体中文 · [在线演示](https://shixing-shanhe.guori12321.chatgpt.site/)

面向初、高中师生的中文诗词教学演示。循着李白、杜甫和苏轼的行迹，把地点、人生故事与诗文串起来。

![行迹地图与当前站点诗文](docs/screenshots/map.png)

## 功能

- **足迹地图**：立体山河明暗、陆地厚度、悬起的行迹弧线与城市标记，可切换简洁底图；按诗人、地点和时间探索；显示当前站点的诗文全文、背景故事与课堂提问。区分可定位行迹、诗中地点和待考地点，连线仅为精选行迹的先后示意。
- **篇目书架**：独立页面收录37篇诗词与古文（李白13、杜甫12、苏轼12），支持作者、学段、来源分类和关键词筛选、遮文背诵，以及返回对应地图站点。
- **诗意影院**：独立页面收录三段约一分钟的朗诵影片。对应站点显示影片封面，点击后才播放；配中文合成朗诵、原创合成配乐、逐句字幕、场景跳转、全屏及下载。
- **当代实景照片**：庐山瀑布、黄鹤楼、白帝城、杜甫草堂和西湖，附作者、日期与授权来源。
- **统一导航**：地图、书架、影院、课堂锦囊、关于本页；首页聚焦地图与当前诗文。

## 界面截图

### 篇目搜索

![书架中搜索庐山相关作品](docs/screenshots/library.png)

### 诗意影院

![三首诗词的独立影院页面](docs/screenshots/cinema.png)

### 有声影片

![朗诵影片与场景跳转](docs/screenshots/movie.png)

| 作品 | 作者 | 时长 | 场景 |
| --- | --- | --- | --- |
| 望庐山瀑布 | 李白 | 60秒 | 紫烟、飞瀑、银河 |
| 春望 | 杜甫 | 62秒 | 长安春色、烽火、家书 |
| 念奴娇·赤壁怀古 | 苏轼 | 66秒 | 大江、惊涛、周瑜想象、江月 |

## 本地运行

网站使用原生 HTML、CSS 和 JavaScript，无构建步骤、数据库或运行时 API 密钥。需要 Python 3 或其他静态文件服务器。

```bash
git clone https://github.com/guori12321/shixing-shanhe.git
cd shixing-shanhe
python3 -m http.server 5173 --directory dist
```

打开 <http://localhost:5173>。请通过 HTTP 访问，避免直接双击 HTML 导致地图 JSON 读取受限。

| 页面 | 本地地址 |
| --- | --- |
| 足迹地图 | http://localhost:5173/index.html |
| 篇目书架 | http://localhost:5173/library.html |
| 诗意影院 | http://localhost:5173/videos.html |
| 指定作品示例 | http://localhost:5173/index.html?work=lb-lushan |

部署时将 **`dist/` 的内容**上传到静态网站托管服务即可；截图文档与制作脚本不属于网站运行依赖。仓库已经包含可播放的影片，无需重新生成媒体。

## 项目结构与维护

```text
dist/                    静态网站，可直接托管
  index.html             行迹地图首页
  library.html           独立篇目书架
  videos.html            独立影院
  site-nav.js            三个页面共用的导航与说明弹窗
  poetry-data.js          基础作品、作者与行迹数据
  curriculum.js          补充作品及学习元数据
  map.js                 地形图层、行迹弧线与城市标记
  app.js                 时间轴与站点详情
  library.js             筛选、全文赏读与课标说明
  cinema.js              影片目录与播放器
  assets/                底图、照片、影片、封面和字幕
docs/screenshots/        README 界面截图
media-production/       影片制作脚本、分镜、提示词和时间清单
CURRICULUM_AUDIT.md      课标核对记录与参考来源
```

修改作品与行迹时，请保留地点角色、约年及不确定性说明；修改导航请使用 `site-nav.js`。影片制作需要额外的 Python 依赖、ffmpeg 和字体，详见 [制作记录](media-production/README.md)。

## 教学范围与资料来源

对照2025日常修订版课标，仅核对这三位作者：初中8篇、高中11篇，均已收录。**不代表覆盖其他作者、各地全部考题或课外鉴赏材料**。使用时请结合当地考试年份、学校教材和注本；系年、异文及地望可能有不同说法。详见 [核对记录](CURRICULUM_AUDIT.md)。

地图的立体明暗由程序绘制，为艺术示意，不是测绘高程或真实DEM。地图使用现代地理坐标与省级底图，非唐宋疆域或精确交通路线。黄州赤壁不等同于通常认定的赤壁之战古战场；周瑜场景属于词中的怀古想象。

## 素材与许可说明

- 古典作品为古代公版文本；教学说明为本演示编写。
- 实景照片来自 Wikimedia Commons，具体作者、作品链接及各自的 CC BY / CC BY-SA 授权见 [photos.js](dist/photos.js) 与 [原始署名记录](dist/assets/photos/credits.json)。照片经过尺寸适配，界面有裁切展示；相关素材仍适用各自原许可。
- 影片绘画由 AI 生成，属于动态绘本式艺术复现；朗诵使用 `zh-CN-YunxiNeural` 合成语音，配乐和环境声由程序生成，非真人录音或历史影像。生成提示词与脚本保存在制作目录。
- 底图来自 [DataV GeoAtlas](https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json)，引用时请保留来源并核对使用条件。
- 交互方式参考 [DeanChensj/jiangshan-map](https://github.com/DeanChensj/jiangshan-map)，本项目界面与实现独立编写。

本仓库未为全部内容指定统一的开源许可证；公开可见不等同于无限制再许可。第三方素材按其各自条款使用。
