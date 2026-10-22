# 第三方三维地图与地理参考

核对日期：2026-10-21。

## 当前采用的地图

直接使用 **OpenFreeMap Bright 现成地图样式**，叠加 **Mapterhorn 真实 DEM 高程**，由 **MapLibre GL JS 5.15.0** 渲染。本站只加入教学行迹、站点、中文标签和地理阅读入口，不再使用程序生成的山地纹理、陆地挤出或自绘地图投影。原来的艺术地形 PNG 与生成脚本已移除。

- [OpenFreeMap 官方接入指南](https://openfreemap.org/quick_start/)：`https://tiles.openfreemap.org/styles/bright`。沿用成套制图，仅把文字优先设为中文名称或当地名称。
- [Mapterhorn 官方数据访问](https://mapterhorn.com/data-access/)：`https://tiles.mapterhorn.com/tilejson.json`，Terrarium 编码，512像素地形瓦片。[覆盖说明](https://mapterhorn.com/)列出全球30米基础数据；中国大陆使用全球覆盖，不宣称米级精度。
- [MapLibre 官方三维示例](https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/)展示同一 Mapterhorn 高程接入方式。本项目固定使用适合无构建静态页面的5.15.0浏览器包，JS/CSS本地分发，BSD-3-Clause许可见 `dist/vendor/maplibre/LICENSE.txt`。
- [Mapterhorn 上游来源与许可](https://mapterhorn.com/attribution/)。地图底部自动保留高程来源署名。
- OpenFreeMap / OpenMapTiles / [OpenStreetMap 版权与 ODbL](https://www.openstreetmap.org/copyright)署名在地图底部保留。

三维地形使用1.5倍高程夸张，便于课堂观察山脊。平面模式关闭地形起伏并恢复俯视；“全览路线”调整视野，不改变选中的诗文；“看此地山川”放大当前教学区域。山地相关篇目使用更近的视角。区域标记不是瀑布或建筑入口的精确定位。

## 选型比较

| 方案 | 本站判断 |
| --- | --- |
| OpenFreeMap + Mapterhorn + MapLibre | 已采用。现成浅色底图、真实三维地形，无需账号或 API 密钥，适合当前演示。 |
| [MapTiler](https://docs.maptiler.com/guides/developer/credentials/api-key/) | 可提供成熟地图与地形，需要有效 API 密钥，并按所选计划核对额度。没有替用户注册或开通付费服务。 |
| Natural Earth 平面阴影 / 自绘 SVG | 保留其精选河湖数据作教学参考；不再作为三维地图实现。平面阴影本身不能代替真实可倾斜地形。 |

OpenFreeMap 官方说明公共实例免费、无需密钥，但[不提供 SLA 保证](https://openfreemap.org/)。地图、字体、高程瓦片需要外网连接；未验证中国大陆校园网可达性，不能保证课堂网络下的加载速度。故障时显示中文提示，时间轴、诗文、书架和本地影片仍可使用。本站不预下载整套瓦片，也没有增加定位权限。

## 继续保留的河湖与地标

Natural Earth **1:1000万物理矢量数据**（10m 指1:10 million比例尺，不是10米分辨率）：

- [河流及湖泊中心线](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/)
- [湖泊与水库](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-lakes/)
- [公版许可](https://www.naturalearthdata.com/about/terms-of-use/)
- [上游仓库](https://github.com/nvkelso/natural-earth-vector)，下载地址与 SHA-256 记录见 `dist/assets/map/water-sources.json`。

20个源要素组合为14组：长江、金沙江、黄河、汉江、赣江、岷江、富春江、湘江、淮河、嘉陵江、渭河，以及洞庭湖、鄱阳湖、太湖。概化河湖教学叠层在放大到城市附近后隐藏，近景改用现成底图更细致的水系；图层按钮控制教学叠层，不移除底图原有水域。部分河湖点击可关联诗文。

10处诗文地标：庐山、泰山、嵩山、天姥山、黄鹤楼、白帝城、岳阳楼、杜甫草堂、西湖、石钟山。位置沿用原有教学区域坐标，不是建筑的精确定位；与当前作者站点同名的区域不重复画点。岳阳楼另附[岳阳市公开资料](https://www.yueyang.gov.cn/yyskl/58123/58124/58129/content_1612371.html)。标签由地图引擎避让。

## 教学边界

- 现成底图、高程、河湖与路网反映现代地理，不是唐宋复原。地图上的现代道路不代表诗人的交通路线。
- 金色连线只串联可定位的精选行迹；诗中地点与待考作品不计入连线。地标与水系不会为诗人增加行程。
- 《将进酒》的黄河意象不能证明作者站在黄河岸；《梦游天姥吟留别》的梦境也不是亲历证据。
- 1.5倍高程显示用于观察，不用于测量；区域坐标不能定位庐山瀑布的具体观景点。

## 维护

- `dist/map.js`：接入第三方地图、高程、镜头、教学叠层和交互。
- `dist/geography.js`：中文地理说明与作品关联。
- `scripts/prepare_water_data.py`：按上游标识筛选河湖，不生成地形。

再生成河湖：下载上游 `ne_10m_rivers_lake_centerlines.geojson`、`ne_10m_lakes.geojson`，保存为 `rivers.geojson`、`lakes.geojson`，运行 `python3 scripts/prepare_water_data.py /path/to/files`。地图引擎升级时同步更新 JS/CSS、许可与本文版本号。
