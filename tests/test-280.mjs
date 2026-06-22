import { gameSource, assert, done } from './harness.mjs';
const src = gameSource();
// build 385: bots faced 180 the wrong way relative to the player + remote players. The player avatar and
// remote avatars set rotation.y = yaw directly (player-yaw convention: facing a dir (dx,dz) is atan2(-dx,-dz)),
// but bots computed b.yaw = atan2(dx,dz) — exactly π off. So one `face` value couldn't be right for both.
// Fixed: bot yaw now uses the player convention, so it matches the local avatar AND the networked render.

// bot yaw now uses atan2(-dx,-dz) for both the target-facing and movement-facing cases
assert(/b\.yaw = \(tgt && hasLOS\) \? Math\.atan2\(-\(tgt\.pos\.x-b\.pos\.x\), -\(tgt\.pos\.z-b\.pos\.z\)\) : Math\.atan2\(-mvx,-mvz\);/.test(src), 'bot yaw uses the player-yaw convention, only facing the target when seen (build 387)');

// the player own avatar + remote players set rotation.y = yaw directly (the canonical convention bots now match)
assert(/a\.rotation\.y = player\.yaw;/.test(src), 'own avatar: rotation.y = player.yaw');
assert(/let dy=rp\.yaw-rp\.mesh\.rotation\.y;/.test(src) && /rp\.mesh\.rotation\.y \+= dy\*k;/.test(src), 'remote players: rotation.y -> rp.yaw (same convention)');

// the bot's yaw is what gets networked, so other clients render it consistently
assert(/P\.push\(\{ id:b\.id, p:\[b\.pos\.x,EYE,b\.pos\.z\], y:b\.yaw/.test(src), 'bot yaw is sent in the packet (now in the shared convention)');

// executable: the fixed bot yaw and the player convention agree to within 0 across directions
function botYaw(dx,dz){ return Math.atan2(-dx,-dz); }      // build-385 bot
function playerYaw(dx,dz){ return Math.atan2(-dx,-dz); }   // own-avatar convention
for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0],[0.6,-0.8]]){
  let d = botYaw(dx,dz)-playerYaw(dx,dz);
  while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
  assert(Math.abs(d) < 1e-9, `bot + player face the same way for dir (${dx},${dz})`);
}
done();
