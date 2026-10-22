# 河流、湖泊与地标图层

核对日期：2026-10-21。

## 本次采用的复用方式

采用 Natural Earth 的 **1:1000万物理地理矢量数据**，只提取河流、湖泊要素；沿用现有省级地理底图和本站配色，不引入新的行政边界。这里的“10m”是 1:10 million 的比例尺命名，不是10米空间分辨率。

- [河流及湖泊中心线](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/)
- [湖泊与水库](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-lakes/)
- [Natural Earth 许可说明](https://www.naturalearthdata.com/about/terms-of-use/)：公版数据，可修改和再分发。本站保留 Made with Natural Earth 署名与链接。
- [上游数据仓库](https://github.com/nvkelso/natural-earth-vector)：下载对应 GeoJSON，保留下载地址和文件 SHA-256，见 [water-sources.json](../dist/assets/map/water-sources.json)。本仓库不分发整套全球原始数据。

选中20个源要素，组合为14个中文命名组：11条河流的选取线段，以及3个湖泊。坐标保留5位小数；画面使用本站现有投影、SVG笔触、青蓝配色、浅色描边和中文标签。数据不是手绘河流轨迹，也没有把河流改画成人生行迹线。

## 已加入的内容

| 类别 | 内容 |
| --- | --- |
| 河流 | 长江、金沙江、黄河、汉江、赣江、岷江、富春江、湘江、淮河、嘉陵江、渭河 |
| 湖泊 | 洞庭湖、鄱阳湖、太湖 |
| 诗文地标 | 庐山、泰山、嵩山、天姥山、黄鹤楼、白帝城、岳阳楼、杜甫草堂、西湖、石钟山 |

地标位置沿用网站已有教学站点的区域坐标；例如杜甫草堂沿用成都站点，不能把全国尺度的小图标当作建筑入口的精确定位。岳阳楼另附 [岳阳市公开景区资料](https://www.yueyang.gov.cn/yyskl/58123/58124/58129/content_1612371.html)。相同或过近的地标与当前诗人的行迹标记合并展示，避免叠画；标签会尽量避让当前城市和其他标签。

## 为什么选这个方案

| 资源 | 本次判断 |
| --- | --- |
| Natural Earth 物理矢量 | 已采用：能只复用线形，重新配色；文件小，可以随静态网站分发，适合目前的全国尺度与留白风格。 |
| OpenStreetMap | 备选：更适合将来需要街区、道路与细致地点的探索。[官方许可](https://www.openstreetmap.org/copyright)要求 ODbL 及署名；公共地图瓦片也有独立使用政策。本次未接入其数据或瓦片。 |
| 现有 DataV 省级底图 | 保留：本次不改变原有定位与边界来源，也不另外加入路网和行政标签。 |

这些是针对本站界面目的的选型判断，不是对所有地图产品的通用排名。地图风格由渲染方式决定，不需要直接复制第三方地图的整套视觉样式。

## 教学与制图边界

- 河道、湖岸均为现代概化参考，不是唐宋水系、岸线或水运网络复原。Natural Earth 的湖泊形状和河流线段也不是完整流域模型。
- 地标、水系属于地理背景，开关或点击不会为任何诗人增加行迹。金色路线与蓝色水系在图例中分别说明。
- 点击部分河湖可打开相关作品；这类关联用于主题阅读，不足以确认创作地点或具体行舟路线。其他水系只提供地理说明，不自动拼配诗句。
- 《将进酒》写黄河，不证明作者当时在河岸；梦游天姥的地点不是李白亲历依据；富春江数据也未被扩写成完整钱塘江流域。
- 地形明暗仍是程序绘制的艺术示意，不是测绘高程。地标图标为本站绘制，未复制第三方图片。

## 维护与再生成

下载 Natural Earth 上游的 `ne_10m_rivers_lake_centerlines.geojson` 和 `ne_10m_lakes.geojson`，分别保存为 `rivers.geojson`、`lakes.geojson`，然后运行：

```bash
python3 scripts/prepare_water_data.py /path/to/downloaded/files
```

脚本按上游河流标识和湖名选择要素，生成 `dist/assets/map/water.json` 与来源元数据。站点只读取本地生成文件，不向第三方地图服务发送访客请求。

- `dist/geography.js`：中文说明、地标与作品关联、图层开关、标签避让和说明弹窗。
- `dist/map.js`：将地理参考图层置于行迹与城市标记之下。
- `scripts/prepare_water_data.py`：筛选与来源记录。
