// Focused simulation checks: geometry, alternative blessings, timeout and reset invariants.
// Run with node tests/simulation.cjs. No packages or browser are required.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createContext, runInContext } = require('node:vm');
const context = createContext({ Math });
for (const file of ['config.js', 'geometry.js', 'world.js']) {
  runInContext(readFileSync(join(__dirname, '../game/src', file), 'utf8'), context, { filename: file });
}
const { geometry, createWorld, config } = context.Tideglass;
const concave = [{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:50,y:50},{x:0,y:100}];
assert(geometry.polygonContains({x:50,y:25}, concave));
assert(!geometry.polygonContains({x:50,y:90}, concave));
assert.equal(geometry.polygonArea(concave), 7500);
assert.equal(geometry.segmentDistance({x:50,y:10},{x:0,y:0},{x:100,y:0}),10);
const world = createWorld();
world.state.choice = config.blessings[0]; world.chooseBlessing(1);
assert(Math.abs(world.state.maxSpool - 1960) < 1e-9);
assert(Math.abs(world.state.spool - 1960) < 1e-9);
world.state.choice = config.blessings[1]; world.chooseBlessing(1);
assert.equal(world.state.player.maxHp, 6);
assert.equal(world.state.player.hp, 6);
world.reset();
assert.equal(world.state.player.maxHp, 4);
assert.equal(world.state.maxSpool, 1400);
assert.equal(world.state.blessings.length, 0);
world.state.choice = config.blessings[0]; world.chooseBlessing(0);
assert.equal(world.state.weaveSpeed, 262.5);
world.state.choice = config.blessings[1]; world.chooseBlessing(0);
assert.equal(world.state.dashCooldown, 1.5);
world.reset();
// Isolate the tide limit from contact damage to exercise its independent loss condition.
world.state.player.safe = 1000;
const controls = { direction: {x:0,y:0}, weave:false, dash:false };
for (let i = 0; i < 151 * 120; i++) world.update(config.step, controls);
assert.equal(world.state.result, 'lose');
assert.match(world.state.reason, /tide returned/);
assert(world.state.player.hp > 0);
world.reset();
assert.equal(world.state.result, null);
assert.equal(world.state.collected, 0);
assert.equal(world.state.sparks.length, 18);
// A self-crossing ribbon must capture both visible pockets, not silently fail.
world.state.player.x=200; world.state.player.y=200; world.state.player.safe=100;
world.state.hunters=[]; world.state.spawnTime=1000; world.state.refillTime=1000;
world.state.sparks=[{x:250,y:225,homeX:250,homeY:225,phase:0},{x:250,y:375,homeX:250,homeY:375,phase:0}];
function weaveTo(x,y) {
  for(let i=0;i<1000;i++) {
    const p=world.state.player,dx=x-p.x,dy=y-p.y,length=Math.hypot(dx,dy);
    if(length<0.01)return;
    world.update(Math.min(config.step,length/world.state.weaveSpeed),{direction:{x:dx/length,y:dy/length},weave:true,dash:false});
  }
  throw Error('Ribbon test did not reach target');
}
weaveTo(400,400);weaveTo(200,400);weaveTo(400,200);
world.update(config.step,controls);assert.equal(world.state.collected,2);
console.log('PASS: concave and self-crossing loops, segment distance, all four blessings, reset, tide timeout.');
