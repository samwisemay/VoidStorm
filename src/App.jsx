import { useState, useEffect, useRef, useCallback } from "react";

const GW = 600, GH = 800;
const PI2 = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ag = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const lerp = (a, b, t) => a + (b - a) * t;

const CUR = {
  scrap:  { name: "Scrap",  icon: "⬡", color: "#4499ff", rarity: "COMMON", desc: "Salvage from wrecks. Buys basic repairs and munitions." },
  cores:  { name: "Cores",  icon: "◆", color: "#44ff88", rarity: "UNCOMMON", desc: "Unstable energy cores. Powers advanced weapons." },
  plasma: { name: "Plasma", icon: "✦", color: "#ff8844", rarity: "RARE", desc: "Volatile plasma from elites. Fuels exotic and endgame upgrades." },
  echoes: { name: "Echoes", icon: "⬢", color: "#bb77ff", rarity: "PERMANENT", desc: "Void residue persisting after death. Enhances your ship forever." },
};

const BASE_HP = 12;
function hpScale(w) { return 1 + w * 0.22 + Math.pow(w, 1.4) * 0.02 + (w > 10 ? Math.pow(w - 10, 2) * 0.12 : 0) + (w > 30 ? Math.pow(w - 30, 2) * 1.2 : 0); }
function dmgScale(w) { return 1 + w * 0.18 + Math.pow(w, 1.3) * 0.015 + (w > 10 ? Math.pow(w - 10, 2) * 0.025 : 0); }
function spawnDelay(w) { return Math.max(60, 420 - w * 22 - Math.pow(w, 1.2) * 3); }

const ED = {
  drone:   { hpM: 1.0, spd: 1.4, sz: 13, col: "#ff6644", sB: 2, cB: 0, pB: 0, fr: 2400, bs: 2.5, pat: "aimed",   dM: 1.0, desc: "Basic grunt. Fires single aimed shots." },
  weaver:  { hpM: 1.5, spd: 1.6, sz: 13, col: "#cc44ff", sB: 2, cB: 0, pB: 0, fr: 2000, bs: 2.8, pat: "fan3",    dM: 1.0, desc: "Sine-wave movement. Fires 3-bullet fans." },
  sprayer: { hpM: 2.0, spd: 0.5, sz: 15, col: "#ffaa44", sB: 2, cB: 1, pB: 0, fr: 2800, bs: 2.0, pat: "ring",    dM: 1.0, desc: "Stationary turret. Fires expanding bullet rings." },
  tank:    { hpM: 5.0, spd: 0.4, sz: 20, col: "#cc3333", sB: 3, cB: 1, pB: 0, fr: 3200, bs: 1.8, pat: "bigaimed",dM: 1.6, desc: "Heavy armour, slow. Large high-damage shots." },
  bomber:  { hpM: 1.5, spd: 2.8, sz: 12, col: "#ffcc44", sB: 2, cB: 0, pB: 0, fr: 99999,bs: 0,   pat: "none",    dM: 1.3, desc: "Kamikaze. Charges player, explodes into bullets." },
  sniper:  { hpM: 1.0, spd: 0.3, sz: 14, col: "#ff66ff", sB: 2, cB: 1, pB: 0, fr: 3500, bs: 6.0, pat: "snipe",   dM: 2.5, desc: "Telegraphs with a laser, then fires a fast lethal shot." },
  splitter:{ hpM: 2.2, spd: 1.0, sz: 16, col: "#66ffcc", sB: 3, cB: 1, pB: 0, fr: 2600, bs: 2.3, pat: "aimed",   dM: 1.0, desc: "On death, splits into 2 smaller copies." },
  pulse:   { hpM: 3.0, spd: 0.3, sz: 17, col: "#aaaaff", sB: 3, cB: 1, pB: 1, fr: 3000, bs: 1.5, pat: "pulse",   dM: 1.0, desc: "4-pointed star. Emits expanding pulse rings." },
  orbiter: { hpM: 1.8, spd: 0.6, sz: 14, col: "#44ddff", sB: 2, cB: 1, pB: 0, fr: 1800, bs: 2.2, pat: "orbit",   dM: 1.0, desc: "Circles in place. Fires rotating double-helix bullets." },
  charger: { hpM: 2.5, spd: 0.5, sz: 18, col: "#ff8866", sB: 3, cB: 1, pB: 1, fr: 4000, bs: 4.0, pat: "burst3",  dM: 1.8, desc: "Charges up, then fires 3 rapid high-damage bursts." },
  wraith:  { hpM: 1.8, spd: 0.5, sz: 14, col: "#88aaff", sB: 3, cB: 1, pB: 1, fr: 3800, bs: 3.0, pat: "phase5",  dM: 1.5, desc: "Ethereal hunter. Teleports and fires spreads on reappearing. Briefly invulnerable while phasing." },
  siren:   { hpM: 2.0, spd: 0.7, sz: 15, col: "#ff55cc", sB: 3, cB: 1, pB: 1, fr: 3000, bs: 1.8, pat: "siren",   dM: 1.2, desc: "Hypnotic threat. Fires slow bullets that gently track toward you." },
  fortress:{ hpM: 4.0, spd: 0.25,sz: 22, col: "#55ccaa", sB: 4, cB: 2, pB: 1, fr: 3600, bs: 2.2, pat: "aimed",   dM: 1.3, desc: "Armoured bastion. Rotating shield arc blocks incoming fire from one side." },
  reaper:  { hpM: 2.5, spd: 0.5, sz: 16, col: "#cc44ff", sB: 3, cB: 1, pB: 2, fr: 4500, bs: 2.0, pat: "mines",   dM: 2.0, desc: "Area denial specialist. Drops mines that detonate into bullet rings after a delay." },
};

/* cost = base * (1 + level * scale)^exp */
const SHOP = [
  { id:"dmg",    name:"Hardened Rounds",  desc:"+12% damage",           cat:"offense", cur:"scrap",  base:10, max:20, scale:1.1, exp:1.6, wave:0,  icon:"⚔", fn:p=>{p.damage*=1.12} },
  { id:"rate",   name:"Autoloader",       desc:"-10% fire delay",       cat:"offense", cur:"scrap",  base:12, max:15, scale:0.7, exp:1.4, wave:0,  icon:"🔥",fn:p=>{p.fireDelay=Math.max(50,p.fireDelay*0.9)} },
  { id:"maxhp",  name:"Hull Plating",     desc:"+20 max HP, heal 20",   cat:"defense", cur:"scrap",  base:8,  max:25, scale:0.6, exp:1.3, wave:0,  icon:"❤", fn:p=>{const _oldHp=p.hp;p.maxHp+=20;p.hp=Math.max(_oldHp,Math.min(p.hp+20,p.maxHp));} },
  { id:"magnet", name:"Tractor Beam",     desc:"+9% pickup range",      cat:"utility", cur:"scrap",  base:10, max:8,  scale:1.0, exp:1.5, wave:0,  icon:"🧲",fn:p=>{p.magnetRange*=1.09} },
  { id:"bsize",  name:"Bore Upgrade",     desc:"+0.1 bullet size, +8% damage",cat:"offense", cur:"scrap",  base:15, max:10, scale:0.9, exp:1.5, wave:2,  icon:"●", fn:p=>{p.bulletSize+=0.1;p.damage*=1.08} },
  { id:"speed",  name:"Afterburner",      desc:"+8% move speed",        cat:"utility", cur:"scrap",  base:12, max:8,  scale:0.8, exp:1.4, wave:3,  icon:"💫",fn:p=>{p.speed*=1.08} },
  { id:"regen",  name:"Nanobots",         desc:"+0.8 HP/sec",           cat:"defense", cur:"cores",  base:8, max:10, scale:0.7, exp:1.35, wave:4,  icon:"✚", fn:p=>{p.regenRate+=0.8} },
  { id:"fortune",name:"Scavenger AI",     desc:"+15% currency drops",   cat:"utility", cur:"cores",  base:16, max:8,  scale:0.9, exp:1.5, wave:4,  icon:"💎",fn:p=>{p.fortuneMult*=1.15} },
  { id:"rear",   name:"Rear Turret",      desc:"Fire tiny bullets back",cat:"offense", cur:"cores",  base:18, max:1,  scale:1,   exp:1,   wave:4,  icon:"⇅", fn:p=>{p.hasRearGun=true} },
  { id:"shield", name:"Barrier Cell",     desc:"+1 hit shield/wave",    cat:"defense", cur:"cores",  base:832, max:2,  scale:1.67, exp:1.0, wave:5,  icon:"🛡",fn:p=>{p.shieldMax++;p.shields++} },
  { id:"acid",   name:"Flame Coating",     desc:"+1 burn stack. On hit: burns for (stacks \u00d7 10%) bullet dmg/s for 2s.",cat:"offense", cur:"cores",  base:20, max:5,  scale:1.4, exp:1.8, wave:5,  icon:"🔥",fn:p=>{p.acidStacks++} },
  { id:"velocity",name:"Velocity Rounds", desc:"+12% bullet speed",     cat:"offense", cur:"cores",  base:30, max:5,  scale:1.2, exp:1.6, wave:7,  icon:"»", fn:p=>{p.bulletSpeedMul=(p.bulletSpeedMul||1)*1.12} },
  { id:"kinetic", name:"Kinetic Amplifier",desc:"x1.1 dmg for Echo Clone, Seeker Swarm & Combat Drone per level when moving",  cat:"offense", cur:"plasma", base:12, max:5,  scale:1.1, exp:1.5, wave:8,  icon:"⚡",fn:p=>{p.kineticBonus=(p.kineticBonus||0)+0.10} },
  { id:"pklife", name:"Stasis Field",     desc:"+0.5s pickup duration",  cat:"utility", cur:"plasma", base:12, max:6,  scale:0.9, exp:1.4, wave:8,  icon:"⏱", fn:p=>{p.pickupLife+=30} },
  { id:"crit",   name:"Precision Core",   desc:"+8% crit (2.5× dmg)",  cat:"offense", cur:"plasma", base:16, max:8,  scale:1.0, exp:1.5, wave:9,  icon:"🎯",fn:p=>{p.critChance=Math.min(0.7,(p.critChance||0)+0.08)} },
  { id:"dodge",  name:"Phase Matrix",     desc:"+3% chance to halve damage",cat:"defense", cur:"plasma", base:18, max:8,  scale:1.4, exp:1.85,wave:10, icon:"💨",fn:p=>{p.dodgeChance=Math.min(0.35,(p.dodgeChance||0)+0.03)} },
  { id:"voidsiphon",name:"Void Siphon",  desc:"Heals 2 HP per critical attack (main gun only)",cat:"defense", cur:"plasma", base:10, max:8,  scale:0.8, exp:1.4, wave:8,  icon:"🩸",fn:p=>{p.voidsiphonFlat=(p.voidsiphonFlat||0)+2} },
  { id:"overdrv",name:"Overdrive Chip",   desc:"+3% all stats",         cat:"utility", cur:"plasma", base:25, max:10, scale:1.5, exp:1.8, wave:12, icon:"⚙", fn:p=>{p.damage*=1.03;p.speed*=1.03;p.maxHp=Math.ceil(p.maxHp*1.03);p.fireDelay*=0.97} },
  { id:"reactive",name:"Reactive Plating",desc:"Take 3% less damage",cat:"defense", cur:"plasma", base:22, max:12, scale:1.1, exp:1.6, wave:10, icon:"🔰",fn:p=>{p.dmgReduction=(p.dmgReduction||0)+0.03} },
];

const ABILITIES = [
  { id:"orbitals",name:"Orbital Electrons",desc:"2 spinning electrons orbit you, destroying bullets on contact.",icon:"🔆" },
  { id:"chain",name:"Chain Lightning",desc:"Every 4th hit arcs lightning to 2 enemies for 30% damage each. Does not arc to Fortress enemies.",icon:"⭐" },
  { id:"homing",name:"Seeker Swarm",desc:"Every 1.5s, launch homing missiles dealing 40% damage.",icon:"🎯" },
  { id:"nova",name:"Plasma Nova",desc:"Every 6s, a shockwave deals 200% damage in a radius of 12.",icon:"💫" },
  { id:"slowfield",name:"Temporal Drag",desc:"Enemy bullets in a wide area slow down, with a radius of 9.",icon:"⏳" },
  { id:"mirror",name:"Echo Clone",desc:"Ghost mirrors your position, firing at 30% damage and half the fire rate.",icon:"👻" },
  { id:"ricochet",name:"Ricochet Rounds",desc:"Bullets ricochet off the top of the screen with 80% damage.",icon:"🪃" },
  { id:"drone",name:"Combat Drone",desc:"Drone follows you, auto-fires at 20% damage.",icon:"🤖" },
  { id:"gravity",name:"Gravity Well",desc:"Every 8s, a vortex pulls enemies and bullets for 4 seconds with a radius of 11.",icon:"🌀" },
  { id:"overcharge",name:"Overcharge",desc:"Each currency pickup heals 3 HP. Can overcharge up to 120% of max health.",icon:"🔶" },
  { id:"blackhole",name:"Event Horizon",desc:"Taking HP damage removes 35% of all bullets on screen.",icon:"🔮" },
  { id:"void_regen",name:"Void Regen",desc:"Regenerate 2% HP/s after 4s without taking damage, up to 60% max health. Regens into Overcharge if active.",icon:"💜" },
];

const META = [
  { id:"m_start",name:"Head Start",desc:"+1 ability at start",base:50,max:1 },
  { id:"m_hp",name:"Reinforced Hull",desc:"+12 starting HP",base:12,max:10 },
  { id:"m_dmg",name:"Gunpowder Density",desc:"+1.5 starting damage",base:15,max:8 },
  { id:"m_spd",name:"Thruster Tuning",desc:"+5% move speed",base:15,max:3 },
  { id:"m_luck",name:"Scavenger Protocol",desc:"+8% currency drops",base:20,max:5 },
  { id:"m_shield",name:"Startup Shield",desc:"+1 starting shield",base:75,max:1 },
  { id:"m_magnet",name:"Magnetic Hull",desc:"+4% pickup range",base:18,max:5 },
  { id:"m_bullet",name:"Heavy Calibre",desc:"+0.25 bullet size",base:22,max:2 },
  { id:"m_crit",name:"Precision Optics",desc:"+2% base crit chance",base:22,max:4 },
];
function metaMax(id,tier){const up=META.find(u=>u.id===id);return up?up.max*tier:0;}
function metaCost(up,lvl,tier){const t1Max=up.max;if(tier===1||lvl<t1Max)return Math.ceil(up.base*(1+lvl*0.85));const t2Start=up.base*55*0.5;return Math.ceil(t2Start*(1+(lvl-t1Max)*1.5));}

const CC = { offense:"#ff4466", defense:"#44bbff", utility:"#44ffaa" };
const SHIP_COLORS = [
  { id:"cyan", name:"Cyan", color:"#00e5ff", glow:"#00e5ff" },
  { id:"green", name:"Green", color:"#44ff88", glow:"#44ff88" },
  { id:"gold", name:"Gold", color:"#ffcc44", glow:"#ffcc44" },
  { id:"pink", name:"Pink", color:"#ff66aa", glow:"#ff66aa" },
  { id:"red", name:"Red", color:"#ff4444", glow:"#ff4444" },
  { id:"purple", name:"Purple", color:"#bb77ff", glow:"#bb77ff" },
  { id:"white", name:"White", color:"#ddeeff", glow:"#aabbcc" },
  { id:"orange", name:"Orange", color:"#ff8844", glow:"#ff8844" },
];
const BULLET_COLORS = [
  { id:"teal", name:"Teal", color:"#44ddcc" },
  { id:"cyan", name:"Cyan", color:"#00e5ff" },
  { id:"green", name:"Green", color:"#44ff88" },
  { id:"pink", name:"Pink", color:"#ff66aa" },
  { id:"purple", name:"Purple", color:"#bb77ff" },
  { id:"white", name:"White", color:"#ddeeff" },
  { id:"blue", name:"Blue", color:"#4488ff" },
  { id:"lime", name:"Lime", color:"#aaff44" },
];
function makeStars(n){ const s=[]; for(let i=0;i<n;i++) s.push({x:rand(0,GW),y:rand(0,GH),sz:rand(0.5,2),sp:rand(0.3,1.2),br:rand(0.3,0.8)}); return s; }

function drawShape(ctx,type,x,y,s,col,time,extra){
  ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=2;
  switch(type){
    case"drone": ctx.beginPath();ctx.moveTo(x,y+s);ctx.lineTo(x-s*0.8,y-s*0.7);ctx.lineTo(x+s*0.8,y-s*0.7);ctx.closePath();ctx.fill();break;
    case"weaver": ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.7,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.7,y);ctx.closePath();ctx.fill();break;
    case"sprayer": ctx.beginPath();for(let i=0;i<6;i++){const a=(PI2/6)*i-Math.PI/6;ctx.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}ctx.closePath();ctx.fill();break;
    case"tank": ctx.fillRect(x-s*0.8,y-s*0.8,s*1.6,s*1.6);break;
    case"bomber": ctx.beginPath();ctx.arc(x,y,s*0.7,0,PI2);ctx.fill();ctx.strokeStyle="#ffee88";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,s+(time?Math.sin(time*0.01)*3:0),0,PI2);ctx.stroke();break;
    case"sniper": ctx.fillRect(x-2,y-s,4,s*2);ctx.fillRect(x-s*0.5,y-2,s,4);
      if(extra?.telegraphing){ctx.strokeStyle="#ff66ffaa";ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(extra.aimAngle||0)*600,y+Math.sin(extra.aimAngle||0)*600);ctx.stroke();ctx.setLineDash([]);}
      break;
    case"splitter": ctx.beginPath();for(let i=0;i<5;i++){const a=(PI2/5)*i-Math.PI/2;ctx.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}ctx.closePath();ctx.fill();break;
    case"pulse": ctx.beginPath();for(let i=0;i<8;i++){const a=(PI2/8)*i-Math.PI/2;const r=i%2===0?s:s*0.45;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();break;
    case"orbiter": ctx.beginPath();ctx.arc(x,y,s*0.5,0,PI2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=col;const oa=time?time*0.003:0;for(let i=0;i<3;i++){const ba=oa+(PI2/3)*i;ctx.beginPath();ctx.arc(x+Math.cos(ba)*s*0.85,y+Math.sin(ba)*s*0.85,3,0,PI2);ctx.fill();}break;
    case"charger":{const sa=extra?.spinAngle||0;ctx.save();ctx.translate(x,y);ctx.rotate(sa);ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*0.9,s*0.5);ctx.lineTo(-s*0.9,s*0.5);ctx.closePath();ctx.fill();
      const chPct=extra?.chargeTimer>0?1-(extra.chargeTimer/(extra.fireRate||4000)):0;
      ctx.fillStyle="#fff";ctx.globalAlpha=0.3+chPct*0.5;ctx.beginPath();ctx.arc(0,0,s*(0.25+chPct*0.15),0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.restore();break;}
    case"boss":{ctx.shadowColor=col;ctx.shadowBlur=12;const p=1+(time?Math.sin(time*0.004)*0.06:0);const z=s*p;ctx.beginPath();ctx.moveTo(x,y-z);ctx.lineTo(x-z*1.1,y+z*0.5);ctx.lineTo(x-z*0.35,y+z*0.25);ctx.lineTo(x,y+z*0.8);ctx.lineTo(x+z*0.35,y+z*0.25);ctx.lineTo(x+z*1.1,y+z*0.5);ctx.closePath();ctx.fill();ctx.shadowBlur=0;break;}
    case"wraith":{const wa=extra?.phaseCD>0?0.25:0.75+Math.sin((time||0)*0.006)*0.2;ctx.globalAlpha=wa;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.7,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.7,y);ctx.closePath();ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,s*0.2,0,PI2);ctx.fill();ctx.globalAlpha=1;break;}
    case"siren":{ctx.shadowColor=col;ctx.shadowBlur=8;ctx.beginPath();for(let i=0;i<6;i++){const a=(PI2/6)*i-Math.PI/2;const r=i%2===0?s:s*0.3;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.shadowBlur=0;break;}
    case"fortress":{ctx.fillRect(x-s*0.6,y-s*0.6,s*1.2,s*1.2);ctx.strokeStyle="#ffffff";ctx.lineWidth=3;ctx.globalAlpha=0.7;const sa=extra?.shieldAngle||0;ctx.beginPath();ctx.arc(x,y,s*1.15,sa-0.8,sa+0.8);ctx.stroke();ctx.globalAlpha=1;break;}
    case"reaper":{ctx.save();ctx.translate(x,y);ctx.rotate((extra?.rotOff||0)+(time||0)*(extra?.rotSpd||0.002));ctx.beginPath();ctx.arc(0,0,s*0.9,0,PI2);ctx.fill();ctx.fillStyle="#06060e";ctx.beginPath();ctx.arc(s*0.35,0,s*0.7,0,PI2);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(-s*0.2,0,s*0.22,0,PI2);ctx.fill();ctx.restore();break;}
    default: ctx.beginPath();ctx.arc(x,y,s,0,PI2);ctx.fill();
  }
}

function drawAbIcon(ctx,id,cx,cy,sz,col){
  ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=Math.max(1,sz*0.08);ctx.lineCap="round";ctx.lineJoin="round";
  const s=sz*0.4;
  switch(id){
    case"orbitals":{/* nucleus + orbiting dots */ctx.beginPath();ctx.arc(0,0,s*0.25,0,PI2);ctx.fill();ctx.globalAlpha=0.5;ctx.beginPath();ctx.ellipse(0,0,s*0.85,s*0.35,0.3,0,PI2);ctx.stroke();ctx.globalAlpha=1;for(let i=0;i<2;i++){const a=i*Math.PI;ctx.beginPath();ctx.arc(Math.cos(a+0.3)*s*0.85,Math.sin(a+0.3)*s*0.35,s*0.12,0,PI2);ctx.fill();}break;}
    case"chain":{/* branching bolt */ctx.lineWidth*=1.5;ctx.beginPath();ctx.moveTo(-s*0.15,-s);ctx.lineTo(s*0.15,-s*0.15);ctx.lineTo(-s*0.1,-s*0.05);ctx.lineTo(s*0.2,s*0.8);ctx.stroke();ctx.lineWidth*=0.5;ctx.globalAlpha=0.6;ctx.beginPath();ctx.moveTo(s*0.15,-s*0.15);ctx.lineTo(s*0.6,s*0.1);ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.1,-s*0.05);ctx.lineTo(-s*0.55,s*0.25);ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(s*0.2,s*0.8,s*0.12,0,PI2);ctx.fill();ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(s*0.6,s*0.1,s*0.08,0,PI2);ctx.fill();ctx.beginPath();ctx.arc(-s*0.55,s*0.25,s*0.08,0,PI2);ctx.fill();ctx.globalAlpha=1;break;}
    case"homing":{/* crosshair */ctx.beginPath();ctx.arc(0,0,s*0.55,0,PI2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(0,-s*0.35);ctx.moveTo(0,s);ctx.lineTo(0,s*0.35);ctx.moveTo(-s,0);ctx.lineTo(-s*0.35,0);ctx.moveTo(s,0);ctx.lineTo(s*0.35,0);ctx.stroke();ctx.beginPath();ctx.arc(0,0,s*0.12,0,PI2);ctx.fill();break;}
    case"nova":{/* starburst */const spikes=8;for(let i=0;i<spikes;i++){const a=(PI2/spikes)*i;ctx.beginPath();ctx.moveTo(Math.cos(a)*s*0.2,Math.sin(a)*s*0.2);ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s);ctx.stroke();}ctx.beginPath();ctx.arc(0,0,s*0.22,0,PI2);ctx.fill();break;}
    case"slowfield":{/* hourglass */ctx.beginPath();ctx.moveTo(-s*0.55,-s*0.85);ctx.lineTo(s*0.55,-s*0.85);ctx.lineTo(s*0.08,0);ctx.lineTo(s*0.55,s*0.85);ctx.lineTo(-s*0.55,s*0.85);ctx.lineTo(-s*0.08,0);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.45,-s*0.85);ctx.lineTo(s*0.45,-s*0.85);ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.45,s*0.85);ctx.lineTo(s*0.45,s*0.85);ctx.stroke();break;}
    case"mirror":{/* two overlapping ships */ctx.globalAlpha=0.4;ctx.beginPath();ctx.moveTo(-s*0.35,-s*0.6);ctx.lineTo(-s*0.65,s*0.5);ctx.lineTo(-s*0.35,s*0.2);ctx.lineTo(-s*0.05,s*0.5);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(s*0.35,-s*0.6);ctx.lineTo(s*0.05,s*0.5);ctx.lineTo(s*0.35,s*0.2);ctx.lineTo(s*0.65,s*0.5);ctx.closePath();ctx.fill();break;}
    case"ricochet":{/* arrow bouncing */ctx.beginPath();ctx.moveTo(-s*0.7,s*0.4);ctx.lineTo(0,-s*0.5);ctx.lineTo(s*0.7,s*0.4);ctx.stroke();/* bounce angle */ctx.beginPath();ctx.moveTo(0,-s*0.5);ctx.lineTo(s*0.2,-s*0.9);ctx.stroke();/* wall line */ctx.globalAlpha=0.3;ctx.beginPath();ctx.moveTo(-s*0.9,-s*0.9);ctx.lineTo(s*0.9,-s*0.9);ctx.stroke();ctx.globalAlpha=1;break;}
    case"drone":{/* small drone */ctx.fillRect(-s*0.35,-s*0.35,s*0.7,s*0.7);ctx.strokeRect(-s*0.5,-s*0.5,s,s);ctx.beginPath();ctx.moveTo(0,-s*0.5);ctx.lineTo(0,-s*0.85);ctx.stroke();ctx.beginPath();ctx.arc(0,-s*0.85,s*0.08,0,PI2);ctx.fill();break;}
    case"gravity":{/* spiral */ctx.beginPath();for(let i=0;i<40;i++){const t=i/40*PI2*2;const r=s*0.15+i/40*s*0.7;ctx.lineTo(Math.cos(t)*r,Math.sin(t)*r);}ctx.stroke();break;}
    case"overcharge":{/* diamond with plus */ctx.beginPath();ctx.moveTo(0,-s*0.9);ctx.lineTo(s*0.6,0);ctx.lineTo(0,s*0.9);ctx.lineTo(-s*0.6,0);ctx.closePath();ctx.stroke();ctx.lineWidth*=1.3;ctx.beginPath();ctx.moveTo(0,-s*0.3);ctx.lineTo(0,s*0.3);ctx.moveTo(-s*0.3,0);ctx.lineTo(s*0.3,0);ctx.stroke();break;}
    case"blackhole":{/* void with accretion rings */ctx.globalAlpha=0.15;ctx.beginPath();ctx.arc(0,0,s*0.35,0,PI2);ctx.fill();ctx.globalAlpha=0.6;ctx.lineWidth*=0.7;ctx.beginPath();ctx.arc(0,0,s*0.35,0,PI2);ctx.stroke();ctx.globalAlpha=0.7;ctx.lineWidth*=1.7;ctx.save();ctx.scale(1,0.4);ctx.beginPath();ctx.arc(0,0,s,0,PI2);ctx.stroke();ctx.restore();ctx.globalAlpha=0.35;ctx.save();ctx.rotate(Math.PI/3);ctx.scale(1,0.4);ctx.beginPath();ctx.arc(0,0,s,0,PI2);ctx.stroke();ctx.restore();ctx.save();ctx.rotate(-Math.PI/3);ctx.scale(1,0.4);ctx.beginPath();ctx.arc(0,0,s,0,PI2);ctx.stroke();ctx.restore();ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(0,0,s*0.15,0,PI2);ctx.fill();ctx.globalAlpha=1;break;}
    case"void_regen":{/* heart-ish + plus */ctx.beginPath();ctx.moveTo(0,s*0.7);ctx.bezierCurveTo(-s*0.8,s*0.1,-s*0.8,-s*0.6,0,-s*0.2);ctx.bezierCurveTo(s*0.8,-s*0.6,s*0.8,s*0.1,0,s*0.7);ctx.stroke();ctx.lineWidth*=0.8;ctx.beginPath();ctx.moveTo(0,-s*0.05);ctx.lineTo(0,s*0.35);ctx.moveTo(-s*0.18,s*0.15);ctx.lineTo(s*0.18,s*0.15);ctx.stroke();break;}
    default:{ctx.beginPath();ctx.arc(0,0,s*0.5,0,PI2);ctx.stroke();}
  }
  ctx.restore();
}

export default function VoidStorm(){
  const canvasRef=useRef(null), gsRef=useRef(null), keysRef=useRef({}), rafRef=useRef(null), ltRef=useRef(0);
  const[phase,setPhase]=useState("menu");
  const[shopData,setShopData]=useState(null);
  const[deathData,setDeathData]=useState(null);
  const[abChoices,setAbChoices]=useState([]);
  const[meta,setMeta]=useState({echoes:0,levels:{},shipColor:"cyan",showMagnetRange:true});
  const metaRef=useRef(meta);
  useEffect(()=>{metaRef.current=meta;},[meta]);
  const shipCol=useCallback(()=>{const sc=SHIP_COLORS.find(c=>c.id===(meta.shipColor||"cyan"));return sc||SHIP_COLORS[0];},[meta.shipColor]);
  const bulletCol=useCallback(()=>{const id=meta.bulletColor||"teal";if(id==="match")return"#44ddcc";const bc=BULLET_COLORS.find(c=>c.id===id);return bc?.color||"#44ddcc";},[meta.bulletColor]);
  const[showWiki,setShowWiki]=useState(false);
  const wikiRef=useRef(false);
  useEffect(()=>{wikiRef.current=showWiki;},[showWiki]);
  const[confirmReset,setConfirmReset]=useState(false);
  const[confirmForfeit,setConfirmForfeit]=useState(false);
  const[paused,setPaused]=useState(false);
  const[showStats,setShowStats]=useState(false);
  const[metaTab,setMetaTab]=useState("ship");
  const[abInfoId,setAbInfoId]=useState(null);
  const[showAnalyser,setShowAnalyser]=useState(false);const[showRegenAnalyser,setShowRegenAnalyser]=useState(false);const[confirmRespec,setConfirmRespec]=useState(false);const[deathDmgPopup,setDeathDmgPopup]=useState(false);const[deathRegenPopup,setDeathRegenPopup]=useState(false);
  const[showPauseSettings,setShowPauseSettings]=useState(false);
  const pausedRef=useRef(false);
  const[pgMode,setPgMode]=useState(null);
  const pgRef=useRef(null);
  useEffect(()=>{pgRef.current=pgMode;},[pgMode]);
  const[practiceWave,setPracticeWave]=useState(1);
  const[historyHover,setHistoryHover]=useState(null);
  const fpsRef=useRef({frames:0,last:performance.now(),fps:0});
  const[historyHideForfeits,setHistoryHideForfeits]=useState(false);
  const[tutStep,setTutStep]=useState(0);
  const[showTutPrompt,setShowTutPrompt]=useState(false);
  const tutRef=useRef(0);
  useEffect(()=>{tutRef.current=tutStep;},[tutStep]);
  const phRef=useRef("menu");
  useEffect(()=>{phRef.current=phase;setConfirmReset(false);setConfirmForfeit(false);setPaused(false);pausedRef.current=false;setShowStats(false);setMetaTab("ship");setAbInfoId(null);setShowAnalyser(false);setShowPauseSettings(false);setDeathDmgPopup(false);setDeathRegenPopup(false);if(phase!=="playing")setPgMode(null);
    if(phase==="menu"||phase==="settings"||phase==="playground"||phase==="metashop"||phase==="practise"||phase==="history"){
      gsRef.current={player:{alive:false,x:GW/2,y:GH/2,size:13,hp:0,maxHp:1,shields:0,abilities:[]},
        enemies:[],pBullets:[],eBullets:[],pickups:[],particles:[],orbitals:[],
        homingMissiles:[],drones:[],gravWells:[],novaRings:[],hitTexts:[],
        wave:0,waveActive:false,enemiesLeft:0,waveTotal:0,waveKilled:0,
        spawnQueue:[],spawnTimer:0,kills:0,scrap:0,cores:0,plasma:0,
        stars:gsRef.current?.stars||makeStars(120),screenShake:0,flashTimer:0,time:gsRef.current?.time||0,
        upgrades:{},usedAbIds:[],deathCause:"",shipCol:shipCol(),bulCol:bulletCol(),
      };
    }
  },[phase]);
  useEffect(()=>{pausedRef.current=paused;},[paused]);
  useEffect(()=>{
    try{
      const r=localStorage.getItem("vs4-meta");
      if(r)setMeta(JSON.parse(r));
      else setShowTutPrompt(true);
    }catch(e){}
  },[]);
  const saveMeta=useCallback(m=>{
    try{
      localStorage.setItem("vs4-meta",JSON.stringify(m));
    }catch(e){}
  },[]);

  const gml=useCallback(id=>meta.levels[id]||0,[meta]);
  const metaTier=meta.metaTier||1;

  function initTutorial(){
    setTutStep(1);setShowTutPrompt(false);
    const gs={
      player:{x:GW/2,y:GH-80,hp:75,maxHp:75,
        damage:7,fireDelay:210,fireTimer:0,
        speed:3.6,invTimer:0,size:13,
        shields:0,shieldMax:0,
        pierce:0,bulletSize:3.2,bulletSpeedMul:1,
        magnetRange:50,fortuneMult:1,
        regenRate:0,dodgeChance:0,critChance:0,dmgReduction:0,pickupLife:0,voidsiphonPct:0,voidsiphonFlat:0,kineticBonus:0,lastDmgTime:0,
        alive:true,hasRearGun:false,acidStacks:0,shotCount:0,abilities:[],lastHitBy:"",
        phaseCooldown:0,phaseActive:0,novaTimer:0,homingTimer:0,gravTimer:0,
        novaPow:1,novaRange:110,goldenShields:0,
      },
      enemies:[],pBullets:[],eBullets:[],pickups:[],particles:[],orbitals:[],
      homingMissiles:[],drones:[],gravWells:[],novaRings:[],hitTexts:[],
      wave:0,waveActive:false,enemiesLeft:0,waveTotal:0,waveKilled:0,
      spawnQueue:[],spawnTimer:0,kills:0,scrap:0,cores:0,plasma:0,
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,dmgTrack:{},waveDmg:{},
      stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),showMagnetRange:true,
      abUp:{},isTutorial:true,
    };
    gsRef.current=gs;
    setPhase("playing");startWave(gs);
  }

  const initGame=useCallback(()=>{
    const gs={
      player:{x:GW/2,y:GH-80,hp:75+gml("m_hp")*12,maxHp:75+gml("m_hp")*12,
        damage:7+gml("m_dmg")*1.5,fireDelay:210,fireTimer:0,
        speed:3.6*(1+gml("m_spd")*0.05),invTimer:0,size:13,
        shields:gml("m_shield"),shieldMax:gml("m_shield"),
        pierce:0,bulletSize:3.2+gml("m_bullet")*0.25,bulletSpeedMul:1,
        magnetRange:50*(1+gml("m_magnet")*0.04),fortuneMult:1+gml("m_luck")*0.08,
        regenRate:0,dodgeChance:0,critChance:gml("m_crit")*0.02,dmgReduction:0,pickupLife:0,voidsiphonPct:0,voidsiphonFlat:0,kineticBonus:0,lastDmgTime:0,
        alive:true,hasRearGun:false,acidStacks:0,shotCount:0,abilities:[],lastHitBy:"",
        phaseCooldown:0,phaseActive:0,novaTimer:0,homingTimer:0,gravTimer:0,
        novaPow:1,novaRange:110,goldenShields:0,
      },
      enemies:[],pBullets:[],eBullets:[],pickups:[],particles:[],orbitals:[],
      homingMissiles:[],drones:[],gravWells:[],novaRings:[],hitTexts:[],
      wave:0,waveActive:false,enemiesLeft:0,waveTotal:0,waveKilled:0,
      spawnQueue:[],spawnTimer:0,kills:0,scrap:0,cores:0,plasma:0,
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,dmgTrack:{},waveDmg:{},
      stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),showMagnetRange:meta.showMagnetRange!==false,
      abUp:{...(meta.abUpgrades||{})},
    };
    gs._pAb=gml("m_start");
    gsRef.current=gs;
    if(gs._pAb>0){gs._pAb--;offerAb(gs);}
    else if(gs.wave>0){/* mid-game ability: show shop before next wave */setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}
    else{setPhase("playing");startWave(gs);}
  },[gml]);

  const ENEMY_UNLOCK={drone:1,weaver:2,bomber:3,sprayer:4,sniper:6,splitter:7,orbiter:8,tank:9,pulse:11,charger:13,wraith:15,siren:17,fortress:20,reaper:22,boss:5};

  function startPlayground(enemyType){
    const unlockW=ENEMY_UNLOCK[enemyType]||1;
    const gs={
      player:{x:GW/2,y:GH-80,hp:75+gml("m_hp")*12,maxHp:75+gml("m_hp")*12,
        damage:7+gml("m_dmg")*1.5,fireDelay:210,fireTimer:0,
        speed:3.6*(1+gml("m_spd")*0.05),invTimer:0,size:13,
        shields:gml("m_shield"),shieldMax:gml("m_shield"),
        pierce:0,bulletSize:3.2+gml("m_bullet")*0.25,bulletSpeedMul:1,
        magnetRange:50*(1+gml("m_magnet")*0.04),fortuneMult:0,
        regenRate:0,dodgeChance:0,critChance:gml("m_crit")*0.02,dmgReduction:0,pickupLife:0,voidsiphonPct:0,lastDmgTime:0,
        alive:true,hasRearGun:false,acidStacks:0,shotCount:0,abilities:[],lastHitBy:"",
        phaseCooldown:0,phaseActive:0,novaTimer:0,homingTimer:0,gravTimer:0,
        novaPow:1,novaRange:110,
      },
      enemies:[],pBullets:[],eBullets:[],pickups:[],particles:[],orbitals:[],
      homingMissiles:[],drones:[],gravWells:[],novaRings:[],hitTexts:[],
      wave:0,waveActive:false,enemiesLeft:0,waveTotal:0,waveKilled:0,
      spawnQueue:[],spawnTimer:0,kills:0,scrap:0,cores:0,plasma:0,
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,dmgTrack:{},waveDmg:{},
      stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),
      isPlayground:true,_pgEnemy:enemyType,_pgWave:unlockW,showMagnetRange:meta.showMagnetRange!==false,abUp:{...(meta.abUpgrades||{})},
    };
    gs._pAb=gml("m_start");
    gsRef.current=gs;
    if(gs._pAb>0){gs._pAb--;offerAb(gs);}
    else launchPG(gs);
  }
  function launchPG(gs){
    const et=gs._pgEnemy,uw=gs._pgWave||1;
    gs.wave=uw;gs.waveActive=true;gs.enemiesLeft=1;gs.waveTotal=1;gs.waveKilled=0;
    setPgMode({enemy:et,subWave:1});
    spawnE(gs,{type:et});
    setPhase("playing");
  }

  function startPractise(w){
    const gs={
      player:{x:GW/2,y:GH-80,hp:75+gml("m_hp")*12,maxHp:75+gml("m_hp")*12,
        damage:7+gml("m_dmg")*1.5,fireDelay:210,fireTimer:0,
        speed:3.6*(1+gml("m_spd")*0.05),invTimer:0,size:13,
        shields:gml("m_shield"),shieldMax:gml("m_shield"),
        pierce:0,bulletSize:3.2+gml("m_bullet")*0.25,bulletSpeedMul:1,
        magnetRange:50*(1+gml("m_magnet")*0.04),fortuneMult:0,
        regenRate:0,dodgeChance:0,critChance:gml("m_crit")*0.02,dmgReduction:0,pickupLife:0,voidsiphonPct:0,lastDmgTime:0,
        alive:true,hasRearGun:false,acidStacks:0,shotCount:0,abilities:[],lastHitBy:"",
        phaseCooldown:0,phaseActive:0,novaTimer:0,homingTimer:0,gravTimer:0,
        novaPow:1,novaRange:110,
      },
      enemies:[],pBullets:[],eBullets:[],pickups:[],particles:[],orbitals:[],
      homingMissiles:[],drones:[],gravWells:[],novaRings:[],hitTexts:[],
      wave:w-1,waveActive:false,enemiesLeft:0,waveTotal:0,waveKilled:0,
      spawnQueue:[],spawnTimer:0,kills:0,scrap:0,cores:0,plasma:0,
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,dmgTrack:{},waveDmg:{},
      stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),
      isPlayground:true,isPractise:true,showMagnetRange:meta.showMagnetRange!==false,abUp:{...(meta.abUpgrades||{})},
    };
    gs._pAb=gml("m_start");
    gsRef.current=gs;
    setPgMode(null);
    if(gs._pAb>0){gs._pAb--;offerAb(gs);}
    else{setPhase("playing");startWave(gs);}
  }

  function offerAb(gs){
    const av=ABILITIES.filter(a=>!gs.usedAbIds.includes(a.id));
    if(av.length===0){startWave(gs);return;}
    const pool=[...av],picks=[];
    for(let i=0;i<Math.min(3,pool.length);i++){const idx=randInt(0,pool.length-1);picks.push(pool[idx]);pool.splice(idx,1);}
    setAbChoices(picks);setPhase("ability");
  }

  function pickAb(id){
    const gs=gsRef.current;if(!gs)return;
    gs.player.abilities.push(id);gs.usedAbIds.push(id);
    if(id==="orbitals"){const oc=hasAU(gs,"orbitals_sub1")?4:2;gs.orbitals=Array.from({length:oc},(_,i)=>({angle:(PI2/oc)*i,layer:0}));if(hasAU(gs,"orbitals_mastery"))for(let i=0;i<4;i++)gs.orbitals.push({angle:(PI2/4)*i,layer:1});}
    if(id==="drone")gs.drones.push({x:gs.player.x,y:gs.player.y,ft:0});
    if(gs._pAb>0){gs._pAb--;offerAb(gs);}
    else if(gs.isPlayground&&!gs.isPractise){launchPG(gs);}
    else if(gs.isPractise||gs.wave===0){setPhase("playing");startWave(gs);}
    else{setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}
  }
  function has(gs,id){return gs.player.abilities.includes(id);}
  function hasAU(gs,key){return !!(gs.abUp&&gs.abUp[key]);}

  function startWave(gs){
    if(gs.wave>0&&has(gs,"void_regen")&&hasAU(gs,"void_regen_mastery")&&gs._noDmgWave)gs.player.goldenShields++;gs._noDmgWave=true;gs.wave++;gs.waveActive=true;gs._waveEndTimer=0;gs.waveDmg={};gs.waveHeal={};
    if(gs.isTutorial){if(gs.wave===2)setTutStep(20);else if(gs.wave===3)setTutStep(30);else if(gs.wave===4)setTutStep(40);else if(gs.wave===5)setTutStep(50);}
    gs.spawnQueue=genWave(gs.wave);
    gs.waveTotal=gs.spawnQueue.length;gs.enemiesLeft=gs.waveTotal;gs.waveKilled=0;
    gs.spawnTimer=0;gs.player.shields=gs.player.shieldMax;gs._novaCollapsePending=null;gs._novaMines=[];
    if(has(gs,"overcharge")&&hasAU(gs,"overcharge_mastery")){gs.player.hp=Math.min(gs.player.hp,gs.player.maxHp*1.1);}else{gs.player.hp=Math.min(gs.player.hp,gs.player.maxHp);}/* reset overcharge */
    /* new enemy notification */
    if(metaRef.current.showNewEnemy!==false){
      const newType=Object.entries(ENEMY_UNLOCK).find(([k,w])=>w===gs.wave&&k!=="boss");
      if(newType)gs.newEnemyNotif={type:newType[0],timer:180};
      else if(gs.wave%5===0)gs.newEnemyNotif={type:"boss",timer:180};
      else gs.newEnemyNotif=null;
    } else gs.newEnemyNotif=null;
  }

  function genWave(w){
    const q=[],isBoss=w%5===0;
    const count=4+Math.floor(w*1.0)+Math.floor(Math.pow(w,1.1)*0.25);
    const newType=Object.keys(ED).find(k=>ENEMY_UNLOCK[k]===w);
    if(isBoss){
      q.push({type:"boss",delay:400});
      const avail=Object.keys(ED).filter(k=>ENEMY_UNLOCK[k]<=w);
      const bossDel=Math.max(120,spawnDelay(w)*2.2);
      if(newType){q.push({type:newType,delay:800});q.push({type:newType,delay:bossDel});}
      const rem=count-(newType?2:0);
      for(let i=0;i<rem;i++)q.push({type:pick(avail.length>0?avail:["drone"]),delay:i===0&&!newType?800:bossDel});
    } else {
      const types=Object.keys(ED).filter(k=>ENEMY_UNLOCK[k]<=w);
      if(types.length===0)types.push("drone");
      const del=spawnDelay(w);
      if(newType){q.push({type:newType,delay:200});q.push({type:newType,delay:del});}
      const rem=count-(newType?2:0);
      for(let i=0;i<rem;i++)q.push({type:pick(types),delay:i===0&&!newType?200:del});
    }
    return q;
  }

  function spawnE(gs,def){
    const ws=hpScale(gs.wave),cs=1+gs.wave*0.015;
    if(def.type==="boss"){
      gs.enemies.push({type:"boss",x:GW/2,y:-40,targetY:100,hp:BASE_HP*18*ws,maxHp:BASE_HP*18*ws,
        size:35,speed:0.8,color:"#ff2266",fireTimer:0,fireRate:1100,phase:1,moveTimer:0,entering:true,
        burnDmg:0,burnTimer:0,
        scrapDrop:Math.round((8+gs.wave*0.8)*cs),coreDrop:Math.round((4+gs.wave*0.4)*cs),plasmaDrop:Math.round((2+gs.wave*0.2)*cs),
      });
    } else {
      const ed=ED[def.type],hp=BASE_HP*ed.hpM*ws;
      gs.enemies.push({type:def.type,x:rand(40,GW-40),y:-20,hp,maxHp:hp,
        size:ed.sz,speed:ed.spd*(1+gs.wave*0.018),color:ed.col,
        fireTimer:rand(0,ed.fr),fireRate:Math.max(400,ed.fr-gs.wave*18),
        bulletSpeed:ed.bs*(1+gs.wave*0.01),pattern:ed.pat,dM:ed.dM,
        scrapDrop:Math.round((ed.sB+gs.wave*0.12)*cs),
        coreDrop:Math.round((ed.cB+gs.wave*0.06)*cs),
        plasmaDrop:Math.round((ed.pB+gs.wave*0.03)*cs),
        sineOff:rand(0,PI2),sineAmp:rand(40,80),
        entering:true,targetY:rand(60,GH*0.38),burnDmg:0,burnTimer:0,
        telegraphing:false,aimAngle:0,teleTimer:0,
        phaseCD:0,phaseTimer:def.type==="wraith"?rand(2000,3500):0,shieldAngle:rand(0,PI2),
        rotOff:rand(0,PI2),rotSpd:0.002+rand(-0.0005,0.0005),
      });
    }
  }

  const BSPD=8;
  function trackDmg(gs,src,amt){if(!gs.dmgTrack)gs.dmgTrack={};if(!gs.waveDmg)gs.waveDmg={};gs.dmgTrack[src]=(gs.dmgTrack[src]||0)+amt;gs.waveDmg[src]=(gs.waveDmg[src]||0)+amt;}
  function trackHeal(gs,src,amt){if(!gs.healTrack)gs.healTrack={};if(!gs.waveHeal)gs.waveHeal={};gs.healTrack[src]=(gs.healTrack[src]||0)+amt;gs.waveHeal[src]=(gs.waveHeal[src]||0)+amt;}
  function firePB(gs){
    const p=gs.player;p.shotCount++;
    const isChain=has(gs,"chain")&&p.shotCount%4===0;
    const bspd=BSPD*(p.bulletSpeedMul||1);
    const a=-Math.PI/2,isCrit=Math.random()<p.critChance;
    gs.pBullets.push({x:p.x,y:p.y-p.size,vx:Math.cos(a)*bspd,vy:Math.sin(a)*bspd,
      damage:p.damage*(isCrit?2.5:1),pierce:p.pierce,isChain,isCrit,
      size:p.bulletSize,
      bounces:has(gs,"ricochet")?(hasAU(gs,"ricochet_sub2")?2:1):0,acid:p.acidStacks,src:"main"});
    if(p.hasRearGun)gs.pBullets.push({x:p.x,y:p.y+p.size,vx:0,vy:bspd*0.5,
      damage:p.damage*0.25,pierce:0,isChain:false,isCrit:false,size:2.5,bounces:0,acid:0,src:"rear"});
  }

  function fireEB(gs,e){
    const p=gs.player,a=ag(e,p),bs=e.bulletSpeed||2.5,dmg=(7+gs.wave*1.8)*(e.dM||1)*dmgScale(gs.wave)*0.35;
    const bl=gs.eBullets.length;const src=e.type||"enemy";
    switch(e.pattern){
      case"aimed":gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs,vy:Math.sin(a)*bs,size:5,dmg});break;
      case"fan3":for(let i=-1;i<=1;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.2)*bs,vy:Math.sin(a+i*0.2)*bs,size:5,dmg});break;
      case"ring":{const n=8+Math.floor(gs.wave*0.18);for(let i=0;i<n;i++){const ra=(PI2/n)*i+gs.time*0.001;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs,vy:Math.sin(ra)*bs,size:5,dmg});}break;}
      case"bigaimed":gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs,vy:Math.sin(a)*bs,size:8,dmg:dmg*1.5});break;
      case"snipe":gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs,vy:Math.sin(a)*bs,size:4,dmg:dmg*2.0});break;
      case"pulse":{const n=12+Math.floor(gs.wave*0.12);for(let i=0;i<n;i++){const ra=(PI2/n)*i;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.7,vy:Math.sin(ra)*bs*0.7,size:4,dmg:dmg*0.4});}break;}
      case"orbit":{const oa=gs.time*0.003;for(let i=0;i<2;i++){const ra=oa+Math.PI*i;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs,vy:Math.sin(ra)*bs,size:5,dmg});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra+0.3)*bs*0.8,vy:Math.sin(ra+0.3)*bs*0.8,size:4,dmg:dmg*0.7});}break;}
      case"burst3":{for(let b=0;b<3;b++){setTimeout(()=>{if(!gs.player.alive)return;const ba=ag(e,gs.player);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*bs,vy:Math.sin(ba)*bs,size:6,dmg,src});},b*120);}break;}
      case"phase5":{for(let i=-2;i<=2;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.25)*bs,vy:Math.sin(a+i*0.25)*bs,size:5,dmg});break;}
      case"siren":{for(let i=-1;i<=1;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.3)*bs,vy:Math.sin(a+i*0.3)*bs,size:5,dmg,homing:true,homingLife:3750});break;}
      case"mines":{for(let i=0;i<2;i++){const mx=e.x+rand(-80,80),my=e.y+rand(30,140);gs.eBullets.push({x:clamp(mx,10,GW-10),y:clamp(my,10,GH-40),vx:0,vy:0,size:7,dmg:dmg*0.3,mine:true,mineTimer:2000+rand(0,800)});}break;}
      default:break;
    }
    for(let i=bl;i<gs.eBullets.length;i++)gs.eBullets[i].src=src;
  }

  function fireBoss(gs,b){
    const p=gs.player,a=ag(b,p),bs=2.5+gs.wave*0.02,dmg=(8+gs.wave*2)*dmgScale(gs.wave)*0.3;
    const bl=gs.eBullets.length;
    if(b.phase===1){for(let i=-2;i<=2;i++)gs.eBullets.push({x:b.x,y:b.y+20,vx:Math.cos(a+i*0.13)*bs,vy:Math.sin(a+i*0.13)*bs,size:6,dmg});}
    else{const n=10+Math.floor(gs.wave*0.2);for(let i=0;i<n;i++){const ra=(PI2/n)*i+gs.time*0.002;gs.eBullets.push({x:b.x,y:b.y,vx:Math.cos(ra)*bs*0.8,vy:Math.sin(ra)*bs*0.8,size:5,dmg:dmg*0.6});}
      for(let i=-1;i<=1;i++)gs.eBullets.push({x:b.x,y:b.y+20,vx:Math.cos(a+i*0.25)*bs*1.2,vy:Math.sin(a+i*0.25)*bs*1.2,size:7,dmg:dmg*1.2});}
    for(let i=bl;i<gs.eBullets.length;i++)gs.eBullets[i].src="boss";
  }

  function spawnPk(gs,e){
    if(gs.isPlayground)return;
    const fm=gs.player.fortuneMult;
    const _goldMul=1;/* gold pickups now applied when entering golden grav wells */
    const mk=(t,v,x,y)=>{if(v<=0)return;const mult=t==="plasma"?fm*0.5:fm;gs.pickups.push({x:x+rand(-10,10),y:y+rand(-10,10),type:t,value:Math.max(1,Math.round(v*mult)),vy:rand(-1.5,0.3),vx:rand(-1.2,1.2),life:540+(gs.player.pickupLife||0),size:t==="plasma"?9:t==="cores"?7:5.5});};
    mk("scrap",e.scrapDrop,e.x,e.y);mk("cores",e.coreDrop,e.x,e.y);mk("plasma",e.plasmaDrop,e.x,e.y);
  }
  function sp(gs,x,y,c,n,s){for(let i=0;i<n;i++){const a=rand(0,PI2),v=rand(s*0.3,s);gs.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(15,40),ml:40,color:c,size:rand(1.5,4)});}}

  function chainL(gs,fx,fy,dmg){
    const _clCount=hasAU(gs,"chain_sub1")?4:2;let tgts=[...gs.enemies].filter(e=>e.type!=="fortress").sort((a,b)=>dist(a,{x:fx,y:fy})-dist(b,{x:fx,y:fy})).slice(0,_clCount);
    let cx=fx,cy=fy;
    tgts.forEach(t=>{const cd=dmg*0.3;t.hp-=cd;trackDmg(gs,"Blue Chain Lightning",cd);sp(gs,t.x,t.y,"#88ddff",8,3);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:t.x+rand(-6,6),y:t.y-t.size,text:Math.round(cd),life:22,ml:22,col:"#88ddff"});
      /* jagged bolt segments */
      const segs=8;for(let i=0;i<segs;i++){const f=i/segs;const nx=lerp(cx,t.x,f)+rand(-12,12),ny=lerp(cy,t.y,f)+rand(-12,12);
        gs.particles.push({x:nx,y:ny,vx:rand(-0.3,0.3),vy:rand(-0.3,0.3),life:14,ml:14,color:i%2===0?"#aaeeff":"#ffffff",size:rand(2,3.5)});}
      /* impact flash at target */
      gs.particles.push({x:t.x,y:t.y,vx:0,vy:0,life:12,ml:12,color:"#ffffff",size:6});
      cx=t.x;cy=t.y;});
  }
  function greenChainL(gs,fx,fy,dmg){
    let tgts=[...gs.enemies].filter(e=>e.type!=="fortress").sort((a,b)=>dist(a,{x:fx,y:fy})-dist(b,{x:fx,y:fy})).slice(0,4);
    let cx=fx,cy=fy;const kills=[];
    tgts.forEach(t=>{const arcD=dmg*0.25;const elecD=dmg*0.4;const td=arcD+elecD;t.hp-=td;trackDmg(gs,"Green Chain Lightning",td);
      t._elecTimer=300;t._elecColor="#44ff88";sp(gs,t.x,t.y,"#44ff88",8,3);
      if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:t.x+rand(-6,6),y:t.y-t.size,text:Math.round(td),life:22,ml:22,col:"#44ff88"});
      const segs=8;for(let i=0;i<segs;i++){const f=i/segs;const nx=lerp(cx,t.x,f)+rand(-12,12),ny=lerp(cy,t.y,f)+rand(-12,12);
        gs.particles.push({x:nx,y:ny,vx:rand(-0.3,0.3),vy:rand(-0.3,0.3),life:14,ml:14,color:i%2===0?"#66ff99":"#aaffcc",size:rand(2,3.5)});}
      gs.particles.push({x:t.x,y:t.y,vx:0,vy:0,life:12,ml:12,color:"#aaffcc",size:6});
      if(t.hp<=0){const idx=gs.enemies.indexOf(t);if(idx>=0)kills.push({e:t,idx});}
      cx=t.x;cy=t.y;});
    kills.sort((a,b)=>b.idx-a.idx).forEach(k=>killE(gs,k.e,k.idx));
  }

  function killE(gs,e,idx){
    const _isSplitterChild=e.type==="splitter"&&e.size<=10;
    gs.kills++;if(!_isSplitterChild)gs.waveKilled++;
    sp(gs,e.x,e.y,e.color,e.type==="boss"?22:8,e.type==="boss"?5:3);
    spawnPk(gs,e);
    if(e.type==="bomber"){const _sfR2=has(gs,"slowfield")?(hasAU(gs,"slowfield_sub1")?180:90):0;const _halfB=hasAU(gs,"slowfield_mastery")&&dist(e,gs.player)<_sfR2;const _bCount=_halfB?4:8;for(let k=0;k<_bCount;k++){const ra=(PI2/_bCount)*k;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*2.5,vy:Math.sin(ra)*2.5,size:5,dmg:8+gs.wave,src:"bomber"});}}
    if(e.type==="splitter"&&e.size>10){
      for(let i=0;i<2;i++){const ch=e.maxHp*0.3;gs.enemies.push({type:"splitter",x:e.x+rand(-12,12),y:e.y+rand(-8,8),hp:ch,maxHp:ch,size:10,speed:e.speed*1.3,color:"#88ffdd",fireTimer:rand(0,2000),fireRate:2200,bulletSpeed:2.5,pattern:"aimed",dM:0.5,scrapDrop:1,coreDrop:0,plasmaDrop:0,sineOff:rand(0,PI2),sineAmp:rand(20,40),entering:false,targetY:e.y,burnDmg:0,burnTimer:0,telegraphing:false,aimAngle:0,teleTimer:0});gs.enemiesLeft++;}
    }
    gs.screenShake=e.type==="boss"?14:3;
    if(gs._droneRage===e)gs._droneRage=null;
    if(idx>=0)gs.enemies.splice(idx,1);gs.enemiesLeft--;
    
  }

  function update(dt){
    const gs=gsRef.current;if(!gs||!gs.player.alive)return;
    if(gs.isTutorial&&[1,20,30,40,50].includes(tutRef.current))return;
    const p=gs.player,keys=keysRef.current;gs.time+=dt;
    gs.stars.forEach(s=>{s.y+=s.sp*dt*0.06;if(s.y>GH){s.y=0;s.x=rand(0,GW);}});

    const dx=((keys["d"]||keys["arrowright"])?1:0)-((keys["a"]||keys["arrowleft"])?1:0);
    const dy=((keys["s"]||keys["arrowdown"])?1:0)-((keys["w"]||keys["arrowup"])?1:0);
    const mg=Math.hypot(dx,dy)||1;let spd=p.speed;
    p.x=clamp(p.x+(dx/mg)*spd*dt*0.06,p.size,GW-p.size);
    p.y=clamp(p.y+(dy/mg)*spd*dt*0.06,p.size,GH-p.size);
    if(p.invTimer>0)p.invTimer-=dt;
    if(p.regenRate>0){const _rh=Math.min(p.maxHp-p.hp,p.regenRate*dt*0.001);if(_rh>0){p.hp+=_rh;trackHeal(gs,"Nanobots",_rh);}}

    let fd=p.fireDelay,pp=p.pierce;
    if((p.kineticBonus||0)>0){const _km=(keysRef.current["w"]||keysRef.current["a"]||keysRef.current["s"]||keysRef.current["d"]||keysRef.current["arrowup"]||keysRef.current["arrowdown"]||keysRef.current["arrowleft"]||keysRef.current["arrowright"])?1:0;p._kineticActive=_km;}
    p.fireTimer-=dt;if(p.fireTimer<=0){p.fireTimer=fd;const sv=p.pierce;p.pierce=pp;firePB(gs);p.pierce=sv;}

    if(has(gs,"nova")){p.novaTimer+=dt;if(p.novaTimer>=6000){p.novaTimer=0;const nr=hasAU(gs,"nova_sub1")?200:120;const novaKills=[];gs.enemies.forEach((e,ei)=>{if(dist(e,p)<nr){const nd=p.damage*2.0*(p.novaPow||1);e.hp-=nd;trackDmg(gs,"Plasma Nova",nd);e._novaHitExp=true;sp(gs,e.x,e.y,"#ff88ff",3,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x,y:e.y-e.size,text:Math.round(nd),life:30,ml:30,col:"#ff88ff"});if(e.hp<=0)novaKills.push(ei);}});for(let i=novaKills.length-1;i>=0;i--)killE(gs,gs.enemies[novaKills[i]],novaKills[i]);sp(gs,p.x,p.y,"#ff88ff",12,5);gs.screenShake=4;gs.novaRings.push({x:p.x,y:p.y,r:0,maxR:nr,life:22,ml:22});
      if(hasAU(gs,"nova_sub2")){gs._novaCollapsePending={x:p.x,y:p.y,maxR:nr,dmg:p.damage*0.8};}
      if(hasAU(gs,"nova_mastery")){if(!gs._novaMines)gs._novaMines=[];gs._novaMines.push({x:p.x,y:p.y,dmg:p.damage*1.0,r:200,life:999});}}}
    if(gs._novaMines){gs._novaMines.forEach(nm=>{gs.enemies.forEach((e,ei)=>{if(dist(e,nm)<30&&!nm.det){nm.det=true;const mk=[];gs.enemies.forEach((te,ti)=>{if(dist(te,nm)<nm.r){te.hp-=nm.dmg;trackDmg(gs,"Plasma Nova Landmine",nm.dmg);sp(gs,te.x,te.y,"#ff88ff",6,3);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:te.x,y:te.y-te.size,text:Math.round(nm.dmg),life:24,ml:24,col:"#ff88ff"});if(te.hp<=0)mk.push(ti);}});mk.sort((a,b)=>b-a).forEach(ki=>killE(gs,gs.enemies[ki],ki));sp(gs,nm.x,nm.y,"#ff88ff",18,6);gs.screenShake=5;gs.novaRings.push({x:nm.x,y:nm.y,r:0,maxR:nm.r,life:22,ml:22});}});});gs._novaMines=gs._novaMines.filter(nm=>!nm.det);}
    if(has(gs,"homing")){const _hmDelay=hasAU(gs,"homing_sub1")?1000:1500;p.homingTimer+=dt;if(p.homingTimer>=_hmDelay&&gs.enemies.length>0){p.homingTimer=0;const _mCrit=hasAU(gs,"homing_sub2")&&Math.random()<0.15;gs.homingMissiles.push({x:p.x,y:p.y-10,vx:0,vy:-2,dmg:p.damage*0.4*(1+(p._kineticActive?p.kineticBonus:0))*(_mCrit?2.5:1),life:260,size:4,isCrit:_mCrit});}}
    if(has(gs,"gravity")){p.gravTimer+=dt;if(p.gravTimer>=8000){p.gravTimer=0;gs._gwCount=(gs._gwCount||0)+1;const isGold=hasAU(gs,"gravity_mastery")&&gs._gwCount%2===0;const cx=gs.enemies.length>0?gs.enemies.reduce((s,e)=>s+e.x,0)/gs.enemies.length:GW/2;const cy=gs.enemies.length>0?gs.enemies.reduce((s,e)=>s+e.y,0)/gs.enemies.length:GH*0.3;gs.gravWells.push({x:cx,y:cy,life:240,ml:240,r:110,golden:isGold});if(hasAU(gs,"gravity_sub2")){const _ga=rand(0,PI2);const _gd=110;const ox=cx+Math.cos(_ga)*_gd,oy=cy+Math.sin(_ga)*_gd;gs.gravWells.push({x:clamp(ox,30,GW-30),y:clamp(oy,30,GH*0.6),life:240,ml:240,r:70,golden:isGold,conjoined:true,parentX:cx,parentY:cy});}}}

    if(has(gs,"void_regen")){const _vrWin=hasAU(gs,"void_regen_sub2")&&gs.waveKilled>0?2500:4000;if(gs.time-p.lastDmgTime>_vrWin){const vrCap=p.maxHp*(hasAU(gs,"void_regen_sub1")?0.9:0.6);const vrTarget=has(gs,"overcharge")?p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2):vrCap;if(p.hp<vrTarget){const vrHeal=Math.min(vrTarget-p.hp,p.maxHp*0.02*dt*0.001);if(vrHeal>0){p.hp+=vrHeal;trackHeal(gs,"Void Regen",vrHeal);}else{p.hp=p.hp;}if(!gs._vrPlus)gs._vrPlus=[];gs._vrPlusT=(gs._vrPlusT||0)+dt;if(gs._vrPlusT>120){gs._vrPlusT=0;gs._vrPlus.push({ox:rand(-14,14),oy:rand(-6,10),vy:-rand(0.6,1.4),life:35,ml:35,sz:rand(2.5,4.5)});}gs._vrPlus.forEach(v=>{v.oy+=v.vy*dt*0.06;v.life-=dt*0.06;});gs._vrPlus=gs._vrPlus.filter(v=>v.life>0);}}}
    gs.gravWells.forEach(gw=>{gw.life-=dt*0.06;gs.enemies.forEach(e=>{if(dist(e,gw)<gw.r){const a=ag(e,gw);e.x+=Math.cos(a)*1.4*dt*0.06;e.y+=Math.sin(a)*1.4*dt*0.06;if(gw.golden)e._inGoldenGW=true;}else if(gw.golden&&e._inGoldenGW){e._inGoldenGW=false;}});gs.eBullets.forEach(b=>{if(dist(b,gw)<gw.r){const a=ag(b,gw);b.vx+=Math.cos(a)*0.04*dt*0.06;b.vy+=Math.sin(a)*0.04*dt*0.06;if(hasAU(gs,"gravity_sub1")){if(!b._origSz)b._origSz=b.size;b.size=Math.max(b._origSz*0.68,b.size-b._origSz*0.04*dt*0.001);}}});});
    gs.gravWells=gs.gravWells.filter(g=>g.life>0);
    gs.novaRings.forEach(nr=>{nr.life-=dt*0.06;if(nr.collapse){nr.r=lerp(nr.maxR,0,1-nr.life/nr.ml);const gs2=gsRef.current;if(gs2){gs2.enemies.forEach(e=>{const d=dist(e,{x:nr.cx,y:nr.cy});if(d<nr.r+20&&d>nr.r-20&&!e._novaHitCol){e._novaHitCol=true;e.hp-=nr.dmg;trackDmg(gs2,"Plasma Nova",nr.dmg);sp(gs2,e.x,e.y,"#ff88ff",3,2);if(metaRef.current.showHitText!==false)gs2.hitTexts.push({x:e.x,y:e.y-e.size,text:Math.round(nr.dmg),life:22,ml:22,col:"#dd66dd"});}});}}else{nr.r=lerp(0,nr.maxR,1-nr.life/nr.ml);}});
    let _pendingCollapse=null;gs.novaRings=gs.novaRings.filter(nr=>{if(nr.life<=0&&!nr.collapse&&!nr.fire&&gs._novaCollapsePending&&!_pendingCollapse){_pendingCollapse=gs._novaCollapsePending;gs._novaCollapsePending=null;} return nr.life>0;});if(_pendingCollapse){const nc=_pendingCollapse;gs.novaRings.push({x:nc.x,y:nc.y,r:nc.maxR,maxR:nc.maxR,life:22,ml:22,collapse:true,cx:nc.x,cy:nc.y,dmg:nc.dmg});}
    if(has(gs,"orbitals")){gs.orbitals.forEach(o=>{const _iR=hasAU(gs,"orbitals_mastery")?32:36;if(o.layer===1){const _raw=Math.abs(Math.cos(o.angle));const _spdM=0.35+_raw*_raw*0.65;o.angle+=0.003*dt*_spdM;}else{o.angle+=0.004*dt;}let ox,oy;if(o.layer===1){ox=p.x+Math.cos(o.angle)*190;oy=p.y+Math.sin(o.angle)*48;}else{ox=p.x+Math.cos(o.angle)*_iR;oy=p.y+Math.sin(o.angle)*_iR;}gs.eBullets=gs.eBullets.filter(b=>dist(b,{x:ox,y:oy})>8);
      if(hasAU(gs,"orbitals_sub2")){gs.enemies.forEach(e=>{if(!e._orbHit&&dist(e,{x:ox,y:oy})<e.size+6){e._orbHit=true;const od=p.damage*0.3;e.hp-=od;trackDmg(gs,"Orbital Electrons",od);sp(gs,e.x,e.y,"#00e5ff",6,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-6,6),y:e.y-e.size,text:Math.round(od),life:22,ml:22,col:"#00e5ff"});if(e.hp<=0){const idx=gs.enemies.indexOf(e);if(idx>=0)killE(gs,e,idx);}}});}});}
    gs.drones.forEach(dr=>{dr.x=lerp(dr.x,p.x+26,0.03*dt*0.06);dr.y=lerp(dr.y,p.y+16,0.03*dt*0.06);
      if(gs._droneRage&&!gs.enemies.includes(gs._droneRage))gs._droneRage=null;const _drFd=hasAU(gs,"drone_sub1")&&gs._droneRage?200:400;
      const _drDmgMul=(0.20+(hasAU(gs,"drone_sub2")?(p.abilities.length-1)*0.03:0))*(1+(p._kineticActive?p.kineticBonus:0));
      dr.ft-=dt;if(dr.ft<=0&&gs.enemies.length>0){dr.ft=_drFd;
      let cl;if(hasAU(gs,"drone_sub1")&&gs._droneRage&&gs.enemies.includes(gs._droneRage)){cl=gs._droneRage;}else{cl=gs.enemies.reduce((b,e)=>(!b||dist(e,dr)<dist(b,dr))?e:b,null);}
      if(cl){const a=ag(dr,cl);gs.pBullets.push({x:dr.x,y:dr.y,vx:Math.cos(a)*6,vy:Math.sin(a)*6,damage:p.damage*_drDmgMul,pierce:0,isChain:false,isCrit:false,size:3,bounces:0,acid:0,src:"drone"});}}});
    if(has(gs,"mirror")){const _mfd=hasAU(gs,"mirror_sub1")?fd:fd*2;gs._mirrorTimer=(gs._mirrorTimer||0)-dt;if(gs._mirrorTimer<=0){gs._mirrorTimer=_mfd;gs.pBullets.push({x:GW-p.x,y:p.y-p.size,vx:0,vy:-BSPD,damage:p.damage*0.3*(1+(p._kineticActive?p.kineticBonus:0)),pierce:0,isChain:false,isCrit:false,size:p.bulletSize-1,bounces:0,acid:0,src:"mirror"});}}
    if(has(gs,"mirror")&&hasAU(gs,"mirror_mastery")){gs._lassoTimer=(gs._lassoTimer||0)+dt;if(gs._lassoTimer>=12000&&gs.enemies.length>0){gs._lassoTimer=0;
      /* Find densest cluster center */let bestX=GW/2,bestY=GH*0.3,bestD=0;gs.enemies.forEach(e=>{let dens=0;gs.enemies.forEach(e2=>{if(dist(e,e2)<100)dens++;});if(dens>bestD){bestD=dens;bestX=e.x;bestY=e.y;}});
      gs._lasso={x:GW-p.x,y:p.y,tx:bestX,ty:bestY,phase:"windup",timer:2000,pushTimer:0,pushR:100};}}
    if(gs._lasso){const L=gs._lasso;if(L.phase==="windup"){L.timer-=dt;L._spin=(L._spin||0)+dt*0.012;if(L.timer<=0){L.phase="target";/* find target now */let bX=GW/2,bY=GH*0.3,bD=0;gs.enemies.forEach(e=>{let d=0;gs.enemies.forEach(e2=>{if(dist(e,e2)<100)d++;});if(d>bD){bD=d;bX=e.x;bY=e.y;}});L.tx=bX;L.ty=bY;L.phase="launch";L.timer=400;}}
      else if(L.phase==="launch"){L.timer-=dt;L.x=lerp(L.x,L.tx,0.15*dt*0.06);L.y=lerp(L.y,L.ty,0.15*dt*0.06);if(L.timer<=0||dist(L,{x:L.tx,y:L.ty})<25){L.phase="capture";L.captured=[];gs.enemies.forEach(e=>{if(dist(e,L)<L.pushR&&e.type!=="boss")L.captured.push(e);});L.moveTimer=4000;const aw=ag({x:L.x,y:L.y},p);L.moveX=L.x+Math.cos(aw)*400;L.moveY=clamp(L.y+Math.sin(aw)*400,40,GH*0.35);}}
      else if(L.phase==="capture"){L.moveTimer-=dt;L.x=lerp(L.x,L.moveX,0.04*dt*0.06);L.y=lerp(L.y,L.moveY,0.04*dt*0.06);L.captured=L.captured.filter(e=>gs.enemies.includes(e));L.captured.forEach((e,ci)=>{const _co=ci*PI2/Math.max(1,L.captured.length);const _cx=L.x+Math.cos(_co)*25;const _cy=L.y+Math.sin(_co)*25;e.x=lerp(e.x,_cx,0.06*dt*0.06);e.y=lerp(e.y,_cy,0.06*dt*0.06);e.x=clamp(e.x,e.size,GW-e.size);});if(L.moveTimer<=0)gs._lasso=null;}}

    gs.homingMissiles.forEach(m=>{m.life-=dt*0.06;const cl=gs.enemies.reduce((b,e)=>(!b||dist(e,m)<dist(b,m))?e:b,null);if(cl){const a=ag(m,cl);m.vx=(m.vx||0)*0.94+Math.cos(a)*0.26;m.vy=(m.vy||0)*0.94+Math.sin(a)*0.26;}m.x+=(m.vx||0)*dt*0.06;m.y+=(m.vy||0)*dt*0.06;});
    gs.homingMissiles=gs.homingMissiles.filter(m=>m.life>0&&m.x>-20&&m.x<GW+20&&m.y>-20&&m.y<GH+20);
    const htcBase=gs.bulCol||(gs.shipCol||{color:"#00e5ff"}).color;
    for(let i=gs.homingMissiles.length-1;i>=0;i--){const m=gs.homingMissiles[i];for(let j=gs.enemies.length-1;j>=0;j--){const e=gs.enemies[j];if(dist(m,e)<e.size+m.size){e.hp-=m.dmg;trackDmg(gs,"Seeker Missiles",m.dmg);
      if(m.isCrit){sp(gs,e.x,e.y,"#ffff44",14,5);sp(gs,e.x,e.y,"#ffffff",8,3.5);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-8,8),y:e.y-e.size,text:Math.round(m.dmg),life:24,ml:24,col:"#ffff44"});}
      else{sp(gs,m.x,m.y,"#ffaa44",4,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x,y:e.y-e.size,text:Math.round(m.dmg),life:22,ml:22,col:htcBase});}
      if(hasAU(gs,"homing_mastery")){const _br=60;gs.enemies.forEach(be=>{if(dist(be,{x:m.x,y:m.y})<_br){be.burnDmg=m.dmg*0.2;be.burnTimer=5000;}});sp(gs,m.x,m.y,"#ff6622",16,5);sp(gs,m.x,m.y,"#ffaa33",10,3);gs.novaRings.push({x:m.x,y:m.y,r:0,maxR:_br,life:18,ml:18,fire:true});}
      if(has(gs,"chain")&&hasAU(gs,"chain_mastery")){gs._gcSeeker=(gs._gcSeeker||0)+1;if(gs._gcSeeker%3===0)greenChainL(gs,m.x,m.y,m.dmg);}
      gs.homingMissiles.splice(i,1);if(e.hp<=0)killE(gs,e,j);break;}}}

    if(gs.screenShake>0)gs.screenShake=Math.max(0,gs.screenShake-dt*0.08);if(gs.flashTimer>0)gs.flashTimer-=dt;
    if(gs.newEnemyNotif){gs.newEnemyNotif.timer-=dt*0.06;if(gs.newEnemyNotif.timer<=0)gs.newEnemyNotif=null;}
    gs.spawnTimer-=dt;while(gs.spawnQueue.length>0&&gs.spawnTimer<=0){const nx=gs.spawnQueue.shift();spawnE(gs,nx);gs.spawnTimer=nx.delay||300;}

    gs.enemies.forEach(e=>{
      if(e.entering){e.y=lerp(e.y,e.targetY||120,0.02*dt*0.06);if(Math.abs(e.y-(e.targetY||120))<5)e.entering=false;}
      else if(e.type==="boss"){e.moveTimer=(e.moveTimer||0)+dt;e.x+=Math.sin(e.moveTimer*0.001)*1.2*dt*0.06;e.x=clamp(e.x,e.size+10,GW-e.size-10);if(e.hp<e.maxHp*0.5&&e.phase===1)e.phase=2;}
      else if(e.type==="bomber"){const a=ag(e,p);const _bSpd=e.speed*(1-(e._tdSlow||0));e.x+=Math.cos(a)*_bSpd*dt*0.06;e.y+=Math.sin(a)*_bSpd*dt*0.06;}
      else if(e.type==="weaver"){e.y+=e.speed*0.25*dt*0.06;e.sineOff+=dt*0.003;e.x+=Math.sin(e.sineOff)*e.sineAmp*0.03*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
      else if(e.type==="sniper"){
        if(!e.telegraphing){e.teleTimer-=dt;if(e.teleTimer<=0){e.telegraphing=true;e.aimAngle=ag(e,p);e.teleTimer=700;}}
        else{e.teleTimer-=dt;if(e.teleTimer<=0){e.telegraphing=false;e.teleTimer=e.fireRate;fireEB(gs,e);}}
      }
      else if(e.type==="orbiter"){e.sineOff+=dt*0.002;e.x+=Math.cos(e.sineOff)*e.sineAmp*0.04*dt*0.06;e.y+=Math.sin(e.sineOff*0.7)*0.3*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
      else if(e.type==="charger"){e.y+=e.speed*0.3*dt*0.06;e.spinAngle=(e.spinAngle||0);
        const chFrac=1-((e.fireTimer||0)/(e.fireRate||4000));e.spinAngle+=chFrac*0.15*dt*0.06;e.chargeTimer=e.fireTimer;}
      else if(e.type==="wraith"){e.y+=e.speed*0.3*dt*0.06;
        if((e.phaseCD||0)>0){e.phaseCD-=dt;if(e.phaseCD<=0){e.phaseCD=0;fireEB(gs,e);}}
        else{e.phaseTimer=(e.phaseTimer||3500)-dt;if(e.phaseTimer<=0){e.phaseCD=500;e.x=rand(40,GW-40);e.y=rand(60,GH*0.35);e.phaseTimer=3500;}}}
      else if(e.type==="siren"){e.sineOff+=dt*0.002;e.x+=Math.sin(e.sineOff)*e.sineAmp*0.03*dt*0.06;e.y+=Math.cos(e.sineOff*0.5)*0.2*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
      else if(e.type==="fortress"){e.y+=e.speed*0.3*dt*0.06;e.shieldAngle=(e.shieldAngle||0)+0.015*dt*0.06;}
      else if(e.type==="reaper"){e.y+=e.speed*0.2*dt*0.06;const rdx=p.x-e.x;e.x+=Math.sign(rdx)*e.speed*0.3*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
      else{e.y+=e.speed*0.35*dt*0.06;}
      /* comeback: if enemy drifts too far down, steer back toward play area */
      if(e.type!=="bomber"&&e.type!=="boss"&&!e.entering&&e.y>GH*0.7){
        e.y-=e.speed*0.5*dt*0.06;
        if(e.y>GH*0.85)e.y-=e.speed*1.0*dt*0.06;
      }
      if(e.burnTimer>0){e.burnTimer-=dt;const burnTick=e.burnDmg*dt*0.001;e.hp-=burnTick;trackDmg(gs,"Flame Burn",burnTick);}
      if(e._elecTimer>0)e._elecTimer-=dt;
      if(!e.entering&&e.type!=="sniper"&&e.type!=="wraith"){e.fireTimer-=dt;if(e.fireTimer<=0&&e.pattern!=="none"){e.fireTimer=e.fireRate||2000;if(e.type==="boss")fireBoss(gs,e);else fireEB(gs,e);}}
    });

    if(has(gs,"slowfield")){const _sfR=hasAU(gs,"slowfield_sub1")?180:90;gs.eBullets.forEach(b=>{if(dist(b,p)<_sfR){const spd=Math.hypot(b.vx,b.vy);if(spd>0.8){b.vx*=0.993;b.vy*=0.993;}}});
      if(hasAU(gs,"slowfield_mastery")){gs.enemies.forEach(e=>{if(e.type==="bomber"&&dist(e,p)<_sfR){e._inTD=true;const a=ag(e,p);const cSpd=Math.hypot(Math.cos(a)*e.speed,Math.sin(a)*e.speed);if(cSpd>0.5){e._tdSlow=(e._tdSlow||0)+dt*0.001;e._tdSlow=Math.min(e._tdSlow,0.7);}e._tdBlue=Math.min(1,(e._tdBlue||0)+dt*0.0008);}else if(e.type==="bomber"){e._inTD=false;e._tdSlow=Math.max(0,(e._tdSlow||0)-dt*0.003);e._tdBlue=Math.max(0,(e._tdBlue||0)-dt*0.003);}});}
      if(hasAU(gs,"slowfield_sub2")){const _cyc=(gs.time%6000)/6000;let _mm;if(_cyc<0.25)_mm=1.25;else if(_cyc<0.5){const _t=(_cyc-0.25)/0.25;_mm=1.25-0.25*(0.5-0.5*Math.cos(_t*Math.PI));}else if(_cyc<0.75)_mm=1.0;else{const _t=(_cyc-0.75)/0.25;_mm=1.0+0.25*(0.5-0.5*Math.cos(_t*Math.PI));}gs._magnetMult=_mm;}else{gs._magnetMult=1;}}
    gs.pBullets.forEach(b=>{b.x+=b.vx*dt*0.06;b.y+=b.vy*dt*0.06;});
    gs.eBullets.forEach(b=>{b.x+=b.vx*dt*0.06;b.y+=b.vy*dt*0.06;
      if(b.homing){b.homingLife=(b.homingLife||0)-dt;if(b.homingLife>0){const ha=ag(b,p);const spd=Math.hypot(b.vx,b.vy)||1.8;b.vx+=(Math.cos(ha)*0.06)*dt*0.06;b.vy+=(Math.sin(ha)*0.06)*dt*0.06;const ns=Math.hypot(b.vx,b.vy);if(ns>spd*1.1){b.vx*=spd*1.1/ns;b.vy*=spd*1.1/ns;}}else{b.homing=false;}}
      if(b.mine){b.mineTimer-=dt;if(b.mineTimer<=0){const n=8;const bs2m=2.0;const mdmg=b.dmg*2;for(let i=0;i<n;i++){const ra=(PI2/n)*i;gs.eBullets.push({x:b.x,y:b.y,vx:Math.cos(ra)*bs2m,vy:Math.sin(ra)*bs2m,size:4,dmg:mdmg,src:"reaper"});}sp(gs,b.x,b.y,"#cc44ff",6,3);b.dmg=-1;b.vx=999;}}
    });
    gs.pBullets.forEach(b=>{if(b.bounces>0){if(b.y<=0){b.vy*=-1;b.damage*=0.8;b.bounces--;b._bounced=true;b.y=1;if(hasAU(gs,'ricochet_sub1')){const _off=(rand(-20,20))*Math.PI/180;const _sp=Math.hypot(b.vx,b.vy);const _a=Math.atan2(b.vy,b.vx)+_off;b.vx=Math.cos(_a)*_sp;b.vy=Math.sin(_a)*_sp;}}if(b.x<=0||b.x>=GW){if(b.bounces>0){b.vx*=-1;b.damage*=0.8;b.bounces--;b._bounced=true;b.x=clamp(b.x,1,GW-1);if(hasAU(gs,'ricochet_sub1')){const _off=(rand(-20,20))*Math.PI/180;const _sp=Math.hypot(b.vx,b.vy);const _a=Math.atan2(b.vy,b.vx)+_off;b.vx=Math.cos(_a)*_sp;b.vy=Math.sin(_a)*_sp;}}else{b.pierce=-1;}}}else if(b.bounces===0&&(b.x<=0||b.x>=GW)){b.pierce=-1;}});
    gs.pickups.forEach(pk=>{pk.life-=dt*0.06;pk.x+=pk.vx*dt*0.06;pk.y+=pk.vy*dt*0.06;pk.vx*=0.98;pk.vy*=0.98;if(!pk.golden){gs.gravWells.forEach(gw=>{if(gw.golden&&dist(pk,gw)<gw.r){pk.golden=true;pk.value=Math.ceil(pk.value*2);}});}const d=dist(pk,p);const _emr=p.magnetRange*(gs._magnetMult||1);if(d<_emr){const a=ag(pk,p);const pl=Math.max(3,(_emr-d)*0.1);pk.x+=Math.cos(a)*pl*dt*0.06;pk.y+=Math.sin(a)*pl*dt*0.06;}});
    gs.particles.forEach(pt=>{pt.x+=pt.vx*dt*0.06;pt.y+=pt.vy*dt*0.06;pt.life-=dt*0.06;pt.vx*=0.96;pt.vy*=0.96;});
    gs.pBullets=gs.pBullets.filter(b=>b.x>-10&&b.x<GW+10&&b.y>-10&&b.y<GH+10&&b.pierce>=0);
    gs.eBullets=gs.eBullets.filter(b=>b.x>-20&&b.x<GW+20&&b.y>-20&&b.y<GH+20);
    gs.particles=gs.particles.filter(pt=>pt.life>0);if(has(gs,"drone")&&hasAU(gs,"drone_mastery")){gs.pickups.forEach(pk=>{if(pk.life<=0&&!pk._counted){pk._counted=true;if(!gs._missed)gs._missed={};gs._missed[pk.type]=(gs._missed[pk.type]||0)+pk.value;}});}gs.pickups=gs.pickups.filter(pk=>pk.life>0);
    /* entity caps to prevent OOM at extreme waves */
    if(gs.eBullets.length>600)gs.eBullets=gs.eBullets.slice(-600);
    if(gs.particles.length>300)gs.particles=gs.particles.slice(-300);
    if(gs.enemies.length>80){gs.enemies=gs.enemies.slice(-80);gs.enemiesLeft=Math.min(gs.enemiesLeft,gs.enemies.length+gs.spawnQueue.length);}
    gs.hitTexts.forEach(ht=>{ht.life-=dt*0.06;ht.y-=0.8;});gs.hitTexts=gs.hitTexts.filter(ht=>ht.life>0);

    for(let i=gs.pBullets.length-1;i>=0;i--){const b=gs.pBullets[i];for(let j=gs.enemies.length-1;j>=0;j--){const e=gs.enemies[j];if(dist(b,e)<b.size+e.size){
      /* wraith invulnerable while phasing */
      if(e.type==="wraith"&&(e.phaseCD||0)>0){continue;}
      /* fortress shield deflects bullets from the shielded arc */
      if(e.type==="fortress"){const ba=Math.atan2(b.y-e.y,b.x-e.x);let da=ba-(e.shieldAngle||0);da=((da%PI2)+PI2)%PI2;if(da>Math.PI)da-=PI2;if(Math.abs(da)<0.9){sp(gs,b.x,b.y,"#55ccaa",3,2);gs.pBullets.splice(i,1);break;}}
      e.hp-=b.damage;trackDmg(gs,b.src==="rear"?"Rear Turret":b.src==="drone"?"Combat Drone":b.src==="mirror"?"Echo Clone":"Main Gun",b.damage);
      if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-8,8),y:e.y-e.size,text:Math.round(b.damage),life:24,ml:24,col:b.isCrit?"#ffff44":htcBase});
      if(b.acid>0){e.burnDmg=b.damage*0.1*b.acid;e.burnTimer=2000;}
      if(b.isChain){chainL(gs,e.x,e.y,b.damage);if(hasAU(gs,"chain_sub2")){const _eDmg=b.damage*0.6;e.hp-=_eDmg;trackDmg(gs,"Blue Chain Lightning",_eDmg);e._elecTimer=300;e._elecColor="#88ddff";sp(gs,e.x,e.y,"#88ddff",6,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-6,6),y:e.y-e.size,text:Math.round(_eDmg),life:22,ml:22,col:"#88ddff"});}}

      if(has(gs,"chain")&&hasAU(gs,"chain_mastery")&&(b.src==="drone"||b.src==="mirror")){const _gck="_gc"+b.src;gs[_gck]=(gs[_gck]||0)+1;if(gs[_gck]%3===0)greenChainL(gs,e.x,e.y,b.damage);}
      if(b.isCrit){sp(gs,e.x,e.y,"#ffff44",14,5);sp(gs,e.x,e.y,"#ffffff",8,3.5);gs.screenShake=Math.max(gs.screenShake,2.5);}
      b.pierce--;sp(gs,b.x,b.y,b.isCrit?"#ffff44":"#00e5ff",b.isCrit?4:2,2);
      if(b._bounced&&hasAU(gs,"ricochet_mastery")){const _sa=Math.atan2(b.vy,b.vx);const _sd=p.damage*2.5;gs._slices=(gs._slices||[]);gs._slices.push({x:e.x,y:e.y,a:_sa,life:18,ml:18,len:120});for(let _si=0;_si<8;_si++){const _soff=rand(-0.3,0.3);gs.particles.push({x:e.x+Math.cos(_sa+_soff)*rand(10,60),y:e.y+Math.sin(_sa+_soff)*rand(10,60),vx:Math.cos(_sa+_soff)*rand(1,3),vy:Math.sin(_sa+_soff)*rand(1,3),life:rand(12,25),ml:25,color:_si%2===0?"#ff4466":"#ffaa88",size:rand(2,4)});}
        e.hp-=_sd;trackDmg(gs,"Rage Slice",_sd);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-6,6),y:e.y-e.size,text:Math.round(_sd),life:24,ml:24,col:"#ff4466"});sp(gs,e.x,e.y,"#ff4466",4,3);
        gs.enemies.forEach((se,si)=>{if(se!==e){const _sx=e.x+Math.cos(_sa)*60,_sy=e.y+Math.sin(_sa)*60;if(dist(se,{x:_sx,y:_sy})<60+se.size){se.hp-=_sd;trackDmg(gs,"Rage Slice",_sd);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:se.x+rand(-6,6),y:se.y-se.size,text:Math.round(_sd),life:24,ml:24,col:"#ff4466"});sp(gs,se.x,se.y,"#ff4466",8,4);if(se.hp<=0)killE(gs,se,si);}}});}
      if(e.hp<=0){if((p.voidsiphonFlat||0)>0&&b.src==="main"&&b.isCrit){const healAmt=p.voidsiphonFlat;const _vsCap=p.maxHp*(has(gs,"overcharge")?(hasAU(gs,"overcharge_sub1")?1.4:1.2):1);const _vsH=Math.min(_vsCap-p.hp,healAmt);if(_vsH>0){p.hp+=_vsH;trackHeal(gs,"Void Siphon",_vsH);}sp(gs,p.x,p.y,"#44ff88",6,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:p.x,y:p.y-20,text:"+"+Math.round(healAmt),life:30,ml:30,col:"#44ff88"});}killE(gs,e,j);}if(b.pierce<0){gs.pBullets.splice(i,1);break;}}}}

    if(p.invTimer<=0&&p.phaseActive<=0){
      for(let i=gs.eBullets.length-1;i>=0;i--){if(dist(gs.eBullets[i],p)<gs.eBullets[i].size+p.size){
        const bul=gs.eBullets[i];const bdRaw=bul.dmg||(8+gs.wave*1.5);const bd=bdRaw*(1-(p.dmgReduction||0));const bSrc=bul.src||"unknown";gs.eBullets.splice(i,1);
        if(p.dodgeChance>0&&Math.random()<p.dodgeChance){/* halve damage instead of dodge */const _hd=bd*0.5;p.hp-=_hd;p.lastDmgTime=gs.time;gs.deathCause=bSrc.charAt(0).toUpperCase()+bSrc.slice(1);p.invTimer=400;gs.screenShake=3;sp(gs,p.x,p.y,"#aabbcc",4,2);if(p.hp<=0){/* let death handler below catch it */}break;}
        if(p.goldenShields>0){p.goldenShields--;p.lastDmgTime=gs.time;p.invTimer=650;sp(gs,p.x,p.y,"#ffcc44",10,4);gs.screenShake=4;gs._noDmgWave=false;
          if(has(gs,"blackhole")&&hasAU(gs,"blackhole_mastery")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&sn.telegraphing){sn.telegraphing=false;sn.teleTimer=sn.fireRate;}});}const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",10,4);gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}
        else if(p.shields>0){p.shields--;p.lastDmgTime=gs.time;sp(gs,p.x,p.y,"#44aaff",6,3);gs.screenShake=3;gs._noDmgWave=false;if(has(gs,"blackhole")&&hasAU(gs,"blackhole_mastery")){const _ehPct2=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a2,b2)=>(b2.src==="sniper"?1:0)-(a2.src==="sniper"?1:0));gs.enemies.forEach(sn2=>{if(sn2.type==="sniper"&&sn2.telegraphing){sn2.telegraphing=false;sn2.teleTimer=sn2.fireRate;}});}const rc2=Math.ceil(gs.eBullets.length*_ehPct2);gs.eBullets.splice(0,rc2);sp(gs,p.x,p.y,"#9944ff",10,4);gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}
        else{p.hp-=bd;p.lastDmgTime=gs.time;gs._noDmgWave=false;gs.deathCause=bSrc.charAt(0).toUpperCase()+bSrc.slice(1);p.invTimer=650;gs.screenShake=6;gs.flashTimer=70;sp(gs,p.x,p.y,"#ff3355",7,3);if(has(gs,"drone")&&hasAU(gs,"drone_sub1")){const _src=gs.enemies.find(en=>en.type===bSrc);if(_src)gs._droneRage=_src;}
          if(has(gs,"blackhole")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;
            if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&sn.telegraphing){sn.telegraphing=false;sn.teleTimer=sn.fireRate;}});}
            const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",14,5);gs.screenShake=9;gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}break;}}
      for(let i=gs.enemies.length-1;i>=0;i--){const e=gs.enemies[i];if(e.type==="bomber"&&dist(e,p)<e.size+p.size){const bd=(12+gs.wave*1.5)*(e.dM||1)*(1-(p.dmgReduction||0));killE(gs,e,i);if(p.shields>0){p.shields--;}else{p.hp-=bd;p.lastDmgTime=gs.time;gs.deathCause="Bomber explosion";p.invTimer=650;gs.flashTimer=70;}gs.screenShake=6;}}}

    for(let i=gs.pickups.length-1;i>=0;i--){if(dist(gs.pickups[i],p)<18){const pk=gs.pickups[i];gs[pk.type]=(gs[pk.type]||0)+pk.value;
      if(has(gs,"overcharge")){const cap=p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2);const _phealAmt=(pk.type==="plasma"&&hasAU(gs,"overcharge_sub2"))?6:3;const _oh=Math.min(cap-p.hp,_phealAmt);if(_oh>0){p.hp+=_oh;trackHeal(gs,"Overcharge",_oh);}}
      gs.pickups.splice(i,1);}}
    if(has(gs,"mirror")&&hasAU(gs,"mirror_sub2")){const mx=GW-p.x;for(let i=gs.pickups.length-1;i>=0;i--){if(dist(gs.pickups[i],{x:mx,y:p.y})<18){const pk=gs.pickups[i];gs[pk.type]=(gs[pk.type]||0)+pk.value;if(has(gs,"overcharge")){const cap=p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2);p.hp=Math.min(cap,p.hp+3);}gs.pickups.splice(i,1);}}}

    const pLen=gs.enemies.length;gs.enemies=gs.enemies.filter(e=>e.y<GH+200&&e.x>-200&&e.x<GW+200&&e.hp>0);
    const rem=pLen-gs.enemies.length;if(rem>0)gs.enemiesLeft=Math.max(0,gs.enemiesLeft-rem);

    if(p.hp<=0&&!gs.isTutorial){p.alive=false;sp(gs,p.x,p.y,"#00e5ff",22,5);gs.screenShake=16;
      if(gs.isPlayground){setTimeout(()=>setPhase("menu"),800);}
      else{const ee=Math.max(0,Math.floor(gs.wave*1.5+gs.kills*0.38+Math.pow(gs.wave,2.8)*0.065+Math.pow(gs.wave,1.8)*0.4)-(gs.kills===0&&gs.wave<=1?1:0));setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:ee,cause:gs.deathCause||"Unknown"});
      setMeta(prev=>{const nx={...prev,echoes:prev.echoes+ee,highWave:Math.max(prev.highWave||0,gs.wave)};saveMeta(nx);return nx;});
      try{const _hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");_hist.push({date:Date.now(),wave:gs.wave,kills:gs.kills,echoes:ee,cause:gs.deathCause||"Unknown",scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,forfeited:false,lifetimeEchoes:(meta.echoes||0)+ee});localStorage.setItem("vs4-history",JSON.stringify(_hist));}catch(e){}
      setTimeout(()=>setPhase("dead"),700);}}
    if(gs.isTutorial&&p.hp<=0){p.hp=1;p.invTimer=1200;gs.screenShake=8;gs.flashTimer=50;sp(gs,p.x,p.y,"#ffcc44",8,3);}
    if(gs.waveActive&&gs.enemiesLeft<=0&&gs.spawnQueue.length===0&&gs.enemies.length===0){
      /* wait for non-slow bullets to leave naturally; slow bullets (speed < 1.0, slowed by Temporal Drag) are excluded from the check */
      const activeBullets=gs.eBullets.filter(b=>!b.mine&&Math.hypot(b.vx,b.vy)>1.0);
      if(activeBullets.length===0){gs.eBullets=[];gs._novaMines=[];gs.waveActive=false;gs._waveEndTimer=1000;}
    }
    if(!gs.waveActive&&gs._waveEndTimer>0){gs._waveEndTimer-=dt;if(gs._waveEndTimer<=0){gs._waveEndTimer=0;if(has(gs,"drone")&&hasAU(gs,"drone_mastery")){gs.pickups.forEach(pk=>{if(!pk._counted){pk._counted=true;if(!gs._missed)gs._missed={};gs._missed[pk.type]=(gs._missed[pk.type]||0)+pk.value;}});}gs.pickups=[];
      if(gs.isPlayground){
        const pg=pgRef.current;
        if(pg&&pg.subWave===1&&pg.enemy!=="boss"){
          /* spawn 5 of same enemy */
          setPgMode({enemy:pg.enemy,subWave:2});
          gs.waveActive=true;gs.waveTotal=5;gs.enemiesLeft=5;gs.waveKilled=0;
          for(let i=0;i<5;i++)setTimeout(()=>{if(gsRef.current===gs)spawnE(gs,{type:pg.enemy});},i*400);
        } else {
          setTimeout(()=>setPhase("menu"),600);
        }
      }
      else if(gs.wave>0&&gs.wave%3===0){if(has(gs,"drone")&&hasAU(gs,"drone_mastery")&&gs._missed){const m=gs._missed;const gift={};["scrap","cores","plasma"].forEach(t=>{if(m[t]>0){const g=Math.ceil(m[t]/2);gift[t]=g;gs[t]+=g;}});gs._droneGift=Object.keys(gift).length>0?gift:{scrap:0,cores:0,plasma:0};gs._droneGiftShown=false;}gs._missed={};if(gs.isTutorial&&gs.wave===3)setTimeout(()=>setTutStep(5),350);setTimeout(()=>offerAb(gs),300);}
      else{if(has(gs,"drone")&&hasAU(gs,"drone_mastery")&&gs._missed){const m=gs._missed;const gift={};["scrap","cores","plasma"].forEach(t=>{if(m[t]>0){const g=Math.ceil(m[t]/2);gift[t]=g;gs[t]+=g;}});gs._droneGift=Object.keys(gift).length>0?gift:{scrap:0,cores:0,plasma:0};gs._droneGiftShown=false;}gs._missed={};
        if(gs.isTutorial){if(gs.wave===1){gs.scrap=Math.max(gs.scrap,20);setTutStep(3);}else if(gs.wave===5)setTutStep(7);}
        setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setTimeout(()=>setPhase("shop"),300);}}}
  }

  function render(){
    const gs=gsRef.current,canvas=canvasRef.current;if(!gs||!canvas)return;
    const ctx=canvas.getContext("2d");ctx.save();try{
    if(gs.screenShake>0)ctx.translate(rand(-gs.screenShake,gs.screenShake),rand(-gs.screenShake,gs.screenShake));
    ctx.fillStyle="#06060e";ctx.fillRect(-20,-20,GW+40,GH+40);
    gs.stars.forEach(s=>{ctx.globalAlpha=s.br+Math.sin(gs.time*0.002+s.x)*0.1;ctx.fillStyle="#8888cc";ctx.fillRect(s.x,s.y,s.sz,s.sz);});ctx.globalAlpha=1;
    if(gs._ehFlash>0){gs._ehFlash-=0.333;const ehT=1-gs._ehFlash/30;const ehMaxR=Math.max(GW,GH)*1.1;const ehR=ehT*ehMaxR;const ehA=Math.max(0,(gs._ehFlash/30)*0.22);const ehOx=gs._ehOriginX||gs.player.x;const ehOy=gs._ehOriginY||gs.player.y;ctx.strokeStyle=`rgba(60,15,90,${ehA})`;ctx.lineWidth=35*(1-ehT*0.6);ctx.beginPath();ctx.arc(ehOx,ehOy,ehR,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(80,25,120,${ehA*0.5})`;ctx.lineWidth=12*(1-ehT*0.5);ctx.beginPath();ctx.arc(ehOx,ehOy,ehR*0.7,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(40,8,60,${ehA*0.3})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(ehOx,ehOy,ehR*0.4,0,PI2);ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=1;}
    gs.gravWells.forEach(gw=>{const a=Math.min(0.6,gw.life/gw.ml*0.7);if(gw.conjoined)return;if(gw.golden){const _gt=gs.time*0.003;ctx.strokeStyle=`rgba(255,204,68,${a})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,220,100,${a*0.3})`;ctx.lineWidth=1.5;for(let _gi=0;_gi<3;_gi++){ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r*(0.3+_gi*0.2),_gt+_gi*1.5,_gt+_gi*1.5+1.2);ctx.stroke();}}else{ctx.strokeStyle=`rgba(153,68,255,${a})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(153,68,255,${a*0.5})`;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r*0.5,0,PI2);ctx.stroke();}ctx.globalAlpha=1;});/* conjoined wells: draw only the part outside parent radius */gs.gravWells.filter(gw=>gw.conjoined).forEach(gw=>{const a=Math.min(0.6,gw.life/gw.ml*0.7);const col=gw.golden?"rgba(255,204,68,":"rgba(153,68,255,";const _pd=dist(gw,{x:gw.parentX,y:gw.parentY});const _pr=110;if(_pd>0){const _clipA=Math.acos(clamp((_pd*_pd+gw.r*gw.r-_pr*_pr)/(2*_pd*gw.r),-1,1));const _baseA=Math.atan2(gw.parentY-gw.y,gw.parentX-gw.x);ctx.strokeStyle=col+a+")";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,_baseA+_clipA,_baseA-_clipA);ctx.stroke();}});ctx.globalAlpha=1;
    gs.novaRings.forEach(nr=>{const a=nr.life/nr.ml;if(nr.fire){ctx.strokeStyle=`rgba(255,102,34,${a*0.7})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,170,51,${a*0.3})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r*0.85,0,PI2);ctx.stroke();}else if(nr.collapse){ctx.strokeStyle=`rgba(220,100,220,${a*0.6})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r,0,PI2);ctx.stroke();}else{ctx.strokeStyle=`rgba(255,136,255,${a*0.7})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,136,255,${a*0.3})`;ctx.lineWidth=8;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r*0.95,0,PI2);ctx.stroke();}});
    if(gs._novaMines)gs._novaMines.forEach(nm=>{const _mp=0.5+Math.sin(gs.time*0.005)*0.2;const _mt=gs.time*0.003;ctx.globalAlpha=_mp;ctx.fillStyle="#1a0822";ctx.beginPath();ctx.arc(nm.x,nm.y,10,0,PI2);ctx.fill();ctx.strokeStyle="#ff88ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(nm.x,nm.y,10,0,PI2);ctx.stroke();ctx.fillStyle="#ff44cc";ctx.beginPath();ctx.arc(nm.x,nm.y,3.5,0,PI2);ctx.fill();for(let _mi=0;_mi<4;_mi++){const _ma=(PI2/4)*_mi+_mt;ctx.fillStyle="#cc44aa";ctx.beginPath();ctx.arc(nm.x+Math.cos(_ma)*6,nm.y+Math.sin(_ma)*6,1.8,0,PI2);ctx.fill();}ctx.strokeStyle="#ff44cc33";ctx.lineWidth=1;ctx.setLineDash([2,4]);ctx.beginPath();ctx.arc(nm.x,nm.y,30,0,PI2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;});
    gs.pickups.forEach(pk=>{const pl=1+Math.sin(gs.time*0.005+pk.x)*0.2;ctx.globalAlpha=Math.min(1,pk.life/50);ctx.fillStyle=CUR[pk.type]?.color||"#fff";ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl,0,PI2);ctx.fill();if(pk.golden){ctx.strokeStyle="rgba(255,204,68,0.5)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl+3+Math.sin(gs.time*0.008)*1.5,0,PI2);ctx.stroke();}ctx.globalAlpha=Math.min(0.2,pk.life/70);ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl*2,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle="#eee";ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.fillText(`+${pk.value}`,pk.x,pk.y-pk.size-3);});
    gs.particles.forEach(pt=>{ctx.globalAlpha=clamp(pt.life/pt.ml,0,1);ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.size*(pt.life/pt.ml),0,PI2);ctx.fill();});ctx.globalAlpha=1;
    if(has(gs,"slowfield")&&gs.player.alive){const px=gs.player.x,py=gs.player.y,t=gs.time*0.0008;const _sfRv=hasAU(gs,"slowfield_sub1")?180:90;
      ctx.strokeStyle="rgba(136,204,255,0.12)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(px,py,_sfRv,0,PI2);ctx.stroke();
      ctx.strokeStyle="rgba(136,204,255,0.08)";ctx.beginPath();ctx.arc(px,py,_sfRv*0.67,0,PI2);ctx.stroke();
      ctx.strokeStyle="rgba(150,220,255,0.3)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,_sfRv,t,t+0.8);ctx.stroke();
      ctx.strokeStyle="rgba(150,220,255,0.15)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,py,_sfRv,t+Math.PI,t+Math.PI+0.6);ctx.stroke();
    }
    gs.eBullets.forEach(b=>{if(b.mine){const mp=0.6+Math.sin((b.mineTimer||0)*0.003)*0.4;ctx.fillStyle="#cc44ff";ctx.shadowColor="#cc44ff";ctx.shadowBlur=8*mp;ctx.beginPath();ctx.arc(b.x,b.y,b.size*mp,0,PI2);ctx.fill();ctx.strokeStyle="#ff88ff44";ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y,b.size*1.5,0,PI2);ctx.stroke();}else{ctx.fillStyle=b.homing?"#ff55cc":b.size>6?"#ff4444":"#ffaa33";ctx.shadowColor=b.homing?"#ff55cc":"#ff4444";ctx.shadowBlur=5;ctx.beginPath();ctx.arc(b.x,b.y,b.size,0,PI2);ctx.fill();}});ctx.shadowBlur=0;
    const scc=(gs.shipCol||{color:"#00e5ff"}).color;
    const bcc=gs.bulCol||scc;
    gs.pBullets.forEach(b=>{ctx.fillStyle=b.isCrit?"#ffff44":bcc;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(b.x,b.y,b.size,0,PI2);ctx.fill();});ctx.shadowBlur=0;
    gs.homingMissiles.forEach(m=>{const _mc=m.isCrit?"#ffff44":bcc;ctx.fillStyle=_mc;ctx.shadowColor=_mc;ctx.shadowBlur=m.isCrit?8:5;ctx.save();ctx.translate(m.x,m.y);const ma=Math.atan2(m.vy||0,m.vx||0);ctx.rotate(ma);ctx.beginPath();ctx.ellipse(0,0,m.size*2.5,m.size*0.8,0,0,PI2);ctx.fill();ctx.restore();});ctx.shadowBlur=0;
    gs.enemies.forEach(e=>{const _eCol=(e.type==="bomber"&&(e._tdBlue||0)>0)?`rgba(${Math.round(255*(1-e._tdBlue)+68*e._tdBlue)},${Math.round(204*(1-e._tdBlue)+170*e._tdBlue)},${Math.round(68*(1-e._tdBlue)+255*e._tdBlue)},1)`:e.color;drawShape(ctx,e.type,e.x,e.y,e.size,_eCol,gs.time,e);
      if(e.burnTimer>0&&e.type!=="boss"){const ft=gs.time*0.01;const _fc=["#cc2200","#ff4411","#ff6622","#ff8833","#ffaa33","#ffcc44"];for(let fi=0;fi<3;fi++){const fa=ft+fi*2.1;const fx=e.x+Math.sin(fa)*e.size*0.6;const fy=e.y-e.size*0.3+Math.sin(fa*1.3)*e.size*0.4;const fs=2+Math.sin(fa*0.7)*1.5;ctx.globalAlpha=0.55+Math.sin(fa*1.5)*0.2;const ci=Math.floor(Math.abs(Math.sin(fa*0.5))*(_fc.length-1));ctx.fillStyle=_fc[ci];ctx.beginPath();ctx.moveTo(fx,fy-fs*1.6);ctx.bezierCurveTo(fx-fs*0.8,fy-fs*0.5,fx-fs*0.6,fy+fs*0.5,fx,fy+fs*0.3);ctx.bezierCurveTo(fx+fs*0.6,fy+fs*0.5,fx+fs*0.8,fy-fs*0.5,fx,fy-fs*1.6);ctx.fill();}ctx.globalAlpha=1;}
      if((e._elecTimer||0)>0){const _ea=Math.min(1,e._elecTimer/300);const _ec=e._elecColor||"#88ddff";ctx.globalAlpha=_ea*0.8;ctx.strokeStyle=_ec;ctx.shadowColor=_ec;ctx.shadowBlur=6;ctx.lineWidth=1.5;for(let _li=0;_li<4;_li++){const _la=(PI2/4)*_li+gs.time*0.012;const _lx1=e.x+Math.cos(_la)*e.size*0.4;const _ly1=e.y+Math.sin(_la)*e.size*0.4;const _lx2=e.x+Math.cos(_la)*e.size*1.3;const _ly2=e.y+Math.sin(_la)*e.size*1.3;const _mx=(_lx1+_lx2)/2+(Math.sin(gs.time*0.05+_li)*5);const _my=(_ly1+_ly2)/2+(Math.cos(gs.time*0.05+_li)*5);ctx.beginPath();ctx.moveTo(_lx1,_ly1);ctx.lineTo(_mx,_my);ctx.lineTo(_lx2,_ly2);ctx.stroke();}ctx.shadowBlur=0;ctx.globalAlpha=1;}
      if(e.type==="boss"){const hp=e.hp/e.maxHp;ctx.fillStyle="#220011";ctx.fillRect(e.x-30,e.y-e.size-14,60,6);ctx.fillStyle=hp>0.5?"#ff2266":"#ff0033";ctx.fillRect(e.x-30,e.y-e.size-14,60*hp,6);}
    });
    if(has(gs,"orbitals")){const _iRr=hasAU(gs,"orbitals_mastery")?32:36;gs.orbitals.forEach(o=>{let ox,oy;if(o.layer===1){ox=gs.player.x+Math.cos(o.angle)*190;oy=gs.player.y+Math.sin(o.angle)*48;}else{ox=gs.player.x+Math.cos(o.angle)*_iRr;oy=gs.player.y+Math.sin(o.angle)*_iRr;}ctx.fillStyle="#00e5ff";ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(ox,oy,5,0,PI2);ctx.fill();ctx.globalAlpha=0.2;ctx.beginPath();ctx.arc(ox,oy,9,0,PI2);ctx.fill();ctx.globalAlpha=1;});}
    gs.drones.forEach(dr=>{ctx.fillStyle=scc;ctx.fillRect(dr.x-4,dr.y-4,8,8);ctx.strokeStyle=scc+"44";ctx.lineWidth=1;ctx.strokeRect(dr.x-6,dr.y-6,12,12);if(gs._droneRage){ctx.fillStyle="#ff4444";ctx.globalAlpha=0.5+Math.sin(gs.time*0.015)*0.2;for(let _fi=0;_fi<5;_fi++){const _fa=gs.time*0.007+_fi*1.3;ctx.beginPath();ctx.arc(dr.x+Math.sin(_fa)*6,dr.y-7-Math.abs(Math.sin(_fa*1.3))*8,2.5+Math.sin(_fa)*1,0,PI2);ctx.fill();}ctx.globalAlpha=1;}});if(gs._droneRage&&gs.enemies.includes(gs._droneRage)){const _dt=gs._droneRage;ctx.strokeStyle="#ff444466";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(_dt.x,_dt.y,_dt.size+4,0,PI2);ctx.stroke();ctx.strokeStyle="#ff222244";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(_dt.x-_dt.size*0.7,_dt.y);ctx.lineTo(_dt.x+_dt.size*0.7,_dt.y);ctx.stroke();ctx.beginPath();ctx.moveTo(_dt.x,_dt.y-_dt.size*0.7);ctx.lineTo(_dt.x,_dt.y+_dt.size*0.7);ctx.stroke();ctx.fillStyle="#ff333344";ctx.beginPath();ctx.arc(_dt.x,_dt.y,3,0,PI2);ctx.fill();ctx.globalAlpha=1;}
    if(has(gs,"homing")&&gs.player.alive){const hx=lerp(gs._seekerX||gs.player.x,gs.player.x-20,0.04);const hy=lerp(gs._seekerY||gs.player.y,gs.player.y+18,0.04);gs._seekerX=hx;gs._seekerY=hy;ctx.fillStyle=scc;ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(hx,hy,5,0,PI2);ctx.fill();ctx.strokeStyle=scc+"44";ctx.lineWidth=1;ctx.beginPath();ctx.arc(hx,hy,7,0,PI2);ctx.stroke();ctx.globalAlpha=1;}

    const p=gs.player;
    if(p.alive){const blink=p.invTimer>0&&Math.floor(p.invTimer/40)%2===0;const sc=gs.shipCol||{color:"#00e5ff",glow:"#00e5ff"};if(!blink){
      ctx.shadowColor=sc.glow;ctx.shadowBlur=10;ctx.fillStyle=sc.color;
      ctx.beginPath();ctx.moveTo(p.x,p.y-p.size-4);ctx.lineTo(p.x-p.size,p.y+p.size);ctx.lineTo(p.x,p.y+p.size*0.4);ctx.lineTo(p.x+p.size,p.y+p.size);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
      if(p.goldenShields>0){ctx.strokeStyle=`rgba(255,204,68,${0.5+Math.sin(gs.time*0.004)*0.2})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.size+10,0,PI2);ctx.stroke();}if(p.shields>0){ctx.strokeStyle=`rgba(68,170,255,${0.55+Math.sin(gs.time*0.004)*0.2})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,p.size+7,0,PI2);ctx.stroke();}
      if(has(gs,"void_regen")&&gs._vrPlus&&gs._vrPlus.length>0){const _px=gs.player.x,_py=gs.player.y;gs._vrPlus.forEach(v=>{const vx=_px+v.ox,vy=_py+v.oy;const va=clamp(v.life/v.ml,0,1);ctx.globalAlpha=va*0.85;ctx.strokeStyle="rgba(180,110,255,0.95)";ctx.shadowColor="#aa66ff";ctx.shadowBlur=6;ctx.lineWidth=1.8;const vs=v.sz*va;ctx.beginPath();ctx.moveTo(vx-vs,vy);ctx.lineTo(vx+vs,vy);ctx.stroke();ctx.beginPath();ctx.moveTo(vx,vy-vs);ctx.lineTo(vx,vy+vs);ctx.stroke();ctx.shadowBlur=0;});ctx.globalAlpha=1;}
      if(gs.showMagnetRange){const _mrv=p.magnetRange*(gs._magnetMult||1);ctx.strokeStyle="rgba(68,255,136,0.18)";ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(p.x,p.y,_mrv,0,PI2);ctx.stroke();ctx.setLineDash([]);}
      ctx.fillStyle=sc.color;ctx.globalAlpha=0.25;ctx.beginPath();ctx.arc(p.x,p.y+p.size+4,3.5+Math.sin(gs.time*0.008)*2,0,PI2);ctx.fill();ctx.globalAlpha=1;}
      if(has(gs,"mirror")&&!blink){ctx.globalAlpha=0.25;ctx.fillStyle="#aa88ff";const mx=GW-p.x;ctx.beginPath();ctx.moveTo(mx,p.y-p.size-4);ctx.lineTo(mx-p.size,p.y+p.size);ctx.lineTo(mx,p.y+p.size*0.4);ctx.lineTo(mx+p.size,p.y+p.size);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
      if(gs._lasso){const L=gs._lasso;if(L.phase==="windup"){const wt=1-L.timer/2000;const _sp=L._spin||0;ctx.globalAlpha=0.3+wt*0.5;ctx.strokeStyle="#aa88ff";ctx.lineWidth=2;const _lr=15+wt*20;for(let _ri=0;_ri<2;_ri++){const _ra=_sp+_ri*Math.PI;ctx.beginPath();ctx.arc(GW-p.x+Math.cos(_ra)*_lr,p.y+Math.sin(_ra)*_lr*0.4,4,0,PI2);ctx.stroke();}ctx.globalAlpha=0.15;ctx.beginPath();ctx.ellipse(GW-p.x,p.y,_lr,_lr*0.4,0,0,PI2);ctx.stroke();}else if(L.phase==="launch"||L.phase==="capture"){ctx.globalAlpha=0.3;ctx.strokeStyle="#aa88ff";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(GW-p.x,p.y);ctx.lineTo(L.x,L.y);ctx.stroke();ctx.globalAlpha=L.phase==="capture"?0.2:0.35;ctx.strokeStyle="#bb99ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(L.x,L.y,L.pushR,0,PI2);ctx.stroke();ctx.fillStyle="#aa88ff";ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(L.x,L.y,6,0,PI2);ctx.fill();if(L.phase==="capture"&&L.captured){L.captured.forEach((ce,ci)=>{if(!gs.enemies.includes(ce))return;const _qt=gs.time*0.004+ci*1.5;for(let _qi=0;_qi<3;_qi++){const _qp=(_qt+_qi*1.2)%3;const _qy=ce.y-ce.size-_qp*8;const _qx=ce.x+Math.sin(_qt+_qi*2)*8;const _qa=clamp(1-_qp/3,0,0.7);ctx.globalAlpha=_qa*0.85;ctx.strokeStyle="rgba(180,110,255,0.95)";ctx.shadowColor="#aa66ff";ctx.shadowBlur=4;ctx.font="bold 9px monospace";ctx.textAlign="center";ctx.fillStyle="rgba(220,160,255,1)";ctx.fillText("?",_qx,_qy);}ctx.shadowBlur=0;});}}ctx.globalAlpha=1;}}}
    /* hit texts */
    gs.hitTexts.forEach(ht=>{ctx.globalAlpha=clamp(ht.life/ht.ml,0,1);ctx.fillStyle=ht.col;ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.fillText(ht.text,ht.x,ht.y);});ctx.globalAlpha=1;
    if(gs._slices){gs._slices.forEach(sl=>{sl.life-=1;const _a=clamp(sl.life/sl.ml,0,1);ctx.globalAlpha=_a;ctx.strokeStyle="#ff4466";ctx.shadowColor="#ff2244";ctx.shadowBlur=16;ctx.lineWidth=8*_a;ctx.beginPath();ctx.moveTo(sl.x-Math.cos(sl.a)*sl.len*0.2,sl.y-Math.sin(sl.a)*sl.len*0.2);ctx.lineTo(sl.x+Math.cos(sl.a)*sl.len*0.8,sl.y+Math.sin(sl.a)*sl.len*0.8);ctx.stroke();ctx.strokeStyle="#ffaa88";ctx.lineWidth=1.5*_a;ctx.beginPath();ctx.moveTo(sl.x,sl.y);ctx.lineTo(sl.x+Math.cos(sl.a)*sl.len*0.6,sl.y+Math.sin(sl.a)*sl.len*0.6);ctx.stroke();ctx.shadowBlur=0;});gs._slices=gs._slices.filter(sl=>sl.life>0);ctx.globalAlpha=1;}
    if(gs.flashTimer>0){ctx.fillStyle=`rgba(255,50,80,${gs.flashTimer/140})`;ctx.fillRect(-20,-20,GW+40,GH+40);}
    if(metaRef.current.showFps){const _f=fpsRef.current;_f.frames++;const _now=performance.now();if(_now-_f.last>=1000){_f.fps=_f.frames;_f.frames=0;_f.last=_now;}ctx.fillStyle="#667788";ctx.font="9px monospace";ctx.textAlign="right";ctx.fillText(_f.fps+" FPS",GW-14,GH-10);}

    /* HUD */
    ctx.shadowBlur=0;const isOC=p.hp>p.maxHp;
    const baseW=170;const _hasOC=has(gs,"overcharge");const _ocCap=_hasOC?(hasAU(gs,"overcharge_sub1")?1.4:1.2):1;const _ocTotal=p.maxHp*_ocCap;
    ctx.fillStyle="#1a0a10";ctx.fillRect(14,14,baseW,14);
    if(_hasOC&&_ocCap>1){/* overcharge bar: scale to full cap */const _redW=baseW*(Math.min(p.hp,p.maxHp)/_ocTotal);ctx.fillStyle=(p.hp/p.maxHp)>0.3?"#ff3355":"#ff1133";ctx.fillRect(14,14,_redW,14);if(p.hp>p.maxHp){const _pStart=baseW*(p.maxHp/_ocTotal);const _pEnd=baseW*(Math.min(p.hp,_ocTotal)/_ocTotal);ctx.fillStyle="#9955cc";ctx.fillRect(14+_pStart,14,_pEnd-_pStart,14);}
      ctx.strokeStyle="#ffffffbb";ctx.lineWidth=2.5;const _100mark=baseW*(p.maxHp/_ocTotal);ctx.beginPath();ctx.moveTo(14+_100mark,14);ctx.lineTo(14+_100mark,28);ctx.stroke();
      if(hasAU(gs,"overcharge_mastery")){const _115mark=baseW*(p.maxHp*1.1/_ocTotal);ctx.strokeStyle="#44ddcc88";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14+_115mark,14);ctx.lineTo(14+_115mark,28);ctx.stroke();}
    } else {const hpPct=Math.max(0,p.hp/p.maxHp);ctx.fillStyle=hpPct>0.3?"#ff3355":"#ff1133";ctx.fillRect(14,14,baseW*hpPct,14);}
    ctx.strokeStyle="#ff335544";ctx.lineWidth=1;ctx.strokeRect(14,14,baseW,14);
    ctx.fillStyle="#fff";ctx.font="bold 10px monospace";ctx.textAlign="left";
    ctx.fillText(`HP ${Math.min(Math.ceil(p.hp),p.maxHp)}/${p.maxHp}${isOC?" +"+Math.ceil(p.hp-p.maxHp):""}`,18,25);if(has(gs,"void_regen")){const _vrWin2=hasAU(gs,"void_regen_sub2")&&gs.waveKilled>0?2500:4000;const _vrElapsed=gs.time-p.lastDmgTime;const _vrPct=clamp(_vrElapsed/_vrWin2,0,1);ctx.fillStyle="#1a0a20";ctx.fillRect(14,30,baseW,3);ctx.fillStyle=_vrPct>=1?"#aa66ff":"#6633aa";ctx.fillRect(14,30,baseW*_vrPct,3);}
    ctx.font="10px monospace";ctx.fillStyle="#99aabb";
    if(gs.isPlayground&&!gs.isPractise){const pg=pgRef.current;ctx.fillStyle="#55aa88";ctx.fillText(`PLAYGROUND: ${pg?pg.enemy.toUpperCase():""} · ${pg?.subWave===1?"Solo":"×5"} · ${gs.enemies.length} alive`,14,42);}
    else if(gs.isPractise){ctx.fillStyle="#cc8844";ctx.fillText(`PRACTISE: WAVE ${gs.wave}  ·  ${gs.waveKilled}/${gs.waveTotal} killed  ·  ${gs.enemies.length} alive`,14,42);}
    else if(gs.isTutorial){ctx.fillStyle="#ffcc44";ctx.fillText(`TUTORIAL · WAVE ${gs.wave}  ·  ${gs.waveKilled}/${gs.waveTotal} killed  ·  ${gs.enemies.length} alive`,14,42);}
    else ctx.fillText(`WAVE ${gs.wave}  ·  ${gs.waveKilled}/${gs.waveTotal} killed  ·  ${gs.enemies.length} alive`,14,42);
    const rawHp=Math.round(BASE_HP*hpScale(gs.wave));const rawDmg=Math.round((7+gs.wave*1.8)*dmgScale(gs.wave)*0.35);
    ctx.fillStyle="#88aacc";ctx.font="9px monospace";ctx.fillText(`Base HP: ${rawHp}  ·  Base Dmg: ${rawDmg}`,14,54);
    if(p.shields>0||p.goldenShields>0){ctx.font="10px monospace";let _shX=14;if(p.shields>0){ctx.fillStyle="#66bbff";ctx.fillText(`🛡×${p.shields}`,_shX,66);_shX+=50;}if(p.goldenShields>0){ctx.fillStyle="#ffcc44";ctx.fillText(`🛡×${p.goldenShields}`,_shX,66);}}
    ctx.textAlign="right";ctx.font="bold 12px monospace";
    ctx.fillStyle=CUR.scrap.color;ctx.fillText(`⬡ ${gs.scrap}`,GW-14,24);
    ctx.fillStyle=CUR.cores.color;ctx.fillText(`◆ ${gs.cores}`,GW-14,40);
    ctx.fillStyle=CUR.plasma.color;ctx.fillText(`✦ ${gs.plasma}`,GW-14,56);
    if(p.abilities.length>0){p.abilities.forEach((id,i)=>{const ab=ABILITIES.find(a=>a.id===id);if(ab){drawAbIcon(ctx,id,20+i*22,GH-14,20,"#bbccdd");}});}
    /* new enemy notification */
    if(gs.newEnemyNotif){const nn=gs.newEnemyNotif;const na=Math.min(1,nn.timer/30);const name=nn.type.charAt(0).toUpperCase()+nn.type.slice(1);
      ctx.globalAlpha=na;ctx.fillStyle="rgba(6,6,14,0.7)";ctx.fillRect(GW/2-80,68,160,26);ctx.strokeStyle="#ffcc4466";ctx.lineWidth=1;ctx.strokeRect(GW/2-80,68,160,26);
      ctx.fillStyle="#ffcc44";ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.fillText(`NEW: ${name}`,GW/2+8,85);
      /* mini enemy icon */const ed=ED[nn.type];if(ed){ctx.save();ctx.translate(GW/2-65,81);drawShape(ctx,nn.type,0,0,8,ed.col,gs.time,{});ctx.restore();}
      else if(nn.type==="boss"){ctx.save();ctx.translate(GW/2-65,81);drawShape(ctx,"boss",0,0,8,"#ff2266",gs.time,{});ctx.restore();}
      ctx.globalAlpha=1;}
    }finally{ctx.restore();}
  }

  useEffect(()=>{const loop=t=>{const dt=Math.min(t-ltRef.current,50);ltRef.current=t;try{if(phRef.current==="playing"&&!pausedRef.current)update(dt);render();}catch(e){console.error("Game loop error:",e);}rafRef.current=requestAnimationFrame(loop);};rafRef.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rafRef.current);},[]);
  useEffect(()=>{const d=e=>{keysRef.current[e.key.toLowerCase()]=true;if(e.key===" ")e.preventDefault();};const u=e=>{keysRef.current[e.key.toLowerCase()]=false;};window.addEventListener("keydown",d);window.addEventListener("keyup",u);return()=>{window.removeEventListener("keydown",d);window.removeEventListener("keyup",u);};},[]);
  useEffect(()=>{const h=e=>{
    const k=e.key.toLowerCase();
    /* I keybind removed — codex available via pause menu */
    if((k==="p"||k==="escape")&&phRef.current==="playing"){
      if(wikiRef.current){setShowWiki(false);setShowStats(false);}
      else{setPaused(p=>!p);setShowStats(false);}
    }
  };window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);

  function buyShop(uid){const gs=gsRef.current;if(!gs)return;if(gs.isTutorial&&(tutRef.current===3||tutRef.current===4)&&uid!=="maxhp")return;const up=SHOP.find(u=>u.id===uid);if(up.wave>gs.wave)return;const lvl=gs.upgrades[uid]||0;if(lvl>=up.max)return;const cost=Math.ceil(up.base*Math.pow(1+lvl*up.scale,up.exp));if(gs[up.cur]<cost)return;gs[up.cur]-=cost;gs.upgrades[uid]=lvl+1;const _hpBefore=gs.player.hp;up.fn(gs.player);if(uid==="maxhp"){const _healed=gs.player.hp-_hpBefore;if(_healed>0)trackHeal(gs,"Hull Plating",_healed);if(gs.isTutorial&&tutRef.current<=4)setTutStep(45);}setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});}
  function cont(){setPhase("playing");const gs=gsRef.current;if(gs)startWave(gs);}
  function calcEchoes(gs){const w=gs?.wave||0,k=gs?.kills||0;return Math.max(0,Math.floor(w*1.5+k*0.38+Math.pow(w,2.8)*0.065+Math.pow(w,1.8)*0.4)-(k===0&&w<=1?1:0));}
  function forfeit(){const gs=gsRef.current;if(!gs)return;if(gs.isTutorial){const ee=calcEchoes(gs);gs.player.alive=false;const tutEchoes=Math.max(ee,50);setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:tutEchoes,cause:"Tutorial"});setMeta(prev=>{const nx={...prev,echoes:prev.echoes+tutEchoes,highWave:Math.max(prev.highWave||0,gs.wave)};saveMeta(nx);return nx;});setTutStep(8);setConfirmForfeit(false);setPhase("dead");return;}if(gs.isPlayground){gs.player.alive=false;setPhase("menu");return;}const ee=calcEchoes(gs);gs.player.alive=false;setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:ee,cause:"Self"});setMeta(prev=>{const nx={...prev,echoes:prev.echoes+ee,highWave:Math.max(prev.highWave||0,gs.wave)};saveMeta(nx);return nx;});
      try{const _hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");_hist.push({date:Date.now(),wave:gs.wave,kills:gs.kills,echoes:ee,cause:"Forfeited",scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,forfeited:true,lifetimeEchoes:(meta.echoes||0)+ee});localStorage.setItem("vs4-history",JSON.stringify(_hist));}catch(e){}
      setConfirmForfeit(false);setPhase("dead");}
  function buyMeta(uid){if(tutRef.current===10&&uid!=="m_dmg")return;const up=META.find(u=>u.id===uid);const tier=meta.metaTier||1;const lvl=meta.levels[uid]||0;const mx=up.max*tier;if(lvl>=mx)return;const cost=metaCost(up,lvl,tier);if(meta.echoes<cost)return;setMeta(prev=>{const nx={...prev,echoes:prev.echoes-cost,levels:{...prev.levels,[uid]:lvl+1}};saveMeta(nx);return nx;});}
  function buyTier(){const tier=meta.metaTier||1;if(tier>=3)return;const allMaxed=META.every(up=>(meta.levels[up.id]||0)>=up.max*tier);const tierCost=tier===1?800:25000;if(!allMaxed||meta.echoes<tierCost)return;setMeta(prev=>{const nx={...prev,echoes:prev.echoes-tierCost,metaTier:(prev.metaTier||1)+1};saveMeta(nx);return nx;});}

  const bs2=(c)=>({padding:"10px 28px",background:"transparent",border:`2px solid ${c}`,color:c,fontSize:14,fontFamily:"inherit",cursor:"pointer",letterSpacing:2,transition:"all 0.2s"});
  const hv=c=>({onMouseOver:e=>{e.target.style.background=c;e.target.style.color="#06060e";},onMouseOut:e=>{e.target.style.background="transparent";e.target.style.color=c;}});
  const sc2=typeof window!=="undefined"?Math.min((window.innerWidth-32)/GW,(window.innerHeight-32)/GH,1):1;

  /* Codex enemy shape renderer */
  const EnemyIcon=({type,size})=>{
    const ref=useRef(null);
    useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext("2d");ctx.clearRect(0,0,size,size);
      const ed=ED[type];if(ed)drawShape(ctx,type,size/2,size/2,size*0.35,ed.col,0,{});
      else if(type==="boss")drawShape(ctx,"boss",size/2,size/2,size*0.35,"#ff2266",0,{});
    },[type,size]);
    return <canvas ref={ref} width={size} height={size} style={{width:size,height:size,flexShrink:0}} />;
  };

  const AbilityIcon=({id,size,color})=>{
    const c=color||"#ccddee";const s=size;const sw=Math.max(1,s*0.06);
    const paths={
      orbitals:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2.5" fill={c}/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(20 12 12)" stroke={c} strokeWidth={sw} opacity="0.5"/><circle cx="5" cy="10" r="1.5" fill={c}/><circle cx="19" cy="14" r="1.5" fill={c}/></svg>,
      chain:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 2L13 9L9 10.5L14 19" stroke={c} strokeWidth={sw*1.6} strokeLinecap="round" strokeLinejoin="round"/><path d="M13 9L18 12" stroke={c} strokeWidth={sw} strokeLinecap="round" opacity="0.6"/><path d="M9 10.5L5 14" stroke={c} strokeWidth={sw} strokeLinecap="round" opacity="0.6"/><circle cx="14" cy="19" r="1.5" fill={c} opacity="0.7"/><circle cx="18" cy="12" r="1" fill={c} opacity="0.5"/><circle cx="5" cy="14" r="1" fill={c} opacity="0.5"/></svg>,
      homing:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="7" stroke={c} strokeWidth={sw}/><line x1="12" y1="2" x2="12" y2="7" stroke={c} strokeWidth={sw}/><line x1="12" y1="17" x2="12" y2="22" stroke={c} strokeWidth={sw}/><line x1="2" y1="12" x2="7" y2="12" stroke={c} strokeWidth={sw}/><line x1="17" y1="12" x2="22" y2="12" stroke={c} strokeWidth={sw}/><circle cx="12" cy="12" r="1.5" fill={c}/></svg>,
      nova:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">{[0,45,90,135,180,225,270,315].map(a=><line key={a} x1={12+Math.cos(a*Math.PI/180)*2.5} y1={12+Math.sin(a*Math.PI/180)*2.5} x2={12+Math.cos(a*Math.PI/180)*10} y2={12+Math.sin(a*Math.PI/180)*10} stroke={c} strokeWidth={sw} strokeLinecap="round"/>)}<circle cx="12" cy="12" r="2.5" fill={c}/></svg>,
      slowfield:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3H17L13 12L17 21H7L11 12Z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><line x1="6" y1="3" x2="18" y2="3" stroke={c} strokeWidth={sw} strokeLinecap="round"/><line x1="6" y1="21" x2="18" y2="21" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>,
      mirror:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5L5 18L8 14L11 18Z" fill={c} opacity="0.35"/><path d="M16 5L13 18L16 14L19 18Z" fill={c}/><line x1="12" y1="4" x2="12" y2="20" stroke={c} strokeWidth={sw*0.7} strokeDasharray="2 2" opacity="0.3"/></svg>,
      ricochet:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="4" x2="21" y2="4" stroke={c} strokeWidth={sw} opacity="0.3"/><path d="M6 18L12 7L18 18" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/><path d="M12 7L14 3" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>,
      drone:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="9" width="8" height="8" fill={c} rx="1"/><rect x="6" y="7" width="12" height="12" stroke={c} strokeWidth={sw} rx="1" opacity="0.4"/><line x1="12" y1="7" x2="12" y2="3" stroke={c} strokeWidth={sw}/><circle cx="12" cy="3" r="1" fill={c}/></svg>,
      gravity:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d={"M12 12 "+Array.from({length:50},(_,i)=>{const t=i/50*Math.PI*4;const r=1.5+i/50*9;return `${12+Math.cos(t)*r} ${12+Math.sin(t)*r}`;}).join(" L ")} stroke={c} strokeWidth={sw} fill="none"/></svg>,
      overcharge:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L20 12L12 21L4 12Z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="16" stroke={c} strokeWidth={sw*1.4} strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke={c} strokeWidth={sw*1.4} strokeLinecap="round"/></svg>,
      blackhole:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3.5" fill={c} opacity="0.15"/><circle cx="12" cy="12" r="3.5" stroke={c} strokeWidth={sw*0.7} opacity="0.6"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke={c} strokeWidth={sw*1.2} opacity="0.7"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" stroke={c} strokeWidth={sw*0.8} opacity="0.35"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)" stroke={c} strokeWidth={sw*0.8} opacity="0.35"/><circle cx="12" cy="12" r="1.5" fill={c} opacity="0.5"/></svg>,
      void_regen:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20C12 20 4 14 4 9C4 6 6 4 8.5 4C10 4 11.2 5 12 6C12.8 5 14 4 15.5 4C18 4 20 6 20 9C20 14 12 20 12 20Z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><line x1="12" y1="10" x2="12" y2="16" stroke={c} strokeWidth={sw*0.9} strokeLinecap="round"/><line x1="9" y1="13" x2="15" y2="13" stroke={c} strokeWidth={sw*0.9} strokeLinecap="round"/></svg>,
    };
    return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:s,height:s,flexShrink:0}}>{paths[id]||<svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke={c} strokeWidth={sw} fill="none"/></svg>}</span>;
  };

  const ShipDisplay=({onClick,size=60})=>{
    const ref=useRef(null);const sc=shipCol();
    useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext("2d");ctx.clearRect(0,0,size,size);
      const s=size*0.3;const cx=size/2,cy=size/2;
      ctx.shadowColor=sc.glow;ctx.shadowBlur=10;ctx.fillStyle=sc.color;
      ctx.beginPath();ctx.moveTo(cx,cy-s-3);ctx.lineTo(cx-s,cy+s);ctx.lineTo(cx,cy+s*0.4);ctx.lineTo(cx+s,cy+s);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle=sc.color;ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(cx,cy+s+3,3,0,PI2);ctx.fill();ctx.globalAlpha=1;
    },[size,sc]);
    return <canvas ref={ref} width={size} height={size} onClick={onClick} style={{width:size,height:size,cursor:"pointer",borderRadius:"50%",border:`1px solid ${sc.color}22`,transition:"all 0.2s"}}
      onMouseOver={e=>e.currentTarget.style.borderColor=sc.color+"66"} onMouseOut={e=>e.currentTarget.style.borderColor=sc.color+"22"} />;
  };

  const MenuBG=()=>{
    const bgRef=useRef(null);const bgStars=useRef(null);const bgNebula=useRef(null);const bgDebris=useRef(null);const bgTime=useRef(0);const bgRaf=useRef(null);
    useEffect(()=>{
      if(!bgStars.current){
        bgStars.current=[];
        for(let i=0;i<160;i++)bgStars.current.push({x:rand(0,GW),y:rand(0,GH),sz:rand(0.3,2.2),sp:rand(0.08,0.4),br:rand(0.15,0.85),pulse:rand(0,6.28),pulseSpd:rand(0.001,0.003),layer:i<40?0:i<100?1:2});
        for(let i=0;i<12;i++){let bx,by;do{bx=rand(0,GW);by=rand(0,GH);}while(bx>GW*0.2&&bx<GW*0.8&&by>GH*0.15&&by<GH*0.85);bgStars.current.push({x:bx,y:by,sz:rand(2.5,4),sp:rand(0.02,0.08),br:rand(0.6,1.0),pulse:rand(0,6.28),pulseSpd:rand(0.002,0.006),layer:3,col:pick(["#00e5ff","#bb77ff","#ffcc44","#ff66aa","#44ff88"])});}
        bgNebula.current=[];
        bgNebula.current.push({x:GW*0.3,y:GH*0.25,r:220,col:"#00e5ff",drift:0.03,driftY:0.01,opc:0.12});
        bgNebula.current.push({x:GW*0.7,y:GH*0.6,r:180,col:"#bb77ff",drift:-0.04,driftY:-0.02,opc:0.10});
        bgNebula.current.push({x:GW*0.5,y:GH*0.8,r:250,col:"#ff335544",drift:0.02,driftY:0.015,opc:0.08});
        bgNebula.current.push({x:GW*0.15,y:GH*0.65,r:140,col:"#44ff8833",drift:0.05,driftY:-0.01,opc:0.09});
        bgNebula.current.push({x:GW*0.85,y:GH*0.2,r:160,col:"#ff884433",drift:-0.03,driftY:0.02,opc:0.07});
        bgDebris.current=[];
        for(let i=0;i<8;i++)bgDebris.current.push({x:rand(0,GW),y:rand(0,GH),sz:rand(8,22),rot:rand(0,6.28),rotSpd:rand(-0.0008,0.0008),spY:rand(0.04,0.15),spX:rand(-0.03,0.03),sides:pick([3,5,6]),col:pick(["#00e5ff","#bb77ff","#44ddcc","#ff66aa"]),opc:rand(0.025,0.055)});
      }
      const draw=()=>{const c=bgRef.current;if(!c)return;const ctx=c.getContext("2d");bgTime.current+=16;const t=bgTime.current;
        ctx.fillStyle="#04040a";ctx.fillRect(0,0,GW,GH);
        /* subtle hex grid */
        ctx.strokeStyle="rgba(0,229,255,0.018)";ctx.lineWidth=0.5;const hSz=40;const hH=hSz*Math.sqrt(3);for(let gy=-1;gy<GH/hH+1;gy++){for(let gx=-1;gx<GW/(hSz*1.5)+1;gx++){const ox=gx*hSz*1.5;const oy=gy*hH+(gx%2===0?0:hH/2);ctx.beginPath();for(let hi=0;hi<6;hi++){const ha=(Math.PI/3)*hi+Math.PI/6;ctx.lineTo(ox+Math.cos(ha)*hSz*0.45,oy+Math.sin(ha)*hSz*0.45);}ctx.closePath();ctx.stroke();}}
        /* nebulae */
        bgNebula.current.forEach(n=>{n.x+=n.drift;n.y+=n.driftY;if(n.x<-n.r)n.x=GW+n.r;if(n.x>GW+n.r)n.x=-n.r;if(n.y<-n.r)n.y=GH+n.r;if(n.y>GH+n.r)n.y=-n.r;const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);g.addColorStop(0,n.col);g.addColorStop(0.6,n.col.slice(0,7)+"33");g.addColorStop(1,"transparent");ctx.globalAlpha=n.opc+Math.sin(t*0.0002+n.x*0.01)*0.03;ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();});
        /* floating debris */
        ctx.globalAlpha=1;bgDebris.current.forEach(d=>{d.rot+=d.rotSpd*16;d.y+=d.spY;d.x+=d.spX;if(d.y>GH+30){d.y=-30;d.x=rand(0,GW);}if(d.x<-30)d.x=GW+30;if(d.x>GW+30)d.x=-30;ctx.globalAlpha=d.opc;ctx.strokeStyle=d.col;ctx.lineWidth=1;ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.beginPath();for(let si=0;si<d.sides;si++){const sa=(Math.PI*2/d.sides)*si;ctx.lineTo(Math.cos(sa)*d.sz,Math.sin(sa)*d.sz);}ctx.closePath();ctx.stroke();ctx.restore();});
        /* stars with parallax layers */
        ctx.globalAlpha=1;bgStars.current.forEach(s=>{const lSpd=[0.3,0.6,1.0,0.15][s.layer];s.y+=s.sp*lSpd;if(s.y>GH){s.y=-2;s.x=rand(0,GW);}s.pulse+=s.pulseSpd*16;const b=s.br+Math.sin(s.pulse)*0.2;ctx.globalAlpha=clamp(b,0.08,1);if(s.col){ctx.fillStyle=s.col;ctx.shadowColor=s.col;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(s.x,s.y,s.sz*0.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}else{ctx.fillStyle="#8899cc";ctx.fillRect(s.x,s.y,s.sz,s.sz);}});
        ctx.globalAlpha=1;
        /* vignette */
        const vg=ctx.createRadialGradient(GW/2,GH/2,GW*0.3,GW/2,GH/2,GW*0.8);vg.addColorStop(0,"transparent");vg.addColorStop(1,"rgba(4,4,10,0.5)");ctx.globalAlpha=1;ctx.fillStyle=vg;ctx.fillRect(0,0,GW,GH);
        bgRaf.current=requestAnimationFrame(draw);};
      bgRaf.current=requestAnimationFrame(draw);
      return()=>{if(bgRaf.current)cancelAnimationFrame(bgRaf.current);};
    },[]);
    return <canvas ref={bgRef} width={GW} height={GH} style={{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:0}} />;
  };

  function totalCostToMax(up){let total=0;for(let l=0;l<up.max;l++)total+=Math.ceil(up.base*Math.pow(1+l*up.scale,up.exp));return total;}
  function costAt(up,l){return Math.ceil(up.base*Math.pow(1+l*up.scale,up.exp));}
  function costStr(up,sym){const mid=Math.floor(up.max/2);const last=up.max-1;const tc=totalCostToMax(up);return `Lv1: ${costAt(up,0)}${sym}${up.max>2?` · Lv${mid+1}: ${costAt(up,mid)}${sym}`:""} · Lv${up.max}: ${costAt(up,last)}${sym} · Total: ${tc}${sym}`;}

  const ShipStats=({metaData,gsData,wide})=>{
    const p=gsData?.player;
    const v=(pVal,menuVal)=>p?pVal:menuVal;
    const mHp=75+gml("m_hp")*12,mDmg=(7+gml("m_dmg")*1.5),mSpd=(3.6*(1+gml("m_spd")*0.05)),mBs=(3.2+gml("m_bullet")*0.25),mMag=(50*(1+gml("m_magnet")*0.04)),mFort=(1+gml("m_luck")*0.08),mSh=gml("m_shield");
    return(
      <div style={{padding:"6px 0",fontSize:9,color:"#8899aa",lineHeight:1.8,textAlign:"center",maxWidth:wide?"100%":300,width:wide?"100%":"auto"}}>
        <div style={{color:"#bbccdd",fontSize:10,fontWeight:"bold",marginBottom:3}}>SHIP STATUS</div>
        <div>HP: <span style={{color:"#ff5577"}}>{p?`${Math.ceil(p.hp)}/${p.maxHp}`:mHp}</span> · Shields: <span style={{color:"#44aaff"}}>{p?`${p.shields}/${p.shieldMax}`:mSh}</span></div>
        <div>Damage: <span style={{color:"#ff8866"}}>{v(p?.damage.toFixed(1),mDmg.toFixed(1))}</span> · Fire delay: <span style={{color:"#ffaa44"}}>{v(p?.fireDelay.toFixed(0)+"ms","210ms")}</span></div>
        <div>Speed: <span style={{color:"#44ccff"}}>{v(p?.speed.toFixed(1),mSpd.toFixed(1))}</span> · Bullet size: <span style={{color:"#44ccff"}}>{v(p?.bulletSize.toFixed(1),mBs.toFixed(1))}</span></div>
        <div>Pickup range: <span style={{color:"#44ffaa"}}>{v(p?.magnetRange.toFixed(0),mMag.toFixed(0))}</span> · Fortune: <span style={{color:"#ffcc44"}}>×{p?((p.fortuneMult)*(1+(gsData?.wave||0)*0.015)).toFixed(2):mFort.toFixed(2)}</span></div>
        <div>Velocity: <span style={{color:"#ccddee"}}>×{v(p?.bulletSpeedMul?.toFixed(2)||"1.00","1.00")}</span> · Flame: <span style={{color:"#ff8844"}}>{v(p?.acidStacks,0)}</span></div>
        <div>Crit: <span style={{color:"#ffff44"}}>{((v(p?.critChance,gml("m_crit")*0.02)||0)*100).toFixed(0)}%</span> · Dodge: <span style={{color:"#aabbcc"}}>{((v(p?.dodgeChance,0)||0)*100).toFixed(0)}%</span> · Defense: <span style={{color:"#66aacc"}}>{((v(p?.dmgReduction,0)||0)*100).toFixed(0)}%</span></div>
        <div>Regen: <span style={{color:"#44ff88"}}>{v(p?.regenRate.toFixed(1),"0.0")}/s</span> · Pickup: <span style={{color:"#ccbbaa"}}>{((540+(v(p?.pickupLife,0)||0))/60).toFixed(1)}s</span></div>
        {p&&p.abilities.length>0&&<div style={{marginTop:4,color:"#aabbcc",display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center"}}>{p.abilities.map(id=>{const ab=ABILITIES.find(a=>a.id===id);return ab?<span key={id} style={{display:"inline-flex",alignItems:"center",gap:2}}><AbilityIcon id={id} size={12} color="#aabbcc" />{ab.name}</span>:id;})}</div>}
      </div>
    );
  };

  const[codexOpen,setCodexOpen]=useState({controls:true,mechanics:true,currencies:true,enemies:true,abilities:true,scrap:true,cores:true,plasma:true,meta:true,metaab:true});
  const togCodex=(k)=>setCodexOpen(p=>({...p,[k]:!p[k]}));
  const CodexSec=({id,title,color,children})=>(<div style={{marginBottom:4}}>
    <h3 onClick={()=>togCodex(id)} style={{color:color||"#bbccdd",fontSize:11,letterSpacing:2,margin:"10px 0 4px",cursor:"pointer",userSelect:"none",textDecoration:"underline",textDecorationColor:(color||"#bbccdd")+"44",textUnderlineOffset:3}}>{codexOpen[id]?"▾":"▸"} {title}</h3>
    {codexOpen[id]&&children}</div>);

  const Wiki=()=>(
    <div className="vs-scroll" style={{position:"absolute",inset:0,background:"rgba(6,6,14,0.97)",zIndex:20,overflow:"auto",padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{color:"#dde",fontSize:16,margin:0,letterSpacing:3}}>VOID CODEX</h2>
        <button onClick={()=>setShowWiki(false)} style={{background:"none",border:"1px solid #667",color:"#bbc",padding:"4px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:11}}>✕</button>
      </div>

      <CodexSec id="controls" title="CONTROLS">
        <div style={{color:"#99aabb",fontSize:10,lineHeight:1.7}}><b style={{color:"#dde"}}>WASD / Arrow Keys</b> — Move · <b style={{color:"#dde"}}>P / Esc</b> — Pause</div>
      </CodexSec>

      <CodexSec id="mechanics" title="MECHANICS">
        <div style={{color:"#8899aa",fontSize:9,lineHeight:1.6}}>
          <b style={{color:"#bbccdd"}}>Auto-fire</b> — your ship fires automatically. You only need to move and dodge.<br/>
          <b style={{color:"#bbccdd"}}>Waves</b> — enemies spawn in waves of increasing difficulty. Between waves you visit the upgrade station to spend currency.<br/>
          <b style={{color:"#bbccdd"}}>Abilities</b> — every 3 waves, choose 1 of 3 abilities. These are permanent for the run and cannot be duplicated.<br/>
          <b style={{color:"#bbccdd"}}>Death & Echoes</b> — when your ship is destroyed, you earn Echoes based on your wave and kills. Spend these on permanent meta upgrades.<br/>
          <b style={{color:"#bbccdd"}}>Shields</b> absorb one hit each but do NOT grant invincibility frames. You can lose multiple shields in rapid succession.<br/>
          <b style={{color:"#bbccdd"}}>HP damage</b> grants brief invincibility frames, preventing consecutive HP hits.<br/>
          <b style={{color:"#bbccdd"}}>Wave completion</b> — waves end once all enemies are dead AND all enemy bullets have left the screen, plus a brief grace period to collect remaining pickups.<br/>
          <b style={{color:"#bbccdd"}}>Enemies</b> will try to stay in the play area — if they drift too far down, they steer back up.<br/>
          <b style={{color:"#bbccdd"}}>Fortune</b> multiplies scrap and core drops. <b style={{color:"#ff8844"}}>Plasma drops receive only half</b> of the fortune multiplier. Wave progression also slightly increases drops.<br/>
          <b style={{color:"#bbccdd"}}>Ability Upgrades</b> — each ability has 2 sub-upgrades and 1 mastery upgrade, purchased with Ability Shards in the Meta Upgrades screen. Shards are bought with Echoes, and each shard costs more than the last. Sub-upgrades cost 1 shard each, while mastery upgrades cost 3 shards and require both sub-upgrades to be unlocked first. These upgrades are permanent and apply to every run.
        </div>
      </CodexSec>

      <CodexSec id="currencies" title="CURRENCIES">
        {Object.entries(CUR).map(([k,c])=>(
          <div key={k} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #1a1a2e"}}>
            <span style={{color:c.color,fontSize:16,minWidth:20}}>{c.icon}</span>
            <div><div style={{color:c.color,fontSize:10,fontWeight:"bold"}}>{c.name} <span style={{color:"#778899",fontSize:8}}>{c.rarity}</span></div>
            <div style={{color:"#8899aa",fontSize:9}}>{c.desc}</div>
            {k==="echoes"&&<div style={{color:"#667788",fontSize:8}}>Earned when your ship is destroyed.</div>}</div>
          </div>))}
      </CodexSec>

      <CodexSec id="enemies" title="ENEMIES">
        <div style={{color:"#667788",fontSize:8,marginBottom:4}}>All stats scale with wave progression. HP multiplier is relative to base drone HP. Unlock wave shown in brackets.</div>
        {Object.entries(ED).sort(([a],[b])=>(ENEMY_UNLOCK[a]||1)-(ENEMY_UNLOCK[b]||1)).map(([k,ed])=>{
          const unlockW=ENEMY_UNLOCK[k]||1;
          return(
          <div key={k} style={{display:"flex",gap:10,alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1a1a2e"}}>
            <EnemyIcon type={k} size={28} />
            <div style={{flex:1}}>
              <div style={{color:"#ccddee",fontSize:10,fontWeight:"bold",textTransform:"capitalize"}}>{k} <span style={{color:"#667788",fontSize:8}}>[Wave {unlockW}+] · HP ×{ed.hpM} · DMG ×{ed.dM} · Speed {ed.spd}</span></div>
              <div style={{color:"#8899aa",fontSize:9}}>{ed.desc}</div>
              <div style={{color:"#667788",fontSize:8}}>Attack: {ed.pat==="none"?"Kamikaze (explodes into bullets on death)":ed.pat} · Base drops: {ed.sB}⬡{ed.cB>0?" "+ed.cB+"◆":""}{ed.pB>0?" "+ed.pB+"✦":""}</div>
            </div>
          </div>);})}
        <div style={{display:"flex",gap:10,alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1a1a2e"}}>
          <EnemyIcon type="boss" size={28} />
          <div style={{flex:1}}>
            <div style={{color:"#ff2266",fontSize:10,fontWeight:"bold"}}>Boss <span style={{color:"#667788",fontSize:8}}>[Every 5 waves] · HP ×18 · Dual-phase attack patterns</span></div>
            <div style={{color:"#8899aa",fontSize:9}}>Massive ship with escort spawns. Phase 2 below 50% HP adds spiral bullet rings. Drops all three currencies generously.</div>
          </div>
        </div>
      </CodexSec>

      <CodexSec id="abilities" title="ABILITIES">
        <div style={{color:"#778899",fontSize:8,marginBottom:3}}>Choose 1 of 3 every 3 waves. Permanent for the run. Cannot be duplicated.</div>
        {ABILITIES.map(ab=>(<div key={ab.id} style={{padding:"3px 0",borderBottom:"1px solid #1a1a2e"}}><span style={{color:"#dde",fontSize:10,display:"inline-flex",alignItems:"center",gap:4}}><AbilityIcon id={ab.id} size={14} color="#dde" /><b>{ab.name}</b></span><div style={{color:"#8899aa",fontSize:8}}>{ab.desc}</div></div>))}
      </CodexSec>

      <CodexSec id="scrap" title={"WAVE UPGRADES — SCRAP ⬡"} color={CUR.scrap.color}>
        <div style={{color:"#667788",fontSize:8,marginBottom:4}}>Bought between waves. Costs increase per level. All upgrades shown including locked ones.</div>
        {SHOP.filter(u=>u.cur==="scrap").map(up=>(
          <div key={up.id} style={{padding:"5px 0",borderBottom:"1px solid #1a1a2e"}}>
            <div style={{color:CC[up.cat],fontSize:10,fontWeight:"bold"}}>{up.name} <span style={{color:"#667788",fontSize:8}}>({up.cat}) · {up.max} levels · Unlocks wave {up.wave||1}</span></div>
            <div style={{color:"#8899aa",fontSize:9}}>{up.desc}</div>
            <div style={{color:"#667788",fontSize:8}}>{costStr(up,"⬡")}</div>
          </div>))}
      </CodexSec>

      <CodexSec id="cores" title={"WAVE UPGRADES — CORES ◆"} color={CUR.cores.color}>
        <div style={{color:"#667788",fontSize:8,marginBottom:4}}>Cores first drop from Sprayers (wave 4+). These upgrades unlock accordingly.</div>
        {SHOP.filter(u=>u.cur==="cores").map(up=>(
          <div key={up.id} style={{padding:"5px 0",borderBottom:"1px solid #1a1a2e"}}>
            <div style={{color:CC[up.cat],fontSize:10,fontWeight:"bold"}}>{up.name} <span style={{color:"#667788",fontSize:8}}>({up.cat}) · {up.max} levels · Unlocks wave {up.wave}</span></div>
            <div style={{color:"#8899aa",fontSize:9}}>{up.desc}</div>
            <div style={{color:"#667788",fontSize:8}}>{costStr(up,"◆")}</div>
          </div>))}
      </CodexSec>

      <CodexSec id="plasma" title={"WAVE UPGRADES — PLASMA ✦"} color={CUR.plasma.color}>
        <div style={{color:"#667788",fontSize:8,marginBottom:4}}>Plasma drops from Bosses (wave 5+) and Pulse enemies (wave 11+). Endgame exotic upgrades.</div>
        {SHOP.filter(u=>u.cur==="plasma").map(up=>(
          <div key={up.id} style={{padding:"5px 0",borderBottom:"1px solid #1a1a2e"}}>
            <div style={{color:CC[up.cat],fontSize:10,fontWeight:"bold"}}>{up.name} <span style={{color:"#667788",fontSize:8}}>({up.cat}) · {up.max} levels · Unlocks wave {up.wave}</span></div>
            <div style={{color:"#8899aa",fontSize:9}}>{up.desc}</div>
            <div style={{color:"#667788",fontSize:8}}>{costStr(up,"✦")}</div>
          </div>))}
      </CodexSec>

      <CodexSec id="meta" title={"META SHIP UPGRADES ⬢"} color={CUR.echoes.color}>
        <div style={{color:"#667788",fontSize:8,marginBottom:4}}>Permanent upgrades bought with Echoes. Persist across all runs forever. Tier system: max all upgrades at current tier to unlock the next. Tier 1 → 2 costs 800⬢, Tier 2 → 3 costs 25,000⬢. Each tier doubles max levels with steeper costs. Tier 3 is the maximum.</div>
        {META.map(up=>{const tc=Array.from({length:up.max},(_, l)=>Math.ceil(up.base*(1+l*0.85))).reduce((a,b)=>a+b,0);return(
          <div key={up.id} style={{padding:"4px 0",borderBottom:"1px solid #1a1a2e"}}>
            <div style={{color:CUR.echoes.color,fontSize:10,fontWeight:"bold"}}>{up.name} <span style={{color:"#667788",fontSize:8}}>Tier 1: {up.max} levels</span></div>
            <div style={{color:"#8899aa",fontSize:9}}>{up.desc}</div>
            <div style={{color:"#667788",fontSize:8}}>First level: {up.base}⬢ · Tier 1 total: {tc}⬢</div>
          </div>);})}
      </CodexSec>

      <CodexSec id="metaab" title={"META ABILITY UPGRADES ◈"} color="#44ddcc">
        <div style={{color:"#8899aa",fontSize:9,lineHeight:1.6}}>
          <b style={{color:"#bbccdd"}}>Overview</b> — each of the 12 abilities has 2 sub-upgrades and 1 mastery upgrade. These are permanent and apply to every run where you pick that ability.<br/>
          <b style={{color:"#bbccdd"}}>Ability Shards</b> — the currency for ability upgrades, bought with Echoes. Sub-upgrades cost 1 shard each. Mastery upgrades cost 3 shards and require both subs.<br/>
          <b style={{color:"#bbccdd"}}>Shard Costs</b> — each shard costs more than the last: ceil(100 × (1 + purchased × 0.12)^1.6). First shard: 100⬢, 5th: ~198⬢, 10th: ~442⬢.<br/>
          <b style={{color:"#bbccdd"}}>Total Shards Needed</b> — 12 abilities × (2 subs + 1 mastery of 3 shards) = 60 shards to max everything.<br/>
          <b style={{color:"#bbccdd"}}>Total Echoes for All Shards</b> — approximately {(()=>{let t=0;for(let i=0;i<60;i++)t+=Math.ceil(100*Math.pow(1+i*0.12,1.6));return t.toLocaleString();})()}⬢
        </div>
        <div style={{marginTop:6}}>
        {ABILITIES.map(ab=><div key={ab.id} style={{padding:"4px 0",borderBottom:"1px solid #1a1a2e"}}>
          <div style={{color:"#44ddcc",fontSize:10,fontWeight:"bold",display:"inline-flex",alignItems:"center",gap:3}}><AbilityIcon id={ab.id} size={14} color="#44ddcc" />{ab.name}</div>
          <div style={{color:"#8899aa",fontSize:8,lineHeight:1.4}}>
            <span style={{color:"#778899"}}>Sub 1:</span> {(()=>{const d={"orbitals":"Increase electrons by 2","chain":"Arc to 4 enemies","homing":"Fire every 1s","nova":"Radius to 20","slowfield":"Radius ×2","mirror":"Clone matches fire rate","drone":"Rage mode on HP damage","gravity":"Bullets shrink 4%/s","overcharge":"150% max overcharge","blackhole":"55% bullets removed","void_regen":"Regen cap to 90%","ricochet":"Random angle offset"};return d[ab.id]||"???"})()}<br/>
            <span style={{color:"#778899"}}>Sub 2:</span> {(()=>{const d={"orbitals":"30% dmg on contact","chain":"Electrocute origin 60%","homing":"15% missile crit","nova":"Shockwave collapses back","slowfield":"Pulsing pickup range","mirror":"Clone collects pickups","drone":"+3% dmg per ability","gravity":"Conjoined vortex","overcharge":"Plasma heals 4%","blackhole":"Sniper priority + cancel","void_regen":"3s windup if killed enemy","ricochet":"Extra wall bounce"};return d[ab.id]||"???"})()}<br/>
            <span style={{color:"#ffcc44"}}>Mastery:</span> {(()=>{const d={"orbitals":"Outer elliptical ring","chain":"Green chain on allies","homing":"Burn bomb on hit","nova":"Leaves landmine","slowfield":"Slow + weaken bombers","mirror":"Lasso enemies away","drone":"Wave gift from missed pickups","gravity":"Golden vortex ×2 drops","overcharge":"Persists between waves","blackhole":"Triggers on shield loss","void_regen":"Golden shield on clean wave","ricochet":"250% rage slice"};return d[ab.id]||"???"})()}
          </div>
        </div>)}
        </div>
      </CodexSec>
    </div>
  );

  const TutPopup=({title,children,btnText,onBtn,banner})=>{
    if(banner)return(
      <div style={{position:"absolute",bottom:80,left:0,right:0,zIndex:25,display:"flex",justifyContent:"center",padding:"8px 12px",pointerEvents:"none"}}>
        <div style={{background:"rgba(12,12,26,0.95)",border:"2px solid #ffcc4466",borderRadius:8,padding:"12px 18px",maxWidth:360,width:"100%",textAlign:"center",pointerEvents:"auto",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
          <div style={{color:"#ffcc44",fontSize:12,fontWeight:"bold",letterSpacing:2,marginBottom:6}}>{title}</div>
          <div style={{color:"#99aabb",fontSize:10,lineHeight:1.6}}>{children}</div>
        </div>
      </div>);
    return(
    <div style={{position:"absolute",inset:0,background:"rgba(6,6,14,0.85)",zIndex:25,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#0c0c1a",border:"2px solid #ffcc4466",borderRadius:8,padding:"18px 22px",maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{color:"#ffcc44",fontSize:14,fontWeight:"bold",letterSpacing:2,marginBottom:10}}>{title}</div>
        <div style={{color:"#99aabb",fontSize:10,lineHeight:1.7,marginBottom:14}}>{children}</div>
        {btnText&&<button onClick={onBtn} style={{padding:"8px 28px",background:"transparent",border:"2px solid #ffcc44",color:"#ffcc44",fontSize:12,fontFamily:"inherit",cursor:"pointer",letterSpacing:1,transition:"all 0.2s"}}
          onMouseOver={e=>{e.target.style.background="#ffcc44";e.target.style.color="#06060e";}} onMouseOut={e=>{e.target.style.background="transparent";e.target.style.color="#ffcc44";}}>{btnText}</button>}
      </div>
    </div>);
  };

  return(
    <div style={{width:"100%",height:"100vh",background:"#06060e",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",fontFamily:"'Courier New', monospace"}}>
      <style>{`
        .vs-scroll::-webkit-scrollbar{width:5px;}
        .vs-scroll::-webkit-scrollbar-track{background:#0a0a14;}
        .vs-scroll::-webkit-scrollbar-thumb{background:#1a1a3a;border-radius:4px;}
        .vs-scroll::-webkit-scrollbar-thumb:hover{background:#2a2a5a;}
        .vs-scroll{scrollbar-width:thin;scrollbar-color:#1a1a3a #0a0a14;}
        @keyframes goldShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeSlideIn{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
        @keyframes pulseGlow{0%,100%{text-shadow:0 0 30px #00e5ff88}50%{text-shadow:0 0 50px #00e5ffcc,0 0 80px #00e5ff44}}
        .vs-fade-in{animation:fadeSlideIn 0.25s ease-out both}
        .vs-fade{animation:fadeIn 0.2s ease-out both}
        .vs-title-glow{animation:pulseGlow 4s ease-in-out infinite}
        .gold-shimmer{position:absolute;inset:0;border-radius:3px;background:linear-gradient(105deg,transparent 30%,rgba(255,204,68,0.06) 45%,rgba(255,204,68,0.12) 50%,rgba(255,204,68,0.06) 55%,transparent 70%);background-size:200% 100%;animation:goldShimmer 4s ease-in-out infinite;pointer-events:none;z-index:0;}
      `}</style>      <div style={{position:"relative",width:GW*sc2,height:GH*sc2}}>
        <canvas ref={canvasRef} width={GW} height={GH} style={{width:"100%",height:"100%",display:"block",imageRendering:"pixelated"}} />
        {showWiki&&Wiki()}

        {/* Tutorial popups */}
        {tutStep===1&&phase==="playing"&&<TutPopup title="CONTROLS" btnText="BEGIN" onBtn={()=>setTutStep(2)}>
          Use <b style={{color:"#ccddee"}}>WASD</b> or <b style={{color:"#ccddee"}}>Arrow Keys</b> to move your ship.<br/>
          Your ship <b style={{color:"#ccddee"}}>fires automatically</b> — just focus on dodging!<br/>
          Press <b style={{color:"#ffcc44"}}>P or Esc</b> to pause at any time.<br/><br/>
          Destroying enemies drops <span style={{color:"#4499ff"}}>⬡ Scrap</span>, <span style={{color:"#44ff88"}}>◆ Cores</span>, and sometimes <span style={{color:"#ff8844"}}>✦ Plasma</span>. <b style={{color:"#ccddee"}}>Fly near them to pick them up</b> — they're pulled towards you automatically.<br/><br/>
          <b style={{color:"#ff6644"}}>Drones</b> are your first enemies. They fire single aimed shots directly at you. Keep moving to dodge!
        </TutPopup>}
        {tutStep===20&&phase==="playing"&&<TutPopup title="NEW ENEMY: WEAVER" btnText="READY" onBtn={()=>setTutStep(21)}>
          <b style={{color:"#cc44ff"}}>Weavers</b> move in sine-wave patterns and fire <b style={{color:"#ccddee"}}>3-bullet fans</b>.<br/><br/>
          They're faster than drones and harder to hit. Watch for the spread of bullets and weave between them!
        </TutPopup>}
        {tutStep===30&&phase==="playing"&&<TutPopup title="NEW ENEMY: BOMBER" btnText="READY" onBtn={()=>setTutStep(31)}>
          <b style={{color:"#ffcc44"}}>Bombers</b> are kamikazes — they <b style={{color:"#ff4455"}}>charge directly at you</b> and don't fire bullets.<br/><br/>
          When destroyed, they <b style={{color:"#ff4455"}}>explode into a ring of bullets</b>. Kill them at range to give yourself time to dodge the burst!
        </TutPopup>}
        {tutStep===40&&phase==="playing"&&<TutPopup title="NEW ENEMY: SPRAYER" btnText="READY" onBtn={()=>setTutStep(41)}>
          <b style={{color:"#ffaa44"}}>Sprayers</b> are stationary turrets that fire <b style={{color:"#ccddee"}}>expanding bullet rings</b>.<br/><br/>
          They don't move but their rings cover huge areas. Find the gaps between bullets and slip through!<br/>
          Sprayers are the first enemies to drop <span style={{color:"#44ff88"}}>◆ Cores</span> — a green, rarer currency used for mid-tier upgrades.
        </TutPopup>}
        {tutStep===50&&phase==="playing"&&<TutPopup title="BOSS WAVE" btnText="FIGHT" onBtn={()=>setTutStep(51)}>
          Every 5th wave features a <b style={{color:"#ff2266"}}>BOSS</b> — a large, high-HP enemy with devastating attacks.<br/><br/>
          Bosses fire wide bullet spreads and switch to ring patterns at half health. Focus fire and keep your distance!<br/>
          Bosses drop <span style={{color:"#ff8844"}}>✦ Plasma</span> — the rarest currency, used for the most powerful upgrades.
        </TutPopup>}
        {tutStep===3&&phase==="shop"&&<TutPopup title="UPGRADE STATION" btnText="OK" onBtn={()=>setTutStep(4)}>
          Between waves you can spend currency on upgrades.<br/><br/>
          You've been given some <span style={{color:"#4499ff"}}>⬡ Scrap</span>. Buy a level of <b style={{color:"#ff5577"}}>Hull Plating</b> (❤) to continue — it increases your max HP and heals you!<br/><br/>
          Upgrades only last for this run. When you die, you start fresh.
        </TutPopup>}
        {tutStep===4&&phase==="shop"&&gsRef.current?.isTutorial&&<TutPopup banner title="BUY HULL PLATING">
          Find <b style={{color:"#ff5577"}}>Hull Plating</b> (❤) in the upgrade grid and click it to continue.<br/>
          <span style={{color:"#667788",fontSize:9}}>Top row — costs 8 scrap.</span>
        </TutPopup>}
        {tutStep===45&&phase==="shop"&&<TutPopup banner title="UPGRADE PURCHASED!">
          Your max HP increased and you were healed! Click <b style={{color:"#44ff88"}}>NEXT WAVE →</b> to continue.
        </TutPopup>}
        {tutStep===5&&phase==="ability"&&<TutPopup title="ABILITIES" btnText="CHOOSE ONE" onBtn={()=>setTutStep(6)}>
          Every 3 waves, you pick <b style={{color:"#ffcc44"}}>1 of 3 abilities</b>.<br/><br/>
          Each ability gives you a unique power for the rest of this run.<br/>
          You can't pick the same ability twice. Choose wisely!
        </TutPopup>}
        {tutStep===7&&phase==="shop"&&<TutPopup banner title="TUTORIAL COMPLETE!">
          Well done — you survived 5 waves! In a real run, the game goes on forever.<br/>
          Now click <b style={{color:"#ff4455"}}>FORFEIT RUN</b> below to collect your <span style={{color:"#bb77ff"}}>⬢ Echoes</span> — the permanent currency.
        </TutPopup>}
        {tutStep===8&&phase==="dead"&&<TutPopup title="ECHOES" btnText="OPEN META" onBtn={()=>{setTutStep(9);setPhase("metashop");}}>
          When you die or forfeit, you earn <span style={{color:"#bb77ff"}}>⬢ Echoes</span> based on how far you got.<br/><br/>
          Echoes are <b style={{color:"#ccddee"}}>permanent</b> — they persist forever across all runs.<br/>
          Press the button below to see what you can spend them on.
        </TutPopup>}
        {tutStep===9&&phase==="metashop"&&metaTab==="ship"&&<TutPopup title="META UPGRADES" btnText="OK" onBtn={()=>setTutStep(10)}>
          These upgrades are <b style={{color:"#ccddee"}}>permanent</b>. They make your ship stronger at the start of every run.<br/><br/>
          Buy a level of <b style={{color:"#ccddee"}}>Gunpowder Density</b> — it increases your starting damage. Find it in the list and click it!
        </TutPopup>}
        {tutStep===10&&phase==="metashop"&&metaTab==="ship"&&(meta.levels?.m_dmg||0)===0&&<TutPopup banner title="BUY GUNPOWDER DENSITY">
          Find <b style={{color:"#ccddee"}}>Gunpowder Density</b> in the list below and click to buy it.<br/>
          <span style={{color:"#667788",fontSize:9}}>Costs 15 echoes.</span>
        </TutPopup>}
        {tutStep===10&&phase==="metashop"&&metaTab==="ship"&&(meta.levels?.m_dmg||0)>0&&<TutPopup title="ABILITY UPGRADES" btnText="SHOW ME" onBtn={()=>{setTutStep(11);setMetaTab("abilities");}}>
          Nice! That damage boost applies to every future run.<br/><br/>
          There's another type of permanent upgrade too — let's check it out.
        </TutPopup>}
        {tutStep===11&&phase==="metashop"&&metaTab==="abilities"&&<TutPopup title="ABILITY SHARDS" btnText="FINISH TUTORIAL" onBtn={()=>setTutStep(0)}>
          Each ability has <b style={{color:"#44ddcc"}}>sub-upgrades</b> and a <b style={{color:"#ffcc44"}}>mastery</b>.<br/>
          You buy <b style={{color:"#44ddcc"}}>◈ Ability Shards</b> with Echoes, then spend shards to unlock upgrades.<br/><br/>
          These are permanent — once bought, they apply to every run where you pick that ability.<br/><br/>
          You'll need more Echoes before you can afford one. <b style={{color:"#ccddee"}}>Good luck out there, pilot.</b>
        </TutPopup>}

        {paused&&phase==="playing"&&!showWiki&&(
          <div className="vs-scroll vs-fade" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(6,6,14,0.88)",zIndex:15,overflow:"auto",padding:"20px 0"}}>
            <h2 style={{color:"#ccddee",fontSize:20,letterSpacing:4,margin:0}}>PAUSED</h2>
            {(()=>{const gs=gsRef.current;if(!gs)return null;const p=gs.player;const rawHp=Math.round(BASE_HP*hpScale(gs.wave));const rawDmg=Math.round((7+gs.wave*1.8)*dmgScale(gs.wave)*0.35);return(
              <div style={{color:"#8899aa",fontSize:10,marginTop:10,textAlign:"center",lineHeight:1.8}}>
                <span style={{color:"#99aabb"}}>WAVE {gs.wave}</span> · {gs.waveKilled}/{gs.waveTotal} killed · {gs.enemies.length} alive<br/>
                Enemy base HP: {rawHp} · Base dmg: {rawDmg}<br/>
                <span style={{color:CUR.scrap.color}}>⬡{gs.scrap}</span> · <span style={{color:CUR.cores.color}}>◆{gs.cores}</span> · <span style={{color:CUR.plasma.color}}>✦{gs.plasma}</span>
              </div>
            );})()}
            <div style={{marginTop:14}}><ShipDisplay onClick={()=>setShowStats(p=>!p)} size={50} /></div>
            <div style={{color:"#556677",fontSize:8,marginTop:3,cursor:"pointer"}} onClick={()=>setShowStats(p=>!p)}>{showStats?"▲ hide stats":"▼ tap ship for stats"}</div>
            {showStats&&<ShipStats metaData={meta} gsData={gsRef.current} />}
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setPaused(false)} style={bs2("#44ff88")} {...hv("#44ff88")}>CONTINUE</button>
              <button onClick={()=>setShowWiki(true)} style={{...bs2("#55667744"),padding:"8px 20px",fontSize:12,borderWidth:1,color:"#8899aa"}}>CODEX</button>
              <button onClick={()=>setShowPauseSettings(true)} style={{...bs2("#55667744"),padding:"8px 20px",fontSize:12,borderWidth:1,color:"#8899aa"}}>SETTINGS</button>
            </div>
            {showPauseSettings&&<div style={{marginTop:10,padding:"8px 12px",background:"#0a0a1a",border:"1px solid #22334444",borderRadius:4,maxWidth:320,width:"100%"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{color:"#99aabb",fontSize:10,fontWeight:"bold"}}>SETTINGS</span><button onClick={()=>setShowPauseSettings(false)} style={{background:"none",border:"1px solid #334455",color:"#778899",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9}}>✕</button></div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>{setMeta(prev=>{const nx={...prev,showNewEnemy:prev.showNewEnemy===false?true:false};saveMeta(nx);return nx;});}} style={{padding:"5px 10px",minWidth:110,background:metaRef.current.showNewEnemy===false?"#0a0a16":"#141428",border:`1px solid ${metaRef.current.showNewEnemy===false?"#33445544":"#44ccaa44"}`,borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:metaRef.current.showNewEnemy===false?"#667788":"#88ccaa",textAlign:"center"}}>Alerts: {metaRef.current.showNewEnemy===false?"OFF":"ON"}</button>
                <button onClick={()=>{setMeta(prev=>{const nx={...prev,showHitText:prev.showHitText===false?true:false};saveMeta(nx);return nx;});}} style={{padding:"5px 10px",minWidth:110,background:metaRef.current.showHitText===false?"#0a0a16":"#141428",border:`1px solid ${metaRef.current.showHitText===false?"#33445544":"#44ccaa44"}`,borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:metaRef.current.showHitText===false?"#667788":"#88ccaa",textAlign:"center"}}>Hit numbers: {metaRef.current.showHitText===false?"OFF":"ON"}</button>
                <button onClick={()=>{setMeta(prev=>{const nx={...prev,showMagnetRange:!prev.showMagnetRange};saveMeta(nx);return nx;});if(gsRef.current)gsRef.current.showMagnetRange=!meta.showMagnetRange;}} style={{padding:"5px 10px",minWidth:110,background:meta.showMagnetRange?"#141428":"#0a0a16",border:`1px solid ${meta.showMagnetRange?"#44ccaa44":"#33445544"}`,borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:meta.showMagnetRange?"#88ccaa":"#667788",textAlign:"center"}}>Range: {meta.showMagnetRange?"ON":"OFF"}</button>
              </div>
              <div style={{marginTop:6}}>{!confirmReset?<button onClick={()=>setConfirmReset(true)} style={{background:"none",border:"1px solid #ff334422",color:"#664444",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:8,borderRadius:3}}>RESET ALL PROGRESS</button>
                :<div><button onClick={()=>{const gs2=gsRef.current;if(gs2&&gs2.player.alive&&!gs2.isPlayground){gs2.player.alive=false;}const f={echoes:0,levels:{},shards:0,shardsBought:0,abUpgrades:{},shipColor:meta.shipColor||"cyan",bulletColor:meta.bulletColor,showNewEnemy:metaRef.current.showNewEnemy,showHitText:metaRef.current.showHitText,showMagnetRange:true,highWave:0};setMeta(f);saveMeta(f);try{localStorage.removeItem("vs4-history");}catch(e){}setConfirmReset(false);setShowTutPrompt(true);setPaused(false);setShowPauseSettings(false);setPhase("menu");}} style={{background:"none",border:"1px solid #ff3344",color:"#ff4455",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:8,borderRadius:3}}>ARE YOU SURE?</button><div style={{color:"#664444",fontSize:7,marginTop:2}}>Ends run & wipes ALL progress</div></div>}</div>
            </div>}
            {gsRef.current?.isPlayground?<button onClick={forfeit} style={{background:"none",border:"none",color:"#554444",fontSize:9,cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",marginTop:8}}>EXIT TO MENU</button>
            :gsRef.current?.isTutorial&&tutStep!==7?null
            :<>{!confirmForfeit?<button onClick={()=>setConfirmForfeit(true)} style={{background:"none",border:"none",color:"#554444",fontSize:9,cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",marginTop:8}}>FORFEIT RUN</button>
            :<div style={{textAlign:"center",marginTop:8}}><div style={{color:"#cc5555",fontSize:9,marginBottom:4}}>End this run? You'll receive <span style={{color:CUR.echoes.color}}>⬢ {calcEchoes(gsRef.current)}</span> echoes.</div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}><button onClick={forfeit} style={{...bs2("#ff3344"),padding:"5px 14px",fontSize:10,borderWidth:1}} {...hv("#ff3344")}>FORFEIT</button><button onClick={()=>setConfirmForfeit(false)} style={{...bs2("#55667744"),padding:"5px 14px",fontSize:10,borderWidth:1,color:"#8899aa"}}>CANCEL</button></div></div>}</>}
            <div style={{color:"#556677",fontSize:9,marginTop:10}}>P / Esc to resume</div>
          </div>
        )}

        {phase==="menu"&&!showWiki&&(
          <div className="vs-scroll" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#06060e",zIndex:10,overflow:"auto",padding:"20px 0"}}>
            <MenuBG/>
            <h1 className="vs-title-glow" style={{color:"#00e5ff",fontSize:40,fontWeight:"bold",letterSpacing:6,margin:0,zIndex:1,position:"relative"}}>VOID STORM</h1>
            <p style={{color:"#8899bb",fontSize:11,marginTop:8,letterSpacing:2,zIndex:1,position:"relative"}}>BULLET HELL ROGUELITE</p>
            <div style={{marginTop:14,zIndex:1,position:"relative"}}><ShipDisplay onClick={()=>setShowStats(p=>!p)} size={56} /></div>
            <div style={{color:"#556677",fontSize:8,marginTop:4,cursor:"pointer",zIndex:1,position:"relative"}} onClick={()=>setShowStats(p=>!p)}>{showStats?"▲ hide stats":"▼ tap ship for stats"}</div>
            {showStats&&<div style={{zIndex:1,position:"relative"}}><ShipStats metaData={meta} gsData={null} /></div>}
            <div style={{color:"#778899",fontSize:10,marginTop:10,textAlign:"center",lineHeight:1.8,zIndex:1,position:"relative"}}>
              <span style={{color:"#bbccdd"}}>WASD</span> move · <span style={{color:"#bbccdd"}}>P/Esc</span> pause</div>
            {meta.echoes>0&&<p style={{color:CUR.echoes.color,fontSize:13,marginTop:8,zIndex:1,position:"relative"}}>⬢ {meta.echoes} Echoes</p>}
            {meta.highWave>0&&<p style={{color:"#667788",fontSize:10,marginTop:meta.echoes>0?2:8,zIndex:1,position:"relative"}}>Best: <span style={{color:"#ccddee"}}>Wave {meta.highWave}</span></p>}
            <button onClick={()=>initGame()} style={{...bs2("#00e5ff"),marginTop:14,padding:"12px 40px",fontSize:16,zIndex:1,position:"relative"}} {...hv("#00e5ff")}>LAUNCH</button>
            {showTutPrompt&&<TutPopup title="FIRST TIME?" btnText="START TUTORIAL" onBtn={()=>initTutorial()}>
              Welcome to Void Storm! Would you like a guided tutorial?<br/>You'll play through 5 waves and learn the basics.<br/><br/>
              <span style={{color:"#667788",fontSize:9,cursor:"pointer"}} onClick={(e)=>{e.stopPropagation();setShowTutPrompt(false);}}>No thanks, I'll figure it out →</span>
            </TutPopup>}
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap",justifyContent:"center",zIndex:1,position:"relative"}}>
              <button onClick={()=>setPhase("metashop")} style={{...bs2("#bb77ff44"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#bb99ff"}}>META</button>
              <button onClick={()=>setShowWiki(true)} style={{...bs2("#44aacc33"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#66bbcc"}}>CODEX</button>
              <button onClick={()=>setPhase("history")} style={{...bs2("#ff884466"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#ffaa66"}}>HISTORY</button>
              <button onClick={()=>setPhase("playground")} style={{...bs2("#44ccaa33"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#55aa88"}}>PLAYGROUND</button>
              <button onClick={()=>setPhase("practise")} style={{...bs2("#cc884433"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#cc9966"}}>PRACTISE</button>
            </div>
            <div style={{display:"flex",gap:8,marginTop:6,justifyContent:"center",zIndex:1,position:"relative"}}>
              <button onClick={()=>setPhase("settings")} style={{...bs2("#55667744"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#778899"}}>SETTINGS</button>
            </div>
          </div>
        )}

        {phase==="ability"&&(
          <div className="vs-fade" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(6,6,14,0.92)",zIndex:10}}>
            <h2 style={{color:"#ffcc44",fontSize:18,letterSpacing:4,margin:0}}>CHOOSE AN ABILITY</h2>
            <p style={{color:"#778899",fontSize:10,marginTop:5,marginBottom:14}}>Permanent for this run</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:500,padding:"0 10px"}}>
              {abChoices.map(ab=>(
                <button key={ab.id} onClick={()=>pickAb(ab.id)} style={{width:148,padding:"12px 8px",background:"#0c0c1a",border:"2px solid #ffcc4433",borderRadius:5,cursor:"pointer",textAlign:"center",fontFamily:"inherit",transition:"all 0.2s"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor="#ffcc44"} onMouseOut={e=>e.currentTarget.style.borderColor="#ffcc4433"}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:4}}><AbilityIcon id={ab.id} size={28} color="#ffcc44" /></div>
                  <div style={{color:"#ffcc44",fontSize:11,fontWeight:"bold",marginBottom:3}}>{ab.name}</div>
                  <div style={{color:"#99aabb",fontSize:8,lineHeight:1.3}}>{ab.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase==="playground"&&(
          <div className="vs-scroll" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",background:"rgba(6,6,14,0.92)",zIndex:10,overflow:"auto",padding:"20px 12px"}}>
            <h2 style={{color:"#55aa88",fontSize:18,letterSpacing:3,margin:0}}>PLAYGROUND</h2>
            <p style={{color:"#778899",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.5}}>Pick an enemy to fight. You'll face 1 solo, then 5 at once (boss: 1 only).<br/>Stats match the wave that enemy first appears. No drops, no upgrades, no echoes.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14,width:"100%",maxWidth:480}}>
              {Object.entries(ED).sort(([a],[b])=>(ENEMY_UNLOCK[a]||1)-(ENEMY_UNLOCK[b]||1)).map(([k,ed])=>{
                const w=ENEMY_UNLOCK[k]||1;
                return(
                  <button key={k} onClick={()=>startPlayground(k)}
                    style={{display:"flex",gap:10,alignItems:"center",padding:"10px",background:"#0a0a1a",border:"1px solid #22334444",borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.2s"}}
                    onMouseOver={e=>e.currentTarget.style.borderColor="#55aa88"} onMouseOut={e=>e.currentTarget.style.borderColor="#22334444"}>
                    <EnemyIcon type={k} size={32} />
                    <div>
                      <div style={{color:"#ccddee",fontSize:11,fontWeight:"bold",textTransform:"capitalize"}}>{k}</div>
                      <div style={{color:"#667788",fontSize:8}}>Wave {w} · HP×{ed.hpM} · DMG×{ed.dM}</div>
                    </div>
                  </button>
                );
              })}
              <button onClick={()=>startPlayground("boss")}
                style={{display:"flex",gap:10,alignItems:"center",padding:"10px",background:"#0a0a1a",border:"1px solid #22334444",borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.2s",gridColumn:"1 / -1"}}
                onMouseOver={e=>e.currentTarget.style.borderColor="#ff2266"} onMouseOut={e=>e.currentTarget.style.borderColor="#22334444"}>
                <EnemyIcon type="boss" size={32} />
                <div>
                  <div style={{color:"#ff2266",fontSize:11,fontWeight:"bold"}}>Boss</div>
                  <div style={{color:"#667788",fontSize:8}}>Wave 5 · HP×18 · Solo only</div>
                </div>
              </button>
            </div>
            <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),marginTop:16,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
          </div>
        )}

        {phase==="practise"&&(
          <div className="vs-scroll" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",background:"rgba(6,6,14,0.92)",zIndex:10,overflow:"auto",padding:"20px 12px"}}>
            <h2 style={{color:"#cc8844",fontSize:18,letterSpacing:3,margin:0}}>PRACTISE</h2>
            <p style={{color:"#778899",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.5}}>Play any wave with base stats. No drops, no upgrades, no echoes.<br/>Survive the full wave to win. Die and you'll return to the menu.</p>
            <div style={{display:"flex",alignItems:"center",gap:12,marginTop:18}}>
              <button onClick={()=>setPracticeWave(w=>Math.max(1,w-10))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12,borderRadius:3}}>−10</button>
              <button onClick={()=>setPracticeWave(w=>Math.max(1,w-1))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:14,borderRadius:3}}>−</button>
              <div style={{minWidth:80,textAlign:"center"}}><span style={{color:"#ccddee",fontSize:28,fontWeight:"bold"}}>{practiceWave}</span><div style={{color:"#667788",fontSize:8,marginTop:2}}>WAVE</div></div>
              <button onClick={()=>setPracticeWave(w=>Math.min(200,w+1))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:14,borderRadius:3}}>+</button>
              <button onClick={()=>setPracticeWave(w=>Math.min(200,w+10))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12,borderRadius:3}}>+10</button>
            </div>
            <div style={{marginTop:14,padding:"8px 12px",background:"#0a0a1a",border:"1px solid #22334444",borderRadius:4,maxWidth:400,width:"100%"}}>
              <div style={{color:"#99aabb",fontSize:9,marginBottom:6}}>Enemies this wave:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {(()=>{const types=Object.entries(ENEMY_UNLOCK).filter(([k,w])=>w<=practiceWave&&k!=="boss").map(([k])=>k);
                  const isBoss=practiceWave%5===0;
                  return(<>{isBoss&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 6px",background:"#1a0a1a",borderRadius:3,border:"1px solid #ff226633"}}><EnemyIcon type="boss" size={18}/><span style={{color:"#ff2266",fontSize:8,fontWeight:"bold"}}>Boss</span></div>}
                    {types.map(k=><div key={k} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 6px",background:"#0c0c1a",borderRadius:3,border:"1px solid #22334444"}}><EnemyIcon type={k} size={16}/><span style={{color:"#ccddee",fontSize:8,textTransform:"capitalize"}}>{k}</span></div>)}
                    {types.length===0&&!isBoss&&<span style={{color:"#556677",fontSize:8}}>No enemies unlock at this wave</span>}</>);
                })()}
              </div>
              <div style={{color:"#667788",fontSize:8,marginTop:6}}>
                {(()=>{const _eCount=4+Math.floor(practiceWave*1.0)+Math.floor(Math.pow(practiceWave,1.1)*0.25);const _rawHp=Math.round(BASE_HP*hpScale(practiceWave));const _rawDmg=Math.round((7+practiceWave*1.8)*dmgScale(practiceWave)*0.35);const _cumEchoes=(()=>{let totalK=0;for(let w2=1;w2<=practiceWave;w2++)totalK+=4+Math.floor(w2*1.0)+Math.floor(Math.pow(w2,1.1)*0.25);return Math.max(0,Math.floor(practiceWave*1.5+totalK*0.38+Math.pow(practiceWave,2.8)*0.065+Math.pow(practiceWave,1.8)*0.4));})();return <>Enemy HP scale: ×{hpScale(practiceWave).toFixed(1)} ({_rawHp}) · DMG scale: ×{dmgScale(practiceWave).toFixed(1)} ({_rawDmg}) · Count: {_eCount}<br/>Cumulative echoes through wave {practiceWave}: <span style={{color:CUR.echoes.color}}>⬢ {_cumEchoes.toLocaleString()}</span></>})()}
              </div>
            </div>
            <button onClick={()=>startPractise(practiceWave)} style={{...bs2("#cc8844"),marginTop:16,padding:"10px 32px",fontSize:14}} {...hv("#cc8844")}>PLAY WAVE {practiceWave}</button>
            <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),marginTop:10,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
          </div>
        )}

        {phase==="history"&&(()=>{
          let _hist=[];try{_hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");}catch(e){}
          const _filtered=historyHideForfeits?_hist.filter(r=>!r.forfeited):_hist;
          const _maxW=_filtered.length>0?Math.max(..._filtered.map(r=>r.wave)):1;
          const _totalRuns=_hist.length;const _totalKills=_hist.reduce((s,r)=>s+(r.kills||0),0);const _totalEchoes=_hist.reduce((s,r)=>s+(r.echoes||0),0);
          const _chartH=300;const _chartW=GW-80;
          const _barW=_filtered.length>0?Math.max(2,Math.min(24,Math.floor(_chartW/_filtered.length))):24;
          /* cumulative lifetime echoes from history order */
          const _cumEchoes=[];let _runCum=0;_hist.forEach(r=>{_runCum+=(r.echoes||0);_cumEchoes.push(_runCum);});
          /* trendline: simple moving average */
          const _trendWindow=Math.max(3,Math.floor(_filtered.length/8));
          const _trend=_filtered.map((_,i)=>{let s=0,c=0;for(let j=Math.max(0,i-_trendWindow+1);j<=i;j++){s+=_filtered[j].wave;c++;}return s/c;});
          return(
          <div className="vs-scroll" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",background:"rgba(6,6,14,0.95)",zIndex:10,overflow:"auto",padding:"20px 12px"}}>
            <h2 style={{color:"#99aacc",fontSize:18,letterSpacing:3,margin:0}}>RUN HISTORY</h2>
            <div style={{color:"#667788",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.6}}>
              Lifetime runs: <span style={{color:"#ccddee"}}>{_totalRuns}</span> · Lifetime kills: <span style={{color:"#ccddee"}}>{_totalKills.toLocaleString()}</span> · Lifetime echoes: <span style={{color:CUR.echoes.color}}>⬢ {_totalEchoes.toLocaleString()}</span>
            </div>
            <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
              <button onClick={()=>setHistoryHideForfeits(p=>!p)} style={{padding:"5px 10px",minWidth:120,background:historyHideForfeits?"#141428":"#0a0a16",border:`1px solid ${historyHideForfeits?"#44ccaa66":"#33445544"}`,borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:historyHideForfeits?"#88ccaa":"#667788",textAlign:"center"}}>{historyHideForfeits?"Forfeits hidden":"Showing all runs"}</button>
            </div>
            {_filtered.length===0?<div style={{color:"#556677",fontSize:11,marginTop:40}}>No runs recorded yet. Go die in the void!</div>:(
              <div style={{width:"100%",maxWidth:GW-20,marginTop:14}}>
                <div style={{color:"#556677",fontSize:8,textAlign:"center",marginBottom:6,minHeight:90}}>
                  {historyHover!==null&&_filtered[historyHover]?(()=>{const r=_filtered[historyHover];const d=new Date(r.date);const histIdx=_hist.indexOf(r);const cumE=histIdx>=0?_cumEchoes[histIdx]:0;return <div style={{color:"#aabbcc",fontSize:9,lineHeight:1.7,textAlign:"center"}}>
                    <span style={{color:"#ccddee",fontWeight:"bold"}}>Run #{histIdx+1}</span>{r.forfeited&&<span style={{color:"#cc8855"}}> (forfeited)</span>}<br/>
                    {d.toLocaleDateString()} {d.toLocaleTimeString()}<br/>
                    Max wave: <span style={{color:"#ccddee"}}>{r.wave}</span> · Killed by: <span style={{color:"#cc8899"}}>{r.cause}</span> · Kills: <span style={{color:"#ccddee"}}>{r.kills}</span><br/>
                    <span style={{color:CUR.scrap.color}}>⬡{r.scrap||0}</span> · <span style={{color:CUR.cores.color}}>◆{r.cores||0}</span> · <span style={{color:CUR.plasma.color}}>✦{r.plasma||0}</span> · <span style={{color:CUR.echoes.color}}>⬢+{r.echoes}</span><br/>
                    Lifetime echoes at this point: <span style={{color:CUR.echoes.color}}>⬢ {cumE.toLocaleString()}</span>
                  </div>})():<span>Hover over a bar for run details</span>}
                </div>
                <div style={{display:"flex"}}>
                  {/* Y-axis labels */}
                  <div style={{width:30,flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"space-between",paddingRight:4,height:_chartH}}>
                    <span style={{color:"#445566",fontSize:7,textAlign:"right"}}>W{_maxW}</span>
                    {_maxW>2&&<span style={{color:"#334455",fontSize:7,textAlign:"right"}}>W{Math.round(_maxW/2)}</span>}
                    <span style={{color:"#445566",fontSize:7,textAlign:"right"}}>0</span>
                  </div>
                  {/* Chart area */}
                  <div style={{flex:1,position:"relative"}}>
                    <div onMouseLeave={()=>setHistoryHover(null)} style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",height:_chartH,borderBottom:"1px solid #22334466",borderLeft:"1px solid #22334466",padding:"0 2px"}}>
                      {_filtered.map((r,i)=>{const h=Math.max(4,(_chartH-10)*(r.wave/_maxW));return <div key={i}
                        onMouseEnter={()=>setHistoryHover(i)} onMouseLeave={()=>{}}
                        style={{width:_barW,height:h,background:r.forfeited?"#cc885566":"#00e5ff55",border:historyHover===i?`1px solid ${r.forfeited?"#cc8855":"#00e5ff"}`:"1px solid transparent",borderBottom:"none",borderRadius:"2px 2px 0 0",cursor:"pointer",transition:"border 0.1s",flexShrink:0}} />})}
                    </div>
                    {/* Trendline overlay */}
                    {_filtered.length>=3&&<svg style={{position:"absolute",top:0,left:0,width:"100%",height:_chartH,pointerEvents:"none"}} viewBox={`0 0 ${_filtered.length*_barW+(_filtered.length-1)*Math.max(0,_barW<=4?0:1)} ${_chartH}`} preserveAspectRatio="none">
                      <polyline fill="none" stroke="#ffcc44" strokeWidth="2" strokeOpacity="0.5" strokeLinejoin="round" points={_trend.map((tw,i)=>{const x=i*(_barW+Math.max(0,_barW<=4?0:1))+_barW/2;const y=_chartH-(_chartH-10)*(tw/_maxW);return `${x},${y}`;}).join(" ")} />
                    </svg>}
                    {/* Midline guide */}
                    <div style={{position:"absolute",top:_chartH/2,left:0,right:0,borderTop:"1px dashed #22334433",pointerEvents:"none"}} />
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{color:"#445566",fontSize:7}}>Run 1</span><span style={{color:"#445566",fontSize:7}}>Run {_filtered.length}</span></div>
                  </div>
                </div>
                {_trend.length>0&&<div style={{color:"#ffcc4466",fontSize:7,textAlign:"center",marginTop:4}}>— trend ({_trendWindow}-run avg)</div>}
              </div>)}
            <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),marginTop:16,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
          </div>);})()}

        {phase==="settings"&&(
          <div className="vs-scroll" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",background:"rgba(6,6,14,0.93)",zIndex:10,overflow:"auto",padding:"20px 16px"}}>
            <h2 style={{color:"#ccddee",fontSize:17,letterSpacing:3,margin:0}}>SETTINGS</h2>
            <h3 style={{color:"#99aabb",fontSize:11,letterSpacing:2,margin:"16px 0 8px"}}>SHIP COLOUR</h3>
            <div style={{marginBottom:10,pointerEvents:"none"}}><ShipDisplay onClick={()=>{}} size={64} /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,maxWidth:360}}>
              {SHIP_COLORS.map(sc=>{
                const sel=meta.shipColor===sc.id||(sc.id==="cyan"&&!meta.shipColor);
                return(
                  <button key={sc.id} onClick={()=>{setMeta(prev=>{const nx={...prev,shipColor:sc.id};saveMeta(nx);return nx;});}}
                    style={{padding:"10px 6px",background:sel?"#141428":"#0a0a16",border:`2px solid ${sel?sc.color:sc.color+"33"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s"}}
                    onMouseOver={e=>e.currentTarget.style.borderColor=sc.color} onMouseOut={e=>e.currentTarget.style.borderColor=sel?sc.color:sc.color+"33"}>
                    <div style={{width:20,height:20,margin:"0 auto 6px",background:sc.color,borderRadius:"50%",boxShadow:`0 0 8px ${sc.glow}66`}} />
                    <div style={{color:sel?sc.color:"#8899aa",fontSize:8,fontWeight:sel?"bold":"normal"}}>{sc.name}</div>
                  </button>
                );
              })}
            </div>
            <h3 style={{color:"#99aabb",fontSize:11,letterSpacing:2,margin:"20px 0 8px"}}>BULLET COLOUR</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,maxWidth:360}}>
              {BULLET_COLORS.map(bc=>{
                const sel=meta.bulletColor===bc.id||(bc.id==="teal"&&(!meta.bulletColor||meta.bulletColor==="match"));
                const dispCol=bc.color;
                return(
                  <button key={bc.id} onClick={()=>{setMeta(prev=>{const nx={...prev,bulletColor:bc.id};saveMeta(nx);return nx;});}}
                    style={{padding:"8px 4px",background:sel?"#141428":"#0a0a16",border:`2px solid ${sel?dispCol:dispCol+"33"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s"}}
                    onMouseOver={e=>e.currentTarget.style.borderColor=dispCol} onMouseOut={e=>e.currentTarget.style.borderColor=sel?dispCol:dispCol+"33"}>
                    <div style={{width:14,height:14,margin:"0 auto 4px",background:dispCol,borderRadius:"50%",boxShadow:`0 0 6px ${dispCol}66`}} />
                    <div style={{color:sel?dispCol:"#8899aa",fontSize:7,fontWeight:sel?"bold":"normal"}}>{bc.name}</div>
                  </button>
                );
              })}
            </div>
            <h3 style={{color:"#99aabb",fontSize:11,letterSpacing:2,margin:"20px 0 8px"}}>GAMEPLAY</h3>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:380}}>
              {[
                {key:"showNewEnemy",label:"New enemy alerts",get:()=>metaRef.current.showNewEnemy!==false,toggle:()=>setMeta(prev=>{const nx={...prev,showNewEnemy:prev.showNewEnemy===false?true:false};saveMeta(nx);return nx;})},
                {key:"showHitText",label:"Hit numbers",get:()=>metaRef.current.showHitText!==false,toggle:()=>setMeta(prev=>{const nx={...prev,showHitText:prev.showHitText===false?true:false};saveMeta(nx);return nx;})},
                {key:"showMagnetRange",label:"Pickup range indicator",get:()=>!!meta.showMagnetRange,toggle:()=>setMeta(prev=>{const nx={...prev,showMagnetRange:!prev.showMagnetRange};saveMeta(nx);return nx;})},
                {key:"showFps",label:"FPS counter",get:()=>!!meta.showFps,toggle:()=>setMeta(prev=>{const nx={...prev,showFps:!prev.showFps};saveMeta(nx);return nx;})},
              ].map(tog=>{const isOn=tog.get();return(
                <button key={tog.key} onClick={tog.toggle}
                  style={{padding:"8px 10px",width:"calc(50% - 3px)",boxSizing:"border-box",background:isOn?"#141428":"#0a0a16",border:`1px solid ${isOn?"#44ccaa66":"#33445544"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:isOn?"#88ccaa":"#667788",textAlign:"center"}}>
                  {tog.label}: {isOn?"ON":"OFF"}
                </button>);})}
            </div>
            <h3 style={{color:"#99aabb",fontSize:11,letterSpacing:2,margin:"20px 0 8px"}}>DATA</h3>
            <div style={{display:"flex",gap:10}}>
              {!confirmReset
                ?<button onClick={()=>setConfirmReset(true)} style={{...bs2("#ff334433"),padding:"8px 20px",fontSize:11,borderWidth:1,color:"#886666"}}>RESET ALL PROGRESS</button>
                :<button onClick={()=>{const f={echoes:0,levels:{},shards:0,shardsBought:0,abUpgrades:{},shipColor:meta.shipColor||"cyan",bulletColor:meta.bulletColor,showNewEnemy:metaRef.current.showNewEnemy,showHitText:metaRef.current.showHitText,showMagnetRange:true,highWave:0};setMeta(f);saveMeta(f);try{localStorage.removeItem("vs4-history");}catch(e){}setConfirmReset(false);setShowTutPrompt(true);}} style={{...bs2("#ff3344"),padding:"8px 20px",fontSize:11,borderWidth:1,color:"#ff4455"}}>ARE YOU SURE?</button>
              }
            </div>
            {confirmReset&&<div style={{color:"#775555",fontSize:8,marginTop:4}}>This will erase all Echoes, meta upgrades, ability shards, and ability upgrades permanently.</div>}
            <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),marginTop:20,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
          </div>
        )}

        {phase==="shop"&&shopData&&(
          <div className="vs-fade" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"rgba(6,6,14,0.93)",zIndex:10,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a2e",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <h2 style={{color:"#ccddee",fontSize:13,margin:0,letterSpacing:3}}>UPGRADE STATION</h2>{(()=>{const gs=gsRef.current;if(!gs||!has(gs,"drone"))return null;const g=gs._droneGift;if(g!==undefined&&g!==null&&!gs._droneGiftShown){gs._droneGiftShown=true;gs._droneGiftDisplay=g;}const dg=gs?._droneGiftDisplay;if(dg===undefined||dg===null)return null;const parts=[];if(dg.scrap)parts.push(`+${dg.scrap} ⬡`);if(dg.cores)parts.push(`+${dg.cores} ◆`);if(dg.plasma)parts.push(`+${dg.plasma} ✦`);if(parts.length===0)parts.push("nothing this wave");return <div style={{color:"#44ddcc",fontSize:10,marginTop:3,padding:"3px 8px",background:"#0a1a1a",border:"1px solid #44ddcc33",borderRadius:3}}>🤖 Drone gift: {parts.join("  ")}</div>;})()}
                <div style={{display:"flex",gap:10,marginTop:3,fontSize:12}}>
                  <span style={{color:CUR.scrap.color}}>⬡{shopData.scrap}</span><span style={{color:CUR.cores.color}}>◆{shopData.cores}</span><span style={{color:CUR.plasma.color}}>✦{shopData.plasma}</span></div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setShowStats(p=>!p)} style={{background:"none",border:"1px solid #334455",color:showStats?"#ff8866":"#778899",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9}}>SHIP</button>
                <button onClick={()=>setShowAnalyser(p=>!p)} style={{background:"none",border:"1px solid #334455",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:showAnalyser?"#ff8866":"#778899"}}>DMG</button>
                <button onClick={()=>setShowRegenAnalyser(p=>!p)} style={{background:"none",border:"1px solid #334455",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:showRegenAnalyser?"#44ff88":"#778899"}}>REGEN</button>
                <button onClick={()=>setShowWiki(true)} style={{background:"none",border:"1px solid #334455",color:"#778899",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9}}>CODEX</button>
              </div>
            </div>
            {showStats&&<div style={{padding:"4px 14px",borderBottom:"1px solid #1a1a2e"}}><ShipStats metaData={meta} gsData={gsRef.current} wide /></div>}
            {showAnalyser&&(()=>{const gs=gsRef.current;if(!gs)return null;
              const mkRows=(data,label)=>{const entries=Object.entries(data||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);const total=entries.reduce((s,[,v])=>s+v,0);
                return <div style={{marginBottom:8}}><div style={{color:"#99aabb",fontSize:10,fontWeight:"bold",marginBottom:4}}>{label}</div>
                  {entries.length===0?<div style={{color:"#556677",fontSize:9}}>No damage dealt yet</div>:entries.map(([src,val])=>{const pct=total>0?val/total*100:0;return <div key={src} style={{marginBottom:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:"#ccddee"}}>{src}</span><span style={{color:"#99aabb"}}>{Math.round(val).toLocaleString()} <span style={{color:"#667788"}}>({pct<1&&pct>0?"<1":Math.round(pct)}%)</span></span></div>
                    <div style={{height:7,background:"#14142a",borderRadius:2,marginTop:2}}><div style={{height:7,background:"#ff886666",borderRadius:2,width:pct+"%"}} /></div></div>})}</div>};
              return <div className="vs-scroll" style={{padding:"6px 14px",borderBottom:"1px solid #1a1a2e",maxHeight:200,overflow:"auto"}}>
                {mkRows(gs.waveDmg,"This Wave")}{mkRows(gs.dmgTrack,"Entire Run")}</div>})()}
            {showRegenAnalyser&&(()=>{const gs=gsRef.current;if(!gs)return null;
              const mkRows=(data,label)=>{const entries=Object.entries(data||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);const total=entries.reduce((s,[,v])=>s+v,0);
                return <div style={{marginBottom:8}}><div style={{color:"#44ff88",fontSize:10,fontWeight:"bold",marginBottom:4}}>{label}</div>
                  {entries.length===0?<div style={{color:"#556677",fontSize:9}}>No healing yet</div>:entries.map(([src,val])=>{const pct=total>0?val/total*100:0;return <div key={src} style={{marginBottom:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:"#ccddee"}}>{src}</span><span style={{color:"#99aabb"}}>{Math.round(val).toLocaleString()} <span style={{color:"#667788"}}>({pct<1&&pct>0?"<1":Math.round(pct)}%)</span></span></div>
                    <div style={{height:7,background:"#14142a",borderRadius:2,marginTop:2}}><div style={{height:7,background:"#44ff8866",borderRadius:2,width:pct+"%"}} /></div></div>})}</div>};
              return <div className="vs-scroll" style={{padding:"6px 14px",borderBottom:"1px solid #1a1a2e",maxHeight:200,overflow:"auto"}}>
                {mkRows(gs.waveHeal,"This Wave")}{mkRows(gs.healTrack,"Entire Run")}</div>})()}
            <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto"}}><div style={{padding:"5px 8px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,alignContent:"start"}}>
              {[...SHOP].sort((a,b)=>{const aL=a.wave>shopData.wave?1:0,bL=b.wave>shopData.wave?1:0;if(aL!==bL)return aL-bL;if(aL===1)return a.wave-b.wave;return 0;}).map(up=>{
                const lvl=shopData.upgrades[up.id]||0,maxed=lvl>=up.max,locked=up.wave>shopData.wave;
                const cost=Math.ceil(up.base*Math.pow(1+lvl*up.scale,up.exp));
                const canAfford=!locked&&!maxed&&shopData[up.cur]>=cost;
                const unlockedCantAfford=!locked&&!maxed&&shopData[up.cur]<cost;
                const borderCol=locked?"#14142a":maxed?"#14142a":canAfford?"#44aacc66":"#22334444";
                return(
                  <button key={up.id} onClick={()=>canAfford&&buyShop(up.id)} disabled={!canAfford}
                    style={{padding:"5px 6px",
                      background:locked?"#06060e":maxed?"#1a1408":canAfford?"#0c1020":"#0a0a16",
                      border:`1px solid ${maxed?"#ffcc4433":borderCol}`,
                      borderRadius:3,cursor:canAfford?"pointer":"default",textAlign:"left",
                      opacity:locked?0.45:1,fontFamily:"inherit",transition:"all 0.15s",position:"relative",overflow:"hidden"}}
                    onMouseOver={e=>canAfford&&(e.currentTarget.style.borderColor="#44ccee")}
                    onMouseOut={e=>(e.currentTarget.style.borderColor=maxed?"#ffcc4433":borderCol)}>
                    {maxed&&<div className="gold-shimmer"/>}{locked&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#8899aa",fontSize:9,fontWeight:"bold",zIndex:1,background:"rgba(6,6,14,0.65)",borderRadius:3}}>🔒 Wave {up.wave}</div>}
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:locked?"#667788":CC[up.cat],fontSize:10,fontWeight:"bold"}}>{up.name}</span><span style={{color:"#667788",fontSize:8}}>{lvl}/{up.max}</span></div>
                    <div style={{color:locked?"#556677":"#8899aa",fontSize:8,marginTop:1}}>{up.desc}</div>
                    {!maxed&&!locked&&<div style={{display:"flex",alignItems:"center",gap:4,marginTop:1}}>
                      <span style={{color:canAfford?CUR[up.cur]?.color:"#775555",fontSize:9,fontWeight:canAfford?"bold":"normal"}}>{cost} {up.cur}</span>
                      {unlockedCantAfford&&<span style={{color:"#665555",fontSize:7}}>· can't afford</span>}
                    </div>}
                    {maxed&&<div style={{color:"#556677",fontSize:8,marginTop:1}}>MAXED</div>}
                  </button>);
              })}
            </div></div>
            <div style={{padding:10,borderTop:"1px solid #1a1a2e",display:"flex",justifyContent:"center",gap:8,flexDirection:"column",alignItems:"center",flexShrink:0}}>
              {(()=>{const gs=gsRef.current;const _tutBlock=gs?.isTutorial&&(tutStep===3||tutStep===4);const _tutForfeitBlock=gs?.isTutorial&&tutStep===7||tutStep===8;return <button onClick={()=>{if(!_tutBlock&&!_tutForfeitBlock)cont();}} style={{...bs2(_tutBlock||_tutForfeitBlock?"#33445544":"#44ff88"),color:_tutBlock||_tutForfeitBlock?"#445566":"#44ff88",cursor:_tutBlock||_tutForfeitBlock?"default":"pointer"}}>{_tutBlock?"BUY UPGRADE FIRST":_tutForfeitBlock?"FORFEIT TO CONTINUE":"NEXT WAVE →"}</button>;})()}
              {gsRef.current?.isTutorial&&tutStep!==7?null:!confirmForfeit?<button onClick={()=>setConfirmForfeit(true)} style={{background:"none",border:"none",color:"#554444",fontSize:9,cursor:"pointer",fontFamily:"inherit",padding:"4px 8px"}}>FORFEIT RUN</button>
              :<div style={{textAlign:"center"}}><div style={{color:"#cc5555",fontSize:9,marginBottom:4}}>End this run? You'll receive <span style={{color:CUR.echoes.color}}>⬢ {calcEchoes(gsRef.current)}</span> echoes.</div>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}><button onClick={forfeit} style={{...bs2("#ff3344"),padding:"5px 14px",fontSize:10,borderWidth:1}} {...hv("#ff3344")}>FORFEIT</button><button onClick={()=>setConfirmForfeit(false)} style={{...bs2("#55667744"),padding:"5px 14px",fontSize:10,borderWidth:1,color:"#8899aa"}}>CANCEL</button></div></div>}
            </div>
          </div>
        )}

        {phase==="dead"&&deathData&&(
          <div className={deathData.cause==="Self"?"":"vs-fade"} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(6,6,14,0.9)",zIndex:10}}>
            <h2 style={{color:"#ff3355",fontSize:24,letterSpacing:4,margin:0}}>VOID CLAIMED</h2>
            <div style={{color:"#667788",fontSize:10,marginTop:8}}>Killed by: <span style={{color:"#cc8899"}}>{deathData.cause}</span></div>
            <div style={{color:"#8899aa",fontSize:12,marginTop:16,textAlign:"center",lineHeight:2.2}}>
              Waves: <span style={{color:"#dde"}}>{deathData.wave}</span> · Kills: <span style={{color:"#dde"}}>{deathData.kills}</span>
              <div style={{color:CUR.echoes.color,marginTop:6,fontSize:15}}>+{deathData.echoesEarned} Echoes</div></div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={()=>setDeathDmgPopup(p=>!p)} style={{background:"none",border:"1px solid #334455",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:deathDmgPopup?"#ff8866":"#778899",borderRadius:3}}>DMG analyser</button>
              <button onClick={()=>setDeathRegenPopup(p=>!p)} style={{background:"none",border:"1px solid #334455",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:deathRegenPopup?"#44ff88":"#778899",borderRadius:3}}>REGEN analyser</button>
            </div>
            {(deathDmgPopup||deathRegenPopup)&&(()=>{const gs=gsRef.current;if(!gs)return null;
              const mkR=(data,label,col)=>{const entries=Object.entries(data||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);const total=entries.reduce((s,[,v])=>s+v,0);
                return <div style={{marginBottom:8}}><div style={{color:col,fontSize:10,fontWeight:"bold",marginBottom:4}}>{label}</div>
                  {entries.length===0?<div style={{color:"#556677",fontSize:9}}>None recorded</div>:entries.map(([src,val])=>{const pct=total>0?val/total*100:0;return <div key={src} style={{marginBottom:3}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:"#ccddee"}}>{src}</span><span style={{color:"#99aabb"}}>{Math.round(val).toLocaleString()} ({pct<1&&pct>0?"<1":Math.round(pct)}%)</span></div>
                    <div style={{height:5,background:"#14142a",borderRadius:2,marginTop:1}}><div style={{height:5,background:col+"66",borderRadius:2,width:pct+"%"}} /></div></div>})}</div>};
              return <div style={{padding:"8px 12px",background:"#0a0a1a",border:"1px solid #22334444",borderRadius:4,maxWidth:400,width:"100%",marginTop:8}}>
                {deathDmgPopup&&<>{mkR(gs.waveDmg,"Final Wave","#ff8866")}{mkR(gs.dmgTrack,"Entire Run","#ff8866")}</>}
                {deathRegenPopup&&<>{mkR(gs.waveHeal,"Final Wave","#44ff88")}{mkR(gs.healTrack,"Entire Run","#44ff88")}</>}
              </div>;})()}
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <button onClick={()=>setPhase("metashop")} style={bs2("#bb77ff")} {...hv("#bb77ff")}>META</button>
              <button onClick={()=>initGame()} style={bs2("#00e5ff")} {...hv("#00e5ff")}>RETRY</button>
              <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),borderWidth:1,color:"#8899aa",padding:"10px 20px"}}>MENU</button></div>
          </div>
        )}

        {phase==="metashop"&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"rgba(6,6,14,0.95)",zIndex:10,overflow:"hidden"}}>
            <div style={{padding:"12px 14px 6px",borderBottom:"1px solid #1a1a2e"}}>
              <h2 style={{color:CUR.echoes.color,fontSize:15,margin:0,letterSpacing:3}}>META UPGRADES</h2>
              <div style={{display:"flex",gap:10,alignItems:"center",marginTop:3}}>
                <span style={{color:CUR.echoes.color,fontSize:13}}>⬢ {meta.echoes} Echoes</span>
                {metaTab==="abilities"&&<span style={{color:"#44ddcc",fontSize:11}}>◈ {meta.shards||0} Shards</span>}
              </div>
              <div style={{display:"flex",gap:4,marginTop:8}}>
                <button onClick={()=>{setMetaTab("ship");setAbInfoId(null);}} style={{padding:"5px 14px",background:metaTab==="ship"?"#1a1a2e":"transparent",border:`1px solid ${metaTab==="ship"?"#bb77ff66":"#33445544"}`,borderRadius:"4px 4px 0 0",color:metaTab==="ship"?"#bb99ff":"#667788",fontSize:10,cursor:"pointer",fontFamily:"inherit",borderBottom:"none"}}>Ship Upgrades</button>
                {tutStep===9||tutStep===10?<button style={{padding:"5px 14px",background:"transparent",border:"1px solid #22223344",borderRadius:"4px 4px 0 0",color:"#334455",fontSize:10,fontFamily:"inherit",borderBottom:"none",cursor:"default"}}>Ability Upgrades</button>
                :<button onClick={()=>{setMetaTab("abilities");setAbInfoId(null);}} style={{padding:"5px 14px",background:metaTab==="abilities"?"#1a1a2e":"transparent",border:`1px solid ${metaTab==="abilities"?"#44ddcc66":"#33445544"}`,borderRadius:"4px 4px 0 0",color:metaTab==="abilities"?"#44ddcc":"#667788",fontSize:10,cursor:"pointer",fontFamily:"inherit",borderBottom:"none"}}>Ability Upgrades</button>}
              </div>
            </div>

            {metaTab==="ship"&&(()=>{const tier=meta.metaTier||1;const allMaxed=META.every(up=>(meta.levels[up.id]||0)>=up.max*tier);const echoesToMax=META.reduce((s,up)=>{let t=0;for(let l=meta.levels[up.id]||0;l<up.max*tier;l++)t+=metaCost(up,l,tier);return s+t;},0);
              return <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,padding:10,display:"flex",flexDirection:"column",gap:5,overflow:"auto"}}>
              <div style={{color:"#667788",fontSize:8,textAlign:"center",marginBottom:2}}>Tier {tier} · Ship upgrades focus on additive stat boosts that improve your starting loadout</div>
              {META.map(up=>{const lvl=meta.levels[up.id]||0,mx=up.max*tier,maxed=lvl>=mx,cost=metaCost(up,lvl,tier),canBuy=!maxed&&meta.echoes>=cost;
                return(<button key={up.id} onClick={()=>buyMeta(up.id)} disabled={!canBuy}
                  style={{padding:"8px 10px",background:maxed?"#1a1408":canBuy?"#0e0e22":"#0a0a14",border:`1px solid ${maxed?"#ffcc4466":"#bb77ff22"}`,borderRadius:3,cursor:canBuy?"pointer":"default",textAlign:"left",opacity:maxed?1:1,fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",overflow:"hidden",boxShadow:maxed?"0 0 8px #ffcc4418":"none",flexShrink:0}}
                  onMouseOver={e=>canBuy&&(e.currentTarget.style.borderColor="#bb77ff")} onMouseOut={e=>(e.currentTarget.style.borderColor=maxed?"#ffcc4466":"#bb77ff22")}>{maxed&&<div className="gold-shimmer"/>}
                  <div><div style={{color:"#ccddee",fontSize:11,fontWeight:"bold"}}>{up.name} <span style={{color:"#556677",fontSize:9}}>Lv.{lvl}/{mx}</span></div><div style={{color:"#8899aa",fontSize:9}}>{up.desc}</div></div>
                  <div style={{color:maxed?"#445566":CUR.echoes.color,fontSize:12,whiteSpace:"nowrap",marginLeft:8}}>{maxed?"MAX":`⬢ ${cost}`}</div>
                </button>);})}
              <div style={{padding:"10px",background:tier>=3?"#1a1408":"#0a0a1a",border:`1px solid ${tier>=3?"#ffcc4466":"#bb77ff22"}`,borderRadius:4,flexShrink:0,position:"relative",overflow:"hidden"}}>{tier>=3&&<div className="gold-shimmer"/>}
                <div style={{color:"#bb99ff",fontSize:10,fontWeight:"bold",marginBottom:4}}>TIER SYSTEM</div>
                <div style={{color:"#778899",fontSize:8,lineHeight:1.5,marginBottom:6}}>Max all upgrades at the current tier to unlock the next. Each tier doubles max levels with higher costs. Current tier: <span style={{color:"#bb99ff"}}>{tier}</span></div>
                {!allMaxed&&<div style={{color:"#667788",fontSize:8,marginBottom:6}}>Echoes needed to max current tier: <span style={{color:CUR.echoes.color}}>{echoesToMax}</span></div>}
                <button onClick={buyTier} disabled={!allMaxed||meta.echoes<800}
                  style={{padding:"6px 16px",background:allMaxed&&tier<3?"#1a1408":"#0a0a14",border:`1px solid ${tier>=3?"#ffcc4466":allMaxed?"#bb77ff66":"#33445522"}`,borderRadius:3,cursor:allMaxed&&tier<3?"pointer":"default",fontFamily:"inherit",fontSize:10,color:tier>=3?"#ffcc44":allMaxed?CUR.echoes.color:"#445566",opacity:allMaxed||tier>=3?1:0.5,position:tier>=3?"relative":"static",overflow:"hidden"}}>{tier>=3&&<div className="gold-shimmer"/>}
                  {tier>=3?"TIER 3 — MAX":allMaxed?`Unlock Tier ${tier+1} · ⬢ ${tier===1?800:25000}`:`Max all tier ${tier} upgrades first`}
                </button>
              </div>
            </div>;})()}

            {metaTab==="abilities"&&(()=>{
              const shards=meta.shards||0,bought=meta.shardsBought||0;const shardsNeeded=60;const shardsLeft=Math.max(0,shardsNeeded-shards-(()=>{const au=meta.abUpgrades||{};let used=0;ABILITIES.forEach(ab=>{if(au[ab.id+"_sub1"])used++;if(au[ab.id+"_sub2"])used++;if(au[ab.id+"_mastery"])used+=3;});return used;})());const allShardsOwned=shardsLeft<=0;
              const shardCost=Math.ceil(100*Math.pow(1+bought*0.12,1.6));
              const canBuyShard=meta.echoes>=shardCost;
              const abUp=meta.abUpgrades||{};
              const hasSub=(abId,n)=>!!abUp[abId+"_sub"+n];
              const hasMastery=(abId)=>!!abUp[abId+"_mastery"];
              const canBuySub=(abId,n)=>!hasSub(abId,n)&&shards>=1;
              const canBuyMastery=(abId)=>!hasMastery(abId)&&hasSub(abId,1)&&hasSub(abId,2)&&shards>=3;
              const buyAbShard=()=>{if(!canBuyShard)return;setMeta(prev=>{const nx={...prev,echoes:prev.echoes-shardCost,shards:(prev.shards||0)+1,shardsBought:(prev.shardsBought||0)+1};saveMeta(nx);return nx;});};
              const buyAbUp=(abId,type)=>{
                if(type==="mastery"){if(!canBuyMastery(abId))return;setMeta(prev=>{const nx={...prev,shards:(prev.shards||0)-3,abUpgrades:{...(prev.abUpgrades||{}),[abId+"_mastery"]:true}};saveMeta(nx);return nx;});}
                else{const n=type;if(!canBuySub(abId,n))return;setMeta(prev=>{const nx={...prev,shards:(prev.shards||0)-1,abUpgrades:{...(prev.abUpgrades||{}),[abId+"_sub"+n]:true}};saveMeta(nx);return nx;});}
              };
              return <><div style={{padding:"6px 10px",borderBottom:"1px solid #1a1a2e"}}>
                <div style={{padding:"8px 10px",background:"#0a0a1a",border:"1px solid #44ddcc22",borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{color:"#44ddcc",fontSize:11,fontWeight:"bold"}}>◈ Ability Shards</div>
                    <div style={{color:"#778899",fontSize:8}}>Used to unlock ability sub-upgrades and masteries. Each shard costs more than the last</div>
                    <div style={{color:"#667788",fontSize:8}}>You have: <span style={{color:"#44ddcc"}}>{shards}</span> · Purchased: {bought} · Left to max: <span style={{color:shardsLeft>0?"#cc8855":"#44ddcc"}}>{shardsLeft}</span> · Cost to max: <span style={{color:CUR.echoes.color}}>{(()=>{let c=0;const b2=meta.shardsBought||0;for(let i=0;i<shardsLeft;i++)c+=Math.ceil(100*Math.pow(1+(b2+i)*0.12,1.6));return c;})()}⬢</span></div></div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                    <button onClick={()=>setConfirmRespec(true)}
                    style={{padding:"6px 10px",background:"#0a0a14",border:"1px solid #cc555544",borderRadius:3,cursor:"pointer",fontFamily:"inherit",color:"#886666",fontSize:9,whiteSpace:"nowrap"}}>
                    Respec
                  </button>
                  <button onClick={buyAbShard} disabled={!canBuyShard||allShardsOwned}
                    style={{padding:"6px 14px",background:allShardsOwned?"#1a1408":canBuyShard?"#0e1a1a":"#0a0a14",border:`1px solid ${allShardsOwned?"#ffcc4466":canBuyShard?"#44ddcc66":"#33445522"}`,borderRadius:3,cursor:canBuyShard&&!allShardsOwned?"pointer":"default",fontFamily:"inherit",color:allShardsOwned?"#ffcc44":canBuyShard?CUR.echoes.color:"#445566",fontSize:11,whiteSpace:"nowrap",position:"relative",overflow:"hidden",boxShadow:allShardsOwned?"0 0 8px #ffcc4418":"none"}}
                    onMouseOver={e=>canBuyShard&&!allShardsOwned&&(e.currentTarget.style.borderColor="#44ddcc")} onMouseOut={e=>(e.currentTarget.style.borderColor=allShardsOwned?"#ffcc4466":canBuyShard?"#44ddcc66":"#33445522")}>
                    {allShardsOwned&&<div className="gold-shimmer"/>}
                    {allShardsOwned?"MAX":`⬢ ${shardCost}`}
                  </button>
                  </div>
                </div>
                {confirmRespec&&<div style={{padding:"8px",background:"#1a0a0a",border:"1px solid #cc555544",borderRadius:4,margin:"4px 0"}}>
                  <div style={{color:"#cc8888",fontSize:9,marginBottom:6}}>Are you sure you want to respec for 200 echoes? You will get back all of your ability shards to respend.</div>
                  <div style={{display:"flex",gap:6}}><button onClick={()=>{if(meta.echoes<200)return;const au=meta.abUpgrades||{};let refund=0;ABILITIES.forEach(ab=>{if(au[ab.id+"_sub1"])refund++;if(au[ab.id+"_sub2"])refund++;if(au[ab.id+"_mastery"])refund+=3;});setMeta(prev=>{const nx={...prev,echoes:prev.echoes-200,shards:(prev.shards||0)+refund,abUpgrades:{}};saveMeta(nx);return nx;});setConfirmRespec(false);}}
                    style={{padding:"4px 12px",background:"none",border:"1px solid #cc5555",color:"#cc5555",cursor:meta.echoes>=200?"pointer":"default",fontFamily:"inherit",fontSize:9,borderRadius:3,opacity:meta.echoes>=200?1:0.4}}>Respec · ⬢ 200</button>
                  <button onClick={()=>setConfirmRespec(false)} style={{padding:"4px 12px",background:"none",border:"1px solid #33445544",color:"#778899",cursor:"pointer",fontFamily:"inherit",fontSize:9,borderRadius:3}}>Cancel</button></div></div>}
                <div style={{color:"#556677",fontSize:8,textAlign:"center",margin:"4px 0"}}>Each ability has 2 sub-upgrades (◈1 each) and 1 mastery (◈3, requires both subs)</div>
              </div>
              <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,padding:10,overflow:"auto",display:"flex",flexDirection:"column",gap:6}}>
                {ABILITIES.map(ab=>{
                  const s1=hasSub(ab.id,1),s2=hasSub(ab.id,2),mas=hasMastery(ab.id);
                  const cs1=canBuySub(ab.id,1),cs2=canBuySub(ab.id,2),cm=canBuyMastery(ab.id);
                  const allOwned=s1&&s2&&mas;
                  const _abDescs={orbitals_sub1:"Increase the number of electrons by 2.",orbitals_sub2:"Hitting an enemy with any of your electrons will deal 30% damage, but can only deal damage to any enemy once.",orbitals_mastery:"Gain another layer of 4 electrons, that travel in an elliptical orbit.",chain_sub1:"Chain lightning now targets 4 enemies.",chain_sub2:"The original target of the chain lightning gets electrocuted and it receives 60% of damage.",chain_mastery:"Echo Clone, Seeker Swarm and Combat Drone now apply a green chain lightning: it targets 4 enemies for every 3rd successful hit, dealing 25% damage on arc and 40% damage on electrocution.",homing_sub1:"Fires missiles every second.",homing_sub2:"Missiles now have a 15% chance to be critical, dealing 2.5x damage.",homing_mastery:"Missiles activate a burning bomb on hit with a radius of 6 that applies burn that does 10% dmg/s for 5 seconds.",slowfield_sub1:"Increase radius to 18.",slowfield_sub2:"The field effects the max pickup range, causing it to expand to 1.25x what it usually is, before contracting to its regular size, repeating continuously over 6s cycles.",slowfield_mastery:"Slows down bomber enemies that enter your Temporal Drag at the same rate that bullets are slowed down, and any bombers killed in the Temporal Drag will only release half the amount of bullets.",mirror_sub1:"Make the clone have the same fire rate as your main ship.",mirror_sub2:"Currency drops can be picked up by the clone if it directly collides with them.",mirror_mastery:"Every 12 seconds, the clone unleashes a lasso, that winds up for 2 seconds before launching at the most dense group of enemies and moves them away from you, of a radius of 10 and lasts for 4 seconds.",drone_sub1:"If you take HP damage from an enemy, your drone gets mad at it, firing at 2x firing rate. It will solely target that enemy until it is dead.",drone_sub2:"Adds 3% to its damage percentage compared to your main weapon for every other ability you own.",drone_mastery:"Gives you a gift after every wave equal to half of all the pickups you failed to pick up during the wave, rounded up to the nearest integer.",gravity_sub1:"Bullets that are in the gravity well get smaller by 4% every second, for a maximum of 32% size reduction.",gravity_sub2:"The vortex gets a second, conjoined vortex with a radius of 7 that has its own gravitational pull.",gravity_mastery:"Every other time a vortex is activated, it turns golden, and any enemies killed in those golden vortexes drop double the currency.",overcharge_sub1:"Max overcharge amount is increased to 140% of max health.",overcharge_sub2:"Plasma pickups now heal 6 HP instead of 3.",overcharge_mastery:"Overcharge now persists between waves, with a limit of 110% of max health.",blackhole_sub1:"Increase bullets removed to 50%.",blackhole_sub2:"Sniper bullets will be removed first, and any snipers about to fire will have their attack fail.",blackhole_mastery:"Ability will be triggered on shield loss as well as HP damage.",void_regen_sub1:"Increase the max that can be regenerated to 90% of max health (without Overcharge active).",void_regen_sub2:"If you kill at least 1 enemy whilst waiting for void regen to start, the windup time is reduced to 3 seconds.",void_regen_mastery:"Taking no damage for an entire wave grants a golden shield with invincibility frames. Golden shields persist between waves but when lost are lost forever.",ricochet_sub1:"Bullets that ricochet receive a random small angle offset.",ricochet_sub2:"Bullets can hit one more wall before being destroyed.",ricochet_mastery:"When a ricocheted bullet hits an enemy, it performs a rage slice dealing 250% damage to enemies in a 120px line.",nova_sub1:"Increase the radius to 20.",nova_sub2:"Once it reaches max range, the shockwave collapses back on itself, dealing 80% damage to any enemy it hits.",nova_mastery:"Every time plasma nova is triggered, it leaves a landmine that, when an enemy hits it, explodes with 100% damage and a radius of 20."};
                  const boxStyle=(owned,canBuy)=>({flex:1,minHeight:56,padding:"10px 8px",background:owned?"#0e1a1a":canBuy?"#0c0c1a":"#08080f",border:`1px solid ${owned?"#44ddcc55":canBuy?"#44ddcc33":"#22223344"}`,borderRadius:3,cursor:canBuy&&!owned?"pointer":"default",textAlign:"center",fontFamily:"inherit",opacity:owned?1:canBuy?0.9:0.4,transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"});
                  return <div key={ab.id} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 8px",background:allOwned?"#1a1408":"#0a0a14",borderRadius:3,border:`1px solid ${allOwned?"#ffcc4466":"#14142a"}`,boxShadow:allOwned?"0 0 12px #ffcc4418, inset 0 0 8px #ffcc4408":"none",transition:"all 0.3s",position:"relative",overflow:"hidden",flexShrink:0}}>
                    {allOwned&&<div className="gold-shimmer"/>}
                    {/* Name column */}
                    <div style={{width:82,flexShrink:0}}>
                      <div style={{color:"#ccddee",fontSize:10,fontWeight:"bold",display:"flex",alignItems:"center",gap:3}}><AbilityIcon id={ab.id} size={14} color="#ccddee" />{ab.name}</div>
                      <div onClick={(e)=>{e.stopPropagation();setAbInfoId(abInfoId===ab.id?null:ab.id);}} style={{color:"#44667788",fontSize:9,cursor:"pointer",marginTop:3,display:"inline-flex",alignItems:"center",gap:3}}
                        onMouseOver={e=>e.currentTarget.style.color="#6688aa"} onMouseOut={e=>e.currentTarget.style.color="#44667788"}>
                        <span style={{display:"inline-block",width:13,height:13,borderRadius:"50%",border:"1px solid currentColor",textAlign:"center",lineHeight:"12px",fontSize:8}}>i</span>
                      </div>
                    </div>
                    {/* Upgrade boxes area - flex to fill remaining */}
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:5}}>
                      {/* Sub upgrades stacked */}
                      <div style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
                        <button onClick={()=>buyAbUp(ab.id,1)} disabled={s1||!cs1} style={boxStyle(s1,cs1)}
                          onMouseOver={e=>cs1&&!s1&&(e.currentTarget.style.borderColor="#44ddcc")} onMouseOut={e=>(e.currentTarget.style.borderColor=s1?"#44ddcc55":cs1?"#44ddcc33":"#22223344")}>
                          <div style={{color:s1?"#44ddcc":"#889999",fontSize:10,lineHeight:1.3}}>{_abDescs[ab.id+"_sub1"]||"???"}</div>
                          <div style={{color:s1?"#44ddcc":"#556677",fontSize:9,marginTop:3}}>{s1?"✓":"◈ 1"}</div>
                        </button>
                        <button onClick={()=>buyAbUp(ab.id,2)} disabled={s2||!cs2} style={boxStyle(s2,cs2)}
                          onMouseOver={e=>cs2&&!s2&&(e.currentTarget.style.borderColor="#44ddcc")} onMouseOut={e=>(e.currentTarget.style.borderColor=s2?"#44ddcc55":cs2?"#44ddcc33":"#22223344")}>
                          <div style={{color:s2?"#44ddcc":"#889999",fontSize:10,lineHeight:1.3}}>{_abDescs[ab.id+"_sub2"]||"???"}</div>
                          <div style={{color:s2?"#44ddcc":"#556677",fontSize:9,marginTop:3}}>{s2?"✓":"◈ 1"}</div>
                        </button>
                      </div>
                      {/* Arrow */}
                      <div style={{color:s1&&s2?"#44ddcc66":"#22334444",fontSize:14,flexShrink:0,width:18,textAlign:"center"}}>→</div>
                      {/* Mastery - same flex:1 as the sub column */}
                      <div style={{flex:1,display:"flex"}}>
                        <button onClick={()=>buyAbUp(ab.id,"mastery")} disabled={mas||!cm}
                          style={{...boxStyle(mas,cm),minHeight:92,border:`1px solid ${mas?"#ffcc4455":cm?"#ffcc4433":"#22223344"}`,background:mas?"#1a1408":cm?"#0c0c1a":"#08080f"}}
                          onMouseOver={e=>cm&&!mas&&(e.currentTarget.style.borderColor="#ffcc44")} onMouseOut={e=>(e.currentTarget.style.borderColor=mas?"#ffcc4455":cm?"#ffcc4433":"#22223344")}>
                          <div style={{color:mas?"#ffcc44":"#889999",fontSize:10,lineHeight:1.3}}>{mas&&<span style={{color:"#ffcc44",marginRight:4}}>★</span>}{_abDescs[ab.id+"_mastery"]||"???"}</div>
                          <div style={{color:mas?"#ffcc44":"#556677",fontSize:9,marginTop:3}}>{mas?"MASTERY":"◈ 3"}</div>
                        </button>
                      </div>
                    </div>
                  </div>;
                })}
                {/* Ability info popup */}
                {abInfoId&&(()=>{const ab=ABILITIES.find(a=>a.id===abInfoId);if(!ab)return null;return(
                  <div onClick={()=>setAbInfoId(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
                    <div onClick={e=>e.stopPropagation()} style={{background:"#0c0c1a",border:"1px solid #44ddcc44",borderRadius:6,padding:"14px 16px",maxWidth:320,width:"100%"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{color:"#ccddee",fontSize:13,fontWeight:"bold",display:"inline-flex",alignItems:"center",gap:4}}><AbilityIcon id={ab.id} size={18} color="#ccddee" />{ab.name}</div>
                        <button onClick={()=>setAbInfoId(null)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
                      </div>
                      <div style={{color:"#99aabb",fontSize:10,lineHeight:1.5}}>{ab.desc}</div>
                    </div>
                  </div>);})()}
              </div></>;
            })()}

            <div style={{padding:10,borderTop:"1px solid #1a1a2e",display:"flex",justifyContent:"center",gap:8}}>
              {tutStep>=9&&tutStep<=11?<div style={{color:"#667788",fontSize:9}}>Complete the tutorial to continue</div>:<>
              <button onClick={()=>initGame()} style={bs2("#00e5ff")} {...hv("#00e5ff")}>PLAY</button>
              <button onClick={()=>setPhase("menu")} style={{...bs2("#44556644"),borderWidth:1,color:"#778899"}}>MENU</button></>}</div>
          </div>
        )}
      </div>
    </div>
  );
}
