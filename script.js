/* RT GAMING STUDIO — site logic + game registry */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const rnd=n=>Math.floor(Math.random()*n),wait=ms=>new Promise(r=>setTimeout(r,ms));
/* ---------- Safe storage ---------- */
let mem={};const KEY='rtgs';
const load=()=>{try{return Object.assign({plays:{},best:{},wins:0,recent:[]},JSON.parse(localStorage.getItem(KEY))||mem)}catch(e){return Object.assign({plays:{},best:{},wins:0,recent:[]},mem)}};
const save=s=>{mem=s;try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}};
function rec(id,type,n){const s=load();
 if(type==='play'){s.plays[id]=(s.plays[id]||0)+1;s.recent=[id,...s.recent.filter(x=>x!==id)].slice(0,5)}
 if(type==='win')s.wins++;if(type==='score'&&n>(s.best[id]||0))s.best[id]=n;save(s)}

/* ---------- GAME 1: Candy Match (8x8) ---------- */
function m3(el,api){let g,sel=-1,moves,score,busy,dead=false;const T=1000,C=['🍓','🍊','🍋','🍏','🫐','🍇'],r=()=>rnd(6);
 el.innerHTML='<p class="status"></p><div class="m3"></div>';const st=$('.status',el),bd=$('.m3',el);
 const find=()=>{const s=new Set();for(let i=0;i<64;i++){const x=i%8,y=i>>3;
  if(x<6&&g[i]===g[i+1]&&g[i]===g[i+2])[i,i+1,i+2].forEach(k=>s.add(k));
  if(y<6&&g[i]===g[i+8]&&g[i]===g[i+16])[i,i+8,i+16].forEach(k=>s.add(k))}return s};
 const sw=(a,b)=>{[g[a],g[b]]=[g[b],g[a]]};
 const hasMove=()=>{for(let i=0;i<64;i++)for(const j of[i+1,i+8]){if(j>63||(j===i+1&&i%8===7))continue;sw(i,j);const f=find().size;sw(i,j);if(f)return true}return false};
 const draw=msg=>{bd.innerHTML=g.map((v,i)=>`<button class="c${i===sel?' on':''}" data-i="${i}" aria-label="Candy ${i+1}">${v<0?'':C[v]}</button>`).join('');
  st.textContent=msg||`Score ${score}/${T} · Moves left ${moves}`};
 async function settle(){let m,k=1;while((m=find()).size){score+=m.size*10*k++;m.forEach(i=>g[i]=-1);draw();api.score(score);await wait(220);if(dead)return;
  for(let x=0;x<8;x++){const col=[];for(let y=7;y>=0;y--)if(g[y*8+x]>=0)col.push(g[y*8+x]);for(let y=7;y>=0;y--)g[y*8+x]=col[7-y]??r()}
  draw();await wait(220);if(dead)return}
  if(score>=T){draw(`🎉 You win! Score ${score}`);api.win();return}
  if(moves<=0){draw(`Game over — score ${score}. Press Restart.`);return}
  while(!hasMove()){g=Array.from({length:64},r);while(find().size)g=Array.from({length:64},r)}
  busy=false;draw()}
 const init=()=>{score=0;moves=20;busy=false;sel=-1;do g=Array.from({length:64},r);while(find().size||!hasMove());draw()};
 bd.onclick=e=>{const b=e.target.closest('.c');if(!b||busy)return;const i=+b.dataset.i;
  if(sel<0){sel=i;draw();return}
  const d=Math.abs(i-sel);if(d===8||(d===1&&(i>>3)===(sel>>3))){sw(i,sel);if(!find().size){sw(i,sel);sel=-1;draw('No match — swap undone. Try another!');return}
   sel=-1;moves--;busy=true;settle()}else{sel=i;draw()}};
 init();return{stop(){dead=true}}}

/* ---------- GAME 2: Snakes & Ladders ---------- */
function sl(el,api){const J={4:14,9:31,20:38,28:84,40:59,51:67,63:81,71:91,17:7,54:34,62:19,64:60,87:24,93:73,95:75,99:78};
 let pos=[1,1],t=0,busy=false,dead=false;
 el.innerHTML='<p class="status"></p><div class="sl"></div><div class="row"><span class="die">🎲</span><button class="btn">Roll dice</button></div>';
 const st=$('.status',el),bd=$('.sl',el),die=$('.die',el);
 const draw=()=>{let h='';for(let r=9;r>=0;r--)for(let c=0;c<10;c++){const n=r*10+(r%2?9-c:c)+1,j=J[n];
  h+=`<div class="sq${j?(j>n?' lad':' snk'):''}"><b>${n}</b>${j?(j>n?'🪜':'🐍')+'<small>'+j+'</small>':''}<span class="tk">${pos[0]===n?'<i class="p0"></i>':''}${pos[1]===n?'<i class="p1"></i>':''}</span></div>`}
  bd.innerHTML=h;st.textContent=`Player ${t+1} (${t?'blue':'red'}) — roll!`};
 $('.btn',el).onclick=async()=>{if(busy)return;busy=true;
  for(let i=0;i<8;i++){die.textContent=1+rnd(6);await wait(70);if(dead)return}
  const d=1+rnd(6);die.textContent=d;
  if(pos[t]+d<=100){for(let i=0;i<d;i++){pos[t]++;draw();await wait(180);if(dead)return}
   if(J[pos[t]]){await wait(300);pos[t]=J[pos[t]];draw()}}
  if(pos[t]===100){st.textContent=`🎉 Player ${t+1} wins!`;if(t===0)api.win();return}
  t=1-t;draw();busy=false};
 draw();return{stop(){dead=true}}}

/* ---------- GAME 3: SnakeBite ---------- */
function snake(el,api){const N=20,S=20,V={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0]},KM={ArrowUp:'U',w:'U',ArrowDown:'D',s:'D',ArrowLeft:'L',a:'L',ArrowRight:'R',d:'R'};
 el.innerHTML='<p class="status"></p><canvas class="cv" width="400" height="400"></canvas><div class="dpad"><button data-d="U" aria-label="Up">▲</button><button data-d="L" aria-label="Left">◀</button><button data-d="D" aria-label="Down">▼</button><button data-d="R" aria-label="Right">▶</button></div>';
 const cv=$('canvas',el),x=cv.getContext('2d'),st=$('.status',el);let s,d,nd,f,sc,run,over,iv;
 const food=()=>{do f=[rnd(N),rnd(N)];while(s.some(p=>p[0]===f[0]&&p[1]===f[1]))};
 const turn=k=>{if(k&&!(V[k][0]+V[d][0]===0&&V[k][1]+V[d][1]===0))nd=k};
 const draw=()=>{x.fillStyle='#F8FAFF';x.fillRect(0,0,400,400);x.fillStyle='#FF7B72';x.beginPath();x.arc(f[0]*S+10,f[1]*S+10,8,0,7);x.fill();
  s.forEach((p,i)=>{x.fillStyle=i?'#7657F6':'#4B8BFF';x.fillRect(p[0]*S+1,p[1]*S+1,S-2,S-2)});
  st.textContent=over?`Game over — score ${sc}`:`Score ${sc} · Best ${load().best.snake||0}${run?'':' · Paused'}`};
 const tick=()=>{if(!run)return;d=nd;const h=[s[0][0]+V[d][0],s[0][1]+V[d][1]];
  if(h[0]<0||h[1]<0||h[0]>=N||h[1]>=N||s.some(p=>p[0]===h[0]&&p[1]===h[1])){over=true;run=false;clearInterval(iv);api.score(sc);draw();return}
  s.unshift(h);if(h[0]===f[0]&&h[1]===f[1]){sc+=10;food();api.score(sc)}else s.pop();draw()};
 const key=e=>{const k=KM[e.key]||KM[e.key.toLowerCase()];if(k){e.preventDefault();turn(k)}};
 $('.dpad',el).onclick=e=>{if(e.target.dataset.d)turn(e.target.dataset.d)};
 s=[[10,10],[9,10],[8,10]];d=nd='R';sc=0;over=false;run=true;food();draw();iv=setInterval(tick,110);document.addEventListener('keydown',key);
 return{pause(){if(!over){run=!run;draw()}},stop(){clearInterval(iv);document.removeEventListener('keydown',key)}}}

/* ---------- GAME 4: Tic-Tac-Toe ---------- */
function ttt(el,api){let b,turn,over,msg,sc={X:0,O:0,D:0},dead=false;
 el.innerHTML='<div class="row"><select aria-label="Mode"><option value="ai">vs Computer</option><option value="pvp">2 Players</option></select><select aria-label="Difficulty"><option value="hard">Hard</option><option value="easy">Easy</option></select><button class="btn ghost">Reset scores</button></div><p class="status"></p><div class="ttt"></div><p class="sub"></p>';
 const [mode,dif]=$$('select',el),L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 const win=b=>L.find(l=>b[l[0]]&&b[l[0]]===b[l[1]]&&b[l[0]]===b[l[2]]);
 const mm=(b,p)=>{const w=win(b);if(w)return b[w[0]]==='O'?1:-1;if(b.every(Boolean))return 0;let best=p==='O'?-2:2;
  b.forEach((v,i)=>{if(!v){b[i]=p;const r=mm(b,p==='O'?'X':'O');b[i]='';best=p==='O'?Math.max(best,r):Math.min(best,r)}});return best};
 const draw=()=>{const w=win(b);$('.ttt',el).innerHTML=b.map((v,i)=>`<button data-i="${i}" class="${v}${w&&w.includes(i)?' win':''}" aria-label="Cell ${i+1} ${v}">${v}</button>`).join('');
  $('.sub',el).textContent=`X: ${sc.X} · O: ${sc.O} · Draws: ${sc.D}`;$('.status',el).textContent=over?msg:`${turn}'s turn`};
 const play=i=>{if(over||b[i])return;b[i]=turn;
  if(win(b)){over=true;sc[turn]++;msg=`${turn} wins!`;if(turn==='X'||mode.value==='pvp')api.win()}
  else if(b.every(Boolean)){over=true;sc.D++;msg="It's a draw!"}else turn=turn==='X'?'O':'X';
  draw();if(!over&&mode.value==='ai'&&turn==='O')setTimeout(()=>{if(dead||over)return;const e=b.map((v,i)=>v?-1:i).filter(i=>i>=0);let mv=e[rnd(e.length)];
   if(dif.value==='hard'){let bs=-2;e.forEach(i=>{b[i]='O';const v=mm(b,'X');b[i]='';if(v>bs){bs=v;mv=i}})}play(mv)},350)};
 const reset=()=>{b=Array(9).fill('');turn='X';over=false;draw()};
 $('.ttt',el).onclick=e=>{const i=e.target.dataset.i;if(i!=null&&!(mode.value==='ai'&&turn==='O'))play(+i)};
 mode.onchange=dif.onchange=reset;$('.btn',el).onclick=()=>{sc={X:0,O:0,D:0};reset()};reset();return{stop(){dead=true}}}

/* ---------- GAME 5: Tetris ---------- */
function tetris(el,api){const W=10,H=20,B=24,P={I:[[1,1,1,1]],O:[[1,1],[1,1]],T:[[0,1,0],[1,1,1]],S:[[0,1,1],[1,1,0]],Z:[[1,1,0],[0,1,1]],J:[[1,0,0],[1,1,1]],L:[[0,0,1],[1,1,1]]},
 CL={I:'#4B8BFF',O:'#FFD76A',T:'#7657F6',S:'#8BE3C2',Z:'#FF7B72',J:'#5b6cff',L:'#ff9f5a'},K=Object.keys(P);
 el.innerHTML='<p class="status"></p><div class="row c"><canvas class="cv" width="240" height="480" style="width:min(240px,60vw)"></canvas><canvas class="cv" width="96" height="96" aria-label="Next piece"></canvas></div><div class="dpad"><button data-a="l" aria-label="Left">◀</button><button data-a="r" aria-label="Right">▶</button><button data-a="rot" aria-label="Rotate">⟳</button><button data-a="d" aria-label="Soft drop">▼</button><button data-a="h" aria-label="Hard drop">⤓</button></div>';
 const [cv,nv]=$$('canvas',el),x=cv.getContext('2d'),nx=nv.getContext('2d'),st=$('.status',el);
 let grid,cur,next,score,lines,level,over,paused,raf,last,acc,dead=false;
 const rot=m=>m[0].map((_,i)=>m.map(r=>r[i]).reverse());
 const hit=(m,px,py)=>m.some((r,j)=>r.some((v,i)=>v&&(px+i<0||px+i>=W||py+j>=H||(py+j>=0&&grid[py+j][px+i]))));
 const mk=k=>({k,m:P[k],x:3,y:0}),bag=()=>K[rnd(7)];
 const spawn=()=>{cur=next||mk(bag());next=mk(bag());if(hit(cur.m,cur.x,cur.y)){over=true;api.score(score)}};
 const lock=()=>{cur.m.forEach((r,j)=>r.forEach((v,i)=>{if(v&&cur.y+j>=0)grid[cur.y+j][cur.x+i]=cur.k}));
  let n=0;grid=grid.filter(r=>!r.every(Boolean));n=H-grid.length;while(grid.length<H)grid.unshift(Array(W).fill(0));
  if(n){lines+=n;score+=[0,100,300,500,800][n]*level;level=1+(lines/10|0)}api.score(score);spawn()};
 const mv=(dx,dy)=>{if(over||paused)return false;if(!hit(cur.m,cur.x+dx,cur.y+dy)){cur.x+=dx;cur.y+=dy;return true}if(dy){lock()}return false};
 const act=a=>{if(over||paused)return;
  if(a==='l')mv(-1,0);if(a==='r')mv(1,0);if(a==='d'){if(mv(0,1))score++}
  if(a==='rot'){const m=rot(cur.m);for(const k of[0,-1,1,-2,2])if(!hit(m,cur.x+k,cur.y)){cur.m=m;cur.x+=k;break}}
  if(a==='h'){while(!hit(cur.m,cur.x,cur.y+1)){cur.y++;score+=2}lock()}draw()};
 const cell=(c,i,j,k,s)=>{c.fillStyle=CL[k];c.fillRect(i*s+1,j*s+1,s-2,s-2)};
 const draw=()=>{x.clearRect(0,0,240,480);grid.forEach((r,j)=>r.forEach((k,i)=>k&&cell(x,i,j,k,B)));
  if(!over)cur.m.forEach((r,j)=>r.forEach((v,i)=>v&&cell(x,cur.x+i,cur.y+j,cur.k,B)));
  nx.clearRect(0,0,96,96);next.m.forEach((r,j)=>r.forEach((v,i)=>v&&cell(nx,i,j,next.k,22)));
  st.textContent=over?`Game over — score ${score}`:`Score ${score} · Level ${level} · Lines ${lines}${paused?' · Paused':''}`};
 const loop=t=>{if(dead)return;raf=requestAnimationFrame(loop);const dt=t-(last||t);last=t;
  if(!paused&&!over){acc+=dt;if(acc>Math.max(100,800-(level-1)*70)){acc=0;mv(0,1);draw()}}};
 const KM={ArrowLeft:'l',ArrowRight:'r',ArrowDown:'d',ArrowUp:'rot',' ':'h'};
 const key=e=>{if(e.key==='p'||e.key==='P'){api_pause();return}const a=KM[e.key];if(a){e.preventDefault();act(a)}};
 const api_pause=()=>{if(!over){paused=!paused;draw()}};
 $('.dpad',el).onclick=e=>{if(e.target.dataset.a)act(e.target.dataset.a)};
 grid=Array.from({length:H},()=>Array(W).fill(0));score=lines=0;level=1;over=paused=false;acc=0;spawn();draw();
 document.addEventListener('keydown',key);raf=requestAnimationFrame(loop);
 return{pause:api_pause,stop(){dead=true;cancelAnimationFrame(raf);document.removeEventListener('keydown',key)}}}

/* ---------- GAME 6: Archery ---------- */
function archery(el,api){const W=480,H=340,TX=370,TY=170,RW=9;
 el.innerHTML='<p class="status"></p><canvas class="cv" width="480" height="340" style="cursor:crosshair"></canvas><button class="btn">🏹 Shoot</button>';
 const cv=$('canvas',el),x=cv.getContext('2d'),st=$('.status',el),btn=$('.btn',el);
 let aim={x:300,y:170},wind,stuck=[],shots=0,total=0,fly=null,raf,dead=false,msg='';
 const newWind=()=>wind=+(Math.random()*6-3).toFixed(1);
 const draw=()=>{const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#bfe0ff');g.addColorStop(1,'#eaf6ff');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='#8BE3C2';x.fillRect(0,285,W,55);
  for(let i=10;i>=1;i--){x.fillStyle=['#fff','#fff','#20213A','#20213A','#4B8BFF','#4B8BFF','#FF7B72','#FF7B72','#FFD76A','#FFD76A'][i-1];x.beginPath();x.arc(TX,TY,i*RW,0,7);x.fill();x.strokeStyle='#999';x.stroke()}
  x.strokeStyle='#20213A';x.lineWidth=3;x.beginPath();x.arc(40,285,40,-1.2,-.2);x.stroke();x.lineWidth=1;
  stuck.forEach(p=>{x.strokeStyle='#8a5a2b';x.lineWidth=2;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x-28,p.y+9);x.stroke();x.fillStyle='#FF7B72';x.beginPath();x.arc(p.x,p.y,3,0,7);x.fill()});x.lineWidth=1;
  if(fly){x.strokeStyle='#8a5a2b';x.lineWidth=3;x.beginPath();x.moveTo(fly.x,fly.y);x.lineTo(fly.x-26,fly.y+8);x.stroke();x.lineWidth=1}
  if(shots<10){x.strokeStyle='#7657F6';x.beginPath();x.arc(aim.x,aim.y,10,0,7);x.moveTo(aim.x-16,aim.y);x.lineTo(aim.x+16,aim.y);x.moveTo(aim.x,aim.y-16);x.lineTo(aim.x,aim.y+16);x.stroke()}
  st.textContent=shots>=10?`Round over! Total ${total} · Best ${load().best.archery||0}`:`Arrow ${shots+1}/10 · Total ${total} · Wind ${Math.abs(wind)} ${wind<0?'◀':'▶'} ${msg}`};
 const shoot=()=>{if(fly||shots>=10)return;const imp={x:aim.x+wind*9,y:aim.y+8},t0=performance.now();
  const step=t=>{if(dead)return;const k=Math.min(1,(t-t0)/500);fly={x:60+(imp.x-60)*k,y:300+(imp.y-300)*k-Math.sin(k*Math.PI)*40};draw();
   if(k<1){raf=requestAnimationFrame(step);return}
   fly=null;stuck.push(imp);const d=Math.hypot(imp.x-TX,imp.y-TY),pts=d>10*RW?0:10-Math.floor(d/RW);total+=pts;shots++;msg=`(+${pts})`;newWind();api.score(total);draw()};
  raf=requestAnimationFrame(step)};
 const pos=e=>{const r=cv.getBoundingClientRect();aim={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};if(!fly)draw()};
 cv.onpointermove=pos;cv.onpointerdown=pos;btn.onclick=shoot;
 const key=e=>{if(e.key===' '){e.preventDefault();shoot()}};document.addEventListener('keydown',key);
 newWind();draw();return{stop(){dead=true;cancelAnimationFrame(raf);document.removeEventListener('keydown',key)}}}

/* ---------- Registry ---------- */
const GAMES=[
{id:'match3',t:'Candy Match',cat:'Puzzle',diff:'Easy',icon:'🍬',bg:'#FFE3E1',d:'Swap sweets, match three, and chain big cascades.',h:'Click a sweet, then a neighbor to swap. Match 3+ in a row or column. Reach 1000 points within 20 moves.',run:m3},
{id:'snakes',t:'Snakes & Ladders',cat:'Board Games',diff:'Easy',icon:'🐍',bg:'#DFF7EC',d:'Race 2 players to 100 — ladders up, snakes down.',h:'Take turns rolling. Ladders lift you, snakes drop you. You must roll the exact number to land on 100; bigger rolls leave you in place.',run:sl},
{id:'snake',t:'SnakeBite',cat:'Arcade',diff:'Medium',icon:'🟢',bg:'#EEE9FF',d:'Eat, grow, and never bite your own tail.',h:'Arrow keys / WASD or the on-screen pad. Avoid walls and yourself. Pause button available.',run:snake},
{id:'ttt',t:'Tic-Tac-Toe',cat:'Strategy',diff:'Easy–Hard',icon:'❌',bg:'#E3EEFF',d:'Classic 3×3 against a friend or an unbeatable AI.',h:'Get three in a row. Hard mode uses minimax and cannot be beaten — only drawn.',run:ttt},
{id:'tetris',t:'Block Stack',cat:'Puzzle',diff:'Medium',icon:'🧱',bg:'#FFF3CC',d:'Stack falling blocks and clear lines at rising speed.',h:'← → move · ↑ rotate · ↓ soft drop · Space hard drop · P pause. Touch buttons below the board.',run:tetris},
{id:'archery',t:'Archery',cat:'Casual',diff:'Medium',icon:'🎯',bg:'#E0F6EE',d:'Read the wind and land arrows near the bullseye.',h:'Move the mouse / touch to aim, then Shoot (or Space). Wind pushes your arrow sideways. 10 arrows; closer to center scores up to 10.',run:archery}];
const CATS=['All Games','Puzzle','Board Games','Arcade','Strategy','Casual'];
let cat='All Games',query='',cur=null,inst=null;

/* ---------- Library ---------- */
function renderGrid(){const q=query.toLowerCase(),L=GAMES.filter(g=>(cat==='All Games'||g.cat===cat)&&(g.t+g.d+g.cat).toLowerCase().includes(q));
 $('#grid').innerHTML=L.map(g=>`<article class="card"><div class="ill" style="background:${g.bg}">${g.icon}</div><h3>${g.t}</h3><p>${g.d}</p><div><span class="tag">${g.cat}</span><span class="tag">${g.diff}</span></div><button class="btn" data-play="${g.id}">Play Now</button></article>`).join('');
 $('#count').textContent=`Showing ${L.length} of ${GAMES.length} games`;$('#empty').hidden=!!L.length;
 $$('.chips button').forEach(b=>b.classList.toggle('on',b.textContent===cat))}
function renderBoard(){const s=load(),tot=Object.values(s.plays).reduce((a,b)=>a+b,0),most=Object.entries(s.plays).sort((a,b)=>b[1]-a[1])[0],nm=id=>GAMES.find(g=>g.id===id)?.t||id,mx=Math.max(1,...Object.values(s.best));
 $('#board').innerHTML=`<div class="card"><h3>📊 Overview</h3><p>Games played: <b>${tot}</b><br>Total wins: <b>${s.wins}</b><br>Most played: <b>${most?nm(most[0]):'—'}</b></p></div>
 <div class="card"><h3>🏆 Best scores</h3>${GAMES.map(g=>`<small>${g.icon} ${g.t}: ${s.best[g.id]||'—'}</small><div class="pr"><i style="width:${(s.best[g.id]||0)/mx*100}%"></i></div>`).join('')}</div>
 <div class="card"><h3>🕒 Recently played</h3><p>${s.recent.length?s.recent.map(i=>`<span class="tag">${nm(i)}</span>`).join(' '):'Nothing yet — go play!'}</p></div>`;
 const f=GAMES[new Date().getDate()%GAMES.length];$('#fT').textContent=f.t;$('#fD').textContent=f.d;$('#fI').textContent=f.icon;$('#fI').style.background=f.bg;$('#fP').dataset.play=f.id}

/* ---------- Game modal ---------- */
function boot(){stop();const g=GAMES.find(x=>x.id===cur);$('#area').innerHTML='';
 inst=g.run($('#area'),{score:n=>rec(g.id,'score',n),win:()=>rec(g.id,'win')});$('#mp').hidden=!inst.pause;$('#mp').textContent='⏸ Pause'}
function stop(){if(inst&&inst.stop)inst.stop();inst=null}
function openGame(id){cur=id;const g=GAMES.find(x=>x.id===id);$('#mt').textContent=g.t;$('#mi').textContent=g.h;$('#modal').hidden=false;document.body.style.overflow='hidden';rec(id,'play');boot();$('#mx').focus()}
function closeGame(){stop();$('#modal').hidden=true;document.body.style.overflow='';renderBoard()}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded',()=>{
 setTimeout(()=>$('#loader').classList.add('off'),2400);
 $('#tagline').textContent=`${GAMES.length} Games • One Playground • Endless Fun`;$('#yr').textContent=new Date().getFullYear();
 $('.chips').innerHTML=CATS.map(c=>`<button>${c}</button>`).join('');$('#fc').textContent='Puzzle · Board Games · Arcade · Strategy · Casual';
 $('.chips').onclick=e=>{if(e.target.tagName==='BUTTON'){cat=e.target.textContent;renderGrid()}};
 $('#q').oninput=e=>{query=e.target.value;renderGrid();if(query)location.hash='#games'};
 $('#clear').onclick=()=>{query='';$('#q').value='';cat='All Games';renderGrid()};
 document.body.addEventListener('click',e=>{const p=e.target.closest('[data-play]');if(p)openGame(p.dataset.play)});
 const rand=()=>openGame(GAMES[rnd(GAMES.length)].id);$('#rand').onclick=$('#rand2').onclick=rand;
 $('#mx').onclick=$('#mb').onclick=closeGame;$('#mr').onclick=boot;
 $('#mp').onclick=()=>{if(inst&&inst.pause){inst.pause();$('#mp').textContent=$('#mp').textContent.includes('Pause')?'▶ Resume':'⏸ Pause'}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeGame()});
 $('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeGame()});
 $('#reset').onclick=()=>{if(confirm('Reset all local statistics?')){save({plays:{},best:{},wins:0,recent:[]});renderBoard()}};
 $('#burger').onclick=()=>{const o=$('#nav').classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)};
 $$('#nav a').forEach(a=>a.onclick=()=>$('#nav').classList.remove('open'));
 const secs=['home','games','categories','leaderboard','about'];
 addEventListener('scroll',()=>{let c='home';secs.forEach(i=>{const e=$('#'+i);if(e&&e.getBoundingClientRect().top<140)c=i});$$('#nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+c))},{passive:true});
 renderGrid();renderBoard()});
})();