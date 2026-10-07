
/* ---------- sprite drawing (canvas) ---------- */
function boatSprite(b){
  var key=(b.d[1]<0)?'boatNE':'boatNW';   // bow up-right / bow up-left picture
  var mir=(key==='boatNE')?(b.d[0]<0):(b.d[0]>0);
  var im=IMG[key];
  return mir?mirrorCanvas(im,key+'M'):im;
}
function drawBoat(b,sc,alpha){
  var c=boatSprite(b); if(!c||!c.width)return;
  var w=c.width*sc,h=c.height*sc;
  var bobY=(b.state==='sail')?Math.sin(b.bob)*1.3:0;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.drawImage(c,b.xcur-w/2,b.ycur-h+8*sc+bobY,w,h);
  ctx.restore();
}
function drawCrewIn(b,sc,alpha,n){
  var im=IMG.crew;if(!n||!im||!im.width)return;
  var cw=im.width*sc,ch=im.height*sc;
  var per=[[-14,-16],[0,-19],[14,-16],[-7,-25]];
  var bobY=(b.state==='sail')?Math.sin(b.bob)*1.3:0;
  ctx.save();ctx.globalAlpha=alpha;
  for(var i=0;i<n&&i<4;i++){
    var px=b.xcur+per[i][0]*sc,py=b.ycur+per[i][1]*sc+bobY+Math.sin(b.bob+i*1.7)*0.9;
    ctx.drawImage(im,px-cw/2,py-ch,cw,ch);
  }
  ctx.restore();
}
function drawTube(b,sc,alpha){
  var c=boatSprite(b);if(!c||!c.width)return;
  var sx=(c.width*0.48)|0,sy=(c.height*0.42)|0;
  var sw=c.width-sx,sh=c.height-sy;
  var w=c.width*sc,h=c.height*sc;
  var bx=b.xcur-w/2,by=b.ycur-h+8*sc;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.drawImage(c,sx,sy,sw,sh,bx+sx*sc,by+sy*sc,sw*sc,sh*sc);
  ctx.restore();
}
function drawWake(b,sc,alpha){
  if(b.state!=='sail')return;
  ctx.save();ctx.globalAlpha=alpha*0.45;ctx.fillStyle='#ffffff';
  for(var k=1;k<=6;k++){
    var wx=b.xcur-b.d[0]*(16+k*12),wy=b.ycur-b.d[1]*(16+k*12)+7;
    ctx.beginPath();ctx.arc(wx,wy,(6.5-k*0.7)*sc,0,6.283);ctx.fill();
  }
  ctx.restore();
}
function drawRunner(r,sc,alpha){
  var dy=r.ty-r.y;
  var base=(dy<-1.5)?'adB':'adF';                 // facing away when running up-screen
  var ph=((Math.floor(r.hop)%2===0)?'a':'b');
  var key=base+ph,im=IMG[key];if(!im||!im.width)return;
  var left=(r.tx-r.x)<-1;
  var c=left?mirrorCanvas(im,key+'M'):im;
  var w=c.width*sc,hh=c.height*sc;
  var hopY=-Math.abs(Math.sin(r.hop))*2.6;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.drawImage(c,r.x-w/2,r.y-hh+5+hopY,w,hh);
  ctx.restore();
}

/* ---------- UI helpers ---------- */
function toast(msg){var t=$('toast');t.textContent=msg;t.style.opacity=1;
  clearTimeout(toast._tm);toast._tm=setTimeout(function(){t.style.opacity=0;},1800);}
var lastHint='';
function refreshHint(){
  var h=hintTxt();
  if(h!==lastHint){lastHint=h;var el=$('hint');el.textContent=h;el.style.opacity=1;
    clearTimeout(refreshHint._tm);refreshHint._tm=setTimeout(function(){el.style.opacity=0;},3000);}
}
function setRing(pct){$('ring').style.background='conic-gradient(#3ec93e '+(pct*360).toFixed(1)+'deg,#e3ecf5 0deg)';}
var storeTab='housing',sheetOpen=null;
function capStr(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function openSheet(name){
  closeSheets();sheetOpen=name;
  $('scrim'+capStr(name)).classList.add('on');
  $(name+'Sheet').classList.add('on');
  if(name==='store')renderStore();
  if(name==='info')renderInfo();
}
function closeSheets(){
  ['store','info','set'].forEach(function(n){
    $('scrim'+capStr(n)).classList.remove('on');
    $(n+'Sheet').classList.remove('on');});
  sheetOpen=null;
}
function coinImgHtml(){return '<img src="'+ASSETS.coin+'" alt="">';}
function buyBtn(label,off,id){
  return '<button class="buy'+(off?' off':'')+'"'+(id?(' id="'+id+'"'):'')+'>'+label+'</button>';
}
function rnSlot(i){return ['I','II','III','IV'][i];}
function renderStore(){
  var S=S_(G.island),html='',i;
  if(storeTab==='housing'){
    for(i=0;i<4;i++){
      var L=G.housing[i],maxed=L>=10,cost=maxed?0:houseCost(L,S);
      var cur=houseCap(L),nxt=houseCap(maxed?L:L+1);
      html+='<div class="row"><div class="ricon">&#127968;</div><div class="rmain">'+
        '<div class="rname">Housing '+rnSlot(i)+'</div>'+
        '<div class="rdesc">Holds '+fmt(cur)+' adepts'+(maxed?'':' -> '+fmt(nxt))+'</div>'+
        '<div class="rlvl">Level '+L+'/10</div></div>'+
        buyBtn(maxed?'MAX':(coinImgHtml()+fmt(cost)),maxed||G.coins<cost,maxed?'':'hb'+i)+'</div>';
    }
  }else if(storeTab==='helpers'){
    for(i=0;i<4;i++){
      var L2=G.helpers[i],maxed2=L2>=10,cost2=maxed2?0:helpCost(L2,S);
      var cur2=helpCap(L2,S),nxt2=helpCap(maxed2?L2:L2+1,S);
      var nm2=L2>0?HELP_NAMES[L2-1]:('System slot '+rnSlot(i));
      html+='<div class="row"><div class="ricon">&#9881;&#65039;</div><div class="rmain">'+
        '<div class="rname">'+nm2+'</div>'+
        '<div class="rdesc">Mines up to '+fmtRate(cur2)+' coins/sec'+(maxed2?'':' -> '+fmtRate(nxt2))+'</div>'+
        '<div class="rlvl">Level '+L2+'/10</div></div>'+
        buyBtn(maxed2?'MAX':(coinImgHtml()+fmt(cost2)),maxed2||G.coins<cost2,maxed2?'':'sb'+i)+'</div>';
    }
  }else{
    var rnames=['Efficient Training','Midwifery'],icons=['&#128200;','&#127868;'];
    var rdescs=['+10% adept production per level','+10% breeding per level'];
    for(i=0;i<2;i++){
      var R=G.research[i],m=R>=25,c=m?0:resCost(R,S,i);
      html+='<div class="row"><div class="ricon">'+icons[i]+'</div><div class="rmain">'+
        '<div class="rname">'+rnames[i]+'</div>'+
        '<div class="rdesc">'+rdescs[i]+'</div>'+
        '<div class="rlvl">Level '+R+'/25</div></div>'+
        buyBtn(m?'MAX':(coinImgHtml()+fmt(c)),m||G.coins<c,m?'':'rb'+i)+'</div>';
    }
  }
  $('storeBody').innerHTML=html;
  bindStoreButtons();
}
function renderInfo(){
  var pct=G.gdpStart>0?G.gdpLeft/G.gdpStart:0;
  var gross=grossRate(),hc=helperCapTotal(),rate=Math.min(gross,hc);
  var html='';
  html+='<div class="dline"><span class="dlabel">GDP remaining ('+NAMES[G.island-1]+')</span><b>'+fmt(G.gdpLeft)+' / '+fmt(G.gdpStart)+'</b></div>';
  html+='<div id="gdpBigBar"><div id="gdpBigFill" style="width:'+(pct*100).toFixed(2)+'%"></div></div>';
  html+='<div class="dline"><span class="dlabel">Extraction</span><b>'+fmtRate(rate)+' GDP/sec</b></div>';
  html+='<div class="dline"><span class="dlabel">Adepts / housing</span><b>'+fmt(Math.floor(G.adepts))+' / '+fmt(H_total())+'</b></div>';
  html+='<div class="dline"><span class="dlabel">Adept production</span><b>'+fmtRate(gross)+' /sec potential</b></div>';
  html+='<div class="dline"><span class="dlabel">Helper capacity</span><b>'+fmtRate(hc)+' /sec</b></div>';
  html+='<div class="dline"><span class="dlabel">Natives left</span><b>'+fmt(natives())+'</b></div>';
  html+='<div class="dline"><span class="dlabel">Tip</span><b style="font-size:12px;color:#8a00c9">'+hintTxt()+'</b></div>';
  $('infoBody').innerHTML=html;
}
function bindBuy(id,fn){var e=$(id);if(e)e.onclick=function(){fn();};}
function bindStoreButtons(){
  for(var i=0;i<4;i++){
    bindBuy('hb'+i,(function(ii){return function(){doBuyHousing(ii);};})(i));
    bindBuy('sb'+i,(function(ii){return function(){doBuyHelper(ii);};})(i));}
  bindBuy('rb0',function(){doBuyRes(0);});
  bindBuy('rb1',function(){doBuyRes(1);});
}
function doBuyHousing(i){
  var S=S_(G.island),L=G.housing[i];if(L>=10)return;
  var c=houseCost(L,S);if(G.coins<c){toast('Not enough coins');return;}
  G.coins-=c;G.housing[i]=L+1;addShop();updateUI();
}
function doBuyHelper(i){
  var S=S_(G.island),L=G.helpers[i];if(L>=10)return;
  var c=helpCost(L,S);if(G.coins<c){toast('Not enough coins');return;}
  G.coins-=c;G.helpers[i]=L+1;updateUI();
}
function doBuyRes(k){
  var S=S_(G.island),R=G.research[k];if(R>=25)return;
  var c=resCost(R,S,k);if(G.coins<c){toast('Not enough coins');return;}
  G.coins-=c;G.research[k]=R+1;updateUI();
}
function updateUI(){
  var pct=G.gdpStart>0?clamp(G.gdpLeft/G.gdpStart,0,1):0;
  setRing(pct);
  $('ringPct').textContent=Math.ceil(pct*100)+'%';
  $('adCnt').textContent=fmt(Math.floor(G.adepts));
  $('coins').textContent=fmt(G.coins);
  $('rate').textContent=fmtRate(G.lastRate)+' /SEC';
  $('natCnt').textContent=fmt(natives());
  var H=H_total();
  $('capTxt').textContent=fmt(Math.floor(G.adepts))+' / '+fmt(H);
  $('capFill').style.width=clamp(H>0?G.adepts/H*100:0,0,100)+'%';
  $('islPill').textContent='ISLAND '+G.island;
  $('dotRed').style.display=affordable()?'block':'none';
  $('sCoins').textContent=fmt(G.coins);
  if(sheetOpen==='store')renderStore();
  else if(sheetOpen==='info')renderInfo();
  refreshHint();
}

/* ---------- main loop ---------- */
var lastTs=0,uiT=0;
function tick(dt){
  if(!G.complete){
    var H=H_total();
    if(H>0)G.adepts+=G.adepts*breedRate()*(1-G.adepts/H)*dt;
    var rate=Math.min(grossRate(),helperCapTotal());
    G.lastRate=rate;
    var mined=Math.min(rate*dt,G.gdpLeft);
    G.gdpLeft-=mined;G.coins+=mined;
    if(G.gdpLeft<=0.5){G.gdpLeft=0;G.complete=true;showCard();}
  }
  updateEntities(dt);
}
function drawScene(){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,cv.width,cv.height);
  var sc=imgW/MW,i;
  setTx();
  for(i=0;i<G.boats.length;i++)drawWake(G.boats[i],sc,G.boats[i].alpha);
  var items=[];
  for(i=0;i<G.boats.length;i++)items.push({y:G.boats[i].ycur,t:0,o:G.boats[i]});
  for(i=0;i<G.runners.length;i++)items.push({y:G.runners[i].y,t:1,o:G.runners[i]});
  items.sort(function(a,b){return a.y-b.y;});
  for(i=0;i<items.length;i++){
    var it=items[i];
    if(it.t===0){var b=it.o,left=Math.max(0,Math.min(b.load-b.dropped,4));
      drawBoat(b,sc,b.alpha);drawCrewIn(b,sc,b.alpha,left);drawTube(b,sc,b.alpha);}
    else drawRunner(it.o,sc,1);
  }
}
function frame(ts){
  var dt=Math.min((ts-lastTs)/1000,0.05);lastTs=ts;
  tick(dt);drawScene();
  if(ts-uiT>200){uiT=ts;updateUI();}
  requestAnimationFrame(frame);
}

/* ---------- island completion ---------- */
function showCard(){
  $('card').style.display='flex';
  if(G.island>=15){
    $('cardTitle').textContent='All 15 islands mined!';
    $('cardSub').textContent='You drained every last coin of GDP from the archipelago.';
    $('cardBtn').textContent='PLAY AGAIN';
  }else{
    $('cardTitle').textContent='Island '+G.island+' complete!';
    $('cardSub').textContent=NAMES[G.island-1]+' is empty. Next stop: '+NAMES[G.island]+'.';
    $('cardBtn').textContent='NEXT ISLAND';
  }
}
function nextIsland(){
  if(G.island>=15)G.island=1;else G.island++;
  G.coins=0;G.adepts=0;G.transit=0;G.housing=[1,0,0,0];G.helpers=[1,0,0,0];G.research=[0,0];
  G.gdpStart=gdpOf(G.island);G.gdpLeft=G.gdpStart;
  G.boats=[];G.runners=[];G.complete=false;G.lastRate=0;
  shopDefs.forEach(function(s){s.el.remove();});shopDefs=[];G.shopCount=0;addShop();
  $('card').style.display='none';
  zoom=1;centerOnLondon();updateUI();
}

/* ---------- input ---------- */
function initInput(){
  var pts={},gesture=null,pinchD=0,pinchZ=1,lastX=0,lastY=0;
  function ids(){return Object.keys(pts);}
  game.addEventListener('pointerdown',function(e){
    pts[e.pointerId]={x:e.clientX,y:e.clientY};
    var n=ids().length;
    if(n===1){gesture='pan';lastX=e.clientX;lastY=e.clientY;}
    else if(n===2){gesture='pinch';
      var a=pts[ids()[0]],b=pts[ids()[1]];
      pinchD=Math.hypot(a.x-b.x,a.y-b.y);pinchZ=zoom;}
  });
  window.addEventListener('pointermove',function(e){
    if(!(e.pointerId in pts))return;
    pts[e.pointerId]={x:e.clientX,y:e.clientY};
    if(gesture==='pan'){
      var dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
      camX-=dx/zoom;camY-=dy/zoom;applyCam();
    }else if(gesture==='pinch'&&ids().length>=2){
      var a=pts[ids()[0]],b=pts[ids()[1]];
      var d=Math.hypot(a.x-b.x,a.y-b.y);
      setZoom(pinchZ*d/Math.max(1,pinchD),(a.x+b.x)/2,(a.y+b.y)/2);
    }
  });
  window.addEventListener('pointerup',function(e){
    delete pts[e.pointerId];
    if(ids().length===0)gesture=null;
    else if(ids().length===1){gesture='pan';var p=pts[ids()[0]];lastX=p.x;lastY=p.y;}
  });
  window.addEventListener('pointercancel',function(e){
    delete pts[e.pointerId];if(ids().length===0)gesture=null;});
  game.addEventListener('wheel',function(e){
    e.preventDefault();
    setZoom(zoom*(e.deltaY<0?1.12:1/1.12),e.clientX,e.clientY);
  },{passive:false});
  $('zin').onclick=function(){setZoom(zoom*1.25,vw/2,vh/2);};
  $('zout').onclick=function(){setZoom(zoom/1.25,vw/2,vh/2);};
  window.addEventListener('keydown',function(e){
    var st=30/zoom;
    if(e.key==='ArrowLeft')camX-=st;
    else if(e.key==='ArrowRight')camX+=st;
    else if(e.key==='ArrowUp')camY-=st;
    else if(e.key==='ArrowDown')camY+=st;
    else if(e.key==='+'||e.key==='=')setZoom(zoom*1.2,vw/2,vh/2);
    else if(e.key==='-'||e.key==='_')setZoom(zoom/1.2,vw/2,vh/2);
    else return;
    applyCam();
  });
  $('sendBtn').addEventListener('click',function(){sendBoat();});
  $('storeBtn').onclick=function(){openSheet('store');};
  $('menuBtn').onclick=function(){openSheet('set');};
  $('ringWrap').onclick=function(){openSheet('info');};
  Array.prototype.forEach.call(document.querySelectorAll('[data-close]'),function(btn){
    btn.onclick=closeSheets;});
  Array.prototype.forEach.call(document.querySelectorAll('.scrim'),function(sc){sc.onclick=closeSheets;});
  Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(tb){
    tb.onclick=function(){
      Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(o){o.classList.remove('sel');});
      tb.classList.add('sel');storeTab=tb.getAttribute('data-tab');renderStore();};});
  $('cardBtn').onclick=nextIsland;
}

/* ---------- boot ---------- */
function boot(){
  $('adIcon').src=ASSETS.adFa;
  $('coinIcon').src=ASSETS.coin;
  $('coinIcon2').src=ASSETS.coin;
  relayout();
  buildPalace();buildBridge();addShop();
  centerOnLondon();
  initInput();
  var dots=$('dots'),dctx=dots.getContext('2d');
  function drawDots(){
    dots.width=vw;dots.height=vh;
    dctx.fillStyle='rgba(255,255,255,.5)';
    for(var y=12;y<vh;y+=26)for(var x=((Math.round(y/26)%2)?13:0);x<vw;x+=26){
      dctx.beginPath();dctx.arc(x,y,1.1,0,6.283);dctx.fill();}
  }
  drawDots();
  window.addEventListener('resize',function(){relayout();drawDots();});
  updateUI();
  lastTs=performance.now();
  requestAnimationFrame(frame);
}
boot();
