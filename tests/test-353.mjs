import { gameSource, extractFunction, assert, done } from './harness.mjs';
const src = gameSource();
// build 468: the demo path was choosing the farthest cell by raw distance — often an isolated ledge no path
// reaches — so A* honestly returned "no path". Now a BFS flood from the player's cell finds the truly
// reachable component; the overlay colours reachable cells green vs cut-off walkable cells blue, and the demo
// path targets the farthest REACHABLE cell (so it always resolves). Diagnoses how fragmented the map is.

assert(/function navFloodReachable\(si\)/.test(src), 'reachability flood exists');
const fr = extractFunction('navFloodReachable');
assert(/if\(reach\[ni\]\) continue; reach\[ni\]=1; dist\[ni\]=dist\[cur\]\+1; count\+\+; q\.push\(ni\);/.test(fr), 'BFS marks reached cells once and tracks distance');
const ov = extractFunction('buildNavOverlay');
assert(/const rch=flood\.reach\[idx\];/.test(ov) && /inst\.setColorAt\(k, rch\?cGreen:cBlue\)/.test(ov), 'overlay colours reachable (green) vs cut-off (blue)');
assert(/const gi=flood\.farthest;/.test(ov), 'demo path targets the farthest REACHABLE cell');

// --- executable: BFS reachability across two disconnected components ---
const W=6,H=6; const walk=new Uint8Array(W*H).fill(1);
// carve a full wall at column 3 -> left region (cols 0-2) and right region (cols 4-5) are disconnected
for(let y=0;y<H;y++) walk[3*H+y]=0;
const idx=(x,y)=>x*H+y;
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const link=new Uint8Array(W*H);
for(let x=0;x<W;x++)for(let y=0;y<H;y++){ const i=idx(x,y); if(!walk[i])continue; let m=0;
  for(let d=0;d<8;d++){ const ax=x+DIRS[d][0],ay=y+DIRS[d][1]; if(ax<0||ax>=W||ay<0||ay>=H)continue; if(!walk[idx(ax,ay)])continue;
    if(d>=4&&(!walk[idx(ax,y)]||!walk[idx(x,ay)]))continue; m|=(1<<d);} link[i]=m; }
function flood(si){ const reach=new Uint8Array(W*H); const dist=new Float32Array(W*H); const q=[si]; reach[si]=1; let h=0,count=1,far=si,fd=0;
  while(h<q.length){ const cur=q[h++],cx=Math.floor(cur/H),cy=cur%H,mask=link[cur];
    for(let d=0;d<8;d++){ if(!(mask&(1<<d)))continue; const ni=(cx+DIRS[d][0])*H+(cy+DIRS[d][1]); if(reach[ni])continue; reach[ni]=1; dist[ni]=dist[cur]+1; count++; q.push(ni); if(dist[ni]>fd){fd=dist[ni];far=ni;} } }
  return {reach,count,far}; }
const left = flood(idx(0,0));
// left region = cols 0,1,2 = 18 cells; right region (cols 4,5 = 12 cells) is unreachable
assert(left.count===18, 'flood reaches only the connected left region (18 cells), not the walled-off right (got '+left.count+')');
assert(left.reach[idx(2,5)]===1 && left.reach[idx(4,0)]===0, 'a left cell is reachable, a right cell is not');
// the farthest reachable cell is within the left region (a path to it must exist)
const fx=Math.floor(left.far/H); assert(fx<=2, 'the farthest reachable cell stays in the reachable component');
// starting on the right reaches only the right region
const right = flood(idx(5,5)); assert(right.count===12, 'flood from the right reaches only its 12 cells');
done();
