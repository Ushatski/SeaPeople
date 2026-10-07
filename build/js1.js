/* ================= SEA PEOPLE - idle island tapper ================= */
var $=function(id){return document.getElementById(id);};
var clamp=function(v,a,b){return v<a?a:(v>b?b:v);};

/* ---------- geometry (map px, picture is 1218x660) ---------- */
var MW=1218, MH=660;
var LCX=MW*0.5255, LCY=MH*0.5455;      // London (shop grid centre)
var TBX=MW*0.493, TBY=MH*0.403;        // Tower Bridge on the river
var ILX=330, ILY=170, ISX=29, ISQ=26;  // island half-extents / sand inset
var SQ5=Math.sqrt(5);
var _u=TBX-LCX,_v=TBY-LCY;
var RS=(-_u+2*_v)/SQ5;                 // river centreline cross coord (through bridge)
var RTB=(2*_u+_v)/SQ5;                 // bridge position along river axis
var rWIG=function(t){var x=(t-RTB)/45;return 7*Math.sin(x)+3.5*Math.sin(x*1.6+0.8);};
var rHW=function(t){return 12+3*Math.sin(t/50+0.4);};
function inRiver(px,py){               // map coords -> on river?
  var u=px-LCX,v=py-LCY,t=(2*u+v)/SQ5,s=(-u+2*v)/SQ5;
  if(Math.abs(t-RTB)>440)return false;
  if(Math.hypot(u,v)<62)return false;  // palace stays clear
  return Math.abs(s-RS-rWIG(t))<rHW(t);
}
function superDist(u,v,A,B){           // signed distance to wobbly iso "rounded square"
  u=Math.abs(u)/A; v=Math.abs(v)/B;
  var m=Math.max(u,v),n=Math.min(u,v);
  if(m<1)return (m-1)*Math.min(n,1-m);
  var dx=u>=v?u-1:0,dy=v>u?v-1:0;
  return Math.hypot(dx,dy)*(Math.min(A,B)+0.5*(Math.max(A,B)-Math.min(A,B)));
}
function landDist(px,py){
  var d=superDist(px-LCX,py-LCY,ILX,ILY);
  var wob=9*Math.sin(px/87+.7)*Math.sin(py/63+2.1)+5*Math.sin(px/41+4)*Math.sin(py/97+1.3);
  return d-wob;
}
/* collision mask = island silhouette incl sand band, 406x220 alpha PNG */
var MSK_W=406,MSK_H=220,maskData=null;
function maskAt(mx,my){
  if(!maskData)return landDist(mx,my)<=0;
  var ii=clamp(Math.floor(mx*MSK_W/MW),0,MSK_W-1);
  var jj=clamp(Math.floor(my*MSK_H/MH),0,MSK_H-1);
  return maskData[jj*MSK_W+ii]>127;
}
function isBuildable(mx,my){return maskAt(mx,my)&&!inRiver(mx,my);}

/* ---------- economy ---------- */
var NAMES=["Starting Island","Coastal Village","Forest Island","River Island","Mountain Island","Mining Island","Industrial Island","Large Settlement","Developed Island","Major City Island","Industrial Region","Advanced Island","Megacity Island","Advanced Civilization","Final Island"];
var HELP_NAMES=["Basic Helper","Worker","Machine","Automated Unit","Network Node","Processing Core","Advanced Core","AI Node","Mega System","Planetary System"];
var S_=function(n){return Math.pow(3.049,n-1);};
var gdpOf=function(n){return n===15?6e12:Math.round(1e6*S_(n));};
var houseCap=function(L){return L>0?5000*Math.pow(3,L-1):0;};
var helpCap=function(L,S){return L>0?10*Math.pow(3.2,L-1)*S:0;};
var houseCost=function(L,S){return Math.ceil(800*Math.pow(4.5,L)*S);};
var helpCost=function(L,S){return Math.ceil(100*Math.pow(4,L)*S);};
var resCost=function(L,S,k){return Math.ceil((k===0?250:300)*Math.pow(2.5,L)*S);};
function fmt(n){
  n=Math.floor(n);
  if(n<100000)return n.toLocaleString('en-US');
  var U=[[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K']];
  for(var i=0;i<U.length;i++){
    if(n>=U[i][0]){var x=n/U[i][0];return (x<10?x.toFixed(2):(x<100?x.toFixed(1):x.toFixed(0)))+U[i][1];}
  }
  return String(n);
}
function fmtRate(r){return r<100?(Math.round(r*10)/10).toFixed(1):fmt(Math.floor(r));}

var G={island:1,coins:0,adepts:0,transit:0,housing:[1,0,0,0],helpers:[1,0,0,0],research:[0,0],
       gdpStart:gdpOf(1),gdpLeft:gdpOf(1),boats:[],runners:[],shopCount:0,complete:false,lastRate:0};
function H_total(){var a=0;for(var i=0;i<4;i++)a+=houseCap(G.housing[i]);return a;}
function helperCapTotal(){var a=0,S=S_(G.island);for(var i=0;i<4;i++)a+=helpCap(G.helpers[i],S);return a;}
function breedRate(){return 0.01*(1+0.10*G.research[1]);}
function grossRate(){return G.adepts*0.05*S_(G.island)*(1+0.10*G.research[0]);}
function natives(){return Math.ceil(10000*Math.pow(2,G.island-1)*(G.gdpLeft/G.gdpStart));}
function hintTxt(){
  var H=H_total();
  if(G.adepts<1)return "Tap SEND BOAT to bring adepts to the island";
  if(G.adepts>=0.97*H)return "Housing is full - build more housing";
  if(grossRate()>helperCapTotal())return "Helpers are the bottleneck - buy System Helpers";
  return "Adepts are the bottleneck - send boats and let them breed";
}
function affordable(){
  var S=S_(G.island);
  for(var i=0;i<4;i++){
    if(G.housing[i]<10&&G.coins>=houseCost(G.housing[i],S))return true;
    if(G.helpers[i]<10&&G.coins>=helpCost(G.helpers[i],S))return true;
  }
  for(var k=0;k<2;k++)if(G.research[k]<25&&G.coins>=resCost(G.research[k],S,k))return true;
  return false;
}

/* ---------- layout & camera ---------- */
var game=$('game'),world=$('world'),cv=$('cv'),ctx=cv.getContext('2d');
var wrap=$('islandWrap'),mapImg=$('mapImg');
var vw=0,vh=0,dpr=Math.min(window.devicePixelRatio||1,2);
var margin=0,zoom=1,camX=0,camY=0,camTX=0,camTY=0,imgW=0,imgH=0,ox=0,oy=0,whCss=0;
mapImg.src=ASSETS.map;
var oxL=0, oyT=0;   // island offset inside world (css px)
function relayout(){
  vw=game.clientWidth; vh=game.clientHeight;
  imgW=clamp(1.7*vw,760,(vh-260)*MW/MH);
  imgH=imgW*MH/MW;
  margin=Math.max(0.35*vw,150);
  var ww=imgW+2*margin;
  whCss=Math.max(imgH+2*margin*0.6,imgH+240);
  world.style.width=ww+'px'; world.style.height=whCss+'px';
  oxL=margin; oyT=(whCss-imgH)/2;
  wrap.style.left=oxL+'px'; wrap.style.top=oyT+'px';
  wrap.style.width=imgW+'px'; wrap.style.height=imgH+'px';
  svg.setAttribute('viewBox','0 0 '+MW+' '+MH);
  cv.width=Math.round(ww*dpr); cv.height=Math.round(whCss*dpr);
  cv.style.width=ww+'px'; cv.style.height=whCss+'px';
  $('londonLbl').style.left=(LCX/MW*100)+'%';
  $('londonLbl').style.top=((LCY+50)/MH*100)+'%';
  applyCam();
}
function applyCam(){
  var tx=vw/2-camX*zoom, ty=vh/2-camY*zoom;
  tx=Math.min(tx,0); tx=Math.max(tx,vw-world.offsetWidth*zoom);
  ty=Math.min(ty,0); ty=Math.max(ty,vh-whCss*zoom);
  camTX=tx; camTY=ty;
  world.style.transform='translate('+tx+'px,'+ty+'px) scale('+zoom+')';
}
function setZoom(z,cxClient,cyClient){
  z=clamp(z,1,2.2); if(Math.abs(z-zoom)<1e-4)return;
  var wx=(cxClient-camTX)/zoom, wy=(cyClient-camTY)/zoom;
  zoom=z;
  camX=wx-(cxClient-vw/2)/zoom; camY=wy-(cyClient-vh/2)/zoom;
  applyCam();
}
function centerOnLondon(){camX=oxL+LCX/imgW*MW*0+ (oxL+LCX*(imgW/MW)); camY=oyT+LCY*(imgH/MH); applyCam();}
/* canvas transform: world css px -> canvas px, with y-squash so sprites stay upright */
function setTx(){
  var s=dpr*zoom, sq=(MH/imgH)*(imgW/MW);
  ctx.setTransform(s,0,0,s*sq,-oxL*s,-oyT*s+LCY*(1-sq)*s);
}
function mx2wx(mx){return oxL+mx*(imgW/MW);}
function my2wy(my){return oyT+my*(imgH/MH);}

/* ---------- images ---------- */
var IMG={},mirCache={};
Object.keys(ASSETS).forEach(function(k){var im=new Image();im.src=ASSETS[k];IMG[k]=im;});
IMG.mask.onload=function(){
  var c=document.createElement('canvas');c.width=MSK_W;c.height=MSK_H;
  var g=c.getContext('2d',{willReadFrequently:true});g.drawImage(IMG.mask,0,0);
  maskData=g.getImageData(0,0,MSK_W,MSK_H).data;
};
function mirrorCanvas(im,key){
  if(mirCache[key])return mirCache[key];
  var c=document.createElement('canvas');c.width=im.width;c.height=im.height;
  var g=c.getContext('2d');g.translate(im.width,0);g.scale(-1,1);g.drawImage(im,0,0);
  mirCache[key]=c;return c;
}
