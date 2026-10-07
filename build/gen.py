import math, random, base64, json, io
from PIL import Image, ImageDraw

W,H = 1218,660
CX,CY = W*0.5255, H*0.5455          # London
TBX,TBY = W*0.493, H*0.403          # Tower Bridge
ILX,ILY = 330,170                   # island half extents
ISX,ISQ = 29,26                     # sand inset
SQ5=math.sqrt(5)
# river: runs along iso axis e1=(2,1)/sqrt5 at CONSTANT s (cross coord).
_u,_v=TBX-CX,TBY-CY
RS=(-_u+2*_v)/SQ5                   # river centreline cross-coord (through Tower Bridge)
RTB=(2*_u+_v)/SQ5                   # TB t coord along river axis
def rWIG(t):
    x=(t-RTB)/45.0
    return 7*math.sin(x)+3.5*math.sin(x*1.6+0.8)   # wiggles, ~0 at the bridge
def rHW(t):
    return 12 + 3*math.sin(t/50.0+0.4)
def in_river(px,py):
    u,v=px-CX,py-CY
    t=(2*u+v)/SQ5; s=(-u+2*v)/SQ5
    if abs(t-RTB)>440: return False
    if math.hypot(u,v)<62: return False            # keep palace clear
    return abs(s-RS-rWIG(t)) < rHW(t)

def superdist(u,v,A,B):
    a=(abs(u)/A,abs(v)/B); m=max(a); n=min(a)
    if m<1.0:
        k=min(n,1.0-m); d=(m-1.0)*k
    else:
        dx=a[0]-1.0 if a[0]>=a[1] else 0.0
        dy=a[1]-1.0 if a[1]>a[0] else 0.0
        d=math.hypot(dx,dy)*(min(A,B)+0.5*(max(A,B)-min(A,B)))
    return d
def land_dist(px,py):
    d=superdist(px-CX,py-CY,ILX,ILY)
    wob=9.0*math.sin(px/87.0+0.7)*math.sin(py/63.0+2.1)+5.0*math.sin(px/41.0+4.0)*math.sin(py/97.0+1.3)
    return d-wob
def beach_dist(px,py):
    d=superdist(px-CX,py-CY,ILX-ISX,ILY-ISQ)
    wob=7.0*math.sin(px/95.0+2.9)*math.sin(py/71.0+0.4)+4.0*math.sin(px/47.0+1.1)*math.sin(py/83.0+3.3)
    return d-wob

random.seed(7)
patches=[]
for _ in range(46):
    kind=random.choice([-1,-1,1,1,1])
    cx=CX+random.uniform(-300,300); cy=CY+random.uniform(-150,150)
    rx=random.uniform(35,95); ry=rx*0.5
    patches.append((cx,cy,rx,ry,kind))

img=Image.new('RGBA',(W,H)); pix=img.load()
G1=(0x92,0xC8,0x45); GD=(0x7E,0xB7,0x3E); GL=(0xA0,0xCF,0x4E)
SAND=(0xFA,0xC9,0x40); RIM=(0xF7,0xD9,0x86); SEA=(0x35,0x97,0xEE)
mix=lambda c1,c2,t: tuple(int(c1[k]+(c2[k]-c1[k])*t) for k in range(3))
for j in range(H):
    py=j+0.5
    for i in range(W):
        px=i+0.5
        if land_dist(px,py)>0: continue
        if in_river(px,py):
            col=SEA
            for dx,dy in ((5,0),(-5,0),(0,5),(0,-5)):
                qx,qy=px+dx,py+dy
                if not in_river(qx,qy) and land_dist(qx,qy)<=0 and beach_dist(qx,qy)>0:
                    col=SAND; break
        elif beach_dist(px,py)<=0:
            col=SAND
        else:
            c=0.0
            for (cx,cy,rx,ry,kind) in patches:
                dx=(px-cx)/rx; dy=(py-cy)/ry; r2=dx*dx+dy*dy
                if r2<1.0: c+=((1.0-r2)**2)*kind*0.9
            c=max(-1.0,min(1.0,c))
            col=mix(G1,GL,c) if c>0 else mix(G1,GD,-c)
            bd=beach_dist(px,py)
            if 0<bd<10: col=mix(col,RIM,(1.0-bd/10.0)*0.55)
        pix[i,j]=(col[0],col[1],col[2],255)

MSK_W,MSK_H=406,220
mask=Image.new('L',(MSK_W,MSK_H),0); mp=mask.load()
sc=W/MSK_W
for j in range(MSK_H):
    for i in range(MSK_W):
        px,py=(i+0.5)*sc,(j+0.5)*sc
        if land_dist(px,py)<=0: mp[i,j]=255

def draw_boat(mir=False):
    bw,bh=96,68
    im=Image.new('RGBA',(bw,bh),(0,0,0,0)); d=ImageDraw.Draw(im)
    cx,cy=48,36
    def ell(color,ox,oy,rx,ry):
        d.ellipse([cx-rx+ox,cy-ry+oy,cx+rx+ox,cy+ry+oy],fill=color)
    ell((198,88,12,255),0,4,45,24)
    ell((247,132,22,255),0,0,45,24)
    ell((255,158,42,255),0,-2,42,21)
    ell((156,100,48,255),0,-1,32,14)
    ell((176,118,60,255),0,-2,31,13)
    for k in range(5):
        yy=-9+k*4.6
        d.line([(cx-28,cy+yy),(cx+28,cy+yy)],fill=(140,88,38,255))
    for ang in range(0,360,24):
        a=math.radians(ang)
        x1,y1=cx+math.cos(a)*36,cy-1+math.sin(a)*17
        x2,y2=cx+math.cos(a)*44,cy-1+math.sin(a)*23
        d.line([(x1,y1),(x2,y2)],fill=(224,112,16,255))
    d.arc([cx+30,cy-14,cx+52,cy+8],120,240,fill=(250,205,90,255),width=3)
    d.rectangle([cx-53,cy-18,cx-44,cy-4],fill=(72,72,80,255))
    d.rectangle([cx-55,cy-22,cx-42,cy-16],fill=(95,95,102,255))
    d.line([(cx-48,cy-4),(cx-48,cy+9)],fill=(60,60,66,255),width=4)
    d.ellipse([cx-53,cy+7,cx-43,cy+14],fill=(48,48,54,255))
    if mir: im=im.transpose(Image.FLIP_LEFT_RIGHT)
    return im

def draw_crew():
    cw,ch=12,20
    im=Image.new('RGBA',(cw,ch),(0,0,0,0)); d=ImageDraw.Draw(im)
    cx=6
    skin=(110,70,40,255); hair=(40,25,15,255); vest=(240,120,20,255)
    d.line([(cx-2,10),(cx-3,15)],fill=vest,width=2)
    d.line([(cx+2,10),(cx+3,15)],fill=vest,width=2)
    d.rounded_rectangle([cx-3,7,cx+3,16],2,fill=vest)
    d.ellipse([cx-3,0.5,cx+3,6.5],fill=skin)
    for k in range(4):
        d.ellipse([cx-3.4+k*1.8-0.6,-0.5+(k%2)*0.8,cx-3.4+k*1.8+1.8,2.3+(k%2)*0.8],fill=hair)
    return im

def draw_adept(front,mir,phase):
    aw,ah=14,26
    im=Image.new('RGBA',(aw,ah),(0,0,0,0)); d=ImageDraw.Draw(im)
    cx=7
    skin=(110,70,40,255); hair=(40,25,15,255); vest=(240,120,20,255)
    vdark=(205,98,12,255); jeans=(60,80,140,255); jd=(46,62,112,255); shoe=(245,245,245,255)
    sw=math.sin(phase)*2.4
    d.polygon([(cx-3,15),(cx-0.5,15),(cx-1.5,22+sw),(cx-3.5,22+sw)],fill=jeans)
    d.polygon([(cx+0.5,15),(cx+3,15),(cx+3.5,22-sw),(cx+1.5,22-sw)],fill=jd)
    d.rounded_rectangle([cx-4,21.5+sw,cx-1,24.5+sw],1.5,fill=shoe)
    d.rounded_rectangle([cx+1,21.5-sw,cx+4,24.5-sw],1.5,fill=shoe)
    d.line([(cx-4,9.5),(cx-5.5,14+sw)],fill=vdark,width=2)
    d.line([(cx+4,9.5),(cx+5.5,14-sw)],fill=vdark,width=2)
    d.rounded_rectangle([cx-4,7.5,cx+4,16.5],2.5,fill=vest)
    d.line([(cx-2.2,8),(cx-2.2,16)],fill=vdark,width=1)
    d.line([(cx+2.2,8),(cx+2.2,16)],fill=vdark,width=1)
    if front:
        d.rectangle([cx-1.5,9,cx+1.5,13],fill=(250,250,250,200))
    d.rectangle([cx-1.5,6,cx+1.5,8.5],fill=skin)
    d.ellipse([cx-3.4,0.8,cx+3.4,7.6],fill=skin)
    for k in range(6):
        hx=cx-3.6+k*1.45; hy=0.2+(k%2)*0.9
        d.ellipse([hx-1.2,hy,hx+1.6,hy+2.6],fill=hair)
    d.ellipse([cx-4.0,1.6,cx-2.0,4.4],fill=hair)
    d.ellipse([cx+2.0,1.6,cx+4.0,4.4],fill=hair)
    if front:
        d.ellipse([cx-2.3,3.4,cx-0.7,5.0],fill=(255,255,255,255))
        d.ellipse([cx+0.7,3.4,cx+2.3,5.0],fill=(255,255,255,255))
        d.ellipse([cx-2.1,3.6,cx-0.9,4.8],fill=(35,20,10,255))
        d.ellipse([cx+0.9,3.6,cx+2.1,4.8],fill=(35,20,10,255))
        d.arc([cx-1.4,4.6,cx+1.4,6.4],20,160,fill=(70,38,20,255))
    if mir: im=im.transpose(Image.FLIP_LEFT_RIGHT)
    return im

def draw_coin():
    cw=ch=24
    im=Image.new('RGBA',(cw,ch),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.ellipse([1,3,23,23],fill=(214,158,46,255))
    d.ellipse([1,1,23,21],fill=(255,209,84,255))
    d.ellipse([4,4,20,18],fill=(255,228,128,255))
    d.ellipse([6,6,18,16],fill=(230,180,60,255))
    d.text((9,7),'$',fill=(150,105,20,255))
    return im

assets={}
def b64(im,name):
    buf=io.BytesIO(); im.save(buf,'PNG')
    assets[name]='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()

b64(img,'map'); b64(mask,'mask')
b64(draw_boat(False),'boatNE'); b64(draw_boat(True),'boatNW')
b64(draw_crew(),'crew'); b64(draw_coin(),'coin')
for pi,pn in enumerate(['a','b']):
    ph=[0.0,math.pi][pi]
    b64(draw_adept(True,False,ph),'adF'+pn); b64(draw_adept(True,True,ph),'adFM'+pn)
    b64(draw_adept(False,False,ph),'adB'+pn); b64(draw_adept(False,True,ph),'adBM'+pn)
with open('/tmp/build/assets.json','w') as f:
    json.dump(assets,f)

# ---------- verification ----------
print('TB on river?',in_river(TBX,TBY))
print('London on river?',in_river(CX,CY),'land',round(land_dist(CX,CY),1))
pal_ok=all(not in_river(CX+du,CY+dv) for du,dv in [(0,0),(24,12),(-24,12),(36,18),(-36,-18),(0,24),(0,-14),(-44,-22),(44,22)])
print('palace clear:',pal_ok)
inside=[]
for ti in range(-460,461,2):
    s=RS+rWIG(ti)
    u=(2*ti-s)/SQ5; v=(ti+2*s)/SQ5
    if land_dist(CX+u,CY+v)<=0: inside.append(ti)
print('river crossing t range:',min(inside),max(inside))
bad=[(du,dv) for du in range(-60,61,4) for dv in range(-30,31,3) if in_river(CX+du,CY+dv)]
print('river pixels in palace box:',len(bad))
for name,sx_,sy_ in [('NE',2/SQ5,-1/SQ5),('SW',-2/SQ5,1/SQ5),('NW',-2/SQ5,-1/SQ5),('SE',2/SQ5,1/SQ5)]:
    e=None
    for dd in range(0,430):
        px,py=TBX+dd*sx_,TBY+dd*sy_
        if land_dist(px,py)>0: e=dd; break
    print('TB exit',name,e)
print('sum KB', sum(len(v) for v in assets.values())//1024)
print('consts RS=%.3f RTB=%.3f'%(RS,RTB))
pal_ok=all(not in_river(CX+du,CY+dv) for du,dv in [(0,0),(24,12),(-24,12),(36,18),(-36,-18),(0,24),(0,-14),(-44,-22),(44,22)])
print('palace clear:',pal_ok)
inside=[]
for ti in range(-460,461,2):
    s=RS+rWIG(ti)
    u=(2*ti+s)/SQ5; v=(-ti+2*s)/SQ5
    if land_dist(CX+u,CY+v)<=0: inside.append(ti)
print('river crossing t range:',min(inside),max(inside))
# exit distances from TB along 4 iso dirs
for name,sx_,sy_ in [('NE',2/SQ5,1/SQ5),('SW',-2/SQ5,-1/SQ5),('NW',-2/SQ5,1/SQ5),('SE',2/SQ5,-1/SQ5)]:
    e=None
    for dd in range(0,430):
        px,py=TBX+dd*sx_,TBY+dd*sy_
        if land_dist(px,py)>0: e=dd; break
    print('TB exit',name,e)
print('sum KB', sum(len(v) for v in assets.values())//1024)
print('consts RS=%.3f RTB=%.3f'%(RS,RTB))
