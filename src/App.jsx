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

/* === CLOUD SYNC CONFIG ===
 * GitHub Pages is static-only — no database, no server-side code.
 * To enable cloud saves, set up a FREE Supabase project:
 * 1. Go to https://supabase.com and create a project
 * 2. In SQL Editor, run:
 *    CREATE TABLE saves (
 *      code TEXT PRIMARY KEY,
 *      data JSONB NOT NULL,
 *      updated_at TIMESTAMPTZ DEFAULT now()
 *    );
 *    ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
 *    CREATE POLICY "allow_all" ON saves FOR ALL USING (true) WITH CHECK (true);
 * 3. Go to Settings > API and copy your Project URL and anon/public key below
 */
const SUPABASE_URL = "https://iydflctqkwnnnyqvzjog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGZsY3Rxa3dubm55cXZ6am9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODM3NDgsImV4cCI6MjA5MzA1OTc0OH0.-0vKfZihqCxgD835JYLbdvhmI5mjmhG1jznuTjtKizg";
const _SYNC_OK=SUPABASE_URL!=="YOUR_SUPABASE_URL"&&SUPABASE_ANON_KEY!=="YOUR_SUPABASE_ANON_KEY";
const BLOCKED_CODES=new Set(["0000","1111","2222","3333","4444","5555","6666","7777","8888","9999","0123","1234","2345","3456","4567","5678","6789","9876","8765","7654","6543","5432","4321","3210","0420","4200","0069","6969","1337","0666","6660"]);

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
  { id:"nova",name:"Plasma Landmine",desc:"Every 6 seconds, leaves a landmine at your position. When an enemy touches it, it explodes dealing 100% damage in a radius of 20.",icon:"💫" },
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
const LAB_UPGRADES=[
  {id:"intro_sprint",name:"Intro Sprint",desc:"Auto-play early waves at game start. Skips ability picks and shops — abilities stack and are offered together at the end.",
    levels:[{pct:10,waves:30},{pct:20,waves:60},{pct:30,waves:95},{pct:40,waves:130},{pct:50,waves:200}],minWave:15},
  {id:"sprint_efficiency",name:"Sprint Lab Efficiency",desc:"Increases the chance that each intro sprint wave contributes progress to active labs.",
    levels:[{pct:40,waves:20},{pct:50,waves:35},{pct:60,waves:55},{pct:70,waves:90},{pct:80,waves:145}],minWave:18},
  {id:"cheaper_respec",name:"Cheaper Respec",desc:"Reduces the cost of respecing ability shards by echo shards.",
    levels:[{reduce:20,waves:12},{reduce:40,waves:20},{reduce:60,waves:30},{reduce:80,waves:45},{reduce:100,waves:60},{reduce:120,waves:80},{reduce:140,waves:110},{reduce:160,waves:145},{reduce:180,waves:185},{reduce:200,waves:240}],minWave:10},
  {id:"phantom_enhance",name:"Phantom Enhance",desc:"Increases the Phantom echo multiplier.",tier:2,
    levels:[{waves:5},{waves:10},{waves:15},{waves:22},{waves:30},{waves:40},{waves:52},{waves:65},{waves:80},{waves:100},{waves:125},{waves:155},{waves:190},{waves:230},{waves:280},{waves:340},{waves:420},{waves:520},{waves:650},{waves:800}],minWave:25},
  {id:"practise_enhance",name:"Practise Enhance",desc:"Increases the Practise echo multiplier.",tier:2,
    levels:[{waves:4},{waves:8},{waves:12},{waves:18},{waves:25},{waves:33},{waves:42},{waves:54},{waves:68},{waves:85},{waves:105},{waves:130},{waves:160},{waves:195},{waves:240},{waves:290},{waves:360},{waves:450},{waves:560},{waves:700}],minWave:20},
  {id:"diffusion_chance",name:"Diffusion Chance",desc:"Increases the chance that the Diffuse option appears on ability pick screens. Starts at 0%.",tier:2,
    levels:[{pct:10,waves:5},{pct:20,waves:10},{pct:30,waves:15},{pct:40,waves:22},{pct:50,waves:32},{pct:60,waves:50},{pct:70,waves:80},{pct:80,waves:130}],minWave:17},
  {id:"diffusion_multi",name:"Diffusion Multiplier",desc:"Increases the per-diffuse echo bonus.",tier:2,
    levels:[{waves:6},{waves:11},{waves:16},{waves:24},{waves:20},{waves:35},{waves:28},{waves:48},{waves:38},{waves:65},{waves:55},{waves:90}],minWave:22},
  ];
const BG_DESIGNS=[
  {id:"void",name:"Void",css:"background:#06060e;"},
  {id:"starfield",name:"Starfield",css:"background:radial-gradient(3px 3px at 10% 20%,#ffffffaa,transparent),radial-gradient(2px 2px at 30% 70%,#ffffff88,transparent),radial-gradient(3.5px 3.5px at 50% 30%,#88bbff99,transparent),radial-gradient(2px 2px at 70% 80%,#ffffff77,transparent),radial-gradient(2.5px 2.5px at 90% 40%,#ffffff88,transparent),radial-gradient(3px 3px at 15% 90%,#88bbff88,transparent),radial-gradient(4px 4px at 85% 15%,#ffcc4477,transparent),radial-gradient(2px 2px at 45% 55%,#ffffff66,transparent),radial-gradient(3px 3px at 60% 10%,#ff88ff66,transparent),radial-gradient(2.5px 2.5px at 25% 45%,#44ff8866,transparent),radial-gradient(1.5px 1.5px at 5% 50%,#ffffff55,transparent),radial-gradient(2px 2px at 95% 85%,#aaddff55,transparent),radial-gradient(1.5px 1.5px at 35% 15%,#ffffff44,transparent),radial-gradient(2px 2px at 75% 35%,#ffaaff44,transparent),radial-gradient(1px 1px at 55% 95%,#ffffff55,transparent),radial-gradient(3px 3px at 42% 78%,#44ffaa33,transparent),radial-gradient(ellipse 120px 2px at 20% 40%,#ffffff18,transparent),radial-gradient(ellipse 80px 1px at 65% 75%,#88bbff15,transparent),radial-gradient(ellipse 100px 2px at 80% 25%,#ffffff12,transparent) #03030a;animation:starDrift 60s linear infinite;background-size:200% 200%;"},
  {id:"grid",name:"Grid",css:"background-image:linear-gradient(rgba(0,229,255,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.12) 1px,transparent 1px);background-size:40px 40px;background-color:#03030a;animation:gridScroll 30s linear infinite;"},
  {id:"circuit",name:"Circuit",css:"background-color:#03040a;background-image:linear-gradient(90deg,transparent 29px,rgba(68,204,170,0.06) 29px,rgba(68,204,170,0.06) 31px,transparent 31px),linear-gradient(0deg,transparent 29px,rgba(68,204,170,0.06) 29px,rgba(68,204,170,0.06) 31px,transparent 31px),radial-gradient(circle 3px at 30px 30px,rgba(68,204,170,0.25) 50%,transparent 50%),radial-gradient(circle 1.5px at 15px 30px,rgba(68,204,170,0.12) 50%,transparent 50%),radial-gradient(circle 1.5px at 30px 15px,rgba(68,204,170,0.12) 50%,transparent 50%),linear-gradient(90deg,transparent 14px,rgba(68,204,170,0.04) 14px,rgba(68,204,170,0.04) 16px,transparent 16px),linear-gradient(0deg,transparent 14px,rgba(68,204,170,0.04) 14px,rgba(68,204,170,0.04) 16px,transparent 16px),radial-gradient(circle 5px at 30px 30px,rgba(68,204,170,0.04) 100%,transparent 100%);background-size:60px 60px;animation:circuitPulse 8s ease-in-out infinite alternate;"},
  {id:"nebula",name:"Nebula",css:"background:radial-gradient(ellipse at 20% 50%,#1e3870 0%,transparent 50%),radial-gradient(ellipse at 80% 30%,#3a1870 0%,transparent 50%),radial-gradient(ellipse at 50% 80%,#184848 0%,transparent 40%),radial-gradient(ellipse at 60% 20%,#281248 0%,transparent 35%) #04040a;animation:nebulaPulse 20s ease-in-out infinite alternate;"},
  {id:"deep",name:"Deep Ocean",css:"background:linear-gradient(180deg,#040c18 0%,#0a2550 40%,#103060 70%,#060e22 100%);animation:deepPulse 15s ease-in-out infinite alternate;"},
  {id:"aurora",name:"Aurora",css:"background:linear-gradient(135deg,#061220 0%,#0a2838 25%,#103828 40%,#060c18 55%,#1a1030 70%,#120a22 85%,#061220 100%);animation:auroraShift 12s ease-in-out infinite alternate;"},
  {id:"ember",name:"Ember",css:"background-color:#06050c;background-image:radial-gradient(ellipse at 30% 80%,#2a1410aa,transparent 50%),radial-gradient(ellipse at 70% 60%,#281210aa,transparent 40%),radial-gradient(ellipse at 50% 30%,#200c0866,transparent 45%),radial-gradient(ellipse at 50% 90%,#3a181266,transparent 55%),radial-gradient(ellipse at 80% 20%,#1a0a0844,transparent 40%);animation:emberGlow 10s ease-in-out infinite alternate;"},
  
];
const LAB_SLOT_COSTS=[400,1500,8000];
const AB_DESCS={orbitals_sub1:"Increase the number of electrons by 2.",orbitals_sub2:"Hitting an enemy with any of your electrons will deal 30% damage, but can only deal damage to any enemy once.",orbitals_mastery:"Gain another layer of 4 electrons, that travel in an elliptical orbit.",chain_sub1:"Chain lightning now targets 4 enemies.",chain_sub2:"The original target of the chain lightning gets electrocuted and it receives 60% of damage.",chain_mastery:"Echo Clone, Seeker Swarm and Combat Drone now apply a green chain lightning: it targets 4 enemies for every 3rd successful hit, dealing 25% damage on arc and 40% damage on electrocution.",homing_sub1:"Fires missiles every second.",homing_sub2:"Missiles now have a 15% chance to be critical, dealing 2.5x damage.",homing_mastery:"Missiles activate a burning bomb on hit with a radius of 6 that applies burn that does 10% dmg/s for 5 seconds.",slowfield_sub1:"Increase radius to 18.",slowfield_sub2:"The field effects the max pickup range, causing it to expand to 1.25x what it usually is, before contracting to its regular size, repeating continuously over 6s cycles.",slowfield_mastery:"Slows down bomber enemies that enter your Temporal Drag at the same rate that bullets are slowed down, and any bombers killed in the Temporal Drag will only release half the amount of bullets.",mirror_sub1:"Make the clone have the same fire rate as your main ship.",mirror_sub2:"Currency drops can be picked up by the clone if it directly collides with them.",mirror_mastery:"Every 12 seconds, the clone unleashes a lasso, that winds up for 2 seconds before launching at the most dense group of enemies and moves them away from you, of a radius of 10 and lasts for 4 seconds. Captured enemies cannot attack.",drone_sub1:"If you take HP damage from an enemy, your drone gets mad at it, firing at 2x firing rate. It will solely target that enemy until it is dead.",drone_sub2:"Adds 3% to its damage percentage compared to your main weapon for every other ability you own.",drone_mastery:"Gives you a gift after every wave equal to half of all the pickups you failed to pick up during the wave, rounded up to the nearest integer.",gravity_sub1:"Bullets that are in the gravity well get smaller by 4% every second, for a maximum of 32% size reduction.",gravity_sub2:"The vortex gets a second, conjoined vortex with a radius of 7 that has its own gravitational pull.",gravity_mastery:"Every other time a vortex is activated, it turns golden, and any enemies killed in those golden vortexes drop double the currency.",overcharge_sub1:"Max overcharge amount is increased to 140% of max health.",overcharge_sub2:"Plasma pickups now heal 6 HP instead of 3.",overcharge_mastery:"Overcharge now persists between waves, with a limit of 110% of max health.",blackhole_sub1:"Increase bullets removed to 50%.",blackhole_sub2:"Sniper bullets will be removed first, and any snipers about to fire will have their attack fail.",blackhole_mastery:"Ability will be triggered on shield loss as well as HP damage.",void_regen_sub1:"Increase the max that can be regenerated to 90% of max health (without Overcharge active).",void_regen_sub2:"If you kill at least 1 enemy whilst waiting for void regen to start, the windup time is reduced to 3 seconds.",void_regen_mastery:"Taking no damage for an entire wave grants a golden shield with invincibility frames. Golden shields persist between waves but when lost are lost forever. Maximum of 5 golden shields.",ricochet_sub1:"Bullets that ricochet receive a random small angle offset.",ricochet_sub2:"Bullets can hit one more wall before being destroyed.",ricochet_mastery:"When a ricocheted bullet hits an enemy, it performs a rage slice dealing 250% damage to enemies in a 120px line.",nova_sub1:"Landmines slowly rise up to about the middle of the screen.",nova_sub2:"Landmines deal 4x damage to any bosses that are damaged by the landmine.",nova_mastery:"Landmines persist after waves instead of being cleared."};

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
let _bgShared=null;function getBgShared(){if(_bgShared)return _bgShared;const stars=[];for(let i=0;i<160;i++)stars.push({x:rand(0,GW),y:rand(0,GH),sz:rand(0.3,2.2),sp:rand(0.08,0.4),br:rand(0.15,0.85),pulse:rand(0,6.28),pulseSpd:rand(0.001,0.003),layer:i<40?0:i<100?1:2});for(let i=0;i<12;i++){let bx,by;do{bx=rand(0,GW);by=rand(0,GH);}while(bx>GW*0.2&&bx<GW*0.8&&by>GH*0.15&&by<GH*0.85);stars.push({x:bx,y:by,sz:rand(2.5,4),sp:rand(0.02,0.08),br:rand(0.6,1.0),pulse:rand(0,6.28),pulseSpd:rand(0.002,0.006),layer:3,col:pick(["#00e5ff","#bb77ff","#ffcc44","#ff66aa","#44ff88"])});}
const neb=[{x:GW*0.3,y:GH*0.25,r:220,col:"#00e5ff",drift:0.03,driftY:0.01,opc:0.22},{x:GW*0.7,y:GH*0.6,r:180,col:"#bb77ff",drift:-0.04,driftY:-0.02,opc:0.18},{x:GW*0.5,y:GH*0.8,r:250,col:"#ff335544",drift:0.02,driftY:0.015,opc:0.14},{x:GW*0.15,y:GH*0.65,r:140,col:"#44ff8833",drift:0.05,driftY:-0.01,opc:0.16},{x:GW*0.85,y:GH*0.2,r:160,col:"#ff884433",drift:-0.03,driftY:0.02,opc:0.12}];
const deb=[];for(let i=0;i<8;i++)deb.push({x:rand(0,GW),y:rand(0,GH),sz:rand(8,22),rot:rand(0,6.28),rotSpd:rand(-0.0008,0.0008),spY:rand(0.04,0.15),spX:rand(-0.03,0.03),sides:pick([3,5,6]),col:pick(["#00e5ff","#bb77ff","#44ddcc","#ff66aa"]),opc:rand(0.06,0.12)});
_bgShared={stars,neb,deb};return _bgShared;}

function drawShape(ctx,type,x,y,s,col,time,extra){
  ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=2;
  switch(type){
    case"drone":{/* Triangular hull with engine vents */ctx.beginPath();ctx.moveTo(x,y+s);ctx.lineTo(x-s*0.8,y-s*0.7);ctx.lineTo(x-s*0.2,y-s*0.3);ctx.lineTo(x+s*0.2,y-s*0.3);ctx.lineTo(x+s*0.8,y-s*0.7);ctx.closePath();ctx.fill();ctx.fillStyle="#06060e";ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(x,y+s*0.2,s*0.2,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;const _dt=(time||0)*0.008;ctx.globalAlpha=0.4+Math.sin(_dt)*0.2;ctx.fillStyle="#ff8833";ctx.beginPath();ctx.arc(x,y+s+2,2+Math.sin(_dt)*1,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;break;}
    case"weaver":{/* Diamond body with sine-wave trailing whiskers */ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.7,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.7,y);ctx.closePath();ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.globalAlpha=0.4;const _wt=(time||0)*0.006;for(let wi=0;wi<2;wi++){const _ws=wi===0?-1:1;ctx.beginPath();ctx.moveTo(x+_ws*s*0.5,y+s*0.3);for(let wj=0;wj<6;wj++){const wx=x+_ws*(s*0.5+wj*3);const wy=y+s*0.3+wj*3+Math.sin(_wt+wj*0.8)*3;ctx.lineTo(wx,wy);}ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle="#06060e";ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(x,y,s*0.15,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;break;}
    case"sprayer":{/* Hexagonal turret with rotating barrel indicators */ctx.beginPath();for(let i=0;i<6;i++){const a=(PI2/6)*i-Math.PI/6;ctx.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}ctx.closePath();ctx.fill();ctx.fillStyle="#06060e";ctx.globalAlpha=0.35;ctx.beginPath();ctx.arc(x,y,s*0.45,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,s*0.25,0,PI2);ctx.fill();const _st=(time||0)*0.003;for(let si=0;si<3;si++){const sa=_st+(PI2/3)*si;ctx.globalAlpha=0.5;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+Math.cos(sa)*s*0.3,y+Math.sin(sa)*s*0.3);ctx.lineTo(x+Math.cos(sa)*s*0.85,y+Math.sin(sa)*s*0.85);ctx.stroke();}ctx.globalAlpha=1;break;}
    case"tank":{/* Heavy armoured hull with turret and viewport */ctx.save();ctx.translate(x,y);
      ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-s*0.7,-s*0.75);ctx.lineTo(s*0.7,-s*0.75);ctx.lineTo(s*0.85,-s*0.3);ctx.lineTo(s*0.85,s*0.6);ctx.lineTo(s*0.6,s*0.85);ctx.lineTo(-s*0.6,s*0.85);ctx.lineTo(-s*0.85,s*0.6);ctx.lineTo(-s*0.85,-s*0.3);ctx.closePath();ctx.fill();
      ctx.fillRect(-s*0.12,-s*1.1,s*0.24,s*0.5);
      ctx.strokeStyle="#06060e";ctx.lineWidth=1;ctx.globalAlpha=0.35;ctx.beginPath();ctx.moveTo(-s*0.5,-s*0.3);ctx.lineTo(s*0.5,-s*0.3);ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.5,s*0.3);ctx.lineTo(s*0.5,s*0.3);ctx.stroke();
      ctx.globalAlpha=0.6;ctx.fillStyle="#ff666688";ctx.fillRect(-s*0.35,-s*0.55,s*0.7,s*0.12);
      ctx.globalAlpha=1;ctx.restore();break;}
    case"bomber":{/* Pulsing suicide sphere with danger warning ring */ctx.beginPath();ctx.arc(x,y,s*0.7,0,PI2);ctx.fill();const _bp=0.5+Math.sin((time||0)*0.01)*0.3;ctx.fillStyle="#06060e";ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(x,y,s*0.3,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;ctx.strokeStyle="#ffee88";ctx.lineWidth=2;ctx.globalAlpha=_bp;ctx.beginPath();ctx.arc(x,y,s+(time?Math.sin(time*0.01)*3:0),0,PI2);ctx.stroke();ctx.globalAlpha=0.25;ctx.lineWidth=1;ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(x,y,s*1.4,0,PI2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;break;}
    case"sniper":{/* Crosshair sniper with scope lens */ctx.fillRect(x-2,y-s,4,s*2);ctx.fillRect(x-s*0.5,y-2,s,4);ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(x,y,s*0.55,0,PI2);ctx.stroke();ctx.globalAlpha=0.6;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,s*0.15,0,PI2);ctx.fill();ctx.globalAlpha=1;}
      if(extra?.telegraphing||extra?._sniperLineActive){const _sa=extra.aimAngle||0;const _cos=Math.cos(_sa),_sin=Math.sin(_sa);let _endX=x,_endY=y;for(let _step=0;_step<2000;_step+=2){_endX+=_cos*2;_endY+=_sin*2;if(_endX<0||_endX>600||_endY<0||_endY>800)break;}let _lCol="#ff66ffaa";if(extra?.telegraphing&&(extra.teleTimer||0)<1000&&(extra.teleTimer||0)>=200){_lCol="#ffcc44cc";}else if(extra?.telegraphing&&(extra.teleTimer||0)<200){_lCol="#ff3344dd";}else if(extra?._sniperLineActive){_lCol="#ff3344dd";}ctx.strokeStyle=_lCol;ctx.lineWidth=extra?._sniperLineActive?2.5:2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(_endX,_endY);ctx.stroke();ctx.setLineDash([]);}
      break;
    case"splitter":{
      const _isChild=extra&&extra.size&&extra.size<=10;
      if(_isChild){/* Simple cell — no split visual */ctx.globalAlpha=0.85;ctx.beginPath();ctx.arc(x,y,s*0.75,0,PI2);ctx.fill();ctx.fillStyle="#06060e";ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(x,y,s*0.25,0,PI2);ctx.fill();ctx.globalAlpha=0.5;ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,s*0.75,0,PI2);ctx.stroke();ctx.globalAlpha=1;}
      else{/* Twin-lobed cell about to divide */const _spt=(time||0)*0.003;const _spBr=Math.sin(_spt)*0.8;
      ctx.globalAlpha=0.85;ctx.beginPath();ctx.arc(x-s*0.3+_spBr,y,s*0.65,0,PI2);ctx.fill();
      ctx.beginPath();ctx.arc(x+s*0.3-_spBr,y,s*0.65,0,PI2);ctx.fill();
      ctx.fillStyle="#06060e";ctx.globalAlpha=0.2+Math.abs(_spBr)*0.1;
      ctx.fillRect(x-s*0.08,y-s*0.5,s*0.16,s);
      ctx.globalAlpha=0.7;ctx.fillStyle=col;
      ctx.beginPath();ctx.arc(x-s*0.3+_spBr,y,s*0.18,0,PI2);ctx.fill();
      ctx.beginPath();ctx.arc(x+s*0.3-_spBr,y,s*0.18,0,PI2);ctx.fill();
      ctx.globalAlpha=0.4;ctx.strokeStyle=col;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(x-s*0.3+_spBr,y,s*0.65,0,PI2);ctx.stroke();
      ctx.beginPath();ctx.arc(x+s*0.3-_spBr,y,s*0.65,0,PI2);ctx.stroke();
      ctx.globalAlpha=1;}break;}
    case"pulse":{/* 4-pointed star with concentric pulse rings */ctx.beginPath();for(let i=0;i<8;i++){const a=(PI2/8)*i-Math.PI/2;const r=i%2===0?s:s*0.45;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.fillStyle="#06060e";ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(x,y,s*0.25,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;const _pt=(time||0)*0.004;ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=0.25+Math.sin(_pt)*0.15;ctx.beginPath();ctx.arc(x,y,s*1.2+Math.sin(_pt)*3,0,PI2);ctx.stroke();ctx.globalAlpha=0.15;ctx.beginPath();ctx.arc(x,y,s*1.6+Math.sin(_pt+1)*4,0,PI2);ctx.stroke();ctx.globalAlpha=1;break;}
    case"orbiter": ctx.beginPath();ctx.arc(x,y,s*0.5,0,PI2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=col;const oa=time?time*0.003:0;for(let i=0;i<3;i++){const ba=oa+(PI2/3)*i;ctx.beginPath();ctx.arc(x+Math.cos(ba)*s*0.85,y+Math.sin(ba)*s*0.85,3,0,PI2);ctx.fill();}break;
    case"charger":{const sa=extra?.spinAngle||0;ctx.save();ctx.translate(x,y);ctx.rotate(sa);ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*0.9,s*0.5);ctx.lineTo(-s*0.9,s*0.5);ctx.closePath();ctx.fill();
      /* inner hull detail */ctx.fillStyle="#06060e";ctx.globalAlpha=0.25;ctx.beginPath();ctx.moveTo(0,-s*0.4);ctx.lineTo(s*0.35,s*0.2);ctx.lineTo(-s*0.35,s*0.2);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;
      const chPct=extra?.chargeTimer>0?1-(extra.chargeTimer/(extra.fireRate||4000)):0;
      ctx.fillStyle="#fff";ctx.globalAlpha=0.3+chPct*0.5;ctx.beginPath();ctx.arc(0,0,s*(0.25+chPct*0.15),0,PI2);ctx.fill();
      /* charge ring */if(chPct>0.3){ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.globalAlpha=chPct*0.6;ctx.beginPath();ctx.arc(0,0,s*0.7,0,PI2*chPct);ctx.stroke();}
      ctx.globalAlpha=1;ctx.restore();break;}
    case"boss":{ctx.shadowColor=col;ctx.shadowBlur=12;const p=1+(time?Math.sin(time*0.004)*0.06:0);const z=s*p;ctx.beginPath();ctx.moveTo(x,y-z);ctx.lineTo(x-z*1.1,y+z*0.5);ctx.lineTo(x-z*0.35,y+z*0.25);ctx.lineTo(x,y+z*0.8);ctx.lineTo(x+z*0.35,y+z*0.25);ctx.lineTo(x+z*1.1,y+z*0.5);ctx.closePath();ctx.fill();ctx.shadowBlur=0;break;}
    case"wraith":{const wa=extra?.phaseCD>0?0.25:0.75+Math.sin((time||0)*0.006)*0.2;ctx.globalAlpha=wa;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.7,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.7,y);ctx.closePath();ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,s*0.2,0,PI2);ctx.fill();ctx.globalAlpha=1;break;}
    case"siren":{ctx.shadowColor=col;ctx.shadowBlur=8;ctx.beginPath();for(let i=0;i<6;i++){const a=(PI2/6)*i-Math.PI/2;const r=i%2===0?s:s*0.3;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.shadowBlur=0;/* hypnotic rings */const _sit=(time||0)*0.005;ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=0.2+Math.sin(_sit)*0.1;ctx.beginPath();ctx.arc(x,y,s*0.6,_sit,_sit+Math.PI*0.8);ctx.stroke();ctx.globalAlpha=0.15;ctx.beginPath();ctx.arc(x,y,s*0.9,_sit+Math.PI,_sit+Math.PI*1.6);ctx.stroke();ctx.globalAlpha=1;break;}
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
  const[meta,setMeta]=useState({echoes:0,levels:{},shipColor:"cyan",showMagnetRange:true,showBorder:true,mobileControls:"reactive"});
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
  const[metaTab,setMetaTab]=useState("ship");const[labConfirm,setLabConfirm]=useState(null);
  const[abInfoId,setAbInfoId]=useState(null);const[heInfoId,setHeInfoId]=useState(null);const[sprintInfo,setSprintInfo]=useState(false);
  const[showAnalyser,setShowAnalyser]=useState(false);const[showRegenAnalyser,setShowRegenAnalyser]=useState(false);const[showPainAnalyser,setShowPainAnalyser]=useState(false);const[confirmRespec,setConfirmRespec]=useState(false);const[deathDmgPopup,setDeathDmgPopup]=useState(false);const[deathRegenPopup,setDeathRegenPopup]=useState(false);const[deathPainPopup,setDeathPainPopup]=useState(false);
  const[showPauseSettings,setShowPauseSettings]=useState(false);
  const pausedRef=useRef(false);const _returnToPauseRef=useRef(false);
  const[pgMode,setPgMode]=useState(null);const[enforcerMode,setEnforcerMode]=useState(false);
  const pgRef=useRef(null);
  useEffect(()=>{pgRef.current=pgMode;},[pgMode]);
  const[practiceWave,setPracticeWave]=useState(1);
  const[historyHover,setHistoryHover]=useState(null);
  const fpsRef=useRef({frames:0,last:performance.now(),fps:0});
  const touchRef=useRef({active:false,startX:0,startY:0,curX:0,curY:0,id:null});
  const[historyHideForfeits,setHistoryHideForfeits]=useState(true);const[historyMode,setHistoryMode]=useState("waves");
  const[syncCode,setSyncCode]=useState(null);const[syncStatus,setSyncStatus]=useState("none");const[syncCodeInput,setSyncCodeInput]=useState("");const[showShipPopup,setShowShipPopup]=useState(false);const[showBulletPopup,setShowBulletPopup]=useState(false);const[showBgPopup,setShowBgPopup]=useState(false);const[showSyncInfo,setShowSyncInfo]=useState(false);const[syncConflict,setSyncConflict]=useState(null);const syncCodeRef=useRef(null);const _cloudDebounce=useRef(null);
  const[tutStep,setTutStep]=useState(0);
  const[showTutPrompt,setShowTutPrompt]=useState(false);
  const tutRef=useRef(0);
  useEffect(()=>{tutRef.current=tutStep;try{if(tutStep>0)localStorage.setItem("vs4-tut",String(tutStep));else localStorage.removeItem("vs4-tut");}catch(e){}},[tutStep]);
  const phRef=useRef("menu");
  useEffect(()=>{phRef.current=phase;setConfirmReset(false);setConfirmForfeit(false);if(_returnToPauseRef.current&&phase==="playing"){_returnToPauseRef.current=false;setPaused(true);pausedRef.current=true;}else{setPaused(false);pausedRef.current=false;}setShowStats(false);setMetaTab("ship");setAbInfoId(null);setShowAnalyser(false);setShowRegenAnalyser(false);setShowPainAnalyser(false);setShowPauseSettings(false);setDeathDmgPopup(false);setDeathRegenPopup(false);setDeathPainPopup(false);setShowShipPopup(false);setShowBulletPopup(false);setShowBgPopup(false);setShowSyncInfo(false);setSyncConflict(null);if(phase!=="playing")setPgMode(null);
    if((phase==="menu"||phase==="settings"||phase==="playground"||phase==="metashop"||phase==="practise"||phase==="history"||phase==="phantom_info"||phase==="hyperecho")&&!(_returnToPauseRef.current&&phase==="settings")){
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
      const savedTut=localStorage.getItem("vs4-tut");
      if(savedTut&&parseInt(savedTut)>0){setShowTutPrompt(true);}
      const _sc=localStorage.getItem("vs4-sync-code");if(_sc){setSyncCode(_sc);syncCodeRef.current=_sc;setSyncStatus("synced");}
    }catch(e){}
  },[]);
  const saveMeta=useCallback(m=>{
    const _ts=Date.now();const _ms={...m,savedAt:_ts};
    try{localStorage.setItem("vs4-meta",JSON.stringify(_ms));}catch(e){}
    if(syncCodeRef.current&&_SYNC_OK){
      clearTimeout(_cloudDebounce.current);
      _cloudDebounce.current=setTimeout(()=>{
        const code=syncCodeRef.current;if(!code||document.hidden)return;
        try{const h=localStorage.getItem("vs4-history")||"[]";const t=localStorage.getItem("vs4-tut")||"0";
        fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code,data:{meta:_ms,history:JSON.parse(h),tut:t},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(e){}
      },3000);
    }
  },[]);
  useEffect(()=>{syncCodeRef.current=syncCode;},[syncCode]);
  useEffect(()=>{
    if(!_SYNC_OK)return;
    const _onVis=()=>{if(document.visibilityState==="visible"&&syncCodeRef.current){
      fetch(SUPABASE_URL+"/rest/v1/saves?code=eq."+syncCodeRef.current+"&select=data",{headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}).then(r=>r.json()).then(rows=>{if(rows.length>0&&rows[0].data&&rows[0].data.meta){const cd=rows[0].data;const cloudAt=cd.meta.savedAt||0;const localAt=metaRef.current.savedAt||0;if(cloudAt>localAt){setMeta(cd.meta);try{localStorage.setItem("vs4-meta",JSON.stringify(cd.meta));}catch(e){}if(cd.history)try{localStorage.setItem("vs4-history",JSON.stringify(cd.history));}catch(e){}if(cd.tut)try{localStorage.setItem("vs4-tut",cd.tut);}catch(e){}}}}).catch(()=>{});
    }};
    document.addEventListener("visibilitychange",_onVis);
    return()=>document.removeEventListener("visibilitychange",_onVis);
  },[]);
  useEffect(()=>{
    if(!syncCode||!_SYNC_OK)return;
    const id=setInterval(()=>{
      const code=syncCodeRef.current;if(!code||document.hidden)return;
      try{const _ts2=Date.now();const m={...metaRef.current,savedAt:_ts2};const h=localStorage.getItem("vs4-history")||"[]";const t=localStorage.getItem("vs4-tut")||"0";
      fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code,data:{meta:m,history:JSON.parse(h),tut:t},updated_at:new Date().toISOString()})}).catch(()=>{});
      try{localStorage.setItem("vs4-meta",JSON.stringify(m));}catch(e2){}}catch(e){}
    },120000);
    return()=>clearInterval(id);
  },[syncCode]);

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
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,
      stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),showMagnetRange:true,
      abUp:{},isTutorial:true,
    };
    gsRef.current=gs;
    {const _sLvl=metaRef.current.lab?.completed?.intro_sprint||0;const _sPct=_sLvl>0?[10,20,30,40,50][Math.min(_sLvl-1,4)]:0;const _sMax=metaRef.current.highWave||0;const _sThr=Math.floor(_sMax*_sPct/100);const _doSprint=_sPct>0&&!metaRef.current.introSprintOff&&_sThr>0;setPhase("playing");startWave(gs,_doSprint);}
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
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,
      stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),showMagnetRange:meta.showMagnetRange!==false,
      abUp:{...(meta.abUpgrades||{})},_totalScrap:0,_totalCores:0,_totalPlasma:0,
    };
    gs._pAb=gml("m_start");
    gsRef.current=gs;
    if(gs._pAb>0){gs._pAb--;offerAb(gs);}
    else if(gs.wave>0){/* mid-game ability: show shop before next wave */setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}
    else{const _sLvl2=metaRef.current.lab?.completed?.intro_sprint||0;const _sPct2=_sLvl2>0?[10,20,30,40,50][Math.min(_sLvl2-1,4)]:0;const _sMax2=metaRef.current.highWave||0;const _sThr2=Math.floor(_sMax2*_sPct2/100);const _doSprint2=_sPct2>0&&!metaRef.current.introSprintOff&&_sThr2>0;setPhase("playing");startWave(gs,_doSprint2);}
  },[gml]);

  const initNewMode=useCallback(()=>{
    const gs={
      player:{x:GW/2,y:GH-80,hp:75+gml("m_hp")*12,maxHp:75+gml("m_hp")*12,
        damage:7+gml("m_dmg")*1.5,fireDelay:210,fireTimer:0,
        speed:3.6*(1+gml("m_spd")*0.05),invTimer:0,size:13,
        shields:gml("m_shield"),shieldMax:gml("m_shield"),
        pierce:0,bulletSize:3.2+gml("m_bullet")*0.25,bulletSpeedMul:1,
        magnetRange:50*(1+gml("m_magnet")*0.04),fortuneMult:0,
        regenRate:0,dodgeChance:0,critChance:gml("m_crit")*0.02,dmgReduction:0,pickupLife:0,voidsiphonPct:0,voidsiphonFlat:0,kineticBonus:0,lastDmgTime:0,
        alive:true,hasRearGun:false,acidStacks:0,shotCount:0,abilities:[],lastHitBy:"",
        phaseCooldown:0,phaseActive:0,novaTimer:0,homingTimer:0,gravTimer:0,
        novaPow:1,novaRange:110,goldenShields:0,
        _noMainGun:true,
      },
      enemies:[],pBullets:[],eBullets:[],pickups:[],particles:[],orbitals:[],
      homingMissiles:[],drones:[],gravWells:[],novaRings:[],hitTexts:[],
      wave:0,waveActive:false,enemiesLeft:0,waveTotal:0,waveKilled:0,
      spawnQueue:[],spawnTimer:0,kills:0,scrap:0,cores:0,plasma:0,
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,
      stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),showMagnetRange:meta.showMagnetRange!==false,
      abUp:{...(meta.abUpgrades||{})},
      isNewMode:true,_totalScrap:0,_totalCores:0,_totalPlasma:0,
    };
    gsRef.current=gs;
    /* Always offer first ability pick */
    const nmAbs=ABILITIES.filter(a=>["mirror","drone","homing"].includes(a.id));
    setAbChoices(nmAbs);setPhase("ability");
  },[gml]);

  const ENEMY_UNLOCK={drone:1,weaver:2,bomber:3,sprayer:4,sniper:6,splitter:7,orbiter:8,tank:9,pulse:11,charger:13,wraith:15,siren:17,fortress:20,reaper:22,boss:5};

  function startPlayground(enemyType,isEnforcer){
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
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,
      stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),
      isPlayground:true,_pgEnemy:enemyType,_pgWave:unlockW,_isEnforcer:!!isEnforcer,_enfTimer:isEnforcer?60:0,showMagnetRange:meta.showMagnetRange!==false,abUp:{...(meta.abUpgrades||{})},
    };
    gs._pAb=gml("m_start");
    gsRef.current=gs;
    if(gs._isEnforcer){launchPG(gs);}else if(gs._pAb>0){gs._pAb--;offerAb(gs);}
    else launchPG(gs);
  }
  function launchPG(gs){
    const et=gs._pgEnemy,uw=gs._pgWave||1;
    gs.wave=uw;gs.waveActive=true;gs.enemiesLeft=1;gs.waveTotal=1;gs.waveKilled=0;
    setPgMode({enemy:et,subWave:gs._isEnforcer?0:1});
    if(gs._isEnforcer){
      const eSz=et==="boss"?55:40;const eHp=999999;
      const enfPatterns={drone:{fr:350,bs:3.5,pat:"enf_drone"},weaver:{fr:280,bs:3.2,pat:"enf_weaver"},sprayer:{fr:700,bs:2.8,pat:"enf_sprayer"},tank:{fr:1200,bs:2.0,pat:"enf_tank"},bomber:{fr:500,bs:3.0,pat:"enf_bomber"},sniper:{fr:600,bs:9.0,pat:"enf_sniper"},splitter:{fr:650,bs:3.0,pat:"enf_splitter"},pulse:{fr:900,bs:2.0,pat:"enf_pulse"},orbiter:{fr:400,bs:3.0,pat:"enf_orbit"},charger:{fr:350,bs:5.0,pat:"enf_charger"},siren:{fr:500,bs:3.0,pat:"enf_siren"},reaper:{fr:800,bs:2.5,pat:"enf_reaper"},boss:{fr:800,bs:3.0,pat:"enf_boss"}};
      const ep=enfPatterns[et]||{fr:800,bs:3.0,pat:"aimed"};
      const ed=ED[et]||{col:"#ff2266",spd:0.3};
      if(gs._isEnforcer)gs.player.shields=0;const e={type:et==="boss"?"boss":et,x:GW/2,y:120,hp:eHp,maxHp:eHp,size:eSz,speed:ed.spd*0.6,
        color:et==="boss"?"#ff2266":ed.col,fireTimer:rand(0,1000),fireRate:ep.fr,bulletSpeed:ep.bs,pattern:ep.pat,
        dM:3.0,scrapDrop:0,coreDrop:0,plasmaDrop:0,sineOff:rand(0,PI2),sineAmp:rand(30,60),entering:false,targetY:120,
        burnDmg:0,burnTimer:0,telegraphing:false,aimAngle:0,teleTimer:ep.fr,_isEnforcer:true,
        _sniperId:Math.random(),_sniperLineActive:false};
      if(et==="boss"){e.phase=1;e.phaseTimer=0;}
      gs.enemies.push(e);
    } else {
      spawnE(gs,{type:et});
    }
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
      upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,
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
    if(av.length===0){if(!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&gs.wave>0){setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}else{startWave(gs);}return;}
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
    else if(gs.isPractise||gs.wave===0){const _pSLvl=metaRef.current.lab?.completed?.intro_sprint||0;const _pSPct=_pSLvl>0?[10,20,30,40,50][Math.min(_pSLvl-1,4)]:0;const _pSMax=metaRef.current.highWave||0;const _pSThr=Math.floor(_pSMax*_pSPct/100);const _pDoS=!gs.isPractise&&_pSPct>0&&!metaRef.current.introSprintOff&&_pSThr>0;setPhase("playing");startWave(gs,_pDoS);}
    else if(gs.isNewMode){setPhase("playing");startWave(gs);}else{setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}
  }
  function has(gs,id){return gs.player.abilities.includes(id);}
  function hasAU(gs,key){return !!(gs.abUp&&gs.abUp[key]);}

  function startWave(gs,_sprintActive){
    gs._inSprint=!!_sprintActive;
    if(gs.wave>0&&has(gs,"void_regen")&&hasAU(gs,"void_regen_mastery")&&gs._noDmgWave&&gs.player.goldenShields<5)gs.player.goldenShields++;gs._noDmgWave=true;gs.wave++;gs.waveActive=true;gs._waveEndTimer=0;gs.waveDmg={};gs.waveHeal={};gs.wavePain={};gs.waveShieldPain={};
    if(gs.isTutorial){if(gs.wave===2)setTutStep(20);else if(gs.wave===3)setTutStep(30);else if(gs.wave===4)setTutStep(40);else if(gs.wave===5)setTutStep(50);}
    gs.spawnQueue=genWave(gs.wave,gs._inSprint);
    gs.waveTotal=gs.spawnQueue.length;gs.enemiesLeft=gs.waveTotal;gs.waveKilled=0;
    gs.spawnTimer=0;gs.player.shields=gs.player.shieldMax;if(!(has(gs,"nova")&&hasAU(gs,"nova_mastery")))gs._novaMines=[];
    if(has(gs,"overcharge")&&hasAU(gs,"overcharge_mastery")){gs.player.hp=Math.min(gs.player.hp,gs.player.maxHp*1.1);}else{gs.player.hp=Math.min(gs.player.hp,gs.player.maxHp);}/* reset overcharge */
    /* new enemy notification */
    if(metaRef.current.showNewEnemy!==false){
      const newType=Object.entries(ENEMY_UNLOCK).find(([k,w])=>w===gs.wave&&k!=="boss");
      if(newType)gs.newEnemyNotif={type:newType[0],timer:180};
      else if(gs.wave%5===0)gs.newEnemyNotif={type:"boss",timer:180};
      else gs.newEnemyNotif=null;
    } else gs.newEnemyNotif=null;
    if(gs._pendingLabNotifs&&gs._pendingLabNotifs.length>0){gs._labNotifs.push(...gs._pendingLabNotifs);gs._pendingLabNotifs=[];}
  }

  function genWave(w,inSprint){
    const q=[],isBoss=w%5===0;
    const count=Math.min(120,4+Math.floor(w*1.0)+Math.floor(Math.pow(w,1.1)*0.25));
    const newType=Object.keys(ED).find(k=>ENEMY_UNLOCK[k]===w);
    if(isBoss){
      q.push({type:"boss",delay:400});
      const avail=Object.keys(ED).filter(k=>ENEMY_UNLOCK[k]<=w);
      const bossDel=inSprint?spawnDelay(w):Math.max(120,spawnDelay(w)*2.2);
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
        telegraphing:false,aimAngle:0,teleTimer:0,_sniperId:Math.random(),_sniperLineActive:false,
        phaseCD:0,phaseTimer:def.type==="wraith"?rand(2000,3500):0,shieldAngle:rand(0,PI2),
        rotOff:rand(0,PI2),rotSpd:0.002+rand(-0.0005,0.0005),
      });
    }
  }

  const BSPD=8;
  function trackDmg(gs,src,amt){if(!gs.dmgTrack)gs.dmgTrack={};if(!gs.waveDmg)gs.waveDmg={};gs.dmgTrack[src]=(gs.dmgTrack[src]||0)+amt;gs.waveDmg[src]=(gs.waveDmg[src]||0)+amt;}
  function trackHeal(gs,src,amt){if(!gs.healTrack)gs.healTrack={};if(!gs.waveHeal)gs.waveHeal={};gs.healTrack[src]=(gs.healTrack[src]||0)+amt;gs.waveHeal[src]=(gs.waveHeal[src]||0)+amt;}
  function trackPain(gs,src,hpAmt,shieldAmt){if(!gs.painTrack)gs.painTrack={};if(!gs.wavePain)gs.wavePain={};if(!gs.shieldPain)gs.shieldPain={};if(!gs.waveShieldPain)gs.waveShieldPain={};if(hpAmt>0){gs.painTrack[src]=(gs.painTrack[src]||0)+hpAmt;gs.wavePain[src]=(gs.wavePain[src]||0)+hpAmt;}if(shieldAmt>0){gs.shieldPain[src]=(gs.shieldPain[src]||0)+shieldAmt;gs.waveShieldPain[src]=(gs.waveShieldPain[src]||0)+shieldAmt;}}
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
      case"snipe":{const sa=e.aimAngle!==undefined?e.aimAngle:a;const _snSpd=bs*2.5;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(sa)*_snSpd,vy:Math.sin(sa)*_snSpd,size:4,dmg:dmg*2.0,src:"sniper",_sniperBullet:true,_sniperId:e._sniperId});break;}
      case"pulse":{const n=12+Math.floor(gs.wave*0.12);for(let i=0;i<n;i++){const ra=(PI2/n)*i;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.7,vy:Math.sin(ra)*bs*0.7,size:4,dmg:dmg*0.4});}break;}
      case"orbit":{const oa=gs.time*0.003;for(let i=0;i<2;i++){const ra=oa+Math.PI*i;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs,vy:Math.sin(ra)*bs,size:5,dmg});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra+0.3)*bs*0.8,vy:Math.sin(ra+0.3)*bs*0.8,size:4,dmg:dmg*0.7});}break;}
      case"burst3":{for(let b=0;b<3;b++){setTimeout(()=>{if(!gs.player.alive)return;const ba=ag(e,gs.player);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*bs,vy:Math.sin(ba)*bs,size:6,dmg,src});},b*120);}break;}
      case"phase5":{for(let i=-2;i<=2;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.25)*bs,vy:Math.sin(a+i*0.25)*bs,size:5,dmg});break;}
      case"siren":{for(let i=-1;i<=1;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.3)*bs,vy:Math.sin(a+i*0.3)*bs,size:5,dmg,homing:true,homingLife:3750});break;}
      case"mines":{for(let i=0;i<2;i++){const mx=e.x+rand(-80,80),my=e.y+rand(30,140);gs.eBullets.push({x:clamp(mx,10,GW-10),y:clamp(my,10,GH-40),vx:0,vy:0,size:7,dmg:dmg*0.3,mine:true,mineTimer:2000+rand(0,800)});}break;}
      /* === ENFORCER-EXCLUSIVE PATTERNS === */
      case"enf_drone":{/* Spiral arms - 3 rotating arms of 4 bullets, creating overlapping spirals */const _sOff=gs.time*0.002;for(let arm=0;arm<3;arm++){const armA=_sOff+arm*(PI2/3);for(let j=0;j<4;j++){const ba=armA+j*0.18;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*bs*(0.7+j*0.15),vy:Math.sin(ba)*bs*(0.7+j*0.15),size:4,dmg:dmg*0.6});}}break;}
      case"enf_weaver":{/* Cross sweep - alternating perpendicular 5-bullet fans creating windmill */const _wPhase=Math.floor(gs.time/300)%2;const baseA=_wPhase===0?a:a+Math.PI/2;for(let i=-2;i<=2;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(baseA+i*0.15)*bs,vy:Math.sin(baseA+i*0.15)*bs,size:5,dmg});/* plus two fast aimed shots */gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*1.4,vy:Math.sin(a)*bs*1.4,size:3,dmg:dmg*0.8});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+Math.PI)*bs*0.8,vy:Math.sin(a+Math.PI)*bs*0.8,size:3,dmg:dmg*0.5});break;}
      case"enf_sprayer":{/* Storm ring + aimed hail - massive ring plus fast aimed shots */const _rn=14+Math.floor(gs.time*0.002%6);for(let i=0;i<_rn;i++){const ra=(PI2/_rn)*i+gs.time*0.001;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.6,vy:Math.sin(ra)*bs*0.6,size:5,dmg:dmg*0.5});}for(let i=0;i<3;i++){const off=(i-1)*0.12;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+off)*bs*1.6,vy:Math.sin(a+off)*bs*1.6,size:3,dmg:dmg*0.7});}break;}
      case"enf_tank":{/* Heavy artillery - large slow bullet + mini ring + aimed pair */gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*0.4,vy:Math.sin(a)*bs*0.4,size:12,dmg:dmg*2.0});const _mn=6;for(let i=0;i<_mn;i++){const ra=(PI2/_mn)*i;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.7,vy:Math.sin(ra)*bs*0.7,size:4,dmg:dmg*0.4});}for(let i=-1;i<=1;i+=2)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.25)*bs*1.2,vy:Math.sin(a+i*0.25)*bs*1.2,size:6,dmg:dmg*0.8});break;}
      case"enf_bomber":{/* Mine carpet + aimed triple - lays mines near player + fast aimed shots */for(let i=0;i<4;i++){const mx=p.x+rand(-100,100),my=p.y+rand(-80,40);gs.eBullets.push({x:clamp(mx,10,GW-10),y:clamp(my,10,GH-40),vx:0,vy:0,size:7,dmg:dmg*0.4,mine:true,mineTimer:1500+rand(0,600)});}for(let i=-1;i<=1;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.2)*bs*1.3,vy:Math.sin(a+i*0.2)*bs*1.3,size:5,dmg:dmg*0.7});break;}
      case"enf_sniper":{/* Triple prediction - aimed + leading + trailing shots with slow decoys */const _pVx=(p.x-e.x),_pVy=(p.y-e.y);const _pd=Math.sqrt(_pVx*_pVx+_pVy*_pVy)||1;const _leadA=a+0.15;const _trailA=a-0.15;const _snSpd=bs*2.2;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*_snSpd,vy:Math.sin(a)*_snSpd,size:4,dmg:dmg*1.5,src:"sniper",_sniperBullet:true,_sniperId:e._sniperId});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_leadA)*_snSpd,vy:Math.sin(_leadA)*_snSpd,size:3,dmg:dmg*1.0,src:"sniper"});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_trailA)*_snSpd,vy:Math.sin(_trailA)*_snSpd,size:3,dmg:dmg*1.0,src:"sniper"});/* slow decoys */for(let i=0;i<4;i++){const da=a+rand(-0.8,0.8);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(da)*bs*0.5,vy:Math.sin(da)*bs*0.5,size:6,dmg:dmg*0.3});}break;}
      case"enf_splitter":{/* Fractal fan - 7-wide fan alternating with 5-tight fan */const _sp=Math.floor(gs.time/400)%2;if(_sp===0){for(let i=-3;i<=3;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.18)*bs,vy:Math.sin(a+i*0.18)*bs,size:5,dmg:dmg*0.5});}else{for(let i=-2;i<=2;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.08)*bs*1.3,vy:Math.sin(a+i*0.08)*bs*1.3,size:4,dmg:dmg*0.7});/* plus flanking shots */gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+1.2)*bs*0.8,vy:Math.sin(a+1.2)*bs*0.8,size:5,dmg:dmg*0.4});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a-1.2)*bs*0.8,vy:Math.sin(a-1.2)*bs*0.8,size:5,dmg:dmg*0.4});}break;}
      case"enf_pulse":{/* Concentric nova - two rings at different speeds with offset gaps */const _rn1=14;const _rn2=10;const _off1=gs.time*0.0008;const _off2=gs.time*0.0008+0.3;for(let i=0;i<_rn1;i++){const ra=(PI2/_rn1)*i+_off1;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.5,vy:Math.sin(ra)*bs*0.5,size:5,dmg:dmg*0.3});}for(let i=0;i<_rn2;i++){const ra=(PI2/_rn2)*i+_off2;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*1.1,vy:Math.sin(ra)*bs*1.1,size:4,dmg:dmg*0.5});}break;}
      case"enf_orbit":{/* Quad orbit + aimed singles - 4 pairs of orbiting shots at different phases */const _oa=gs.time*0.004;for(let i=0;i<4;i++){const ra=_oa+i*(PI2/4);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs,vy:Math.sin(ra)*bs,size:5,dmg:dmg*0.5});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra+0.4)*bs*0.6,vy:Math.sin(ra+0.4)*bs*0.6,size:4,dmg:dmg*0.4});}/* aimed single */gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*1.5,vy:Math.sin(a)*bs*1.5,size:3,dmg:dmg*0.8});break;}
      case"enf_charger":{/* Prediction burst - rapid aimed triple + prediction shots at player movement vector */for(let b2=0;b2<3;b2++){setTimeout(()=>{if(!gs.player.alive)return;const ba=ag(e,gs.player);const _predA=ba+rand(-0.2,0.2);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*bs,vy:Math.sin(ba)*bs,size:5,dmg,src});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_predA)*bs*0.9,vy:Math.sin(_predA)*bs*0.9,size:4,dmg:dmg*0.6,src});},b2*80);}/* slow constraining wall */for(let i=-3;i<=3;i++){const wa=a+Math.PI+i*0.15;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(wa)*bs*0.3,vy:Math.sin(wa)*bs*0.3,size:6,dmg:dmg*0.3});}break;}
      case"enf_siren":{/* Seeking swarm - 5 homing bullets in wide spread + direct aimed pair */for(let i=-2;i<=2;i++){gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.4)*bs*0.8,vy:Math.sin(a+i*0.4)*bs*0.8,size:5,dmg:dmg*0.6,homing:true,homingLife:4500});}gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*1.5,vy:Math.sin(a)*bs*1.5,size:4,dmg:dmg*0.8});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+Math.PI)*bs*0.6,vy:Math.sin(a+Math.PI)*bs*0.6,size:4,dmg:dmg*0.4});break;}
      case"enf_reaper":{/* Death spiral - mines in triangle around player + fast aimed snipes */const _ra=[0,PI2/3,PI2*2/3];_ra.forEach(off=>{const mx=p.x+Math.cos(off)*70,my=p.y+Math.sin(off)*70;gs.eBullets.push({x:clamp(mx,10,GW-10),y:clamp(my,10,GH-40),vx:0,vy:0,size:8,dmg:dmg*0.5,mine:true,mineTimer:2200+rand(0,400)});});/* fast aimed snipes */for(let i=-1;i<=1;i++){gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.1)*bs*2.0,vy:Math.sin(a+i*0.1)*bs*2.0,size:4,dmg:dmg*0.8});}break;}
      case"enf_boss":{/* Phase master - cycles ring + aimed fan + mines */const _bp=Math.floor(gs.time/600)%3;if(_bp===0){const n=12;for(let i=0;i<n;i++){const ra=(PI2/n)*i+gs.time*0.002;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.7,vy:Math.sin(ra)*bs*0.7,size:5,dmg:dmg*0.4});}}else if(_bp===1){for(let i=-3;i<=3;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.12)*bs*1.2,vy:Math.sin(a+i*0.12)*bs*1.2,size:6,dmg:dmg*0.7});}else{for(let i=0;i<3;i++){const mx=p.x+rand(-90,90),my=p.y+rand(-60,30);gs.eBullets.push({x:clamp(mx,10,GW-10),y:clamp(my,10,GH-40),vx:0,vy:0,size:7,dmg:dmg*0.5,mine:true,mineTimer:1800+rand(0,500)});}gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*1.5,vy:Math.sin(a)*bs*1.5,size:4,dmg:dmg*0.9});}break;}
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
    if(gs.isPlayground||gs.isNewMode)return;
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
    if(e.type==="bomber"){const _sfR2=has(gs,"slowfield")?(hasAU(gs,"slowfield_sub1")?180:90):0;const _halfB=hasAU(gs,"slowfield_mastery")&&dist(e,gs.player)<_sfR2;const _bCount=_halfB?4:8;for(let k=0;k<_bCount;k++){const ra=(PI2/_bCount)*k;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*2.5,vy:Math.sin(ra)*2.5,size:5,dmg:(12+gs.wave*1.5)*(e.dM||1.3),src:"bomber"});}}
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

    let dx=((keys["d"]||keys["arrowright"])?1:0)-((keys["a"]||keys["arrowleft"])?1:0);
    let dy=((keys["s"]||keys["arrowdown"])?1:0)-((keys["w"]||keys["arrowup"])?1:0);
    const _mc=metaRef.current.mobileControls||"reactive";
    const _tr=touchRef.current;
    if(_mc==="reactive"&&_tr.active){const _tdx=_tr.curX-_tr.startX;const _tdy=_tr.curY-_tr.startY;const _td=Math.hypot(_tdx,_tdy);if(_td>8){const _tn=Math.min(_td,60)/60;dx+=(_tdx/_td)*_tn;dy+=(_tdy/_td)*_tn;}}
    if(_mc==="stationary"&&_tr.active){const _sjx=GW-70,_sjy=GH-70;const _tdx=_tr.curX-_sjx;const _tdy=_tr.curY-_sjy;const _td=Math.hypot(_tdx,_tdy);if(_td>8){const _tn=Math.min(_td,60)/60;dx+=(_tdx/_td)*_tn;dy+=(_tdy/_td)*_tn;}}
    if(_mc==="arrows"){if(_tr._arrowL)dx-=1;if(_tr._arrowR)dx+=1;if(_tr._arrowU)dy-=1;if(_tr._arrowD)dy+=1;}
    const mg=Math.hypot(dx,dy)||1;let spd=p.speed;
    p.x=clamp(p.x+(dx/mg)*spd*dt*0.06,p.size,GW-p.size);
    p.y=clamp(p.y+(dy/mg)*spd*dt*0.06,p.size,GH-p.size);
    if(p.invTimer>0)p.invTimer-=dt;
    if(p.regenRate>0){const _rh=Math.min(p.maxHp-p.hp,p.regenRate*dt*0.001);if(_rh>0){p.hp+=_rh;trackHeal(gs,"Nanobots",_rh);}}

    let fd=p.fireDelay,pp=p.pierce;
    if((p.kineticBonus||0)>0){const _km=(keysRef.current["w"]||keysRef.current["a"]||keysRef.current["s"]||keysRef.current["d"]||keysRef.current["arrowup"]||keysRef.current["arrowdown"]||keysRef.current["arrowleft"]||keysRef.current["arrowright"])?1:0;p._kineticActive=_km;}
    p.fireTimer-=dt;if(p.fireTimer<=0&&!p._noMainGun){p.fireTimer=fd;const sv=p.pierce;p.pierce=pp;firePB(gs);p.pierce=sv;}

    if(has(gs,"nova")){p.novaTimer+=dt;if(p.novaTimer>=6000){p.novaTimer=0;if(!gs._novaMines)gs._novaMines=[];gs._novaMines.push({x:p.x,y:p.y,dmg:p.damage*1.0,r:200,life:999,riseTarget:hasAU(gs,"nova_sub1")&&p.y>GH*0.5?rand(GH*0.4,GH*0.6):0,riseDelay:120,bossDmg:hasAU(gs,"nova_sub2")});sp(gs,p.x,p.y,"#ff88ff",6,3);}}
    if(gs._novaMines){gs._novaMines.forEach(nm=>{if(nm.riseTarget>0){if(nm.riseDelay>0)nm.riseDelay-=dt*0.06;else if(Math.abs(nm.y-nm.riseTarget)>2)nm.y+=(nm.riseTarget-nm.y)*0.015*dt*0.06;}const _mineDetR=30;gs.enemies.forEach((e,ei)=>{if(dist(e,nm)<_mineDetR&&!nm.det){nm.det=true;const mk=[];gs.enemies.forEach((te,ti)=>{if(dist(te,nm)<nm.r){let _md=nm.dmg;if(nm.bossDmg&&te.type==="boss")_md*=4;te.hp-=_md;trackDmg(gs,"Plasma Landmine",_md);sp(gs,te.x,te.y,"#ff88ff",6,3);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:te.x,y:te.y-te.size,text:Math.round(_md),life:24,ml:24,col:"#ff88ff"});if(te.hp<=0)mk.push(ti);}});mk.sort((a,b)=>b-a).forEach(ki=>killE(gs,gs.enemies[ki],ki));sp(gs,nm.x,nm.y,"#ff88ff",18,6);gs.screenShake=5;gs.novaRings.push({x:nm.x,y:nm.y,r:0,maxR:nm.r,life:22,ml:22});}});});gs._novaMines=gs._novaMines.filter(nm=>!nm.det);}
    if(has(gs,"homing")){const _hmDelay=hasAU(gs,"homing_sub1")?1000:1500;p.homingTimer+=dt;if(p.homingTimer>=_hmDelay&&gs.enemies.length>0){p.homingTimer=0;const _mCrit=hasAU(gs,"homing_sub2")&&Math.random()<0.15;gs.homingMissiles.push({x:p.x,y:p.y-10,vx:0,vy:-2,dmg:p.damage*0.4*(1+(p._kineticActive?p.kineticBonus:0))*(_mCrit?2.5:1),life:260,size:4,isCrit:_mCrit});}}
    if(has(gs,"gravity")){p.gravTimer+=dt;if(p.gravTimer>=8000){p.gravTimer=0;gs._gwCount=(gs._gwCount||0)+1;const isGold=hasAU(gs,"gravity_mastery")&&gs._gwCount%2===0;const cx=gs.enemies.length>0?gs.enemies.reduce((s,e)=>s+e.x,0)/gs.enemies.length:GW/2;const cy=gs.enemies.length>0?gs.enemies.reduce((s,e)=>s+e.y,0)/gs.enemies.length:GH*0.3;gs.gravWells.push({x:cx,y:cy,life:240,ml:240,r:110,golden:isGold});if(hasAU(gs,"gravity_sub2")){const _ga=rand(0,PI2);const _gd=110;const ox=cx+Math.cos(_ga)*_gd,oy=cy+Math.sin(_ga)*_gd;gs.gravWells.push({x:clamp(ox,30,GW-30),y:clamp(oy,30,GH*0.6),life:240,ml:240,r:70,golden:isGold,conjoined:true,parentX:cx,parentY:cy});}}}

    if(has(gs,"void_regen")){const _vrWin=hasAU(gs,"void_regen_sub2")&&gs.waveKilled>0?2500:4000;if(gs.time-p.lastDmgTime>_vrWin){const vrCap=p.maxHp*(hasAU(gs,"void_regen_sub1")?0.9:0.6);const vrTarget=has(gs,"overcharge")?p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2):vrCap;if(p.hp<vrTarget){const vrHeal=Math.min(vrTarget-p.hp,p.maxHp*0.02*dt*0.001);if(vrHeal>0){p.hp+=vrHeal;trackHeal(gs,"Void Regen",vrHeal);}else{p.hp=p.hp;}if(!gs._vrPlus)gs._vrPlus=[];gs._vrPlusT=(gs._vrPlusT||0)+dt;if(gs._vrPlusT>120){gs._vrPlusT=0;gs._vrPlus.push({ox:rand(-14,14),oy:rand(-6,10),vy:-rand(0.6,1.4),life:35,ml:35,sz:rand(2.5,4.5)});}}}}
    if(gs._vrPlus&&gs._vrPlus.length>0){gs._vrPlus.forEach(v=>{v.oy+=v.vy*dt*0.06;v.life-=dt*0.06;});gs._vrPlus=gs._vrPlus.filter(v=>v.life>0);}
    gs.gravWells.forEach(gw=>{gw.life-=dt*0.06;gs.enemies.forEach(e=>{if(e.type==="boss")return;if(dist(e,gw)<gw.r){const a=ag(e,gw);e.x+=Math.cos(a)*1.4*dt*0.06;e.y+=Math.sin(a)*1.4*dt*0.06;if(gw.golden)e._inGoldenGW=true;}else if(gw.golden&&e._inGoldenGW){e._inGoldenGW=false;}});gs.eBullets.forEach(b=>{if(dist(b,gw)<gw.r){const a=ag(b,gw);b.vx+=Math.cos(a)*0.04*dt*0.06;b.vy+=Math.sin(a)*0.04*dt*0.06;if(hasAU(gs,"gravity_sub1")){if(!b._origSz)b._origSz=b.size;b.size=Math.max(b._origSz*0.68,b.size-b._origSz*0.04*dt*0.001);}}});});
    gs.gravWells=gs.gravWells.filter(g=>g.life>0);
    gs.novaRings.forEach(nr=>{nr.life-=dt*0.06;nr.r=lerp(0,nr.maxR,1-nr.life/nr.ml);});
    gs.novaRings=gs.novaRings.filter(nr=>nr.life>0);
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
      else if(L.phase==="launch"){L.timer-=dt;L.x=lerp(L.x,L.tx,0.15*dt*0.06);L.y=lerp(L.y,L.ty,0.15*dt*0.06);if(L.timer<=0||dist(L,{x:L.tx,y:L.ty})<25){L.phase="capture";L.captured=[];gs.enemies.forEach(e=>{if(dist(e,L)<L.pushR&&e.type!=="boss"){e._lassoed=true;L.captured.push(e);}});L.moveTimer=4000;const aw=ag({x:L.x,y:L.y},p);L.moveX=L.x+Math.cos(aw)*400;L.moveY=clamp(L.y+Math.sin(aw)*400,40,GH*0.35);}}
      else if(L.phase==="capture"){L.moveTimer-=dt;L.x=lerp(L.x,L.moveX,0.04*dt*0.06);L.y=lerp(L.y,L.moveY,0.04*dt*0.06);L.captured=L.captured.filter(e=>{if(!gs.enemies.includes(e))return false;return true;});L.captured.forEach((e,ci)=>{const _co=ci*PI2/Math.max(1,L.captured.length);const _cx=L.x+Math.cos(_co)*25;const _cy=L.y+Math.sin(_co)*25;e.x=lerp(e.x,_cx,0.06*dt*0.06);e.y=lerp(e.y,_cy,0.06*dt*0.06);e.x=clamp(e.x,e.size,GW-e.size);});if(L.moveTimer<=0){L.captured.forEach(ce=>{ce._lassoed=false;});gs._lasso=null;}}}

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
    if(gs._isEnforcer&&gs._enfTimer>0)gs._enfTimer-=dt*0.001;
    if(gs.newEnemyNotif){gs.newEnemyNotif.timer-=dt*0.06;if(gs.newEnemyNotif.timer<=0)gs.newEnemyNotif=null;}
    if(gs._pendingLabNotifs&&gs._pendingLabNotifs.length>0){gs._labNotifs.push(...gs._pendingLabNotifs);gs._pendingLabNotifs=[];}
    if(gs._labNotifs&&gs._labNotifs.length>0){gs._labNotifs.forEach(ln=>{ln.timer-=dt*0.06;if(ln.confetti)ln.confetti.forEach(c=>{c.x+=c.vx*dt*0.06;c.y+=c.vy*dt*0.06;c.vy+=0.08*dt*0.06;c.rot+=0.1*dt*0.06;c.life-=dt*0.06;if(c.life<=0||c.y>40){c.x=rand(-60,60);c.y=rand(-15,5);c.vx=rand(-1.5,1.5);c.vy=rand(-2.5,-0.5);c.life=rand(30,60);c.rot=rand(0,6.28);}});});gs._labNotifs=gs._labNotifs.filter(ln=>ln.timer>0);}
    gs.spawnTimer-=dt;while(gs.spawnQueue.length>0&&gs.spawnTimer<=0){const nx=gs.spawnQueue.shift();spawnE(gs,nx);gs.spawnTimer=nx.delay||300;}

    gs.enemies.forEach(e=>{
      if(e.entering){e.y=lerp(e.y,e.targetY||120,0.02*dt*0.06);if(Math.abs(e.y-(e.targetY||120))<5)e.entering=false;}
      else if(e.type==="boss"){e.moveTimer=(e.moveTimer||0)+dt;e.x+=Math.sin(e.moveTimer*0.001)*1.2*dt*0.06;e.x=clamp(e.x,e.size+10,GW-e.size-10);if(e.hp<e.maxHp*0.5&&e.phase===1)e.phase=2;}
      else if(e.type==="bomber"){const a=ag(e,p);const _bSpd=e.speed*(1-(e._tdSlow||0));e.x+=Math.cos(a)*_bSpd*dt*0.06;e.y+=Math.sin(a)*_bSpd*dt*0.06;}
      else if(e.type==="weaver"){e.y+=e.speed*0.25*dt*0.06;e.sineOff+=dt*0.003;e.x+=Math.sin(e.sineOff)*e.sineAmp*0.03*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
      else if(e.type==="sniper"){
        if(e._lassoed){/* do nothing while lassoed */}else if(!e.telegraphing&&!e._sniperLineActive){e.teleTimer-=dt;if(e.teleTimer<=0){e.telegraphing=true;e.aimAngle=ag(e,p);e.teleTimer=700;}}
        else if(e.telegraphing){e.teleTimer-=dt;if(e.teleTimer<=0){e.telegraphing=false;e._sniperLineActive=true;e.teleTimer=e.fireRate;fireEB(gs,e);}}
        else if(e._sniperLineActive){const _hasSnBul=gs.eBullets.some(b=>b._sniperBullet&&b._sniperId===e._sniperId);if(!_hasSnBul)e._sniperLineActive=false;}
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
      if(!e.entering&&e.type!=="sniper"&&e.type!=="wraith"&&!e._lassoed){e.fireTimer-=dt;if(e.fireTimer<=0&&e.pattern!=="none"){e.fireTimer=e.fireRate||2000;if(e.type==="boss")fireBoss(gs,e);else fireEB(gs,e);}}
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
    if(gs.eBullets.length>600){gs.eBullets.sort((a,b)=>{const da=(a.x-p.x)**2+(a.y-p.y)**2;const db=(b.x-p.x)**2+(b.y-p.y)**2;return da-db;});gs.eBullets.length=600;}
    if(gs.particles.length>300)gs.particles=gs.particles.slice(-300);
    if(gs.enemies.length>80){gs.enemies=gs.enemies.slice(-80);gs.enemiesLeft=Math.min(gs.enemiesLeft,gs.enemies.length+gs.spawnQueue.length);}
    gs.hitTexts.forEach(ht=>{ht.life-=dt*0.06;ht.y-=0.8;});gs.hitTexts=gs.hitTexts.filter(ht=>ht.life>0);

    for(let i=gs.pBullets.length-1;i>=0;i--){const b=gs.pBullets[i];for(let j=gs.enemies.length-1;j>=0;j--){const e=gs.enemies[j];if(dist(b,e)<b.size+e.size){
      /* wraith invulnerable while phasing */
      if(e.type==="wraith"&&(e.phaseCD||0)>0){continue;}
      /* fortress shield deflects bullets from the shielded arc */
      if(e.type==="fortress"){const ba=Math.atan2(b.y-e.y,b.x-e.x);let da=ba-(e.shieldAngle||0);da=((da%PI2)+PI2)%PI2;if(da>Math.PI)da-=PI2;if(Math.abs(da)<0.9){sp(gs,b.x,b.y,"#55ccaa",3,2);gs.pBullets.splice(i,1);break;}}
      if(gs._isEnforcer&&e._isEnforcer){b.pierce=-1;sp(gs,b.x,b.y,"#ff557744",2,1);break;}e.hp-=b.damage;trackDmg(gs,b.src==="rear"?"Rear Turret":b.src==="drone"?"Combat Drone":b.src==="mirror"?"Echo Clone":"Main Gun",b.damage);
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
        const bul=gs.eBullets[i];const bdRaw=bul.dmg||(8+gs.wave*1.5);const bd=gs._isEnforcer?p.hp+100:bdRaw*(1-(p.dmgReduction||0));const bSrc=bul.src||"unknown";gs.eBullets.splice(i,1);const _pHP=p.hp;
        if(p.dodgeChance>0&&Math.random()<p.dodgeChance){/* dodge: halved damage through shield chain */const _hd=bd*0.5;if(p.goldenShields>0){p.goldenShields--;p.lastDmgTime=gs.time;p.invTimer=400;sp(gs,p.x,p.y,"#ffcc44",6,3);gs.screenShake=2;gs._noDmgWave=false;}else if(p.shields>0){p.shields--;p.lastDmgTime=gs.time;sp(gs,p.x,p.y,"#44aaff",4,2);gs.screenShake=2;gs._noDmgWave=false;}else{p.hp-=_hd;p.lastDmgTime=gs.time;gs.deathCause=bSrc.charAt(0).toUpperCase()+bSrc.slice(1);p.invTimer=400;gs.screenShake=3;sp(gs,p.x,p.y,"#aabbcc",4,2);gs._noDmgWave=false;}{const _hpL=_pHP-p.hp;trackPain(gs,bSrc,_hpL,_hpL>0?0:bd*0.5);}break;}
        if(p.goldenShields>0){p.goldenShields--;p.lastDmgTime=gs.time;p.invTimer=650;sp(gs,p.x,p.y,"#ffcc44",10,4);gs.screenShake=4;gs._noDmgWave=false;
          if(has(gs,"blackhole")&&hasAU(gs,"blackhole_mastery")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&(sn.telegraphing||sn._sniperLineActive)){sn.telegraphing=false;sn._sniperLineActive=false;sn.teleTimer=sn.fireRate;}});}const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",10,4);gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}
        else if(p.shields>0){p.shields--;p.lastDmgTime=gs.time;sp(gs,p.x,p.y,"#44aaff",6,3);gs.screenShake=3;gs._noDmgWave=false;if(has(gs,"blackhole")&&hasAU(gs,"blackhole_mastery")){const _ehPct2=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a2,b2)=>(b2.src==="sniper"?1:0)-(a2.src==="sniper"?1:0));gs.enemies.forEach(sn2=>{if(sn2.type==="sniper"&&(sn2.telegraphing||sn2._sniperLineActive)){sn2.telegraphing=false;sn2._sniperLineActive=false;sn2.teleTimer=sn2.fireRate;}});}const rc2=Math.ceil(gs.eBullets.length*_ehPct2);gs.eBullets.splice(0,rc2);sp(gs,p.x,p.y,"#9944ff",10,4);gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}
        else{p.hp-=bd;p.lastDmgTime=gs.time;gs._noDmgWave=false;gs.deathCause=bSrc.charAt(0).toUpperCase()+bSrc.slice(1);p.invTimer=650;gs.screenShake=6;gs.flashTimer=70;sp(gs,p.x,p.y,"#ff3355",7,3);if(has(gs,"drone")&&hasAU(gs,"drone_sub1")){const _src=gs.enemies.find(en=>en.type===bSrc);if(_src)gs._droneRage=_src;}
          if(has(gs,"blackhole")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;
            if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&(sn.telegraphing||sn._sniperLineActive)){sn.telegraphing=false;sn._sniperLineActive=false;sn.teleTimer=sn.fireRate;}});}
            const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",14,5);gs.screenShake=9;gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}{const _hpL2=_pHP-p.hp;trackPain(gs,bSrc,_hpL2,_hpL2>0?0:bd);}break;}}
      if(p.invTimer<=0&&p.phaseActive<=0){for(let i=gs.enemies.length-1;i>=0;i--){const e=gs.enemies[i];if(e.type==="bomber"&&dist(e,p)<e.size+p.size){const bd=gs._isEnforcer?p.hp+100:(12+gs.wave*1.5)*(e.dM||1)*(1-(p.dmgReduction||0));killE(gs,e,i);const _bpHP=p.hp;if(p.goldenShields>0){p.goldenShields--;p.lastDmgTime=gs.time;p.invTimer=650;sp(gs,p.x,p.y,"#ffcc44",10,4);gs.screenShake=4;gs._noDmgWave=false;if(has(gs,"blackhole")&&hasAU(gs,"blackhole_mastery")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&(sn.telegraphing||sn._sniperLineActive)){sn.telegraphing=false;sn._sniperLineActive=false;sn.teleTimer=sn.fireRate;}});}const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",10,4);gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}else if(p.shields>0){p.shields--;p.lastDmgTime=gs.time;sp(gs,p.x,p.y,"#44aaff",6,3);gs.screenShake=3;gs._noDmgWave=false;}else{p.hp-=bd;p.lastDmgTime=gs.time;gs._noDmgWave=false;gs.deathCause="Bomber explosion";p.invTimer=650;gs.flashTimer=70;sp(gs,p.x,p.y,"#ff3355",7,3);trackPain(gs,"bomber",bd,0);if(has(gs,"blackhole")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&(sn.telegraphing||sn._sniperLineActive)){sn.telegraphing=false;sn._sniperLineActive=false;sn.teleTimer=sn.fireRate;}});}const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",14,5);gs.screenShake=9;gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}{const _bHL=_bpHP-p.hp;if(_bHL<=0)trackPain(gs,"bomber",0,bd);}gs.screenShake=6;}}}}

    for(let i=gs.pickups.length-1;i>=0;i--){if(dist(gs.pickups[i],p)<18){const pk=gs.pickups[i];gs[pk.type]=(gs[pk.type]||0)+pk.value;if(pk.type==="scrap")gs._totalScrap=(gs._totalScrap||0)+pk.value;if(pk.type==="cores")gs._totalCores=(gs._totalCores||0)+pk.value;if(pk.type==="plasma")gs._totalPlasma=(gs._totalPlasma||0)+pk.value;
      if(has(gs,"overcharge")){const cap=p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2);const _phealAmt=(pk.type==="plasma"&&hasAU(gs,"overcharge_sub2"))?6:3;const _oh=Math.min(cap-p.hp,_phealAmt);if(_oh>0){p.hp+=_oh;trackHeal(gs,"Overcharge",_oh);}}
      gs.pickups.splice(i,1);}}
    if(has(gs,"mirror")&&hasAU(gs,"mirror_sub2")){const mx=GW-p.x;for(let i=gs.pickups.length-1;i>=0;i--){if(dist(gs.pickups[i],{x:mx,y:p.y})<18){const pk=gs.pickups[i];gs[pk.type]=(gs[pk.type]||0)+pk.value;if(pk.type==="scrap")gs._totalScrap=(gs._totalScrap||0)+pk.value;if(pk.type==="cores")gs._totalCores=(gs._totalCores||0)+pk.value;if(pk.type==="plasma")gs._totalPlasma=(gs._totalPlasma||0)+pk.value;if(has(gs,"overcharge")){const cap=p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2);p.hp=Math.min(cap,p.hp+3);}gs.pickups.splice(i,1);}}}

    const pLen=gs.enemies.length;gs.enemies=gs.enemies.filter(e=>{const keep=e.y<GH+200&&e.x>-200&&e.x<GW+200&&e.hp>0;if(!keep){const _isSC=e.type==="splitter"&&e.size<=10;if(!_isSC)gs.waveKilled++;}return keep;});
    const rem=pLen-gs.enemies.length;if(rem>0)gs.enemiesLeft=Math.max(0,gs.enemiesLeft-rem);

    if(p.hp<=0&&!gs.isTutorial){p.alive=false;sp(gs,p.x,p.y,"#00e5ff",22,5);gs.screenShake=16;
      if(gs.isPlayground||gs.isNewMode){if(gs.isNewMode)setMeta(prev=>{const nx={...prev,phantomHighWave:Math.max(prev.phantomHighWave||0,Math.max(0,gs.wave-1))};saveMeta(nx);return nx;});if(gs._isEnforcer){const _enfSurv=Math.round(60-Math.max(0,gs._enfTimer));const _enfET=gs._pgEnemy||"unknown";setMeta(prev=>{const _eb={...(prev.enforcerBest||{})};_eb[_enfET]=Math.max(_eb[_enfET]||0,_enfSurv);const nx={...prev,enforcerBest:_eb};saveMeta(nx);return nx;});}setTimeout(()=>setPhase("menu"),800);}
      else{const _rawEe=Math.max(0,Math.floor(gs.wave*1.5+gs.kills*0.38+Math.pow(gs.wave,2.8)*0.065+Math.pow(gs.wave,1.8)*0.4)-(gs.kills===0&&gs.wave<=1?1:0));const _heTier=metaRef.current.metaTier||1;const _heTV=_heTier===3?2.5:_heTier===2?1.5:1;const _hePh=_heTier>=2?(1+(metaRef.current.phantomHighWave||0)*(0.01+(metaRef.current.lab?.completed?.phantom_enhance||0)*0.001)):1;const _hePr=_heTier>=2?(1+(metaRef.current.practiseHighWave||0)*(0.006+(metaRef.current.lab?.completed?.practise_enhance||0)*0.008)):1;const _heEnf=_heTier>=2?1+(metaRef.current.enforcerKills||0)*0.025:1;const _heMult=_heTV*_hePh*_hePr*_heEnf;const ee=Math.floor(_rawEe*_heMult*(gs._diffuseMult||1));setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:ee,cause:gs.deathCause||"Unknown"});
      setMeta(prev=>{const nx={...prev,echoes:prev.echoes+ee,highWave:Math.max(prev.highWave||0,gs.wave),totalEchoesEarned:(prev.totalEchoesEarned||0)+ee};saveMeta(nx);return nx;});
      try{const _hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");_hist.push({date:Date.now(),wave:gs.wave,kills:gs.kills,echoes:ee,cause:gs.deathCause||"Unknown",scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,totalScrap:gs._totalScrap||gs.scrap,totalCores:gs._totalCores||gs.cores,totalPlasma:gs._totalPlasma||gs.plasma,forfeited:false,lifetimeEchoes:(meta.echoes||0)+ee});localStorage.setItem("vs4-history",JSON.stringify(_hist));}catch(e){}
      setTimeout(()=>setPhase("dead"),700);}}
    if(gs.isTutorial&&p.hp<=0){p.hp=1;p.invTimer=1200;gs.screenShake=8;gs.flashTimer=50;sp(gs,p.x,p.y,"#ffcc44",8,3);}
    if(gs.waveActive&&gs.enemiesLeft<=0&&gs.spawnQueue.length===0&&gs.enemies.length===0){
      /* wait for non-slow bullets to leave naturally; slow bullets (speed < 1.0, slowed by Temporal Drag) are excluded from the check */
      const _inSprint=gs._inSprint;
      if(_inSprint){if(!(has(gs,"nova")&&hasAU(gs,"nova_mastery")))gs._novaMines=[];gs.waveActive=false;gs._waveEndTimer=100;}
      else{const activeBullets=gs.eBullets.filter(b=>!b.mine&&Math.hypot(b.vx,b.vy)>1.0);
      if(activeBullets.length===0){gs.eBullets=[];if(!(has(gs,"nova")&&hasAU(gs,"nova_mastery")))gs._novaMines=[];gs.waveActive=false;gs._waveEndTimer=1000;}}
    }
    if(gs._isEnforcer&&gs._enfTimer<=0&&gs.enemies.length>0){gs.enemies.forEach(e=>{sp(gs,e.x,e.y,"#ff5577",20,6);});gs.enemies=[];gs.waveActive=false;gs._waveEndTimer=120;const _defET=gs._pgEnemy||"unknown";setMeta(prev=>{const _alreadyDefeated=!!(prev.enforcerDefeated||{})[_defET];const _ed={...(prev.enforcerDefeated||{})};_ed[_defET]=true;const _eb2={...(prev.enforcerBest||{})};_eb2[_defET]=60;const nx={...prev,enforcerKills:_alreadyDefeated?(prev.enforcerKills||0):(prev.enforcerKills||0)+1,enforcerDefeated:_ed,enforcerBest:_eb2};saveMeta(nx);return nx;});}
    if(!gs.waveActive&&gs._waveEndTimer>0){gs._waveEndTimer-=dt;if(gs._waveEndTimer<=0){gs._waveEndTimer=0;if(has(gs,"drone")&&hasAU(gs,"drone_mastery")){gs.pickups.forEach(pk=>{if(!pk._counted){pk._counted=true;if(!gs._missed)gs._missed={};gs._missed[pk.type]=(gs._missed[pk.type]||0)+pk.value;}});}if(gs._inSprint&&gs.pickups.length>0){gs.pickups.forEach(pk=>{const _sc=CUR[pk.type]?.color||"#fff";for(let _si=0;_si<10;_si++){const _sa=PI2/10*_si+rand(-0.4,0.4);const _sv=rand(3,7.5);gs.particles.push({x:pk.x,y:pk.y,vx:Math.cos(_sa)*_sv,vy:Math.sin(_sa)*_sv,life:rand(16,28),ml:28,color:_sc,size:rand(5,9)});}for(let _si=0;_si<5;_si++){gs.particles.push({x:pk.x+rand(-12,12),y:pk.y+rand(-12,12),vx:rand(-1.5,1.5),vy:rand(-4,-1.5),life:rand(20,35),ml:35,color:"#ffffff",size:rand(3,5.5)});}});}gs.pickups=[];
      if(gs.isPlayground){
        const pg=pgRef.current;
        if(pg&&pg.subWave===1&&pg.enemy!=="boss"){
          /* spawn 5 of same enemy */
          setPgMode({enemy:pg.enemy,subWave:2});
          gs.waveActive=true;gs.waveTotal=5;gs.enemiesLeft=5;gs.waveKilled=0;
          for(let i=0;i<5;i++)setTimeout(()=>{if(gsRef.current===gs)spawnE(gs,{type:pg.enemy});},i*400);
        } else {
          if(gs.isPractise)setMeta(prev=>{const nx={...prev,practiseHighWave:Math.max(prev.practiseHighWave||0,gs.wave)};saveMeta(nx);return nx;});
          if(!gs._isEnforcer&&!gs.isPractise){const _pgET=gs._pgEnemy||"unknown";setMeta(prev=>{const _pc={...(prev.pgCompleted||{})};_pc[_pgET]=true;const nx={...prev,pgCompleted:_pc};saveMeta(nx);return nx;});}
          setTimeout(()=>setPhase("menu"),600);
        }
      }
      else if(gs.isNewMode&&gs.wave>0&&gs.wave%2===0){
        /* Phantom mode: offer ability every 2 waves, normal random pool */
        offerAb(gs);
      }
      else if(gs.isNewMode){/* Phantom: skip shop */startWave(gs);}
      else if(gs.wave>0&&gs.wave%3===0){if(has(gs,"drone")&&hasAU(gs,"drone_mastery")&&gs._missed){const m=gs._missed;const gift={};["scrap","cores","plasma"].forEach(t=>{if(m[t]>0){const g=Math.ceil(m[t]/2);gift[t]=g;gs[t]+=g;}});gs._droneGift=Object.keys(gift).length>0?gift:{scrap:0,cores:0,plasma:0};gs._droneGiftShown=false;}gs._missed={};
        /* Intro Sprint: skip ability pick during sprint, accumulate pending picks */
        const _isLvl2=metaRef.current.lab?.completed?.intro_sprint||0;
        const _isPct2=_isLvl2>0?[10,20,30,40,50][Math.min(_isLvl2-1,4)]:0;
        const _isMax2=metaRef.current.highWave||0;
        const _isThresh2=Math.floor(_isMax2*_isPct2/100);
        if(_isPct2>0&&gs.wave<_isThresh2&&!gs.isTutorial&&!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&!metaRef.current.introSprintOff){
          gs._pendingAbPicks=(gs._pendingAbPicks||0)+1;
          gs._sprintedWaves=(gs._sprintedWaves||0)+1;
          {const _seLvl=metaRef.current.lab?.completed?.sprint_efficiency||0;const _sePct=_seLvl>0?[40,50,60,70,80][Math.min(_seLvl-1,4)]:30;if(Math.random()*100<_sePct){setMeta(prev=>{const lab=prev.lab;if(!lab||!lab.active||lab.active.length===0)return prev;const nx={...prev,lab:{...lab,totalWaves:(lab.totalWaves||0)+1,active:[...lab.active],completed:{...(lab.completed||{})}}};nx.lab.active=nx.lab.active.map(ar=>{if(!ar)return null;const upd={...ar,wavesProgress:(ar.wavesProgress||0)+1};if(upd.wavesProgress>=upd.wavesNeeded){const lu=LAB_UPGRADES.find(l=>l.id===ar.id);const curLvl=(nx.lab.completed[ar.id]||0);nx.lab.completed[ar.id]=curLvl+1;if(lu&&curLvl+1<lu.levels.length)return{id:ar.id,wavesNeeded:lu.levels[curLvl+1].waves,wavesProgress:0};return null;}return upd;}).filter(Boolean);saveMeta(nx);return nx;});}}
          startWave(gs,true);return;
        }
        /* If sprint just ended and we have pending picks, offer them now */
        if((gs._pendingAbPicks||0)>0){gs._pAb=(gs._pendingAbPicks||0);gs._pendingAbPicks=0;offerAb(gs);return;}
        /* Lab wave progress on ability waves */
        setMeta(prev=>{
          const lab=prev.lab;if(!lab||!lab.active||lab.active.length===0)return prev;
          const nx={...prev,lab:{...lab,totalWaves:(lab.totalWaves||0)+1,active:[...lab.active],completed:{...(lab.completed||{})}}};
          nx.lab.active=nx.lab.active.map(ar=>{
            if(!ar)return null;
            const upd={...ar,wavesProgress:(ar.wavesProgress||0)+1};
            if(upd.wavesProgress>=upd.wavesNeeded){
              const lu=LAB_UPGRADES.find(l=>l.id===ar.id);
              const curLvl=(nx.lab.completed[ar.id]||0);
              nx.lab.completed[ar.id]=curLvl+1;
              if(lu&&curLvl+1<lu.levels.length)return{id:ar.id,wavesNeeded:lu.levels[curLvl+1].waves,wavesProgress:0};
              return null;
            }
            return upd;
          }).filter(Boolean);
          /* lab notifications */
          const _lf=metaRef.current.labAlertFreq===undefined?5:metaRef.current.labAlertFreq;const _gs=gsRef.current;
          if(_lf>0&&_gs){nx.lab.active.forEach(ar=>{if(!ar)return;const _lu=LAB_UPGRADES.find(l=>l.id===ar.id);const _lvl=nx.lab.completed[ar.id]||0;if(ar.wavesProgress===0&&_lvl>0){/* level up! */const _pn=(_gs._pendingLabNotifs||[]);if(!_gs._labNotifs.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.levelUp&&ln.level===_lvl)&&!_pn.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.levelUp&&ln.level===_lvl)){_gs._pendingLabNotifs=_pn;_gs._pendingLabNotifs.push({name:_lu?_lu.name:ar.id,level:_lvl,progress:0,needed:0,timer:180,levelUp:true,confetti:Array.from({length:24},()=>({x:rand(-60,60),y:rand(-15,5),vx:rand(-1.5,1.5),vy:rand(-2.5,-0.5),col:pick(["#ffcc44","#44ddcc","#ff88ff","#88ddff","#ff6644","#66ff88"]),rot:rand(0,6.28),life:999}))});}}else if(ar.wavesProgress>0&&ar.wavesProgress%_lf===0&&ar.wavesProgress<ar.wavesNeeded){const _pn2=(_gs._pendingLabNotifs||[]);if(!_gs._labNotifs.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.progress===ar.wavesProgress)&&!_pn2.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.progress===ar.wavesProgress)){_gs._pendingLabNotifs=_pn2;_gs._pendingLabNotifs.push({name:_lu?_lu.name:ar.id,level:_lvl,progress:ar.wavesProgress,needed:ar.wavesNeeded,timer:180});}}});}
          saveMeta(nx);return nx;
        });
        if(gs.isTutorial&&gs.wave===3)setTimeout(()=>setTutStep(5),350);offerAb(gs);}
      else{if(has(gs,"drone")&&hasAU(gs,"drone_mastery")&&gs._missed){const m=gs._missed;const gift={};["scrap","cores","plasma"].forEach(t=>{if(m[t]>0){const g=Math.ceil(m[t]/2);gift[t]=g;gs[t]+=g;}});gs._droneGift=Object.keys(gift).length>0?gift:{scrap:0,cores:0,plasma:0};gs._droneGiftShown=false;}gs._missed={};
        if(gs.isTutorial){if(gs.wave===1){gs.scrap=Math.max(gs.scrap,20);setTutStep(3);}else if(gs.wave===5)setTutStep(7);}
        /* Intro Sprint: skip shop if within sprint range */
        const _isLvl=metaRef.current.lab?.completed?.intro_sprint||0;
        const _isPct=_isLvl>0?[10,20,30,40,50][Math.min(_isLvl-1,4)]:0;
        const _isMax=metaRef.current.highWave||0;
        const _isThresh=Math.floor(_isMax*_isPct/100);
        if(_isPct>0&&gs.wave<_isThresh&&!gs.isTutorial&&!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&!metaRef.current.introSprintOff){
          /* Auto-progress: skip shop, go straight to next wave */
          gs._sprintedWaves=(gs._sprintedWaves||0)+1;
          {const _seLvl=metaRef.current.lab?.completed?.sprint_efficiency||0;const _sePct=_seLvl>0?[40,50,60,70,80][Math.min(_seLvl-1,4)]:30;if(Math.random()*100<_sePct){setMeta(prev=>{const lab=prev.lab;if(!lab||!lab.active||lab.active.length===0)return prev;const nx={...prev,lab:{...lab,totalWaves:(lab.totalWaves||0)+1,active:[...lab.active],completed:{...(lab.completed||{})}}};nx.lab.active=nx.lab.active.map(ar=>{if(!ar)return null;const upd={...ar,wavesProgress:(ar.wavesProgress||0)+1};if(upd.wavesProgress>=upd.wavesNeeded){const lu=LAB_UPGRADES.find(l=>l.id===ar.id);const curLvl=(nx.lab.completed[ar.id]||0);nx.lab.completed[ar.id]=curLvl+1;if(lu&&curLvl+1<lu.levels.length)return{id:ar.id,wavesNeeded:lu.levels[curLvl+1].waves,wavesProgress:0};return null;}return upd;}).filter(Boolean);saveMeta(nx);return nx;});}}
          startWave(gs,true);return;
        }
        /* If sprint just ended and we have pending ability picks, offer them */
        if((gs._pendingAbPicks||0)>0){gs._pAb=(gs._pendingAbPicks||0);gs._pendingAbPicks=0;offerAb(gs);return;}
        setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});
        /* Lab wave progress */
        setMeta(prev=>{
          const lab=prev.lab;if(!lab||!lab.active||lab.active.length===0)return prev;
          let changed=false;const nx={...prev,lab:{...lab,totalWaves:(lab.totalWaves||0)+1,active:[...lab.active],completed:{...(lab.completed||{})}}};
          nx.lab.active=nx.lab.active.map(ar=>{
            if(!ar)return null;
            const upd={...ar,wavesProgress:(ar.wavesProgress||0)+1};
            if(upd.wavesProgress>=upd.wavesNeeded){
              changed=true;
              const lu=LAB_UPGRADES.find(l=>l.id===ar.id);
              const curLvl=(nx.lab.completed[ar.id]||0);
              nx.lab.completed[ar.id]=curLvl+1;
              /* Auto-start next level if available */
              if(lu&&curLvl+1<lu.levels.length){
                return{id:ar.id,wavesNeeded:lu.levels[curLvl+1].waves,wavesProgress:0};
              }
              return null;/* maxed, remove from active */
            }
            return upd;
          }).filter(Boolean);
          /* lab notifications */
          const _lf2=metaRef.current.labAlertFreq===undefined?5:metaRef.current.labAlertFreq;const _gs2=gsRef.current;
          if(_lf2>0&&_gs2){nx.lab.active.forEach(ar=>{if(!ar)return;const _lu=LAB_UPGRADES.find(l=>l.id===ar.id);const _lvl=nx.lab.completed[ar.id]||0;if(ar.wavesProgress===0&&_lvl>0){const _pn3=(_gs2._pendingLabNotifs||[]);if(!_gs2._labNotifs.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.levelUp&&ln.level===_lvl)&&!_pn3.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.levelUp&&ln.level===_lvl)){_gs2._pendingLabNotifs=_pn3;_gs2._pendingLabNotifs.push({name:_lu?_lu.name:ar.id,level:_lvl,progress:0,needed:0,timer:180,levelUp:true,confetti:Array.from({length:24},()=>({x:rand(-60,60),y:rand(-15,5),vx:rand(-1.5,1.5),vy:rand(-2.5,-0.5),col:pick(["#ffcc44","#44ddcc","#ff88ff","#88ddff","#ff6644","#66ff88"]),rot:rand(0,6.28),life:999}))});}}else if(ar.wavesProgress>0&&ar.wavesProgress%_lf2===0&&ar.wavesProgress<ar.wavesNeeded){const _pn4=(_gs2._pendingLabNotifs||[]);if(!_gs2._labNotifs.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.progress===ar.wavesProgress)&&!_pn4.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.progress===ar.wavesProgress)){_gs2._pendingLabNotifs=_pn4;_gs2._pendingLabNotifs.push({name:_lu?_lu.name:ar.id,level:_lvl,progress:ar.wavesProgress,needed:ar.wavesNeeded,timer:180});}}});}
          if(changed||true){saveMeta(nx);return nx;}
          return prev;
        });
        setPhase("shop");}}}
  }

  function render(){
    const gs=gsRef.current,canvas=canvasRef.current;if(!gs||!canvas)return;
    const ctx=canvas.getContext("2d");ctx.save();try{
    ctx.beginPath();ctx.rect(0,0,GW,GH);ctx.clip();
    if(gs.screenShake>0){gs.screenShake=Math.min(gs.screenShake,15);ctx.translate(rand(-gs.screenShake,gs.screenShake),rand(-gs.screenShake,gs.screenShake));}
    ctx.fillStyle="#06060e";ctx.fillRect(-20,-20,GW+40,GH+40);
    gs.stars.forEach(s=>{ctx.globalAlpha=s.br+Math.sin(gs.time*0.002+s.x)*0.1;ctx.fillStyle="#8888cc";ctx.fillRect(s.x,s.y,s.sz,s.sz);});ctx.globalAlpha=1;
    if(gs._ehFlash>0){gs._ehFlash-=0.333;const ehT=1-gs._ehFlash/30;const ehMaxR=Math.max(GW,GH)*1.1;const ehR=ehT*ehMaxR;const ehA=Math.max(0,(gs._ehFlash/30)*0.22);const ehOx=gs._ehOriginX||gs.player.x;const ehOy=gs._ehOriginY||gs.player.y;ctx.strokeStyle=`rgba(60,15,90,${ehA})`;ctx.lineWidth=35*(1-ehT*0.6);ctx.beginPath();ctx.arc(ehOx,ehOy,ehR,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(80,25,120,${ehA*0.5})`;ctx.lineWidth=12*(1-ehT*0.5);ctx.beginPath();ctx.arc(ehOx,ehOy,ehR*0.7,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(40,8,60,${ehA*0.3})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(ehOx,ehOy,ehR*0.4,0,PI2);ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=1;}
    gs.gravWells.forEach(gw=>{const a=Math.min(0.6,gw.life/gw.ml*0.7);if(gw.conjoined)return;if(gw.golden){const _gt=gs.time*0.003;ctx.strokeStyle=`rgba(255,204,68,${a})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,220,100,${a*0.3})`;ctx.lineWidth=1.5;for(let _gi=0;_gi<3;_gi++){ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r*(0.3+_gi*0.2),_gt+_gi*1.5,_gt+_gi*1.5+1.2);ctx.stroke();}}else{ctx.strokeStyle=`rgba(153,68,255,${a})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(153,68,255,${a*0.5})`;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r*0.5,0,PI2);ctx.stroke();}ctx.globalAlpha=1;});/* conjoined wells: draw only the part outside parent radius */gs.gravWells.filter(gw=>gw.conjoined).forEach(gw=>{const a=Math.min(0.6,gw.life/gw.ml*0.7);const col=gw.golden?"rgba(255,204,68,":"rgba(153,68,255,";const _pd=dist(gw,{x:gw.parentX,y:gw.parentY});const _pr=110;if(_pd>0){const _clipA=Math.acos(clamp((_pd*_pd+gw.r*gw.r-_pr*_pr)/(2*_pd*gw.r),-1,1));const _baseA=Math.atan2(gw.parentY-gw.y,gw.parentX-gw.x);ctx.strokeStyle=col+a+")";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,_baseA+_clipA,_baseA-_clipA);ctx.stroke();}});ctx.globalAlpha=1;
    gs.novaRings.forEach(nr=>{const a=nr.life/nr.ml;if(nr.fire){ctx.strokeStyle=`rgba(255,102,34,${a*0.7})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,170,51,${a*0.3})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r*0.85,0,PI2);ctx.stroke();}else{ctx.strokeStyle=`rgba(255,136,255,${a*0.7})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,136,255,${a*0.3})`;ctx.lineWidth=8;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r*0.95,0,PI2);ctx.stroke();}});
    if(gs._novaMines)gs._novaMines.forEach(nm=>{const _mp=0.5+Math.sin(gs.time*0.005)*0.2;const _mt=gs.time*0.003;const _msz=10;const _mdr=30;ctx.globalAlpha=_mp;ctx.fillStyle="#1a0822";ctx.beginPath();ctx.arc(nm.x,nm.y,_msz,0,PI2);ctx.fill();ctx.strokeStyle="#ff88ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(nm.x,nm.y,_msz,0,PI2);ctx.stroke();ctx.fillStyle="#ff44cc";ctx.beginPath();ctx.arc(nm.x,nm.y,_msz*0.35,0,PI2);ctx.fill();for(let _mi=0;_mi<4;_mi++){const _ma=(PI2/4)*_mi+_mt;ctx.fillStyle="#cc44aa";ctx.beginPath();ctx.arc(nm.x+Math.cos(_ma)*_msz*0.6,nm.y+Math.sin(_ma)*_msz*0.6,_msz*0.18,0,PI2);ctx.fill();}ctx.globalAlpha=1;});
    gs.pickups.forEach(pk=>{const pl=1+Math.sin(gs.time*0.005+pk.x)*0.2;ctx.globalAlpha=Math.min(1,pk.life/50);ctx.fillStyle=CUR[pk.type]?.color||"#fff";ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl,0,PI2);ctx.fill();if(pk.golden){ctx.strokeStyle="rgba(255,204,68,0.5)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl+3+Math.sin(gs.time*0.008)*1.5,0,PI2);ctx.stroke();}ctx.globalAlpha=Math.min(0.2,pk.life/70);ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl*2,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle="#eee";ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.fillText(`+${pk.value}`,pk.x,pk.y-pk.size-3);});
    gs.particles.forEach(pt=>{ctx.globalAlpha=clamp(pt.life/pt.ml,0,1);ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.size*(pt.life/pt.ml),0,PI2);ctx.fill();});ctx.globalAlpha=1;
    if(has(gs,"slowfield")&&gs.player.alive){const px=gs.player.x,py=gs.player.y,t=gs.time*0.0008;const _sfRv=hasAU(gs,"slowfield_sub1")?180:90;
      ctx.strokeStyle="rgba(136,204,255,0.12)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(px,py,_sfRv,0,PI2);ctx.stroke();
      ctx.strokeStyle="rgba(136,204,255,0.08)";ctx.beginPath();ctx.arc(px,py,_sfRv*0.67,0,PI2);ctx.stroke();
      ctx.strokeStyle="rgba(150,220,255,0.3)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,_sfRv,t,t+0.8);ctx.stroke();
      ctx.strokeStyle="rgba(150,220,255,0.15)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,py,_sfRv,t+Math.PI,t+Math.PI+0.6);ctx.stroke();
    }
    gs.eBullets.forEach(b=>{if(b.mine){const mp=0.6+Math.sin((b.mineTimer||0)*0.003)*0.4;ctx.fillStyle="#cc44ff";ctx.shadowColor="#cc44ff";ctx.shadowBlur=8*mp;ctx.beginPath();ctx.arc(b.x,b.y,b.size*mp,0,PI2);ctx.fill();ctx.strokeStyle="#ff88ff44";ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y,b.size*1.5,0,PI2);ctx.stroke();}else{ctx.fillStyle=b._sniperBullet?"#ff3344":"#ff4444";ctx.shadowColor=b._sniperBullet?"#ff3344":"#ff4444";ctx.shadowBlur=5;ctx.beginPath();ctx.arc(b.x,b.y,b.size,0,PI2);ctx.fill();}});ctx.shadowBlur=0;
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
    if(has(gs,"homing")&&gs.player.alive){const hx=lerp(gs._seekerX||gs.player.x,gs.player.x-20,0.04);const hy=lerp(gs._seekerY||gs.player.y,gs.player.y+18,0.04);gs._seekerX=hx;gs._seekerY=hy;ctx.fillStyle=scc;ctx.globalAlpha=0.85;ctx.beginPath();ctx.arc(hx,hy,5,0,PI2);ctx.fill();ctx.strokeStyle=scc+"44";ctx.lineWidth=1;ctx.beginPath();ctx.arc(hx,hy,7,0,PI2);ctx.stroke();ctx.globalAlpha=1;}

    const p=gs.player;
    if(p.alive){const blink=p.invTimer>0&&Math.floor(p.invTimer/40)%2===0;const sc=gs.shipCol||{color:"#00e5ff",glow:"#00e5ff"};if(!blink){
      ctx.shadowColor=sc.glow;ctx.shadowBlur=10;ctx.fillStyle=sc.color;
      if(gs.isNewMode)ctx.globalAlpha=0.35;
      ctx.beginPath();ctx.moveTo(p.x,p.y-p.size-4);ctx.lineTo(p.x-p.size,p.y+p.size);ctx.lineTo(p.x,p.y+p.size*0.4);ctx.lineTo(p.x+p.size,p.y+p.size);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
      /* Phantom mode chromatic aberration - close offset, high visibility */
      if(gs.isNewMode){const _gt=gs.time;const _gcols=["#00ffff","#ff00ff","#44ff88"];
        for(let _gi=0;_gi<3;_gi++){const _goff=Math.sin(_gt*0.011+_gi*2.1)*3+Math.sin(_gt*0.029+_gi)*1.5;const _goffY=Math.cos(_gt*0.009+_gi*1.7)*1.5;ctx.globalAlpha=0.32+Math.sin(_gt*0.006+_gi)*0.1;ctx.fillStyle=_gcols[_gi];ctx.beginPath();ctx.moveTo(p.x+_goff,p.y-p.size-4+_goffY);ctx.lineTo(p.x-p.size+_goff,p.y+p.size+_goffY);ctx.lineTo(p.x+_goff,p.y+p.size*0.4+_goffY);ctx.lineTo(p.x+p.size+_goff,p.y+p.size+_goffY);ctx.closePath();ctx.fill();}
        ctx.globalAlpha=1;}
      ctx.globalAlpha=1;
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
    if(gs._isEnforcer){const _eft=Math.max(0,gs._enfTimer);ctx.fillStyle="#ff5577";ctx.fillText(`ENFORCER · ${Math.ceil(_eft)}s remaining · ${gs.enemies.length} alive`,14,42);}else if(gs.isPlayground&&!gs.isPractise){const pg=pgRef.current;ctx.fillStyle="#55aa88";ctx.fillText(`PLAYGROUND: ${pg?pg.enemy.toUpperCase():""} · ${pg?.subWave===1?"Solo":"×5"} · ${gs.enemies.length} alive`,14,42);}
    else if(gs.isNewMode){ctx.fillStyle="#cc66cc";ctx.fillText(`PHANTOM · WAVE ${gs.wave}  ·  ${gs.waveKilled}/${gs.waveTotal} killed  ·  ${gs.enemies.length} alive`,14,42);}else if(gs._inSprint){ctx.fillStyle="#44ccaa";ctx.fillText(`INTRO SPRINT · WAVE ${gs.wave}  ·  ${gs.waveKilled}/${gs.waveTotal} killed  ·  ${gs.enemies.length} alive`,14,42);}else if(gs.isPractise){ctx.fillStyle="#cc8844";ctx.fillText(`PRACTISE: WAVE ${gs.wave}  ·  ${gs.waveKilled}/${gs.waveTotal} killed  ·  ${gs.enemies.length} alive`,14,42);}
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
    /* mobile controls */
    const _mc2=metaRef.current.mobileControls||"reactive";const _tr2=touchRef.current;
    if(_mc2==="reactive"&&_tr2.active){ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=2;ctx.beginPath();ctx.arc(_tr2.startX,_tr2.startY,60,0,PI2);ctx.stroke();ctx.globalAlpha=0.3;ctx.fillStyle="#ccddee";const _tjd=Math.min(Math.hypot(_tr2.curX-_tr2.startX,_tr2.curY-_tr2.startY),60);const _tja=Math.atan2(_tr2.curY-_tr2.startY,_tr2.curX-_tr2.startX);ctx.beginPath();ctx.arc(_tr2.startX+Math.cos(_tja)*_tjd,_tr2.startY+Math.sin(_tja)*_tjd,12,0,PI2);ctx.fill();ctx.globalAlpha=1;}
    if(_mc2==="stationary"){const _sjx=GW-90,_sjy=GH-90;ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=2;ctx.beginPath();ctx.arc(_sjx,_sjy,68,0,PI2);ctx.stroke();if(_tr2.active){ctx.globalAlpha=0.3;ctx.fillStyle="#ccddee";const _sjd=Math.min(Math.hypot(_tr2.curX-_sjx,_tr2.curY-_sjy),68);const _sja=Math.atan2(_tr2.curY-_sjy,_tr2.curX-_sjx);ctx.beginPath();ctx.arc(_sjx+Math.cos(_sja)*_sjd,_sjy+Math.sin(_sja)*_sjd,15,0,PI2);ctx.fill();}else{ctx.globalAlpha=0.2;ctx.fillStyle="#ccddee";ctx.beginPath();ctx.arc(_sjx,_sjy,15,0,PI2);ctx.fill();}ctx.globalAlpha=1;}
    if(_mc2==="arrows"){const _kSz=52,_kGp=5,_dcx=GW-115,_dcy=GH-135,_hk=26;
    /* up */ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=1.5;ctx.strokeRect(_dcx-_hk,_dcy-_hk-_kGp-_kSz,_kSz,_kSz);ctx.globalAlpha=_tr2._arrowU?0.4:0.12;ctx.fillStyle="#ccddee";ctx.beginPath();ctx.moveTo(_dcx,_dcy-_hk-_kGp-_kSz*0.72);ctx.lineTo(_dcx-_hk*0.55,_dcy-_hk-_kGp-_kSz*0.3);ctx.lineTo(_dcx+_hk*0.55,_dcy-_hk-_kGp-_kSz*0.3);ctx.fill();
    /* down */ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=1.5;ctx.strokeRect(_dcx-_hk,_dcy+_hk+_kGp,_kSz,_kSz);ctx.globalAlpha=_tr2._arrowD?0.4:0.12;ctx.beginPath();ctx.moveTo(_dcx,_dcy+_hk+_kGp+_kSz*0.72);ctx.lineTo(_dcx-_hk*0.55,_dcy+_hk+_kGp+_kSz*0.3);ctx.lineTo(_dcx+_hk*0.55,_dcy+_hk+_kGp+_kSz*0.3);ctx.fill();
    /* left */ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=1.5;ctx.strokeRect(_dcx-_hk-_kGp-_kSz,_dcy-_hk,_kSz,_kSz);ctx.globalAlpha=_tr2._arrowL?0.4:0.12;ctx.beginPath();ctx.moveTo(_dcx-_hk-_kGp-_kSz*0.72,_dcy);ctx.lineTo(_dcx-_hk-_kGp-_kSz*0.3,_dcy-_hk*0.55);ctx.lineTo(_dcx-_hk-_kGp-_kSz*0.3,_dcy+_hk*0.55);ctx.fill();
    /* right */ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=1.5;ctx.strokeRect(_dcx+_hk+_kGp,_dcy-_hk,_kSz,_kSz);ctx.globalAlpha=_tr2._arrowR?0.4:0.12;ctx.beginPath();ctx.moveTo(_dcx+_hk+_kGp+_kSz*0.72,_dcy);ctx.lineTo(_dcx+_hk+_kGp+_kSz*0.3,_dcy-_hk*0.55);ctx.lineTo(_dcx+_hk+_kGp+_kSz*0.3,_dcy+_hk*0.55);ctx.fill();
    ctx.globalAlpha=1;}
    /* Pause button for non-reactive controls or when reactive joystick was used */
    if(_mc2!=="reactive"||_tr2._wasUsed){ctx.globalAlpha=0.35;ctx.strokeStyle="#ccddee";ctx.lineWidth=2;const _pbx=GW-66;ctx.strokeRect(_pbx,62,52,32);ctx.fillStyle="#ccddee";ctx.fillRect(_pbx+14,68,7,20);ctx.fillRect(_pbx+29,68,7,20);ctx.globalAlpha=1;}
    if(_mc2==="reactive"&&_tr2.active)_tr2._wasUsed=true;
    /* new enemy notification */
    if(gs.newEnemyNotif){const nn=gs.newEnemyNotif;const na=Math.min(1,nn.timer/30);const name=nn.type.charAt(0).toUpperCase()+nn.type.slice(1);
      ctx.globalAlpha=na;ctx.fillStyle="rgba(6,6,14,0.7)";ctx.fillRect(GW/2-80,68,160,26);ctx.strokeStyle="#ffcc4466";ctx.lineWidth=1;ctx.strokeRect(GW/2-80,68,160,26);
      ctx.fillStyle="#ffcc44";ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.fillText(`NEW: ${name}`,GW/2+8,85);
      /* mini enemy icon */const ed=ED[nn.type];if(ed){ctx.save();ctx.translate(GW/2-65,81);drawShape(ctx,nn.type,0,0,8,ed.col,gs.time,{});ctx.restore();}
      else if(nn.type==="boss"){ctx.save();ctx.translate(GW/2-65,81);drawShape(ctx,"boss",0,0,8,"#ff2266",gs.time,{});ctx.restore();}
      ctx.globalAlpha=1;}
    /* lab progress notifications */
    if(gs._labNotifs&&gs._labNotifs.length>0){gs._labNotifs.forEach((ln,ni)=>{const _ny=98+ni*38;const la=Math.min(1,ln.timer/30)*Math.min(1,(180-ln.timer)/15);
      ctx.globalAlpha=la;ctx.fillStyle="rgba(6,6,14,0.7)";ctx.fillRect(GW/2-100,_ny,200,26);ctx.strokeStyle=ln.levelUp?"#ffcc4466":"#ff886644";ctx.lineWidth=ln.levelUp?1.5:1;ctx.strokeRect(GW/2-100,_ny,200,26);
      /* flask icon */ctx.save();ctx.translate(GW/2-84,_ny+13);ctx.strokeStyle=ln.levelUp?"#ffcc44":"#ff9966";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,-6);ctx.lineTo(-3,-1);ctx.lineTo(-6,6);ctx.lineTo(6,6);ctx.lineTo(3,-1);ctx.lineTo(3,-6);ctx.closePath();ctx.stroke();ctx.fillStyle=ln.levelUp?"#ffcc4444":"#ff996644";ctx.beginPath();ctx.moveTo(-5,3);ctx.lineTo(-6,6);ctx.lineTo(6,6);ctx.lineTo(5,3);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-2,-6);ctx.lineTo(2,-6);ctx.stroke();ctx.restore();
      ctx.fillStyle=ln.levelUp?"#ffcc44":"#ff9966";ctx.font="bold 9px monospace";ctx.textAlign="center";
      if(ln.levelUp){ctx.fillText(`${ln.name} Lv${ln.level} COMPLETE!`,GW/2+10,_ny+17);
        if(ln.confetti){ln.confetti.forEach(c=>{if(ln.timer>0){ctx.globalAlpha=la*0.8;ctx.save();ctx.translate(GW/2+c.x,_ny+13+c.y);ctx.rotate(c.rot);ctx.fillStyle=c.col;ctx.fillRect(-2,-1.5,4,3);ctx.restore();}});}}
      else{ctx.fillText(`${ln.name} Lv${ln.level} ${ln.progress}/${ln.needed}`,GW/2+10,_ny+17);}
      ctx.globalAlpha=1;});}
    }finally{ctx.restore();}
  }

  useEffect(()=>{const loop=t=>{const dt=Math.min(t-ltRef.current,50);ltRef.current=t;try{if(phRef.current==="playing"&&!pausedRef.current)update(dt);render();}catch(e){console.error("Game loop error:",e);}rafRef.current=requestAnimationFrame(loop);};rafRef.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rafRef.current);},[]);
  useEffect(()=>{const d=e=>{keysRef.current[e.key.toLowerCase()]=true;if(e.key===" ")e.preventDefault();};const u=e=>{keysRef.current[e.key.toLowerCase()]=false;};window.addEventListener("keydown",d);window.addEventListener("keyup",u);return()=>{window.removeEventListener("keydown",d);window.removeEventListener("keyup",u);};},[]);
  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    const getT=(e)=>{const r=c.getBoundingClientRect();const scl=GW/r.width;return{x:(e.clientX-r.left)*scl,y:(e.clientY-r.top)*scl};};
    const ts=(e)=>{if(phRef.current!=="playing"||pausedRef.current)return;const mc=metaRef.current.mobileControls||"reactive";const t=e.changedTouches[0];if(!t)return;e.preventDefault();const p=getT(t);
      /* pause button tap */if(p.x>GW-70&&p.x<GW-10&&p.y>58&&p.y<100){setPaused(pr=>!pr);return;}
      if(mc==="reactive"){touchRef.current={active:true,startX:p.x,startY:p.y,curX:p.x,curY:p.y,id:t.identifier};}
      else if(mc==="stationary"){touchRef.current={active:true,startX:GW-90,startY:GH-90,curX:p.x,curY:p.y,id:t.identifier};}
      else if(mc==="arrows"){const tr=touchRef.current;const _kSz=52,_kGp=5,_dcx=GW-115,_dcy=GH-135,_hk=26;
        if(p.x>_dcx-_hk-_kGp-_kSz&&p.x<_dcx-_hk-_kGp&&p.y>_dcy-_hk&&p.y<_dcy+_hk)tr._arrowL=true;
        if(p.x>_dcx+_hk+_kGp&&p.x<_dcx+_hk+_kGp+_kSz&&p.y>_dcy-_hk&&p.y<_dcy+_hk)tr._arrowR=true;
        if(p.x>_dcx-_hk&&p.x<_dcx+_hk&&p.y>_dcy-_hk-_kGp-_kSz&&p.y<_dcy-_hk-_kGp)tr._arrowU=true;
        if(p.x>_dcx-_hk&&p.x<_dcx+_hk&&p.y>_dcy+_hk+_kGp&&p.y<_dcy+_hk+_kGp+_kSz)tr._arrowD=true;
        tr.active=true;tr.id=t.identifier;}};
    const tm=(e)=>{const tr=touchRef.current;if(!tr.active)return;e.preventDefault();for(let i=0;i<e.changedTouches.length;i++){if(e.changedTouches[i].identifier===tr.id){const p=getT(e.changedTouches[i]);tr.curX=p.x;tr.curY=p.y;}}};
    const te=(e)=>{const tr=touchRef.current;if(!tr.active)return;for(let i=0;i<e.changedTouches.length;i++){if(e.changedTouches[i].identifier===tr.id){tr.active=false;tr._arrowL=false;tr._arrowR=false;tr._arrowU=false;tr._arrowD=false;}}};
    c.addEventListener("touchstart",ts,{passive:false});c.addEventListener("touchmove",tm,{passive:false});c.addEventListener("touchend",te);c.addEventListener("touchcancel",te);
    return()=>{c.removeEventListener("touchstart",ts);c.removeEventListener("touchmove",tm);c.removeEventListener("touchend",te);c.removeEventListener("touchcancel",te);};
  },[]);
  useEffect(()=>{const h=e=>{
    const k=e.key.toLowerCase();
    /* I keybind removed — codex available via pause menu */
    if((k==="p"||k==="escape")&&phRef.current==="playing"){
      if(wikiRef.current){setShowWiki(false);setShowStats(false);}
      else{setPaused(p=>!p);setShowStats(false);}
    }
    if(k==="enter"&&phRef.current==="shop"){const gs=gsRef.current;if(gs&&!gs.isTutorial){cont();}}
  };window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);

  function buyShop(uid){const gs=gsRef.current;if(!gs)return;if(gs.isTutorial&&(tutRef.current===3||tutRef.current===4)&&uid!=="maxhp")return;const up=SHOP.find(u=>u.id===uid);if(up.wave>gs.wave)return;const lvl=gs.upgrades[uid]||0;if(lvl>=up.max)return;const cost=Math.ceil(up.base*Math.pow(1+lvl*up.scale,up.exp));if(gs[up.cur]<cost)return;gs[up.cur]-=cost;gs.upgrades[uid]=lvl+1;const _hpBefore=gs.player.hp;up.fn(gs.player);if(uid==="maxhp"){const _healed=gs.player.hp-_hpBefore;if(_healed>0)trackHeal(gs,"Hull Plating",_healed);if(gs.isTutorial&&tutRef.current<=4)setTutStep(45);}setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});}
  function cont(){setPhase("playing");const gs=gsRef.current;if(gs)startWave(gs);}
  function calcEchoes(gs){const w=gs?.wave||0,k=gs?.kills||0;const raw=Math.max(0,Math.floor(w*1.5+k*0.38+Math.pow(w,2.8)*0.065+Math.pow(w,1.8)*0.4)-(k===0&&w<=1?1:0));const _t=metaRef.current.metaTier||1;const _tv=_t===3?2.5:_t===2?1.5:1;const _ph=_t>=2?(1+(metaRef.current.phantomHighWave||0)*(0.01+(metaRef.current.lab?.completed?.phantom_enhance||0)*0.001)):1;const _pr=_t>=2?(1+(metaRef.current.practiseHighWave||0)*(0.006+(metaRef.current.lab?.completed?.practise_enhance||0)*0.008)):1;const _enf=_t>=2?1+(metaRef.current.enforcerKills||0)*0.025:1;return Math.floor(raw*_tv*_ph*_pr*_enf*(gs?._diffuseMult||1));}
  function forfeit(){const gs=gsRef.current;if(!gs)return;if(gs.isTutorial){const ee=calcEchoes(gs);gs.player.alive=false;const tutEchoes=Math.max(ee,50);setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:tutEchoes,cause:"Tutorial"});setMeta(prev=>{const nx={...prev,echoes:prev.echoes+tutEchoes,highWave:Math.max(prev.highWave||0,gs.wave),totalEchoesEarned:(prev.totalEchoesEarned||0)+tutEchoes};saveMeta(nx);return nx;});setTutStep(8);setConfirmForfeit(false);setPhase("dead");return;}if(gs.isPlayground||gs.isNewMode){gs.player.alive=false;if(gs.isNewMode)setMeta(prev=>{const nx={...prev,phantomHighWave:Math.max(prev.phantomHighWave||0,Math.max(0,gs.wave-1))};saveMeta(nx);return nx;});setPhase("menu");return;}const ee=calcEchoes(gs);gs.player.alive=false;setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:ee,cause:"Self"});setMeta(prev=>{const nx={...prev,echoes:prev.echoes+ee,highWave:Math.max(prev.highWave||0,gs.wave),totalEchoesEarned:(prev.totalEchoesEarned||0)+ee};saveMeta(nx);return nx;});
      try{const _hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");_hist.push({date:Date.now(),wave:gs.wave,kills:gs.kills,echoes:ee,cause:"Forfeited",scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,totalScrap:gs._totalScrap||gs.scrap,totalCores:gs._totalCores||gs.cores,totalPlasma:gs._totalPlasma||gs.plasma,forfeited:true,lifetimeEchoes:(meta.echoes||0)+ee});localStorage.setItem("vs4-history",JSON.stringify(_hist));}catch(e){}
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

  const [MenuBG]=useState(()=>()=>{
    const bgRef=useRef(null);const bgStars=useRef(null);const bgNebula=useRef(null);const bgDebris=useRef(null);const bgTime=useRef(0);const bgRaf=useRef(null);
    useEffect(()=>{
      if(!bgStars.current){const _sd=getBgShared();bgStars.current=_sd.stars;bgNebula.current=_sd.neb;bgDebris.current=_sd.deb;
      }
      const draw=()=>{const c=bgRef.current;if(!c)return;const ctx=c.getContext("2d");bgTime.current+=16;const t=bgTime.current;
        ctx.fillStyle="#04040a";ctx.fillRect(0,0,GW,GH);
        /* subtle hex grid */
        ctx.strokeStyle="rgba(0,229,255,0.04)";ctx.lineWidth=0.5;const hSz=40;const hH=hSz*Math.sqrt(3);for(let gy=-1;gy<GH/hH+1;gy++){for(let gx=-1;gx<GW/(hSz*1.5)+1;gx++){const ox=gx*hSz*1.5;const oy=gy*hH+(gx%2===0?0:hH/2);ctx.beginPath();for(let hi=0;hi<6;hi++){const ha=(Math.PI/3)*hi+Math.PI/6;ctx.lineTo(ox+Math.cos(ha)*hSz*0.45,oy+Math.sin(ha)*hSz*0.45);}ctx.closePath();ctx.stroke();}}
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
  });

  const [SubMenuBG]=useState(()=>()=>{
    const bgRef2=useRef(null);const bgStars2=useRef(null);const bgNeb2=useRef(null);const bgDeb2=useRef(null);const bgTime2=useRef(0);const bgRaf2=useRef(null);
    useEffect(()=>{
      if(!bgStars2.current){const _sd=getBgShared();bgStars2.current=_sd.stars;bgNeb2.current=_sd.neb;bgDeb2.current=_sd.deb;
      }
      const draw=()=>{const c=bgRef2.current;if(!c)return;const ctx=c.getContext("2d");bgTime2.current+=16;const t=bgTime2.current;
        ctx.fillStyle="#04040a";ctx.fillRect(0,0,GW,GH);
        ctx.strokeStyle="rgba(0,229,255,0.04)";ctx.lineWidth=0.5;const hSz=40;const hH=hSz*Math.sqrt(3);for(let gy=-1;gy<GH/hH+1;gy++){for(let gx=-1;gx<GW/(hSz*1.5)+1;gx++){const ox=gx*hSz*1.5;const oy=gy*hH+(gx%2===0?0:hH/2);ctx.beginPath();for(let hi=0;hi<6;hi++){const ha=(Math.PI/3)*hi+Math.PI/6;ctx.lineTo(ox+Math.cos(ha)*hSz*0.45,oy+Math.sin(ha)*hSz*0.45);}ctx.closePath();ctx.stroke();}}
        bgNeb2.current.forEach(n=>{n.x+=n.drift;n.y+=n.driftY;if(n.x<-n.r)n.x=GW+n.r;if(n.x>GW+n.r)n.x=-n.r;if(n.y<-n.r)n.y=GH+n.r;if(n.y>GH+n.r)n.y=-n.r;const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);g.addColorStop(0,n.col);g.addColorStop(0.6,n.col.slice(0,7)+"33");g.addColorStop(1,"transparent");ctx.globalAlpha=n.opc+Math.sin(t*0.0002+n.x*0.01)*0.03;ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();});
        ctx.globalAlpha=1;bgDeb2.current.forEach(d=>{d.rot+=d.rotSpd*16;d.y+=d.spY;d.x+=d.spX;if(d.y>GH+30){d.y=-30;d.x=rand(0,GW);}if(d.x<-30)d.x=GW+30;if(d.x>GW+30)d.x=-30;ctx.globalAlpha=d.opc;ctx.strokeStyle=d.col;ctx.lineWidth=1;ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.beginPath();for(let si=0;si<d.sides;si++){const sa=(Math.PI*2/d.sides)*si;ctx.lineTo(Math.cos(sa)*d.sz,Math.sin(sa)*d.sz);}ctx.closePath();ctx.stroke();ctx.restore();});
        ctx.globalAlpha=1;bgStars2.current.forEach(s=>{const lSpd=[0.3,0.6,1.0,0.15][s.layer];s.y+=s.sp*lSpd;if(s.y>GH){s.y=-2;s.x=rand(0,GW);}s.pulse+=s.pulseSpd*16;const b=s.br+Math.sin(s.pulse)*0.2;ctx.globalAlpha=clamp(b,0.08,1);if(s.col){ctx.fillStyle=s.col;ctx.shadowColor=s.col;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(s.x,s.y,s.sz*0.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}else{ctx.fillStyle="#8899cc";ctx.fillRect(s.x,s.y,s.sz,s.sz);}});
        ctx.globalAlpha=1;const vg=ctx.createRadialGradient(GW/2,GH/2,GW*0.3,GW/2,GH/2,GW*0.8);vg.addColorStop(0,"transparent");vg.addColorStop(1,"rgba(4,4,10,0.5)");ctx.fillStyle=vg;ctx.fillRect(0,0,GW,GH);
        bgRaf2.current=requestAnimationFrame(draw);};
      bgRaf2.current=requestAnimationFrame(draw);
      return()=>{if(bgRaf2.current)cancelAnimationFrame(bgRaf2.current);};
    },[]);
    return <canvas ref={bgRef2} width={GW} height={GH} style={{position:"sticky",top:0,left:0,width:"100%",height:"100%",zIndex:0,opacity:0.35,pointerEvents:"none",marginBottom:"-100%",flexShrink:0}} />;
  });

  function totalCostToMax(up){let total=0;for(let l=0;l<up.max;l++)total+=Math.ceil(up.base*Math.pow(1+l*up.scale,up.exp));return total;}
  function costAt(up,l){return Math.ceil(up.base*Math.pow(1+l*up.scale,up.exp));}
  function costStr(up,sym){const mid=Math.floor(up.max/2);const last=up.max-1;const tc=totalCostToMax(up);return `Lv1: ${costAt(up,0)}${sym}${up.max>2?` · Lv${mid+1}: ${costAt(up,mid)}${sym}`:""} · Lv${up.max}: ${costAt(up,last)}${sym} · Total: ${tc}${sym}`;}

  const ShipStats=({metaData,gsData,wide,homeMode})=>{
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
        <div>Crit: <span style={{color:"#ffff44"}}>{((v(p?.critChance,gml("m_crit")*0.02)||0)*100).toFixed(0)}%</span>{!homeMode&&<> · Dodge: <span style={{color:"#aabbcc"}}>{((v(p?.dodgeChance,0)||0)*100).toFixed(0)}%</span> · Defense: <span style={{color:"#66aacc"}}>{((v(p?.dmgReduction,0)||0)*100).toFixed(0)}%</span></>}</div>
        {!homeMode&&<div>Regen: <span style={{color:"#44ff88"}}>{v(p?.regenRate.toFixed(1),"0.0")}/s</span> · Pickup: <span style={{color:"#ccbbaa"}}>{((540+(v(p?.pickupLife,0)||0))/60).toFixed(1)}s</span></div>}
        {p&&p.abilities.length>0&&<div style={{marginTop:4,color:"#aabbcc",display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center"}}>{p.abilities.map(id=>{const ab=ABILITIES.find(a=>a.id===id);return ab?<span key={id} style={{display:"inline-flex",alignItems:"center",gap:2}}><AbilityIcon id={id} size={12} color="#aabbcc" />{ab.name}</span>:id;})}</div>}
      </div>
    );
  };

  const[codexOpen,setCodexOpen]=useState({controls:false,mechanics:false,currencies:false,enemies:false,abilities:false,scrap:false,cores:false,plasma:false,meta:false,metaab:false,labs:false});
  const togCodex=(k)=>setCodexOpen(p=>({...p,[k]:!p[k]}));
  const CodexSec=({id,title,color,children})=>(<div style={{marginBottom:4}}>
    <h3 onClick={()=>togCodex(id)} style={{color:color||"#bbccdd",fontSize:13,letterSpacing:2,margin:"10px 0 4px",cursor:"pointer",userSelect:"none",textDecoration:"underline",textDecorationColor:(color||"#bbccdd")+"44",textUnderlineOffset:3}}>{codexOpen[id]?"▾":"▸"} {title}</h3>
    {codexOpen[id]&&children}</div>);

  const Wiki=()=>(
    <div className="vs-scroll" style={{position:"absolute",inset:0,background:"rgba(6,6,14,0.97)",zIndex:20,overflow:"auto",padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{color:"#dde",fontSize:18,margin:0,letterSpacing:3}}>VOID CODEX</h2>
        <button onClick={()=>setShowWiki(false)} style={{background:"none",border:"1px solid #667",color:"#bbc",padding:"4px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:11}}>✕</button>
      </div>

      <CodexSec id="controls" title="CONTROLS" color="#88bbdd">
        <div style={{color:"#99aabb",fontSize:10,lineHeight:1.7}}><b style={{color:"#dde"}}>WASD / Arrow Keys</b> — Move · <b style={{color:"#dde"}}>P / Esc</b> — Pause</div>
      </CodexSec>

      <CodexSec id="mechanics" title="MECHANICS" color="#aabbcc">
        <div style={{color:"#8899aa",fontSize:9,lineHeight:1.6}}>
          <b style={{color:"#bbccdd"}}>Auto-fire</b> — your ship fires automatically. You only need to move and dodge.<br/>
          <b style={{color:"#bbccdd"}}>Waves</b> — enemies spawn in waves of increasing difficulty. Between waves you visit the upgrade station to spend currency.<br/>
          <b style={{color:"#bbccdd"}}>Abilities</b> — every 3 waves, choose 1 of 3 abilities. These are permanent for the run and cannot be duplicated.<br/>
          <b style={{color:"#bbccdd"}}>Death & Echoes</b> — when your ship is destroyed, you earn Echoes based on your wave and kills. Spend these on permanent meta upgrades.<br/>
          <b style={{color:"#bbccdd"}}>Shields</b> absorb one hit each but do NOT grant invincibility frames. You can lose multiple shields in rapid succession.<br/>
          <b style={{color:"#bbccdd"}}>HP damage</b> grants brief invincibility frames, preventing consecutive HP hits.<br/>
          <b style={{color:"#bbccdd"}}>Wave completion</b> — waves end once all enemies are dead AND all enemy bullets have left the screen, plus a brief grace period to collect remaining pickups.<br/>
          <b style={{color:"#bbccdd"}}>Enemies</b> will try to stay in the play area — if they drift too far down, they steer back up.<br/>
          <b style={{color:"#bbccdd"}}>Fortune</b> multiplies scrap and core drops. <b style={{color:"#bbccdd"}}>Plasma drops receive only half</b> of the fortune multiplier. Wave progression also slightly increases drops.<br/>
          <b style={{color:"#bbccdd"}}>Ability Upgrades</b> — each ability has 2 sub-upgrades and 1 mastery upgrade, purchased with Ability Shards in the Meta Upgrades screen. Shards are bought with Echoes, and each shard costs more than the last. Sub-upgrades cost 1 shard each, while mastery upgrades cost 3 shards and require both sub-upgrades to be unlocked first. These upgrades are permanent and apply to every run.
        </div>
      </CodexSec>

      <CodexSec id="currencies" title="CURRENCIES" color="#ffcc44">
        {Object.entries(CUR).map(([k,c])=>(
          <div key={k} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #1a1a2e"}}>
            <span style={{color:c.color,fontSize:16,minWidth:20}}>{c.icon}</span>
            <div><div style={{color:c.color,fontSize:10,fontWeight:"bold"}}>{c.name} <span style={{color:"#778899",fontSize:8}}>{c.rarity}</span></div>
            <div style={{color:"#8899aa",fontSize:9}}>{c.desc}</div>
            {k==="echoes"&&<div style={{color:"#667788",fontSize:8}}>Earned when your ship is destroyed.</div>}</div>
          </div>))}
      </CodexSec>

      <CodexSec id="enemies" title="ENEMIES" color="#ff4466">
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

      <CodexSec id="abilities" title="ABILITIES" color="#66bbff">
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

      <CodexSec id="meta" title={"META SHIP UPGRADES"} color={CUR.echoes.color}>
        <div style={{color:"#667788",fontSize:8,marginBottom:4}}>Permanent upgrades bought with Echoes. Persist across all runs forever. Tier system: max all upgrades at current tier to unlock the next. Tier 1 → 2 costs 800⬢, Tier 2 → 3 costs 25,000⬢. Each tier doubles max levels with steeper costs. Tier 3 is the maximum.</div>
        {META.map(up=>{const tc=Array.from({length:up.max},(_, l)=>Math.ceil(up.base*(1+l*0.85))).reduce((a,b)=>a+b,0);return(
          <div key={up.id} style={{padding:"4px 0",borderBottom:"1px solid #1a1a2e"}}>
            <div style={{color:CUR.echoes.color,fontSize:10,fontWeight:"bold"}}>{up.name} <span style={{color:"#667788",fontSize:8}}>Tier 1: {up.max} levels</span></div>
            <div style={{color:"#8899aa",fontSize:9}}>{up.desc}</div>
            <div style={{color:"#667788",fontSize:8}}>First level: {up.base}⬢ · Tier 1 total: {tc}⬢</div>
          </div>);})}
      </CodexSec>

      <CodexSec id="metaab" title={"META ABILITY UPGRADES"} color="#44ddcc">
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
            <span style={{color:"#778899"}}>Sub 1:</span> {AB_DESCS[ab.id+"_sub1"]||"???"}<br/>
            <span style={{color:"#778899"}}>Sub 2:</span> {AB_DESCS[ab.id+"_sub2"]||"???"}<br/>
            <span style={{color:"#ffcc44"}}>Mastery:</span> {AB_DESCS[ab.id+"_mastery"]||"???"}
          </div>
        </div>)}
        </div>
      </CodexSec>

      <CodexSec id="labs" title={"META LAB UPGRADES"} color="#44ccaa">
        <div style={{color:"#8899aa",fontSize:11,lineHeight:1.6,marginBottom:6}}>Labs let you research upgrades over multiple waves. Progress carries across runs.</div>
        {LAB_UPGRADES.map(lab=>{const curLvl=meta.lab?.completed?.[lab.id]||0;return(
          <div key={lab.id} style={{padding:"6px 0",borderBottom:"1px solid #1a1a2e"}}>
            <div style={{color:"#44ccaa",fontSize:12,fontWeight:"bold"}}>{lab.name} <span style={{color:"#667788",fontSize:10}}>· Min wave: {lab.minWave} · Current: Lv{curLvl}/{lab.levels.length}</span></div>
            <div style={{color:"#8899aa",fontSize:10,marginTop:2}}>{lab.desc}</div>
            <div style={{marginTop:4,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:3}}>
              {lab.levels.map((lv,li)=>{const done=curLvl>li;const _lVal=(()=>{if(lab.id==="intro_sprint")return `${lv.pct}%`;if(lab.id==="sprint_efficiency")return `${lv.pct}%`;if(lab.id==="cheaper_respec")return `-${lv.reduce}⬢`;if(lab.id==="phantom_enhance")return `+${((li+1)*0.1).toFixed(1)}%`;if(lab.id==="practise_enhance")return `+${((li+1)*0.8).toFixed(1)}%`;if(lab.id==="diffusion_chance")return `${lv.pct}%`;if(lab.id==="diffusion_multi")return `+${((li+1)*1.2).toFixed(1)}%`;return "";})();return(
                <div key={li} style={{fontSize:9,padding:"2px 4px",background:done?"#0a1a1a":"#08080f",border:"1px solid "+(done?"#44ccaa33":"#22223322"),borderRadius:2,textAlign:"center"}}>
                  <span style={{color:done?"#44ccaa":"#667788"}}>Lv{li+1}</span> <span style={{color:"#556677"}}>{lv.waves}w</span>{_lVal&&<span style={{color:done?"#88ddaa":"#778899",fontSize:8}}> {_lVal}</span>}
                </div>);})}
            </div>
          </div>);})}
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
    <div style={{width:"100%",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",fontFamily:"'Courier New', monospace",position:"relative",background:"#06060e"}}>
      <div style={{position:"absolute",inset:0,zIndex:0}} ref={(el)=>{if(el){const bgId=meta.bgDesign||"void";const bg=BG_DESIGNS.find(b=>b.id===bgId)||BG_DESIGNS[0];el.style.cssText=`position:absolute;inset:0;z-index:0;${bg.css}`;}}} />      <style>{`
        .vs-scroll::-webkit-scrollbar{width:5px;}
        .vs-scroll::-webkit-scrollbar-track{background:#0a0a14;}
        .vs-scroll::-webkit-scrollbar-thumb{background:#1a1a3a;border-radius:4px;}
        .vs-scroll::-webkit-scrollbar-thumb:hover{background:#2a2a5a;}
        .vs-scroll{scrollbar-width:thin;scrollbar-color:#1a1a3a #0a0a14;}
        @keyframes goldShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes auroraShift{0%{filter:hue-rotate(0deg) brightness(1)}50%{filter:hue-rotate(20deg) brightness(1.15)}100%{filter:hue-rotate(-15deg) brightness(0.9)}}
        @keyframes starDrift{0%{background-position:0% 0%}100%{background-position:100% 100%}}
        @keyframes nebulaPulse{0%{filter:brightness(0.9) hue-rotate(0deg)}100%{filter:brightness(1.2) hue-rotate(10deg)}}
        @keyframes gridScroll{0%{background-position:0 0}100%{background-position:40px 40px}}
        @keyframes hexDrift{0%{background-position:0 0}100%{background-position:56px 98px}}
        @keyframes deepPulse{0%{filter:brightness(0.85)}50%{filter:brightness(1.15) saturate(1.2)}100%{filter:brightness(0.85)}}
        @keyframes circuitPulse{0%{filter:brightness(0.9)}100%{filter:brightness(1.3)}}
        @keyframes emberGlow{0%{filter:brightness(0.8) saturate(0.8)}100%{filter:brightness(1.3) saturate(1.4)}}
        @keyframes pulseExpand{0%{background-size:100% 100%}50%{background-size:200% 200%}100%{background-size:100% 100%}}
        @keyframes fadeSlideIn{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
        @keyframes pulseGlow{0%,100%{text-shadow:0 0 30px #00e5ff88}50%{text-shadow:0 0 50px #00e5ffcc,0 0 80px #00e5ff44}}
        .vs-fade-in{animation:fadeSlideIn 0.25s ease-out both}
        .vs-fade{animation:fadeIn 0.2s ease-out both}
        .vs-title-glow{animation:pulseGlow 4s ease-in-out infinite}
        .gold-shimmer{position:absolute;inset:0;border-radius:3px;background:linear-gradient(105deg,transparent 30%,rgba(255,204,68,0.06) 45%,rgba(255,204,68,0.12) 50%,rgba(255,204,68,0.06) 55%,transparent 70%);background-size:200% 100%;animation:goldShimmer 4s ease-in-out infinite;pointer-events:none;z-index:0;}
      `}</style>      <div style={{position:"relative",width:GW*sc2,height:GH*sc2,border:meta.showBorder!==false?"1px solid #2a2a3a":"none",zIndex:1}}>
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
        {tutStep===11&&phase==="metashop"&&metaTab==="abilities"&&<TutPopup title="ABILITY SHARDS" btnText="ONE MORE THING" onBtn={()=>{setTutStep(12);setPhase("settings");}}>
          Each ability has <b style={{color:"#44ddcc"}}>sub-upgrades</b> and a <b style={{color:"#ffcc44"}}>mastery</b>.<br/>
          You buy <b style={{color:"#44ddcc"}}>◈ Ability Shards</b> with Echoes, then spend shards to unlock upgrades.<br/><br/>
          These are permanent — once bought, they apply to every run where you pick that ability.<br/><br/>
          You'll need more Echoes before you can afford one. Keep pushing deeper!
        </TutPopup>}
        {tutStep===12&&phase==="settings"&&<TutPopup title="CLOUD SYNC" btnText="FINISH TUTORIAL" onBtn={()=>setTutStep(0)}>
          One last thing — you can <b style={{color:"#44ccaa"}}>sync your progress</b> across devices!<br/><br/>
          In <b style={{color:"#ccddee"}}>Settings → Cloud Sync</b>, enter any <b style={{color:"#44ccaa"}}>4-digit code</b> to create your save file.<br/><br/>
          Use the same code on another device to pick up where you left off. Your data saves automatically every 2 minutes and on every death.<br/><br/>
          <b style={{color:"#ccddee"}}>Good luck out there, pilot.</b>
        </TutPopup>}

        {paused&&phase==="playing"&&!showWiki&&(
          <div className="vs-scroll vs-fade" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(6,6,14,0.88)",zIndex:15,overflow:"auto",padding:"20px 0"}}>
            <h2 style={{color:"#ccddee",fontSize:20,letterSpacing:4,margin:0}}>PAUSED</h2>
            {(()=>{const _mr=metaRef.current;const _t=_mr.metaTier||1;if(_t<2)return null;const _phW=_mr.phantomHighWave||0;const _prW=_mr.practiseHighWave||0;const _phL=(_mr.lab?.completed?.phantom_enhance||0)*0.001;const _prL=(_mr.lab?.completed?.practise_enhance||0)*0.008;const _tv=_t===3?2.5:_t===2?1.5:1;const _enf2=_t>=2?1+(_mr.enforcerKills||0)*0.025:1;const _em=_tv*(_t>=2?(1+_phW*(0.01+_phL)):1)*(_t>=2?(1+_prW*(0.006+_prL)):1)*_enf2;return(
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6}}>
                <span style={{color:"#ffcc44",fontSize:10,fontFamily:"monospace"}}>Echo ×{_em.toFixed(3)}</span>
                <div onClick={()=>setHeInfoId(heInfoId==="pause_echo"?null:"pause_echo")} style={{width:13,height:13,borderRadius:"50%",border:"1px solid #ffcc4466",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#ffcc4488",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#ffcc44"} onMouseOut={e=>e.currentTarget.style.color="#ffcc4488"}>?</div>
              </div>);})()}
            {heInfoId==="pause_echo"&&(()=>{const _mr2=metaRef.current;const _t2=_mr2.metaTier||1;const _phW2=_mr2.phantomHighWave||0;const _prW2=_mr2.practiseHighWave||0;const _phL2=(_mr2.lab?.completed?.phantom_enhance||0)*0.001;const _prL2=(_mr2.lab?.completed?.practise_enhance||0)*0.008;const _phV2=1+_phW2*(0.01+_phL2);const _prV2=1+_prW2*(0.006+_prL2);const _pMults=[{name:"Tier Bonus",color:"#bb99ff",val:_t2===3?2.5:_t2===2?1.5:1},{name:"Phantom",color:"#cc66cc",val:_t2>=2?_phV2:1},{name:"Practise",color:"#cc9966",val:_t2>=2?_prV2:1},{name:"Enforcer",color:"#ff5577",val:_t2>=2?1+(_mr2.enforcerKills||0)*0.025:1},{name:"Diffusion",color:"#44ddcc",val:1}];const _pTot=_pMults.reduce((a,m)=>a*m.val,1);return(
              <div onClick={()=>setHeInfoId(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"1px solid #ffcc4433",borderRadius:6,padding:"16px 14px",maxWidth:340,width:"100%"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{color:"#ffcc44",fontSize:15,fontWeight:"bold",letterSpacing:2}}>HYPERECHO</div>
                    <button onClick={()=>setHeInfoId(null)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {_pMults.map(m=><div key={m.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0"}}><div style={{color:m.color,fontSize:12,fontWeight:"bold"}}>{m.name}</div><div style={{color:"#ccddee",fontSize:16,fontWeight:"bold",fontFamily:"monospace"}}>×{m.val.toFixed(3)}</div></div>)}
                  </div>
                  {gsRef.current?._diffuseMult>1&&<div style={{borderTop:"1px solid #22334444",marginTop:8,paddingTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:"#bb77ff",fontSize:11,fontWeight:"bold"}}>Diffuse (this run)</div><div style={{color:"#ccddee",fontSize:14,fontFamily:"monospace"}}>×{gsRef.current._diffuseMult.toFixed(3)}</div></div>}
                  <div style={{borderTop:"1px solid #44556644",marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:"#ffcc44",fontSize:13,fontWeight:"bold"}}>TOTAL</div><div style={{color:"#ffcc44",fontSize:22,fontWeight:"bold",fontFamily:"monospace"}}>×{_pTot.toFixed(3)}</div></div>
                </div>
              </div>);})()}
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
              <button onClick={()=>{setShowWiki(true);setCodexOpen({controls:false,mechanics:false,currencies:false,enemies:false,abilities:false,scrap:false,cores:false,plasma:false,meta:false,metaab:false,labs:false})}} style={{...bs2("#55667744"),padding:"8px 20px",fontSize:12,borderWidth:1,color:"#8899aa"}}>CODEX</button>
              <button onClick={()=>{_returnToPauseRef.current=true;pausedRef.current=false;setPhase("settings");}} style={{...bs2("#55667744"),padding:"8px 20px",fontSize:12,borderWidth:1,color:"#8899aa"}}>SETTINGS</button>
            </div>

            {(gsRef.current?.isPlayground||gsRef.current?.isNewMode)?<button onClick={forfeit} style={{background:"none",border:"none",color:"#554444",fontSize:9,cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",marginTop:8}}>EXIT TO MENU</button>
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
            <div style={{color:"#556677",fontSize:8,marginTop:4,cursor:"pointer",zIndex:2,position:"relative"}} onClick={()=>setShowStats(p=>!p)}>{showStats?"▲ hide stats":"▼ tap ship for stats"}</div>
            {showStats&&<div style={{zIndex:2,position:"relative",marginTop:2}}><ShipStats metaData={meta} gsData={null} homeMode /></div>}

            {meta.echoes>0&&<p style={{color:CUR.echoes.color,fontSize:13,marginTop:8,zIndex:1,position:"relative"}}>⬢ {meta.echoes} Echoes</p>}
            {meta.highWave>0&&<p style={{color:"#667788",fontSize:10,marginTop:meta.echoes>0?2:8,zIndex:1,position:"relative"}}>Best: <span style={{color:"#ccddee"}}>Wave {meta.highWave}</span></p>}
            {meta.highWave>0&&(()=>{const _isUnlocked=(meta.lab?.completed?.intro_sprint||0)>0;const _isOn=_isUnlocked&&!meta.introSprintOff;return(
              <div style={{marginTop:4,zIndex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:_isUnlocked?1:0.35}}>
                <div onClick={_isUnlocked?()=>setMeta(prev=>{const nx={...prev,introSprintOff:!prev.introSprintOff};saveMeta(nx);return nx;}):undefined} style={{width:26,height:13,borderRadius:7,background:_isOn?"#44ccaa22":"#1a1a2e",border:"1px solid "+(_isOn?"#44ccaa66":"#33445566"),position:"relative",transition:"all 0.2s",flexShrink:0,cursor:_isUnlocked?"pointer":"default"}}>
                  <div style={{width:9,height:9,borderRadius:5,background:_isOn?"#44ccaa":"#556677",position:"absolute",top:1,left:_isOn?15:1,transition:"all 0.2s"}} />
                </div>
                <span style={{fontSize:8,color:_isUnlocked?(_isOn?"#88ccaa":"#778899"):"#556677",display:"inline-block",width:48,textAlign:"left"}}>{!_isUnlocked?"🔒 ":""}Sprint{_isUnlocked?(_isOn?" ON":" OFF"):""}</span>
                {_isUnlocked&&<div onClick={()=>setSprintInfo(true)} style={{width:13,height:13,borderRadius:"50%",border:"1px solid #44667788",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#667788",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#88aacc"} onMouseOut={e=>e.currentTarget.style.color="#667788"}>i</div>}
              </div>);})()}
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,zIndex:1,position:"relative"}}><div style={{width:8,height:8,borderRadius:"50%",background:syncCode?"#44ff88":"#ff4455",flexShrink:0}} /><span style={{fontSize:8,color:syncCode?"#88ccaa":"#cc6666"}}>{syncCode?"Progress synced":"Progress not synced"}</span></div>
            <button onClick={()=>initGame()} style={{...bs2("#00e5ff"),marginTop:8,padding:"12px 40px",fontSize:16,zIndex:1,position:"relative"}} {...hv("#00e5ff")}>LAUNCH</button>
            {sprintInfo&&(()=>{const _isLvl=(meta.lab?.completed?.intro_sprint||0);const _isPct=_isLvl>0?[10,20,30,40,50][Math.min(_isLvl-1,4)]:0;const _isMax=meta.highWave||0;const _dur=Math.floor(_isMax*_isPct/100);const _seLvl=meta.lab?.completed?.sprint_efficiency||0;const _sePct=_seLvl>0?[40,50,60,70,80][Math.min(_seLvl-1,4)]:30;return(
              <div onClick={()=>setSprintInfo(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
                <div onClick={e=>e.stopPropagation()} style={{background:"#0c0c1a",border:"1px solid #44ccaa44",borderRadius:6,padding:"14px 16px",maxWidth:320,width:"100%"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{color:"#44ccaa",fontSize:13,fontWeight:"bold"}}>INTRO SPRINT</div>
                    <button onClick={()=>setSprintInfo(false)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
                  </div>
                  <div style={{color:"#99aabb",fontSize:10,lineHeight:1.6}}>
                    Sprint skips the first <span style={{color:"#44ccaa"}}>{_isPct}%</span> of your best wave (<span style={{color:"#44ccaa"}}>{_isMax}</span>), auto-progressing through <span style={{color:"#44ccaa"}}>{_dur} waves</span>.<br/><br/>
                    <span style={{color:"#bbccdd"}}>Lab Efficiency:</span> Each sprint wave has a <span style={{color:"#44ccaa"}}>{_sePct}%</span> chance of contributing progress to active labs.{_seLvl>0?` (Level ${_seLvl})`:""}
                  </div>
                </div>
              </div>);})()}
            {showTutPrompt&&<TutPopup title="FIRST TIME?" btnText="START TUTORIAL" onBtn={()=>initTutorial()}>
              Welcome to Void Storm! Would you like a guided tutorial?<br/>You'll play through 5 waves and learn the basics.<br/><br/>
              <span style={{color:"#667788",fontSize:9,cursor:"pointer"}} onClick={(e)=>{e.stopPropagation();setShowTutPrompt(false);}}>No thanks, I'll figure it out →</span>
            </TutPopup>}
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap",justifyContent:"center",zIndex:1,position:"relative"}}>
              <button onClick={()=>setPhase("metashop")} style={{...bs2("#bb77ff44"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#bb99ff"}}>META</button>
              <button onClick={()=>setPhase("phantom_info")} style={{...bs2("#ff44ff33"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#cc66cc"}}>PHANTOM</button>
              <button onClick={()=>{setEnforcerMode(false);setPhase("playground");}} style={{...bs2("#44ccaa33"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#55aa88"}}>PLAYGROUND</button>
              <button onClick={()=>setPhase("practise")} style={{...bs2("#cc884433"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#cc9966"}}>PRACTISE</button>
            </div>
            <div style={{display:"flex",gap:8,marginTop:6,justifyContent:"center",zIndex:1,position:"relative"}}>
              <button onClick={()=>{setShowWiki(true);setCodexOpen({controls:false,mechanics:false,currencies:false,enemies:false,abilities:false,scrap:false,cores:false,plasma:false,meta:false,metaab:false,labs:false})}} style={{...bs2("#44aacc33"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#66bbcc"}}>CODEX</button>
              <button onClick={()=>{setHistoryMode("waves");setPhase("history");}} style={{...bs2("#ff884466"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#ffaa66"}}>HISTORY</button>
              {<button onClick={()=>setPhase("hyperecho")} style={{...bs2("#ffcc4433"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#ffcc44"}}>HYPERECHO</button>}
              <button onClick={()=>setPhase("settings")} style={{...bs2("#55667744"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#778899"}}>SETTINGS</button>
            </div>

          </div>
        )}

        {phase==="phantom_info"&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"#06060e",zIndex:10,overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><SubMenuBG/></div>
            <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}>
            <h2 style={{color:"#cc66cc",fontSize:18,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>PHANTOM</h2>
            <div style={{color:"#ddeeff",fontSize:10,marginTop:12,textAlign:"center",lineHeight:1.8,maxWidth:400,zIndex:1,position:"relative"}}>
              <div style={{color:"#cc66cc",fontSize:12,fontWeight:"bold",marginBottom:8}}>Your ship cannot fire.</div>
              Your main gun is disabled. You must rely entirely on your abilities to deal damage.<br/><br/>
              <b style={{color:"#ccddee"}}>First ability</b> — choose from Echo Clone, Combat Drone, or Seeker Swarm.<br/>
              <b style={{color:"#ccddee"}}>Subsequent abilities</b> — random selection every <b style={{color:"#ffcc44"}}>2 waves</b> (instead of 3).<br/><br/>
              <b style={{color:"#cc6666"}}>No currency drops</b> — enemies drop nothing.<br/>
              <b style={{color:"#cc6666"}}>No upgrades</b> — the wave upgrade shop is skipped.<br/>
              <b style={{color:"#cc6666"}}>No echoes</b> — this mode does not earn permanent currency.<br/><br/>
              
            </div>
            <div style={{display:"flex",gap:10,marginTop:20,zIndex:1,position:"relative"}}>
              <button onClick={()=>initNewMode()} style={bs2("#cc66cc")} {...hv("#cc66cc")}>ENTER THE VOID</button>
              <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),borderWidth:1,color:"#8899aa"}}>← BACK</button>
            </div>
          </div></div>
        )}

        {phase==="ability"&&(
          <div className="vs-fade" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(6,6,14,0.92)",zIndex:10}}>
            {gsRef.current?._sprintedWaves>0&&<div style={{color:"#44ccaa",fontSize:22,fontWeight:"bold",letterSpacing:5,marginBottom:8,textShadow:"0 0 12px #44ccaa44"}}>INTRO SPRINT OVER</div>}
            <h2 style={{color:"#ffcc44",fontSize:18,letterSpacing:4,margin:0}}>CHOOSE AN ABILITY</h2>
            <p style={{color:"#778899",fontSize:10,marginTop:5,marginBottom:14}}>Permanent for this run</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:600,padding:"0 10px"}}>
              {(()=>{const _dcLvl=meta.lab?.completed?.diffusion_chance||0;const _dcPct=_dcLvl>0?_dcLvl*10:0;const _dmLvl=meta.lab?.completed?.diffusion_multi||0;const _dmBonus=0.05+_dmLvl*0.012;const _showDiffuse=!gsRef.current?.isTutorial&&!gsRef.current?.isNewMode&&!gsRef.current?.isPlayground&&(meta.metaTier||1)>=2&&_dcPct>0&&Math.random()*100<_dcPct;return null;})()}
              {abChoices.map(ab=>(
                <button key={ab.id} onClick={()=>pickAb(ab.id)} style={{width:148,padding:"12px 8px",background:"#0c0c1a",border:"2px solid #ffcc4433",borderRadius:5,cursor:"pointer",textAlign:"center",fontFamily:"inherit",transition:"all 0.2s",position:"relative"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor="#ffcc44"} onMouseOut={e=>e.currentTarget.style.borderColor="#ffcc4433"}>
                  {(()=>{const _au=meta.abUpgrades||{};const _s1=!!_au[ab.id+"_sub1"];const _s2=!!_au[ab.id+"_sub2"];const _m=!!_au[ab.id+"_mastery"];if(!_s1&&!_s2&&!_m)return null;return <div style={{position:"absolute",top:3,right:3,display:"flex",gap:2}}>{_s1&&<div style={{width:11,height:11,borderRadius:2,background:"#44ddcc22",border:"1px solid #44ddcc66",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:"#44ddcc",fontWeight:"bold",lineHeight:1}}>1</div>}{_s2&&<div style={{width:11,height:11,borderRadius:2,background:"#44ddcc22",border:"1px solid #44ddcc66",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:"#44ddcc",fontWeight:"bold",lineHeight:1}}>2</div>}{_m&&<div style={{width:11,height:11,borderRadius:2,background:"#ffcc4422",border:"1px solid #ffcc4466",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:"#ffcc44",fontWeight:"bold",lineHeight:1}}>★</div>}</div>;})()}
                  <div style={{display:"flex",justifyContent:"center",marginBottom:4}}><AbilityIcon id={ab.id} size={28} color="#ffcc44" /></div>
                  <div style={{color:"#ffcc44",fontSize:11,fontWeight:"bold",marginBottom:3}}>{ab.name}</div>
                  <div style={{color:"#99aabb",fontSize:8,lineHeight:1.3}}>{ab.desc}</div>
                </button>
              ))}
            </div>
            {(()=>{const _dcLvl2=meta.lab?.completed?.diffusion_chance||0;const _dcPct2=_dcLvl2>0?_dcLvl2*10:0;const _dmLvl2=meta.lab?.completed?.diffusion_multi||0;const _dmBonus2=0.05+_dmLvl2*0.012;const _showD2=!gsRef.current?.isTutorial&&!gsRef.current?.isNewMode&&!gsRef.current?.isPlayground&&(meta.metaTier||1)>=2&&_dcPct2>0&&Math.random()*100<_dcPct2;return _showD2?<div style={{display:"flex",justifyContent:"center",marginTop:10}}><button onClick={()=>{const gs=gsRef.current;if(!gs)return;gs._diffuseCount++;gs._diffuseMult+=_dmBonus2;if(gs._pAb>0){gs._pAb--;offerAb(gs);}else if(gs.isNewMode){setPhase("playing");startWave(gs);}else if(gs.isPractise||gs.wave===0){const _dSLvl=metaRef.current.lab?.completed?.intro_sprint||0;const _dSPct=_dSLvl>0?[10,20,30,40,50][Math.min(_dSLvl-1,4)]:0;const _dSMax=metaRef.current.highWave||0;const _dSThr=Math.floor(_dSMax*_dSPct/100);const _dDoS=!gs.isPractise&&_dSPct>0&&!metaRef.current.introSprintOff&&_dSThr>0;setPhase("playing");startWave(gs,_dDoS);}else{setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}}} style={{width:148,padding:"12px 8px",background:"#12081e",border:"2px solid #bb77ff33",borderRadius:5,cursor:"pointer",textAlign:"center",fontFamily:"inherit",transition:"all 0.2s"}} onMouseOver={e=>e.currentTarget.style.borderColor="#bb77ff"} onMouseOut={e=>e.currentTarget.style.borderColor="#bb77ff33"}><div style={{fontSize:22,marginBottom:4,color:"#bb77ff"}}>⬢</div><div style={{color:"#bb77ff",fontSize:11,fontWeight:"bold",marginBottom:3}}>DIFFUSE</div><div style={{color:"#9988bb",fontSize:8,lineHeight:1.3}}>Skip this ability. Gain +{(_dmBonus2*100).toFixed(1)}% echo bonus this run.<br/><span style={{color:"#bb99ff"}}>Current: ×{gsRef.current?._diffuseMult?.toFixed(3)||"1.000"}</span></div></button></div>:null;})()}
          </div>
        )}

        {phase==="playground"&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"#06060e",zIndex:10,overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><SubMenuBG/></div>
            <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}><h2 style={{color:enforcerMode?"#ff5577":"#55aa88",fontSize:18,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>{enforcerMode?"ENFORCER":"PLAYGROUND"}</h2>
            <div style={{display:"flex",gap:0,marginTop:10,borderRadius:4,overflow:"hidden",border:"1px solid #33445544"}}>
              <button onClick={()=>setEnforcerMode(false)} style={{padding:"6px 16px",background:!enforcerMode?"#141428":"#0a0a16",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:10,color:!enforcerMode?"#55aa88":"#667788",borderRight:"1px solid #33445544"}}>PLAYGROUND</button>
              <button onClick={()=>setEnforcerMode(true)} style={{padding:"6px 16px",background:enforcerMode?"#1a1020":"#0a0a16",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:10,color:enforcerMode?"#ff5577":"#667788"}}>ENFORCER</button>
            </div>
            <p style={{color:"#ccddee",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.5}}>{enforcerMode?"Survive 60 seconds against an ultimate enemy. Any hit kills you instantly. You cannot damage them. Each victory adds +0.025 to your echo multiplier.":"Pick an enemy to fight. You'll face 1 solo, then 5 at once (boss: 1 only). Stats match the wave that enemy first appears. No drops, no upgrades, no echoes."}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14,width:"100%",maxWidth:480,position:"relative"}}>
              {Object.entries(ED).sort(([a],[b])=>(ENEMY_UNLOCK[a]||1)-(ENEMY_UNLOCK[b]||1)).map(([k,ed])=>{
                const w=ENEMY_UNLOCK[k]||1;
                const _enfDef=!!(meta.enforcerDefeated||{})[k];
                const _enfBest=(meta.enforcerBest||{})[k]||0;
                const _pgDone=!!(meta.pgCompleted||{})[k];
                const _enfLocked=enforcerMode&&!_pgDone;
                const _canPlay=enforcerMode?!_enfLocked:true;
                return(
                  <button key={k} onClick={()=>_canPlay&&startPlayground(k,enforcerMode)} disabled={!_canPlay}
                    style={{display:"flex",gap:10,alignItems:"center",padding:"10px",background:"#0a0a1a",border:`1px solid ${enforcerMode&&_enfDef?"#ffcc4444":"#22334444"}`,borderRadius:4,cursor:_canPlay?"pointer":"default",fontFamily:"inherit",textAlign:"left",transition:"all 0.2s",opacity:_enfLocked?0.4:1,position:"relative",overflow:"hidden"}}
                    onMouseOver={e=>_canPlay&&(e.currentTarget.style.borderColor=enforcerMode?"#ff5577":"#55aa88")} onMouseOut={e=>(e.currentTarget.style.borderColor=enforcerMode&&_enfDef?"#ffcc4444":"#22334444")}>
                    {enforcerMode&&_enfDef&&<div className="gold-shimmer"/>}
                    <EnemyIcon type={k} size={32} />
                    <div>
                      <div style={{color:"#ccddee",fontSize:11,fontWeight:"bold",textTransform:"capitalize"}}>{k}</div>
                      {enforcerMode?<div style={{color:_enfDef?"#ffcc44":_enfLocked?"#cc6666":"#aabbcc",fontSize:8}}>{_enfLocked?"Complete playground round first":_enfDef?"Enforcer defeated":`Longest survived: ${_enfBest}s`}</div>
                      :<div style={{color:"#aabbcc",fontSize:8}}>Wave {w} · HP×{ed.hpM} · DMG×{ed.dM}</div>}
                    </div>
                  </button>
                );
              })}
              <button onClick={()=>{const _bPgDone=!!(meta.pgCompleted||{}).boss;const _bCanPlay=enforcerMode?_bPgDone:true;if(_bCanPlay)startPlayground("boss",enforcerMode);}} disabled={enforcerMode&&!(meta.pgCompleted||{}).boss}
                style={{display:"flex",gap:10,alignItems:"center",padding:"10px",background:"#0a0a1a",border:`1px solid ${enforcerMode&&(meta.enforcerDefeated||{}).boss?"#ffcc4444":"#22334444"}`,borderRadius:4,cursor:enforcerMode&&!(meta.pgCompleted||{}).boss?"default":"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.2s",gridColumn:"1 / -1",opacity:enforcerMode&&!(meta.pgCompleted||{}).boss?0.4:1,position:"relative",overflow:"hidden"}}
                onMouseOver={e=>{const _bp2=enforcerMode&&!(meta.pgCompleted||{}).boss;if(!_bp2)e.currentTarget.style.borderColor=enforcerMode?"#ff5577":"#ff2266";}} onMouseOut={e=>(e.currentTarget.style.borderColor=enforcerMode&&(meta.enforcerDefeated||{}).boss?"#ffcc4444":"#22334444")}>
                {enforcerMode&&(meta.enforcerDefeated||{}).boss&&<div className="gold-shimmer"/>}
                <EnemyIcon type="boss" size={32} />
                <div>
                  <div style={{color:"#ff2266",fontSize:11,fontWeight:"bold"}}>Boss</div>
                  {enforcerMode?<div style={{color:(meta.enforcerDefeated||{}).boss?"#ffcc44":!(meta.pgCompleted||{}).boss?"#cc6666":"#aabbcc",fontSize:8}}>{!(meta.pgCompleted||{}).boss?"Complete playground round first":(meta.enforcerDefeated||{}).boss?"Enforcer defeated":`Longest survived: ${(meta.enforcerBest||{}).boss||0}s`}</div>
                  :<div style={{color:"#aabbcc",fontSize:8}}>Wave 5 · HP×18 · Solo only</div>}
                </div>
              </button>
              {enforcerMode&&(meta.metaTier||1)<2&&<div style={{position:"absolute",inset:0,background:"rgba(6,6,14,0.88)",zIndex:5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:6,pointerEvents:"all"}}>
              <div style={{fontSize:36,marginBottom:8}}>🔒</div>
              <div style={{color:"#8899aa",fontSize:12,fontWeight:"bold",letterSpacing:2,marginBottom:8}}>LOCKED</div>
              <div style={{color:"#667788",fontSize:10,textAlign:"center",maxWidth:260,lineHeight:1.6}}>Reach <span style={{color:"#bb99ff"}}>Meta Tier 2</span> to unlock Enforcer mode. Max all Ship Upgrades at Tier 1 first. Once maxed, you will be able to unlock tier 2 for <span style={{color:"#bb99ff"}}>⬢ 800</span>.</div>
            </div>}
            </div>
            <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),marginTop:16,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
          </div></div>
        )}

        {phase==="practise"&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"#06060e",zIndex:10,overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><SubMenuBG/></div>
            <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}><h2 style={{color:"#cc8844",fontSize:18,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>PRACTISE</h2>
            <p style={{color:"#ccddee",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.5}}>Play any wave with base stats. No drops, no upgrades, no echoes.<br/>Survive the full wave to win. Die and you'll return to the menu.</p>
            <div style={{display:"flex",alignItems:"center",gap:12,marginTop:18}}>
              <button onClick={()=>setPracticeWave(w=>Math.max(1,w-10))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12,borderRadius:3}}>−10</button>
              <button onClick={()=>setPracticeWave(w=>Math.max(1,w-1))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:14,borderRadius:3}}>−</button>
              <div style={{minWidth:80,textAlign:"center"}}><span style={{color:"#ccddee",fontSize:28,fontWeight:"bold"}}>{practiceWave}</span><div style={{color:"#aabbcc",fontSize:8,marginTop:2}}>WAVE</div></div>
              <button onClick={()=>setPracticeWave(w=>Math.min(200,w+1))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:14,borderRadius:3}}>+</button>
              <button onClick={()=>setPracticeWave(w=>Math.min(200,w+10))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12,borderRadius:3}}>+10</button>
            </div>
            <div style={{marginTop:14,padding:"8px 12px",background:"#0a0a1a",border:"1px solid #22334444",borderRadius:4,maxWidth:400,width:"100%"}}>
              <div style={{color:"#ccddee",fontSize:9,marginBottom:6}}>Enemies this wave:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {(()=>{const types=Object.entries(ENEMY_UNLOCK).filter(([k,w])=>w<=practiceWave&&k!=="boss").map(([k])=>k);
                  const isBoss=practiceWave%5===0;
                  return(<>{isBoss&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 6px",background:"#1a0a1a",borderRadius:3,border:"1px solid #ff226633"}}><EnemyIcon type="boss" size={18}/><span style={{color:"#ff2266",fontSize:8,fontWeight:"bold"}}>Boss</span></div>}
                    {types.map(k=><div key={k} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 6px",background:"#0c0c1a",borderRadius:3,border:"1px solid #22334444"}}><EnemyIcon type={k} size={16}/><span style={{color:"#ccddee",fontSize:8,textTransform:"capitalize"}}>{k}</span></div>)}
                    {types.length===0&&!isBoss&&<span style={{color:"#99aabb",fontSize:8}}>No enemies unlock at this wave</span>}</>);
                })()}
              </div>
              <div style={{color:"#aabbcc",fontSize:8,marginTop:6}}>
                {(()=>{const _eCount=4+Math.floor(practiceWave*1.0)+Math.floor(Math.pow(practiceWave,1.1)*0.25);const _rawHp=Math.round(BASE_HP*hpScale(practiceWave));const _rawDmg=Math.round((7+practiceWave*1.8)*dmgScale(practiceWave)*0.35);const _cumEchoes=(()=>{let totalK=0;for(let w2=1;w2<=practiceWave;w2++)totalK+=4+Math.floor(w2*1.0)+Math.floor(Math.pow(w2,1.1)*0.25);return Math.max(0,Math.floor(practiceWave*1.5+totalK*0.38+Math.pow(practiceWave,2.8)*0.065+Math.pow(practiceWave,1.8)*0.4));})();return <>Enemy HP scale: ×{hpScale(practiceWave).toFixed(1)} ({_rawHp}) · DMG scale: ×{dmgScale(practiceWave).toFixed(1)} ({_rawDmg}) · Count: {_eCount}<br/>Cumulative echoes through wave {practiceWave}: <span style={{color:CUR.echoes.color}}>⬢ {_cumEchoes.toLocaleString()}</span></>})()}
              </div>
            </div>
            <button onClick={()=>startPractise(practiceWave)} style={{...bs2("#cc8844"),marginTop:16,padding:"10px 32px",fontSize:14}} {...hv("#cc8844")}>PLAY WAVE {practiceWave}</button>
            <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),marginTop:10,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
          </div></div>
        )}

        {phase==="history"&&(()=>{
          let _hist=[];try{_hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");}catch(e){}
          const _filtered=historyHideForfeits?_hist.filter(r=>!r.forfeited):_hist;
          const _maxW=_filtered.length>0?Math.max(..._filtered.map(r=>historyMode==="echoes"?(r.echoes||0):r.wave)):1;
          const _totalRuns=_hist.length;const _totalKills=_hist.reduce((s,r)=>s+(r.kills||0),0);const _totalEchoes=_hist.reduce((s,r)=>s+(r.echoes||0),0);
          const _chartH=300;const _chartW=GW-80;
          const _barGap=_filtered.length>40?1:2;const _barW=_filtered.length>0?Math.max(2,Math.min(24,Math.floor((_chartW-(_filtered.length-1)*_barGap)/_filtered.length))):24;
          /* cumulative lifetime echoes from history order */
          const _cumEchoes=[];let _runCum=0;_hist.forEach(r=>{_runCum+=(r.echoes||0);_cumEchoes.push(_runCum);});
          /* trendline: simple moving average */
          const _trendWindow=Math.max(3,Math.floor(_filtered.length/8));
          const _trend=_filtered.map((_,i)=>{let s=0,c=0;for(let j=Math.max(0,i-_trendWindow+1);j<=i;j++){s+=(historyMode==="echoes"?(_filtered[j].echoes||0):_filtered[j].wave);c++;}return s/c;});
          return(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"#06060e",zIndex:10,overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><SubMenuBG/></div>
            <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}><h2 style={{color:"#99aacc",fontSize:18,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>PLAY HISTORY</h2>
            <div style={{color:"#aabbcc",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.6}}>
              Lifetime runs: <span style={{color:"#ccddee"}}>{_totalRuns}</span> · Lifetime kills: <span style={{color:"#ccddee"}}>{_totalKills.toLocaleString()}</span> · Lifetime echoes: <span style={{color:CUR.echoes.color}}>⬢ {_totalEchoes.toLocaleString()}</span>
            </div>
            <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
              <div style={{display:"flex",gap:0,borderRadius:4,overflow:"hidden",border:"1px solid #33445544"}}>
                <button onClick={()=>{setHistoryMode("waves");}} style={{padding:"5px 12px",background:historyMode==="waves"?"#141428":"#0a0a16",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:historyMode==="waves"?"#99aacc":"#667788"}}>Wave Reached</button>
                <button onClick={()=>{setHistoryMode("echoes");}} style={{padding:"5px 12px",background:historyMode==="echoes"?"#141428":"#0a0a16",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:historyMode==="echoes"?CUR.echoes.color:"#667788",borderLeft:"1px solid #33445544"}}>Echoes Earned</button>
              </div>
              <button onClick={()=>setHistoryHideForfeits(p=>!p)} style={{padding:"5px 10px",minWidth:120,background:historyHideForfeits?"#141428":"#0a0a16",border:`1px solid ${historyHideForfeits?"#44ccaa66":"#33445544"}`,borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:historyHideForfeits?"#88ccaa":"#667788",textAlign:"center"}}>{historyHideForfeits?"Forfeits hidden":"Showing all runs"}</button>
            </div>
            {_filtered.length===0?<div style={{color:"#99aabb",fontSize:11,marginTop:40}}>No runs recorded yet. Go die in the void!</div>:(
              <div style={{width:"100%",maxWidth:GW-20,marginTop:14}}>
                <div style={{color:"#99aabb",fontSize:8,textAlign:"center",marginBottom:6,minHeight:90}}>
                  {historyHover!==null&&_filtered[historyHover]?(()=>{const r=_filtered[historyHover];const d=new Date(r.date);const histIdx=_hist.indexOf(r);const cumE=histIdx>=0?_cumEchoes[histIdx]:0;return <div style={{color:"#aabbcc",fontSize:9,lineHeight:1.7,textAlign:"center"}}>
                    <span style={{color:"#ccddee",fontWeight:"bold"}}>Run #{histIdx+1}</span>{r.forfeited&&<span style={{color:"#cc8855"}}> (forfeited)</span>}<br/>
                    {d.toLocaleDateString()} {d.toLocaleTimeString()}<br/>
                    Max wave: <span style={{color:"#ccddee"}}>{r.wave}</span> · Killed by: <span style={{color:"#cc8899"}}>{r.cause}</span> · Kills: <span style={{color:"#ccddee"}}>{r.kills}</span><br/>
                    <span style={{color:CUR.scrap.color}}>⬡{r.totalScrap||r.scrap||0}</span> · <span style={{color:CUR.cores.color}}>◆{r.totalCores||r.cores||0}</span> · <span style={{color:CUR.plasma.color}}>✦{r.totalPlasma||r.plasma||0}</span> · <span style={{color:CUR.echoes.color}}>⬢+{r.echoes}</span><br/>
                    Lifetime echoes at this point: <span style={{color:CUR.echoes.color}}>⬢ {cumE.toLocaleString()}</span>
                  </div>})():<span>Hover over a bar for run details</span>}
                </div>
                <div style={{display:"flex"}}>
                  {/* Y-axis labels */}
                  <div style={{width:30,flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"space-between",paddingRight:4,height:_chartH}}>
                    <span style={{color:"#445566",fontSize:7,textAlign:"right"}}>{historyMode==="echoes"?"⬢":"W"}{historyMode==="echoes"?_maxW.toLocaleString():_maxW}</span>
                    {_maxW>2&&<span style={{color:"#334455",fontSize:7,textAlign:"right"}}>{historyMode==="echoes"?"⬢":"W"}{historyMode==="echoes"?Math.round(_maxW/2).toLocaleString():Math.round(_maxW/2)}</span>}
                    <span style={{color:"#445566",fontSize:7,textAlign:"right"}}>0</span>
                  </div>
                  {/* Chart area */}
                  <div style={{flex:1,position:"relative"}}>
                    <div onMouseLeave={()=>setHistoryHover(null)} style={{display:"flex",alignItems:"flex-end",gap:_barGap,height:_chartH,borderBottom:"1px solid #22334466",borderLeft:"1px solid #22334466",padding:"0 2px",overflow:"hidden",width:"100%"}}>
                      {_filtered.map((r,i)=>{const _bVal=historyMode==="echoes"?(r.echoes||0):r.wave;const h=Math.max(4,(_chartH-10)*(_bVal/_maxW));return <div key={i}
                        onMouseEnter={()=>setHistoryHover(i)} onMouseLeave={()=>{}}
                        style={{flex:"1 1 0",maxWidth:_barW,minWidth:2,height:h,background:r.forfeited?"#cc885566":"#00e5ff55",borderTop:historyHover===i?`1px solid ${r.forfeited?"#cc8855":"#00e5ff"}`:"1px solid transparent",borderLeft:historyHover===i?`1px solid ${r.forfeited?"#cc8855":"#00e5ff"}`:"1px solid transparent",borderRight:historyHover===i?`1px solid ${r.forfeited?"#cc8855":"#00e5ff"}`:"1px solid transparent",borderBottom:"none",borderRadius:"2px 2px 0 0",cursor:"pointer",transition:"border 0.1s"}} />})}
                    </div>
                    {/* Trendline overlay */}
                    {_filtered.length>=3&&<svg style={{position:"absolute",top:0,left:0,width:"100%",height:_chartH,pointerEvents:"none"}} viewBox={`0 0 1000 ${_chartH}`} preserveAspectRatio="none">
                      <polyline fill="none" stroke="#ffcc44" strokeWidth="2" strokeOpacity="0.5" strokeLinejoin="round" points={_trend.map((tw,i)=>{const x=(i+0.5)/_filtered.length*1000;const y=_chartH-(_chartH-10)*(tw/_maxW);return `${x},${y}`;}).join(" ")} />
                    </svg>}
                    {/* Midline guide */}
                    <div style={{position:"absolute",top:_chartH/2,left:0,right:0,borderTop:"1px dashed #22334433",pointerEvents:"none"}} />
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{color:"#445566",fontSize:7}}>Run 1</span><span style={{color:"#445566",fontSize:7}}>Run {_filtered.length}</span></div>
                  </div>
                </div>
                {_trend.length>0&&<div style={{color:"#ffcc4466",fontSize:7,textAlign:"center",marginTop:4}}>— trend ({_trendWindow}-run avg)</div>}
              </div>)}
            <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),marginTop:16,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
          </div></div>);})()}

        {phase==="hyperecho"&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"#06060e",zIndex:10,overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><SubMenuBG/></div>
            <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}>
            <h2 style={{color:"#ffcc44",fontSize:18,letterSpacing:3,margin:0}}>HYPERECHO</h2>
            <div style={{color:"#ccddee",fontSize:10,marginTop:8,textAlign:"center",lineHeight:1.6,maxWidth:380}}>Echo multipliers stack multiplicatively. Earn more echoes per run by unlocking multiplier sources.</div>
            <div style={{marginTop:20,width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:6,position:"relative"}}>
              {(()=>{const _tier=meta.metaTier||1;const _phW=meta.phantomHighWave||0;const _prW=meta.practiseHighWave||0;const _phLab=(meta.lab?.completed?.phantom_enhance||0)*0.001;const _prLab=(meta.lab?.completed?.practise_enhance||0)*0.008;const _phV=1+_phW*(0.01+_phLab);const _prV=1+_prW*(0.006+_prLab);const _mults=[{id:"tier",name:"Tier",desc:"",color:"#bb99ff",val:_tier===3?2.5:_tier===2?1.5:1},{id:"phantom",name:"Phantom",desc:`+${(0.01+_phLab).toFixed(3)} per phantom max wave (${_phW}).`,color:"#cc66cc",val:_tier>=2?_phV:1},{id:"practise",name:"Practise",desc:`+${(0.006+_prLab).toFixed(3)} per practise max wave (${_prW}).`,color:"#cc9966",val:_tier>=2?_prV:1},{id:"enforcer",name:"Enforcer",desc:"+0.025 per enforcer defeated in Playground. Survive 60 seconds against an ultimate enemy.",color:"#ff5577",val:_tier>=2?1+(meta.enforcerKills||0)*0.025:1},{id:"diffusion",name:"Diffusion",desc:"Not yet implemented as a persistent multiplier. Diffuse abilities in runs for per-run echo bonuses.",color:"#44ddcc",val:1}];const _total=_mults.reduce((a,m)=>a*m.val,1);return _mults.map(m=>(
                <div key={m.id} style={{padding:"6px 0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{color:m.color,fontSize:14,fontWeight:"bold"}}>{m.name}</div>
                      {m.desc&&<div onClick={(e)=>{e.stopPropagation();setHeInfoId(heInfoId===m.id?null:m.id);}} style={{width:14,height:14,borderRadius:7,border:"1px solid #44667744",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#667788"}}>?</div>}</div>
                    <div style={{color:"#ccddee",fontSize:18,fontWeight:"bold",fontFamily:"monospace",minWidth:70,textAlign:"right"}}>×{m.val.toFixed(3)}</div>
                  </div>
                  {heInfoId===m.id&&<div style={{color:"#8899aa",fontSize:8,marginTop:6,lineHeight:1.5,borderTop:"1px solid #22334444",paddingTop:4}}>{m.desc}</div>}
                </div>));})()}
              {(meta.metaTier||1)<2&&<div style={{position:"absolute",inset:0,background:"rgba(6,6,14,0.85)",zIndex:5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:6,pointerEvents:"all"}}>
              <div style={{fontSize:36,marginBottom:8}}>🔒</div>
              <div style={{color:"#8899aa",fontSize:12,fontWeight:"bold",letterSpacing:2,marginBottom:8}}>LOCKED</div>
              <div style={{color:"#667788",fontSize:10,textAlign:"center",maxWidth:260,lineHeight:1.6}}>Reach <span style={{color:"#bb99ff"}}>Meta Tier 2</span> to unlock HyperEcho multipliers. Max all Ship Upgrades at Tier 1 first. Once maxed, you will be able to unlock tier 2 for <span style={{color:"#bb99ff"}}>⬢ 800</span>.</div>
            </div>}
            </div>
            <div style={{width:"100%",maxWidth:360,borderTop:"1px solid #44556644",marginTop:14,paddingTop:12,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 12px 0"}}>
              <div style={{color:"#ffcc44",fontSize:16,fontWeight:"bold"}}>TOTAL MULTIPLIER</div>
              {(()=>{const _tier=meta.metaTier||1;const _phW2=meta.phantomHighWave||0;const _prW2=meta.practiseHighWave||0;const _phL2=(meta.lab?.completed?.phantom_enhance||0)*0.001;const _prL2=(meta.lab?.completed?.practise_enhance||0)*0.008;const _tv=_tier===3?2.5:_tier===2?1.5:1;const _enfK=meta.enforcerKills||0;const _total=_tv*(_tier>=2?(1+_phW2*(0.01+_phL2)):1)*(_tier>=2?(1+_prW2*(0.006+_prL2)):1)*(_tier>=2?1+_enfK*0.025:1)*1;return <div style={{color:"#ffcc44",fontSize:26,fontWeight:"bold",fontFamily:"monospace"}}>×{_total.toFixed(3)}</div>;})()}
            </div>
            <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),marginTop:20,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
            </div></div>
        )}

        {phase==="settings"&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"#06060e",zIndex:10,overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><SubMenuBG/></div>
            <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}><h2 style={{color:"#ccddee",fontSize:17,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>SETTINGS</h2>
            <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:"16px 0 8px"}}>CLOUD SYNC</h3>
            <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"center",maxWidth:300}}>
              {!syncCode?<>
                <input type="text" inputMode="numeric" maxLength={4} value={syncCodeInput} onChange={e=>setSyncCodeInput(e.target.value.replace(/\D/g,""))} placeholder="0000" style={{width:70,padding:"6px 8px",background:"#0a0a16",border:"1px solid #33445566",borderRadius:4,color:"#ccddee",fontSize:12,fontFamily:"monospace",textAlign:"center",letterSpacing:4,outline:"none"}} />
                <button onClick={()=>{const c=syncCodeInput;if(c.length!==4){setSyncStatus("error");return;}if(BLOCKED_CODES.has(c)){setSyncStatus("blocked");return;}if(!_SYNC_OK){setSyncStatus("noconfig");return;}setSyncStatus("syncing");fetch(SUPABASE_URL+"/rest/v1/saves?code=eq."+c+"&select=data,updated_at",{headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}).then(r=>r.json()).then(rows=>{const cd=rows.length>0&&rows[0].data?rows[0].data:null;const lm=meta;const lp=(lm.highWave||0)>0||(lm.echoes||0)>0||Object.keys(lm.levels||{}).length>0;if(cd&&cd.meta&&lp){let _llp=lm.savedAt||0;if(!_llp){try{const _lh=JSON.parse(localStorage.getItem("vs4-history")||"[]");if(_lh.length>0)_llp=_lh[_lh.length-1].date||0;}catch(_e2){}}const _clp=cd.meta.savedAt||(rows[0].updated_at?new Date(rows[0].updated_at).getTime():0);setSyncConflict({code:c,local:{savedAt:_llp,echoes:lm.echoes||0,highWave:lm.highWave||0,totalEchoesEarned:lm.totalEchoesEarned||0},cloud:{savedAt:_clp,echoes:cd.meta.echoes||0,highWave:cd.meta.highWave||0,totalEchoesEarned:cd.meta.totalEchoesEarned||0},cloudData:cd});setSyncStatus("conflict");}else if(cd&&cd.meta){localStorage.setItem("vs4-sync-code",c);setSyncCode(c);syncCodeRef.current=c;setMeta(cd.meta);try{localStorage.setItem("vs4-meta",JSON.stringify(cd.meta));}catch(e){}if(cd.history)try{localStorage.setItem("vs4-history",JSON.stringify(cd.history));}catch(e){}if(cd.tut)try{localStorage.setItem("vs4-tut",cd.tut);}catch(e){}setSyncStatus("synced");}else{localStorage.setItem("vs4-sync-code",c);setSyncCode(c);syncCodeRef.current=c;setSyncStatus("synced");const _ts3=Date.now();const _pushM={...lm,savedAt:_ts3};try{const h=localStorage.getItem("vs4-history")||"[]";const t=localStorage.getItem("vs4-tut")||"0";fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code:c,data:{meta:_pushM,history:JSON.parse(h),tut:t},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(e){}}}).catch(()=>setSyncStatus("error"));}} style={{padding:"6px 14px",background:"#141428",border:"1px solid #44ccaa66",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,color:"#88ccaa",letterSpacing:1}}>SYNC</button>
                <div onClick={()=>setShowSyncInfo(true)} style={{width:15,height:15,borderRadius:"50%",border:"1px solid #44ccaa44",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#44ccaa66",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#44ccaa"} onMouseOut={e=>e.currentTarget.style.color="#44ccaa66"}>?</div>
              </>:<>
                <span style={{color:"#44ccaa",fontSize:13,fontFamily:"monospace",letterSpacing:3}}>{syncCode}</span>
                <button onClick={()=>{setSyncCode(null);syncCodeRef.current=null;setSyncStatus("none");setSyncCodeInput("");try{localStorage.removeItem("vs4-sync-code");}catch(e){}}} style={{padding:"6px 14px",background:"#141428",border:"1px solid #ff334466",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,color:"#cc6666",letterSpacing:1}}>DISCONNECT</button>
                <div onClick={()=>setShowSyncInfo(true)} style={{width:15,height:15,borderRadius:"50%",border:"1px solid #44ccaa44",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#44ccaa66",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#44ccaa"} onMouseOut={e=>e.currentTarget.style.color="#44ccaa66"}>?</div>
              </>}
            </div>
            {syncStatus==="error"&&<div style={{color:"#cc5555",fontSize:8,marginTop:4}}>Sync failed. Check your connection.</div>}
            {syncStatus==="blocked"&&<div style={{color:"#cc8855",fontSize:8,marginTop:4}}>That code is too obvious. Try something less guessable.</div>}
            {syncStatus==="noconfig"&&<div style={{color:"#cc8855",fontSize:8,marginTop:4}}>Cloud sync not configured. See SUPABASE_URL in code.</div>}
            {syncStatus==="syncing"&&<div style={{color:"#44ccaa",fontSize:8,marginTop:4}}>Syncing...</div>}
            {syncStatus==="synced"&&syncCode&&<div style={{color:"#44ccaa88",fontSize:8,marginTop:4}}>Connected</div>}
            {syncStatus==="conflict"&&<div style={{color:"#ffcc44",fontSize:8,marginTop:4}}>Choose which save to keep below.</div>}
            {syncConflict&&(
              <div style={{marginTop:10,width:"100%",maxWidth:360}}>
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1,background:"#0a0a16",border:"1px solid #44ccaa44",borderRadius:6,padding:"12px 10px",textAlign:"center"}}>
                    <div style={{color:"#44ccaa",fontSize:11,fontWeight:"bold",letterSpacing:1,marginBottom:8}}>THIS DEVICE</div>
                    <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Last played</div>
                    <div style={{color:"#ccddee",fontSize:9,marginBottom:8,fontFamily:"monospace"}}>{syncConflict.local.savedAt?new Date(syncConflict.local.savedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Pre-update save"}</div>
                    <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Best wave</div>
                    <div style={{color:"#ccddee",fontSize:13,fontWeight:"bold",marginBottom:6}}>Wave {syncConflict.local.highWave||0}</div>
                    <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Echoes</div>
                    <div style={{color:"#bb77ff",fontSize:13,fontWeight:"bold",fontFamily:"monospace"}}>⬢ {syncConflict.local.echoes||0}</div>
                    <button onClick={()=>{const c=syncConflict.code;localStorage.setItem("vs4-sync-code",c);setSyncCode(c);syncCodeRef.current=c;setSyncConflict(null);setSyncStatus("synced");const _ts4=Date.now();const _pushM2={...meta,savedAt:_ts4};try{const h=localStorage.getItem("vs4-history")||"[]";const t=localStorage.getItem("vs4-tut")||"0";fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code:c,data:{meta:_pushM2,history:JSON.parse(h),tut:t},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(e){}}} style={{marginTop:10,padding:"6px 16px",background:"transparent",border:"1px solid #44ccaa66",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",letterSpacing:1,transition:"all 0.2s"}} onMouseOver={e=>{e.currentTarget.style.background="#44ccaa";e.currentTarget.style.color="#06060e";}} onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#88ccaa";}}>USE THIS</button>
                  </div>
                  <div style={{flex:1,background:"#0a0a16",border:"1px solid #bb77ff44",borderRadius:6,padding:"12px 10px",textAlign:"center"}}>
                    <div style={{color:"#bb77ff",fontSize:11,fontWeight:"bold",letterSpacing:1,marginBottom:8}}>CLOUD</div>
                    <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Last played</div>
                    <div style={{color:"#ccddee",fontSize:9,marginBottom:8,fontFamily:"monospace"}}>{syncConflict.cloud.savedAt?new Date(syncConflict.cloud.savedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Pre-update save"}</div>
                    <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Best wave</div>
                    <div style={{color:"#ccddee",fontSize:13,fontWeight:"bold",marginBottom:6}}>Wave {syncConflict.cloud.highWave||0}</div>
                    <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Echoes</div>
                    <div style={{color:"#bb77ff",fontSize:13,fontWeight:"bold",fontFamily:"monospace"}}>⬢ {syncConflict.cloud.echoes||0}</div>
                    <button onClick={()=>{const c=syncConflict.code;const cd=syncConflict.cloudData;localStorage.setItem("vs4-sync-code",c);setSyncCode(c);syncCodeRef.current=c;if(cd.meta){setMeta(cd.meta);try{localStorage.setItem("vs4-meta",JSON.stringify(cd.meta));}catch(e){}}if(cd.history)try{localStorage.setItem("vs4-history",JSON.stringify(cd.history));}catch(e){}if(cd.tut)try{localStorage.setItem("vs4-tut",cd.tut);}catch(e){}setSyncConflict(null);setSyncStatus("synced");}} style={{marginTop:10,padding:"6px 16px",background:"transparent",border:"1px solid #bb77ff66",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#bb99ff",letterSpacing:1,transition:"all 0.2s"}} onMouseOver={e=>{e.currentTarget.style.background="#bb77ff";e.currentTarget.style.color="#06060e";}} onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#bb99ff";}}>USE THIS</button>
                  </div>
                </div>
                <button onClick={()=>{setSyncConflict(null);setSyncStatus("none");setSyncCodeInput("");}} style={{marginTop:8,padding:"5px 12px",background:"none",border:"1px solid #33445544",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:8,color:"#667788",width:"100%"}}>CANCEL</button>
              </div>
            )}
            {showSyncInfo&&(
              <div onClick={()=>setShowSyncInfo(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:340,width:"100%"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{color:"#44ccaa",fontSize:14,fontWeight:"bold",letterSpacing:2}}>CLOUD SYNC</div>
                    <button onClick={()=>setShowSyncInfo(false)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
                  </div>
                  <div style={{color:"#99aabb",fontSize:10,lineHeight:1.7}}>
                    Your <b style={{color:"#ccddee"}}>4-digit code</b> is your account — no username or password needed. Just remember it.<br/><br/>
                    Enter the same code on any device to <b style={{color:"#44ccaa"}}>load your progress</b>. All meta upgrades, ability shards, echoes, lab progress, and run history are synced.<br/><br/>
                    Data saves <b style={{color:"#44ccaa"}}>automatically</b> every 2 minutes while playing and whenever you die or forfeit a run. When you switch devices, your latest save is loaded automatically.<br/><br/>
                    If both your device and the cloud have progress, you'll be asked to <b style={{color:"#ffcc44"}}>choose which save to keep</b> — nothing gets overwritten without your say-so.
                  </div>
                </div>
              </div>
            )}
            <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:"20px 0 8px"}}>CUSTOMISATION</h3>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:380}}>
              <button onClick={()=>setShowShipPopup(true)} style={{padding:"10px 14px",flex:1,minWidth:90,background:"#0a0a16",border:"1px solid #44ccaa44",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"space-between"}} onMouseOver={e=>e.currentTarget.style.borderColor="#44ccaa"} onMouseOut={e=>e.currentTarget.style.borderColor="#44ccaa44"}><span>Ship Colour</span><span style={{color:"#44ccaa44",fontSize:11}}>›</span></button>
              <button onClick={()=>setShowBulletPopup(true)} style={{padding:"10px 14px",flex:1,minWidth:90,background:"#0a0a16",border:"1px solid #44ccaa44",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"space-between"}} onMouseOver={e=>e.currentTarget.style.borderColor="#44ccaa"} onMouseOut={e=>e.currentTarget.style.borderColor="#44ccaa44"}><span>Bullet Colour</span><span style={{color:"#44ccaa44",fontSize:11}}>›</span></button>
              <button onClick={()=>setShowBgPopup(true)} style={{padding:"10px 14px",flex:1,minWidth:90,background:"#0a0a16",border:"1px solid #44ccaa44",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"space-between"}} onMouseOver={e=>e.currentTarget.style.borderColor="#44ccaa"} onMouseOut={e=>e.currentTarget.style.borderColor="#44ccaa44"}><span>Background</span><span style={{color:"#44ccaa44",fontSize:11}}>›</span></button>
            </div>
            <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:"20px 0 8px"}}>MOBILE CONTROLS</h3>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:380}}>
              {[{id:"reactive",label:"Reactive Joystick"},{id:"stationary",label:"Stationary Joystick"},{id:"arrows",label:"On-Screen Arrows"}].map(mc=>{
                const sel=(meta.mobileControls||"reactive")===mc.id;
                return <button key={mc.id} onClick={()=>setMeta(prev=>{const nx={...prev,mobileControls:mc.id};saveMeta(nx);return nx;})}
                  style={{padding:"8px 10px",flex:1,minWidth:100,background:sel?"#141428":"#0a0a16",border:`1px solid ${sel?"#44ccaa66":"#33445544"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:sel?"#88ccaa":"#667788",textAlign:"center"}}>
                  {mc.label}
                </button>;
              })}
            </div>
            <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:"20px 0 8px"}}>GAMEPLAY</h3>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:380}}>
              {[
                {key:"showNewEnemy",label:"New enemy alerts",get:()=>meta.showNewEnemy!==false,toggle:()=>setMeta(prev=>{const nx={...prev,showNewEnemy:prev.showNewEnemy===false?true:false};saveMeta(nx);return nx;})},
                {key:"labAlertFreq",skipSuffix:true,label:(()=>{const f=meta.labAlertFreq===undefined?5:meta.labAlertFreq;return f===0?"Lab alerts: OFF":`Lab alerts: Every ${f} wave${f>1?"s":""}`;})(),get:()=>(meta.labAlertFreq===undefined?5:meta.labAlertFreq)>0,toggle:()=>setMeta(prev=>{const f=prev.labAlertFreq===undefined?5:prev.labAlertFreq;const cycle={1:5,5:10,10:0,0:1};const nx={...prev,labAlertFreq:cycle[f]??5};saveMeta(nx);return nx;})},
                {key:"showHitText",label:"Hit numbers",get:()=>meta.showHitText!==false,toggle:()=>setMeta(prev=>{const nx={...prev,showHitText:prev.showHitText===false?true:false};saveMeta(nx);return nx;})},
                {key:"showMagnetRange",label:"Pickup range indicator",get:()=>!!meta.showMagnetRange,toggle:()=>setMeta(prev=>{const nx={...prev,showMagnetRange:!prev.showMagnetRange};saveMeta(nx);return nx;})},
                {key:"showFps",label:"FPS counter",get:()=>!!meta.showFps,toggle:()=>setMeta(prev=>{const nx={...prev,showFps:!prev.showFps};saveMeta(nx);return nx;})},
                {key:"showBorder",label:"Screen border",get:()=>meta.showBorder!==false,toggle:()=>setMeta(prev=>{const nx={...prev,showBorder:!prev.showBorder};saveMeta(nx);return nx;})},
              ].map(tog=>{const isOn=tog.get();return(
                <button key={tog.key} onClick={tog.toggle}
                  style={{padding:"8px 10px",width:"calc(50% - 3px)",boxSizing:"border-box",background:isOn?"#141428":"#0a0a16",border:`1px solid ${isOn?"#44ccaa66":"#33445544"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:isOn?"#88ccaa":"#667788",textAlign:"center"}}>
                  {tog.skipSuffix?tog.label:`${tog.label}: ${isOn?"ON":"OFF"}`}
                </button>);})}
            </div>
            
            <div style={{display:"flex",gap:10,marginTop:20}}>
              {!confirmReset
                ?<button onClick={()=>setConfirmReset(true)} style={{...bs2("#ff334433"),padding:"8px 20px",fontSize:11,borderWidth:1,color:"#886666"}}>RESET ALL PROGRESS</button>
                :<button onClick={()=>{const f={echoes:0,levels:{},shards:0,shardsBought:0,abUpgrades:{},shipColor:meta.shipColor||"cyan",bulletColor:meta.bulletColor,showNewEnemy:metaRef.current.showNewEnemy,showHitText:metaRef.current.showHitText,showMagnetRange:true,highWave:0};setMeta(f);saveMeta(f);try{localStorage.removeItem("vs4-history");localStorage.removeItem("vs4-tut");}catch(e){}setConfirmReset(false);setShowTutPrompt(true);}} style={{...bs2("#ff3344"),padding:"8px 20px",fontSize:11,borderWidth:1,color:"#ff4455"}}>ARE YOU SURE?</button>
              }
            </div>
            {confirmReset&&<div style={{color:"#cc8888",fontSize:8,marginTop:4}}>This will erase all Echoes, meta upgrades, ability shards, and ability upgrades permanently.</div>}
            <button onClick={()=>{if(_returnToPauseRef.current){pausedRef.current=true;setPaused(true);setPhase("playing");}else{setPhase("menu");}}} style={{...bs2("#55667744"),marginTop:20,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
          {showShipPopup&&(
            <div onClick={()=>setShowShipPopup(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
              <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:380,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{color:"#44ccaa",fontSize:15,fontWeight:"bold",letterSpacing:2}}>SHIP COLOUR</div>
                  <button onClick={()=>setShowShipPopup(false)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
                </div>
                <div style={{marginBottom:10,display:"flex",justifyContent:"center",pointerEvents:"none"}}><ShipDisplay onClick={()=>{}} size={64} /></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                  {SHIP_COLORS.map(sc=>{const sel=meta.shipColor===sc.id||(sc.id==="cyan"&&!meta.shipColor);return(
                    <button key={sc.id} onClick={()=>{setMeta(prev=>{const nx={...prev,shipColor:sc.id};saveMeta(nx);return nx;});}}
                      style={{padding:"10px 6px",background:sel?"#141428":"#0a0a16",border:`2px solid ${sel?sc.color:sc.color+"33"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s"}}
                      onMouseOver={e=>e.currentTarget.style.borderColor=sc.color} onMouseOut={e=>e.currentTarget.style.borderColor=sel?sc.color:sc.color+"33"}>
                      <div style={{width:20,height:20,margin:"0 auto 6px",background:sc.color,borderRadius:"50%",boxShadow:`0 0 8px ${sc.glow}66`}} />
                      <div style={{color:sel?sc.color:"#8899aa",fontSize:8,fontWeight:sel?"bold":"normal"}}>{sc.name}</div>
                    </button>);})}
                </div>
              </div>
            </div>
          )}
          {showBulletPopup&&(
            <div onClick={()=>setShowBulletPopup(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
              <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:380,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{color:"#44ccaa",fontSize:15,fontWeight:"bold",letterSpacing:2}}>BULLET COLOUR</div>
                  <button onClick={()=>setShowBulletPopup(false)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
                  {BULLET_COLORS.map(bc=>{const sel=meta.bulletColor===bc.id||(bc.id==="teal"&&(!meta.bulletColor||meta.bulletColor==="match"));const dispCol=bc.color;return(
                    <button key={bc.id} onClick={()=>{setMeta(prev=>{const nx={...prev,bulletColor:bc.id};saveMeta(nx);return nx;});}}
                      style={{padding:"8px 4px",background:sel?"#141428":"#0a0a16",border:`2px solid ${sel?dispCol:dispCol+"33"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s"}}
                      onMouseOver={e=>e.currentTarget.style.borderColor=dispCol} onMouseOut={e=>e.currentTarget.style.borderColor=sel?dispCol:dispCol+"33"}>
                      <div style={{width:14,height:14,margin:"0 auto 4px",background:dispCol,borderRadius:"50%",boxShadow:`0 0 6px ${dispCol}66`}} />
                      <div style={{color:sel?dispCol:"#8899aa",fontSize:7,fontWeight:sel?"bold":"normal"}}>{bc.name}</div>
                    </button>);})}
                </div>
              </div>
            </div>
          )}
          {showBgPopup&&(
            <div onClick={()=>setShowBgPopup(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
              <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:400,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{color:"#44ccaa",fontSize:15,fontWeight:"bold",letterSpacing:2}}>BACKGROUND</div>
                  <button onClick={()=>setShowBgPopup(false)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
                  {BG_DESIGNS.map(bg=>{const sel=(meta.bgDesign||"void")===bg.id;return(
                    <button key={bg.id} onClick={()=>setMeta(prev=>{const nx={...prev,bgDesign:bg.id};saveMeta(nx);return nx;})}
                      style={{padding:"8px 6px",background:sel?"#0a1a1a":"#08080f",border:`2px solid ${sel?"#44ddcc":"#22334433"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s",overflow:"hidden"}}
                      onMouseOver={e=>!sel&&(e.currentTarget.style.borderColor="#44ddcc66")} onMouseOut={e=>!sel&&(e.currentTarget.style.borderColor="#22334433")}>
                      <div style={{width:"100%",height:32,borderRadius:3,marginBottom:4,border:"1px solid #1a1a2e"}} ref={el=>{if(el)el.style.cssText=`width:100%;height:32px;border-radius:3px;margin-bottom:4px;border:1px solid #1a1a2e;${bg.css}`;}} />
                      <div style={{color:sel?"#44ddcc":"#ccddee",fontSize:8,fontWeight:sel?"bold":"normal"}}>{bg.name}</div>
                    </button>);})}
                </div>
              </div>
            </div>
          )}
          </div></div>
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
                <button onClick={()=>{setShowAnalyser(false);setShowRegenAnalyser(false);setShowPainAnalyser(false);setShowStats(p=>!p);}} style={{background:"none",border:"1px solid #334455",color:showStats?"#4488ff":"#778899",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9}}>SHIP</button>
                <button onClick={()=>{setShowStats(false);setShowRegenAnalyser(false);setShowPainAnalyser(false);setShowAnalyser(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:showAnalyser?"#ff8866":"#778899"}}>DMG</button>
                <button onClick={()=>{setShowStats(false);setShowAnalyser(false);setShowPainAnalyser(false);setShowRegenAnalyser(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:showRegenAnalyser?"#44ff88":"#778899"}}>REGEN</button>
                <button onClick={()=>{setShowStats(false);setShowAnalyser(false);setShowRegenAnalyser(false);setShowPainAnalyser(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:showPainAnalyser?"#ff4466":"#778899"}}>PAIN</button>
                <button onClick={()=>{setShowWiki(true);setCodexOpen({controls:false,mechanics:false,currencies:false,enemies:false,abilities:false,scrap:false,cores:false,plasma:false,meta:false,metaab:false,labs:false})}} style={{background:"none",border:"1px solid #334455",color:"#778899",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9}}>CODEX</button>
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
            {showPainAnalyser&&(()=>{const gs=gsRef.current;if(!gs)return null;
              const mkPainRows=(hpData,shData,label)=>{const allSrcs=new Set([...Object.keys(hpData||{}),...Object.keys(shData||{})]);const entries=[...allSrcs].map(src=>({src,hp:hpData?.[src]||0,sh:shData?.[src]||0,total:(hpData?.[src]||0)+(shData?.[src]||0)})).filter(e=>e.total>0).sort((a,b)=>b.total-a.total);const grandTotal=entries.reduce((s,e)=>s+e.total,0);
                return <div style={{marginBottom:8}}><div style={{color:"#ff4466",fontSize:10,fontWeight:"bold",marginBottom:4}}>{label}</div>
                  {entries.length===0?<div style={{color:"#556677",fontSize:9}}>No damage taken yet</div>:entries.map(e=>{const pct=grandTotal>0?e.total/grandTotal*100:0;const hpPct=e.total>0?e.hp/e.total*100:0;return <div key={e.src} style={{marginBottom:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:"#ccddee",textTransform:"capitalize"}}>{e.src}</span><span style={{color:"#99aabb"}}>{Math.round(e.hp)}HP{e.sh>0?` + ${Math.round(e.sh)}Shield`:""} <span style={{color:"#667788"}}>({pct<1&&pct>0?"<1":Math.round(pct)}%)</span></span></div>
                    <div style={{height:7,background:"#14142a",borderRadius:2,marginTop:2,overflow:"hidden"}}><div style={{height:7,width:pct+"%",display:"flex",overflow:"hidden",borderRadius:2}}><div style={{height:7,background:"#ff446666",flex:e.hp,borderRadius:e.sh>0?"2px 0 0 2px":"2px"}} />{e.sh>0&&<div style={{height:7,background:"#44aaff66",flex:e.sh,borderRadius:"0 2px 2px 0"}} />}</div></div></div>})}</div>};
              return <div className="vs-scroll" style={{padding:"6px 14px",borderBottom:"1px solid #1a1a2e",maxHeight:200,overflow:"auto"}}>
                {mkPainRows(gs.wavePain,gs.waveShieldPain,"This Wave")}{mkPainRows(gs.painTrack,gs.shieldPain,"Entire Run")}</div>})()}
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
              <button onClick={()=>{setDeathRegenPopup(false);setDeathPainPopup(false);setDeathDmgPopup(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:deathDmgPopup?"#ff8866":"#778899",borderRadius:3}}>DMG analyser</button>
              <button onClick={()=>{setDeathDmgPopup(false);setDeathPainPopup(false);setDeathRegenPopup(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:deathRegenPopup?"#44ff88":"#778899",borderRadius:3}}>REGEN analyser</button>
              <button onClick={()=>{setDeathDmgPopup(false);setDeathRegenPopup(false);setDeathPainPopup(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:deathPainPopup?"#ff4466":"#778899",borderRadius:3}}>PAIN analyser</button>
            </div>
            {(deathDmgPopup||deathRegenPopup||deathPainPopup)&&(()=>{const gs=gsRef.current;if(!gs)return null;
              const mkR=(data,label,col)=>{const entries=Object.entries(data||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);const total=entries.reduce((s,[,v])=>s+v,0);
                return <div style={{marginBottom:8}}><div style={{color:col,fontSize:10,fontWeight:"bold",marginBottom:4}}>{label}</div>
                  {entries.length===0?<div style={{color:"#556677",fontSize:9}}>None recorded</div>:entries.map(([src,val])=>{const pct=total>0?val/total*100:0;return <div key={src} style={{marginBottom:3}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:"#ccddee"}}>{src}</span><span style={{color:"#99aabb"}}>{Math.round(val).toLocaleString()} ({pct<1&&pct>0?"<1":Math.round(pct)}%)</span></div>
                    <div style={{height:5,background:"#14142a",borderRadius:2,marginTop:1}}><div style={{height:5,background:col+"66",borderRadius:2,width:pct+"%"}} /></div></div>})}</div>};
              return <div style={{padding:"8px 12px",background:"#0a0a1a",border:"1px solid #22334444",borderRadius:4,maxWidth:400,width:"100%",marginTop:8}}>
                {deathDmgPopup&&<>{mkR(gs.waveDmg,"Final Wave","#ff8866")}{mkR(gs.dmgTrack,"Entire Run","#ff8866")}</>}
                {deathRegenPopup&&<>{mkR(gs.waveHeal,"Final Wave","#44ff88")}{mkR(gs.healTrack,"Entire Run","#44ff88")}</>}
                {deathPainPopup&&<>{(()=>{const mkPR=(hpD,shD,label)=>{const allS=new Set([...Object.keys(hpD||{}),...Object.keys(shD||{})]);const ents=[...allS].map(s=>({s,hp:hpD?.[s]||0,sh:shD?.[s]||0,t:(hpD?.[s]||0)+(shD?.[s]||0)})).filter(e=>e.t>0).sort((a,b)=>b.t-a.t);const gt=ents.reduce((a,e)=>a+e.t,0);return <div style={{marginBottom:8}}><div style={{color:"#ff4466",fontSize:10,fontWeight:"bold",marginBottom:4}}>{label}</div>{ents.length===0?<div style={{color:"#556677",fontSize:9}}>No damage taken</div>:ents.map(e=>{const pct=gt>0?e.t/gt*100:0;return <div key={e.s} style={{marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:"#ccddee",textTransform:"capitalize"}}>{e.s}</span><span style={{color:"#99aabb"}}>{Math.round(e.hp)}HP{e.sh>0?` + ${Math.round(e.sh)}Shield`:""} ({Math.round(pct)}%)</span></div><div style={{height:7,background:"#14142a",borderRadius:2,marginTop:2,overflow:"hidden"}}><div style={{height:7,width:pct+"%",display:"flex",overflow:"hidden",borderRadius:2}}><div style={{height:7,background:"#ff446666",flex:e.hp,borderRadius:e.sh>0?"2px 0 0 2px":"2px"}} />{e.sh>0&&<div style={{height:7,background:"#44aaff66",flex:e.sh,borderRadius:"0 2px 2px 0"}} />}</div></div></div>})}</div>};return <>{mkPR(gs.wavePain,gs.waveShieldPain,"Final Wave")}{mkPR(gs.painTrack,gs.shieldPain,"Entire Run")}</>;})()}</>}
              </div>;})()}
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <button onClick={()=>setPhase("metashop")} style={bs2("#bb77ff")} {...hv("#bb77ff")}>META</button>
              <button onClick={()=>initGame()} style={bs2("#00e5ff")} {...hv("#00e5ff")}>RETRY</button>
              <button onClick={()=>setPhase("menu")} style={{...bs2("#55667744"),borderWidth:1,color:"#8899aa",padding:"10px 20px"}}>MENU</button></div>
          </div>
        )}

        {phase==="metashop"&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"#06060e",zIndex:10,overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}><SubMenuBG/></div>
            <div style={{padding:"12px 14px 6px",borderBottom:"1px solid #1a1a2e",position:"relative",zIndex:1}}>
              <h2 style={{color:CUR.echoes.color,fontSize:15,margin:0,letterSpacing:3}}>META UPGRADES</h2>
              <div style={{display:"flex",gap:10,alignItems:"center",marginTop:3}}>
                <span style={{color:CUR.echoes.color,fontSize:13}}>⬢ {meta.echoes} Echoes</span>
                {metaTab==="abilities"&&<span style={{color:"#44ddcc",fontSize:11}}>◈ {meta.shards||0} Shards</span>}
              </div>
              <div style={{display:"flex",gap:4,marginTop:8}}>
                <button onClick={()=>{setMetaTab("ship");setAbInfoId(null);}} style={{padding:"5px 14px",background:metaTab==="ship"?"#1a1a2e":"transparent",borderTop:`1px solid ${metaTab==="ship"?"#bb77ff66":"#33445544"}`,borderLeft:`1px solid ${metaTab==="ship"?"#bb77ff66":"#33445544"}`,borderRight:`1px solid ${metaTab==="ship"?"#bb77ff66":"#33445544"}`,borderBottom:"none",borderRadius:"4px 4px 0 0",color:metaTab==="ship"?"#bb99ff":"#667788",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Ship Upgrades</button>
                {tutStep===9||tutStep===10?<button style={{padding:"5px 14px",background:"transparent",borderTop:"1px solid #22223344",borderLeft:"1px solid #22223344",borderRight:"1px solid #22223344",borderBottom:"none",borderRadius:"4px 4px 0 0",color:"#334455",fontSize:10,fontFamily:"inherit",cursor:"default"}}>Ability Upgrades</button>
                :<button onClick={()=>{setMetaTab("abilities");setAbInfoId(null);}} style={{padding:"5px 14px",background:metaTab==="abilities"?"#1a1a2e":"transparent",borderTop:`1px solid ${metaTab==="abilities"?"#44ddcc66":"#33445544"}`,borderLeft:`1px solid ${metaTab==="abilities"?"#44ddcc66":"#33445544"}`,borderRight:`1px solid ${metaTab==="abilities"?"#44ddcc66":"#33445544"}`,borderBottom:"none",borderRadius:"4px 4px 0 0",color:metaTab==="abilities"?"#44ddcc":"#667788",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Ability Upgrades</button>}
                <button onClick={()=>{setMetaTab("lab");setAbInfoId(null);}} style={{padding:"5px 14px",background:metaTab==="lab"?"#1a1a2e":"transparent",borderTop:`1px solid ${metaTab==="lab"?"#ff884466":"#33445544"}`,borderLeft:`1px solid ${metaTab==="lab"?"#ff884466":"#33445544"}`,borderRight:`1px solid ${metaTab==="lab"?"#ff884466":"#33445544"}`,borderBottom:"none",borderRadius:"4px 4px 0 0",color:metaTab==="lab"?"#ff9966":"#667788",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Lab Upgrades</button>
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
                <div style={{color:"#778899",fontSize:8,lineHeight:1.5,marginBottom:6}}>Max all upgrades at the current tier to unlock the next. Current tier: <span style={{color:"#bb99ff"}}>{tier}</span></div>
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
                    {"Respec · ⬢ "+Math.max(0,200-((meta.lab?.completed?.cheaper_respec||0)*20))}
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
                  <div style={{color:"#cc8888",fontSize:9,marginBottom:6}}>Are you sure you want to respec for {Math.max(0,200-((meta.lab?.completed?.cheaper_respec||0)*20))} echoes? You will get back all of your ability shards to respend.</div>
                  <div style={{display:"flex",gap:6}}><button onClick={()=>{const _respecCost=Math.max(0,200-((meta.lab?.completed?.cheaper_respec||0)*20));if(meta.echoes<_respecCost)return;const au=meta.abUpgrades||{};let refund=0;ABILITIES.forEach(ab=>{if(au[ab.id+"_sub1"])refund++;if(au[ab.id+"_sub2"])refund++;if(au[ab.id+"_mastery"])refund+=3;});setMeta(prev=>{const _rc=Math.max(0,200-((prev.lab?.completed?.cheaper_respec||0)*20));const nx={...prev,echoes:prev.echoes-_rc,shards:(prev.shards||0)+refund,abUpgrades:{}};saveMeta(nx);return nx;});setConfirmRespec(false);}}
                    style={{padding:"4px 12px",background:"none",border:"1px solid #cc5555",color:"#cc5555",cursor:meta.echoes>=Math.max(0,200-((meta.lab?.completed?.cheaper_respec||0)*20))?"pointer":"default",fontFamily:"inherit",fontSize:9,borderRadius:3,opacity:meta.echoes>=Math.max(0,200-((meta.lab?.completed?.cheaper_respec||0)*20))?1:0.4}}>{"Respec · ⬢ "+Math.max(0,200-((meta.lab?.completed?.cheaper_respec||0)*20))}</button>
                  <button onClick={()=>setConfirmRespec(false)} style={{padding:"4px 12px",background:"none",border:"1px solid #33445544",color:"#778899",cursor:"pointer",fontFamily:"inherit",fontSize:9,borderRadius:3}}>Cancel</button></div></div>}
                <div style={{color:"#556677",fontSize:8,textAlign:"center",margin:"4px 0"}}>Each ability has 2 sub-upgrades (◈1 each) and 1 mastery (◈3, requires both subs)</div>
              </div>
              <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,padding:10,overflow:"auto",display:"flex",flexDirection:"column",gap:6}}>
                {ABILITIES.map(ab=>{
                  const s1=hasSub(ab.id,1),s2=hasSub(ab.id,2),mas=hasMastery(ab.id);
                  const cs1=canBuySub(ab.id,1),cs2=canBuySub(ab.id,2),cm=canBuyMastery(ab.id);
                  const allOwned=s1&&s2&&mas;
                  const _abDescs=AB_DESCS;/*replaced*/ const _abDescsOld={orbitals_sub1:"Increase the number of electrons by 2.",orbitals_sub2:"Hitting an enemy with any of your electrons will deal 30% damage, but can only deal damage to any enemy once.",orbitals_mastery:"Gain another layer of 4 electrons, that travel in an elliptical orbit.",chain_sub1:"Chain lightning now targets 4 enemies.",chain_sub2:"The original target of the chain lightning gets electrocuted and it receives 60% of damage.",chain_mastery:"Echo Clone, Seeker Swarm and Combat Drone now apply a green chain lightning: it targets 4 enemies for every 3rd successful hit, dealing 25% damage on arc and 40% damage on electrocution.",homing_sub1:"Fires missiles every second.",homing_sub2:"Missiles now have a 15% chance to be critical, dealing 2.5x damage.",homing_mastery:"Missiles activate a burning bomb on hit with a radius of 6 that applies burn that does 10% dmg/s for 5 seconds.",slowfield_sub1:"Increase radius to 18.",slowfield_sub2:"The field effects the max pickup range, causing it to expand to 1.25x what it usually is, before contracting to its regular size, repeating continuously over 6s cycles.",slowfield_mastery:"Slows down bomber enemies that enter your Temporal Drag at the same rate that bullets are slowed down, and any bombers killed in the Temporal Drag will only release half the amount of bullets.",mirror_sub1:"Make the clone have the same fire rate as your main ship.",mirror_sub2:"Currency drops can be picked up by the clone if it directly collides with them.",mirror_mastery:"Every 12 seconds, the clone unleashes a lasso, that winds up for 2 seconds before launching at the most dense group of enemies and moves them away from you, of a radius of 10 and lasts for 4 seconds. Captured enemies cannot attack.",drone_sub1:"If you take HP damage from an enemy, your drone gets mad at it, firing at 2x firing rate. It will solely target that enemy until it is dead.",drone_sub2:"Adds 3% to its damage percentage compared to your main weapon for every other ability you own.",drone_mastery:"Gives you a gift after every wave equal to half of all the pickups you failed to pick up during the wave, rounded up to the nearest integer.",gravity_sub1:"Bullets that are in the gravity well get smaller by 4% every second, for a maximum of 32% size reduction.",gravity_sub2:"The vortex gets a second, conjoined vortex with a radius of 7 that has its own gravitational pull.",gravity_mastery:"Every other time a vortex is activated, it turns golden, and any enemies killed in those golden vortexes drop double the currency.",overcharge_sub1:"Max overcharge amount is increased to 140% of max health.",overcharge_sub2:"Plasma pickups now heal 6 HP instead of 3.",overcharge_mastery:"Overcharge now persists between waves, with a limit of 110% of max health.",blackhole_sub1:"Increase bullets removed to 50%.",blackhole_sub2:"Sniper bullets will be removed first, and any snipers about to fire will have their attack fail.",blackhole_mastery:"Ability will be triggered on shield loss as well as HP damage.",void_regen_sub1:"Increase the max that can be regenerated to 90% of max health (without Overcharge active).",void_regen_sub2:"If you kill at least 1 enemy whilst waiting for void regen to start, the windup time is reduced to 3 seconds.",void_regen_mastery:"Taking no damage for an entire wave grants a golden shield with invincibility frames. Golden shields persist between waves but when lost are lost forever. Maximum of 5 golden shields.",ricochet_sub1:"Bullets that ricochet receive a random small angle offset.",ricochet_sub2:"Bullets can hit one more wall before being destroyed.",ricochet_mastery:"When a ricocheted bullet hits an enemy, it performs a rage slice dealing 250% damage to enemies in a 120px line.",nova_sub1:"Increase the physical size of the landmine by 60%, making it easier for enemies to trigger.",nova_sub2:"Landmines deal 4x damage to any bosses that are damaged by the landmine.",nova_mastery:"Landmines persist after waves instead of being cleared."};
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
                  <div onClick={()=>setAbInfoId(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
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

            {metaTab==="lab"&&(()=>{
              const lab=meta.lab||{slots:0,active:[],completed:{},saved:{}};
              const slotsUnlocked=lab.slots||0;
              const activeResearch=lab.active||[];
              const completedLevels=lab.completed||{};
              const savedProgress=lab.saved||{};
              const highWave=meta.highWave||0;
              
              const buySlot=(slotIdx)=>{
                const cost=LAB_SLOT_COSTS[slotIdx];
                if(!cost||meta.echoes<cost||(lab.slots||0)>slotIdx)return;
                setMeta(prev=>{const nx={...prev,echoes:prev.echoes-cost,lab:{...(prev.lab||{}),slots:(prev.lab?.slots||0)+1,active:prev.lab?.active||[],completed:prev.lab?.completed||{},totalWaves:prev.lab?.totalWaves||0,saved:prev.lab?.saved||{}}};saveMeta(nx);return nx;});
              };
              
              const assignResearch=(labId,slotIdx)=>{
                const lu=LAB_UPGRADES.find(l=>l.id===labId);if(!lu)return;
                const curLvl=completedLevels[labId]||0;
                if(curLvl>=lu.levels.length||highWave<lu.minWave)return;
                const needed=lu.levels[curLvl].waves;
                const restored=savedProgress[labId]||0;
                setMeta(prev=>{
                  const newActive=[...(prev.lab?.active||[])];
                  const newSaved={...(prev.lab?.saved||{})};
                  /* Save progress of whatever was in this slot */
                  if(newActive[slotIdx]){newSaved[newActive[slotIdx].id]=newActive[slotIdx].wavesProgress||0;}
                  /* Remove labId from any other slot if already active */
                  const existIdx=newActive.findIndex(a=>a&&a.id===labId);
                  if(existIdx>=0&&existIdx!==slotIdx){newSaved[newActive[existIdx].id]=newActive[existIdx].wavesProgress||0;newActive[existIdx]=null;}
                  newActive[slotIdx]={id:labId,wavesNeeded:needed,wavesProgress:newSaved[labId]||0};
                  delete newSaved[labId];
                  const nx={...prev,lab:{...(prev.lab||{}),active:newActive,saved:newSaved}};
                  saveMeta(nx);return nx;
                });
                setLabConfirm(null);
              };
              
              const clearSlot=(slotIdx)=>{
                setMeta(prev=>{
                  const newActive=[...(prev.lab?.active||[])];
                  const newSaved={...(prev.lab?.saved||{})};
                  if(newActive[slotIdx]){newSaved[newActive[slotIdx].id]=newActive[slotIdx].wavesProgress||0;}
                  newActive[slotIdx]=null;
                  const nx={...prev,lab:{...(prev.lab||{}),active:newActive,saved:newSaved}};
                  saveMeta(nx);return nx;
                });
                setLabConfirm(null);
              };
              
              return <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,padding:10,display:"flex",flexDirection:"column",gap:8,overflow:"auto"}}>
                <div style={{color:"#667788",fontSize:8,textAlign:"center"}}>Research upgrades by completing waves across runs. All active research progresses simultaneously.</div>
                
                {/* Lab Slots - full width, taller */}
                {[0,1,2].map(slotIdx=>{
                  const unlocked=slotsUnlocked>slotIdx;
                  const canBuy=!unlocked&&(slotIdx===0||slotsUnlocked>=slotIdx)&&meta.echoes>=LAB_SLOT_COSTS[slotIdx];
                  const research=activeResearch[slotIdx];
                  const lu=research?LAB_UPGRADES.find(l=>l.id===research.id):null;
                  const curLvl=research?(completedLevels[research.id]||0):0;
                  const pct=research?Math.min(100,(research.wavesProgress/research.wavesNeeded)*100):0;
                  
                  return <div key={slotIdx} style={{borderRadius:5,overflow:"hidden",flexShrink:0,border:`1px solid ${unlocked?"#ff884422":"#1a1a2e"}`}}>
                    <div style={{padding:"3px 10px",background:unlocked?"#0e1420":"#08080f"}}>
                      <span style={{color:unlocked?"#ff9966":"#445566",fontSize:8,fontWeight:"bold",letterSpacing:1}}>Lab {slotIdx+1}</span>
                    </div>
                    
                    {!unlocked?(
                      <button onClick={()=>canBuy&&buySlot(slotIdx)} style={{width:"100%",padding:"28px 14px",background:"#0a0a14",borderTop:"none",border:"none",cursor:canBuy?"pointer":"default",fontFamily:"inherit",textAlign:"center",opacity:canBuy?1:0.35}}>
                        <div style={{color:"#778899",fontSize:12,fontWeight:"bold"}}>Unlock {slotIdx===0?"Lab":"slot "+(slotIdx+1)}</div>
                        <div style={{color:canBuy?CUR.echoes.color:"#445566",fontSize:11,marginTop:4}}>⬢ {LAB_SLOT_COSTS[slotIdx]}</div>
                      </button>
                    ):!research?(
                      <button onClick={()=>setLabConfirm("pick_"+slotIdx)} style={{width:"100%",padding:"28px 14px",background:"#0a0a14",border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}
                        onMouseOver={e=>e.currentTarget.style.background="#0c0c1a"} onMouseOut={e=>e.currentTarget.style.background="#0a0a14"}>
                        <div style={{color:"#778899",fontSize:13}}>Lab Offline</div>
                        <div style={{color:"#556677",fontSize:9,marginTop:4}}>Tap to assign research</div>
                      </button>
                    ):(
                      <button onClick={()=>setLabConfirm("pick_"+slotIdx)} style={{width:"100%",padding:"14px",background:"#0a0a14",border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}
                        onMouseOver={e=>e.currentTarget.style.background="#0c0c1a"} onMouseOut={e=>e.currentTarget.style.background="#0a0a14"}>
                        <div style={{color:"#ccddee",fontSize:11,fontWeight:"bold"}}>{lu?.name||"?"} <span style={{color:"#667788",fontSize:8}}>Lv.{curLvl} → Lv.{curLvl+1}</span></div>
                        <div style={{color:"#8899aa",fontSize:8,marginTop:3}}>{lu?.desc||""}</div>
                        <div style={{height:8,background:"#14142a",borderRadius:4,marginTop:8}}><div style={{height:8,background:"linear-gradient(90deg, #ff8844, #ffaa66)",borderRadius:4,width:pct+"%",transition:"width 0.3s"}} /></div>
                        <div style={{color:"#778899",fontSize:8,marginTop:4}}>{research.wavesProgress}/{research.wavesNeeded} waves{(()=>{const _lu=LAB_UPGRADES.find(l=>l.id===research.id);if(!_lu)return null;const _curLvl=completedLevels[research.id]||0;if(lu?.id==="intro_sprint")return ` · ${_curLvl===0?0:lu.levels[_curLvl-1]?.pct||0}% → ${lu.levels[_curLvl]?.pct||0}%`;if(lu?.id==="sprint_efficiency")return ` · ${_curLvl===0?0:lu.levels[_curLvl-1]?.pct||0}% → ${lu.levels[_curLvl]?.pct||0}%`;if(lu?.id==="cheaper_respec")return ` · -${_curLvl===0?0:lu.levels[_curLvl-1]?.reduce||0}⬢ → -${lu.levels[_curLvl]?.reduce||0}⬢`;if(lu?.id==="phantom_enhance")return ` · +${(_curLvl===0?0:_curLvl*0.1).toFixed(1)}% → +${((_curLvl+1)*0.1).toFixed(1)}%`;if(lu?.id==="practise_enhance")return ` · +${(_curLvl===0?0:_curLvl*0.8).toFixed(1)}% → +${((_curLvl+1)*0.8).toFixed(1)}%`;if(lu?.id==="diffusion_chance")return ` · ${_curLvl===0?0:lu.levels[_curLvl-1]?.pct||0}% → ${lu.levels[_curLvl]?.pct||0}%`;if(lu?.id==="diffusion_multi")return ` · +${(_curLvl===0?0:_curLvl*1.2).toFixed(1)}% → +${((_curLvl+1)*1.2).toFixed(1)}%`;return null;})()}</div>
                      </button>
                    )}
                  </div>;
                })}
                
                {/* Lab Picker Overlay */}
                {labConfirm&&labConfirm.startsWith("pick_")&&(()=>{
                  const slotIdx=parseInt(labConfirm.split("_")[1]);
                  return <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{background:"#0a0a16",border:"1px solid #ff884455",borderRadius:8,width:"92%",maxHeight:"80%",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.8)"}}>
                    <div style={{padding:"12px 12px 0"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{color:"#ff9966",fontSize:12,fontWeight:"bold",letterSpacing:2}}>SELECT RESEARCH</span>
                      <button onClick={()=>setLabConfirm(null)} style={{background:"none",border:"1px solid #556677",color:"#99aabb",padding:"4px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
                    </div>
                    
                    </div>
                    <div className="vs-scroll" style={{flex:1,overflow:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,padding:"8px 12px"}}>
                      {[...LAB_UPGRADES].sort((a,b)=>(a.tier||1)-(b.tier||1)||(a.minWave-b.minWave)).map((lu2,li,arr)=>{const _prevTier=li>0?(arr[li-1].tier||1):0;const _curTier=lu2.tier||1;const _showTierHeader=_curTier!==_prevTier;return <>{_showTierHeader&&<div style={{gridColumn:"1/-1",color:_curTier===2?"#bb99ff":"#ff9966",fontSize:10,fontWeight:"bold",letterSpacing:1,marginTop:li>0?8:0,paddingBottom:4,borderBottom:`1px solid ${_curTier===2?"#bb99ff22":"#ff884422"}`}}>TIER {_curTier}</div>}{(()=>{
                        const cl=completedLevels[lu2.id]||0;
                        const maxed=cl>=lu2.levels.length;
                        const locked=highWave<lu2.minWave||(lu2.tier===2&&(meta.metaTier||1)<2);
                        const isCurrentSlot=activeResearch[slotIdx]?.id===lu2.id;
                        const saved=savedProgress[lu2.id]||0;
                        const canPick=!maxed&&!locked&&!isCurrentSlot;
                        return <button key={lu2.id} onClick={()=>canPick&&assignResearch(lu2.id,slotIdx)} disabled={!canPick}
                          style={{padding:"12px",background:isCurrentSlot?"#0e1a1a":canPick?"#0c0c1a":"#08080f",border:`1px solid ${isCurrentSlot?"#44ddcc44":maxed?"#ffcc4444":canPick?"#ff884433":"#1a1a2e"}`,borderRadius:5,cursor:canPick?"pointer":"default",fontFamily:"inherit",textAlign:"left",opacity:locked?0.35:1,flexShrink:0,position:"relative",overflow:"hidden"}}>
                          {maxed&&<div className="gold-shimmer"/>}
                          <div style={{color:maxed?"#ffcc44":isCurrentSlot?"#44ddcc":"#ccddee",fontSize:12,fontWeight:"bold"}}>{lu2.name} <span style={{color:lu2.tier===2?"#bb99ff":"#667788",fontSize:8}}>{lu2.tier===2?"T2 · ":""}Lv.{cl}/{lu2.levels.length}{locked?(lu2.tier===2&&(meta.metaTier||1)<2?` · Needs Tier 2`:(highWave<lu2.minWave?` · Needs wave ${lu2.minWave}`:"")):"" }{isCurrentSlot?" · Current":""}</span></div>
                          <div style={{color:"#8899aa",fontSize:10,marginTop:3,lineHeight:1.4}}>{lu2.desc}</div>
                          {!maxed&&!locked&&<div style={{color:"#778899",fontSize:8,marginTop:4}}>
                            {`Next: Lv${cl+1} · ${lu2.levels[cl].waves} waves needed`}
                            {saved>0&&!isCurrentSlot&&` · ${saved} waves saved`}
                          </div>}
                          {maxed&&<div style={{color:"#ffcc44",fontSize:9,marginTop:3}}>MAXED</div>}
                        </button>;
                      })()}</>;})}
                    </div>
                    </div>
                  </div>;
                })()}
              </div>;
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
