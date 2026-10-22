from pathlib import Path
import numpy as np
from PIL import Image,ImageFilter
W,H=1260,1875
x,y=np.meshgrid(np.linspace(0,840,W),np.linspace(-300,950,H))
rng=np.random.default_rng(38)
def noise(cols,rows):
 im=Image.fromarray((rng.random((rows,cols))*255).astype('uint8')).resize((W,H),Image.Resampling.BICUBIC)
 return np.asarray(im,dtype=float)/255
n=noise(19,15)*.5+noise(47,35)*.3+noise(105,81)*.2
h=np.zeros((H,W))+.025
# Stylized ridge fields, composed for the map viewport; this is not surveyed elevation data.
ridges=[([(0,190),(70,230),(100,320),(140,420),(120,530)],67,.65), ([(25,350),(130,320),(230,332),(330,362),(410,350)],27,.45), ([(180,145),(225,200),(270,275),(305,320)],25,.34), ([(265,440),(315,480),(405,525),(475,550)],32,.26), ([(420,410),(440,460),(465,500)],19,.32), ([(360,185),(392,240),(390,285),(370,320)],16,.28), ([(440,90),(510,130),(585,170),(630,230)],27,.32), ([(530,360),(510,400),(520,455)],15,.25), ([(170,550),(220,580),(280,590),(350,580)],25,.27)]
for pts,width,amp in ridges:
 distance=np.full((H,W),1e9)
 for (ax,ay),(bx,by) in zip(pts,pts[1:]):
  t=np.clip(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2),0,1)
  distance=np.minimum(distance,np.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay)))
 ridge=np.exp(-(distance/(width*(.55+.7*n)))**2)
 h+=amp*ridge*(.45+1.1*n)
h+=.05*n
h=1-np.exp(-h)
gy,gx=np.gradient(h);nx=-gx*180;ny=-gy*180;nz=np.ones_like(h)
length=np.sqrt(nx*nx+ny*ny+nz*nz);light=(nx*(-.48)+ny*(-.6)+nz*.64)/length
shade=np.clip(.66+.49*light,.4,1.13)
stops=[0,.12,.28,.5,.75,1]
colors=np.array([[232,237,214],[218,226,194],[184,202,162],[152,177,137],[160,169,131],[215,214,179]])
base=np.stack([np.interp(h,stops,colors[:,k]) for k in range(3)],axis=-1)
color=np.clip(base*shade[...,None]+(n[...,None]-.5)*5,0,255).astype('uint8')
out=Path(__file__).resolve().parents[1]/'dist/assets/map/relief.png'
out.parent.mkdir(parents=True,exist_ok=True)
Image.fromarray(color).save(out,optimize=True)
