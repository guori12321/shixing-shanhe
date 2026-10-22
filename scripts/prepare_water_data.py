"""Extract a small physical-water reference layer from Natural Earth GeoJSON.
Usage: python3 scripts/prepare_water_data.py /path/to/downloaded/files
Input files: rivers.geojson and lakes.geojson. No national boundaries are imported.
"""
import sys,json,pathlib,hashlib,math
ROOT=pathlib.Path(__file__).resolve().parents[1]
raw=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path('/private/tmp/poetry-map-data')
# Use stable source river identifiers, rather than matching ambiguous English names.
rivers={15:('jinsha','金沙江'),18:('yangtze','长江'),1:('yangtze','长江'),66:('yellow','黄河'),95:('yellow','黄河'),270:('han','汉江'),278:('gan','赣江'),367:('min-sichuan','岷江'),385:('fuchun','富春江'),457:('xiang','湘江'),458:('huai','淮河'),538:('jialing','嘉陵江'),873:('wei','渭河')}
lakes={'Tai Hu':('tai','太湖'),'Poyang Hu':('poyang','鄱阳湖'),'Dongting Hu':('dongting','洞庭湖')}
def round_coords(c):
 if c and isinstance(c[0],(float,int)):return [round(float(v),5) for v in c[:2]]
 return [round_coords(x) for x in c]
features=[]
for kind in ['rivers','lakes']:
 data=json.loads((raw/(kind+'.geojson')).read_text())
 for i,f in enumerate(data['features']):
  p=f['properties'];chosen=rivers.get(int(p.get('rivernum') or -1)) if kind=='rivers' else lakes.get(p.get('name'))
  if not chosen:continue
  group,zh=chosen;geom={'type':f['geometry']['type'],'coordinates':round_coords(f['geometry']['coordinates'])}
  features.append({'type':'Feature','properties':{'id':f'{kind}-{i}','group':group,'name':zh,'source_name':p['name'],'kind':'river' if kind=='rivers' else 'lake','source_rivernum':p.get('rivernum'),'source_ne_id':p.get('ne_id'),'major':group in ['yangtze','yellow']},'geometry':geom})
out=ROOT/'dist/assets/map/water.json';out.write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':'))+'\n')
metadata={'name':'Natural Earth 1:10m physical rivers and lakes, selected features','accessed':'2026-10-21','license':'Public domain','terms':'https://www.naturalearthdata.com/about/terms-of-use/','rivers':'https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/','lakes':'https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-lakes/','upstream':'https://github.com/nvkelso/natural-earth-vector','downloads':{n:{'url':f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_{"rivers_lake_centerlines" if n=="rivers" else "lakes"}.geojson','sha256':hashlib.sha256((raw/(n+'.geojson')).read_bytes()).hexdigest()} for n in ['rivers','lakes']},'processing':'Selected source feature identifiers; coordinates rounded to 5 decimals; Chinese display names curated; no boundary geometry imported.','limitation':'Generalized modern reference geometry, not a reconstruction of Tang/Song waterways or a navigation map.','features':len(features),'groups':sorted(set(f['properties']['group'] for f in features))}
(ROOT/'dist/assets/map/water-sources.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(len(features),'features;',len(metadata['groups']),'named groups;',out.stat().st_size,'bytes')
