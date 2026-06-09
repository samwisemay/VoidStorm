import { useState, useEffect, useRef, useCallback } from "react";
const GW = 600, GH = 800;
const PI2 = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const _vsRealRandom = Math.random;
let _vsRngState = 1;
function _vsSeededRandom(){let t=_vsRngState=(_vsRngState+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}
let _vsRngActive=false;
function _vsActivateRng(seed){_vsRngState=seed>>>0;if(!_vsRngActive){Math.random=_vsSeededRandom;_vsRngActive=true;}}
function _vsResumeRng(state){_vsRngState=state>>>0;if(!_vsRngActive){Math.random=_vsSeededRandom;_vsRngActive=true;}}
function _vsDeactivateRng(){if(_vsRngActive){Math.random=_vsRealRandom;_vsRngActive=false;}}
function _vsPeekRng(){return _vsRngState;}
function _vsPokeRng(s){_vsRngState=s>>>0;}
function _vsGenSeed(){return(Date.now()^Math.floor(performance.now()*1000)^Math.floor(_vsRealRandom()*0xFFFFFFFF))>>>0;}
function _vsEncodeKeys(k){let m=0;if(k){if(k["w"]||k["arrowup"])m|=1;if(k["s"]||k["arrowdown"])m|=2;if(k["a"]||k["arrowleft"])m|=4;if(k["d"]||k["arrowright"])m|=8;}return m;}
function _vsDecodeKeys(m){return{w:!!(m&1),arrowup:!!(m&1),s:!!(m&2),arrowdown:!!(m&2),a:!!(m&4),arrowleft:!!(m&4),d:!!(m&8),arrowright:!!(m&8)};}
function _vsEncodeTouch(t){if(!t||(!t.active&&!t._arrowL&&!t._arrowR&&!t._arrowU&&!t._arrowD))return 0;return{a:t.active?1:0,sx:Math.round(t.startX||0),sy:Math.round(t.startY||0),cx:Math.round(t.curX||0),cy:Math.round(t.curY||0),L:t._arrowL?1:0,R:t._arrowR?1:0,U:t._arrowU?1:0,D:t._arrowD?1:0};}
function _vsDecodeTouch(d){if(!d||d===0)return{active:false,startX:0,startY:0,curX:0,curY:0,id:null,_arrowL:false,_arrowR:false,_arrowU:false,_arrowD:false};return{active:!!d.a,startX:d.sx,startY:d.sy,curX:d.cx,curY:d.cy,id:d.a?"replay":null,_arrowL:!!d.L,_arrowR:!!d.R,_arrowU:!!d.U,_arrowD:!!d.D};}
function _vsSnapshotGs(gs){return JSON.parse(JSON.stringify(gs,(k,v)=>{if(k==="_replay")return undefined;if(typeof v==="function")return undefined;return v;}));}
function _vsRestoreGs(s){return JSON.parse(JSON.stringify(s));}
function _vsSnapshotMeta(m){return JSON.parse(JSON.stringify(m||{}));}
function _vsHistForSync(){try{const h=JSON.parse(localStorage.getItem("vs4-history")||"[]");return h.map(e=>{const c={...e};delete c.replay;return c;});}catch(_e){return[];}}
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ag = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const lerp = (a, b, t) => a + (b - a) * t;
const SUPABASE_URL = "https://iydflctqkwnnnyqvzjog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZGZsY3Rxa3dubm55cXZ6am9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODM3NDgsImV4cCI6MjA5MzA1OTc0OH0.-0vKfZihqCxgD835JYLbdvhmI5mjmhG1jznuTjtKizg";
const _SYNC_OK=SUPABASE_URL!=="YOUR_SUPABASE_URL"&&SUPABASE_ANON_KEY!=="YOUR_SUPABASE_ANON_KEY";
const _BANNED_WORDS=["fuck","fck","fuk","fuq","fux","shit","sht","bitch","btch","dick","dck","cock","cunt","cnt","pussy","puss","fag","fagg","nigger","nig","nigga","retard","rtrd","slut","whore","nazi","kike","chink","spic","dyke","tranny","piss","wank","twat","bollocks","pedo","paedo","rape","raping","rapist","molest","porn","hentai","kkk","jihad","wetback","gook","coon","darkie","spastic","spaz","slag","nonce","groomer","paki","homo","sodom","jizz","cum","semen","dildo","vibrator","penis","vagina","anus","anal","blowjob","handjob","masturbat","orgasm","erection","boob","tits","nipple","areola","scrotum","testicl","phallus","clitoris","queef","felch","bukak","creampie","gangbang","threesome","rimjob","pegging"];
const _hasProfanity=s=>{const l=s.toLowerCase().replace(/1/g,"i").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s").replace(/0/g,"o").replace(/7/g,"t").replace(/\$/g,"s").replace(/@/g,"a").replace(/[^a-z]/g,"");return _BANNED_WORDS.some(w=>l.includes(w));};
const _genUsername=()=>"Pilot-"+Math.random().toString(36).slice(2,7);
const BLOCKED_CODES=new Set(["0000","1111","2222","3333","4444","5555","6666","7777","8888","9999","0123","1234","2345","3456","4567","5678","6789","9876","8765","7654","6543","5432","4321","3210","0420","4200","0069","6969","1337","0666","6660","00000","11111","22222","33333","44444","55555","66666","77777","88888","99999","01234","12345","23456","34567","45678","56789","98765","87654","76543","65432","54321","43210","12321","69696","42069","000000","111111","222222","333333","444444","555555","666666","777777","888888","999999","012345","123456","234567","345678","456789","987654","876543","765432","654321","543210","696969","123123","420420","111222","123321","000420","069420"]);
const CUR = {
 scrap: { name: "Scrap", icon: "⬡", color: "#4499ff", rarity: "COMMON", desc: "Salvage from wrecks. Buys basic repairs and munitions.", sz:1.2 },
 cores: { name: "Cores", icon: "◆", color: "#44ff88", rarity: "UNCOMMON", desc: "Unstable energy cores. Powers advanced weapons.", sz:1.15 },
 plasma: { name: "Plasma", icon: "✦", color: "#ff8844", rarity: "RARE", desc: "Volatile plasma from elites. Fuels exotic and endgame upgrades.", sz:1.3 },
 echoes: { name: "Echoes", icon: "⬢", color: "#bb77ff", rarity: "PERMANENT", desc: "Void residue persisting after death. Enhances your ship forever.", sz:1.0 },
 packages: { name: "Packages", icon: "▣", color: "#cc9955", rarity: "CARGO", desc: "Cargo hauled clear of the void. Spent on the Paths skill tree.", sz:1.1 },
 bossShards: { name: "Boss Shards", icon: "◈", color: "#cc3333", rarity: "PERMANENT", desc: "Crystallised power from bosses. Unlocks custom ship designs.", sz:1.2 },
 overheat: { name: "Overheat", icon: "✹", color: "#ff6622", rarity: "PERMANENT", desc: "Thermal residue from flame kills. Pushes wave upgrades beyond their normal limits.", sz:1.3 },
};
const OH_ITEM={dmg:{ec:50000,oh:10500,l1:14000},rate:{ec:10000,oh:2250,l1:3100},maxhp:{ec:6500,oh:1300,l1:1700},magnet:{ec:7000,oh:1450,l1:1950},bsize:{ec:22000,oh:4000,l1:5400},speed:{ec:3500,oh:800,l1:1250},regen:{ec:15000,oh:3000,l1:4200},fortune:{ec:28000,oh:5200,l1:6500},acid:{ec:57000,oh:12000,l1:15500},velocity:{ec:36000,oh:7000,l1:9000},kinetic:{ec:250000,oh:33000,l1:44000},pklife:{ec:95000,oh:19000,l1:26000},crit:{ec:480000,oh:56000,l1:80000},dodge:{ec:1250000,oh:87000,l1:120000},voidsiphon:{ec:140000,oh:24000,l1:30500},overdrv:{ec:2500000,oh:160000,l1:230000},reactive:{ec:800000,oh:56000,l1:80000}};
const _ohR10=n=>Math.ceil(n/10)*10;
const _ohFmt=n=>n>=1000000?(n/1000000).toFixed(n%1000000?1:0)+"M":n>=1000?(n/1000).toFixed(0)+"k":""+n;
const OH_COSTS={unlock:10000,maxLvl:3,itemEc:id=>(OH_ITEM[id]?OH_ITEM[id].ec:100),itemOhCost:id=>_ohR10(OH_ITEM[id]?OH_ITEM[id].oh:5),lvlCost:(id,l)=>{const L1=OH_ITEM[id]?OH_ITEM[id].l1:10;return _ohR10([L1,L1*3.5,L1*3.5*4.75][Math.min(l,2)]);}};
const OVERCHARGE_GROWTH=3;
const BASE_HP = 12;
function hpScale(w) { return 1 + w * 0.22 + Math.pow(w, 1.4) * 0.02 + (w > 10 ? Math.pow(w - 10, 2) * 0.12 : 0) + (w > 30 ? Math.pow(w - 30, 2) * 1.2 : 0); }
function dmgScale(w) { return 1 + w * 0.18 + Math.pow(w, 1.3) * 0.015 + (w > 10 ? Math.pow(w - 10, 2) * 0.025 : 0); }
function spawnDelay(w) { return Math.max(60, 420 - w * 22 - Math.pow(w, 1.2) * 3); }
const ED = {
 drone: { hpM: 1.0, spd: 1.4, sz: 13, col: "#ff6644", sB: 2, cB: 0, pB: 0, fr: 2400, bs: 2.5, pat: "aimed", dM: 1.0, desc: "Basic grunt. Fires single aimed shots." },
 weaver: { hpM: 1.5, spd: 1.6, sz: 13, col: "#cc44ff", sB: 2, cB: 0, pB: 0, fr: 2000, bs: 2.8, pat: "fan3", dM: 1.0, desc: "Sine-wave movement. Fires 3-bullet fans." },
 sprayer: { hpM: 2.0, spd: 0.5, sz: 15, col: "#ffaa44", sB: 2, cB: 1, pB: 0, fr: 2800, bs: 2.0, pat: "ring", dM: 1.0, desc: "Stationary turret. Fires expanding bullet rings." },
 tank: { hpM: 5.0, spd: 0.4, sz: 20, col: "#cc3333", sB: 3, cB: 1, pB: 0, fr: 3200, bs: 1.8, pat: "bigaimed",dM: 1.6, desc: "Heavy armour, slow. Large high-damage shots." },
 bomber: { hpM: 1.5, spd: 2.8, sz: 12, col: "#ffcc44", sB: 2, cB: 0, pB: 0, fr: 99999,bs: 0, pat: "none", dM: 1.3, desc: "Kamikaze. Charges player, explodes into bullets." },
 sniper: { hpM: 1.0, spd: 0.3, sz: 14, col: "#ff66ff", sB: 2, cB: 1, pB: 0, fr: 3500, bs: 6.0, pat: "snipe", dM: 2.5, desc: "Telegraphs with a laser, then fires a fast lethal shot." },
 splitter:{ hpM: 2.2, spd: 1.0, sz: 16, col: "#66ffcc", sB: 3, cB: 1, pB: 0, fr: 2600, bs: 2.3, pat: "aimed", dM: 1.0, desc: "On death, splits into 2 smaller copies." },
 pulse: { hpM: 3.0, spd: 0.3, sz: 17, col: "#aaaaff", sB: 3, cB: 1, pB: 1, fr: 3000, bs: 1.5, pat: "pulse", dM: 1.0, desc: "4-pointed star. Emits expanding pulse rings." },
 orbiter: { hpM: 1.8, spd: 0.6, sz: 14, col: "#44ddff", sB: 2, cB: 1, pB: 0, fr: 1800, bs: 2.2, pat: "orbit", dM: 1.0, desc: "Circles in place. Fires rotating double-helix bullets." },
 charger: { hpM: 2.5, spd: 0.5, sz: 18, col: "#ff8866", sB: 3, cB: 1, pB: 1, fr: 4000, bs: 4.0, pat: "burst3", dM: 1.8, desc: "Charges up, then fires 3 rapid high-damage bursts." },
 wraith: { hpM: 1.8, spd: 0.5, sz: 14, col: "#88aaff", sB: 3, cB: 1, pB: 1, fr: 3800, bs: 3.0, pat: "phase5", dM: 1.5, desc: "Ethereal hunter. Teleports and fires spreads on reappearing. Briefly invulnerable while phasing." },
 siren: { hpM: 2.0, spd: 0.7, sz: 15, col: "#ff55cc", sB: 3, cB: 1, pB: 1, fr: 3000, bs: 1.8, pat: "siren", dM: 1.2, desc: "Hypnotic threat. Fires slow bullets that gently track toward you." },
 fortress:{ hpM: 4.0, spd: 0.25,sz: 22, col: "#55ccaa", sB: 4, cB: 2, pB: 1, fr: 3600, bs: 2.2, pat: "aimed", dM: 1.3, desc: "Armoured bastion. Rotating shield arc blocks incoming fire from one side." },
 reaper: { hpM: 2.5, spd: 0.5, sz: 16, col: "#cc44ff", sB: 3, cB: 1, pB: 2, fr: 4500, bs: 2.0, pat: "mines", dM: 2.0, desc: "Area denial specialist. Drops mines that detonate into bullet rings after a delay." },
};
const SHOP = [
 { id:"dmg", name:"Hardened Rounds", desc:"+12% damage", cat:"offense", cur:"scrap", base:10, max:20, scale:1.1, exp:1.6, wave:0, icon:"⚔", fn:p=>{p.damage*=1.12} },
 { id:"rate", name:"Autoloader", desc:"-10% fire delay", cat:"offense", cur:"scrap", base:12, max:15, scale:0.7, exp:1.4, wave:0, icon:"🔥",fn:p=>{p.fireDelay=Math.max(50,p.fireDelay*0.9)} },
 { id:"maxhp", name:"Hull Plating", desc:"+20 max HP, heal 20", cat:"defense", cur:"scrap", base:8, max:25, scale:0.6, exp:1.3, wave:0, icon:"❤", fn:p=>{const _oldHp=p.hp;p.maxHp+=20;p.hp=Math.max(_oldHp,Math.min(p.hp+20,p.maxHp));} },
 { id:"magnet", name:"Tractor Beam", desc:"+9% pickup range", cat:"utility", cur:"scrap", base:10, max:8, scale:1.0, exp:1.5, wave:0, icon:"🧲",fn:p=>{p.magnetRange*=1.09} },
 { id:"bsize", name:"Bore Upgrade", desc:"+0.1 bullet size, +8% damage",cat:"offense", cur:"scrap", base:15, max:10, scale:0.9, exp:1.5, wave:2, icon:"●", fn:p=>{p.bulletSize+=0.1;p.damage*=1.08} },
 { id:"speed", name:"Afterburner", desc:"+8% move speed", cat:"utility", cur:"scrap", base:12, max:8, scale:0.8, exp:1.4, wave:3, icon:"💫",fn:p=>{p.speed*=1.08} },
 { id:"regen", name:"Nanobots", desc:"+0.8 HP/sec", cat:"defense", cur:"cores", base:8, max:10, scale:0.7, exp:1.35, wave:4, icon:"✚", fn:p=>{p.regenRate+=0.8} },
 { id:"fortune",name:"Scavenger AI", desc:"+15% currency drops", cat:"utility", cur:"cores", base:16, max:8, scale:0.9, exp:1.5, wave:4, icon:"💎",fn:p=>{p.fortuneMult*=1.15} },
 { id:"rear", name:"Rear Turret", desc:"Fire tiny bullets back",cat:"offense", cur:"cores", base:18, max:1, scale:1, exp:1, wave:4, icon:"⇅", fn:p=>{p.hasRearGun=true} },
 { id:"shield", name:"Barrier Cell", desc:"+1 hit shield/wave", cat:"defense", cur:"cores", base:832, max:2, scale:1.67, exp:1.0, wave:5, icon:"🛡",fn:p=>{p.shieldMax++;p.shields++} },
 { id:"acid", name:"Flame Coating", desc:"+1 burn stack. On critical hit: burns for (stacks \u00d7 15%) damage/s for 2s.",cat:"offense", cur:"cores", base:20, max:5, scale:1.4, exp:1.8, wave:5, icon:"🔥",fn:p=>{p.acidStacks++} },
 { id:"velocity",name:"Velocity Rounds", desc:"+12% bullet speed", cat:"offense", cur:"cores", base:30, max:5, scale:1.2, exp:1.6, wave:7, icon:"»", fn:p=>{p.bulletSpeedMul=(p.bulletSpeedMul||1)*1.12} },
 { id:"kinetic", name:"Kinetic Amplifier",desc:"x1.1 dmg for Echo Clone, Seeker Swarm & Combat Drone per level when moving", cat:"offense", cur:"plasma", base:12, max:5, scale:1.1, exp:1.5, wave:8, icon:"⚡",fn:p=>{p.kineticBonus=(p.kineticBonus||0)+0.10} },
 { id:"pklife", name:"Stasis Field", desc:"+0.5s pickup duration", cat:"utility", cur:"plasma", base:12, max:6, scale:0.9, exp:1.4, wave:8, icon:"⏱", fn:p=>{p.pickupLife+=30} },
 { id:"crit", name:"Precision Core", desc:"+8% crit (2.5× dmg)", cat:"offense", cur:"plasma", base:16, max:8, scale:1.0, exp:1.5, wave:9, icon:"🎯",fn:p=>{p.critChance=Math.min(0.7,(p.critChance||0)+0.08)} },
 { id:"dodge", name:"Phase Matrix", desc:"+3% chance to halve damage",cat:"defense", cur:"plasma", base:18, max:8, scale:1.4, exp:1.85,wave:10, icon:"💨",fn:p=>{p.dodgeChance=Math.min(0.35,(p.dodgeChance||0)+0.03)} },
 { id:"voidsiphon",name:"Void Siphon", desc:"Heals 2 HP per critical attack (main gun only)",cat:"defense", cur:"plasma", base:10, max:8, scale:0.8, exp:1.4, wave:8, icon:"🩸",fn:p=>{p.voidsiphonFlat=(p.voidsiphonFlat||0)+2} },
 { id:"overdrv",name:"Overdrive Chip", desc:"+3% all stats", cat:"utility", cur:"plasma", base:25, max:10, scale:1.5, exp:1.8, wave:12, icon:"⚙", fn:p=>{p.damage*=1.03;p.speed*=1.03;p.maxHp=Math.ceil(p.maxHp*1.03);p.fireDelay*=0.97} },
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
 {id:"intro_sprint",name:"Intro Sprint",desc:"Rapidly progresses through early waves at game start. Skips ability picks and shops — abilities stack and are offered together at the end.",
 levels:[{pct:10,waves:30},{pct:20,waves:60},{pct:30,waves:95},{pct:40,waves:130},{pct:50,waves:200}],minWave:15},
 {id:"sprint_efficiency",name:"Sprint Lab Efficiency",desc:"Increases the chance that each intro sprint wave contributes progress to active labs.",
 levels:[{pct:40,waves:20},{pct:50,waves:35},{pct:60,waves:55},{pct:70,waves:90},{pct:80,waves:145}],minWave:18},
 {id:"boss_shard_drop",name:"Boss Shard Drop Rate",desc:"Gives bosses a chance to drop boss shards — a permanent currency used for custom ship designs. Not affected by golden gravity wells.",
 levels:[{pct:8,waves:4},{pct:16,waves:7},{pct:24,waves:11},{pct:32,waves:16},{pct:40,waves:22}],minWave:8},
 {id:"cheaper_respec",name:"Cheaper Respec",desc:"Reduces the cost of respecing ability shards by echo shards.",
 levels:[{reduce:20,waves:12},{reduce:40,waves:19},{reduce:60,waves:27},{reduce:80,waves:36},{reduce:100,waves:47},{reduce:120,waves:60},{reduce:140,waves:75},{reduce:160,waves:93},{reduce:180,waves:114},{reduce:200,waves:140}],minWave:10},
 {id:"sprint_currency_lifespan",name:"Sprint Currency Lifespan",desc:"Increases how many waves currency drops survive during intro sprint before being exploded.",
 levels:[{waves:95},{waves:130},{waves:175},{waves:230}],minWave:21},
 {id:"phantom_enhance",name:"Phantom Enhance",desc:"Increases the Phantom echo multiplier.",tier:2,
 levels:[{waves:4},{waves:8},{waves:12},{waves:18},{waves:25},{waves:33},{waves:42},{waves:54},{waves:68},{waves:85},{waves:105},{waves:130},{waves:160},{waves:195},{waves:240},{waves:290},{waves:360},{waves:450},{waves:560},{waves:700}],minWave:25},
 {id:"practise_enhance",name:"Practise Enhance",desc:"Increases the Practise echo multiplier.",tier:2,
 levels:[{waves:7},{waves:13},{waves:20},{waves:29},{waves:39},{waves:52},{waves:68},{waves:85},{waves:104},{waves:130},{waves:163},{waves:202},{waves:247},{waves:299},{waves:364},{waves:442},{waves:546},{waves:676},{waves:845},{waves:1040}],minWave:20},
 {id:"diffusion_chance",name:"Diffusion Chance",desc:"Increases the chance that the Diffuse option appears on ability pick screens.",tier:2,
 levels:[{pct:10,waves:5},{pct:20,waves:10},{pct:30,waves:15},{pct:40,waves:22},{pct:50,waves:32},{pct:60,waves:50},{pct:70,waves:80},{pct:80,waves:130}],minWave:17},
 {id:"diffusion_multi",name:"Diffusion Enhance",desc:"Increases the per-diffuse echo bonus.",tier:2,
 levels:[{waves:6},{waves:11},{waves:16},{waves:22},{waves:28},{waves:35},{waves:43},{waves:52},{waves:62},{waves:74},{waves:87},{waves:102}],minWave:22},
 {id:"overheat_chance",name:"Overheat Chance",desc:"Increases the chance that flame-killed enemies drop overheat points.",tier:2,
 levels:[{pct:30,waves:170},{pct:35,waves:240},{pct:40,waves:330},{pct:45,waves:440},{pct:50,waves:570}],minWave:30},
 {id:"overheat_bot_mult",name:"Overheat Bot Multiplier",desc:"Enemies that would have given overheat, if killed whilst inside the range of any bot, drops more overheat on death",tier:3,
 levels:[{waves:238},{waves:518},{waves:878},{waves:1318}],minWave:37},
 {id:"overheat_wave_cost",name:"Overheat Wave Cost",desc:"Decreases the cost of all wave upgrades when the level has reached an overheated upgrade level.",tier:3,
 levels:[{waves:150},{waves:238},{waves:338},{waves:450},{waves:588},{waves:750},{waves:938},{waves:1163},{waves:1425},{waves:1750}],minWave:40},
 ];
const BG_DESIGNS=[
 {id:"void",name:"Void",css:"background:#06060e;"},
 {id:"starfield",name:"Starfield",css:"background:radial-gradient(3px 3px at 10% 20%,#ffffffaa,transparent),radial-gradient(2px 2px at 30% 70%,#ffffff88,transparent),radial-gradient(3.5px 3.5px at 50% 30%,#88bbff99,transparent),radial-gradient(2px 2px at 70% 80%,#ffffff77,transparent),radial-gradient(2.5px 2.5px at 90% 40%,#ffffff88,transparent),radial-gradient(3px 3px at 15% 90%,#88bbff88,transparent),radial-gradient(4px 4px at 85% 15%,#ffcc4477,transparent),radial-gradient(2px 2px at 45% 55%,#ffffff66,transparent),radial-gradient(3px 3px at 60% 10%,#ff88ff66,transparent),radial-gradient(2.5px 2.5px at 25% 45%,#44ff8866,transparent),radial-gradient(1.5px 1.5px at 5% 50%,#ffffff55,transparent),radial-gradient(2px 2px at 95% 85%,#aaddff55,transparent),radial-gradient(1.5px 1.5px at 35% 15%,#ffffff44,transparent),radial-gradient(2px 2px at 75% 35%,#ffaaff44,transparent),radial-gradient(1px 1px at 55% 95%,#ffffff55,transparent),radial-gradient(3px 3px at 42% 78%,#44ffaa33,transparent),radial-gradient(ellipse 120px 2px at 20% 40%,#ffffff18,transparent),radial-gradient(ellipse 80px 1px at 65% 75%,#88bbff15,transparent),radial-gradient(ellipse 100px 2px at 80% 25%,#ffffff12,transparent),radial-gradient(1.5px 1.5px at 12% 35%,#ffffff66,transparent),radial-gradient(2px 2px at 38% 8%,#aaccff55,transparent),radial-gradient(1px 1px at 58% 48%,#ffffff55,transparent),radial-gradient(1.5px 1.5px at 78% 92%,#ffccaa44,transparent),radial-gradient(1px 1px at 92% 68%,#ffffff55,transparent),radial-gradient(2px 2px at 5% 78%,#88ffbb44,transparent),radial-gradient(1px 1px at 48% 32%,#ffffff44,transparent) #03030a;animation:starDrift 60s linear infinite;background-size:200% 200%;"},
 {id:"grid",name:"Grid",css:"background-image:linear-gradient(rgba(0,229,255,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.12) 1px,transparent 1px);background-size:40px 40px;background-color:#03030a;animation:gridScroll 30s linear infinite;"},
 {id:"circuit",name:"Circuit",css:"background-color:#03040a;background-image:linear-gradient(90deg,transparent 29px,rgba(68,204,170,0.06) 29px,rgba(68,204,170,0.06) 31px,transparent 31px),linear-gradient(0deg,transparent 29px,rgba(68,204,170,0.06) 29px,rgba(68,204,170,0.06) 31px,transparent 31px),radial-gradient(circle 3px at 30px 30px,rgba(68,204,170,0.25) 50%,transparent 50%),radial-gradient(circle 1.5px at 15px 30px,rgba(68,204,170,0.12) 50%,transparent 50%),radial-gradient(circle 1.5px at 30px 15px,rgba(68,204,170,0.12) 50%,transparent 50%),linear-gradient(90deg,transparent 14px,rgba(68,204,170,0.04) 14px,rgba(68,204,170,0.04) 16px,transparent 16px),linear-gradient(0deg,transparent 14px,rgba(68,204,170,0.04) 14px,rgba(68,204,170,0.04) 16px,transparent 16px),radial-gradient(circle 5px at 30px 30px,rgba(68,204,170,0.04) 100%,transparent 100%);background-size:60px 60px;animation:circuitPulse 8s ease-in-out infinite alternate;"},
 {id:"nebula",name:"Nebula",css:"background:radial-gradient(ellipse at 20% 50%,#1e3870 0%,transparent 50%),radial-gradient(ellipse at 80% 30%,#3a1870 0%,transparent 50%),radial-gradient(ellipse at 50% 80%,#184848 0%,transparent 40%),radial-gradient(ellipse at 60% 20%,#281248 0%,transparent 35%) #04040a;animation:nebulaPulse 20s ease-in-out infinite alternate;"},
 {id:"deep",name:"Deep Ocean",css:"background:linear-gradient(180deg,#040c18 0%,#0a2550 40%,#103060 70%,#060e22 100%);animation:deepPulse 15s ease-in-out infinite alternate;"},
 {id:"aurora",name:"Aurora",css:"background:linear-gradient(135deg,#061220 0%,#0a2838 25%,#103828 40%,#060c18 55%,#1a1030 70%,#120a22 85%,#061220 100%);animation:auroraShift 12s ease-in-out infinite alternate;"},
 {id:"ember",name:"Ember",css:"background-color:#06050c;background-image:radial-gradient(ellipse at 30% 80%,#2a1410aa,transparent 50%),radial-gradient(ellipse at 70% 60%,#281210aa,transparent 40%),radial-gradient(ellipse at 50% 30%,#200c0866,transparent 45%),radial-gradient(ellipse at 50% 90%,#3a181266,transparent 55%),radial-gradient(ellipse at 80% 20%,#1a0a0844,transparent 40%);animation:emberGlow 10s ease-in-out infinite alternate;"},
 {id:"solar",name:"Solar",css:"background-color:#0c0703;background-image:radial-gradient(circle at 50% 48%,#ffe08855 0%,transparent 26%),radial-gradient(circle at 50% 48%,#ffaa3340 0%,transparent 42%),radial-gradient(ellipse at 50% 48%,#ff662230 0%,transparent 62%),radial-gradient(ellipse at 22% 78%,#cc440028,transparent 50%),radial-gradient(ellipse at 80% 24%,#ff88112a,transparent 48%);animation:solarPulse 7s ease-in-out infinite alternate;"},
 {id:"frost",name:"Frost",css:"background-color:#050d16;background-image:linear-gradient(125deg,transparent 38%,rgba(160,225,255,0.09) 50%,transparent 62%),linear-gradient(55deg,transparent 40%,rgba(190,235,255,0.06) 50%,transparent 60%),radial-gradient(ellipse at 28% 18%,rgba(110,185,235,0.18),transparent 48%),radial-gradient(ellipse at 72% 82%,rgba(150,205,245,0.14),transparent 44%),radial-gradient(ellipse at 90% 35%,rgba(200,240,255,0.08),transparent 40%);animation:frostShimmer 9s ease-in-out infinite alternate;"},
 {id:"venom",name:"Venom",css:"background-color:#040a06;background-image:radial-gradient(ellipse at 24% 76%,#1c4a24bb,transparent 52%),radial-gradient(ellipse at 76% 34%,#2e5a22bb,transparent 46%),radial-gradient(ellipse at 52% 92%,#0e3a1abb,transparent 50%),radial-gradient(ellipse at 62% 14%,#44721e55,transparent 42%),radial-gradient(circle at 40% 50%,#5a8a2233,transparent 34%);animation:venomPulse 8s ease-in-out infinite alternate;"},
 {id:"galaxy",name:"Galaxy",css:"background-color:#06040e;background-image:radial-gradient(ellipse 58% 78% at 50% 50%,#3a1862 0%,transparent 52%),radial-gradient(ellipse 38% 56% at 50% 50%,#5e2286 0%,transparent 42%),radial-gradient(circle at 50% 50%,#ff66aa2e,transparent 24%);background-size:100% 100%;background-position:center;"},
];
const LAB_SLOT_COSTS=[250,1500,20000];
const AB_DESCS={orbitals_sub1:"Increase the number of electrons by 2.",orbitals_sub2:"Hitting an enemy with any electron deals 30% damage, once per enemy. Marked enemies burn blue and take double flame damage.",orbitals_mastery:"Gain another layer of 4 electrons, that travel in an elliptical orbit.",chain_sub1:"Chain lightning now targets 4 enemies.",chain_sub2:"The original target of the chain lightning gets electrocuted and it receives 60% of damage.",chain_mastery:"Echo Clone, Seeker Swarm and Combat Drone now apply a green chain lightning: it targets 4 enemies for every 3rd successful hit, dealing 25% damage on arc and 40% damage on electrocution.",homing_sub1:"Fires missiles every second.",homing_sub2:"Missiles now have a 15% chance to be critical, dealing 2.5x damage.",homing_mastery:"Missiles activate a burning bomb on hit with a radius of 6 that applies burn that does 10% dmg/s for 5 seconds.",slowfield_sub1:"Increase radius to 18.",slowfield_sub2:"The field effects the max pickup range, causing it to expand to 1.25x what it usually is, before contracting to its regular size, repeating continuously over 6s cycles.",slowfield_mastery:"Slows down bomber enemies that enter your Temporal Drag at the same rate that bullets are slowed down, and any bombers killed in the Temporal Drag will only release half the amount of bullets.",mirror_sub1:"Make the clone have the same fire rate as your main ship.",mirror_sub2:"Currency drops can be picked up by the clone if it directly collides with them.",mirror_mastery:"Every 12 seconds, the clone unleashes a lasso, that winds up for 2 seconds before launching at the most dense group of enemies and moves them away from you, of a radius of 10 and lasts for 4 seconds. Captured enemies cannot attack.",drone_sub1:"If you take HP damage from an enemy, your drone gets mad at it, firing at 2x firing rate. It will solely target that enemy until it is dead.",drone_sub2:"Adds 3% to its damage percentage compared to your main weapon for every other ability you own.",drone_mastery:"Gives you a gift after every wave equal to half of all the pickups you failed to pick up during the wave, rounded up to the nearest integer. Does not activate during intro sprint.",gravity_sub1:"Bullets that are in the gravity well get smaller by 4% every second, for a maximum of 32% size reduction.",gravity_sub2:"The vortex gets a second, conjoined vortex with a radius of 7 that has its own gravitational pull.",gravity_mastery:"Every other time a vortex is activated, it turns golden, and any enemies killed in those golden vortexes drop double the currency. Does not affect boss shard drops.",overcharge_sub1:"Max overcharge amount is increased to 140% of max health.",overcharge_sub2:"Plasma pickups now heal 6 HP instead of 3.",overcharge_mastery:"Overcharge now persists between waves, with a limit of 110% of max health.",blackhole_sub1:"Increase bullets removed to 50%.",blackhole_sub2:"Sniper bullets will be removed first, and any snipers about to fire will have their attack fail.",blackhole_mastery:"Ability will be triggered on shield loss as well as HP damage.",void_regen_sub1:"Increase the max that can be regenerated to 90% of max health (without Overcharge active).",void_regen_sub2:"If you kill at least 1 enemy whilst waiting for void regen to start, the windup time is reduced to 3 seconds.",void_regen_mastery:"Taking no damage for an entire wave grants a golden shield with invincibility frames. Golden shields persist between waves but when lost are lost forever. Maximum of 5 golden shields.",ricochet_sub1:"Bullets that ricochet receive a random small angle offset.",ricochet_sub2:"Bullets can hit one more wall before being destroyed.",ricochet_mastery:"When a ricocheted bullet hits an enemy, it performs a rage slice with a length of 12, dealing 200% damage to the first enemy it hits and 120% damage to all others.",nova_sub1:"Landmines slowly rise up to about the middle of the screen.",nova_sub2:"Landmines deal 4x damage to any bosses that are damaged by the landmine.",nova_mastery:"Landmines persist after waves instead of being cleared."};
function metaMax(id,tier){const up=META.find(u=>u.id===id);return up?up.max*tier:0;}
function metaCost(up,lvl,tier){const t1Max=up.max;let _c;if(tier===1||lvl<t1Max)_c=Math.ceil(up.base*(1+lvl*0.85));else{const t2Start=up.base*55*0.5;_c=Math.ceil(t2Start*(1+(lvl-t1Max)*1.5));}if(tier===3&&(up.id==="m_shield"||up.id==="m_start"))_c=Math.ceil(_c*3.5);return _c;}
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
function shipClip(ctx,x,y,sz){ctx.beginPath();ctx.moveTo(x,y-sz-4);ctx.lineTo(x-sz,y+sz);ctx.lineTo(x,y+sz*0.4);ctx.lineTo(x+sz,y+sz);ctx.closePath();ctx.clip();ctx.shadowColor="rgba(0,0,0,0.9)";ctx.shadowBlur=4;}
const SHIP_DESIGNS=[
 {id:"none",cost:0,draw:null},
 {id:"d1",cost:5,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.fillRect(x-sz*1.5,y+sz*0.3,sz*3,sz*1.2);ctx.globalAlpha=1;ctx.restore();}},
 {id:"d2",cost:8,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.beginPath();ctx.moveTo(x,y-sz-5);ctx.lineTo(x-sz*0.8,y);ctx.lineTo(x+sz*0.8,y);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.restore();}},
 {id:"d3",cost:12,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.75;ctx.fillRect(x,y-sz*1.5,sz*1.5,sz*3);ctx.globalAlpha=1;ctx.restore();}},
 {id:"d4",cost:15,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.beginPath();ctx.arc(x,y+sz*0.05,sz*0.6,0,PI2);ctx.fill();ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(x,y+sz*0.05,sz*0.3,0,PI2);ctx.fill();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(x,y+sz*0.05,sz*0.15,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.restore();}},
 {id:"d5",cost:18,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.fillRect(x-sz*1.5,y-sz*0.6,sz*3,sz*0.25);ctx.fillRect(x-sz*1.5,y-sz*0.05,sz*3,sz*0.25);ctx.fillRect(x-sz*1.5,y+sz*0.5,sz*3,sz*0.25);ctx.globalAlpha=1;ctx.restore();}},
 {id:"d6",cost:22,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.beginPath();ctx.moveTo(x-sz*1.2,y);ctx.lineTo(x,y-sz*0.6);ctx.lineTo(x+sz*1.2,y);ctx.lineTo(x+sz*1.2,y+sz*0.3);ctx.lineTo(x,y-sz*0.3);ctx.lineTo(x-sz*1.2,y+sz*0.3);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(x-sz*1.2,y+sz*0.5);ctx.lineTo(x,y-sz*0.1);ctx.lineTo(x+sz*1.2,y+sz*0.5);ctx.lineTo(x+sz*1.2,y+sz*0.8);ctx.lineTo(x,y+sz*0.2);ctx.lineTo(x-sz*1.2,y+sz*0.8);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.restore();}},
 {id:"d7",cost:28,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.85;ctx.fillRect(x-sz*0.18,y-sz*1.5,sz*0.36,sz*3);ctx.fillRect(x-sz*1.5,y-sz*0.15,sz*3,sz*0.36);ctx.globalAlpha=1;ctx.restore();}},
 {id:"d8",cost:35,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.beginPath();ctx.moveTo(x,y-sz*0.7);ctx.lineTo(x+sz*0.55,y+sz*0.05);ctx.lineTo(x,y+sz*0.8);ctx.lineTo(x-sz*0.55,y+sz*0.05);ctx.closePath();ctx.fill();ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.moveTo(x,y-sz*0.45);ctx.lineTo(x+sz*0.32,y+sz*0.05);ctx.lineTo(x,y+sz*0.55);ctx.lineTo(x-sz*0.32,y+sz*0.05);ctx.closePath();ctx.fill();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(x,y+sz*0.05,sz*0.13,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.restore();}},
 {id:"d9",cost:40,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;for(let i=0;i<3;i++){const o=i*sz*0.55-sz*0.55;ctx.beginPath();ctx.moveTo(x-sz*1.3+o,y+sz);ctx.lineTo(x-sz*0.3+o,y-sz);ctx.lineTo(x-sz*0.05+o,y-sz);ctx.lineTo(x-sz*1.05+o,y+sz);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;ctx.restore();}},
 {id:"d10",cost:48,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.beginPath();for(let i=0;i<6;i++){const a=(PI2/6)*i+Math.PI/6;const px=x+Math.cos(a)*sz*0.6;const py=y+sz*0.05+Math.sin(a)*sz*0.6;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();ctx.globalCompositeOperation="destination-out";ctx.beginPath();for(let i=0;i<6;i++){const a=(PI2/6)*i+Math.PI/6;const px=x+Math.cos(a)*sz*0.4;const py=y+sz*0.05+Math.sin(a)*sz*0.4;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=0.9;ctx.fillRect(x-sz*0.08,y-sz*0.05,sz*0.16,sz*0.2);ctx.globalAlpha=1;ctx.restore();}},
 {id:"d11",cost:55,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;ctx.beginPath();const cx=x,cy=y+sz*0.05;for(let i=0;i<10;i++){const a=(PI2/10)*i-Math.PI/2;const r=i%2===0?sz*0.7:sz*0.32;const px=cx+Math.cos(a)*r;const py=cy+Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.restore();}},
 {id:"d12",cost:65,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.8;for(let i=0;i<3;i++){const s=1-i*0.28;ctx.beginPath();ctx.moveTo(x,y-sz*0.6*s+sz*0.1);ctx.lineTo(x-sz*0.7*s,y+sz*0.4*s+sz*0.1);ctx.lineTo(x-sz*0.4*s,y+sz*0.4*s+sz*0.1);ctx.lineTo(x,y-sz*0.2*s+sz*0.1);ctx.lineTo(x+sz*0.4*s,y+sz*0.4*s+sz*0.1);ctx.lineTo(x+sz*0.7*s,y+sz*0.4*s+sz*0.1);ctx.closePath();ctx.fill();ctx.globalCompositeOperation="destination-out";ctx.fillRect(x-sz*1.5,y+sz*0.42*s+sz*0.1,sz*3,sz*0.05);ctx.globalCompositeOperation="source-over";}ctx.globalAlpha=1;ctx.restore();}},
 {id:"d13",cost:75,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;ctx.globalAlpha=0.75;const cx=x,cy=y+sz*0.1;for(let i=0;i<8;i++){const a=(PI2/8)*i;const px=cx+Math.cos(a)*sz*0.4;const py=cy+Math.sin(a)*sz*0.4;ctx.beginPath();ctx.ellipse(px,py,sz*0.18,sz*0.32,a,0,PI2);ctx.fill();}ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(cx,cy,sz*0.18,0,PI2);ctx.fill();ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(cx,cy,sz*0.08,0,PI2);ctx.fill();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;ctx.restore();}},
 {id:"d14",cost:88,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);ctx.fillStyle=col;const cx=x,cy=y+sz*0.05;ctx.strokeStyle=col;ctx.lineWidth=sz*0.13;ctx.globalAlpha=0.8;ctx.beginPath();ctx.arc(cx,cy,sz*0.55,0,PI2);ctx.stroke();ctx.globalAlpha=0.85;ctx.fillRect(x-sz*0.13,cy-sz*0.45,sz*0.26,sz*0.9);ctx.fillRect(x-sz*0.45,cy-sz*0.13,sz*0.9,sz*0.26);ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.moveTo(cx,cy-sz*0.18);ctx.lineTo(cx+sz*0.18,cy);ctx.lineTo(cx,cy+sz*0.18);ctx.lineTo(cx-sz*0.18,cy);ctx.closePath();ctx.fill();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(cx,cy,sz*0.07,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.restore();}},
 {id:"d15",cost:100,draw:(ctx,x,y,sz,col)=>{ctx.save();shipClip(ctx,x,y,sz);const cx=x,cy=y+sz*0.05;ctx.fillStyle=col;ctx.globalAlpha=0.7;ctx.beginPath();for(let i=0;i<16;i++){const a=(PI2/16)*i-Math.PI/2;const r=i%2===0?sz*0.85:sz*0.55;const px=cx+Math.cos(a)*r;const py=cy+Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(cx,cy,sz*0.45,0,PI2);ctx.fill();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=0.85;ctx.fillRect(x-sz*0.1,cy-sz*0.42,sz*0.2,sz*0.84);ctx.fillRect(x-sz*0.42,cy-sz*0.1,sz*0.84,sz*0.2);ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(cx,cy,sz*0.13,0,PI2);ctx.fill();ctx.globalCompositeOperation="source-over";ctx.globalAlpha=0.95;ctx.beginPath();ctx.arc(cx,cy,sz*0.08,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.restore();}},
];
function makeStars(n){ const s=[]; for(let i=0;i<n;i++) s.push({x:rand(0,GW),y:rand(0,GH),sz:rand(0.5,2),sp:rand(0.3,1.2),br:rand(0.3,0.8)}); return s; }
let _bgShared=null;function getBgShared(){if(_bgShared)return _bgShared;const stars=[];for(let i=0;i<160;i++)stars.push({x:rand(0,GW),y:rand(0,GH),sz:rand(0.3,2.2),sp:rand(0.08,0.4),br:rand(0.15,0.85),pulse:rand(0,6.28),pulseSpd:rand(0.001,0.003),layer:i<40?0:i<100?1:2});for(let i=0;i<12;i++){let bx,by;do{bx=rand(0,GW);by=rand(0,GH);}while(bx>GW*0.2&&bx<GW*0.8&&by>GH*0.15&&by<GH*0.85);stars.push({x:bx,y:by,sz:rand(2.5,4),sp:rand(0.02,0.08),br:rand(0.6,1.0),pulse:rand(0,6.28),pulseSpd:rand(0.002,0.006),layer:3,col:pick(["#00e5ff","#bb77ff","#ffcc44","#ff66aa","#44ff88"])});}
const neb=[{x:GW*0.3,y:GH*0.25,r:220,col:"#00e5ff",drift:0.03,driftY:0.01,opc:0.22},{x:GW*0.7,y:GH*0.6,r:180,col:"#bb77ff",drift:-0.04,driftY:-0.02,opc:0.18},{x:GW*0.5,y:GH*0.8,r:250,col:"#ff335544",drift:0.02,driftY:0.015,opc:0.14},{x:GW*0.15,y:GH*0.65,r:140,col:"#44ff8833",drift:0.05,driftY:-0.01,opc:0.16},{x:GW*0.85,y:GH*0.2,r:160,col:"#ff884433",drift:-0.03,driftY:0.02,opc:0.12}];
const deb=[];for(let i=0;i<8;i++)deb.push({x:rand(0,GW),y:rand(0,GH),sz:rand(8,22),rot:rand(0,6.28),rotSpd:rand(-0.0008,0.0008),spY:rand(0.04,0.15),spX:rand(-0.03,0.03),sides:pick([3,5,6]),col:pick(["#00e5ff","#bb77ff","#44ddcc","#ff66aa"]),opc:rand(0.06,0.12)});
_bgShared={stars,neb,deb};return _bgShared;}
function drawShape(ctx,type,x,y,s,col,time,extra){
 ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=2;
 switch(type){
 case"drone":{ctx.beginPath();ctx.moveTo(x,y+s);ctx.lineTo(x-s*0.8,y-s*0.7);ctx.lineTo(x-s*0.2,y-s*0.3);ctx.lineTo(x+s*0.2,y-s*0.3);ctx.lineTo(x+s*0.8,y-s*0.7);ctx.closePath();ctx.fill();ctx.fillStyle="#06060e";ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(x,y+s*0.2,s*0.2,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;const _dt=(time||0)*0.008;ctx.globalAlpha=0.4+Math.sin(_dt)*0.2;ctx.fillStyle=extra?._cardMode?"#aa77dd":"#ff8833";ctx.beginPath();ctx.arc(x,y+s+2,2+Math.sin(_dt)*1,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;break;}
 case"weaver":{ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.7,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.7,y);ctx.closePath();ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.globalAlpha=0.4;const _wt=(time||0)*0.006;for(let wi=0;wi<2;wi++){const _ws=wi===0?-1:1;ctx.beginPath();ctx.moveTo(x+_ws*s*0.5,y+s*0.3);for(let wj=0;wj<6;wj++){const wx=x+_ws*(s*0.5+wj*3);const wy=y+s*0.3+wj*3+Math.sin(_wt+wj*0.8)*3;ctx.lineTo(wx,wy);}ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle="#06060e";ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(x,y,s*0.15,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;break;}
 case"sprayer":{ctx.beginPath();for(let i=0;i<6;i++){const a=(PI2/6)*i-Math.PI/6;ctx.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}ctx.closePath();ctx.fill();ctx.fillStyle="#06060e";ctx.globalAlpha=0.35;ctx.beginPath();ctx.arc(x,y,s*0.45,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,s*0.25,0,PI2);ctx.fill();const _st=(time||0)*0.003;for(let si=0;si<3;si++){const sa=_st+(PI2/3)*si;ctx.globalAlpha=0.5;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+Math.cos(sa)*s*0.3,y+Math.sin(sa)*s*0.3);ctx.lineTo(x+Math.cos(sa)*s*0.85,y+Math.sin(sa)*s*0.85);ctx.stroke();}ctx.globalAlpha=1;break;}
 case"tank":{ctx.save();ctx.translate(x,y);
 ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-s*0.7,-s*0.75);ctx.lineTo(s*0.7,-s*0.75);ctx.lineTo(s*0.85,-s*0.3);ctx.lineTo(s*0.85,s*0.6);ctx.lineTo(s*0.6,s*0.85);ctx.lineTo(-s*0.6,s*0.85);ctx.lineTo(-s*0.85,s*0.6);ctx.lineTo(-s*0.85,-s*0.3);ctx.closePath();ctx.fill();
 ctx.fillRect(-s*0.12,-s*1.1,s*0.24,s*0.5);
 ctx.strokeStyle="#06060e";ctx.lineWidth=1;ctx.globalAlpha=0.35;ctx.beginPath();ctx.moveTo(-s*0.5,-s*0.3);ctx.lineTo(s*0.5,-s*0.3);ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.5,s*0.3);ctx.lineTo(s*0.5,s*0.3);ctx.stroke();
 ctx.globalAlpha=0.6;ctx.fillStyle=extra?._cardMode?"#9966cc88":"#ff666688";ctx.fillRect(-s*0.35,-s*0.55,s*0.7,s*0.12);
 ctx.globalAlpha=1;ctx.restore();break;}
 case"bomber":{ctx.beginPath();ctx.arc(x,y,s*0.7,0,PI2);ctx.fill();const _bp=0.5+Math.sin((time||0)*0.01)*0.3;ctx.fillStyle="#06060e";ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(x,y,s*0.3,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;ctx.strokeStyle=extra?._cardMode?col:"#ffee88";ctx.lineWidth=2;ctx.globalAlpha=_bp;ctx.beginPath();ctx.arc(x,y,s+(time?Math.sin(time*0.01)*3:0),0,PI2);ctx.stroke();if(!extra?._cardMode){ctx.globalAlpha=0.25;ctx.lineWidth=1;ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(x,y,s*1.4,0,PI2);ctx.stroke();ctx.setLineDash([]);}ctx.globalAlpha=1;break;}
 case"sniper":{ctx.fillRect(x-2,y-s,4,s*2);ctx.fillRect(x-s*0.5,y-2,s,4);ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(x,y,s*0.55,0,PI2);ctx.stroke();ctx.globalAlpha=0.6;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,s*0.15,0,PI2);ctx.fill();ctx.globalAlpha=1;}
 if(extra?.telegraphing||extra?._sniperLineActive){const _sa=extra.aimAngle||0;const _cos=Math.cos(_sa),_sin=Math.sin(_sa);let _endX=x,_endY=y;for(let _step=0;_step<2000;_step+=2){_endX+=_cos*2;_endY+=_sin*2;if(_endX<0||_endX>600||_endY<0||_endY>800)break;}let _lCol="#ff66ffaa";if(extra?.telegraphing&&(extra.teleTimer||0)<1000&&(extra.teleTimer||0)>=200){_lCol="#ffcc44cc";}else if(extra?.telegraphing&&(extra.teleTimer||0)<200){_lCol="#ff3344dd";}else if(extra?._sniperLineActive){_lCol="#ff3344dd";}ctx.strokeStyle=_lCol;ctx.lineWidth=extra?._sniperLineActive?2.5:2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(_endX,_endY);ctx.stroke();ctx.setLineDash([]);}
 break;
 case"splitter":{
 const _isChild=extra&&extra.size&&extra.size<=10;
 if(_isChild){ctx.globalAlpha=0.85;ctx.beginPath();ctx.arc(x,y,s*0.75,0,PI2);ctx.fill();ctx.fillStyle="#06060e";ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(x,y,s*0.25,0,PI2);ctx.fill();ctx.globalAlpha=0.5;ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,s*0.75,0,PI2);ctx.stroke();ctx.globalAlpha=1;}
 else{const _spt=(time||0)*0.003;const _spBr=Math.sin(_spt)*0.8;
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
 case"pulse":{ctx.beginPath();for(let i=0;i<8;i++){const a=(PI2/8)*i-Math.PI/2;const r=i%2===0?s:s*0.45;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.fillStyle="#06060e";ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(x,y,s*0.25,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;const _pt=(time||0)*0.004;ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=0.25+Math.sin(_pt)*0.15;ctx.beginPath();ctx.arc(x,y,s*1.2+Math.sin(_pt)*3,0,PI2);ctx.stroke();ctx.globalAlpha=0.15;ctx.beginPath();ctx.arc(x,y,s*1.6+Math.sin(_pt+1)*4,0,PI2);ctx.stroke();ctx.globalAlpha=1;break;}
 case"orbiter": ctx.beginPath();ctx.arc(x,y,s*0.5,0,PI2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=col;const oa=time?time*0.003:0;for(let i=0;i<3;i++){const ba=oa+(PI2/3)*i;ctx.beginPath();ctx.arc(x+Math.cos(ba)*s*0.85,y+Math.sin(ba)*s*0.85,3,0,PI2);ctx.fill();}break;
 case"charger":{const sa=extra?.spinAngle||0;ctx.save();ctx.translate(x,y);ctx.rotate(sa);ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*0.9,s*0.5);ctx.lineTo(-s*0.9,s*0.5);ctx.closePath();ctx.fill();
 ctx.fillStyle="#06060e";ctx.globalAlpha=0.25;ctx.beginPath();ctx.moveTo(0,-s*0.4);ctx.lineTo(s*0.35,s*0.2);ctx.lineTo(-s*0.35,s*0.2);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;
 const chPct=extra?.chargeTimer>0?1-(extra.chargeTimer/(extra.fireRate||4000)):0;
 ctx.fillStyle=extra?._cardMode?"#e0ccff":"#fff";ctx.globalAlpha=0.3+chPct*0.5;ctx.beginPath();ctx.arc(0,0,s*(0.25+chPct*0.15),0,PI2);ctx.fill();
 if(chPct>0.3){ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.globalAlpha=chPct*0.6;ctx.beginPath();ctx.arc(0,0,s*0.7,0,PI2*chPct);ctx.stroke();}
 ctx.globalAlpha=1;ctx.restore();break;}
 case"boss":{ctx.shadowColor=col;ctx.shadowBlur=12;const p=1+(time?Math.sin(time*0.004)*0.06:0);const z=s*p;ctx.beginPath();ctx.moveTo(x,y-z);ctx.lineTo(x-z*1.1,y+z*0.5);ctx.lineTo(x-z*0.35,y+z*0.25);ctx.lineTo(x,y+z*0.8);ctx.lineTo(x+z*0.35,y+z*0.25);ctx.lineTo(x+z*1.1,y+z*0.5);ctx.closePath();ctx.fill();ctx.shadowBlur=0;break;}
 case"wraith":{const wa=extra?.phaseCD>0?0.25:0.75+Math.sin((time||0)*0.006)*0.2;ctx.globalAlpha=wa;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.7,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.7,y);ctx.closePath();ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,s*0.2,0,PI2);ctx.fill();ctx.globalAlpha=1;break;}
 case"siren":{ctx.shadowColor=col;ctx.shadowBlur=8;ctx.beginPath();for(let i=0;i<6;i++){const a=(PI2/6)*i-Math.PI/2;const r=i%2===0?s:s*0.3;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.shadowBlur=0;const _sit=(time||0)*0.005;ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=0.2+Math.sin(_sit)*0.1;ctx.beginPath();ctx.arc(x,y,s*0.6,_sit,_sit+Math.PI*0.8);ctx.stroke();ctx.globalAlpha=0.15;ctx.beginPath();ctx.arc(x,y,s*0.9,_sit+Math.PI,_sit+Math.PI*1.6);ctx.stroke();ctx.globalAlpha=1;break;}
 case"fortress":{ctx.fillRect(x-s*0.6,y-s*0.6,s*1.2,s*1.2);ctx.strokeStyle=extra?._cardMode?"#ddbbff":"#ffffff";ctx.lineWidth=3;ctx.globalAlpha=0.7;const sa=extra?.shieldAngle||0;if(!extra?._dx?.shieldOff){const _fhw=0.8*(extra?._dx?.shieldArcM||1);ctx.beginPath();ctx.arc(x,y,s*1.15,sa-_fhw,sa+_fhw);ctx.stroke();if(extra?._dx?.shieldDouble){ctx.beginPath();ctx.arc(x,y,s*1.15,sa+Math.PI-_fhw,sa+Math.PI+_fhw);ctx.stroke();}}ctx.globalAlpha=1;break;}
 case"reaper":{ctx.save();ctx.translate(x,y);ctx.rotate((extra?.rotOff||0)+(time||0)*(extra?.rotSpd||0.002));ctx.beginPath();ctx.arc(0,0,s*0.9,0,PI2);ctx.fill();ctx.fillStyle="#06060e";ctx.beginPath();ctx.arc(s*0.35,0,s*0.7,0,PI2);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(-s*0.2,0,s*0.22,0,PI2);ctx.fill();ctx.restore();break;}
 default: ctx.beginPath();ctx.arc(x,y,s,0,PI2);ctx.fill();
 }
}
function drawAbIcon(ctx,id,cx,cy,sz,col){
 ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=Math.max(1,sz*0.08);ctx.lineCap="round";ctx.lineJoin="round";
 const s=sz*0.4;
 switch(id){
 case"orbitals":{ctx.beginPath();ctx.arc(0,0,s*0.25,0,PI2);ctx.fill();ctx.globalAlpha=0.5;ctx.beginPath();ctx.ellipse(0,0,s*0.85,s*0.35,0.3,0,PI2);ctx.stroke();ctx.globalAlpha=1;for(let i=0;i<2;i++){const a=i*Math.PI;ctx.beginPath();ctx.arc(Math.cos(a+0.3)*s*0.85,Math.sin(a+0.3)*s*0.35,s*0.12,0,PI2);ctx.fill();}break;}
 case"chain":{ctx.lineWidth*=1.5;ctx.beginPath();ctx.moveTo(-s*0.15,-s);ctx.lineTo(s*0.15,-s*0.15);ctx.lineTo(-s*0.1,-s*0.05);ctx.lineTo(s*0.2,s*0.8);ctx.stroke();ctx.lineWidth*=0.5;ctx.globalAlpha=0.6;ctx.beginPath();ctx.moveTo(s*0.15,-s*0.15);ctx.lineTo(s*0.6,s*0.1);ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.1,-s*0.05);ctx.lineTo(-s*0.55,s*0.25);ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(s*0.2,s*0.8,s*0.12,0,PI2);ctx.fill();ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(s*0.6,s*0.1,s*0.08,0,PI2);ctx.fill();ctx.beginPath();ctx.arc(-s*0.55,s*0.25,s*0.08,0,PI2);ctx.fill();ctx.globalAlpha=1;break;}
 case"homing":{ctx.beginPath();ctx.arc(0,0,s*0.55,0,PI2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(0,-s*0.35);ctx.moveTo(0,s);ctx.lineTo(0,s*0.35);ctx.moveTo(-s,0);ctx.lineTo(-s*0.35,0);ctx.moveTo(s,0);ctx.lineTo(s*0.35,0);ctx.stroke();ctx.beginPath();ctx.arc(0,0,s*0.12,0,PI2);ctx.fill();break;}
 case"nova":{const spikes=8;for(let i=0;i<spikes;i++){const a=(PI2/spikes)*i;ctx.beginPath();ctx.moveTo(Math.cos(a)*s*0.2,Math.sin(a)*s*0.2);ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s);ctx.stroke();}ctx.beginPath();ctx.arc(0,0,s*0.22,0,PI2);ctx.fill();break;}
 case"slowfield":{ctx.beginPath();ctx.moveTo(-s*0.55,-s*0.85);ctx.lineTo(s*0.55,-s*0.85);ctx.lineTo(s*0.08,0);ctx.lineTo(s*0.55,s*0.85);ctx.lineTo(-s*0.55,s*0.85);ctx.lineTo(-s*0.08,0);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.45,-s*0.85);ctx.lineTo(s*0.45,-s*0.85);ctx.stroke();ctx.beginPath();ctx.moveTo(-s*0.45,s*0.85);ctx.lineTo(s*0.45,s*0.85);ctx.stroke();break;}
 case"mirror":{ctx.globalAlpha=0.4;ctx.beginPath();ctx.moveTo(-s*0.35,-s*0.6);ctx.lineTo(-s*0.65,s*0.5);ctx.lineTo(-s*0.35,s*0.2);ctx.lineTo(-s*0.05,s*0.5);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(s*0.35,-s*0.6);ctx.lineTo(s*0.05,s*0.5);ctx.lineTo(s*0.35,s*0.2);ctx.lineTo(s*0.65,s*0.5);ctx.closePath();ctx.fill();break;}
 case"ricochet":{ctx.beginPath();ctx.moveTo(-s*0.7,s*0.4);ctx.lineTo(0,-s*0.5);ctx.lineTo(s*0.7,s*0.4);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-s*0.5);ctx.lineTo(s*0.2,-s*0.9);ctx.stroke();ctx.globalAlpha=0.3;ctx.beginPath();ctx.moveTo(-s*0.9,-s*0.9);ctx.lineTo(s*0.9,-s*0.9);ctx.stroke();ctx.globalAlpha=1;break;}
 case"drone":{ctx.fillRect(-s*0.35,-s*0.35,s*0.7,s*0.7);ctx.strokeRect(-s*0.5,-s*0.5,s,s);ctx.beginPath();ctx.moveTo(0,-s*0.5);ctx.lineTo(0,-s*0.85);ctx.stroke();ctx.beginPath();ctx.arc(0,-s*0.85,s*0.08,0,PI2);ctx.fill();break;}
 case"gravity":{ctx.beginPath();for(let i=0;i<40;i++){const t=i/40*PI2*2;const r=s*0.15+i/40*s*0.7;ctx.lineTo(Math.cos(t)*r,Math.sin(t)*r);}ctx.stroke();break;}
 case"overcharge":{ctx.beginPath();ctx.moveTo(0,-s*0.9);ctx.lineTo(s*0.6,0);ctx.lineTo(0,s*0.9);ctx.lineTo(-s*0.6,0);ctx.closePath();ctx.stroke();ctx.lineWidth*=1.3;ctx.beginPath();ctx.moveTo(0,-s*0.3);ctx.lineTo(0,s*0.3);ctx.moveTo(-s*0.3,0);ctx.lineTo(s*0.3,0);ctx.stroke();break;}
 case"blackhole":{ctx.globalAlpha=0.15;ctx.beginPath();ctx.arc(0,0,s*0.35,0,PI2);ctx.fill();ctx.globalAlpha=0.6;ctx.lineWidth*=0.7;ctx.beginPath();ctx.arc(0,0,s*0.35,0,PI2);ctx.stroke();ctx.globalAlpha=0.7;ctx.lineWidth*=1.7;ctx.save();ctx.scale(1,0.4);ctx.beginPath();ctx.arc(0,0,s,0,PI2);ctx.stroke();ctx.restore();ctx.globalAlpha=0.35;ctx.save();ctx.rotate(Math.PI/3);ctx.scale(1,0.4);ctx.beginPath();ctx.arc(0,0,s,0,PI2);ctx.stroke();ctx.restore();ctx.save();ctx.rotate(-Math.PI/3);ctx.scale(1,0.4);ctx.beginPath();ctx.arc(0,0,s,0,PI2);ctx.stroke();ctx.restore();ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(0,0,s*0.15,0,PI2);ctx.fill();ctx.globalAlpha=1;break;}
 case"void_regen":{ctx.beginPath();ctx.moveTo(0,s*0.7);ctx.bezierCurveTo(-s*0.8,s*0.1,-s*0.8,-s*0.6,0,-s*0.2);ctx.bezierCurveTo(s*0.8,-s*0.6,s*0.8,s*0.1,0,s*0.7);ctx.stroke();ctx.lineWidth*=0.8;ctx.beginPath();ctx.moveTo(0,-s*0.05);ctx.lineTo(0,s*0.35);ctx.moveTo(-s*0.18,s*0.15);ctx.lineTo(s*0.18,s*0.15);ctx.stroke();break;}
 default:{ctx.beginPath();ctx.arc(0,0,s*0.5,0,PI2);ctx.stroke();}
 }
 ctx.restore();
}
function drawUpgIcon(cx,id,S,col){
 cx.clearRect(0,0,S,S);cx.save();
 cx.strokeStyle=col;cx.fillStyle=col;cx.lineJoin="round";cx.lineCap="round";
 const C=S/2,P=S/100,LW=Math.max(2,S*0.1);cx.lineWidth=LW;
 const ring=(x,y,r)=>{cx.beginPath();cx.arc(x,y,r,0,6.2832);cx.stroke();};
 const disc=(x,y,r)=>{cx.beginPath();cx.arc(x,y,r,0,6.2832);cx.fill();};
 const ln=(a,b,c,d)=>{cx.beginPath();cx.moveTo(a,b);cx.lineTo(c,d);cx.stroke();};
 const arr=(a,b,c,d)=>{ln(a,b,c,d);const an=Math.atan2(d-b,c-a),h=15*P;cx.beginPath();cx.moveTo(c,d);cx.lineTo(c-h*Math.cos(an-0.5),d-h*Math.sin(an-0.5));cx.moveTo(c,d);cx.lineTo(c-h*Math.cos(an+0.5),d-h*Math.sin(an+0.5));cx.stroke();};
 const rr=(x,y,w,h,r,f)=>{cx.beginPath();cx.moveTo(x+r,y);cx.lineTo(x+w-r,y);cx.arcTo(x+w,y,x+w,y+r,r);cx.lineTo(x+w,y+h-r);cx.arcTo(x+w,y+h,x+w-r,y+h,r);cx.lineTo(x+r,y+h);cx.arcTo(x,y+h,x,y+h-r,r);cx.lineTo(x,y+r);cx.arcTo(x,y,x+r,y,r);cx.closePath();f?cx.fill():cx.stroke();};
 const shield=()=>{const t=36*P;cx.beginPath();cx.moveTo(C,C-t);cx.lineTo(C+t*0.8,C-t*0.5);cx.lineTo(C+t*0.8,C+t*0.18);cx.quadraticCurveTo(C+t*0.8,C+t*0.72,C,C+t);cx.quadraticCurveTo(C-t*0.8,C+t*0.72,C-t*0.8,C+t*0.18);cx.lineTo(C-t*0.8,C-t*0.5);cx.closePath();cx.stroke();};
 switch(id){
  case "dl_s2": case "dl_s3":{const n=id==="dl_s3"?3:2;const cw=33*P,ch=50*P,ox=16*P,oy=7*P;const tot=cw+(n-1)*ox;const x0=C-tot/2;const y0=C-ch/2+(n-1)*oy/2;for(let i=0;i<n;i++){rr(x0+i*ox,y0-i*oy,cw,ch,5*P,false);}break;}
  case "bt_jam":{ring(C,C,27*P);ln(C-37*P,C,C-12*P,C);ln(C+12*P,C,C+37*P,C);ln(C,C-37*P,C,C-12*P);ln(C,C+12*P,C,C+37*P);disc(C,C,4*P);cx.lineWidth=LW*1.3;ln(C-24*P,C-24*P,C+24*P,C+24*P);break;}
  case "bt_spd":{cx.lineWidth=LW*1.2;for(let i=0;i<2;i++){const y=C-4*P+i*22*P;cx.beginPath();cx.moveTo(C-26*P,y+13*P);cx.lineTo(C,y-11*P);cx.lineTo(C+26*P,y+13*P);cx.stroke();}break;}
  case "bt_field":{disc(C,C,7*P);ring(C,C,20*P);cx.globalAlpha=0.55;ring(C,C,33*P);cx.globalAlpha=1;break;}
  case "sp_stop":{cx.beginPath();const r=34*P;for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;const x=C+Math.cos(a)*r,y=C+Math.sin(a)*r;i?cx.lineTo(x,y):cx.moveTo(x,y);}cx.closePath();cx.fill();break;}
  case "sp_boss":{cx.beginPath();cx.arc(C,C-3*P,24*P,Math.PI,0,false);cx.lineTo(C+17*P,C+16*P);cx.lineTo(C+9*P,C+16*P);cx.lineTo(C+9*P,C+26*P);cx.lineTo(C-9*P,C+26*P);cx.lineTo(C-9*P,C+16*P);cx.lineTo(C-17*P,C+16*P);cx.closePath();cx.stroke();cx.fillStyle="#10101a";disc(C-10*P,C-2*P,8*P);disc(C+10*P,C-2*P,8*P);cx.fillStyle=col;disc(C-10*P,C-2*P,4*P);disc(C+10*P,C-2*P,4*P);break;}
  case "sp_dmg":{cx.beginPath();cx.moveTo(C+9*P,C-34*P);cx.lineTo(C-18*P,C+5*P);cx.lineTo(C-2*P,C+5*P);cx.lineTo(C-9*P,C+34*P);cx.lineTo(C+20*P,C-7*P);cx.lineTo(C+3*P,C-7*P);cx.closePath();cx.fill();break;}
  case "ph_wave":{for(let i=1;i<=3;i++){cx.globalAlpha=1-(i-1)*0.22;ring(C,C,i*12*P);}cx.globalAlpha=1;disc(C,C,5*P);break;}
  case "pr_shield":{shield();cx.lineWidth=LW;ln(C,C-10*P,C,C+12*P);ln(C-11*P,C+1*P,C+11*P,C+1*P);break;}
  case "ef_shield":{shield();cx.fillStyle=col;disc(C,C+1*P,6*P);break;}
  case "pr_diff":{for(let i=0;i<5;i++){const a=i*1.25664-1.5708;const x=C+Math.cos(a)*29*P,y=C+Math.sin(a)*29*P;ln(C+Math.cos(a)*13*P,C+Math.sin(a)*13*P,x,y);disc(x,y,5*P);}disc(C,C,8*P);break;}
  case "cg_rev":{arr(C-13*P,C+28*P,C-13*P,C-28*P);arr(C+13*P,C-28*P,C+13*P,C+28*P);break;}
  case "cg_regen":{rr(C-31*P,C-19*P,62*P,30*P,5*P,false);disc(C-16*P,C+22*P,5*P);disc(C+16*P,C+22*P,5*P);cx.lineWidth=LW;ln(C,C-13*P,C,C+5*P);ln(C-9*P,C-4*P,C+9*P,C-4*P);break;}
  default:{ring(C,C,24*P);}
 }
 cx.restore();
}
function drawPathIcon(ctx,id,cx,cy,sz,col){
 ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=Math.max(1.4,sz*0.1);ctx.lineCap="round";ctx.lineJoin="round";const s=sz*0.5;
 switch(id){
 case"phantom":{ctx.beginPath();ctx.moveTo(-s*0.8,s*0.9);ctx.lineTo(-s*0.8,-s*0.15);ctx.arc(0,-s*0.15,s*0.8,Math.PI,0);ctx.lineTo(s*0.8,s*0.9);ctx.lineTo(s*0.45,s*0.55);ctx.lineTo(s*0.15,s*0.9);ctx.lineTo(-s*0.15,s*0.55);ctx.lineTo(-s*0.45,s*0.9);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(-s*0.3,-s*0.1,s*0.13,0,PI2);ctx.fill();ctx.beginPath();ctx.arc(s*0.3,-s*0.1,s*0.13,0,PI2);ctx.fill();break;}
 case"practise":{ctx.beginPath();ctx.arc(0,0,s*0.9,0,PI2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,s*0.45,0,PI2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,s*0.1,0,PI2);ctx.fill();ctx.beginPath();ctx.moveTo(0,-s*1.15);ctx.lineTo(0,-s*0.7);ctx.moveTo(0,s*1.15);ctx.lineTo(0,s*0.7);ctx.moveTo(-s*1.15,0);ctx.lineTo(-s*0.7,0);ctx.moveTo(s*1.15,0);ctx.lineTo(s*0.7,0);ctx.stroke();break;}
 case"enforcer":{ctx.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*PI2/5;const a2=a+PI2/10;ctx.lineTo(Math.cos(a)*s,Math.sin(a)*s);ctx.lineTo(Math.cos(a2)*s*0.45,Math.sin(a2)*s*0.45);}ctx.closePath();ctx.stroke();break;}
 case"cargo":{ctx.strokeRect(-s*0.8,-s*0.7,s*1.6,s*1.4);ctx.beginPath();ctx.moveTo(-s*0.8,-s*0.22);ctx.lineTo(s*0.8,-s*0.22);ctx.moveTo(0,-s*0.7);ctx.lineTo(0,-s*0.22);ctx.stroke();break;}
 case"dealer":{ctx.save();ctx.rotate(0.16);ctx.strokeRect(-s*0.62,-s*0.85,s*1.24,s*1.7);ctx.restore();ctx.beginPath();ctx.moveTo(0,-s*0.42);ctx.lineTo(s*0.36,0);ctx.lineTo(0,s*0.42);ctx.lineTo(-s*0.36,0);ctx.closePath();ctx.stroke();break;}
 case"bots":{ctx.strokeRect(-s*0.7,-s*0.5,s*1.4,s*1.1);ctx.beginPath();ctx.moveTo(0,-s*0.5);ctx.lineTo(0,-s*0.92);ctx.stroke();ctx.beginPath();ctx.arc(0,-s*0.98,s*0.12,0,PI2);ctx.fill();ctx.beginPath();ctx.arc(-s*0.28,s*0.02,s*0.13,0,PI2);ctx.fill();ctx.beginPath();ctx.arc(s*0.28,s*0.02,s*0.13,0,PI2);ctx.fill();break;}
 case"intro_sprint":{for(let i=-1;i<=1;i++){const ox=i*s*0.52;ctx.beginPath();ctx.moveTo(ox-s*0.4,-s*0.7);ctx.lineTo(ox+s*0.32,0);ctx.lineTo(ox-s*0.4,s*0.7);ctx.stroke();}break;}
 default:{ctx.beginPath();ctx.arc(0,0,s*0.6,0,PI2);ctx.stroke();}
 }
 ctx.restore();
}
const PATH_DEFS=[
 {id:"phantom",name:"PHANTOM",col:"#cc66cc"},
 {id:"practise",name:"PRACTISE",col:"#cc9966"},
 {id:"enforcer",name:"ENFORCER",col:"#ff5577"},
 {id:"cargo",name:"CARGO",col:"#88cc66"},
 {id:"dealer",name:"DEALER",col:"#bb77ff"},
 {id:"bots",name:"BOTS",col:"#55ddaa"},
 {id:"intro_sprint",name:"INTRO SPRINT",col:"#44ccaa"},
];
const PATH_UPG={
 dealer:[
  {id:"dl_s2",name:"Dealer Path Upgrade 1",cost:120,parent:null,icon:"II",desc:"Increase your maximum active card slots to 2. (New card offers never re-roll an enemy that already carries a buff or nerf, and an enemy that has been buffed can never later be nerfed.)"},
  {id:"dl_s3",name:"Dealer Path Upgrade 2",cost:300,parent:"dl_s2",icon:"III",desc:"Increase your maximum active card slots to 3."},
 ],
 bots:[
  {id:"bt_jam",name:"Bots Path Upgrade 1",cost:200,parent:null,icon:"✕",desc:"Snipers cannot fire while within range of any active bot."},
  {id:"bt_spd",name:"Bots Path Upgrade 2",cost:500,parent:"bt_jam",icon:"≫",desc:"While a moving bot is in the bottom 40% of the screen it travels at 2× speed, so bots spend more time guarding the top."},
  {id:"bt_field",name:"Bots Path Upgrade 3",cost:600,parent:"bt_jam",icon:"◎",desc:"While you are inside an active bot, that bot's field is 30% larger."},
 ],
 intro_sprint:[
  {id:"sp_stop",name:"Intro Sprint Path Upgrade 1",cost:60,parent:null,icon:"■",desc:"Press Space at any time to end the intro sprint early, at the end of the current wave."},
  {id:"sp_boss",name:"Intro Sprint Path Upgrade 2",cost:100,parent:"sp_stop",icon:"☠",desc:"Bosses have 30% less health during the intro sprint."},
  {id:"sp_dmg",name:"Intro Sprint Path Upgrade 3",cost:110,parent:"sp_stop",icon:"✦",desc:"Ability damage is increased by 25% during the intro sprint."},
 ],
 phantom:[
  {id:"ph_wave",name:"Phantom Path Upgrade 1",cost:70,parent:null,icon:"✺",desc:"Once per phantom round, press Space to emit a shockwave that destroys 50% of currently-alive enemies."},
 ],
 practise:[
  {id:"pr_shield",name:"Practise Path Upgrade 1",cost:40,parent:null,icon:"⬡",desc:"Start each practise run with one extra shield."},
  {id:"pr_diff",name:"Practise Path Upgrade 2",cost:95,parent:"pr_shield",icon:"❉",desc:"If your best practise wave is a boss wave, gain a permanent +0.045 to your diffusion multiplier (a flat bonus, not per-diffuse)."},
 ],
 cargo:[
  {id:"cg_rev",name:"Cargo Path Upgrade 1",cost:30,parent:null,icon:"⇄",desc:"Press Space to reverse the direction your ship fires in cargo mode."},
  {id:"cg_regen",name:"Cargo Path Upgrade 2",cost:50,parent:"cg_rev",icon:"♻",desc:"Each carriage regenerates 2% of its max health per second, so long as it and the carriage ahead of it have not been hit in the last 5 seconds (the engine has no carriage ahead, so it only checks itself)."},
 ],
 enforcer:[
  {id:"ef_shield",name:"Enforcer Path Upgrade 1",cost:150,parent:null,icon:"⬡",desc:"Once per enforcer attempt, press Space to raise a shield that blocks a single bullet, lasting until it blocks a bullet or 2.5 seconds elapse."},
  {id:"ef_drone",name:"Enforcer Path Upgrade 2",cost:30,parent:null,enemy:"drone",desc:"Unlock the Drone enforcer."},
  {id:"ef_weaver",name:"Enforcer Path Upgrade 3",cost:30,parent:"ef_drone",enemy:"weaver",desc:"Unlock the Weaver enforcer."},
  {id:"ef_sniper",name:"Enforcer Path Upgrade 4",cost:30,parent:"ef_weaver",enemy:"sniper",desc:"Unlock the Sniper enforcer."},
  {id:"ef_splitter",name:"Enforcer Path Upgrade 5",cost:30,parent:"ef_weaver",enemy:"splitter",desc:"Unlock the Splitter enforcer."},
  {id:"ef_orbiter",name:"Enforcer Path Upgrade 6",cost:30,parent:"ef_weaver",enemy:"orbiter",desc:"Unlock the Orbiter enforcer."},
  {id:"ef_bomber",name:"Enforcer Path Upgrade 7",cost:30,parent:"ef_drone",enemy:"bomber",desc:"Unlock the Bomber enforcer."},
  {id:"ef_tank",name:"Enforcer Path Upgrade 8",cost:30,parent:"ef_bomber",enemy:"tank",desc:"Unlock the Tank enforcer."},
  {id:"ef_pulse",name:"Enforcer Path Upgrade 9",cost:30,parent:"ef_bomber",enemy:"pulse",desc:"Unlock the Pulse enforcer."},
  {id:"ef_charger",name:"Enforcer Path Upgrade 10",cost:30,parent:"ef_bomber",enemy:"charger",desc:"Unlock the Charger enforcer."},
  {id:"ef_sprayer",name:"Enforcer Path Upgrade 11",cost:30,parent:"ef_drone",enemy:"sprayer",desc:"Unlock the Sprayer enforcer."},
  {id:"ef_wraith",name:"Enforcer Path Upgrade 12",cost:30,parent:"ef_sprayer",enemy:"wraith",desc:"Unlock the Wraith enforcer."},
  {id:"ef_siren",name:"Enforcer Path Upgrade 13",cost:30,parent:"ef_sprayer",enemy:"siren",desc:"Unlock the Siren enforcer."},
  {id:"ef_fortress",name:"Enforcer Path Upgrade 14",cost:30,parent:"ef_sprayer",enemy:"fortress",desc:"Unlock the Fortress enforcer."},
  {id:"ef_reaper",name:"Enforcer Path Upgrade 15",cost:60,parent:"ef_drone",enemy:"reaper",desc:"Unlock the Reaper enforcer."},
  {id:"ef_boss",name:"Enforcer Path Upgrade 16",cost:100,parent:"ef_reaper",enemy:"boss",desc:"Unlock the Boss enforcer."},
 ],
};
const DEALER_FX={
 drone:{nerfs:[{label:"Shots fire straight down, not aimed",mod:{straightShot:true}},{label:"Fires 1.8× slower",mod:{frM:1.8}}],buffs:[{label:"Fires 3 shots instead of 1",mod:{twin:true}},{label:"Shots home toward you",mod:{homeShot:true}}]},
 weaver:{nerfs:[{label:"Weave cut to 10% width",mod:{sineAmpM:0.1}},{label:"Fires 1 shot instead of 3",mod:{fanNarrow:true}}],buffs:[{label:"Weaves 2.2× wider",mod:{sineAmpM:2.2}},{label:"Fires 5 shots instead of 3",mod:{fanWide:true}}]},
 sprayer:{nerfs:[{label:"Ring bullet count ×0.5",mod:{ringM:0.5}},{label:"Ring speed ×0.5",mod:{bsM:0.5}}],buffs:[{label:"Ring bullet count ×2",mod:{ringM:2.0}},{label:"Fires 2× as often",mod:{frM:0.5}}]},
 tank:{nerfs:[{label:"Shell shrinks (size 8→5)",mod:{shellSmall:true}},{label:"Shell fires straight down",mod:{straightShot:true}}],buffs:[{label:"Fires 3 shells instead of 1",mod:{shellSpread:true}},{label:"Shell speed ×1.7",mod:{bsM:1.7}}]},
 bomber:{nerfs:[{label:"Explosion bullets ×0.45",mod:{bombM:0.45}},{label:"Charge speed ×0.5",mod:{spdM:0.5}}],buffs:[{label:"Explosion bullets ×1.8",mod:{bombM:1.8}},{label:"Charge speed ×1.5",mod:{spdM:1.5}}]},
 sniper:{nerfs:[{label:"Telegraph 2.2× longer",mod:{teleM:2.2}},{label:"Shot speed ×0.5",mod:{bsM:0.5}}],buffs:[{label:"Telegraph ×0.35 (near-instant)",mod:{teleM:0.35}},{label:"Fires 3 shots down the beam",mod:{snipeSpread:true}}]},
 splitter:{nerfs:[{label:"Doesn't split on death",mod:{noSplit:true}},{label:"Split children can't shoot",mod:{childNoFire:true}}],buffs:[{label:"Splits into 4 (was 2)",mod:{splitN:4}},{label:"Children fire 2.4× faster",mod:{childRapid:true}}]},
 pulse:{nerfs:[{label:"Pulse bullet count ×0.5",mod:{ringM:0.5}},{label:"Pulse speed ×0.5",mod:{bsM:0.5}}],buffs:[{label:"Pulse bullet count ×2",mod:{ringM:2.0}},{label:"Pulses 2× as often",mod:{frM:0.5}}]},
 orbiter:{nerfs:[{label:"1 helix arm (was 2)",mod:{helixN:1}},{label:"Spin speed ×0.4",mod:{helixSpin:0.4}}],buffs:[{label:"3 helix arms (was 2)",mod:{helixN:3}},{label:"Spin speed ×2",mod:{helixSpin:2.0}}]},
 charger:{nerfs:[{label:"Wind-up 1.9× longer",mod:{frM:1.9}},{label:"1 burst instead of 3",mod:{burstN:1}}],buffs:[{label:"Wind-up ×0.45 (fast)",mod:{frM:0.45}},{label:"5 bursts instead of 3",mod:{burstN:5}}]},
 wraith:{nerfs:[{label:"No invulnerability while phasing",mod:{noPhaseInv:true}},{label:"Teleports 2.2× less often",mod:{phaseM:2.2}}],buffs:[{label:"Teleports 2.5× more often",mod:{phaseM:0.4}},{label:"Fires a 14-bullet ring on reappear",mod:{wraithRing:true}}]},
 siren:{nerfs:[{label:"Bullets stop homing",mod:{noHoming:true}},{label:"Homing lasts ×0.35",mod:{homingLifeM:0.35}}],buffs:[{label:"Homing lasts ×1.9 longer",mod:{homingLifeM:1.9}},{label:"Fires 5 homing shots (was 3)",mod:{sirenWide:true}}]},
 fortress:{nerfs:[{label:"Shield arc disabled",mod:{shieldOff:true}},{label:"Shield arc width ×0.35",mod:{shieldArcM:0.35}}],buffs:[{label:"Shield arc width ×1.9",mod:{shieldArcM:1.9}},{label:"Adds a 2nd rear shield arc",mod:{shieldDouble:true}}]},
 reaper:{nerfs:[{label:"Drops 1 mine (was 2)",mod:{mineN:1}},{label:"Mine fuse 2.2× longer",mod:{mineTimeM:2.2}}],buffs:[{label:"Drops 4 mines (was 2)",mod:{mineN:4}},{label:"Mine fuse ×0.35 (fast)",mod:{mineTimeM:0.35}}]},
};
const BOT_UNLOCK=[1000,7000,25000,90000];
function botUpCost(n){return Math.round(1250*Math.pow(1+n*0.15,1.6)/50)*50;}
const BOTS=[
 {id:"health",name:"Health Bot",col:"#55dd77",desc:"Each enemy killed inside adds to a wave-long HP multiplier, up to 4×. Max HP, overcharge and current HP scale together. Resets each wave.",custom:{label:"HP / kill",base:0.006,per:0.004,fmt:v=>"+"+v.toFixed(3)}},
 {id:"distraction",name:"Distraction Bot",col:"#dd66dd",desc:"Enemies inside have a chance per attack to fire directly away from you instead of toward you.",custom:{label:"Misfire Chance",base:20,per:4,fmt:v=>Math.round(v)+"%"}},
 {id:"mimic",name:"Mimic Bot",col:"#5599ee",desc:"Enemies inside have a chance per attack to fire one straight shot instead of their normal attack.",custom:{label:"Mimic Chance",base:15,per:4,fmt:v=>Math.round(v)+"%"}},
 {id:"bounce",name:"Bounce Bot",col:"#eebb44",desc:"Player bullets bounce off the inner wall and gain a 20% pierce chance. Enemies inside take amplified damage from all sources.",custom:{label:"Damage",base:1.1,per:0.015,fmt:v=>v.toFixed(3)+"x"}},
];
function botRadiusPx(lv){return (5+((lv&&lv.size)||0)*0.5)*10;}
function botActiveMs(lv){return (2+((lv&&lv.time)||0)*0.5)*1000;}
function botCustomRaw(def,lv){return def.custom.base+((lv&&lv.custom)||0)*def.custom.per;}
function _botDef(id){return BOTS.find(b=>b.id===id);}
function _enemyInBot(gs,e,id){if(!gs._bots)return false;for(const b of gs._bots){if(b.active&&(!id||b.id===id)&&dist(e,b)<b.rPx)return true;}return false;}
function _activeBot(gs,id){if(!gs._bots)return null;for(const b of gs._bots){if(b.active&&b.id===id)return b;}return null;}
function _revertHealthBot(gs){if(gs._hbBaseMaxHp!=null){const _p=gs.player;const _ratio=_p.maxHp>0?_p.hp/_p.maxHp:1;_p.maxHp=gs._hbBaseMaxHp;const _cap=_p.maxHp*(_p.abilities.includes("overcharge")?((gs.abUp&&gs.abUp["overcharge_sub1"])?1.4:1.2):1);_p.hp=Math.min(_ratio*_p.maxHp,_cap);gs._hbBaseMaxHp=null;}gs._hbMult=1;}
function _drawBotIcon(ctx,id,x,y,s,col){const ga=ctx.globalAlpha;ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineJoin="round";ctx.lineCap="round";ctx.globalAlpha=ga*0.32;ctx.beginPath();ctx.arc(x,y,s,0,PI2);ctx.fill();ctx.globalAlpha=ga;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,s,0,PI2);ctx.stroke();ctx.lineWidth=1.8;if(id==="health"){ctx.beginPath();ctx.moveTo(x,y-s*0.5);ctx.lineTo(x,y+s*0.5);ctx.moveTo(x-s*0.5,y);ctx.lineTo(x+s*0.5,y);ctx.stroke();}else if(id==="distraction"){const _dd=[-0.7,1.15,2.75];_dd.forEach(an=>{const ex=x+Math.cos(an)*s*0.72,ey=y+Math.sin(an)*s*0.72;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.moveTo(ex,ey);ctx.lineTo(ex-Math.cos(an-0.5)*s*0.3,ey-Math.sin(an-0.5)*s*0.3);ctx.moveTo(ex,ey);ctx.lineTo(ex-Math.cos(an+0.5)*s*0.3,ey-Math.sin(an+0.5)*s*0.3);ctx.stroke();});}else if(id==="mimic"){ctx.globalAlpha=ga*0.5;ctx.beginPath();ctx.moveTo(x-s*0.18,y-s*0.55);ctx.lineTo(x-s*0.62,y-s*0.1);ctx.lineTo(x-s*0.18,y+s*0.35);ctx.lineTo(x+s*0.26,y-s*0.1);ctx.closePath();ctx.stroke();ctx.globalAlpha=ga;ctx.beginPath();ctx.moveTo(x+s*0.18,y-s*0.35);ctx.lineTo(x-s*0.26,y+s*0.1);ctx.lineTo(x+s*0.18,y+s*0.55);ctx.lineTo(x+s*0.62,y+s*0.1);ctx.closePath();ctx.stroke();}else{ctx.beginPath();ctx.moveTo(x-s*0.55,y-s*0.5);ctx.lineTo(x-s*0.05,y+s*0.5);ctx.lineTo(x+s*0.5,y-s*0.2);ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x+s*0.5,y-s*0.2,s*0.17,0,PI2);ctx.fill();}ctx.globalAlpha=ga;}
function _buildDealerMods(cards){
 if(!cards||!cards.length)return null;
 const m={};
 const apply=(t,mod)=>{if(!m[t])m[t]={};const o=m[t];for(const k in mod){const v=mod[k];if(typeof v==="number"&&/M$/.test(k))o[k]=(o[k]==null?1:o[k])*v;else o[k]=v;}};
 cards.forEach(c=>{if(c&&c.nerf)apply(c.nerf.enemy,c.nerf.mod);if(c&&c.buff)apply(c.buff.enemy,c.buff.mod);});
 return m;
}
function drawDealerCard(ctx,card,w,h){
 ctx.clearRect(0,0,w,h);
 const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,"#2c1a54");g.addColorStop(0.55,"#1c0e3c");g.addColorStop(1,"#120829");
 ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle="#9955dd";ctx.lineWidth=2;ctx.strokeRect(1.5,1.5,w-3,h-3);
 ctx.strokeStyle="rgba(187,119,255,0.22)";ctx.lineWidth=1;ctx.strokeRect(5,5,w-10,h-10);
 const pur="#cc99ff";const es=Math.min(w,h)*0.16;
 const nx=w*0.30,ny=h*0.30;
 ctx.save();drawShape(ctx,card.nerf.enemy,nx,ny,es,pur,0,{_cardMode:true});ctx.restore();
 ctx.save();ctx.strokeStyle="#7dffc0";ctx.lineWidth=2.4;ctx.lineCap="round";const mmx=nx+es*1.25,mmy=ny-es*1.0,mr=es*0.4;ctx.beginPath();ctx.moveTo(mmx-mr,mmy);ctx.lineTo(mmx+mr,mmy);ctx.stroke();ctx.restore();
 ctx.save();ctx.strokeStyle="#bb77ff";ctx.lineWidth=2;ctx.lineCap="round";ctx.shadowColor="#bb77ff";ctx.shadowBlur=6;ctx.beginPath();ctx.moveTo(w*0.16,h*0.84);ctx.lineTo(w*0.84,h*0.16);ctx.stroke();ctx.restore();
 const bx=w*0.70,by=h*0.70;
 ctx.save();drawShape(ctx,card.buff.enemy,bx,by,es,pur,0,{_cardMode:true});ctx.restore();
 ctx.save();ctx.strokeStyle="#ff9a8a";ctx.lineWidth=2.4;ctx.lineCap="round";const ppx=bx-es,ppy=by-es,pr=es*0.32;ctx.beginPath();ctx.moveTo(ppx-pr,ppy);ctx.lineTo(ppx+pr,ppy);ctx.moveTo(ppx,ppy-pr);ctx.lineTo(ppx,ppy+pr);ctx.stroke();ctx.restore();
}
export default function VoidStorm(){
 const canvasRef=useRef(null), gsRef=useRef(null), keysRef=useRef({}), rafRef=useRef(null), ltRef=useRef(0);
 const[phase,setPhase]=useState("menu");
 const[shopData,setShopData]=useState(null);
 const[deathData,setDeathData]=useState(null);
 const[abChoices,setAbChoices]=useState([]);
 const[tutSel,setTutSel]=useState({mode:null,ab:null,bot:null,enemy:null,fx:null});
 const[meta,setMeta]=useState({echoes:0,levels:{},shipColor:"cyan",showMagnetRange:true,showBorder:true,mobileControls:"reactive"});
 const metaRef=useRef(meta);const _lastSavedAtRef=useRef(0);
 useEffect(()=>{metaRef.current=meta;},[meta]);
 const shipCol=useCallback(()=>{const sc=SHIP_COLORS.find(c=>c.id===(meta.shipColor||"cyan"));return sc||SHIP_COLORS[0];},[meta.shipColor]);
 const bulletCol=useCallback(()=>{const id=meta.bulletColor||"teal";if(id==="match")return"#44ddcc";const bc=BULLET_COLORS.find(c=>c.id===id);return bc?.color||"#44ddcc";},[meta.bulletColor]);
 const[showWiki,setShowWiki]=useState(false);
 const wikiRef=useRef(false);const[_wikiClosing,_setWikiClosing]=useState(false);const[_wikiEntering,_setWikiEntering]=useState(false);const _wikiClosingRef=useRef(false);const[_dupTabPopup,_setDupTabPopup]=useState(false);const _tabIdRef=useRef(_vsRealRandom().toString(36).slice(2,10));const _menuShipRef=useRef(null);const _bcRef=useRef(null);const _otherTabIdRef=useRef(null);const _sameDeviceDupRef=useRef(false);
 useEffect(()=>{wikiRef.current=showWiki;if(showWiki){_setWikiEntering(true);const t=setTimeout(()=>_setWikiEntering(false),400);return()=>clearTimeout(t);}},[showWiki]);
 useEffect(()=>{_wikiClosingRef.current=_wikiClosing;},[_wikiClosing]);
 const[confirmReset,setConfirmReset]=useState(false);
 const[confirmForfeit,setConfirmForfeit]=useState(false);
 const[paused,setPaused]=useState(false);
 const[showStats,setShowStats]=useState(false);
 const[metaTab,setMetaTab]=useState("ship");const[labConfirm,setLabConfirm]=useState(null);
 const[abInfoId,setAbInfoId]=useState(null);const[heInfoId,setHeInfoId]=useState(null);const[sprintInfo,setSprintInfo]=useState(false);const[_botInfo,_setBotInfo]=useState(null);const[autoDealerInfo,setAutoDealerInfo]=useState(false);
 const[showAnalyser,setShowAnalyser]=useState(false);const[showRegenAnalyser,setShowRegenAnalyser]=useState(false);const[showPainAnalyser,setShowPainAnalyser]=useState(false);const[confirmRespec,setConfirmRespec]=useState(false);const[deathDmgPopup,setDeathDmgPopup]=useState(false);const[deathRegenPopup,setDeathRegenPopup]=useState(false);const[deathPainPopup,setDeathPainPopup]=useState(false);
 const[showPauseSettings,setShowPauseSettings]=useState(false);const[showPauseLabs,setShowPauseLabs]=useState(false);const[showPauseCards,setShowPauseCards]=useState(false);const[_dealerOffers,_setDealerOffers]=useState(null);const[_dealerNew,_setDealerNew]=useState(false);const[_dealerAuto,_setDealerAuto]=useState(false);const[_dealerBurn,_setDealerBurn]=useState(null);
 const pausedRef=useRef(false);const _returnToPauseRef=useRef(false);
 const[pgMode,setPgMode]=useState(null);const[enforcerMode,setEnforcerMode]=useState(false);const[pathsZoom,setPathsZoom]=useState(0.7);const[pathsPan,setPathsPan]=useState({x:0,y:0});const[_pathSel,_setPathSel]=useState(null);const _pathDragRef=useRef(null);const _pathMovedRef=useRef(false);
 const pgRef=useRef(null);
 useEffect(()=>{pgRef.current=pgMode;},[pgMode]);
 const[practiceWave,setPracticeWave]=useState(1);
 const[historyHover,setHistoryHover]=useState(null);const[_histDetail,_setHistDetail]=useState(null);const[_histReplay,_setHistReplay]=useState(null);const[_histPanel,_setHistPanel]=useState(null);
 const fpsRef=useRef({frames:0,last:performance.now(),fps:0});
 const touchRef=useRef({active:false,startX:0,startY:0,curX:0,curY:0,id:null});
 const[historyHideForfeits,setHistoryHideForfeits]=useState(true);const[historyMode,setHistoryMode]=useState("waves");
 const[syncCode,setSyncCode]=useState(null);const[syncStatus,setSyncStatus]=useState("none");const[syncCodeInput,setSyncCodeInput]=useState("");const[showShipPopup,setShowShipPopup]=useState(false);const[showBulletPopup,setShowBulletPopup]=useState(false);const[showBgPopup,setShowBgPopup]=useState(false);const[showSyncInfo,setShowSyncInfo]=useState(false);const[syncConflict,setSyncConflict]=useState(null);const[showDesignPopup,setShowDesignPopup]=useState(false);const[showChangelog,setShowChangelog]=useState(false);const[_showAdvInfo,_setShowAdvInfo]=useState(false);const[clExpanded,setClExpanded]=useState({v30:true});const syncCodeRef=useRef(null);const _lbTapRef=useRef({t:0,i:-1});const _cloudDebounce=useRef(null);const _sessionIdRef=useRef((()=>{try{let _d=localStorage.getItem("vs4-device-id");if(!_d){_d=_vsRealRandom().toString(36).slice(2,10)+Date.now().toString(36);localStorage.setItem("vs4-device-id",_d);}return _d;}catch(_e){return _vsRealRandom().toString(36).slice(2,10)+Date.now().toString(36);}})());const[sessionTakeover,setSessionTakeover]=useState(()=>{try{return !!sessionStorage.getItem("vs4-takeover");}catch(e){return false;}});const[_takeoverLocked,_setTakeoverLocked]=useState(false);const[confirmDisconnect,setConfirmDisconnect]=useState(false);const[usernameInput,setUsernameInput]=useState("");const[showLockInfo,setShowLockInfo]=useState(false);const[confirmLock,setConfirmLock]=useState(false);const[showLockWarning,setShowLockWarning]=useState(false);const[leaderboardData,setLeaderboardData]=useState([]);const[lbSort,setLbSort]=useState("echoes");const _devicesRef=useRef({});const[_online,_setOnline]=useState(typeof navigator!=="undefined"?navigator.onLine!==false:true);const[showShipStats,setShowShipStats]=useState(false);const[_modeUnlock,_setModeUnlock]=useState(null);const[_admHist,_setAdmHist]=useState(null);const[_admHistName,_setAdmHistName]=useState(null);const[_delTimer,_setDelTimer]=useState(10);useEffect(()=>{if(!confirmReset)return;_setDelTimer(10);const _iv=setInterval(()=>{_setDelTimer(t=>t<=1?0:t-1);},1000);return ()=>clearInterval(_iv);},[confirmReset]);
  const[_transStage,_setTransStage]=useState("idle");
  const[_transFrom,_setTransFrom]=useState(null);
  const[_transTo,_setTransTo]=useState(null);
  const[_popupClosing,_setPopupClosing]=useState(false);
  const[_launching,_setLaunching]=useState(false);const[_pendingAbPick,_setPendingAbPick]=useState(false);
  const[_enforcerDeath,_setEnforcerDeath]=useState(null);const[_cargoDeath,_setCargoDeath]=useState(null);const[_sideLockPopup,_setSideLockPopup]=useState(null);
  const[_metaTabFrom,_setMetaTabFrom]=useState(null);
  const _transTimerRef=useRef(null);
  const _PHASE_ENTRY={metashop:"left",phantom_info:"left",settings:"right",history:"down",hyperecho:"down",leaderboard:"down",practise:"down",playground:"down",cargo:"up",dealer:"down",paths:"up"};
  const _OPP={left:"right",right:"left",up:"down",down:"up"};
  const _capDir=d=>d.charAt(0).toUpperCase()+d.slice(1);
  const _getExitAnim=(fromPh,toPh)=>{if(fromPh==="menu"){const e=_PHASE_ENTRY[toPh]||"down";return "transOut"+_capDir(_OPP[e]);}const me=_PHASE_ENTRY[fromPh]||"down";return "transOut"+_capDir(me);};
  const _getEnterAnim=(toPh,fromPh)=>{if(toPh==="menu"){const e=_PHASE_ENTRY[fromPh]||"down";return "transIn"+_capDir(_OPP[e]);}const me=_PHASE_ENTRY[toPh]||"down";return "transIn"+_capDir(me);};
  const _phaseClass=p=>{if(_transStage==="exiting"&&_transFrom===p)return "vs-exit";return "vs-enter";};
  const goToFast=(newPhase)=>{if(newPhase===phase)return;if(_transTimerRef.current)clearTimeout(_transTimerRef.current);_setTransFrom(phase);_setTransTo(newPhase);setPhase(newPhase);_setTransStage("entering");_transTimerRef.current=setTimeout(()=>{_setTransStage("idle");_setTransFrom(null);_setTransTo(null);},320);};const goTo=(newPhase)=>{if(newPhase===phase||_transStage!=="idle"){setPhase(newPhase);return;}_setTransFrom(phase);_setTransTo(newPhase);_setTransStage("exiting");_transTimerRef.current=setTimeout(()=>{setPhase(newPhase);_setTransStage("entering");_transTimerRef.current=setTimeout(()=>{_setTransStage("idle");_setTransFrom(null);_setTransTo(null);},320);},220);};
  const closePopup=(setter)=>{_setPopupClosing(true);setTimeout(()=>{setter(false);_setPopupClosing(false);},170);};const closeWiki=()=>{_setWikiClosing(true);setTimeout(()=>{setShowWiki(false);_setWikiClosing(false);},200);};
 const[tutStep,setTutStep]=useState(0);
 const[showTutPrompt,setShowTutPrompt]=useState(false);
 const tutRef=useRef(0);
 useEffect(()=>{tutRef.current=tutStep;try{if(tutStep>0)localStorage.setItem("vs4-tut",String(tutStep));else localStorage.removeItem("vs4-tut");}catch(e){}},[tutStep]);
 const phRef=useRef("menu");
 useEffect(()=>{phRef.current=phase;
 if(phase!=="playing"&&phase!=="replay")_vsDeactivateRng();
 setConfirmReset(false);setConfirmForfeit(false);if(_returnToPauseRef.current&&phase==="playing"){_returnToPauseRef.current=false;setPaused(true);pausedRef.current=true;}else{setPaused(false);pausedRef.current=false;}setShowStats(false);setShowShipStats(false);if(phase!=="history")_setAdmHist(null);(()=>{_setMetaTabFrom(metaTab);setMetaTab("ship");})();setAbInfoId(null);setShowAnalyser(false);setShowRegenAnalyser(false);setShowPainAnalyser(false);setShowPauseSettings(false);setShowPauseLabs(false);setShowPauseCards(false);setDeathDmgPopup(false);setDeathRegenPopup(false);setDeathPainPopup(false);setShowShipPopup(false);setShowBulletPopup(false);setShowBgPopup(false);setShowDesignPopup(false);setShowSyncInfo(false);setSyncConflict(null);if(phase!=="playing")setPgMode(null);if(phase==="menu"||phase==="leaderboard")fetchLeaderboard();
 if((phase==="menu"||phase==="settings"||phase==="playground"||phase==="metashop"||phase==="practise"||phase==="history"||phase==="phantom_info"||phase==="hyperecho"||phase==="leaderboard"||phase==="dealer"||phase==="paths"||phase==="tutorials")&&!(_returnToPauseRef.current&&phase==="settings")){
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
 useEffect(()=>{if(_pendingAbPick&&phase==="playing"){const gs=gsRef.current;if(gs){gs._pAb--;offerAb(gs);}_setPendingAbPick(false);}},[_pendingAbPick,phase]);
 useEffect(()=>{pausedRef.current=paused;},[paused]);
 useEffect(()=>{
 try{
 const r=localStorage.getItem("vs4-meta");
 if(r){const _pm=JSON.parse(r);if(!_pm.username){_pm.username=_genUsername();try{localStorage.setItem("vs4-meta",JSON.stringify(_pm));}catch(_e){}}setMeta(_pm);}
 else setShowTutPrompt(true);
 const savedTut=localStorage.getItem("vs4-tut");
 if(savedTut&&parseInt(savedTut)>0){setShowTutPrompt(true);}
 const _sc=localStorage.getItem("vs4-sync-code");if(_sc){setSyncCode(_sc);syncCodeRef.current=_sc;setSyncStatus("synced");setTimeout(()=>{if(syncCodeRef.current)_cloudPull();},200);}
 }catch(e){}
 },[]);
 const _cloudPush=useCallback((ms)=>{
 const code=syncCodeRef.current;if(!code||!_SYNC_OK)return;
 try{const _devs={..._devicesRef.current};_devs[_sessionIdRef.current]=Date.now();Object.keys(_devs).forEach(k=>{if(Date.now()-_devs[k]>120000)delete _devs[k];});_devicesRef.current=_devs;const h=localStorage.getItem("vs4-history")||"[]";const t=localStorage.getItem("vs4-tut")||"0";
 fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code,data:{meta:ms,history:_vsHistForSync(),tut:t,session_id:_sessionIdRef.current,devices:_devs},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(e){}
 },[]);
 const _cloudPull=useCallback(()=>{
 const code=syncCodeRef.current;if(!code||!_SYNC_OK)return;
 fetch(SUPABASE_URL+"/rest/v1/saves?code=eq."+code+"&select=data",{headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}).then(r=>r.json()).then(rows=>{if(rows.length>0&&rows[0].data){const cd=rows[0].data;if(cd.devices){_devicesRef.current=cd.devices;if(Object.keys(cd.devices).length>0&&!cd.devices[_sessionIdRef.current]){if(!_sameDeviceDupRef.current){setSessionTakeover(true);return;}}}else if(cd.session_id&&cd.session_id!==_sessionIdRef.current){if(!_sameDeviceDupRef.current){setSessionTakeover(true);return;}}if(cd.meta){if(cd.meta.locked){const _pullLk=localStorage.getItem("vs4-lock-key");if(!_pullLk||_pullLk!==cd.meta.lock_key){setSyncCode(null);syncCodeRef.current=null;try{localStorage.removeItem("vs4-sync-code");}catch(_e){}setSyncStatus("locked_out");return;}}const cloudAt=cd.meta.savedAt||0;const localAt=Math.max(metaRef.current.savedAt||0,_lastSavedAtRef.current||0);if(cloudAt>localAt){setMeta(cd.meta);try{localStorage.setItem("vs4-meta",JSON.stringify(cd.meta));}catch(e){}if(cd.history)try{const _loc=JSON.parse(localStorage.getItem("vs4-history")||"[]");const _rmap={};_loc.forEach(e=>{if(e.replay)_rmap[e.date]=e.replay;});const _merged=cd.history.map(e=>_rmap[e.date]?{...e,replay:_rmap[e.date]}:e);localStorage.setItem("vs4-history",JSON.stringify(_merged));}catch(e){}if(cd.tut)try{localStorage.setItem("vs4-tut",cd.tut);}catch(e){}}}}}).catch(()=>{});
 },[]);
 const saveMeta=useCallback(m=>{
 const _ts=Date.now();_lastSavedAtRef.current=_ts;const _ms={...m,savedAt:_ts};
 try{localStorage.setItem("vs4-meta",JSON.stringify(_ms));}catch(e){}
 _cloudPush(_ms);
 },[_cloudPush]);
 useEffect(()=>{const _on=()=>_setOnline(true),_off=()=>_setOnline(false);if(typeof window!=="undefined"){window.addEventListener("online",_on);window.addEventListener("offline",_off);}return()=>{if(typeof window!=="undefined"){window.removeEventListener("online",_on);window.removeEventListener("offline",_off);}};},[]);
 const fetchLeaderboard=useCallback(()=>{if(!_SYNC_OK)return;fetch(SUPABASE_URL+"/rest/v1/saves?select=code,data",{headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}).then(r=>r.json()).then(rows=>{const lb=rows.filter(r=>r.data?.meta&&!((r.data.meta.totalEchoesEarned||0)>0&&(r.data.meta.echoes||0)>(r.data.meta.totalEchoesEarned||0))).map(r=>({username:r.data.meta.username||"Unknown Pilot",echoes:r.data.meta.totalEchoesEarned||0,wave:r.data.meta.highWave||0,code:r.code})).filter(p=>p.echoes>=1);setLeaderboardData(lb);}).catch(()=>{});},[]);
 useEffect(()=>{syncCodeRef.current=syncCode;if(_returnToPauseRef.current){_returnToPauseRef.current=false;setPhase("menu");}if(syncCode)setShowTutPrompt(false);},[syncCode]);
 useEffect(()=>{if(phase==="dealer"&&_dealerNew){const _dt=setTimeout(()=>_setDealerNew(false),250+3*240+760);return ()=>clearTimeout(_dt);}},[phase,_dealerNew]);
 useEffect(()=>{
 if(!_SYNC_OK)return;
 const _onVis=()=>{if(document.visibilityState==="visible")_cloudPull();};
 document.addEventListener("visibilitychange",_onVis);
 return()=>document.removeEventListener("visibilitychange",_onVis);
 },[_cloudPull]);
 useEffect(()=>{
 if(!syncCode||!_SYNC_OK)return;
 const id=setInterval(()=>{_cloudPull();},8000);
 return()=>clearInterval(id);
 },[syncCode,_cloudPull]);
 useEffect(()=>{try{if(sessionTakeover)sessionStorage.setItem("vs4-takeover","1");else{sessionStorage.removeItem("vs4-takeover");_setTakeoverLocked(false);}}catch(e){}},[sessionTakeover]);
 useEffect(()=>{if(!sessionTakeover||!_SYNC_OK)return;const _sc=syncCodeRef.current||localStorage.getItem("vs4-sync-code");if(!_sc)return;const checkLock=()=>{fetch(SUPABASE_URL+"/rest/v1/saves?code=eq."+_sc+"&select=data",{headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}).then(r=>r.json()).then(rows=>{if(rows.length>0&&rows[0].data?.meta?.locked)_setTakeoverLocked(true);else _setTakeoverLocked(false);}).catch(()=>{});};checkLock();const id=setInterval(checkLock,5000);return()=>clearInterval(id);},[sessionTakeover]);
 useEffect(()=>{if(phase!=="playing")return;const h=e=>{e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",h);return()=>window.removeEventListener("beforeunload",h);},[phase]);
 useEffect(()=>{if(!syncCode||typeof BroadcastChannel==="undefined")return;const bc=new BroadcastChannel("vs4-tab");_bcRef.current=bc;bc.onmessage=e=>{const d=e.data;if(!d||d.code!==syncCode)return;if(d.type==="hello"&&d.tab!==_tabIdRef.current)bc.postMessage({type:"active",code:syncCode,tab:_tabIdRef.current});if(d.type==="active"&&d.tab!==_tabIdRef.current){_otherTabIdRef.current=d.tab;_sameDeviceDupRef.current=true;_setDupTabPopup(true);}if(d.type==="close_me"&&d.tab===_tabIdRef.current){try{window.close();}catch(_e){}}};bc.postMessage({type:"hello",code:syncCode,tab:_tabIdRef.current});return()=>{try{bc.close();}catch(_e){}_bcRef.current=null;};},[syncCode]);
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
 upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,_sprintLabWaves:0,_overheatPoints:0,
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
 upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,_sprintLabWaves:0,_overheatPoints:0,
 stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),showMagnetRange:meta.showMagnetRange!==false,
 abUp:{...(meta.abUpgrades||{})},_totalScrap:0,_totalCores:0,_totalPlasma:0,
 };
 gs._pAb=gml("m_start");
 gsRef.current=gs;
 {const _dc=metaRef.current._dealerActive||[];gs._dealerCards=_dc.slice();gs._dealerMods=_buildDealerMods(_dc);_setDealerOffers(null);if(_dc.length){setMeta(prev=>{const nx={...prev,_dealerActive:[],_dealerPlayed:true};saveMeta(nx);return nx;});}}
 if(gs._pAb>0){setPhase("playing");_setPendingAbPick(true);}
 else if(gs.wave>0){setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}
 else{const _sLvl2=metaRef.current.lab?.completed?.intro_sprint||0;const _sPct2=_sLvl2>0?[10,20,30,40,50][Math.min(_sLvl2-1,4)]:0;const _sMax2=metaRef.current.highWave||0;const _sThr2=Math.floor(_sMax2*_sPct2/100);const _doSprint2=_sPct2>0&&!metaRef.current.introSprintOff&&_sThr2>0;setPhase("playing");startWave(gs,_doSprint2);}
 },[gml]);
 function _dealerEmptySlot(k){
 return <div key={"empty_"+k} style={{width:128,border:"2px dashed #6633aa66",borderRadius:6,padding:6,display:"flex",flexDirection:"column",alignItems:"center",boxSizing:"border-box"}}><div style={{width:"100%",aspectRatio:"384 / 534",border:"2px dashed #6633aa55",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",boxSizing:"border-box"}}><span style={{color:"#6644aa",fontSize:9,letterSpacing:2}}>EMPTY</span></div><div style={{marginTop:5,width:"100%"}}><div style={{color:"#6644aa",fontSize:8,lineHeight:1.3,minHeight:32,display:"flex",alignItems:"center"}}>Empty card slot</div><div style={{fontSize:8,lineHeight:1.3,marginTop:2,minHeight:32}} /></div></div>;
 }
 function _dealerCardBack(){
 return <div style={{width:"100%",height:"100%",borderRadius:6,boxSizing:"border-box",background:"radial-gradient(circle at 50% 38%,#3a1d6e,#1a0c36 68%,#0c0520)",border:"2px solid #7744bb",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
 <div style={{position:"absolute",inset:5,border:"1px solid rgba(153,85,221,0.4)",borderRadius:4}}/>
 <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(45deg,transparent 0,transparent 7px,rgba(153,85,221,0.07) 7px,rgba(153,85,221,0.07) 8px)"}}/>
 <div style={{width:52,height:52,transform:"rotate(45deg)",border:"2px solid #bb88ee",background:"rgba(40,18,80,0.55)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px #9955dd66"}}>
 <span style={{transform:"rotate(-45deg)",color:"#e6c8ff",fontSize:22,textShadow:"0 0 10px #bb88ee"}}>✦</span>
 </div>
 </div>;
 }
 function _dealerCardEl(card,ckey,mode){
 const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
 const _inner=<div style={{width:128,background:"#160a30",border:"1px solid #6633aa55",borderRadius:6,padding:6,display:"flex",flexDirection:"column",alignItems:"center",backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",boxSizing:"border-box"}}>
 <canvas width={384} height={534} style={{width:"100%",height:"auto",borderRadius:4,display:"block"}} ref={el=>{if(el){const cx=el.getContext("2d");if(cx)drawDealerCard(cx,card,el.width,el.height);}}} />
 <div style={{marginTop:5,width:"100%"}}>
 <div style={{color:"#7dffc0",fontSize:8,lineHeight:1.3,minHeight:32}}>− {cap(card.nerf.enemy)}: {card.nerf.label}</div>
 <div style={{color:"#ff9a8a",fontSize:8,lineHeight:1.3,marginTop:2,minHeight:32}}>+ {cap(card.buff.enemy)}: {card.buff.label}</div>
 </div>
 </div>;
 if(mode==="offer"&&_dealerNew){
 const _dl=(250+ckey*240)+"ms";
 return <div key={mode+"_"+ckey} style={{width:128,perspective:820}}>
 <div style={{position:"relative",transformStyle:"preserve-3d",WebkitTransformStyle:"preserve-3d",animation:`dealerFlip 700ms cubic-bezier(0.32,0.72,0.35,1.04) ${_dl} both`}}>
 <div style={{backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",animation:`dealerFaceFront 700ms linear ${_dl} both`}}>{_inner}</div>
 <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",animation:`dealerFaceBack 700ms linear ${_dl} both`}}>{_dealerCardBack()}</div>
 </div>
 </div>;
 }
 return <div key={mode+"_"+ckey} style={{width:128,opacity:mode==="locked"?0.5:1}}>{_inner}</div>;
 }
 function _genDealerOffers(){
 const _R=_vsRealRandom;
 let _hist=[];try{_hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");}catch(e){_hist=[];}
 const _keys=Object.keys(DEALER_FX);
 const _killers=[];
 _hist.slice(0,14).forEach(h=>{const c=(h&&h.cause)?String(h.cause).toLowerCase().split(" ")[0]:"";if(DEALER_FX[c]&&!_killers.includes(c))_killers.push(c);});
 const _pool=_killers.length?_killers:_keys;
 const _actUsed=new Set();(metaRef.current._dealerActive||[]).forEach(c=>{if(c&&c.nerf)_actUsed.add(c.nerf.enemy);if(c&&c.buff)_actUsed.add(c.buff.enemy);});const _npF=(_pool.filter(e=>!_actUsed.has(e)).length?_pool.filter(e=>!_actUsed.has(e)):_pool);const _bpF=(_keys.filter(e=>!_actUsed.has(e)).length?_keys.filter(e=>!_actUsed.has(e)):_keys);const _mk=()=>{const ne=_npF[Math.floor(_R()*_npF.length)];const nset=DEALER_FX[ne].nerfs;const nfx=nset[Math.floor(_R()*nset.length)];let be=_bpF[Math.floor(_R()*_bpF.length)],_g=0;while(be===ne&&_g<12){be=_bpF[Math.floor(_R()*_bpF.length)];_g++;}const bset=DEALER_FX[be].buffs;const bfx=bset[Math.floor(_R()*bset.length)];return {nerf:{enemy:ne,label:nfx.label,mod:nfx.mod},buff:{enemy:be,label:bfx.label,mod:bfx.mod}};};
 _setDealerOffers([_mk(),_mk(),_mk()]);_setDealerNew(true);
 }
 function _pickDealerCard(card,ci){
 const slots=metaRef.current._dealerSlots||1;
 const active=metaRef.current._dealerActive||[];
 if(active.length>=slots||_dealerBurn!=null)return;
 _setDealerBurn(ci==null?-1:ci);
 setTimeout(()=>{
  const _slots=metaRef.current._dealerSlots||1;const _act=metaRef.current._dealerActive||[];
  if(_act.length<_slots){setMeta(prev=>{const nx={...prev,_dealerActive:[...(prev._dealerActive||[]),card]};saveMeta(nx);return nx;});}
  const _newLen=Math.min(_slots,_act.length+1);
  if(_newLen<_slots){_genDealerOffers();}else{_setDealerOffers(null);}
  _setDealerBurn(null);
 },780);
 }
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
 upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,_sprintLabWaves:0,_overheatPoints:0,
 stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),showMagnetRange:meta.showMagnetRange!==false,
 abUp:{...(meta.abUpgrades||{})},
 isNewMode:true,_totalScrap:0,_totalCores:0,_totalPlasma:0,
 };
 gsRef.current=gs;
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
 upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,_sprintLabWaves:0,_overheatPoints:0,
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
 const enfPatterns={drone:{fr:350,bs:3.5,pat:"enf_drone"},weaver:{fr:280,bs:3.2,pat:"enf_weaver"},sprayer:{fr:700,bs:2.8,pat:"enf_sprayer"},tank:{fr:1200,bs:2.0,pat:"enf_tank"},bomber:{fr:500,bs:3.0,pat:"enf_bomber"},sniper:{fr:600,bs:9.0,pat:"enf_sniper"},splitter:{fr:650,bs:3.0,pat:"enf_splitter"},pulse:{fr:900,bs:2.0,pat:"enf_pulse"},orbiter:{fr:400,bs:3.0,pat:"enf_orbit"},charger:{fr:350,bs:5.0,pat:"enf_charger"},siren:{fr:500,bs:3.0,pat:"enf_siren"},wraith:{fr:250,bs:3.5,pat:"enf_wraith"},fortress:{fr:700,bs:2.8,pat:"enf_fortress"},reaper:{fr:800,bs:2.5,pat:"enf_reaper"},boss:{fr:800,bs:3.0,pat:"enf_boss"}};
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
 function startCargo(){
 const gs={
 player:{x:GW/2,y:GH*0.85,hp:75+gml("m_hp")*12,maxHp:75+gml("m_hp")*12,
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
 wave:0,waveActive:true,enemiesLeft:9999,waveTotal:9999,waveKilled:0,
 spawnQueue:[],spawnTimer:0,kills:0,scrap:0,cores:0,plasma:0,
 upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,_sprintLabWaves:0,_overheatPoints:0,
 stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),
 isCargo:true,showMagnetRange:meta.showMagnetRange!==false,abUp:{...(meta.abUpgrades||{})},
 cargoDistance:0,cargoSpeedMPS:5*(metaRef.current.pathsCore?2.5:1),_camY:0,cargoPackages:0,_pkgCrossings:0,
 train:{
 worldY:GH*0.5,screenX:GW*0.5,
 segs:[
 {type:"engine",hp:150,maxHp:150,w:42,h:28,alive:true,offsetY:0},
 {type:"car",hp:150,maxHp:150,w:36,h:24,alive:true,offsetY:46},
 {type:"car",hp:150,maxHp:150,w:36,h:24,alive:true,offsetY:84},
 {type:"car",hp:150,maxHp:150,w:36,h:24,alive:true,offsetY:122},
 {type:"car",hp:150,maxHp:150,w:36,h:24,alive:true,offsetY:160}
 ]
 },
 cargoTelegraphs:[],_cargoBuffNotif:null,_vulnTimer:0,
 };
 gs._pAb=gml("m_start");
 gsRef.current=gs;
 if(gs._pAb>0){gs._pAb--;offerAb(gs);}
 else{setPhase("playing");startCargoNextWave(gs);}
 }
 function startCargoNextWave(gs){
 gs.wave++;
 gs.spawnQueue=genWave(gs.wave,false);
 gs.spawnTimer=0;
 if(gs.wave>1)gs._cargoBuffNotif={timer:180};
 }
 function startPractise(w){
 const gs={
 player:{x:GW/2,y:GH-80,hp:75+gml("m_hp")*12,maxHp:75+gml("m_hp")*12,
 damage:7+gml("m_dmg")*1.5,fireDelay:210,fireTimer:0,
 speed:3.6*(1+gml("m_spd")*0.05),invTimer:0,size:13,
 shields:gml("m_shield")+(metaRef.current.pathsUpg?.pr_shield?1:0),shieldMax:gml("m_shield")+(metaRef.current.pathsUpg?.pr_shield?1:0),
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
 upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,_sprintLabWaves:0,_overheatPoints:0,
 stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),
 isPlayground:true,isPractise:true,showMagnetRange:meta.showMagnetRange!==false,abUp:{...(meta.abUpgrades||{})},
 };
 gs._pAb=gml("m_start");
 gsRef.current=gs;
 setPgMode(null);
 if(gs._pAb>0){gs._pAb--;offerAb(gs);}
 else{setPhase("playing");startWave(gs);}
 }
  function _tutGS(){return {
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
 upgrades:{},usedAbIds:[],deathCause:"",newEnemyNotif:null,_labNotifs:[],dmgTrack:{},waveDmg:{},_diffuseCount:0,_diffuseMult:1,_sprintLabWaves:0,_overheatPoints:0,
 stars:makeStars(120),screenShake:0,flashTimer:0,time:0,_pAb:0,shipCol:shipCol(),bulCol:bulletCol(),
 isPlayground:true,isPractise:true,showMagnetRange:meta.showMagnetRange!==false,abUp:{...(meta.abUpgrades||{})},
 };}
 function _tutWave(){const _l=metaRef.current.lab?.completed?.intro_sprint||0;const _p=_l>0?[10,20,30,40,50][Math.min(_l-1,4)]:0;const _mx=Math.floor((metaRef.current.highWave||0)*_p/100);return Math.max(6,Math.floor(_mx*0.5));}
 function startTutAbility(abId,upKey){const gs=_tutGS();const w=_tutWave();gs.wave=w-1;gs.abUp=upKey?{[upKey]:true}:{};gs.player.abilities=[abId];gs._tutNoBots=true;gs._tutType="ability";gs._tutLabel=(ABILITIES.find(a=>a.id===abId)||{}).name||abId;
 if(abId==="orbitals"){const oc=hasAU(gs,"orbitals_sub1")?4:2;gs.orbitals=Array.from({length:oc},(_,i)=>({angle:(PI2/oc)*i,layer:0}));if(hasAU(gs,"orbitals_mastery"))for(let i=0;i<4;i++)gs.orbitals.push({angle:(PI2/4)*i,layer:1});}
 if(abId==="drone")gs.drones.push({x:gs.player.x,y:gs.player.y,ft:0});
 gsRef.current=gs;setPgMode(null);setPhase("playing");startWave(gs);}
 function startTutBot(botId){const gs=_tutGS();const w=_tutWave();gs.wave=w-1;gs.player.abilities=[];gs._tutBots={[botId]:{size:20,time:20,custom:20}};gs._tutType="bot";gs._tutLabel=(BOTS.find(b=>b.id===botId)||{}).name||botId;gsRef.current=gs;setPgMode(null);setPhase("playing");startWave(gs);}
 function startTutElite(enemyType){const gs=_tutGS();const w=_tutWave();gs.wave=w-1;gs._tutElite=enemyType;gs._tutType="elite";gs._tutLabel=enemyType;gs._pAb=gml("m_start");gsRef.current=gs;setPgMode(null);if(gs._pAb>0){gs._pAb--;offerAb(gs);}else{setPhase("playing");startWave(gs);}}
 function startTutEnemy(enemyType,mod){const gs=_tutGS();const w=_tutWave();gs.wave=w-1;gs._tutEnemy=enemyType;gs._dealerMods={[enemyType]:mod||{}};gs._dealerCards=[];gs._tutType="enemy";gs._tutLabel=enemyType;gs._pAb=gml("m_start");gsRef.current=gs;setPgMode(null);
 if(gs._pAb>0){gs._pAb--;offerAb(gs);}else{setPhase("playing");startWave(gs);}}
 function offerAb(gs){
 let av=ABILITIES.filter(a=>!gs.usedAbIds.includes(a.id));
 if(gs.isCargo)av=av.filter(a=>!["ricochet","overcharge","void_regen"].includes(a.id));
 if(av.length-(gs._diffuseCount||0)<=0){if(!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&gs.wave>0){setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}else{startWave(gs);}return;}
 const pool=[...av],picks=[];
 for(let i=0;i<Math.min(3,pool.length);i++){const idx=randInt(0,pool.length-1);picks.push(pool[idx]);pool.splice(idx,1);}
 const _dcLvl3=metaRef.current.lab?.completed?.diffusion_chance||0;const _dcPct3=_dcLvl3>0?_dcLvl3*10:0;const _dmLvl3=metaRef.current.lab?.completed?.diffusion_multi||0;const _dmBonus3=0.0375+_dmLvl3*0.009;gs._showDiffuse=!gs.isTutorial&&!gs.isNewMode&&!gs.isPlayground&&!gs.isCargo&&(metaRef.current.metaTier||1)>=2&&_dcPct3>0&&Math.random()*100<_dcPct3;gs._diffuseBonus=_dmBonus3;setAbChoices(picks);setPhase("ability");
 }
 function pickAb(id){
 const gs=gsRef.current;if(!gs)return;
 gs._sprintJustEnded=false;
 gs.player.abilities.push(id);gs.usedAbIds.push(id);
 if(id==="orbitals"){const oc=hasAU(gs,"orbitals_sub1")?4:2;gs.orbitals=Array.from({length:oc},(_,i)=>({angle:(PI2/oc)*i,layer:0}));if(hasAU(gs,"orbitals_mastery"))for(let i=0;i<4;i++)gs.orbitals.push({angle:(PI2/4)*i,layer:1});}
 if(id==="drone")gs.drones.push({x:gs.player.x,y:gs.player.y,ft:0});
 if(gs._pAb>0){gs._pAb--;offerAb(gs);}
 else if(gs.isPlayground&&!gs.isPractise){launchPG(gs);}
 else if(gs.isCargo){setPhase("playing");if(gs.wave===0)startCargoNextWave(gs);}
 else if(gs.isPractise||gs.wave===0){const _pSLvl=metaRef.current.lab?.completed?.intro_sprint||0;const _pSPct=_pSLvl>0?[10,20,30,40,50][Math.min(_pSLvl-1,4)]:0;const _pSMax=metaRef.current.highWave||0;const _pSThr=Math.floor(_pSMax*_pSPct/100);const _pDoS=!gs.isPractise&&_pSPct>0&&!metaRef.current.introSprintOff&&_pSThr>0;setPhase("playing");startWave(gs,_pDoS);}
 else if(gs.isNewMode){setPhase("playing");startWave(gs);}else{setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}
 }
 function has(gs,id){return !!(gs.player&&gs.player.abilities&&gs.player.abilities.includes(id));}
 function hasAU(gs,key){return !!(gs.abUp&&gs.abUp[key]);}
 function _initBots(gs){
 gs._hbMult=1;gs._hbBaseMaxHp=null;
 if(gs._inSprint&&gs._bots&&gs._bots.length)return;
 if(gs.isCargo){gs._bots=[];return;}
 const mb=gs._tutNoBots?{}:(gs._tutBots||metaRef.current.bots||{});const arr=[];
 BOTS.forEach(def=>{const lv=mb[def.id];if(!lv)return;const r=botRadiusPx(lv),am=botActiveMs(lv),inact=Math.max(1,30000-am);
 arr.push({id:def.id,col:def.col,x:rand(r,GW-r),y:rand(r+30,GH-r),vx:(rand(0,1)<0.5?-1:1)*1.7,vy:(rand(0,1)<0.5?-1:1)*1.7,rPx:r,actMs:am,inactMs:inact,cycle:gs._tutBots?Math.max(0,inact-2000):rand(0,inact),curR:8,active:false,cust:botCustomRaw(def,lv)});});
 gs._bots=arr;
 }
 function startWave(gs,_sprintActive){
 gs._inSprint=!!_sprintActive;
 if(gs.wave>0&&has(gs,"void_regen")&&hasAU(gs,"void_regen_mastery")&&gs._noDmgWave&&gs.player.goldenShields<5)gs.player.goldenShields++;gs._noDmgWave=true;gs.wave++;gs.waveActive=true;gs._waveEndTimer=0;gs.waveDmg={};gs.waveHeal={};gs.wavePain={};gs.waveShieldPain={};
 const _recReplay=!gs.isCargo&&!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&!gs.isTutorial;
 if(_recReplay){_vsActivateRng(_vsGenSeed());}
 if(gs.isTutorial){if(gs.wave===2)setTutStep(20);else if(gs.wave===3)setTutStep(30);else if(gs.wave===4)setTutStep(40);else if(gs.wave===5)setTutStep(50);}
 gs.spawnQueue=genWave(gs.wave,gs._inSprint);if(gs._tutType){gs.spawnQueue.forEach(_q=>{if(_q.type==="boss")_q.type="drone";});}if(gs._tutEnemy)gs.spawnQueue.forEach(_q=>{_q.type=gs._tutEnemy;});if(gs._tutElite&&gs.spawnQueue.length){gs.spawnQueue[0].type=gs._tutElite;}
 gs.waveTotal=gs.spawnQueue.length;gs.enemiesLeft=gs.waveTotal;gs.waveKilled=0;
 gs.spawnTimer=0;gs.player.shields=gs.player.shieldMax;if(!(has(gs,"nova")&&hasAU(gs,"nova_mastery")))gs._novaMines=[];
 if(has(gs,"overcharge")&&hasAU(gs,"overcharge_mastery")){gs.player.hp=Math.min(gs.player.hp,gs.player.maxHp*1.1);}else{gs.player.hp=Math.min(gs.player.hp,gs.player.maxHp);}
 if(metaRef.current.showNewEnemy!==false&&!gs._tutType){
 const newType=Object.entries(ENEMY_UNLOCK).find(([k,w])=>w===gs.wave&&k!=="boss");
 if(newType)gs.newEnemyNotif={type:newType[0],timer:180};
 else if(gs.wave%5===0)gs.newEnemyNotif={type:"boss",timer:180};
 else gs.newEnemyNotif=null;
 } else gs.newEnemyNotif=null;
 if(gs._pendingLabNotifs&&gs._pendingLabNotifs.length>0){gs._labNotifs.push(...gs._pendingLabNotifs);gs._pendingLabNotifs=[];}
 _initBots(gs);
 if(_recReplay){gs._replay={wave:gs.wave,seed:_vsRngState,gsSnapshot:_vsSnapshotGs(gs),metaSnapshot:_vsSnapshotMeta(metaRef.current),frames:[]};}
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
 const _bossM=(gs._inSprint&&metaRef.current.pathsUpg?.sp_boss)?0.7:1;gs.enemies.push({type:"boss",x:GW/2,y:-40,targetY:100,hp:BASE_HP*18*ws*_bossM,maxHp:BASE_HP*18*ws*_bossM,
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
 const _eRoll=gs.enemies[gs.enemies.length-1];
 {const _dm=gs._dealerMods&&gs._dealerMods[def.type];if(_dm){_eRoll._dx=_dm;if(_dm.hpM){_eRoll.hp*=_dm.hpM;_eRoll.maxHp*=_dm.hpM;}if(_dm.frM)_eRoll.fireRate*=_dm.frM;if(_dm.bsM)_eRoll.bulletSpeed*=_dm.bsM;if(_dm.dmM)_eRoll.dM*=_dm.dmM;if(_dm.spdM)_eRoll.speed*=_dm.spdM;if(_dm.sineAmpM)_eRoll.sineAmp*=_dm.sineAmpM;}}
 const _eExc=def.type==="bomber"||def.type==="splitter";
 const _eModeOk=!gs.isCargo&&!gs.isPlayground&&!gs.isNewMode&&!gs.isTutorial;
 if(!_eExc&&((_eModeOk&&gs.wave>=25)||gs._tutElite)){
 if(gs._eliteRollWave!==gs.wave){gs._eliteRollWave=gs.wave;gs._eliteSpawnedWave=false;if(gs._tutElite){gs._eliteWillSpawn=true;}else{const _eChance=Math.min(0.95,0.02+(gs.wave-25)*0.06);gs._eliteWillSpawn=Math.random()<_eChance;}}
 if(gs._eliteWillSpawn&&!gs._eliteSpawnedWave){gs._eliteSpawnedWave=true;_eRoll._elite=true;_eRoll._eliteCallTimer=6000;_eRoll._eliteCalled=false;_eRoll.hp*=1.6;_eRoll.maxHp*=1.6;}
 }
 }
 }
 const BSPD=8;
 function trackDmg(gs,src,amt){if(!gs.dmgTrack)gs.dmgTrack={};if(!gs.waveDmg)gs.waveDmg={};gs.dmgTrack[src]=(gs.dmgTrack[src]||0)+amt;gs.waveDmg[src]=(gs.waveDmg[src]||0)+amt;}
 function trackBounce(gs,src,base,m){trackDmg(gs,src,base);if(m>1)trackDmg(gs,"Bounce Bot",base*(m-1));}
 function trackHeal(gs,src,amt){if(!gs.healTrack)gs.healTrack={};if(!gs.waveHeal)gs.waveHeal={};gs.healTrack[src]=(gs.healTrack[src]||0)+amt;gs.waveHeal[src]=(gs.waveHeal[src]||0)+amt;}
 function trackPain(gs,src,hpAmt,shieldAmt){if(!gs.painTrack)gs.painTrack={};if(!gs.wavePain)gs.wavePain={};if(!gs.shieldPain)gs.shieldPain={};if(!gs.waveShieldPain)gs.waveShieldPain={};if(hpAmt>0){gs.painTrack[src]=(gs.painTrack[src]||0)+hpAmt;gs.wavePain[src]=(gs.wavePain[src]||0)+hpAmt;}if(shieldAmt>0){gs.shieldPain[src]=(gs.shieldPain[src]||0)+shieldAmt;gs.waveShieldPain[src]=(gs.waveShieldPain[src]||0)+shieldAmt;}}
 function firePB(gs){
 const p=gs.player;p.shotCount++;
 const isChain=has(gs,"chain")&&p.shotCount%4===0;
 const bspd=BSPD*(p.bulletSpeedMul||1);
 const a=(gs.isCargo&&gs._cargoFireRev)?Math.PI/2:-Math.PI/2,isCrit=Math.random()<p.critChance;
 gs.pBullets.push({x:p.x,y:p.y-p.size,vx:Math.cos(a)*bspd,vy:Math.sin(a)*bspd,
 damage:p.damage*(isCrit?2.5:1),pierce:p.pierce,isChain,isCrit,
 size:p.bulletSize,
 bounces:has(gs,"ricochet")?(hasAU(gs,"ricochet_sub2")?2:1):0,acid:p.acidStacks,src:"main"});
 if(p.hasRearGun)gs.pBullets.push({x:p.x,y:p.y+p.size,vx:0,vy:bspd*0.5,
 damage:p.damage*0.25,pierce:0,isChain:false,isCrit:false,size:2.5,bounces:0,acid:0,src:"rear"});
 }
 function fireEB(gs,e){
 let p=gs.player;
 if(gs.isCargo&&e._cargo){
 const seg=gs.train.segs[e.targetSegIdx];
 if(seg&&seg.alive){p={x:gs.train.screenX,y:(gs.train.worldY-gs._camY)+seg.offsetY};}
 }
 let a=ag(e,p);const bs=e.bulletSpeed||2.5,dmg=(7+gs.wave*1.8)*(e.dM||1)*dmgScale(gs.wave)*0.35;
 const bl=gs.eBullets.length;const src=e.type||"enemy";
  if((gs._bots&&gs._bots.length)||e._mimicNow){const _mb=_activeBot(gs,"mimic");if(e._mimicNow||(_mb&&dist(e,_mb)<_mb.rPx&&e.type!=="sniper"&&rand(0,100)<_mb.cust)){e._mimicNow=false;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs,vy:Math.sin(a)*bs,size:5,dmg});for(let _mi=bl;_mi<gs.eBullets.length;_mi++)gs.eBullets[_mi].src=src;if(e._eliteReinf)for(let _mi=bl;_mi<gs.eBullets.length;_mi++)gs.eBullets[_mi]._fromReinf=true;return;}const _db=_activeBot(gs,"distraction");if(_db&&dist(e,_db)<_db.rPx&&rand(0,100)<_db.cust){a=a+Math.PI;if(e.aimAngle!==undefined)e.aimAngle=a;}}
 switch(e.pattern){
 case"aimed":{const _dr=e.type==="drone"?gs._dealerMods?.drone:null;const _aa=_dr?.straightShot?Math.PI/2:a;const _hm=!!_dr?.homeShot;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_aa)*bs,vy:Math.sin(_aa)*bs,size:5,dmg,homing:_hm,homingLife:_hm?3000:0});if(_dr?.twin){gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_aa+0.22)*bs,vy:Math.sin(_aa+0.22)*bs,size:5,dmg,homing:_hm,homingLife:_hm?3000:0});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_aa-0.22)*bs,vy:Math.sin(_aa-0.22)*bs,size:5,dmg,homing:_hm,homingLife:_hm?3000:0});}break;}
 case"fan3":{const _wm=gs._dealerMods?.weaver;const _flo=_wm?.fanNarrow?0:(_wm?.fanWide?-2:-1);const _fhi=_wm?.fanNarrow?0:(_wm?.fanWide?2:1);const _fsp=_wm?.fanWide?0.26:0.2;for(let i=_flo;i<=_fhi;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*_fsp)*bs,vy:Math.sin(a+i*_fsp)*bs,size:5,dmg});break;}
 case"ring":{const n=Math.max(3,Math.round((8+Math.floor(gs.wave*0.18))*(gs._dealerMods?.sprayer?.ringM||1)));for(let i=0;i<n;i++){const ra=(PI2/n)*i+gs.time*0.001;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs,vy:Math.sin(ra)*bs,size:5,dmg});}break;}
 case"bigaimed":{const _tk=gs._dealerMods?.tank;const _ta=_tk?.straightShot?Math.PI/2:a;const _tsz=_tk?.shellSmall?5:8;if(_tk?.shellSpread){for(let _si=-1;_si<=1;_si++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_ta+_si*0.18)*bs,vy:Math.sin(_ta+_si*0.18)*bs,size:_tsz,dmg:dmg*1.5});}else{gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_ta)*bs,vy:Math.sin(_ta)*bs,size:_tsz,dmg:dmg*1.5});}break;}
 case"snipe":{const sa=e.aimAngle!==undefined?e.aimAngle:a;const _snSpd=bs*2.5;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(sa)*_snSpd,vy:Math.sin(sa)*_snSpd,size:4,dmg:dmg*2.0,src:"sniper",_sniperBullet:true,_sniperId:e._sniperId});if(gs._dealerMods?.sniper?.snipeSpread){for(let _si=-1;_si<=1;_si+=2)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(sa+_si*0.12)*_snSpd,vy:Math.sin(sa+_si*0.12)*_snSpd,size:4,dmg:dmg*2.0,src:"sniper",_sniperBullet:true,_sniperId:e._sniperId});}break;}
 case"pulse":{const n=Math.max(4,Math.round((12+Math.floor(gs.wave*0.12))*(gs._dealerMods?.pulse?.ringM||1)));for(let i=0;i<n;i++){const ra=(PI2/n)*i;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.7,vy:Math.sin(ra)*bs*0.7,size:4,dmg:dmg*0.4});}break;}
 case"orbit":{const oa=gs.time*0.003*(gs._dealerMods?.orbiter?.helixSpin||1);for(let i=0,_hn=(gs._dealerMods?.orbiter?.helixN??2);i<_hn;i++){const ra=oa+(PI2/_hn)*i;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs,vy:Math.sin(ra)*bs,size:5,dmg});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra+0.3)*bs*0.8,vy:Math.sin(ra+0.3)*bs*0.8,size:4,dmg:dmg*0.7});}break;}
 case"burst3":{for(let b=0,_bn=(gs._dealerMods?.charger?.burstN??3);b<_bn;b++){setTimeout(()=>{if(!gs.player.alive)return;const ba=ag(e,gs.player);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*bs,vy:Math.sin(ba)*bs,size:6,dmg,src});},b*120);}break;}
 case"phase5":{if(gs._dealerMods?.wraith?.wraithRing){const _wn=14;for(let _wi=0;_wi<_wn;_wi++){const _wra=(PI2/_wn)*_wi;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_wra)*bs,vy:Math.sin(_wra)*bs,size:5,dmg});}}else{for(let i=-2;i<=2;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.25)*bs,vy:Math.sin(a+i*0.25)*bs,size:5,dmg});}break;}
 case"siren":{const _sm=gs._dealerMods?.siren;const _slo=_sm?.sirenWide?-2:-1;const _shi=_sm?.sirenWide?2:1;for(let i=_slo;i<=_shi;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.3)*bs,vy:Math.sin(a+i*0.3)*bs,size:5,dmg,homing:!(_sm?.noHoming),homingLife:3750*(_sm?.homingLifeM||1)});break;}
 case"mines":{const _rm=gs._dealerMods?.reaper;for(let i=0,_mn=(_rm?.mineN??2);i<_mn;i++){const mx=e.x+rand(-80,80),my=e.y+rand(30,140);gs.eBullets.push({x:clamp(mx,10,GW-10),y:clamp(my,10,GH-40),vx:0,vy:0,size:7,dmg:dmg*0.3,mine:true,mineTimer:(2000+rand(0,800))*(_rm?.mineTimeM||1)});}break;}
 case"enf_drone":{const _sOff=gs.time*0.002;for(let arm=0;arm<3;arm++){const armA=_sOff+arm*(PI2/3);for(let j=0;j<4;j++){const ba=armA+j*0.18;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*bs*(0.7+j*0.15),vy:Math.sin(ba)*bs*(0.7+j*0.15),size:4,dmg:dmg*0.6});}}break;}
 case"enf_weaver":{const _wPhase=Math.floor(gs.time/300)%2;const baseA=_wPhase===0?a:a+Math.PI/2;for(let i=-2;i<=2;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(baseA+i*0.15)*bs,vy:Math.sin(baseA+i*0.15)*bs,size:5,dmg});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*1.4,vy:Math.sin(a)*bs*1.4,size:3,dmg:dmg*0.8});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+Math.PI)*bs*0.8,vy:Math.sin(a+Math.PI)*bs*0.8,size:3,dmg:dmg*0.5});break;}
 case"enf_sprayer":{const _rn=14+Math.floor(gs.time*0.002%6);for(let i=0;i<_rn;i++){const ra=(PI2/_rn)*i+gs.time*0.001;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.6,vy:Math.sin(ra)*bs*0.6,size:5,dmg:dmg*0.5});}for(let i=0;i<3;i++){const off=(i-1)*0.12;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+off)*bs*1.6,vy:Math.sin(a+off)*bs*1.6,size:3,dmg:dmg*0.7});}break;}
 case"enf_tank":{gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*0.4,vy:Math.sin(a)*bs*0.4,size:12,dmg:dmg*2.0});const _mn=6;for(let i=0;i<_mn;i++){const ra=(PI2/_mn)*i;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.7,vy:Math.sin(ra)*bs*0.7,size:4,dmg:dmg*0.4});}for(let i=-1;i<=1;i+=2)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.25)*bs*1.2,vy:Math.sin(a+i*0.25)*bs*1.2,size:6,dmg:dmg*0.8});break;}
 case"enf_bomber":{const _bwPhase=Math.floor(gs.time/400)%2;if(_bwPhase===0){const _rn=10;for(let i=0;i<_rn;i++){const ra=(PI2/_rn)*i+gs.time*0.003;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.5,vy:Math.sin(ra)*bs*0.5,size:6,dmg:dmg*0.4});}}else{const _rn=8;for(let i=0;i<_rn;i++){const ra=(PI2/_rn)*i+gs.time*0.003+0.4;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.9,vy:Math.sin(ra)*bs*0.9,size:4,dmg:dmg*0.5});}}for(let i=-1;i<=1;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.2)*bs*1.3,vy:Math.sin(a+i*0.2)*bs*1.3,size:5,dmg:dmg*0.7});break;}
 case"enf_sniper":{const _pVx=(p.x-e.x),_pVy=(p.y-e.y);const _pd=Math.sqrt(_pVx*_pVx+_pVy*_pVy)||1;const _leadA=a+0.15;const _trailA=a-0.15;const _snSpd=bs*2.2;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*_snSpd,vy:Math.sin(a)*_snSpd,size:4,dmg:dmg*1.5,src:"sniper",_sniperBullet:true,_sniperId:e._sniperId});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_leadA)*_snSpd,vy:Math.sin(_leadA)*_snSpd,size:3,dmg:dmg*1.0,src:"sniper"});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_trailA)*_snSpd,vy:Math.sin(_trailA)*_snSpd,size:3,dmg:dmg*1.0,src:"sniper"});for(let i=0;i<4;i++){const da=a+rand(-0.8,0.8);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(da)*bs*0.5,vy:Math.sin(da)*bs*0.5,size:6,dmg:dmg*0.3});}break;}
 case"enf_splitter":{const _sp=Math.floor(gs.time/400)%2;if(_sp===0){for(let i=-3;i<=3;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.18)*bs,vy:Math.sin(a+i*0.18)*bs,size:5,dmg:dmg*0.5});}else{for(let i=-2;i<=2;i++)gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.08)*bs*1.3,vy:Math.sin(a+i*0.08)*bs*1.3,size:4,dmg:dmg*0.7});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+1.2)*bs*0.8,vy:Math.sin(a+1.2)*bs*0.8,size:5,dmg:dmg*0.4});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a-1.2)*bs*0.8,vy:Math.sin(a-1.2)*bs*0.8,size:5,dmg:dmg*0.4});}break;}
 case"enf_pulse":{const _rn1=14;const _rn2=10;const _off1=gs.time*0.0008;const _off2=gs.time*0.0008+0.3;for(let i=0;i<_rn1;i++){const ra=(PI2/_rn1)*i+_off1;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.5,vy:Math.sin(ra)*bs*0.5,size:5,dmg:dmg*0.3});}for(let i=0;i<_rn2;i++){const ra=(PI2/_rn2)*i+_off2;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*1.1,vy:Math.sin(ra)*bs*1.1,size:4,dmg:dmg*0.5});}break;}
 case"enf_orbit":{const _oa=gs.time*0.004;for(let i=0;i<4;i++){const ra=_oa+i*(PI2/4);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs,vy:Math.sin(ra)*bs,size:5,dmg:dmg*0.5});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra+0.4)*bs*0.6,vy:Math.sin(ra+0.4)*bs*0.6,size:4,dmg:dmg*0.4});}gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*1.5,vy:Math.sin(a)*bs*1.5,size:3,dmg:dmg*0.8});break;}
 case"enf_charger":{for(let b2=0;b2<3;b2++){setTimeout(()=>{if(!gs.player.alive)return;const ba=ag(e,gs.player);const _predA=ba+rand(-0.2,0.2);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*bs,vy:Math.sin(ba)*bs,size:5,dmg,src});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_predA)*bs*0.9,vy:Math.sin(_predA)*bs*0.9,size:4,dmg:dmg*0.6,src});},b2*80);}for(let i=-3;i<=3;i++){const wa=a+Math.PI+i*0.15;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(wa)*bs*0.3,vy:Math.sin(wa)*bs*0.3,size:6,dmg:dmg*0.3});}break;}
 case"enf_siren":{for(let i=-2;i<=2;i++){gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.4)*bs*0.8,vy:Math.sin(a+i*0.4)*bs*0.8,size:5,dmg:dmg*0.6,homing:true,homingLife:4500});}gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*1.5,vy:Math.sin(a)*bs*1.5,size:4,dmg:dmg*0.8});gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+Math.PI)*bs*0.6,vy:Math.sin(a+Math.PI)*bs*0.6,size:4,dmg:dmg*0.4});break;}
 case"enf_wraith":{const _wp=Math.floor(gs.time/250)%4;const _wOffsets=[0,PI2/4,PI2/2,-PI2/4];const _wBase=_wOffsets[_wp];for(let i=-3;i<=3;i++){gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+_wBase+i*0.12)*bs*1.3,vy:Math.sin(a+_wBase+i*0.12)*bs*1.3,size:5,dmg:dmg*0.55});}const _wo=gs.time*0.007;for(let i=0;i<5;i++){const _oa=_wo+i*(PI2/5);gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_oa)*bs*0.8,vy:Math.sin(_oa)*bs*0.8,size:4,dmg:dmg*0.4});}for(let i=-1;i<=1;i+=2){gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.08)*bs*2.2,vy:Math.sin(a+i*0.08)*bs*2.2,size:3,dmg:dmg*0.85});}break;}
 case"enf_fortress":{const _fRot=gs.time*0.002;const _fN=14;for(let i=0;i<_fN;i++){const ra=(PI2/_fN)*i+_fRot;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*bs*0.35,vy:Math.sin(ra)*bs*0.35,size:6,dmg:dmg*0.3});}const _fN2=10;for(let i=0;i<_fN2;i++){const ra2=(PI2/_fN2)*i-_fRot*1.5;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra2)*bs*0.8,vy:Math.sin(ra2)*bs*0.8,size:4,dmg:dmg*0.5});}for(let i=-1;i<=1;i++){gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.15)*bs*1.5,vy:Math.sin(a+i*0.15)*bs*1.5,size:7,dmg:dmg*0.8});}break;}
 case"enf_reaper":{const _rsOff=gs.time*0.003;for(let arm=0;arm<3;arm++){const armA=_rsOff+arm*(PI2/3);for(let j=0;j<5;j++){const ba=armA+j*0.25;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*bs*(0.5+j*0.2),vy:Math.sin(ba)*bs*(0.5+j*0.2),size:5,dmg:dmg*0.4});}}for(let i=-1;i<=1;i++){gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.1)*bs*2.0,vy:Math.sin(a+i*0.1)*bs*2.0,size:4,dmg:dmg*0.8});}break;}
 case"enf_boss":{
 if(!e._bossStart)e._bossStart=gs.time;
 const _elap=(gs.time-e._bossStart)/1000;
 e.fireRate=Math.max(350,800-_elap*7.5);
 if(_elap<15){
 const _arms=4;const _sOff=gs.time*0.0025;
 for(let arm=0;arm<_arms;arm++){
 const armA=_sOff+arm*(PI2/_arms);
 for(let j=0;j<5;j++){
 const ba=armA+j*0.12;const _sp=bs*(0.5+j*0.18);
 gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*_sp,vy:Math.sin(ba)*_sp,size:5,dmg:dmg*0.4});
 }
 }
 } else if(_elap<30){
 const _lead=Math.min(45,Math.hypot(p._lastVx||0,p._lastVy||0)*22);
 const _vx=p._lastVx||0;const _vy=p._lastVy||0;
 const _tx=p.x+_vx*_lead;const _ty=p.y+_vy*_lead;
 const _baseA=Math.atan2(_ty-e.y,_tx-e.x);
 for(let i=-3;i<=3;i++){
 gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_baseA+i*0.07)*bs*1.4,vy:Math.sin(_baseA+i*0.07)*bs*1.4,size:5,dmg:dmg*0.65});
 }
 for(let arm=0;arm<2;arm++){
 const armA=gs.time*0.003+arm*Math.PI;
 gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(armA)*bs*0.65,vy:Math.sin(armA)*bs*0.65,size:4,dmg:dmg*0.35});
 }
 } else if(_elap<45){
 const _ccCount=4;
 for(let cc=0;cc<_ccCount;cc++){
 const _cy=rand(40,GH-40);
 gs.eBullets.push({x:5,y:_cy,vx:bs*0.95,vy:rand(-0.45,0.45)*bs,size:5,dmg:dmg*0.5});
 gs.eBullets.push({x:GW-5,y:_cy,vx:-bs*0.95,vy:rand(-0.45,0.45)*bs,size:5,dmg:dmg*0.5});
 }
 gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*bs*1.9,vy:Math.sin(a)*bs*1.9,size:7,dmg:dmg*1.1});
 for(let arm=0;arm<3;arm++){
 const armA=gs.time*0.0035+arm*(PI2/3);
 gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(armA)*bs*0.55,vy:Math.sin(armA)*bs*0.55,size:4,dmg:dmg*0.3});
 }
 } else {
 for(let arm=0;arm<6;arm++){
 const armA=gs.time*0.004+arm*(PI2/6);
 for(let j=0;j<3;j++){
 gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(armA)*bs*(0.6+j*0.2),vy:Math.sin(armA)*bs*(0.6+j*0.2),size:4,dmg:dmg*0.32});
 }
 }
 for(let i=-2;i<=2;i++){
 gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(a+i*0.1)*bs*1.5,vy:Math.sin(a+i*0.1)*bs*1.5,size:5,dmg:dmg*0.6});
 }
 if(Math.random()<0.5){
 const _cy=p.y+rand(-30,30);
 gs.eBullets.push({x:5,y:_cy,vx:bs*1.05,vy:0,size:5,dmg:dmg*0.55});
 gs.eBullets.push({x:GW-5,y:_cy,vx:-bs*1.05,vy:0,size:5,dmg:dmg*0.55});
 }
 }
 break;
 }
 default:break;
 }
 for(let i=bl;i<gs.eBullets.length;i++)gs.eBullets[i].src=src;
 if(e._eliteReinf)for(let _bi=bl;_bi<gs.eBullets.length;_bi++)gs.eBullets[_bi]._fromReinf=true;
 }
 function fireBoss(gs,b){
 const p=gs.player,a=ag(b,p),bs=2.5+gs.wave*0.02,dmg=(8+gs.wave*2)*dmgScale(gs.wave)*0.3;
 const bl=gs.eBullets.length;
 if(gs._isEnforcer){b._enfAtk=((b._enfAtk||0)+1)%5;const _atk=b._enfAtk;if(_atk===0){for(let i=-3;i<=3;i++)gs.eBullets.push({x:b.x,y:b.y+20,vx:Math.cos(a+i*0.1)*bs*1.15,vy:Math.sin(a+i*0.1)*bs*1.15,size:6,dmg});}else if(_atk===1){const _bse=gs.time*0.004;for(let arm=0;arm<2;arm++)for(let i=0;i<6;i++){const ra=_bse+arm*Math.PI+i*0.42;gs.eBullets.push({x:b.x,y:b.y,vx:Math.cos(ra)*bs*0.85,vy:Math.sin(ra)*bs*0.85,size:5,dmg:dmg*0.9});}}else if(_atk===2){const _n=18+Math.floor(gs.wave*0.2);const _gap=a+Math.PI+rand(-0.5,0.5);for(let i=0;i<_n;i++){const ra=(PI2/_n)*i;let _df=(ra-_gap)%PI2;if(_df<0)_df+=PI2;if(_df>Math.PI)_df=PI2-_df;if(_df<0.55)continue;gs.eBullets.push({x:b.x,y:b.y,vx:Math.cos(ra)*bs*0.8,vy:Math.sin(ra)*bs*0.8,size:5,dmg:dmg*0.9});}}else if(_atk===3){const _bse=gs.time*0.003;for(let arm=0;arm<4;arm++){const ra=_bse+arm*(PI2/4);gs.eBullets.push({x:b.x,y:b.y,vx:Math.cos(ra)*bs,vy:Math.sin(ra)*bs,size:6,dmg});gs.eBullets.push({x:b.x,y:b.y,vx:Math.cos(ra+0.22)*bs,vy:Math.sin(ra+0.22)*bs,size:6,dmg});}}else{for(let i=-5;i<=5;i++){if(i===0||i===1)continue;gs.eBullets.push({x:clamp(b.x+i*16,8,GW-8),y:b.y+10,vx:0,vy:bs*0.9,size:6,dmg});}}for(let _ei=bl;_ei<gs.eBullets.length;_ei++)gs.eBullets[_ei].src="boss";return;}
 if(b.phase===1){for(let i=-2;i<=2;i++)gs.eBullets.push({x:b.x,y:b.y+20,vx:Math.cos(a+i*0.13)*bs,vy:Math.sin(a+i*0.13)*bs,size:6,dmg});}
 else{const n=10+Math.floor(gs.wave*0.2);for(let i=0;i<n;i++){const ra=(PI2/n)*i+gs.time*0.002;gs.eBullets.push({x:b.x,y:b.y,vx:Math.cos(ra)*bs*0.8,vy:Math.sin(ra)*bs*0.8,size:5,dmg:dmg*0.6});}
 for(let i=-1;i<=1;i++)gs.eBullets.push({x:b.x,y:b.y+20,vx:Math.cos(a+i*0.25)*bs*1.2,vy:Math.sin(a+i*0.25)*bs*1.2,size:7,dmg:dmg*1.2});}
 for(let i=bl;i<gs.eBullets.length;i++)gs.eBullets[i].src="boss";
 }
 function updateCargoLogic(dt,gs){
 const _cdY=gs._lastCamY!==undefined?(gs._camY-gs._lastCamY):0;
 if(_cdY!==0){
 gs.enemies.forEach(e=>{e.y-=_cdY;});
 gs.cargoTelegraphs.forEach(t=>{t.y-=_cdY;});
 gs.pBullets.forEach(b=>{b.y-=_cdY;});
 gs.eBullets.forEach(b=>{b.y-=_cdY;});
 gs.particles.forEach(p=>{p.y-=_cdY;});
 gs.pickups.forEach(pk=>{pk.y-=_cdY;});
 if(gs.homingMissiles)gs.homingMissiles.forEach(h=>{h.y-=_cdY;});
 if(gs.novaRings)gs.novaRings.forEach(n=>{n.y-=_cdY;});
 if(gs.gravWells)gs.gravWells.forEach(g=>{g.y-=_cdY;if(g.parentY!==undefined)g.parentY-=_cdY;});
 if(gs._novaMines)gs._novaMines.forEach(m=>{m.y-=_cdY;if(m.riseTarget>0)m.riseTarget-=_cdY;});
 if(gs.hitTexts)gs.hitTexts.forEach(ht=>{ht.y-=_cdY;});
 if(gs._lasso){gs._lasso.y-=_cdY;if(gs._lasso.ty!==undefined)gs._lasso.ty-=_cdY;if(gs._lasso.moveY!==undefined)gs._lasso.moveY-=_cdY;}
 gs.stars.forEach(s=>{s.y=((s.y-_cdY*0.4)%GH+GH)%GH;});
 }
 gs._lastCamY=gs._camY;
 gs.cargoDistance+=gs.cargoSpeedMPS*dt*0.001;while(gs.cargoDistance>=(gs._pkgCrossings+1)*500){gs._pkgCrossings++;const _pmult=1+(gs._pkgCrossings-1)*0.5;const _paliveC=gs.train.segs.filter(_s=>_s.alive).length;const _pgain=_paliveC*_pmult;gs.cargoPackages=(gs.cargoPackages||0)+_pgain;gs._pkgPopup={amt:_pgain,mult:_pmult,life:1600};}if(gs._pkgPopup){gs._pkgPopup.life-=dt;if(gs._pkgPopup.life<=0)gs._pkgPopup=null;}
 gs.train.worldY-=gs.cargoSpeedMPS*dt*0.001;if(metaRef.current.pathsUpg?.cg_regen){gs.train.segs.forEach((sg,si)=>{if(!sg.alive)return;const _selfOk=(gs.time-(sg._lastHit||-1e9))>5000;const _aheadOk=si===0||((gs.time-(((gs.train.segs[si-1]||{})._lastHit)||-1e9))>5000);if(_selfOk&&_aheadOk&&sg.hp<sg.maxHp){sg.hp=Math.min(sg.maxHp,sg.hp+sg.maxHp*0.02*dt*0.001);}});}
 if(gs.spawnQueue.length===0)startCargoNextWave(gs);
 for(let i=gs.cargoTelegraphs.length-1;i>=0;i--){
 const t=gs.cargoTelegraphs[i];t.timer-=dt*0.001;
 if(t.timer<=0){
 const ed=ED[t.type];if(!ed){gs.cargoTelegraphs.splice(i,1);continue;}
 const ws=hpScale(gs.wave),cs=1+gs.wave*0.015;
 const _aliveSegs=gs.train.segs.filter(s=>s.alive);
 const _tgtIdx=_aliveSegs.length>0?gs.train.segs.indexOf(_aliveSegs[_aliveSegs.length-1]):0;
 gs.enemies.push({type:t.type==="boss"?"boss":t.type,x:t.x,y:t.y,
 hp:t.type==="boss"?BASE_HP*18*ws:BASE_HP*ed.hpM*ws,
 maxHp:t.type==="boss"?BASE_HP*18*ws:BASE_HP*ed.hpM*ws,
 size:t.type==="boss"?35:ed.sz,
 speed:t.type==="boss"?0.8:ed.spd,color:t.type==="boss"?"#ff2266":ed.col,
 fireTimer:rand(0,ed.fr||1100),fireRate:t.type==="boss"?1100:Math.max(400,ed.fr-gs.wave*18),
 bulletSpeed:t.type==="boss"?3:ed.bs*(1+gs.wave*0.01),pattern:t.type==="boss"?"phase5":ed.pat,
 dM:ed.dM||1,phase:t.type==="boss"?1:undefined,moveTimer:0,
 scrapDrop:0,coreDrop:0,plasmaDrop:0,
 sineOff:rand(0,PI2),sineAmp:rand(15,30),entering:false,targetY:t.y,
 burnDmg:0,burnTimer:0,telegraphing:false,aimAngle:0,teleTimer:0,
 _cargo:true,targetSegIdx:_tgtIdx});
 gs.cargoTelegraphs.splice(i,1);
 }
 }
 gs.enemies.forEach(e=>{
 if(!e._cargo)return;
 let tgtIdx=e.targetSegIdx;
 const _isValidTgt=gs.train.segs[tgtIdx]&&gs.train.segs[tgtIdx].alive;
 if(!_isValidTgt){
 tgtIdx=-1;
 for(let si=gs.train.segs.length-1;si>=1;si--){if(gs.train.segs[si].alive){tgtIdx=si;break;}}
 if(tgtIdx<0&&gs.train.segs[0]&&gs.train.segs[0].alive)tgtIdx=0;
 if(tgtIdx<0)return; // every segment dead (game over imminent)
 e.targetSegIdx=tgtIdx;
 }
 const seg=gs.train.segs[tgtIdx];
 const segX=gs.train.screenX;
 const segY=(gs.train.worldY-gs._camY)+seg.offsetY;
 const ddx=segX-e.x;const ddy=segY-e.y;const dd=Math.sqrt(ddx*ddx+ddy*ddy)||1;
 let _mvX=(ddx/dd)*e.speed*0.4;let _mvY=(ddy/dd)*e.speed*0.4;
 const _vulnMult=gs._vulnTimer>0?2:1;
 gs.train.segs.forEach((_sg,_si)=>{
 if(_si===tgtIdx||!_sg.alive)return;
 const _sx=gs.train.screenX;const _sy=(gs.train.worldY-gs._camY)+_sg.offsetY;
 const _bx=_sx-e.x;const _by=_sy-e.y;const _bd=Math.sqrt(_bx*_bx+_by*_by)||1;
 if(_bd<_sg.w/2+e.size+18){
 const _perpX=-(ddy/dd);const _perpY=(ddx/dd);
 const _cross=_bx*_perpX+_by*_perpY;
 const _side=_cross>0?-1:1;
 const _force=0.6;
 _mvX+=_perpX*_side*_force;_mvY+=_perpY*_side*_force;
 if(_si!==0&&_bd<_sg.w/2+e.size+3){
 _sg.hp-=0.08*dt*0.06*_vulnMult;_sg._lastHit=gs.time;
 if(_sg.hp<=0){_sg.alive=false;_sg.hp=0;sp(gs,_sx,_sy,"#ff8844",20,5);gs.screenShake=6;}
 }
 }
 });
 e.x+=_mvX*dt*0.06;
 e.y+=_mvY*dt*0.06;
 gs.train.segs.forEach(_sg2=>{if(!_sg2.alive)return;
 const _sy2=(gs.train.worldY-gs._camY)+_sg2.offsetY;
 const _hw2=_sg2.w/2+e.size+1;const _hh2=_sg2.h/2+e.size+1;
 const _dx2=e.x-gs.train.screenX;const _dy2=e.y-_sy2;
 if(Math.abs(_dx2)<_hw2&&Math.abs(_dy2)<_hh2){
 const _ox2=_hw2-Math.abs(_dx2);const _oy2=_hh2-Math.abs(_dy2);
 if(_ox2<_oy2){e.x=gs.train.screenX+(_dx2>=0?1:-1)*_hw2;}
 else{e.y=_sy2+(_dy2>=0?1:-1)*_hh2;}
 }});
 if(dd<seg.w*0.5+e.size+3){
 seg.hp-=0.15*dt*0.06*_vulnMult;seg._lastHit=gs.time;
 if(seg.hp<=0){seg.alive=false;seg.hp=0;sp(gs,segX,segY,"#ff8844",20,5);gs.screenShake=6;}
 }
 });
 const _carriagesDead=gs.train.segs.every(s=>!s.alive);
 if(_carriagesDead&&!gs._cargoFinished){
 gs._cargoFinished=true;gs.player.alive=false;gs.deathCause="Train Destroyed";
 setMeta(prev=>{const _d=Math.floor(gs.cargoDistance);const nx={...prev,cargoHighDistance:Math.max(prev.cargoHighDistance||0,_d),packages:(prev.packages||0)+Math.floor(gs.cargoPackages||0)};saveMeta(nx);return nx;});
 setTimeout(()=>{_setCargoDeath({distance:Math.floor(gs.cargoDistance),kills:gs.kills,packages:Math.floor(gs.cargoPackages||0)});setPhase("menu");},600);
 }
 }
 function renderCargoOverlay(ctx,gs){
 const _tcx=gs.train.screenX;const _tcy=gs.train.worldY-gs._camY;
 ctx.save();
 ctx.shadowColor="#44ddffaa";ctx.shadowBlur=6;
 ctx.strokeStyle="rgba(68,221,255,0.35)";ctx.lineWidth=1.5;
 ctx.beginPath();ctx.moveTo(_tcx-22,-20);ctx.lineTo(_tcx-22,GH+20);ctx.stroke();
 ctx.beginPath();ctx.moveTo(_tcx+22,-20);ctx.lineTo(_tcx+22,GH+20);ctx.stroke();
 ctx.shadowBlur=0;
 ctx.strokeStyle="rgba(68,221,255,0.18)";ctx.lineWidth=2;
 const _sleeperGap=24;
 const _scrollY=gs._camY+gs.train.worldY;
 const _baseY=((-_scrollY*0.6)%_sleeperGap+_sleeperGap)%_sleeperGap;
 for(let _ry=_baseY-_sleeperGap;_ry<GH+_sleeperGap;_ry+=_sleeperGap){
 ctx.beginPath();ctx.moveTo(_tcx-26,_ry);ctx.lineTo(_tcx+26,_ry);ctx.stroke();
 }
 ctx.strokeStyle="rgba(68,221,255,0.08)";ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(_tcx,-20);ctx.lineTo(_tcx,GH+20);ctx.stroke();
 ctx.restore();
 {const _markW0=GH*0.5;const _kHi=Math.ceil((_markW0-gs._camY+40)/500);const _kLo=Math.max(1,Math.floor((_markW0-gs._camY-GH-40)/500));ctx.save();ctx.setLineDash([6,5]);ctx.lineWidth=2;for(let _mk=_kLo;_mk<=_kHi;_mk++){const _my=(_markW0-500*_mk)-gs._camY;if(_my<-12||_my>GH+12)continue;ctx.strokeStyle="#44ff66";ctx.globalAlpha=0.5;ctx.beginPath();ctx.moveTo(_tcx-34,_my);ctx.lineTo(_tcx+34,_my);ctx.stroke();ctx.globalAlpha=0.85;ctx.font="bold 8px 'DejaVu Sans Mono', monospace";ctx.fillStyle="#66ff88";ctx.textAlign="left";ctx.fillText((_mk*500)+"m",_tcx+38,_my+3);}ctx.setLineDash([]);ctx.globalAlpha=1;ctx.textAlign="left";ctx.restore();}
 if(gs._pkgPopup){const _pa=Math.min(1,gs._pkgPopup.life/400);ctx.save();ctx.globalAlpha=_pa;ctx.fillStyle="#ffdd88";ctx.font="bold 15px 'DejaVu Sans Mono', monospace";ctx.textAlign="center";ctx.fillText("+"+gs._pkgPopup.amt+" ▣",_tcx,_tcy-42);ctx.font="9px 'DejaVu Sans Mono', monospace";ctx.fillStyle="#88ff99";ctx.fillText("×"+gs._pkgPopup.mult+" interval",_tcx,_tcy-28);ctx.textAlign="left";ctx.globalAlpha=1;ctx.restore();}
 gs.train.segs.forEach((seg,i)=>{
 if(!seg.alive)return;
 const sx=_tcx;const sy=_tcy+seg.offsetY;
 if(sy<-50||sy>GH+50)return;
 const isEngine=i===0;
 const hw=seg.w/2,hh=seg.h/2;
 ctx.save();ctx.shadowColor=isEngine?"#55ddaa":"#44aaff";ctx.shadowBlur=10;
 ctx.fillStyle=isEngine?"#1a2a22":"#161a26";
 ctx.fillRect(sx-hw,sy-hh,seg.w,seg.h);
 ctx.fillStyle=isEngine?"#2a5544":"#243044";
 ctx.fillRect(sx-hw+1,sy-hh+1,seg.w-2,3);
 ctx.fillStyle="#08080e";
 ctx.fillRect(sx-hw+1,sy+hh-4,seg.w-2,3);
 ctx.strokeStyle=isEngine?"#66ddaa":"#5599cc";ctx.lineWidth=1.2;
 ctx.strokeRect(sx-hw,sy-hh,seg.w,seg.h);
 ctx.shadowBlur=0;
 if(isEngine){
 ctx.shadowColor="#aaffdd";ctx.shadowBlur=6;
 ctx.fillStyle="#aaffdd";
 ctx.beginPath();ctx.arc(sx,sy-hh-2,3,0,PI2);ctx.fill();
 ctx.shadowBlur=0;
 ctx.fillStyle="#1a2a22";ctx.fillRect(sx-4,sy-hh-8,8,4);
 ctx.fillStyle="#2a5544";ctx.fillRect(sx-4,sy-hh-8,8,1);
 const _puffT=gs.time*0.001;
 for(let _pi=0;_pi<3;_pi++){
 const _po=(_puffT+_pi*0.33)%1;
 const _px=sx+Math.sin((_puffT+_pi)*1.5)*3;
 const _py=sy-hh-12-_po*16;
 ctx.fillStyle=`rgba(150,200,180,${(1-_po)*0.5})`;
 ctx.beginPath();ctx.arc(_px,_py,2+_po*2,0,PI2);ctx.fill();
 }
 ctx.shadowColor="#88ffcc";ctx.shadowBlur=4;
 ctx.fillStyle="#88ffcc";
 ctx.fillRect(sx-hw*0.5,sy-hh*0.3,seg.w*0.5,seg.h*0.35);
 ctx.shadowBlur=0;
 ctx.strokeStyle="#1a3a2a";ctx.lineWidth=0.8;
 ctx.beginPath();
 ctx.moveTo(sx,sy-hh*0.3);ctx.lineTo(sx,sy-hh*0.3+seg.h*0.35);
 ctx.moveTo(sx-hw*0.5,sy-hh*0.3+seg.h*0.18);ctx.lineTo(sx+hw*0.5,sy-hh*0.3+seg.h*0.18);
 ctx.stroke();
 ctx.fillStyle="#55cc88";
 ctx.fillRect(sx-hw+3,sy+hh*0.25,3,2);
 ctx.fillRect(sx+hw-6,sy+hh*0.25,3,2);
 } else {
 ctx.fillStyle="#1a2238";ctx.fillRect(sx-hw+3,sy-hh+5,seg.w-6,2);
 for(let _vi=0;_vi<3;_vi++){ctx.fillStyle="#3a5577";ctx.fillRect(sx-hw+5+_vi*((seg.w-10)/3),sy-hh+5,2,2);}
 ctx.strokeStyle="#44aaff66";ctx.lineWidth=0.8;
 ctx.strokeRect(sx-hw*0.7,sy-hh*0.2,seg.w*0.7,seg.h*0.55);
 ctx.beginPath();
 ctx.moveTo(sx,sy-hh*0.2);ctx.lineTo(sx,sy-hh*0.2+seg.h*0.55);
 ctx.stroke();
 ctx.fillStyle="#5599cc";
 [-1,1].forEach(_rx=>[-1,1].forEach(_ry=>{
 ctx.beginPath();ctx.arc(sx+_rx*(hw-2.5),sy+_ry*(hh-2.5),1,0,PI2);ctx.fill();
 }));
 ctx.fillStyle="#44aaff";ctx.globalAlpha=0.6;
 ctx.fillRect(sx-hw+2,sy+hh-7,seg.w-4,1);
 ctx.globalAlpha=1;
 }
 ctx.restore();
 const _wheelYOffs=[-seg.h*0.30,seg.h*0.30];
 const _wheelXOffs=[-(seg.w/2+2),(seg.w/2+2)];
 _wheelXOffs.forEach(_wxo=>{
 _wheelYOffs.forEach(_wyo=>{
 ctx.fillStyle="#0a0a14";
 ctx.fillRect(sx+_wxo-1.7,sy+_wyo-3,3.4,6);
 ctx.strokeStyle="#2a2e3a";ctx.lineWidth=0.8;
 ctx.strokeRect(sx+_wxo-1.7,sy+_wyo-3,3.4,6);
 ctx.fillStyle=isEngine?"#557766":"#3a4a66";
 ctx.fillRect(sx+_wxo-1.4,sy+_wyo-0.4,2.8,0.8);
 });
 });
 if(i<gs.train.segs.length-1&&gs.train.segs[i+1].alive){
 const nseg=gs.train.segs[i+1];
 const _gap=nseg.offsetY-seg.offsetY-seg.h;
 ctx.strokeStyle="#5577aa";ctx.lineWidth=2.5;
 ctx.beginPath();ctx.moveTo(sx,sy+hh);ctx.lineTo(sx,sy+hh+_gap);ctx.stroke();
 ctx.fillStyle="#7799cc";
 ctx.beginPath();ctx.arc(sx,sy+hh+_gap/2,1.8,0,PI2);ctx.fill();
 }
 const hpPct=seg.hp/seg.maxHp;if(hpPct<1){
 ctx.save();
 ctx.fillStyle="#0a0a14";ctx.fillRect(sx+hw+8,sy-hh,4,seg.h);
 ctx.strokeStyle="#22334466";ctx.lineWidth=0.8;ctx.strokeRect(sx+hw+8,sy-hh,4,seg.h);
 const _hpCol=hpPct>0.5?"#55cc88":hpPct>0.25?"#ffcc44":"#ff4466";
 ctx.shadowColor=_hpCol;ctx.shadowBlur=4;
 ctx.fillStyle=_hpCol;
 ctx.fillRect(sx+hw+8,sy+hh-seg.h*hpPct,4,seg.h*hpPct);
 ctx.restore();
 }
 });
 gs.cargoTelegraphs.forEach(t=>{const prog=1-t.timer/t.maxTimer;
 ctx.globalAlpha=0.15+prog*0.55;ctx.strokeStyle="#ff2244";ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(t.x,t.y,18-prog*8,0,PI2);ctx.stroke();
 ctx.globalAlpha=prog*0.25;ctx.fillStyle="#ff2244";ctx.beginPath();ctx.arc(t.x,t.y,18-prog*8,0,PI2);ctx.fill();
 ctx.globalAlpha=0.4+prog*0.4;ctx.strokeStyle="#ff4466";ctx.lineWidth=1;
 ctx.beginPath();ctx.arc(t.x,t.y,4,0,PI2*prog);ctx.stroke();
 ctx.globalAlpha=1;});
 gs.enemies.forEach(e=>{
 if(!e._cargo)return;
 const _eOnTop=e.y<-e.size;const _eOnBot=e.y>GH+e.size;
 if(!_eOnTop&&!_eOnBot)return;
 const _ix=Math.max(18,Math.min(GW-18,e.x));
 const _iy=_eOnTop?18:GH-18;
 const _pulse=0.7+Math.sin(gs.time*0.008)*0.3;
 ctx.save();
 ctx.shadowColor="#ff2244";ctx.shadowBlur=8;
 ctx.fillStyle=`rgba(255,34,68,${_pulse})`;
 ctx.beginPath();
 if(_eOnTop){ctx.moveTo(_ix,_iy-10);ctx.lineTo(_ix-9,_iy+6);ctx.lineTo(_ix+9,_iy+6);}
 else{ctx.moveTo(_ix,_iy+10);ctx.lineTo(_ix-9,_iy-6);ctx.lineTo(_ix+9,_iy-6);}
 ctx.closePath();ctx.fill();
 ctx.shadowBlur=0;
 ctx.fillStyle="#fff";
 const _exclBarY=_eOnTop?_iy-7:_iy-4;
 const _exclDotY=_eOnTop?_iy+3:_iy+6;
 ctx.fillRect(_ix-0.9,_exclBarY,1.8,5);
 ctx.beginPath();ctx.arc(_ix,_exclDotY,1.3,0,PI2);ctx.fill();
 ctx.restore();
 });
 }
 function spawnPk(gs,e){
 if(gs.isPlayground||gs.isNewMode||gs.isCargo)return;
 const fm=gs.player.fortuneMult;
 const _goldMul=1;
 const mk=(t,v,x,y)=>{if(v<=0)return;const mult=t==="plasma"?fm*0.5:fm;gs.pickups.push({x:x+rand(-10,10),y:y+rand(-10,10),type:t,value:Math.max(1,Math.round(v*mult)),vy:rand(-1.5,0.3),vx:rand(-1.2,1.2),life:540+(gs.player.pickupLife||0),size:t==="plasma"?9:t==="cores"?7:5.5,_waveCreated:gs.wave});};
 mk("scrap",e.scrapDrop,e.x,e.y);mk("cores",e.coreDrop,e.x,e.y);mk("plasma",e.plasmaDrop,e.x,e.y);
 }
 function sp(gs,x,y,c,n,s){for(let i=0;i<n;i++){const a=rand(0,PI2),v=rand(s*0.3,s);gs.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(15,40),ml:40,color:c,size:rand(1.5,4)});}}
 function chainL(gs,fx,fy,dmg){
 const _clCount=hasAU(gs,"chain_sub1")?4:2;let tgts=[...gs.enemies].filter(e=>e.type!=="fortress"&&!e._eliteReinf).sort((a,b)=>dist(a,{x:fx,y:fy})-dist(b,{x:fx,y:fy})).slice(0,_clCount);
 let cx=fx,cy=fy;
 tgts.forEach(t=>{const cd=dmg*0.3;t.hp-=cd*(t._botDmgM||1);trackBounce(gs,"Blue Chain Lightning",cd,(t._botDmgM||1));sp(gs,t.x,t.y,"#88ddff",8,3);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:t.x+rand(-6,6),y:t.y-t.size,text:Math.round(cd),life:22,ml:22,col:"#88ddff"});
 const segs=8;for(let i=0;i<segs;i++){const f=i/segs;const nx=lerp(cx,t.x,f)+rand(-12,12),ny=lerp(cy,t.y,f)+rand(-12,12);
 gs.particles.push({x:nx,y:ny,vx:rand(-0.3,0.3),vy:rand(-0.3,0.3),life:14,ml:14,color:i%2===0?"#aaeeff":"#ffffff",size:rand(2,3.5)});}
 gs.particles.push({x:t.x,y:t.y,vx:0,vy:0,life:12,ml:12,color:"#ffffff",size:6});
 cx=t.x;cy=t.y;});
 }
 function greenChainL(gs,fx,fy,dmg){
 let tgts=[...gs.enemies].filter(e=>e.type!=="fortress"&&!e._eliteReinf).sort((a,b)=>dist(a,{x:fx,y:fy})-dist(b,{x:fx,y:fy})).slice(0,4);
 let cx=fx,cy=fy;const kills=[];
 tgts.forEach(t=>{const arcD=dmg*0.25;const elecD=dmg*0.4;const td=arcD+elecD;t.hp-=td*(t._botDmgM||1);trackBounce(gs,"Green Chain Lightning",td,(t._botDmgM||1));
 t._elecTimer=300;t._elecColor="#44ff88";sp(gs,t.x,t.y,"#44ff88",8,3);
 if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:t.x+rand(-6,6),y:t.y-t.size,text:Math.round(td),life:22,ml:22,col:"#44ff88"});
 const segs=8;for(let i=0;i<segs;i++){const f=i/segs;const nx=lerp(cx,t.x,f)+rand(-12,12),ny=lerp(cy,t.y,f)+rand(-12,12);
 gs.particles.push({x:nx,y:ny,vx:rand(-0.3,0.3),vy:rand(-0.3,0.3),life:14,ml:14,color:i%2===0?"#66ff99":"#aaffcc",size:rand(2,3.5)});}
 gs.particles.push({x:t.x,y:t.y,vx:0,vy:0,life:12,ml:12,color:"#aaffcc",size:6});
 if(t.hp<=0){const idx=gs.enemies.indexOf(t);if(idx>=0)kills.push({e:t,idx});}
 cx=t.x;cy=t.y;});
 kills.sort((a,b)=>b.idx-a.idx).forEach(k=>killE(gs,k.e,k.idx));
 }
 function killE(gs,e,idx){if(e._eliteReinf){const _othersAlive=gs.enemies.some(en=>en!==e&&!en._eliteReinf&&en.hp>0);if(_othersAlive){e.hp=Math.max(1,e.maxHp*0.05);return;}}{const _hb=_activeBot(gs,"health");if(_hb&&dist(e,_hb)<_hb.rPx){const _hp=gs.player;if(gs._hbBaseMaxHp==null)gs._hbBaseMaxHp=_hp.maxHp;gs._hbMult=Math.min(4,(gs._hbMult||1)+_hb.cust);_hp.maxHp=gs._hbBaseMaxHp*gs._hbMult;const _hcap=_hp.maxHp*(has(gs,"overcharge")?(hasAU(gs,"overcharge_sub1")?1.4:1.2):1);const _hb0=_hp.hp;_hp.hp=Math.min(_hp.hp+gs._hbBaseMaxHp*_hb.cust,_hcap);const _hg=_hp.hp-_hb0;if(_hg>0)trackHeal(gs,"Health Bot",_hg);gs._hbFlash=180;}}if(metaRef.current.overheatUnlocked&&(e.burnTimer>0||e._burnKilled)){const _ohcLvl=metaRef.current.lab?.completed?.overheat_chance||0;const _ohcPct=_ohcLvl>0?[30,35,40,45,50][Math.min(_ohcLvl-1,4)]:25;if(Math.random()*100<_ohcPct){let _ohGain=1;const _obmL=metaRef.current.lab?.completed?.overheat_bot_mult||0;if(_obmL>0&&_enemyInBot(gs,e))_ohGain+=_obmL;gs._overheatPoints=(gs._overheatPoints||0)+_ohGain;if(!gs.isCargo&&!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&!gs.isTutorial&&!metaRef.current.overheatBorderOff)gs._overheatBorderTimer=800;}}if(e.type==="boss"&&!gs._isEnforcer){const _bsLvl=metaRef.current.lab?.completed?.boss_shard_drop||0;const _bsPct=_bsLvl*8;if(_bsPct>0&&Math.random()*100<_bsPct){gs.pickups.push({x:e.x,y:e.y,type:"bossShards",value:1,life:600,vx:rand(-1,1),vy:rand(-3,-1),size:12,color:"#cc3333",icon:"◈",_waveCreated:gs.wave});}}
 const _isSplitterChild=e.type==="splitter"&&e.size<=10;
 if(!e._eliteReinf)gs.kills++;if(!_isSplitterChild&&!e._eliteReinf)gs.waveKilled++;
 if(e.burnTimer>0||e._burnKilled){const _fc2=e._orbHit?["#1144cc","#2266dd","#4488ee","#66aaff","#88ccff","#bbddff"]:["#cc2200","#ff4411","#ff6622","#ff8833","#ffaa33","#ffcc44"];const _fN=e.type==="boss"?30:16;for(let _fi=0;_fi<_fN;_fi++){const _fa=rand(0,PI2);const _fspd=rand(0.3,1.5);gs.particles.push({x:e.x+rand(-e.size*0.5,e.size*0.5),y:e.y+rand(-e.size*0.5,e.size*0.5),vx:Math.cos(_fa)*_fspd,vy:-rand(0.8,2.5),life:rand(30,60),ml:60,color:_fc2[Math.floor(rand(0,_fc2.length))],size:rand(2,5)});}}else{sp(gs,e.x,e.y,e.color,e.type==="boss"?22:8,e.type==="boss"?5:3);}
 if(!e._eliteReinf)spawnPk(gs,e);
 if(e.type==="bomber"){const _sfR2=has(gs,"slowfield")?(hasAU(gs,"slowfield_sub1")?180:90):0;const _halfB=hasAU(gs,"slowfield_mastery")&&dist(e,gs.player)<_sfR2;const _bCount=Math.max(1,Math.round((_halfB?4:8)*(gs._dealerMods?.bomber?.bombM||1)));for(let k=0;k<_bCount;k++){const ra=(PI2/_bCount)*k;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(ra)*2.5,vy:Math.sin(ra)*2.5,size:5,dmg:(12+gs.wave*1.5)*(e.dM||1.3),src:"bomber"});}}
 if(e.type==="splitter"&&e.size>10&&!(gs._dealerMods?.splitter?.noSplit)){
 const _spm=gs._dealerMods?.splitter;for(let i=0;i<(_spm?.splitN??2);i++){const ch=e.maxHp*0.3;gs.enemies.push({type:"splitter",x:e.x+rand(-12,12),y:e.y+rand(-8,8),hp:ch,maxHp:ch,size:10,speed:e.speed*1.3,color:"#88ffdd",fireTimer:rand(0,2000),fireRate:_spm?.childRapid?900:2200,bulletSpeed:2.5,pattern:_spm?.childNoFire?"none":"aimed",dM:0.5,scrapDrop:gs.isCargo?0:1,coreDrop:0,plasmaDrop:0,sineOff:rand(0,PI2),sineAmp:rand(20,40),entering:false,targetY:e.y,burnDmg:0,burnTimer:0,telegraphing:false,aimAngle:0,teleTimer:0,_cargo:e._cargo});gs.enemiesLeft++;}
 }
 gs.screenShake=e.type==="boss"?14:gs.screenShake;
 if(gs._droneRage===e)gs._droneRage=null;
 const _ri=gs.enemies.indexOf(e);if(_ri>=0)gs.enemies.splice(_ri,1);gs.enemiesLeft--;
 }
 function update(dt){
 const gs=gsRef.current;if(!gs)return;
 if(!gs.player.alive)return;
 if(gs.isTutorial&&[1,20,30,40,50].includes(tutRef.current))return;
 const _S_=_settersRef.current,_isRpl_=!!gs._isReplay,_noop_=()=>{};
 const setPhase=_isRpl_?_noop_:_S_.setPhase;
 const setMeta=_isRpl_?_noop_:_S_.setMeta;
 const setDeathData=_isRpl_?_noop_:_S_.setDeathData;
 const setShopData=_isRpl_?_noop_:_S_.setShopData;
 const setAbChoices=_isRpl_?_noop_:_S_.setAbChoices;
 const setTutStep=_isRpl_?_noop_:_S_.setTutStep;
 const setPgMode=_isRpl_?_noop_:_S_.setPgMode;
 const _setCargoDeath=_isRpl_?_noop_:_S_._setCargoDeath;
 const _setEnforcerDeath=_isRpl_?_noop_:_S_._setEnforcerDeath;
 const saveMeta=_isRpl_?_noop_:_S_.saveMeta;
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
 p._lastVx=(dx/mg);p._lastVy=(dy/mg);p.x=clamp(p.x+(dx/mg)*spd*dt*0.06,p.size,GW-p.size);
 if(gs.isCargo){
 p._lastVx=(dx/mg);p._lastVy=(dy/mg);
 const _yMove=(dy/mg)*spd*dt*0.06;
 let _newY=p.y+_yMove;
 const _scrollM=GH*0.25;
 if(_newY<_scrollM){gs._camY-=(_scrollM-_newY);_newY=_scrollM;}
 else if(_newY>GH-_scrollM){gs._camY+=(_newY-(GH-_scrollM));_newY=GH-_scrollM;}
 p.y=_newY;
 if(gs.train){const _tcx=gs.train.screenX;const _tcy0=gs.train.worldY-gs._camY;
 gs.train.segs.forEach(_seg=>{if(!_seg.alive)return;
 const _segY=_tcy0+_seg.offsetY;const _hwT=_seg.w/2+p.size+1;const _hhT=_seg.h/2+p.size+1;
 const _ddx=p.x-_tcx;const _ddy=p.y-_segY;
 if(Math.abs(_ddx)<_hwT&&Math.abs(_ddy)<_hhT){
 const _xOver=_hwT-Math.abs(_ddx);const _yOver=_hhT-Math.abs(_ddy);
 if(_xOver<_yOver){p.x=clamp(_tcx+(_ddx>=0?1:-1)*_hwT,p.size,GW-p.size);}
 else{p.y=clamp(_segY+(_ddy>=0?1:-1)*_hhT,p.size,GH-p.size);}
 }
 });}
 }else{p.y=clamp(p.y+(dy/mg)*spd*dt*0.06,p.size,GH-p.size);}
 if(p.invTimer>0)p.invTimer-=dt;
 if(p.regenRate>0){const _rh=Math.min(p.maxHp-p.hp,p.regenRate*dt*0.001);if(_rh>0){p.hp+=_rh;trackHeal(gs,"Nanobots",_rh);}}
 let fd=p.fireDelay,pp=p.pierce;
 if((p.kineticBonus||0)>0){const _km=(keysRef.current["w"]||keysRef.current["a"]||keysRef.current["s"]||keysRef.current["d"]||keysRef.current["arrowup"]||keysRef.current["arrowdown"]||keysRef.current["arrowleft"]||keysRef.current["arrowright"])?1:0;p._kineticActive=_km;}
 p.fireTimer-=dt;if(p.fireTimer<=0&&!p._noMainGun){p.fireTimer=fd;const sv=p.pierce;p.pierce=pp;firePB(gs);p.pierce=sv;}
 if(has(gs,"nova")){p.novaTimer+=dt;if(p.novaTimer>=6000){p.novaTimer=0;if(!gs._novaMines)gs._novaMines=[];gs._novaMines.push({x:p.x,y:p.y,dmg:p.damage*1.0*(gs._inSprint&&metaRef.current.pathsUpg?.sp_dmg?1.25:1),r:200,life:999,riseTarget:hasAU(gs,"nova_sub1")&&p.y>GH*0.5?rand(GH*0.4,GH*0.6):0,riseDelay:120,bossDmg:hasAU(gs,"nova_sub2")});sp(gs,p.x,p.y,"#ff88ff",6,3);}}
 if(gs._novaMines){gs._novaMines.forEach(nm=>{if(nm.riseTarget>0){if(nm.riseDelay>0)nm.riseDelay-=dt*0.06;else if(Math.abs(nm.y-nm.riseTarget)>2)nm.y+=(nm.riseTarget-nm.y)*0.015*dt*0.06;}if(gs.isCargo&&gs.train){const _mtx=gs.train.screenX,_mty0=gs.train.worldY-gs._camY,_mr=10;gs.train.segs.forEach(_msg=>{if(!_msg.alive)return;const _msY=_mty0+_msg.offsetY,_mhw=_msg.w/2+_mr,_mhh=_msg.h/2+_mr,_mdx=nm.x-_mtx,_mdy=nm.y-_msY;if(Math.abs(_mdx)<_mhw&&Math.abs(_mdy)<_mhh){const _mxo=_mhw-Math.abs(_mdx),_myo=_mhh-Math.abs(_mdy);if(_mxo<_myo){nm.x=_mtx+(_mdx>=0?1:-1)*_mhw;}else{nm.y=_msY+(_mdy>=0?1:-1)*_mhh;if(nm.riseTarget>0)nm.riseTarget=nm.y;}}});}const _mineDetR=30;gs.enemies.forEach((e,ei)=>{if(dist(e,nm)<_mineDetR&&!nm.det){nm.det=true;const mk=[];gs.enemies.forEach((te,ti)=>{if(dist(te,nm)<nm.r){let _md=nm.dmg;if(nm.bossDmg&&te.type==="boss")_md*=4;te.hp-=_md*(te._botDmgM||1);trackBounce(gs,"Plasma Landmine",_md,(te._botDmgM||1));sp(gs,te.x,te.y,"#ff88ff",6,3);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:te.x,y:te.y-te.size,text:Math.round(_md),life:24,ml:24,col:"#ff88ff"});if(te.hp<=0)mk.push(ti);}});mk.sort((a,b)=>b-a).forEach(ki=>killE(gs,gs.enemies[ki],ki));sp(gs,nm.x,nm.y,"#ff88ff",18,6);gs.screenShake=5;gs.novaRings.push({x:nm.x,y:nm.y,r:0,maxR:nm.r,life:22,ml:22});}});});gs._novaMines=gs._novaMines.filter(nm=>!nm.det);}
 if(has(gs,"homing")){const _hmDelay=hasAU(gs,"homing_sub1")?1000:1500;p.homingTimer+=dt;if(p.homingTimer>=_hmDelay&&gs.enemies.length>0){p.homingTimer=0;const _mCrit=hasAU(gs,"homing_sub2")&&Math.random()<0.15;gs.homingMissiles.push({x:p.x,y:p.y-10,vx:0,vy:-2,dmg:p.damage*0.4*(1+(p._kineticActive?p.kineticBonus:0))*(_mCrit?2.5:1)*(gs._inSprint&&metaRef.current.pathsUpg?.sp_dmg?1.25:1),life:260,size:4,isCrit:_mCrit});}}
 if(has(gs,"gravity")){p.gravTimer+=dt;if(p.gravTimer>=8000&&gs.enemies.length>0){p.gravTimer=0;gs._gwCount=(gs._gwCount||0)+1;const isGold=hasAU(gs,"gravity_mastery")&&gs._gwCount%2===0;const cx=gs.enemies.length>0?gs.enemies.reduce((s,e)=>s+e.x,0)/gs.enemies.length:GW/2;const cy=gs.enemies.length>0?gs.enemies.reduce((s,e)=>s+e.y,0)/gs.enemies.length:GH*0.3;gs.gravWells.push({x:cx,y:cy,life:240,ml:240,r:110,golden:isGold});if(hasAU(gs,"gravity_sub2")){const _ga=rand(0,PI2);const _gd=110;const ox=cx+Math.cos(_ga)*_gd,oy=cy+Math.sin(_ga)*_gd;gs.gravWells.push({x:clamp(ox,30,GW-30),y:clamp(oy,30,GH*0.6),life:240,ml:240,r:70,golden:isGold,conjoined:true,parentX:cx,parentY:cy});}}}
 if(has(gs,"void_regen")){const _vrWin=hasAU(gs,"void_regen_sub2")&&gs.waveKilled>0?2500:4000;if(gs.time-p.lastDmgTime>_vrWin){const vrCap=p.maxHp*(hasAU(gs,"void_regen_sub1")?0.9:0.6);const vrTarget=has(gs,"overcharge")?p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2):vrCap;if(p.hp<vrTarget){const vrHeal=Math.min(vrTarget-p.hp,p.maxHp*0.02*dt*0.001);if(vrHeal>0){p.hp+=vrHeal;trackHeal(gs,"Void Regen",vrHeal);}else{p.hp=p.hp;}if(!gs._vrPlus)gs._vrPlus=[];gs._vrPlusT=(gs._vrPlusT||0)+dt;if(gs._vrPlusT>120){gs._vrPlusT=0;gs._vrPlus.push({ox:rand(-14,14),oy:rand(-6,10),vy:-rand(0.6,1.4),life:35,ml:35,sz:rand(2.5,4.5)});}}}}
 if(gs._vrPlus&&gs._vrPlus.length>0){gs._vrPlus.forEach(v=>{v.oy+=v.vy*dt*0.06;v.life-=dt*0.06;});gs._vrPlus=gs._vrPlus.filter(v=>v.life>0);}
 if(gs._bots&&gs._bots.length){if(gs._hbFlash>0)gs._hbFlash-=dt;for(const b of gs._bots){const per=b.inactMs+b.actMs;b.cycle+=dt;if(b.cycle>=per)b.cycle-=per;b.active=b.cycle>=b.inactMs;if(b._baseRPx==null)b._baseRPx=b.rPx;b.rPx=(b.active&&metaRef.current.pathsUpg?.bt_field&&dist(gs.player,b)<b._baseRPx)?b._baseRPx*1.3:b._baseRPx;if(!b.active){const _bspd=(metaRef.current.pathsUpg?.bt_spd&&b.y>GH*0.6)?2:1;b.x+=b.vx*dt*0.06*_bspd;b.y+=b.vy*dt*0.06*_bspd;if(b.x<b.rPx){b.x=b.rPx;b.vx=Math.abs(b.vx);}else if(b.x>GW-b.rPx){b.x=GW-b.rPx;b.vx=-Math.abs(b.vx);}if(b.y<b.rPx+30){b.y=b.rPx+30;b.vy=Math.abs(b.vy);}else if(b.y>GH-b.rPx){b.y=GH-b.rPx;b.vy=-Math.abs(b.vy);}b.curR=lerp(b.curR,8,0.2*dt*0.06);}else{b.curR=lerp(b.curR,b.rPx,0.18*dt*0.06);}}gs.enemies.forEach(e=>{e._botDmgM=1;});const _bbot=_activeBot(gs,"bounce");if(_bbot){gs.enemies.forEach(e=>{if(dist(e,_bbot)<_bbot.rPx)e._botDmgM=_bbot.cust;});}}
 gs.gravWells.forEach(gw=>{gw.life-=dt*0.06;gs.enemies.forEach(e=>{if(e.type==="boss"||e._eliteReinf||_enemyInBot(gs,e))return;if(dist(e,gw)<gw.r){const a=ag(e,gw);e.x+=Math.cos(a)*1.4*dt*0.06;e.y+=Math.sin(a)*1.4*dt*0.06;if(gw.golden)e._inGoldenGW=true;}else if(gw.golden&&e._inGoldenGW){e._inGoldenGW=false;}});gs.eBullets.forEach(b=>{if(dist(b,gw)<gw.r){const a=ag(b,gw);b.vx+=Math.cos(a)*0.04*dt*0.06;b.vy+=Math.sin(a)*0.04*dt*0.06;if(hasAU(gs,"gravity_sub1")){if(!b._origSz)b._origSz=b.size;b.size=Math.max(b._origSz*0.68,b.size-b._origSz*0.04*dt*0.001);}}});});
 gs.gravWells=gs.gravWells.filter(g=>g.life>0);
 gs.novaRings.forEach(nr=>{nr.life-=dt*0.06;nr.r=lerp(0,nr.maxR,1-nr.life/nr.ml);});
 gs.novaRings=gs.novaRings.filter(nr=>nr.life>0);
 if(has(gs,"orbitals")){gs.orbitals.forEach(o=>{const _iR=hasAU(gs,"orbitals_mastery")?32:36;if(o.layer===1){const _raw=Math.abs(Math.cos(o.angle));const _spdM=0.35+_raw*_raw*0.65;o.angle+=0.003*dt*_spdM;}else{o.angle+=0.004*dt;}let ox,oy;if(o.layer===1){ox=p.x+Math.cos(o.angle)*190;oy=p.y+Math.sin(o.angle)*48;}else{ox=p.x+Math.cos(o.angle)*_iR;oy=p.y+Math.sin(o.angle)*_iR;}gs.eBullets=gs.eBullets.filter(b=>dist(b,{x:ox,y:oy})>8);
 if(hasAU(gs,"orbitals_sub2")){gs.enemies.forEach(e=>{if(!e._orbHit&&dist(e,{x:ox,y:oy})<e.size+6){e._orbHit=true;const _odM=(e._botDmgM||1);const _odB=p.damage*0.3*(gs._inSprint&&metaRef.current.pathsUpg?.sp_dmg?1.25:1);const od=_odB*_odM;e.hp-=od;trackBounce(gs,"Orbital Electrons",_odB,_odM);sp(gs,e.x,e.y,"#00e5ff",6,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-6,6),y:e.y-e.size,text:Math.round(od),life:22,ml:22,col:"#00e5ff"});if(e.hp<=0){const idx=gs.enemies.indexOf(e);if(idx>=0)killE(gs,e,idx);}}});}});}
 gs.drones.forEach(dr=>{dr.x=lerp(dr.x,p.x+26,0.03*dt*0.06);dr.y=lerp(dr.y,p.y+16,0.03*dt*0.06);
 if(gs._droneRage&&!gs.enemies.includes(gs._droneRage))gs._droneRage=null;const _drFd=hasAU(gs,"drone_sub1")&&gs._droneRage?200:400;
 const _drDmgMul=(0.20+(hasAU(gs,"drone_sub2")?(p.abilities.length-1)*0.03:0))*(1+(p._kineticActive?p.kineticBonus:0));
 dr.ft-=dt;if(dr.ft<=0&&gs.enemies.length>0){dr.ft=_drFd;
 let cl;if(hasAU(gs,"drone_sub1")&&gs._droneRage&&gs.enemies.includes(gs._droneRage)){cl=gs._droneRage;}else{cl=gs.enemies.reduce((b,e)=>{if(e._eliteReinf)return b;return(!b||dist(e,dr)<dist(b,dr))?e:b;},null);}
 if(cl){const a=ag(dr,cl);gs.pBullets.push({x:dr.x,y:dr.y,vx:Math.cos(a)*6,vy:Math.sin(a)*6,damage:p.damage*_drDmgMul*(gs._inSprint&&metaRef.current.pathsUpg?.sp_dmg?1.25:1),pierce:0,isChain:false,isCrit:false,size:3,bounces:0,acid:0,src:"drone"});}}});
 if(has(gs,"mirror")){const _mfd=hasAU(gs,"mirror_sub1")?fd:fd*2;gs._mirrorTimer=(gs._mirrorTimer||0)-dt;if(gs._mirrorTimer<=0){gs._mirrorTimer=_mfd;gs.pBullets.push({x:GW-p.x,y:p.y-p.size,vx:0,vy:-BSPD,damage:p.damage*0.3*(1+(p._kineticActive?p.kineticBonus:0))*(gs._inSprint&&metaRef.current.pathsUpg?.sp_dmg?1.25:1),pierce:0,isChain:false,isCrit:false,size:p.bulletSize-1,bounces:0,acid:0,src:"mirror"});}}
 if(has(gs,"mirror")&&hasAU(gs,"mirror_mastery")){gs._lassoTimer=(gs._lassoTimer||0)+dt;if(gs._lassoTimer>=12000&&gs.enemies.length>0){gs._lassoTimer=0;
 let bestX=GW/2,bestY=GH*0.3,bestD=0;gs.enemies.forEach(e=>{let dens=0;gs.enemies.forEach(e2=>{if(dist(e,e2)<100)dens++;});if(dens>bestD){bestD=dens;bestX=e.x;bestY=e.y;}});
 gs._lasso={x:GW-p.x,y:p.y,tx:bestX,ty:bestY,phase:"windup",timer:2000,pushTimer:0,pushR:100};}}
 if(gs._lasso){const L=gs._lasso;if(L.phase==="windup"){L.timer-=dt;L._spin=(L._spin||0)+dt*0.012;if(L.timer<=0){L.phase="target";let bX=GW/2,bY=GH*0.3,bD=0;gs.enemies.forEach(e=>{let d=0;gs.enemies.forEach(e2=>{if(dist(e,e2)<100)d++;});if(d>bD){bD=d;bX=e.x;bY=e.y;}});L.tx=bX;L.ty=bY;L.phase="launch";L.timer=400;}}
 else if(L.phase==="launch"){L.timer-=dt;L.x=lerp(L.x,L.tx,0.15*dt*0.06);L.y=lerp(L.y,L.ty,0.15*dt*0.06);if(L.timer<=0||dist(L,{x:L.tx,y:L.ty})<25){L.phase="capture";L.captured=[];gs.enemies.forEach(e=>{if(dist(e,L)<L.pushR&&e.type!=="boss"&&!e._eliteReinf&&!_enemyInBot(gs,e)){e._lassoed=true;L.captured.push(e);}});L.moveTimer=4000;const aw=ag({x:L.x,y:L.y},p);L.moveX=L.x+Math.cos(aw)*400;L.moveY=clamp(L.y+Math.sin(aw)*400,40,GH*0.35);}}
 else if(L.phase==="capture"){L.moveTimer-=dt;L.x=lerp(L.x,L.moveX,0.04*dt*0.06);L.y=lerp(L.y,L.moveY,0.04*dt*0.06);L.captured=L.captured.filter(e=>{if(!gs.enemies.includes(e))return false;return true;});L.captured.forEach((e,ci)=>{const _co=ci*PI2/Math.max(1,L.captured.length);const _cx=L.x+Math.cos(_co)*25;const _cy=L.y+Math.sin(_co)*25;e.x=lerp(e.x,_cx,0.06*dt*0.06);e.y=lerp(e.y,_cy,0.06*dt*0.06);e.x=clamp(e.x,e.size,GW-e.size);});if(L.moveTimer<=0){L.captured.forEach(ce=>{ce._lassoed=false;});gs._lasso=null;}}}
 gs.homingMissiles.forEach(m=>{m.life-=dt*0.06;const cl=gs.enemies.reduce((b,e)=>{if(e._eliteReinf)return b;return(!b||dist(e,m)<dist(b,m))?e:b;},null);if(cl){const a=ag(m,cl);m.vx=(m.vx||0)*0.94+Math.cos(a)*0.26;m.vy=(m.vy||0)*0.94+Math.sin(a)*0.26;}m.x+=(m.vx||0)*dt*0.06;m.y+=(m.vy||0)*dt*0.06;});
 gs.homingMissiles=gs.homingMissiles.filter(m=>m.life>0&&m.x>-20&&m.x<GW+20&&m.y>-20&&m.y<GH+20);
 const htcBase=gs.bulCol||(gs.shipCol||{color:"#00e5ff"}).color;
 for(let i=gs.homingMissiles.length-1;i>=0;i--){const m=gs.homingMissiles[i];for(let j=gs.enemies.length-1;j>=0;j--){const e=gs.enemies[j];if(dist(m,e)<e.size+m.size){e.hp-=m.dmg*(e._botDmgM||1);trackBounce(gs,"Seeker Missiles",m.dmg,(e._botDmgM||1));
 if(m.isCrit){sp(gs,e.x,e.y,"#ffff44",14,5);sp(gs,e.x,e.y,"#ffffff",8,3.5);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-8,8),y:e.y-e.size,text:Math.round(m.dmg),life:24,ml:24,col:"#ffff44"});}
 else{sp(gs,m.x,m.y,"#ffaa44",4,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x,y:e.y-e.size,text:Math.round(m.dmg),life:22,ml:22,col:htcBase});}
 if(hasAU(gs,"homing_mastery")){const _br=60;gs.enemies.forEach(be=>{if(dist(be,{x:m.x,y:m.y})<_br){be.burnDmg=m.dmg*0.2;be.burnTimer=5000;}});sp(gs,m.x,m.y,"#ff6622",16,5);sp(gs,m.x,m.y,"#ffaa33",10,3);gs.novaRings.push({x:m.x,y:m.y,r:0,maxR:_br,life:18,ml:18,fire:true});}
 if(has(gs,"chain")&&hasAU(gs,"chain_mastery")){gs._gcSeeker=(gs._gcSeeker||0)+1;if(gs._gcSeeker%3===0)greenChainL(gs,m.x,m.y,m.dmg);}
 gs.homingMissiles.splice(i,1);if(e.hp<=0)killE(gs,e,j);break;}}}
 if(gs.screenShake>0)gs.screenShake=Math.max(0,gs.screenShake-dt*0.08);if(gs.flashTimer>0)gs.flashTimer-=dt;
 if(gs._isEnforcer&&gs._enfTimer>0)gs._enfTimer-=dt*0.001;if(gs._efShieldActive){gs._efShieldT-=dt;if(gs._efShieldT<=0)gs._efShieldActive=false;}
 if(gs.newEnemyNotif){gs.newEnemyNotif.timer-=dt*0.06;if(gs.newEnemyNotif.timer<=0)gs.newEnemyNotif=null;}
 if(gs._cargoBuffNotif){gs._cargoBuffNotif.timer-=dt*0.06;if(gs._cargoBuffNotif.timer<=0)gs._cargoBuffNotif=null;}
 if(gs._vulnTimer>0){gs._vulnTimer-=dt;if(gs._vulnTimer<0)gs._vulnTimer=0;}if(gs._overheatBorderTimer>0){gs._overheatBorderTimer-=dt;if(gs._overheatBorderTimer<0)gs._overheatBorderTimer=0;}
 if(gs._pendingLabNotifs&&gs._pendingLabNotifs.length>0){gs._labNotifs.push(...gs._pendingLabNotifs);gs._pendingLabNotifs=[];}
 if(gs._labNotifs&&gs._labNotifs.length>0){gs._labNotifs.forEach(ln=>{ln.timer-=dt*0.06;if(ln.confetti)ln.confetti.forEach(c=>{c.x+=c.vx*dt*0.06;c.y+=c.vy*dt*0.06;c.vy+=0.08*dt*0.06;c.rot+=0.1*dt*0.06;c.life-=dt*0.06;if(c.life<=0||c.y>40){c.x=rand(-60,60);c.y=rand(-15,5);c.vx=rand(-1.5,1.5);c.vy=rand(-2.5,-0.5);c.life=rand(30,60);c.rot=rand(0,6.28);}});});gs._labNotifs=gs._labNotifs.filter(ln=>ln.timer>0);}
 if(gs.isCargo){
 const _spMult=Math.max(0.4,2.5-gs.cargoDistance*0.0006);
 gs.spawnTimer-=dt;
 while(gs.spawnQueue.length>0&&gs.spawnTimer<=0){
 const nx=gs.spawnQueue.shift();
 if(nx.type==="bomber"||nx.type==="boss"||nx.type==="sniper"){continue;}
 const _trainX=gs.train?.screenX||GW/2;
 const _trainTopY=(gs.train?.worldY||GH*0.4)-gs._camY-20;
 const _trainBotY=_trainTopY+200;
 const _trainCenterY=(_trainTopY+_trainBotY)/2;
 const _spawnYMin=Math.max(60,_trainCenterY-220);
 const _spawnYMax=Math.min(GH-60,_trainCenterY+220);
 let _spX,_spY,_attempt=0;
 do{_spX=rand(40,GW-40);_spY=rand(_spawnYMin,_spawnYMax);_attempt++;}
 while(_attempt<25&&(Math.abs(_spX-_trainX)<28||(Math.abs(_spX-_trainX)<80&&_spY>_trainTopY-20&&_spY<_trainBotY+20)));
 gs.cargoTelegraphs.push({x:_spX,y:_spY,timer:2.8,maxTimer:2.8,type:nx.type});
 gs.spawnTimer=Math.max(1500,(nx.delay||300)*_spMult*4);
 }
 updateCargoLogic(dt,gs);
 }else{gs.spawnTimer-=dt;while(gs.spawnQueue.length>0&&gs.spawnTimer<=0){const nx=gs.spawnQueue.shift();spawnE(gs,nx);gs.spawnTimer=nx.delay||300;}}
 gs.enemies.forEach(e=>{
 if(e.entering){e.y=lerp(e.y,e.targetY||120,0.02*dt*0.06);if(Math.abs(e.y-(e.targetY||120))<5)e.entering=false;}
 else if(e.type==="boss"){e.moveTimer=(e.moveTimer||0)+dt;e.x+=Math.sin(e.moveTimer*0.001)*1.2*dt*0.06;e.x=clamp(e.x,e.size+10,GW-e.size-10);if(e._isEnforcer){e._enfPhT=(e._enfPhT||0)+dt;if(e._enfPhT>3800){e._enfPhT=0;e.phase=e.phase===1?2:1;}}else if(e.hp<e.maxHp*0.5&&e.phase===1)e.phase=2;}
 else if(e.type==="bomber"){const a=ag(e,p);const _bSpd=e.speed*(1-(e._tdSlow||0));e.x+=Math.cos(a)*_bSpd*dt*0.06;e.y+=Math.sin(a)*_bSpd*dt*0.06;}
 else if(e.type==="weaver"){e.y+=e.speed*0.25*dt*0.06;e.sineOff+=dt*0.003;e.x+=Math.sin(e.sineOff)*e.sineAmp*0.03*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
 else if(e.type==="sniper"){
 if(metaRef.current.pathsUpg?.bt_jam&&_enemyInBot(gs,e)){e.telegraphing=false;}else if(e._lassoed){}else if(!e.telegraphing&&!e._sniperLineActive){e.teleTimer-=dt;if(e.teleTimer<=0){const _smb=_activeBot(gs,"mimic");if(_smb&&dist(e,_smb)<_smb.rPx&&rand(0,100)<_smb.cust){e._mimicNow=true;e.teleTimer=e.fireRate;fireEB(gs,e);}else{e.telegraphing=true;e.aimAngle=ag(e,p);e.teleTimer=700*(gs._dealerMods?.sniper?.teleM||1);}}}
 else if(e.telegraphing){e.teleTimer-=dt;if(e.teleTimer<=0){e.telegraphing=false;e._sniperLineActive=true;e.teleTimer=e.fireRate;fireEB(gs,e);}}
 else if(e._sniperLineActive){const _hasSnBul=gs.eBullets.some(b=>b._sniperBullet&&b._sniperId===e._sniperId);if(!_hasSnBul)e._sniperLineActive=false;}
 }
 else if(e.type==="orbiter"){e.sineOff+=dt*0.002;e.x+=Math.cos(e.sineOff)*e.sineAmp*0.04*dt*0.06;e.y+=Math.sin(e.sineOff*0.7)*0.3*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
 else if(e.type==="charger"){e.y+=e.speed*0.3*dt*0.06;e.spinAngle=(e.spinAngle||0);
 const chFrac=1-((e.fireTimer||0)/(e.fireRate||4000));e.spinAngle+=chFrac*0.15*dt*0.06;e.chargeTimer=e.fireTimer;}
 else if(e.type==="wraith"&&!e._isEnforcer){e.y+=e.speed*0.3*dt*0.06;
 if((e.phaseCD||0)>0){e.phaseCD-=dt;if(e.phaseCD<=0){e.phaseCD=0;fireEB(gs,e);}}
 else{e.phaseTimer=(e.phaseTimer||3500)-dt;if(e.phaseTimer<=0){e.phaseCD=500;e.x=rand(40,GW-40);e.y=rand(60,GH*0.35);e.phaseTimer=3500*(gs._dealerMods?.wraith?.phaseM||1);}}}
 else if(e.type==="siren"){e.sineOff+=dt*0.002;e.x+=Math.sin(e.sineOff)*e.sineAmp*0.03*dt*0.06;e.y+=Math.cos(e.sineOff*0.5)*0.2*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
 else if(e.type==="fortress"){e.y+=e.speed*0.3*dt*0.06;e.shieldAngle=(e.shieldAngle||0)+0.015*dt*0.06;}
 else if(e.type==="reaper"){e.y+=e.speed*0.2*dt*0.06;const rdx=p.x-e.x;e.x+=Math.sign(rdx)*e.speed*0.3*dt*0.06;e.x=clamp(e.x,e.size,GW-e.size);}
 else{if(!e._cargo)e.y+=e.speed*0.35*dt*0.06;}
 if(!e._cargo&&e.type!=="bomber"&&e.type!=="boss"&&!e.entering&&e.y>GH*0.7){
 e.y-=e.speed*0.5*dt*0.06;
 if(e.y>GH*0.85)e.y-=e.speed*1.0*dt*0.06;
 }
 if(e.burnTimer>0){e.burnTimer-=dt;const _bMul=e._orbHit?2:1;const burnTick=e.burnDmg*dt*0.001*_bMul;const _bdmB=(e._botDmgM||1);e.hp-=burnTick*_bdmB;trackBounce(gs,"Flame Burn",burnTick,_bdmB);if(e.hp<=0&&!e._burnKilled){e._burnKilled=true;sp(gs,e.x,e.y,e.color||"#ff5544",12,4);sp(gs,e.x,e.y,e._orbHit?"#3388ff":"#ff6622",8,3);}}
 if(e._elecTimer>0)e._elecTimer-=dt;
 if(!e.entering&&e.type!=="sniper"&&(e.type!=="wraith"||e._isEnforcer)&&!e._lassoed){e.fireTimer-=dt;if(e.fireTimer<=0&&e.pattern!=="none"){e.fireTimer=e.fireRate||2000;if(e.type==="boss")fireBoss(gs,e);else fireEB(gs,e);}}
 if(e._elite&&!e._eliteReinf&&!e._eliteCalled&&e._eliteCallTimer!==undefined){e._eliteCallTimer-=dt;if(e._eliteCallTimer<=0){e._eliteCalled=true;e._eliteTriggerNow=true;}}
 });
 const _eliteToCall=gs.enemies.filter(e=>e._eliteTriggerNow);
 _eliteToCall.forEach(e=>{e._eliteTriggerNow=false;
 const _ringN=18,_ringSpd=2.4,_ringDmg=Math.max(4,(8+gs.wave*1.5)*0.5);
 for(let _ri=0;_ri<_ringN;_ri++){const _ra=(PI2/_ringN)*_ri;gs.eBullets.push({x:e.x,y:e.y,vx:Math.cos(_ra)*_ringSpd,vy:Math.sin(_ra)*_ringSpd,size:5,dmg:_ringDmg,src:"elite"});}
 sp(gs,e.x,e.y,"#ff4488",26,6);sp(gs,e.x,e.y,"#ffaadd",14,4);gs.screenShake=Math.max(gs.screenShake,8);
 const _wsR=hpScale(gs.wave),_edR=ED[e.type];
 if(_edR){for(let _ri=0;_ri<7;_ri++){
 const _ra=(PI2/7)*_ri+rand(-0.2,0.2),_rd=55+rand(0,20);
 const _rx=clamp(e.x+Math.cos(_ra)*_rd,30,GW-30);
 const _ry=clamp(e.y+Math.sin(_ra)*_rd,30,GH-60);
 const _rHp=BASE_HP*_edR.hpM*_wsR*1.3;
 gs.enemies.push({type:e.type,x:_rx,y:_ry,hp:_rHp,maxHp:_rHp,
 size:_edR.sz,speed:_edR.spd*(1+gs.wave*0.018),color:_edR.col,
 fireTimer:rand(0,_edR.fr),fireRate:Math.max(400,_edR.fr-gs.wave*18),
 bulletSpeed:_edR.bs*(1+gs.wave*0.01),pattern:_edR.pat,dM:_edR.dM,
 scrapDrop:0,coreDrop:0,plasmaDrop:0,
 sineOff:rand(0,PI2),sineAmp:rand(40,80),
 entering:false,targetY:_ry,burnDmg:0,burnTimer:0,
 telegraphing:false,aimAngle:0,teleTimer:0,_sniperId:Math.random(),_sniperLineActive:false,
 phaseCD:0,phaseTimer:e.type==="wraith"?rand(2000,3500):0,shieldAngle:rand(0,PI2),
 rotOff:rand(0,PI2),rotSpd:0.002+rand(-0.0005,0.0005),
 _elite:true,_eliteReinf:true});
 gs.enemiesLeft++;
 }}
 const _ix=gs.enemies.indexOf(e);if(_ix>=0)killE(gs,e,_ix);
 });
 if(has(gs,"slowfield")){const _sfR=hasAU(gs,"slowfield_sub1")?180:90;gs.eBullets.forEach(b=>{if(dist(b,p)<_sfR){const spd=Math.hypot(b.vx,b.vy);if(spd>0.8){b.vx*=0.993;b.vy*=0.993;}}});
 if(hasAU(gs,"slowfield_mastery")){gs.enemies.forEach(e=>{if(e.type==="bomber"&&dist(e,p)<_sfR){e._inTD=true;const a=ag(e,p);const cSpd=Math.hypot(Math.cos(a)*e.speed,Math.sin(a)*e.speed);if(cSpd>0.5){e._tdSlow=(e._tdSlow||0)+dt*0.001;e._tdSlow=Math.min(e._tdSlow,0.7);}e._tdBlue=Math.min(1,(e._tdBlue||0)+dt*0.0008);}else if(e.type==="bomber"){e._inTD=false;e._tdSlow=Math.max(0,(e._tdSlow||0)-dt*0.003);e._tdBlue=Math.max(0,(e._tdBlue||0)-dt*0.003);}});}
 if(hasAU(gs,"slowfield_sub2")){const _cyc=(gs.time%6000)/6000;let _mm;if(_cyc<0.25)_mm=1.25;else if(_cyc<0.5){const _t=(_cyc-0.25)/0.25;_mm=1.25-0.25*(0.5-0.5*Math.cos(_t*Math.PI));}else if(_cyc<0.75)_mm=1.0;else{const _t=(_cyc-0.75)/0.25;_mm=1.0+0.25*(0.5-0.5*Math.cos(_t*Math.PI));}gs._magnetMult=_mm;}else{gs._magnetMult=1;}}
 gs.pBullets.forEach(b=>{b.x+=b.vx*dt*0.06;b.y+=b.vy*dt*0.06;if(gs._bots){for(const bot of gs._bots){if(bot.id!=="bounce"||!bot.active)continue;const dx=b.x-bot.x,dy=b.y-bot.y,d=Math.hypot(dx,dy)||1;if(d<bot.rPx){b._inBnc=bot;}else if(b._inBnc===bot){const nx=dx/d,ny=dy/d,vd=b.vx*nx+b.vy*ny;if(vd>0){b.vx-=2*vd*nx;b.vy-=2*vd*ny;}b.x=bot.x+nx*(bot.rPx-1);b.y=bot.y+ny*(bot.rPx-1);}}}});
 if(gs.isCargo&&gs.train){const _ptx=gs.train.screenX,_pty0=gs.train.worldY-gs._camY;for(let _pbi=gs.pBullets.length-1;_pbi>=0;_pbi--){const _pb=gs.pBullets[_pbi];for(let _psi=0;_psi<gs.train.segs.length;_psi++){const _ps=gs.train.segs[_psi];if(!_ps.alive)continue;const _psY=_pty0+_ps.offsetY;if(Math.abs(_pb.x-_ptx)<_ps.w/2+_pb.size&&Math.abs(_pb.y-_psY)<_ps.h/2+_pb.size){sp(gs,_pb.x,_pb.y,"#88ccff",3,2);gs.pBullets.splice(_pbi,1);break;}}}}
 gs.eBullets.forEach(b=>{b.x+=b.vx*dt*0.06;b.y+=b.vy*dt*0.06;
 if(b.homing){b.homingLife=(b.homingLife||0)-dt;if(b.homingLife>0){const ha=ag(b,p);const spd=Math.hypot(b.vx,b.vy)||1.8;b.vx+=(Math.cos(ha)*0.06)*dt*0.06;b.vy+=(Math.sin(ha)*0.06)*dt*0.06;const ns=Math.hypot(b.vx,b.vy);if(ns>spd*1.1){b.vx*=spd*1.1/ns;b.vy*=spd*1.1/ns;}}else{b.homing=false;}}
 if(b.mine){b.mineTimer-=dt;if(b.mineTimer<=0){const n=8;const bs2m=2.0;const mdmg=b.dmg*2;for(let i=0;i<n;i++){const ra=(PI2/n)*i;gs.eBullets.push({x:b.x,y:b.y,vx:Math.cos(ra)*bs2m,vy:Math.sin(ra)*bs2m,size:4,dmg:mdmg,src:"reaper"});}sp(gs,b.x,b.y,"#cc44ff",6,3);b.dmg=-1;b.vx=999;}}
 });
 gs.pBullets.forEach(b=>{if(b.bounces>0){if(b.y<=0){b.vy*=-1;b.damage*=0.8;b.bounces--;b._bounced=true;b.y=1;if(hasAU(gs,'ricochet_sub1')){const _off=(rand(-20,20))*Math.PI/180;const _sp=Math.hypot(b.vx,b.vy);const _a=Math.atan2(b.vy,b.vx)+_off;b.vx=Math.cos(_a)*_sp;b.vy=Math.sin(_a)*_sp;}}if(b.x<=0||b.x>=GW){if(b.bounces>0){b.vx*=-1;b.damage*=0.8;b.bounces--;b.x=clamp(b.x,1,GW-1);if(hasAU(gs,'ricochet_sub1')){const _off=(rand(-20,20))*Math.PI/180;const _sp=Math.hypot(b.vx,b.vy);const _a=Math.atan2(b.vy,b.vx)+_off;b.vx=Math.cos(_a)*_sp;b.vy=Math.sin(_a)*_sp;}}else{b.pierce=-1;}}}else if(b.bounces===0&&(b.x<=0||b.x>=GW)){b.pierce=-1;}});
 gs.pickups.forEach(pk=>{pk.life-=dt*0.06;pk.x+=pk.vx*dt*0.06;pk.y+=pk.vy*dt*0.06;pk.vx*=0.98;pk.vy*=0.98;if(!pk.golden&&pk.type!=="bossShards"){gs.gravWells.forEach(gw=>{if(!pk.golden&&gw.golden&&dist(pk,gw)<gw.r){pk.golden=true;pk.value=Math.ceil(pk.value*2);}});}const d=dist(pk,p);const _emr=p.magnetRange*(gs._magnetMult||1);if(d<_emr){const a=ag(pk,p);const pl=Math.max(3,(_emr-d)*0.1);pk.x+=Math.cos(a)*pl*dt*0.06;pk.y+=Math.sin(a)*pl*dt*0.06;}});
 gs.particles.forEach(pt=>{pt.x+=pt.vx*dt*0.06;pt.y+=pt.vy*dt*0.06;pt.life-=dt*0.06;pt.vx*=0.96;pt.vy*=0.96;});
 gs.pBullets=gs.pBullets.filter(b=>b.x>-10&&b.x<GW+10&&b.y>-10&&b.y<GH+10&&b.pierce>=0);
 gs.eBullets=gs.eBullets.filter(b=>b.x>-20&&b.x<GW+20&&b.y>-20&&b.y<GH+20);
 gs.particles=gs.particles.filter(pt=>pt.life>0);if(has(gs,"drone")&&hasAU(gs,"drone_mastery")&&!gs._inSprint){gs.pickups.forEach(pk=>{if(pk.life<=0&&!pk._counted){pk._counted=true;if(!gs._missed)gs._missed={};gs._missed[pk.type]=(gs._missed[pk.type]||0)+pk.value;}});}gs.pickups=gs.pickups.filter(pk=>pk.life>0);
 if(gs.eBullets.length>600){const _px=p.x,_py=p.y;gs.eBullets.sort((a,b)=>((a.x-_px)**2+(a.y-_py)**2)-((b.x-_px)**2+(b.y-_py)**2));gs.eBullets.length=600;}
 if(gs.particles.length>300)gs.particles=gs.particles.slice(-300);
 for(let _hti=0;_hti<gs.hitTexts.length;_hti++){
 const _ht=gs.hitTexts[_hti];
 if(_ht._stOff===undefined){
 let _stCount=0;
 for(let _hj=0;_hj<gs.hitTexts.length;_hj++){
 if(_hj===_hti)continue;
 const _other=gs.hitTexts[_hj];
 if(_other._stOff!==undefined&&Math.abs(_other.x-_ht.x)<20&&Math.abs(_other.y-(_ht.y-_stCount*12))<14&&_other.life>_other.ml-18){
 _stCount++;
 }
 }
 _ht._stOff=_stCount*12;
 _ht.y-=_ht._stOff;
 }
 }
 gs.hitTexts.forEach(ht=>{ht.life-=dt*0.06;ht.y-=0.8;});gs.hitTexts=gs.hitTexts.filter(ht=>ht.life>0);
 for(let i=gs.pBullets.length-1;i>=0;i--){const b=gs.pBullets[i];for(let j=gs.enemies.length-1;j>=0;j--){const e=gs.enemies[j];if(dist(b,e)<b.size+e.size){
 if(e.type==="wraith"&&(e.phaseCD||0)>0&&!(gs._dealerMods?.wraith?.noPhaseInv)){continue;}
 if(e.type==="fortress"&&!(gs._dealerMods?.fortress?.shieldOff)){const _fm=gs._dealerMods?.fortress;const _fhw=0.9*(_fm?.shieldArcM||1);const ba=Math.atan2(b.y-e.y,b.x-e.x);const _nrm=v=>{v=((v%PI2)+PI2)%PI2;if(v>Math.PI)v-=PI2;return v;};let _blk=Math.abs(_nrm(ba-(e.shieldAngle||0)))<_fhw;if(!_blk&&_fm?.shieldDouble)_blk=Math.abs(_nrm(ba-(e.shieldAngle||0)-Math.PI))<_fhw;if(_blk){sp(gs,b.x,b.y,"#55ccaa",3,2);gs.pBullets.splice(i,1);break;}}
 if(gs._isEnforcer&&e._isEnforcer){b.pierce=-1;sp(gs,b.x,b.y,"#ff557744",2,1);break;}const _bdm=(e._botDmgM||1);e.hp-=b.damage*_bdm;const _bSrcN=b.src==="rear"?"Rear Turret":b.src==="drone"?"Combat Drone":b.src==="mirror"?"Echo Clone":"Main Gun";trackBounce(gs,_bSrcN,b.damage,_bdm);
 if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-8,8),y:e.y-e.size,text:Math.round(b.damage*(e._botDmgM||1)),life:24,ml:24,col:b.isCrit?"#ffff44":htcBase});
 if(b.acid>0&&b.isCrit){e.burnDmg=b.damage*0.15*b.acid;e.burnTimer=2000;}
 if(b.isChain){chainL(gs,e.x,e.y,b.damage);if(hasAU(gs,"chain_sub2")){const _eM=(e._botDmgM||1);const _eDmg=b.damage*0.6*_eM;e.hp-=_eDmg;trackBounce(gs,"Blue Chain Lightning",b.damage*0.6,_eM);e._elecTimer=300;e._elecColor="#88ddff";sp(gs,e.x,e.y,"#88ddff",6,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-6,6),y:e.y-e.size,text:Math.round(_eDmg),life:22,ml:22,col:"#88ddff"});}}
 if(has(gs,"chain")&&hasAU(gs,"chain_mastery")&&(b.src==="drone"||b.src==="mirror")){const _gck="_gc"+b.src;gs[_gck]=(gs[_gck]||0)+1;if(gs[_gck]%3===0)greenChainL(gs,e.x,e.y,b.damage);}
 if(b.isCrit){sp(gs,e.x,e.y,"#ffff44",14,5);sp(gs,e.x,e.y,"#ffffff",8,3.5);gs.screenShake=Math.max(gs.screenShake,2.5);}
 if(b._inBnc&&rand(0,100)<20){}else{b.pierce--;}sp(gs,b.x,b.y,b.isCrit?"#ffff44":"#00e5ff",b.isCrit?4:2,2);
 if(b._bounced&&hasAU(gs,"ricochet_mastery")){const _sa=Math.atan2(b.vy,b.vx);const _sdPri=p.damage*2.0;const _sdSec=p.damage*1.2;gs._slices=(gs._slices||[]);gs._slices.push({x:e.x,y:e.y,a:_sa,life:18,ml:18,len:120});for(let _si=0;_si<8;_si++){const _soff=rand(-0.3,0.3);gs.particles.push({x:e.x+Math.cos(_sa+_soff)*rand(10,60),y:e.y+Math.sin(_sa+_soff)*rand(10,60),vx:Math.cos(_sa+_soff)*rand(1,3),vy:Math.sin(_sa+_soff)*rand(1,3),life:rand(12,25),ml:25,color:_si%2===0?"#ff4466":"#ffaa88",size:rand(2,4)});}
 e.hp-=_sdPri*(e._botDmgM||1);trackBounce(gs,"Rage Slice",_sdPri,(e._botDmgM||1));if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:e.x+rand(-6,6),y:e.y-e.size,text:Math.round(_sdPri),life:24,ml:24,col:"#ff4466"});sp(gs,e.x,e.y,"#ff4466",4,3);
 let _rsFirst=true;gs.enemies.forEach((se,si)=>{if(se!==e){const _sx=e.x+Math.cos(_sa)*60,_sy=e.y+Math.sin(_sa)*60;if(dist(se,{x:_sx,y:_sy})<60+se.size){const _rsd=_rsFirst?_sdPri:_sdSec;_rsFirst=false;se.hp-=_rsd*(se._botDmgM||1);trackBounce(gs,"Rage Slice",_rsd,(se._botDmgM||1));if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:se.x+rand(-6,6),y:se.y-se.size,text:Math.round(_rsd),life:24,ml:24,col:"#ff4466"});sp(gs,se.x,se.y,"#ff4466",8,4);if(se.hp<=0)killE(gs,se,si);}}});}
 if(e.hp<=0){if((p.voidsiphonFlat||0)>0&&b.src==="main"&&b.isCrit){const healAmt=p.voidsiphonFlat;const _vsCap=p.maxHp*(has(gs,"overcharge")?(hasAU(gs,"overcharge_sub1")?1.4:1.2):1);const _vsH=Math.min(_vsCap-p.hp,healAmt);if(_vsH>0){p.hp+=_vsH;trackHeal(gs,"Void Siphon",_vsH);}sp(gs,p.x,p.y,"#44ff88",6,2);if(metaRef.current.showHitText!==false)gs.hitTexts.push({x:p.x,y:p.y-20,text:"+"+Math.round(healAmt),life:30,ml:30,col:"#44ff88"});}killE(gs,e,j);}if(b.pierce<0){gs.pBullets.splice(i,1);break;}}}}
 if(gs.isCargo){
 const _tCx=gs.train.screenX;const _tCy0=gs.train.worldY-gs._camY;const _carriagesAlive=gs.train.segs.slice(1).some(s=>s.alive);
 for(let _bi=gs.eBullets.length-1;_bi>=0;_bi--){
 const _b=gs.eBullets[_bi];let _hit=false;
 for(let _si=0;_si<gs.train.segs.length;_si++){
 const _seg=gs.train.segs[_si];if(!_seg.alive)continue;
 if(_si===0&&_carriagesAlive)continue;
 const _segPy=_tCy0+_seg.offsetY;
 if(Math.abs(_b.x-_tCx)<_seg.w/2+_b.size&&Math.abs(_b.y-_segPy)<_seg.h/2+_b.size){
 const _vulnMult=gs._vulnTimer>0?2:1;
 const _bDmg=Math.max(2,(_b.dmg||5)*0.4)*_vulnMult;
 _seg.hp-=_bDmg;
 if(_seg.hp<=0){_seg.alive=false;_seg.hp=0;sp(gs,_tCx,_segPy,"#ff8844",20,5);gs.screenShake=6;}
 sp(gs,_b.x,_b.y,"#ff4466",4,2);
 gs.eBullets.splice(_bi,1);_hit=true;break;
 }
 }
 if(_hit)continue;
 }
 }
 if(p.invTimer<=0&&p.phaseActive<=0){
 for(let i=gs.eBullets.length-1;i>=0;i--){if(dist(gs.eBullets[i],p)<gs.eBullets[i].size+p.size){
 const bul=gs.eBullets[i];const bdRaw=bul.dmg||(8+gs.wave*1.5);const bd=gs._isEnforcer?p.hp+100:bdRaw*(1-(p.dmgReduction||0));const bSrc=bul.src||"unknown";gs.eBullets.splice(i,1);const _pHP=p.hp;if(gs._efShieldActive){gs._efShieldActive=false;sp(gs,p.x,p.y,"#ff5577",12,4);gs.screenShake=2;continue;}
 if(bul._fromReinf&&!gs.isCargo&&(p.goldenShields>0||p.shields>0)){if(p.goldenShields>0)p.goldenShields--;else p.shields--;sp(gs,p.x,p.y,"#ff8866",4,2);}
 if(p.dodgeChance>0&&Math.random()<p.dodgeChance){const _hd=bd*0.5;if(p.goldenShields>0){p.goldenShields--;p.lastDmgTime=gs.time;p.invTimer=400;sp(gs,p.x,p.y,"#ffcc44",6,3);gs.screenShake=2;gs._noDmgWave=false;}else if(p.shields>0){p.shields--;p.lastDmgTime=gs.time;sp(gs,p.x,p.y,"#44aaff",4,2);gs.screenShake=2;gs._noDmgWave=false;}else{p.hp-=_hd;p.lastDmgTime=gs.time;gs.deathCause=bSrc.charAt(0).toUpperCase()+bSrc.slice(1);p.invTimer=400;gs.screenShake=3;sp(gs,p.x,p.y,"#aabbcc",4,2);gs._noDmgWave=false;}{const _hpL=_pHP-p.hp;trackPain(gs,bSrc,_hpL,_hpL>0?0:bd*0.5);}break;}
 if(p.goldenShields>0){p.goldenShields--;p.lastDmgTime=gs.time;p.invTimer=650;sp(gs,p.x,p.y,"#ffcc44",10,4);gs.screenShake=4;gs._noDmgWave=false;
 if(has(gs,"blackhole")&&hasAU(gs,"blackhole_mastery")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&(sn.telegraphing||sn._sniperLineActive)){sn.telegraphing=false;sn._sniperLineActive=false;sn.teleTimer=sn.fireRate;}});}const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",10,4);gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}
 else if(p.shields>0){p.shields--;p.lastDmgTime=gs.time;sp(gs,p.x,p.y,"#44aaff",6,3);gs.screenShake=3;gs._noDmgWave=false;if(has(gs,"blackhole")&&hasAU(gs,"blackhole_mastery")){const _ehPct2=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a2,b2)=>(b2.src==="sniper"?1:0)-(a2.src==="sniper"?1:0));gs.enemies.forEach(sn2=>{if(sn2.type==="sniper"&&(sn2.telegraphing||sn2._sniperLineActive)){sn2.telegraphing=false;sn2._sniperLineActive=false;sn2.teleTimer=sn2.fireRate;}});}const rc2=Math.ceil(gs.eBullets.length*_ehPct2);gs.eBullets.splice(0,rc2);sp(gs,p.x,p.y,"#9944ff",10,4);gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}
 else{if(gs.isCargo){gs._vulnTimer=5000;p.invTimer=650;gs.screenShake=4;gs.flashTimer=40;sp(gs,p.x,p.y,"#ff3355",7,3);}else{p.hp-=bd;p.lastDmgTime=gs.time;gs._noDmgWave=false;gs.deathCause=bSrc.charAt(0).toUpperCase()+bSrc.slice(1);p.invTimer=650;gs.screenShake=6;gs.flashTimer=70;sp(gs,p.x,p.y,"#ff3355",7,3);if(has(gs,"drone")&&hasAU(gs,"drone_sub1")){const _src=gs.enemies.find(en=>en.type===bSrc&&!en._eliteReinf);if(_src)gs._droneRage=_src;}
 if(has(gs,"blackhole")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;
 if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&(sn.telegraphing||sn._sniperLineActive)){sn.telegraphing=false;sn._sniperLineActive=false;sn.teleTimer=sn.fireRate;}});}
 const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",14,5);gs.screenShake=9;gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}}{const _hpL2=_pHP-p.hp;trackPain(gs,bSrc,_hpL2,_hpL2>0?0:bd);}break;}}
 if(p.invTimer<=0&&p.phaseActive<=0){for(let i=gs.enemies.length-1;i>=0;i--){const e=gs.enemies[i];if(e.type==="bomber"&&dist(e,p)<e.size+p.size){const bd=gs._isEnforcer?p.hp+100:(12+gs.wave*1.5)*(e.dM||1)*(1-(p.dmgReduction||0));killE(gs,e,i);const _bpHP=p.hp;if(p.goldenShields>0){p.goldenShields--;p.lastDmgTime=gs.time;p.invTimer=650;sp(gs,p.x,p.y,"#ffcc44",10,4);gs.screenShake=4;gs._noDmgWave=false;if(has(gs,"blackhole")&&hasAU(gs,"blackhole_mastery")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&(sn.telegraphing||sn._sniperLineActive)){sn.telegraphing=false;sn._sniperLineActive=false;sn.teleTimer=sn.fireRate;}});}const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",10,4);gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}else if(p.shields>0){p.shields--;p.lastDmgTime=gs.time;sp(gs,p.x,p.y,"#44aaff",6,3);gs.screenShake=3;gs._noDmgWave=false;}else{p.hp-=bd;p.lastDmgTime=gs.time;gs._noDmgWave=false;gs.deathCause="Bomber explosion";p.invTimer=650;gs.flashTimer=70;sp(gs,p.x,p.y,"#ff3355",7,3);trackPain(gs,"bomber",bd,0);if(has(gs,"blackhole")){const _ehPct=hasAU(gs,"blackhole_sub1")?0.55:0.35;if(hasAU(gs,"blackhole_sub2")){gs.eBullets.sort((a,b)=>(b.src==="sniper"?1:0)-(a.src==="sniper"?1:0));gs.enemies.forEach(sn=>{if(sn.type==="sniper"&&(sn.telegraphing||sn._sniperLineActive)){sn.telegraphing=false;sn._sniperLineActive=false;sn.teleTimer=sn.fireRate;}});}const removeCount=Math.ceil(gs.eBullets.length*_ehPct);gs.eBullets.splice(0,removeCount);sp(gs,p.x,p.y,"#9944ff",14,5);gs.screenShake=9;gs._ehFlash=30;gs._ehOriginX=p.x;gs._ehOriginY=p.y;}}{const _bHL=_bpHP-p.hp;if(_bHL<=0)trackPain(gs,"bomber",0,bd);}gs.screenShake=6;}}}}
 if(p.invTimer<=0&&p.phaseActive<=0&&(p._contactInv||0)<=0){for(let i=gs.enemies.length-1;i>=0;i--){const e=gs.enemies[i];if(e.type==="bomber")continue;if(dist(e,p)<e.size+p.size){const _cdRaw=(7+gs.wave*1.8)*(e.dM||1)*dmgScale(gs.wave)*0.35;const _cd=gs._isEnforcer?p.hp+100:_cdRaw*(1-(p.dmgReduction||0));const _cSrc=e.type||"enemy";const _cpHP=p.hp;if(e._eliteReinf&&!gs.isCargo&&(p.goldenShields>0||p.shields>0)){if(p.goldenShields>0)p.goldenShields--;else p.shields--;sp(gs,p.x,p.y,"#ff8866",4,2);}if(gs.isCargo){gs._vulnTimer=5000;p._contactInv=400;gs.screenShake=3;sp(gs,p.x,p.y,"#ff5533",6,3);}else if(p.goldenShields>0){p.goldenShields--;p.lastDmgTime=gs.time;p._contactInv=300;sp(gs,p.x,p.y,"#ffcc44",8,3);gs.screenShake=3;gs._noDmgWave=false;}else if(p.shields>0){p.shields--;p.lastDmgTime=gs.time;p._contactInv=300;sp(gs,p.x,p.y,"#44aaff",5,2);gs.screenShake=3;gs._noDmgWave=false;}else{p.hp-=_cd;p.lastDmgTime=gs.time;gs.deathCause=_cSrc.charAt(0).toUpperCase()+_cSrc.slice(1)+" collision";p._contactInv=300;gs.screenShake=5;gs.flashTimer=50;sp(gs,p.x,p.y,"#ff5533",6,3);gs._noDmgWave=false;}{const _cHL=_cpHP-p.hp;trackPain(gs,_cSrc,_cHL,_cHL>0?0:_cd);}break;}}}
 if(p._contactInv>0)p._contactInv-=dt;
 for(let i=gs.pickups.length-1;i>=0;i--){if(dist(gs.pickups[i],p)<18){const pk=gs.pickups[i];if(pk.type==="bossShards"){setMeta(prev=>{const nx={...prev,bossShards:(prev.bossShards||0)+pk.value};saveMeta(nx);return nx;});sp(gs,pk.x,pk.y,"#cc3333",8,4);gs.pickups.splice(i,1);continue;}gs[pk.type]=(gs[pk.type]||0)+pk.value;if(pk.type==="scrap")gs._totalScrap=(gs._totalScrap||0)+pk.value;if(pk.type==="cores")gs._totalCores=(gs._totalCores||0)+pk.value;if(pk.type==="plasma")gs._totalPlasma=(gs._totalPlasma||0)+pk.value;
 if(has(gs,"overcharge")){const cap=p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2);const _phealAmt=(pk.type==="plasma"&&hasAU(gs,"overcharge_sub2"))?6:3;const _oh=Math.min(cap-p.hp,_phealAmt);if(_oh>0){p.hp+=_oh;trackHeal(gs,"Overcharge",_oh);}}
 gs.pickups.splice(i,1);}}
 if(has(gs,"mirror")&&hasAU(gs,"mirror_sub2")){const mx=GW-p.x;for(let i=gs.pickups.length-1;i>=0;i--){if(dist(gs.pickups[i],{x:mx,y:p.y})<18){const pk=gs.pickups[i];gs[pk.type]=(gs[pk.type]||0)+pk.value;if(pk.type==="scrap")gs._totalScrap=(gs._totalScrap||0)+pk.value;if(pk.type==="cores")gs._totalCores=(gs._totalCores||0)+pk.value;if(pk.type==="plasma")gs._totalPlasma=(gs._totalPlasma||0)+pk.value;if(has(gs,"overcharge")){const cap=p.maxHp*(hasAU(gs,"overcharge_sub1")?1.4:1.2);p.hp=Math.min(cap,p.hp+3);}gs.pickups.splice(i,1);}}}
 const _otherAliveForReinf=gs.enemies.some(en=>!en._eliteReinf&&en.hp>0);
 const pLen=gs.enemies.length;gs.enemies=gs.enemies.filter(e=>{if(e._eliteReinf&&e.hp<=0&&_otherAliveForReinf){e.hp=Math.max(1,e.maxHp*0.05);}const _yOk=gs.isCargo?(e.y>-2500&&e.y<GH+2500):(e.y<GH+200);const keep=_yOk&&e.x>-200&&e.x<GW+200&&e.hp>0;if(!keep){const _isSC=e.type==="splitter"&&e.size<=10;if(!_isSC&&!e._eliteReinf)gs.waveKilled++;}return keep;});
 const rem=pLen-gs.enemies.length;if(rem>0)gs.enemiesLeft=Math.max(0,gs.enemiesLeft-rem);
 if(p.hp<=0&&!gs.isTutorial){p.alive=false;sp(gs,p.x,p.y,"#00e5ff",22,5);gs.screenShake=16;
 if(gs.isCargo){setTimeout(()=>setPhase("menu"),800);}
 else if(gs.isPlayground||gs.isNewMode){if(gs.isNewMode)setMeta(prev=>{const nx={...prev,phantomHighWave:Math.max(prev.phantomHighWave||0,Math.max(0,gs.wave-1))};saveMeta(nx);return nx;});if(gs._isEnforcer){const _enfSurv=Math.round(60-Math.max(0,gs._enfTimer));const _enfET=gs._pgEnemy||"unknown";setMeta(prev=>{const _eb={...(prev.enforcerBest||{})};_eb[_enfET]=Math.max(_eb[_enfET]||0,_enfSurv);const nx={...prev,enforcerBest:_eb};saveMeta(nx);return nx;});setTimeout(()=>{_setEnforcerDeath({enemy:_enfET,survived:_enfSurv,defeated:false});setPhase("menu");},800);}else{setTimeout(()=>setPhase("menu"),800);}}
 else{const _rawEe=Math.max(0,Math.floor(gs.wave*1.5+gs.kills*0.38+Math.pow(gs.wave,2.8)*0.065+Math.pow(gs.wave,1.8)*0.4)-(gs.kills===0&&gs.wave<=1?1:0));const _heTier=metaRef.current.metaTier||1;const _heTV=_heTier===3?2.5:_heTier===2?1.5:1;const _hePh=_heTier>=2?(1+(metaRef.current.phantomHighWave||0)*(0.01+(metaRef.current.lab?.completed?.phantom_enhance||0)*0.001)):1;const _hePr=_heTier>=2?(1+(metaRef.current.practiseHighWave||0)*(0.006+(metaRef.current.lab?.completed?.practise_enhance||0)*0.001)):1;const _heEnf=_heTier>=2?1+(metaRef.current.enforcerKills||0)*0.025:1;const _heDes=_heTier>=2?1+((metaRef.current.ownedDesigns||[]).length)*0.004:1;const _heMult=_heTV*_hePh*_hePr*_heEnf*_heDes;const ee=Math.floor(_rawEe*_heMult*((gs._diffuseMult||1)+((metaRef.current.pathsUpg?.pr_diff&&(metaRef.current.practiseHighWave||0)>0&&(metaRef.current.practiseHighWave||0)%5===0)?0.045:0)));setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:ee,cause:gs.deathCause||"Unknown"});
 setMeta(prev=>{const _ohDeath=gs._overheatPoints||0;const nx={...prev,echoes:prev.echoes+ee,overheat:(prev.overheat||0)+_ohDeath,highWave:Math.max(prev.highWave||0,gs.wave),totalEchoesEarned:(prev.totalEchoesEarned||0)+ee};saveMeta(nx);return nx;});
 if(!_isRpl_)try{const _hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");
 const _entry={date:Date.now(),wave:gs.wave,kills:gs.kills,echoes:ee,cause:gs.deathCause||"Unknown",scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,totalScrap:gs._totalScrap||gs.scrap,totalCores:gs._totalCores||gs.cores,totalPlasma:gs._totalPlasma||gs.plasma,forfeited:false,lifetimeEchoes:(meta.echoes||0)+ee,
 stats:{dmg:gs.dmgTrack||{},heal:gs.healTrack||{},pain:gs.painTrack||{},shieldPain:gs.shieldPain||{},waveDmg:gs.waveDmg||{},waveHeal:gs.waveHeal||{},wavePain:gs.wavePain||{},waveShieldPain:gs.waveShieldPain||{}},
 replay:gs._replay||null};
 _hist.push(_entry);
 {let _rCount=0;for(let _ri=_hist.length-1;_ri>=0;_ri--){if(_hist[_ri].replay){_rCount++;if(_rCount>20)delete _hist[_ri].replay;}}}
 localStorage.setItem("vs4-history",JSON.stringify(_hist));}catch(e){}
 setTimeout(()=>setPhase("dead"),700);}}
 if(gs.isTutorial&&p.hp<=0){p.hp=1;p.invTimer=1200;gs.screenShake=8;gs.flashTimer=50;sp(gs,p.x,p.y,"#ffcc44",8,3);}
 if(gs.waveActive&&gs.enemiesLeft<=0&&gs.spawnQueue.length===0&&gs.enemies.length===0){
 const _inSprint=gs._inSprint;
 if(_inSprint){if(!(has(gs,"nova")&&hasAU(gs,"nova_mastery")))gs._novaMines=[];gs.waveActive=false;gs._waveEndTimer=100;_revertHealthBot(gs);}
 else{const activeBullets=gs.eBullets.filter(b=>!b.mine&&Math.hypot(b.vx,b.vy)>1.0);
 if(activeBullets.length===0){gs.eBullets=[];if(!(has(gs,"nova")&&hasAU(gs,"nova_mastery")))gs._novaMines=[];gs.waveActive=false;gs._waveEndTimer=1000;_revertHealthBot(gs);}}
 }
 if(gs._isEnforcer&&gs._enfTimer<=0&&gs.enemies.length>0){gs.enemies.forEach(e=>{sp(gs,e.x,e.y,"#ff5577",20,6);});gs.enemies=[];gs.waveActive=false;gs._waveEndTimer=120;const _defET=gs._pgEnemy||"unknown";setMeta(prev=>{const _alreadyDefeated=!!(prev.enforcerDefeated||{})[_defET];const _ed={...(prev.enforcerDefeated||{})};_ed[_defET]=true;const _eb2={...(prev.enforcerBest||{})};_eb2[_defET]=60;const nx={...prev,enforcerKills:_alreadyDefeated?(prev.enforcerKills||0):(prev.enforcerKills||0)+1,enforcerDefeated:_ed,enforcerBest:_eb2};saveMeta(nx);return nx;});setTimeout(()=>{_setEnforcerDeath({enemy:_defET,survived:60,defeated:true});setPhase("menu");},800);}
 if(!gs.waveActive&&gs._waveEndTimer>0){gs._waveEndTimer-=dt;if(gs._waveEndTimer<=0){gs._waveEndTimer=0;if(has(gs,"drone")&&hasAU(gs,"drone_mastery")&&!gs._inSprint){gs.pickups.forEach(pk=>{if(!pk._counted){pk._counted=true;if(!gs._missed)gs._missed={};gs._missed[pk.type]=(gs._missed[pk.type]||0)+pk.value;}});}if(gs._inSprint&&gs.pickups.length>0){const _sclLab=metaRef.current.lab?.completed?.sprint_currency_lifespan||0;const _isLvlSC=metaRef.current.lab?.completed?.intro_sprint||0;const _isPctSC=_isLvlSC>0?[10,20,30,40,50][Math.min(_isLvlSC-1,4)]:0;const _isThreshSC=Math.floor((metaRef.current.highWave||0)*_isPctSC/100);const _lastSW=gs.wave>=_isThreshSC;const _expPks=[];const _keepPks=[];gs.pickups.forEach(pk=>{if(_lastSW||(gs.wave-(pk._waveCreated||gs.wave))>_sclLab){_expPks.push(pk);}else{_keepPks.push(pk);}});_expPks.forEach(pk=>{const _sc=CUR[pk.type]?.color||"#fff";for(let _si=0;_si<10;_si++){const _sa=PI2/10*_si+rand(-0.4,0.4);const _sv=rand(3,7.5);gs.particles.push({x:pk.x,y:pk.y,vx:Math.cos(_sa)*_sv,vy:Math.sin(_sa)*_sv,life:rand(16,28),ml:28,color:_sc,size:rand(5,9)});}for(let _si=0;_si<5;_si++){gs.particles.push({x:pk.x+rand(-12,12),y:pk.y+rand(-12,12),vx:rand(-1.5,1.5),vy:rand(-4,-1.5),life:rand(20,35),ml:35,color:"#ffffff",size:rand(3,5.5)});}});gs.pickups=_keepPks;}else{gs.pickups=[];}
 if(gs.isPlayground){
 const pg=pgRef.current;
 if(pg&&pg.subWave===1&&pg.enemy!=="boss"){
 setPgMode({enemy:pg.enemy,subWave:2});
 gs.waveActive=true;gs.waveTotal=5;gs.enemiesLeft=5;gs.waveKilled=0;
 for(let i=0;i<5;i++)setTimeout(()=>{if(gsRef.current===gs)spawnE(gs,{type:pg.enemy});},i*400);
 } else {
 if(gs.isPractise&&!gs._tutType)setMeta(prev=>{const nx={...prev,practiseHighWave:Math.max(prev.practiseHighWave||0,gs.wave)};saveMeta(nx);return nx;});
 if(!gs._isEnforcer&&!gs.isPractise){const _pgET=gs._pgEnemy||"unknown";setMeta(prev=>{const _pc={...(prev.pgCompleted||{})};_pc[_pgET]=true;const nx={...prev,pgCompleted:_pc};saveMeta(nx);return nx;});}
 setTimeout(()=>setPhase("menu"),600);
 }
 }
 else if(gs.isNewMode&&gs.wave>0&&gs.wave%2===0){
 offerAb(gs);
 }
 else if(gs.isNewMode){startWave(gs);}
 else if(gs.wave>0&&gs.wave%3===0){if(has(gs,"drone")&&hasAU(gs,"drone_mastery")&&!gs._inSprint&&gs._missed){const m=gs._missed;const gift={};["scrap","cores","plasma"].forEach(t=>{if(m[t]>0){const g=Math.ceil(m[t]/2);gift[t]=g;gs[t]+=g;}});gs._droneGift=Object.keys(gift).length>0?gift:{scrap:0,cores:0,plasma:0};gs._droneGiftShown=false;}gs._missed={};
 const _isLvl2=metaRef.current.lab?.completed?.intro_sprint||0;
 const _isPct2=_isLvl2>0?[10,20,30,40,50][Math.min(_isLvl2-1,4)]:0;
 const _isMax2=metaRef.current.highWave||0;
 const _isThresh2=Math.floor(_isMax2*_isPct2/100);
 if(_isPct2>0&&gs.wave<_isThresh2&&!gs.isTutorial&&!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&!gs.isCargo&&!metaRef.current.introSprintOff&&!gs._sprintStopReq){
 gs._pendingAbPicks=(gs._pendingAbPicks||0)+1;
 gs._sprintedWaves=(gs._sprintedWaves||0)+1;
 {const _seLvl=metaRef.current.lab?.completed?.sprint_efficiency||0;const _sePct=_seLvl>0?[40,50,60,70,80][Math.min(_seLvl-1,4)]:30;if(Math.random()*100<_sePct){gs._sprintLabWaves=(gs._sprintLabWaves||0)+1;setMeta(prev=>{const lab=prev.lab;if(!lab||!lab.active||lab.active.length===0)return prev;const nx={...prev,lab:{...lab,totalWaves:(lab.totalWaves||0)+1,active:[...lab.active],completed:{...(lab.completed||{})}}};nx.lab.active=nx.lab.active.map(ar=>{if(!ar)return null;const upd={...ar,wavesProgress:(ar.wavesProgress||0)+1};if(upd.wavesProgress>=upd.wavesNeeded){const lu=LAB_UPGRADES.find(l=>l.id===ar.id);const curLvl=(nx.lab.completed[ar.id]||0);nx.lab.completed[ar.id]=curLvl+1;if(lu&&curLvl+1<lu.levels.length)return{id:ar.id,wavesNeeded:lu.levels[curLvl+1].waves,wavesProgress:0};return null;}return upd;}).filter(Boolean);const _lfS=metaRef.current.labAlertFreq===undefined?5:metaRef.current.labAlertFreq;const _gsS=gsRef.current;if(_lfS>0&&_gsS){nx.lab.active.forEach(ar=>{if(!ar)return;const _luS=LAB_UPGRADES.find(l=>l.id===ar.id);const _lvlS=nx.lab.completed[ar.id]||0;if(ar.wavesProgress===0&&_lvlS>0){const _pnS=(_gsS._pendingLabNotifs||[]);if(!_gsS._labNotifs.some(ln=>ln.name===(_luS?_luS.name:ar.id)&&ln.levelUp&&ln.level===_lvlS)&&!_pnS.some(ln=>ln.name===(_luS?_luS.name:ar.id)&&ln.levelUp&&ln.level===_lvlS)){_gsS._pendingLabNotifs=_pnS;_gsS._pendingLabNotifs.push({name:_luS?_luS.name:ar.id,level:_lvlS,progress:0,needed:0,timer:180,levelUp:true,confetti:Array.from({length:24},()=>({x:rand(-60,60),y:rand(-15,5),vx:rand(-1.5,1.5),vy:rand(-2.5,-0.5),col:pick(["#ffcc44","#44ddcc","#ff88ff","#88ddff","#ff6644","#66ff88"]),rot:rand(0,6.28),life:999}))});}}else if(ar.wavesProgress>0&&ar.wavesProgress%_lfS===0&&ar.wavesProgress<ar.wavesNeeded){const _pnS2=(_gsS._pendingLabNotifs||[]);if(!_gsS._labNotifs.some(ln=>ln.name===(_luS?_luS.name:ar.id)&&ln.progress===ar.wavesProgress)&&!_pnS2.some(ln=>ln.name===(_luS?_luS.name:ar.id)&&ln.progress===ar.wavesProgress)){_gsS._pendingLabNotifs=_pnS2;_gsS._pendingLabNotifs.push({name:_luS?_luS.name:ar.id,level:_lvlS,progress:ar.wavesProgress,needed:ar.wavesNeeded,timer:180});}}});}saveMeta(nx);return nx;});}}
 startWave(gs,true);return;
 }
 if((gs._pendingAbPicks||0)>0){gs._pAb=(gs._pendingAbPicks||0);gs._pendingAbPicks=0;gs._sprintJustEnded=true;offerAb(gs);return;}
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
 const _lf=metaRef.current.labAlertFreq===undefined?5:metaRef.current.labAlertFreq;const _gs=gsRef.current;
 if(_lf>0&&_gs){nx.lab.active.forEach(ar=>{if(!ar)return;const _lu=LAB_UPGRADES.find(l=>l.id===ar.id);const _lvl=nx.lab.completed[ar.id]||0;if(ar.wavesProgress===0&&_lvl>0){const _pn=(_gs._pendingLabNotifs||[]);if(!_gs._labNotifs.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.levelUp&&ln.level===_lvl)&&!_pn.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.levelUp&&ln.level===_lvl)){_gs._pendingLabNotifs=_pn;_gs._pendingLabNotifs.push({name:_lu?_lu.name:ar.id,level:_lvl,progress:0,needed:0,timer:180,levelUp:true,confetti:Array.from({length:24},()=>({x:rand(-60,60),y:rand(-15,5),vx:rand(-1.5,1.5),vy:rand(-2.5,-0.5),col:pick(["#ffcc44","#44ddcc","#ff88ff","#88ddff","#ff6644","#66ff88"]),rot:rand(0,6.28),life:999}))});}}else if(ar.wavesProgress>0&&ar.wavesProgress%_lf===0&&ar.wavesProgress<ar.wavesNeeded){const _pn2=(_gs._pendingLabNotifs||[]);if(!_gs._labNotifs.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.progress===ar.wavesProgress)&&!_pn2.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.progress===ar.wavesProgress)){_gs._pendingLabNotifs=_pn2;_gs._pendingLabNotifs.push({name:_lu?_lu.name:ar.id,level:_lvl,progress:ar.wavesProgress,needed:ar.wavesNeeded,timer:180});}}});}
 saveMeta(nx);return nx;
 });
 if(gs.isTutorial&&gs.wave===3)setTimeout(()=>setTutStep(5),350);offerAb(gs);}
 else{if(has(gs,"drone")&&hasAU(gs,"drone_mastery")&&!gs._inSprint&&gs._missed){const m=gs._missed;const gift={};["scrap","cores","plasma"].forEach(t=>{if(m[t]>0){const g=Math.ceil(m[t]/2);gift[t]=g;gs[t]+=g;}});gs._droneGift=Object.keys(gift).length>0?gift:{scrap:0,cores:0,plasma:0};gs._droneGiftShown=false;}gs._missed={};
 if(gs.isTutorial){if(gs.wave===1){gs.scrap=Math.max(gs.scrap,20);setTutStep(3);}else if(gs.wave===5)setTutStep(7);}
 const _isLvl=metaRef.current.lab?.completed?.intro_sprint||0;
 const _isPct=_isLvl>0?[10,20,30,40,50][Math.min(_isLvl-1,4)]:0;
 const _isMax=metaRef.current.highWave||0;
 const _isThresh=Math.floor(_isMax*_isPct/100);
 if(_isPct>0&&gs.wave<_isThresh&&!gs.isTutorial&&!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&!gs.isCargo&&!metaRef.current.introSprintOff&&!gs._sprintStopReq){
 gs._sprintedWaves=(gs._sprintedWaves||0)+1;
 {const _seLvl=metaRef.current.lab?.completed?.sprint_efficiency||0;const _sePct=_seLvl>0?[40,50,60,70,80][Math.min(_seLvl-1,4)]:30;if(Math.random()*100<_sePct){gs._sprintLabWaves=(gs._sprintLabWaves||0)+1;setMeta(prev=>{const lab=prev.lab;if(!lab||!lab.active||lab.active.length===0)return prev;const nx={...prev,lab:{...lab,totalWaves:(lab.totalWaves||0)+1,active:[...lab.active],completed:{...(lab.completed||{})}}};nx.lab.active=nx.lab.active.map(ar=>{if(!ar)return null;const upd={...ar,wavesProgress:(ar.wavesProgress||0)+1};if(upd.wavesProgress>=upd.wavesNeeded){const lu=LAB_UPGRADES.find(l=>l.id===ar.id);const curLvl=(nx.lab.completed[ar.id]||0);nx.lab.completed[ar.id]=curLvl+1;if(lu&&curLvl+1<lu.levels.length)return{id:ar.id,wavesNeeded:lu.levels[curLvl+1].waves,wavesProgress:0};return null;}return upd;}).filter(Boolean);const _lfS=metaRef.current.labAlertFreq===undefined?5:metaRef.current.labAlertFreq;const _gsS=gsRef.current;if(_lfS>0&&_gsS){nx.lab.active.forEach(ar=>{if(!ar)return;const _luS=LAB_UPGRADES.find(l=>l.id===ar.id);const _lvlS=nx.lab.completed[ar.id]||0;if(ar.wavesProgress===0&&_lvlS>0){const _pnS=(_gsS._pendingLabNotifs||[]);if(!_gsS._labNotifs.some(ln=>ln.name===(_luS?_luS.name:ar.id)&&ln.levelUp&&ln.level===_lvlS)&&!_pnS.some(ln=>ln.name===(_luS?_luS.name:ar.id)&&ln.levelUp&&ln.level===_lvlS)){_gsS._pendingLabNotifs=_pnS;_gsS._pendingLabNotifs.push({name:_luS?_luS.name:ar.id,level:_lvlS,progress:0,needed:0,timer:180,levelUp:true,confetti:Array.from({length:24},()=>({x:rand(-60,60),y:rand(-15,5),vx:rand(-1.5,1.5),vy:rand(-2.5,-0.5),col:pick(["#ffcc44","#44ddcc","#ff88ff","#88ddff","#ff6644","#66ff88"]),rot:rand(0,6.28),life:999}))});}}else if(ar.wavesProgress>0&&ar.wavesProgress%_lfS===0&&ar.wavesProgress<ar.wavesNeeded){const _pnS2=(_gsS._pendingLabNotifs||[]);if(!_gsS._labNotifs.some(ln=>ln.name===(_luS?_luS.name:ar.id)&&ln.progress===ar.wavesProgress)&&!_pnS2.some(ln=>ln.name===(_luS?_luS.name:ar.id)&&ln.progress===ar.wavesProgress)){_gsS._pendingLabNotifs=_pnS2;_gsS._pendingLabNotifs.push({name:_luS?_luS.name:ar.id,level:_lvlS,progress:ar.wavesProgress,needed:ar.wavesNeeded,timer:180});}}});}saveMeta(nx);return nx;});}}
 startWave(gs,true);return;
 }
 if((gs._pendingAbPicks||0)>0){gs._pAb=(gs._pendingAbPicks||0);gs._pendingAbPicks=0;gs._sprintJustEnded=true;if((gs._sprintLabWaves||0)>0){const _gs=gsRef.current;if(_gs){if(!_gs._pendingLabNotifs)_gs._pendingLabNotifs=[];_gs._pendingLabNotifs.push({name:"Sprint Labs",level:0,progress:gs._sprintLabWaves,needed:gs._sprintedWaves||0,timer:240});}}offerAb(gs);return;}
 setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});
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
 if(lu&&curLvl+1<lu.levels.length){
 return{id:ar.id,wavesNeeded:lu.levels[curLvl+1].waves,wavesProgress:0};
 }
 return null;
 }
 return upd;
 }).filter(Boolean);
 const _lf2=metaRef.current.labAlertFreq===undefined?5:metaRef.current.labAlertFreq;const _gs2=gsRef.current;
 if(_lf2>0&&_gs2){nx.lab.active.forEach(ar=>{if(!ar)return;const _lu=LAB_UPGRADES.find(l=>l.id===ar.id);const _lvl=nx.lab.completed[ar.id]||0;if(ar.wavesProgress===0&&_lvl>0){const _pn3=(_gs2._pendingLabNotifs||[]);if(!_gs2._labNotifs.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.levelUp&&ln.level===_lvl)&&!_pn3.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.levelUp&&ln.level===_lvl)){_gs2._pendingLabNotifs=_pn3;_gs2._pendingLabNotifs.push({name:_lu?_lu.name:ar.id,level:_lvl,progress:0,needed:0,timer:180,levelUp:true,confetti:Array.from({length:24},()=>({x:rand(-60,60),y:rand(-15,5),vx:rand(-1.5,1.5),vy:rand(-2.5,-0.5),col:pick(["#ffcc44","#44ddcc","#ff88ff","#88ddff","#ff6644","#66ff88"]),rot:rand(0,6.28),life:999}))});}}else if(ar.wavesProgress>0&&ar.wavesProgress%_lf2===0&&ar.wavesProgress<ar.wavesNeeded){const _pn4=(_gs2._pendingLabNotifs||[]);if(!_gs2._labNotifs.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.progress===ar.wavesProgress)&&!_pn4.some(ln=>ln.name===(_lu?_lu.name:ar.id)&&ln.progress===ar.wavesProgress)){_gs2._pendingLabNotifs=_pn4;_gs2._pendingLabNotifs.push({name:_lu?_lu.name:ar.id,level:_lvl,progress:ar.wavesProgress,needed:ar.wavesNeeded,timer:180});}}});}
 if(changed||true){saveMeta(nx);return nx;}
 return prev;
 });
 setPhase("shop");}}}
 }
 function render(){
 const gs=gsRef.current,canvas=canvasRef.current;if(!gs||!canvas)return;
 const ctx=canvas.getContext("2d");ctx.save();try{const _rs=metaRef.current.resScale||2;ctx.setTransform(_rs,0,0,_rs,0,0);
 ctx.beginPath();ctx.rect(0,0,GW,GH);ctx.clip();
 if(gs.screenShake>0&&!metaRef.current.epilepsySafe){gs.screenShake=Math.min(gs.screenShake,15);ctx.translate((_vsRealRandom()*2-1)*gs.screenShake,(_vsRealRandom()*2-1)*gs.screenShake);}
 ctx.fillStyle="#06060e";ctx.fillRect(-20,-20,GW+40,GH+40);
 gs.stars.forEach(s=>{ctx.globalAlpha=s.br+Math.sin(gs.time*0.002+s.x)*0.1;ctx.fillStyle="#8888cc";ctx.fillRect(s.x,s.y,s.sz,s.sz);});ctx.globalAlpha=1;
 if(gs._ehFlash>0){gs._ehFlash-=0.333;const ehT=1-gs._ehFlash/30;const ehMaxR=Math.max(GW,GH)*1.1;const ehR=ehT*ehMaxR;const ehA=Math.max(0,(gs._ehFlash/30)*0.22);const ehOx=gs._ehOriginX||gs.player.x;const ehOy=gs._ehOriginY||gs.player.y;ctx.strokeStyle=`rgba(60,15,90,${ehA})`;ctx.lineWidth=35*(1-ehT*0.6);ctx.beginPath();ctx.arc(ehOx,ehOy,ehR,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(80,25,120,${ehA*0.5})`;ctx.lineWidth=12*(1-ehT*0.5);ctx.beginPath();ctx.arc(ehOx,ehOy,ehR*0.7,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(40,8,60,${ehA*0.3})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(ehOx,ehOy,ehR*0.4,0,PI2);ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=1;}
 gs.gravWells.forEach(gw=>{const a=Math.min(0.6,gw.life/gw.ml*0.7);if(gw.conjoined)return;if(gw.golden){const _gt=gs.time*0.003;ctx.strokeStyle=`rgba(255,204,68,${a})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,220,100,${a*0.3})`;ctx.lineWidth=1.5;for(let _gi=0;_gi<3;_gi++){ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r*(0.3+_gi*0.2),_gt+_gi*1.5,_gt+_gi*1.5+1.2);ctx.stroke();}}else{ctx.strokeStyle=`rgba(153,68,255,${a})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(153,68,255,${a*0.5})`;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r*0.5,0,PI2);ctx.stroke();}ctx.globalAlpha=1;});gs.gravWells.filter(gw=>gw.conjoined).forEach(gw=>{const a=Math.min(0.6,gw.life/gw.ml*0.7);const col=gw.golden?"rgba(255,204,68,":"rgba(153,68,255,";const _pd=dist(gw,{x:gw.parentX,y:gw.parentY});const _pr=110;if(_pd>0){const _clipA=Math.acos(clamp((_pd*_pd+gw.r*gw.r-_pr*_pr)/(2*_pd*gw.r),-1,1));const _baseA=Math.atan2(gw.parentY-gw.y,gw.parentX-gw.x);ctx.strokeStyle=col+a+")";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(gw.x,gw.y,gw.r,_baseA+_clipA,_baseA-_clipA);ctx.stroke();}});ctx.globalAlpha=1;
 gs.novaRings.forEach(nr=>{const a=nr.life/nr.ml;if(nr.fire){ctx.strokeStyle=`rgba(255,102,34,${a*0.7})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,170,51,${a*0.3})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r*0.85,0,PI2);ctx.stroke();}else{ctx.strokeStyle=`rgba(255,136,255,${a*0.7})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r,0,PI2);ctx.stroke();ctx.strokeStyle=`rgba(255,136,255,${a*0.3})`;ctx.lineWidth=8;ctx.beginPath();ctx.arc(nr.x,nr.y,nr.r*0.95,0,PI2);ctx.stroke();}});
 if(gs._novaMines)gs._novaMines.forEach(nm=>{const _mp=0.5+Math.sin(gs.time*0.005)*0.2;const _mt=gs.time*0.003;const _msz=10;const _mdr=30;ctx.globalAlpha=_mp;ctx.fillStyle="#1a0822";ctx.beginPath();ctx.arc(nm.x,nm.y,_msz,0,PI2);ctx.fill();ctx.strokeStyle="#ff88ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(nm.x,nm.y,_msz,0,PI2);ctx.stroke();ctx.fillStyle="#ff44cc";ctx.beginPath();ctx.arc(nm.x,nm.y,_msz*0.35,0,PI2);ctx.fill();for(let _mi=0;_mi<4;_mi++){const _ma=(PI2/4)*_mi+_mt;ctx.fillStyle="#cc44aa";ctx.beginPath();ctx.arc(nm.x+Math.cos(_ma)*_msz*0.6,nm.y+Math.sin(_ma)*_msz*0.6,_msz*0.18,0,PI2);ctx.fill();}ctx.globalAlpha=1;});
 gs.pickups.forEach(pk=>{if(pk.type==="bossShards")return;const pl=1+Math.sin(gs.time*0.005+pk.x)*0.2;ctx.globalAlpha=Math.min(1,pk.life/50);ctx.fillStyle=CUR[pk.type]?.color||"#fff";ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl,0,PI2);ctx.fill();if(pk.golden){ctx.strokeStyle="rgba(255,204,68,0.5)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl+3+Math.sin(gs.time*0.008)*1.5,0,PI2);ctx.stroke();}ctx.globalAlpha=Math.min(0.2,pk.life/70);ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl*2,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle="#eee";ctx.font="bold 8px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="center";ctx.fillText(`+${pk.value}`,pk.x,pk.y-pk.size-3);});
 gs.pickups.forEach(pk=>{if(pk.type!=="bossShards")return;const pl=1+Math.sin(gs.time*0.005+pk.x)*0.2;ctx.globalAlpha=Math.min(1,pk.life/50);ctx.fillStyle="#cc3333";ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl,0,PI2);ctx.fill();ctx.globalAlpha=Math.min(0.2,pk.life/70);ctx.beginPath();ctx.arc(pk.x,pk.y,pk.size*pl*2,0,PI2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle="#eee";ctx.font="bold 9px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="center";ctx.fillText(`+${pk.value}`,pk.x,pk.y-pk.size-3);});
 gs.particles.forEach(pt=>{if(pt.x<-20||pt.x>GW+20||pt.y<-20||pt.y>GH+20)return;ctx.globalAlpha=clamp(pt.life/pt.ml,0,1);ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.size*(pt.life/pt.ml),0,PI2);ctx.fill();});ctx.globalAlpha=1;
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
 if(gs._bots)for(const b of gs._bots){ctx.save();if(b.active){ctx.globalAlpha=0.09;ctx.fillStyle=b.col;ctx.beginPath();ctx.arc(b.x,b.y,b.curR,0,PI2);ctx.fill();ctx.globalAlpha=0.75;ctx.strokeStyle=b.col;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(b.x,b.y,b.curR,0,PI2);ctx.stroke();ctx.globalAlpha=0.85;_drawBotIcon(ctx,b.id,b.x,b.y,8,b.col);}else{ctx.globalAlpha=0.8;_drawBotIcon(ctx,b.id,b.x,b.y,8,b.col);}ctx.globalAlpha=1;ctx.restore();}
 gs.enemies.forEach(e=>{const _eCol=(e.type==="bomber"&&(e._tdBlue||0)>0)?`rgba(${Math.round(255*(1-e._tdBlue)+68*e._tdBlue)},${Math.round(204*(1-e._tdBlue)+170*e._tdBlue)},${Math.round(68*(1-e._tdBlue)+255*e._tdBlue)},1)`:e.color;
 if(e._elite){if(e._eliteReinf){const _au=0.4+Math.sin(gs.time*0.008+(e.sineOff||0))*0.2;ctx.strokeStyle=`rgba(255,60,90,${_au})`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(e.x,e.y,e.size+4,0,PI2);ctx.stroke();}else{const _au=0.4+Math.sin(gs.time*0.008+(e.sineOff||0))*0.2;ctx.strokeStyle=`rgba(255,60,90,${_au})`;ctx.shadowColor="#ff4488";ctx.shadowBlur=8;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(e.x,e.y,e.size+4,0,PI2);ctx.stroke();ctx.shadowBlur=0;const _gt2=gs.time;const _gcE=["#00ffff","#ff00ff","#44ff88"];const _pcoE=ctx.globalCompositeOperation;ctx.globalCompositeOperation="lighter";for(let _giE=0;_giE<3;_giE++){const _gxE=Math.sin(_gt2*0.011+_giE*2.1+(e.sineOff||0))*3+Math.sin(_gt2*0.029+_giE)*1.5;const _gyE=Math.cos(_gt2*0.009+_giE*1.7)*1.5;ctx.globalAlpha=0.5+Math.sin(_gt2*0.006+_giE)*0.12;drawShape(ctx,e.type,e.x+_gxE,e.y+_gyE,e.size,_gcE[_giE],_gt2,e);}ctx.globalCompositeOperation=_pcoE;ctx.globalAlpha=1;}}
 drawShape(ctx,e.type,e.x,e.y,e.size,_eCol,gs.time,e);
 if(e._elite){ctx.globalAlpha=1;if(!e._eliteReinf&&e._eliteCallTimer>0){const _tp=e._eliteCallTimer/6000;ctx.strokeStyle="#ff4488";ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y-e.size-7,4.5,-Math.PI/2,-Math.PI/2+PI2*_tp);ctx.stroke();}}
 if(e.burnTimer>0){const ft=gs.time*0.01;const _fc=e._orbHit?["#1144cc","#2266dd","#4488ee","#66aaff","#88ccff","#bbddff"]:["#cc2200","#ff4411","#ff6622","#ff8833","#ffaa33","#ffcc44"];const _fScale=e.type==="boss"?1.4:1;for(let fi=0;fi<(e.type==="boss"?4:3);fi++){const fa=ft+fi*(e.type==="boss"?1.05:2.1);const fx=e.x+Math.sin(fa)*e.size*0.6;const fy=e.y-e.size*0.3+Math.sin(fa*1.3)*e.size*0.4;const fs=(4.5+Math.sin(fa*0.7)*3)*_fScale;ctx.globalAlpha=0.55+Math.sin(fa*1.5)*0.2;const ci=Math.floor(Math.abs(Math.sin(fa*0.5))*(_fc.length-1));ctx.fillStyle=_fc[ci];ctx.beginPath();ctx.moveTo(fx,fy-fs*1.6);ctx.bezierCurveTo(fx-fs*0.8,fy-fs*0.5,fx-fs*0.6,fy+fs*0.5,fx,fy+fs*0.3);ctx.bezierCurveTo(fx+fs*0.6,fy+fs*0.5,fx+fs*0.8,fy-fs*0.5,fx,fy-fs*1.6);ctx.fill();ctx.strokeStyle="#000000";ctx.lineWidth=0.8;ctx.stroke();}ctx.globalAlpha=1;}
 if((e._elecTimer||0)>0){const _ea=Math.min(1,e._elecTimer/300);const _ec=e._elecColor||"#88ddff";ctx.globalAlpha=_ea*0.8;ctx.strokeStyle=_ec;ctx.shadowColor=_ec;ctx.shadowBlur=6;ctx.lineWidth=1.5;for(let _li=0;_li<4;_li++){const _la=(PI2/4)*_li+gs.time*0.012;const _lx1=e.x+Math.cos(_la)*e.size*0.4;const _ly1=e.y+Math.sin(_la)*e.size*0.4;const _lx2=e.x+Math.cos(_la)*e.size*1.3;const _ly2=e.y+Math.sin(_la)*e.size*1.3;const _mx=(_lx1+_lx2)/2+(Math.sin(gs.time*0.05+_li)*5);const _my=(_ly1+_ly2)/2+(Math.cos(gs.time*0.05+_li)*5);ctx.beginPath();ctx.moveTo(_lx1,_ly1);ctx.lineTo(_mx,_my);ctx.lineTo(_lx2,_ly2);ctx.stroke();}ctx.shadowBlur=0;ctx.globalAlpha=1;}
 if(e.type==="boss"&&!gs._isEnforcer){const hp=e.hp/e.maxHp;ctx.fillStyle="#220011";ctx.fillRect(e.x-30,e.y-e.size-14,60,6);ctx.fillStyle=hp>0.5?"#ff2266":"#ff0033";ctx.fillRect(e.x-30,e.y-e.size-14,60*hp,6);}
 });
 if(has(gs,"orbitals")){const _iRr=hasAU(gs,"orbitals_mastery")?32:36;gs.orbitals.forEach(o=>{let ox,oy;if(o.layer===1){ox=gs.player.x+Math.cos(o.angle)*190;oy=gs.player.y+Math.sin(o.angle)*48;}else{ox=gs.player.x+Math.cos(o.angle)*_iRr;oy=gs.player.y+Math.sin(o.angle)*_iRr;}ctx.fillStyle="#00e5ff";ctx.globalAlpha=0.7;ctx.beginPath();ctx.arc(ox,oy,5,0,PI2);ctx.fill();ctx.globalAlpha=0.2;ctx.beginPath();ctx.arc(ox,oy,9,0,PI2);ctx.fill();ctx.globalAlpha=1;});}
 gs.drones.forEach(dr=>{ctx.fillStyle=scc;ctx.fillRect(dr.x-4,dr.y-4,8,8);ctx.strokeStyle=scc+"44";ctx.lineWidth=1;ctx.strokeRect(dr.x-6,dr.y-6,12,12);if(gs._droneRage){ctx.fillStyle="#ff4444";ctx.globalAlpha=0.5+Math.sin(gs.time*0.015)*0.2;for(let _fi=0;_fi<5;_fi++){const _fa=gs.time*0.007+_fi*1.3;ctx.beginPath();ctx.arc(dr.x+Math.sin(_fa)*6,dr.y-7-Math.abs(Math.sin(_fa*1.3))*8,2.5+Math.sin(_fa)*1,0,PI2);ctx.fill();}ctx.globalAlpha=1;}});if(gs._droneRage&&gs.enemies.includes(gs._droneRage)){const _dt=gs._droneRage;ctx.strokeStyle="#ff444466";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(_dt.x,_dt.y,_dt.size+4,0,PI2);ctx.stroke();ctx.strokeStyle="#ff222244";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(_dt.x-_dt.size*0.7,_dt.y);ctx.lineTo(_dt.x+_dt.size*0.7,_dt.y);ctx.stroke();ctx.beginPath();ctx.moveTo(_dt.x,_dt.y-_dt.size*0.7);ctx.lineTo(_dt.x,_dt.y+_dt.size*0.7);ctx.stroke();ctx.fillStyle="#ff333344";ctx.beginPath();ctx.arc(_dt.x,_dt.y,3,0,PI2);ctx.fill();ctx.globalAlpha=1;}
 if(has(gs,"homing")&&gs.player.alive){const hx=lerp(gs._seekerX||gs.player.x,gs.player.x-20,0.04);const hy=lerp(gs._seekerY||gs.player.y,gs.player.y+18,0.04);gs._seekerX=hx;gs._seekerY=hy;ctx.fillStyle=scc;ctx.globalAlpha=0.85;ctx.beginPath();ctx.arc(hx,hy,5,0,PI2);ctx.fill();ctx.strokeStyle=scc+"44";ctx.lineWidth=1;ctx.beginPath();ctx.arc(hx,hy,7,0,PI2);ctx.stroke();ctx.globalAlpha=1;}
 const p=gs.player;
 if(p.alive){const blink=p.invTimer>0&&Math.floor(p.invTimer/40)%2===0;const sc=gs.shipCol||{color:"#00e5ff",glow:"#00e5ff"};if(!blink){
 ctx.shadowColor=sc.glow;ctx.shadowBlur=10;ctx.fillStyle=sc.color;
 if(gs.isNewMode)ctx.globalAlpha=0.35;
 ctx.beginPath();ctx.moveTo(p.x,p.y-p.size-4);ctx.lineTo(p.x-p.size,p.y+p.size);ctx.lineTo(p.x,p.y+p.size*0.4);ctx.lineTo(p.x+p.size,p.y+p.size);ctx.closePath();ctx.fill();ctx.shadowBlur=0;const _sd=SHIP_DESIGNS.find(d=>d.id===(metaRef.current.shipDesign||"none"));if(_sd&&_sd.draw){const _dcId=metaRef.current.designColor||"orange";const _dcObj=SHIP_COLORS.find(c=>c.id===_dcId)||SHIP_COLORS[0];_sd.draw(ctx,p.x,p.y,p.size,_dcObj.color);ctx.globalAlpha=1;}
 if(gs.isNewMode){const _gt=gs.time;const _gcols=["#00ffff","#ff00ff","#44ff88"];
 for(let _gi=0;_gi<3;_gi++){const _goff=Math.sin(_gt*0.011+_gi*2.1)*3+Math.sin(_gt*0.029+_gi)*1.5;const _goffY=Math.cos(_gt*0.009+_gi*1.7)*1.5;ctx.globalAlpha=0.32+Math.sin(_gt*0.006+_gi)*0.1;ctx.fillStyle=_gcols[_gi];ctx.beginPath();ctx.moveTo(p.x+_goff,p.y-p.size-4+_goffY);ctx.lineTo(p.x-p.size+_goff,p.y+p.size+_goffY);ctx.lineTo(p.x+_goff,p.y+p.size*0.4+_goffY);ctx.lineTo(p.x+p.size+_goff,p.y+p.size+_goffY);ctx.closePath();ctx.fill();}
 ctx.globalAlpha=1;}
 ctx.globalAlpha=1;
 if(p.goldenShields>0){ctx.strokeStyle=`rgba(255,204,68,${0.5+Math.sin(gs.time*0.004)*0.2})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.size+10,0,PI2);ctx.stroke();}if(p.shields>0){ctx.strokeStyle=`rgba(68,170,255,${0.55+Math.sin(gs.time*0.004)*0.2})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,p.size+7,0,PI2);ctx.stroke();}if(gs._efShieldActive){ctx.strokeStyle=`rgba(255,85,119,${0.5+Math.sin(gs.time*0.01)*0.35})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,p.y,p.size+12,0,PI2);ctx.stroke();}
 if(has(gs,"void_regen")&&gs._vrPlus&&gs._vrPlus.length>0){const _px=gs.player.x,_py=gs.player.y;gs._vrPlus.forEach(v=>{const vx=_px+v.ox,vy=_py+v.oy;const va=clamp(v.life/v.ml,0,1);ctx.globalAlpha=va*0.85;ctx.strokeStyle="rgba(180,110,255,0.95)";ctx.shadowColor="#aa66ff";ctx.shadowBlur=6;ctx.lineWidth=1.8;const vs=v.sz*va;ctx.beginPath();ctx.moveTo(vx-vs,vy);ctx.lineTo(vx+vs,vy);ctx.stroke();ctx.beginPath();ctx.moveTo(vx,vy-vs);ctx.lineTo(vx,vy+vs);ctx.stroke();ctx.shadowBlur=0;});ctx.globalAlpha=1;}
 if(metaRef.current.showMagnetRange!==false){const _mrv=p.magnetRange*(gs._magnetMult||1);ctx.strokeStyle="rgba(68,255,136,0.18)";ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(p.x,p.y,_mrv,0,PI2);ctx.stroke();ctx.setLineDash([]);}
 ctx.fillStyle=sc.color;ctx.globalAlpha=0.25;ctx.beginPath();ctx.arc(p.x,p.y+p.size+4,3.5+Math.sin(gs.time*0.008)*2,0,PI2);ctx.fill();ctx.globalAlpha=1;}
 if(has(gs,"mirror")&&!blink){ctx.globalAlpha=0.25;ctx.fillStyle="#aa88ff";const mx=GW-p.x;ctx.beginPath();ctx.moveTo(mx,p.y-p.size-4);ctx.lineTo(mx-p.size,p.y+p.size);ctx.lineTo(mx,p.y+p.size*0.4);ctx.lineTo(mx+p.size,p.y+p.size);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
 if(gs._lasso){const L=gs._lasso;if(L.phase==="windup"){const wt=1-L.timer/2000;const _sp=L._spin||0;ctx.globalAlpha=0.3+wt*0.5;ctx.strokeStyle="#aa88ff";ctx.lineWidth=2;const _lr=15+wt*20;for(let _ri=0;_ri<2;_ri++){const _ra=_sp+_ri*Math.PI;ctx.beginPath();ctx.arc(GW-p.x+Math.cos(_ra)*_lr,p.y+Math.sin(_ra)*_lr*0.4,4,0,PI2);ctx.stroke();}ctx.globalAlpha=0.15;ctx.beginPath();ctx.ellipse(GW-p.x,p.y,_lr,_lr*0.4,0,0,PI2);ctx.stroke();}else if(L.phase==="launch"||L.phase==="capture"){ctx.globalAlpha=0.3;ctx.strokeStyle="#aa88ff";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(GW-p.x,p.y);ctx.lineTo(L.x,L.y);ctx.stroke();ctx.globalAlpha=L.phase==="capture"?0.2:0.35;ctx.strokeStyle="#bb99ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(L.x,L.y,L.pushR,0,PI2);ctx.stroke();ctx.fillStyle="#aa88ff";ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(L.x,L.y,6,0,PI2);ctx.fill();if(L.phase==="capture"&&L.captured){L.captured.forEach((ce,ci)=>{if(!gs.enemies.includes(ce))return;const _qt=gs.time*0.004+ci*1.5;for(let _qi=0;_qi<3;_qi++){const _qp=(_qt+_qi*1.2)%3;const _qy=ce.y-ce.size-_qp*8;const _qx=ce.x+Math.sin(_qt+_qi*2)*8;const _qa=clamp(1-_qp/3,0,0.7);ctx.globalAlpha=_qa*0.85;ctx.strokeStyle="rgba(180,110,255,0.95)";ctx.shadowColor="#aa66ff";ctx.shadowBlur=4;ctx.font="bold 9px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="center";ctx.fillStyle="rgba(220,160,255,1)";ctx.fillText("?",_qx,_qy);}ctx.shadowBlur=0;});}}ctx.globalAlpha=1;}}}
 const _hm=metaRef.current.hitMode||(metaRef.current.showHitText===false?"off":"small");gs.hitTexts.forEach(ht=>{ctx.globalAlpha=clamp(ht.life/ht.ml,0,1);ctx.fillStyle=ht.col;ctx.font="bold "+(_hm==="large"?16:11)+"px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="center";ctx.fillText(ht.text,ht.x,ht.y);});ctx.globalAlpha=1;
 if(gs._slices){gs._slices.forEach(sl=>{sl.life-=1;const _a=clamp(sl.life/sl.ml,0,1);ctx.globalAlpha=_a;ctx.strokeStyle="#ff4466";ctx.shadowColor="#ff2244";ctx.shadowBlur=16;ctx.lineWidth=8*_a;ctx.beginPath();ctx.moveTo(sl.x-Math.cos(sl.a)*sl.len*0.2,sl.y-Math.sin(sl.a)*sl.len*0.2);ctx.lineTo(sl.x+Math.cos(sl.a)*sl.len*0.8,sl.y+Math.sin(sl.a)*sl.len*0.8);ctx.stroke();ctx.strokeStyle="#ffaa88";ctx.lineWidth=1.5*_a;ctx.beginPath();ctx.moveTo(sl.x,sl.y);ctx.lineTo(sl.x+Math.cos(sl.a)*sl.len*0.6,sl.y+Math.sin(sl.a)*sl.len*0.6);ctx.stroke();ctx.shadowBlur=0;});gs._slices=gs._slices.filter(sl=>sl.life>0);ctx.globalAlpha=1;}
 if(gs.flashTimer>0&&!metaRef.current.epilepsySafe){ctx.fillStyle=`rgba(255,50,80,${gs.flashTimer/140})`;ctx.fillRect(-20,-20,GW+40,GH+40);}
 if(metaRef.current.showFps){const _f=fpsRef.current;_f.frames++;const _now=performance.now();if(_now-_f.last>=1000){_f.fps=_f.frames;_f.frames=0;_f.last=_now;}ctx.fillStyle="#667788";ctx.font="9px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="right";ctx.fillText(_f.fps+" FPS",GW-14,GH-10);}
 ctx.shadowBlur=0;const isOC=p.hp>p.maxHp;
 const baseW=170;const _hasOC=has(gs,"overcharge");const _ocCap=_hasOC?(hasAU(gs,"overcharge_sub1")?1.4:1.2):1;const _ocTotal=p.maxHp*_ocCap;
 if(gs.isCargo&&gs.train){
 const _carrs=gs.train.segs;const _bw=32,_bh=14,_bg=3;
 ctx.font="bold 9px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="center";
 _carrs.forEach((_seg,_si)=>{
 const _bx=14+_si*(_bw+_bg);const _by=14;
 if(!_seg.alive){
 ctx.fillStyle="#0a0a14";ctx.fillRect(_bx,_by,_bw,_bh);
 ctx.strokeStyle="#33334466";ctx.lineWidth=1;ctx.strokeRect(_bx,_by,_bw,_bh);
 ctx.fillStyle="#445566";ctx.fillText("X",_bx+_bw/2,_by+_bh-4);
 }else{
 const _pct=_seg.hp/_seg.maxHp;
 ctx.fillStyle="#1a0a10";ctx.fillRect(_bx,_by,_bw,_bh);
 const _hpCol=_pct>0.5?"#55cc88":_pct>0.25?"#ffcc44":"#ff4466";
 ctx.fillStyle=_hpCol;ctx.fillRect(_bx,_by,_bw*_pct,_bh);
 ctx.strokeStyle=_si===0?"#55cc8866":"#5599cc66";ctx.lineWidth=1;ctx.strokeRect(_bx,_by,_bw,_bh);
 ctx.fillStyle="#fff";ctx.fillText(Math.ceil(_seg.hp).toString(),_bx+_bw/2,_by+_bh-4);
 }
 });
 ctx.textAlign="left";
 if(gs._vulnTimer>0){
 const _vi=Math.min(1,gs._vulnTimer/5000);const _pulse=0.7+Math.sin(gs.time*0.008)*0.3;
 const _edgeStr=0.55*_vi*_pulse;const _edgeSz=60;
 const _gt=ctx.createLinearGradient(0,0,0,_edgeSz);
 _gt.addColorStop(0,`rgba(255,40,60,${_edgeStr})`);_gt.addColorStop(1,"rgba(255,40,60,0)");
 ctx.fillStyle=_gt;ctx.fillRect(0,0,GW,_edgeSz);
 const _gb=ctx.createLinearGradient(0,GH,0,GH-_edgeSz);
 _gb.addColorStop(0,`rgba(255,40,60,${_edgeStr})`);_gb.addColorStop(1,"rgba(255,40,60,0)");
 ctx.fillStyle=_gb;ctx.fillRect(0,GH-_edgeSz,GW,_edgeSz);
 const _gl=ctx.createLinearGradient(0,0,_edgeSz,0);
 _gl.addColorStop(0,`rgba(255,40,60,${_edgeStr})`);_gl.addColorStop(1,"rgba(255,40,60,0)");
 ctx.fillStyle=_gl;ctx.fillRect(0,0,_edgeSz,GH);
 const _gr=ctx.createLinearGradient(GW,0,GW-_edgeSz,0);
 _gr.addColorStop(0,`rgba(255,40,60,${_edgeStr})`);_gr.addColorStop(1,"rgba(255,40,60,0)");
 ctx.fillStyle=_gr;ctx.fillRect(GW-_edgeSz,0,_edgeSz,GH);
 }
 } else {
 ctx.fillStyle="#1a0a10";ctx.fillRect(14,14,baseW,14);
 if(_hasOC&&_ocCap>1){const _redW=baseW*(Math.min(p.hp,p.maxHp)/_ocTotal);ctx.fillStyle=(p.hp/p.maxHp)>0.3?"#ff3355":"#ff1133";ctx.fillRect(14,14,_redW,14);if(p.hp>p.maxHp){const _pStart=baseW*(p.maxHp/_ocTotal);const _pEnd=baseW*(Math.min(p.hp,_ocTotal)/_ocTotal);ctx.fillStyle="#9955cc";ctx.fillRect(14+_pStart,14,_pEnd-_pStart,14);}
 ctx.strokeStyle="#ffffffbb";ctx.lineWidth=2.5;const _100mark=baseW*(p.maxHp/_ocTotal);ctx.beginPath();ctx.moveTo(14+_100mark,14);ctx.lineTo(14+_100mark,28);ctx.stroke();
 if(hasAU(gs,"overcharge_mastery")){const _115mark=baseW*(p.maxHp*1.1/_ocTotal);ctx.strokeStyle="#44ddcc88";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14+_115mark,14);ctx.lineTo(14+_115mark,28);ctx.stroke();}
 } else {const hpPct=Math.max(0,Math.min(1,p.hp/p.maxHp));ctx.fillStyle=hpPct>0.3?"#ff3355":"#ff1133";ctx.fillRect(14,14,baseW*hpPct,14);}
 if(gs._hbFlash>0){ctx.globalAlpha=Math.min(0.55,gs._hbFlash/180*0.55);ctx.fillStyle="#55ff88";ctx.fillRect(14,14,baseW,14);ctx.globalAlpha=1;}ctx.strokeStyle="#ff335544";ctx.lineWidth=1;ctx.strokeRect(14,14,baseW,14);
 ctx.fillStyle="#fff";ctx.font="bold 10px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="left";
 ctx.fillText(`HP ${Math.min(Math.ceil(p.hp),Math.round(p.maxHp))}/${Math.round(p.maxHp)}${isOC?" +"+Math.ceil(p.hp-p.maxHp):""}`,18,25);if(has(gs,"void_regen")){const _vrWin2=hasAU(gs,"void_regen_sub2")&&gs.waveKilled>0?2500:4000;const _vrElapsed=gs.time-p.lastDmgTime;const _vrPct=clamp(_vrElapsed/_vrWin2,0,1);ctx.fillStyle="#1a0a20";ctx.fillRect(14,30,baseW,3);ctx.fillStyle=_vrPct>=1?"#aa66ff":"#6633aa";ctx.fillRect(14,30,baseW*_vrPct,3);}
 }
 if(gs._overheatBorderTimer>0&&!gs.isCargo&&!metaRef.current.overheatBorderOff&&!metaRef.current.epilepsySafe){
 const _ot=gs._overheatBorderTimer/800;
 const _oi=Math.pow(_ot,0.6); // ease-out
 const _ofl=0.82+Math.sin(gs.time*0.05)*0.12+Math.sin(gs.time*0.17)*0.06;
 const _ohStr=0.26*_oi*_ofl;const _ohSz=42; // toned down: lower alpha, thinner band
 const _grad=(g,s)=>{g.addColorStop(0,`rgba(255,55,20,${s*0.8})`);g.addColorStop(0.4,`rgba(255,120,35,${s*0.45})`);g.addColorStop(0.75,`rgba(255,190,90,${s*0.15})`);g.addColorStop(1,"rgba(255,190,90,0)");};
 const _gT=ctx.createLinearGradient(0,0,0,_ohSz);_grad(_gT,_ohStr);ctx.fillStyle=_gT;ctx.fillRect(0,0,GW,_ohSz);
 const _gB=ctx.createLinearGradient(0,GH,0,GH-_ohSz);_grad(_gB,_ohStr);ctx.fillStyle=_gB;ctx.fillRect(0,GH-_ohSz,GW,_ohSz);
 const _gL=ctx.createLinearGradient(0,0,_ohSz,0);_grad(_gL,_ohStr);ctx.fillStyle=_gL;ctx.fillRect(0,0,_ohSz,GH);
 const _gR=ctx.createLinearGradient(GW,0,GW-_ohSz,0);_grad(_gR,_ohStr);ctx.fillStyle=_gR;ctx.fillRect(GW-_ohSz,0,_ohSz,GH);
 ctx.save();ctx.globalCompositeOperation="lighter";
 const _lick=(bx,by,horiz,seed)=>{const _ft=gs.time*0.006+seed*2.1;const _wob=Math.sin(_ft*1.7+seed)*0.4+0.6;const _len=(24+Math.sin(_ft*2.2+seed)*15)*_oi;const _wid=4.5+Math.sin(_ft*3.1)*1.8;
  ctx.save();ctx.translate(bx,by);
  if(horiz)ctx.scale(_wid/Math.max(_len,1),1);else ctx.scale(1,_wid/Math.max(_len,1));
  const _rg=ctx.createRadialGradient(0,0,0,0,0,_len);
  _rg.addColorStop(0,`rgba(255,225,150,${0.24*_wob*_oi})`);
  _rg.addColorStop(0.35,`rgba(255,135,45,${0.15*_wob*_oi})`);
  _rg.addColorStop(1,"rgba(255,80,20,0)");
  ctx.fillStyle=_rg;ctx.beginPath();ctx.arc(0,0,_len,0,PI2);ctx.fill();ctx.restore();};
 for(let _i=0;_i<5;_i++){const _t=(_i+0.5)/5;_lick(GW*_t,0,false,_i);_lick(GW*_t,GH,false,_i+5);}
 for(let _i=0;_i<4;_i++){const _t=(_i+0.5)/4;_lick(0,GH*_t,true,_i+10);_lick(GW,GH*_t,true,_i+14);}
 ctx.restore();
 }
 ctx.font="10px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.fillStyle="#99aabb";
 if(gs._isEnforcer){const _eft=Math.max(0,gs._enfTimer);ctx.fillStyle="#ff5577";ctx.fillText(`ENFORCER · ${Math.ceil(_eft)}s remaining · ${gs.enemies.length} alive`,14,42);}else if(gs.isPlayground&&!gs.isPractise){const pg=pgRef.current;ctx.fillStyle="#55aa88";ctx.fillText(`PLAYGROUND: ${pg?pg.enemy.toUpperCase():""} · ${pg?.subWave===1?"Solo":"×5"} · ${gs.enemies.length} alive`,14,42);}
 else if(gs.isNewMode){ctx.fillStyle="#cc66cc";ctx.fillText(`PHANTOM · WAVE ${gs.wave} · ${gs.waveKilled}/${gs.waveTotal} killed · ${gs.enemies.length} alive`,14,42);}else if(gs._inSprint){ctx.fillStyle="#44ccaa";ctx.fillText(`INTRO SPRINT · WAVE ${gs.wave} · ${gs.waveKilled}/${gs.waveTotal} killed · ${gs.enemies.length} alive`,14,42);}else if(gs.isPractise){if(gs._tutType){ctx.fillStyle="#55cc99";ctx.fillText(`SANDBOX · ${gs.waveKilled}/${gs.waveTotal} killed · ${gs.enemies.length} alive`,14,42);}else{ctx.fillStyle="#cc8844";ctx.fillText(`PRACTISE: WAVE ${gs.wave} · ${gs.waveKilled}/${gs.waveTotal} killed · ${gs.enemies.length} alive`,14,42);}}
 else if(gs.isTutorial){ctx.fillStyle="#ffcc44";ctx.fillText(`TUTORIAL · WAVE ${gs.wave} · ${gs.waveKilled}/${gs.waveTotal} killed · ${gs.enemies.length} alive`,14,42);}
 else if(gs.isCargo){ctx.fillStyle="#55cc88";ctx.fillText(`CARGO · ${gs.kills} killed · ${gs.enemies.length} alive`,14,42);}
 else ctx.fillText(`WAVE ${gs.wave} · ${gs.waveKilled}/${gs.waveTotal} killed · ${gs.enemies.length} alive`,14,42);
 const rawHp=Math.round(BASE_HP*hpScale(gs.wave));const rawDmg=Math.round((7+gs.wave*1.8)*dmgScale(gs.wave)*0.35);
 ctx.fillStyle="#88aacc";ctx.font="9px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.fillText(`Base HP: ${rawHp} · Base Dmg: ${rawDmg}`,14,54);
 if(gs.isCargo){ctx.font="bold 10px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.fillStyle="#55cc88";ctx.fillText(`Distance: ${Math.floor(gs.cargoDistance)}m`,14,66);ctx.fillStyle="#ccaa66";ctx.fillText(`▣ ${Math.floor(gs.cargoPackages||0)}`,154,66);ctx.font="9px 'DejaVu Sans Mono', 'Courier New', monospace";}
 if(p.shields>0||p.goldenShields>0){ctx.font="10px 'DejaVu Sans Mono', 'Courier New', monospace";let _shX=14;const _shY=gs.isCargo?80:66;if(p.shields>0){ctx.fillStyle="#66bbff";ctx.fillText(`🛡×${p.shields}`,_shX,_shY);_shX+=50;}if(p.goldenShields>0){ctx.fillStyle="#ffcc44";ctx.fillText(`🛡×${p.goldenShields}`,_shX,_shY);}}
 ctx.textAlign="right";ctx.font="bold 12px 'DejaVu Sans Mono', 'Courier New', monospace";
 const _drawCurShape=(type,cx,cy,r,col)=>{ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1.5;ctx.lineJoin="round";
 if(type==="scrap"){ctx.beginPath();for(let _i=0;_i<6;_i++){const _a=(_i/6)*PI2-Math.PI/2;const _px=cx+Math.cos(_a)*r;const _py=cy+Math.sin(_a)*r;if(_i===0)ctx.moveTo(_px,_py);else ctx.lineTo(_px,_py);}ctx.closePath();ctx.stroke();}
 else if(type==="cores"){ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r*0.85,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r*0.85,cy);ctx.closePath();ctx.fill();}
 else if(type==="plasma"){ctx.beginPath();for(let _i=0;_i<8;_i++){const _a=(_i/8)*PI2-Math.PI/2;const _rr=_i%2===0?r:r*0.35;const _px=cx+Math.cos(_a)*_rr;const _py=cy+Math.sin(_a)*_rr;if(_i===0)ctx.moveTo(_px,_py);else ctx.lineTo(_px,_py);}ctx.closePath();ctx.fill();}
 else if(type==="echoes"){ctx.beginPath();for(let _i=0;_i<6;_i++){const _a=(_i/6)*PI2-Math.PI/2;const _px=cx+Math.cos(_a)*r;const _py=cy+Math.sin(_a)*r;if(_i===0)ctx.moveTo(_px,_py);else ctx.lineTo(_px,_py);}ctx.closePath();ctx.fill();}
 else if(type==="bossShards"){ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r*0.85,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r*0.85,cy);ctx.closePath();ctx.fill();ctx.strokeStyle="#06060e";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy-r*0.5);ctx.lineTo(cx+r*0.42,cy);ctx.lineTo(cx,cy+r*0.5);ctx.lineTo(cx-r*0.42,cy);ctx.closePath();ctx.stroke();}
 else if(type==="overheat"){ctx.beginPath();for(let _i=0;_i<12;_i++){const _a=(_i/12)*PI2-Math.PI/2;const _rr=_i%2===0?r:r*0.45;const _px=cx+Math.cos(_a)*_rr;const _py=cy+Math.sin(_a)*_rr;if(_i===0)ctx.moveTo(_px,_py);else ctx.lineTo(_px,_py);}ctx.closePath();ctx.fill();}
 ctx.restore();};
 const _drawCI=(type,val,col,y)=>{ctx.fillStyle=col;ctx.font="bold 12px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="right";const s=`${val}`;ctx.fillText(s,GW-14,y);const nw=ctx.measureText(s).width;_drawCurShape(type,GW-14-nw-12,y-4,6,col);};
 if(!gs.isCargo){_drawCI("scrap",gs.scrap,CUR.scrap.color,24);
 _drawCI("cores",gs.cores,CUR.cores.color,40);
 _drawCI("plasma",gs.plasma,CUR.plasma.color,56);}
 if(p.abilities.length>0){p.abilities.forEach((id,i)=>{const ab=ABILITIES.find(a=>a.id===id);if(ab){drawAbIcon(ctx,id,20+i*22,GH-14,20,"#bbccdd");}});}
 const _mc2=metaRef.current.mobileControls||"reactive";const _tr2=touchRef.current;
 if(_mc2==="reactive"&&_tr2.active){ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=2;ctx.beginPath();ctx.arc(_tr2.startX,_tr2.startY,60,0,PI2);ctx.stroke();ctx.globalAlpha=0.3;ctx.fillStyle="#ccddee";const _tjd=Math.min(Math.hypot(_tr2.curX-_tr2.startX,_tr2.curY-_tr2.startY),60);const _tja=Math.atan2(_tr2.curY-_tr2.startY,_tr2.curX-_tr2.startX);ctx.beginPath();ctx.arc(_tr2.startX+Math.cos(_tja)*_tjd,_tr2.startY+Math.sin(_tja)*_tjd,12,0,PI2);ctx.fill();ctx.globalAlpha=1;}
 if(_mc2==="stationary"){const _sjx=GW-90,_sjy=GH-90;ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=2;ctx.beginPath();ctx.arc(_sjx,_sjy,68,0,PI2);ctx.stroke();if(_tr2.active){ctx.globalAlpha=0.3;ctx.fillStyle="#ccddee";const _sjd=Math.min(Math.hypot(_tr2.curX-_sjx,_tr2.curY-_sjy),68);const _sja=Math.atan2(_tr2.curY-_sjy,_tr2.curX-_sjx);ctx.beginPath();ctx.arc(_sjx+Math.cos(_sja)*_sjd,_sjy+Math.sin(_sja)*_sjd,15,0,PI2);ctx.fill();}else{ctx.globalAlpha=0.2;ctx.fillStyle="#ccddee";ctx.beginPath();ctx.arc(_sjx,_sjy,15,0,PI2);ctx.fill();}ctx.globalAlpha=1;}
 if(_mc2==="arrows"){const _kSz=52,_kGp=5,_dcx=GW-115,_dcy=GH-135,_hk=26;
 ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=1.5;ctx.strokeRect(_dcx-_hk,_dcy-_hk-_kGp-_kSz,_kSz,_kSz);ctx.globalAlpha=_tr2._arrowU?0.4:0.12;ctx.fillStyle="#ccddee";ctx.beginPath();ctx.moveTo(_dcx,_dcy-_hk-_kGp-_kSz*0.72);ctx.lineTo(_dcx-_hk*0.55,_dcy-_hk-_kGp-_kSz*0.3);ctx.lineTo(_dcx+_hk*0.55,_dcy-_hk-_kGp-_kSz*0.3);ctx.fill();
 ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=1.5;ctx.strokeRect(_dcx-_hk,_dcy+_hk+_kGp,_kSz,_kSz);ctx.globalAlpha=_tr2._arrowD?0.4:0.12;ctx.beginPath();ctx.moveTo(_dcx,_dcy+_hk+_kGp+_kSz*0.72);ctx.lineTo(_dcx-_hk*0.55,_dcy+_hk+_kGp+_kSz*0.3);ctx.lineTo(_dcx+_hk*0.55,_dcy+_hk+_kGp+_kSz*0.3);ctx.fill();
 ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=1.5;ctx.strokeRect(_dcx-_hk-_kGp-_kSz,_dcy-_hk,_kSz,_kSz);ctx.globalAlpha=_tr2._arrowL?0.4:0.12;ctx.beginPath();ctx.moveTo(_dcx-_hk-_kGp-_kSz*0.72,_dcy);ctx.lineTo(_dcx-_hk-_kGp-_kSz*0.3,_dcy-_hk*0.55);ctx.lineTo(_dcx-_hk-_kGp-_kSz*0.3,_dcy+_hk*0.55);ctx.fill();
 ctx.globalAlpha=0.15;ctx.strokeStyle="#ccddee";ctx.lineWidth=1.5;ctx.strokeRect(_dcx+_hk+_kGp,_dcy-_hk,_kSz,_kSz);ctx.globalAlpha=_tr2._arrowR?0.4:0.12;ctx.beginPath();ctx.moveTo(_dcx+_hk+_kGp+_kSz*0.72,_dcy);ctx.lineTo(_dcx+_hk+_kGp+_kSz*0.3,_dcy-_hk*0.55);ctx.lineTo(_dcx+_hk+_kGp+_kSz*0.3,_dcy+_hk*0.55);ctx.fill();
 ctx.globalAlpha=1;}
 if(_mc2!=="reactive"||_tr2._wasUsed){ctx.globalAlpha=0.35;ctx.strokeStyle="#ccddee";ctx.lineWidth=2;const _pbx=GW-66;ctx.strokeRect(_pbx,62,52,32);ctx.fillStyle="#ccddee";ctx.fillRect(_pbx+14,68,7,20);ctx.fillRect(_pbx+29,68,7,20);ctx.globalAlpha=1;}
 if(_mc2==="reactive"&&_tr2.active)_tr2._wasUsed=true;
 if(gs.newEnemyNotif){const nn=gs.newEnemyNotif;const na=Math.min(1,nn.timer/30);const name=nn.type.charAt(0).toUpperCase()+nn.type.slice(1);
 ctx.globalAlpha=na;ctx.fillStyle="rgba(6,6,14,0.7)";ctx.fillRect(GW/2-80,68,160,26);ctx.strokeStyle="#ffcc4466";ctx.lineWidth=1;ctx.strokeRect(GW/2-80,68,160,26);
 ctx.fillStyle="#ffcc44";ctx.font="bold 10px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="center";ctx.fillText(`NEW: ${name}`,GW/2+8,85);
 const ed=ED[nn.type];if(ed){ctx.save();ctx.translate(GW/2-65,81);drawShape(ctx,nn.type,0,0,8,ed.col,gs.time,{});ctx.restore();}
 else if(nn.type==="boss"){ctx.save();ctx.translate(GW/2-65,81);drawShape(ctx,"boss",0,0,8,"#ff2266",gs.time,{});ctx.restore();}
 ctx.globalAlpha=1;}
 if(gs._labNotifs&&gs._labNotifs.length>0){gs._labNotifs.forEach((ln,ni)=>{const _ny=98+ni*38;const la=Math.min(1,ln.timer/30)*Math.min(1,(180-ln.timer)/15);
 ctx.globalAlpha=la;ctx.fillStyle="rgba(6,6,14,0.7)";ctx.fillRect(GW/2-100,_ny,200,26);ctx.strokeStyle=ln.levelUp?"#ffcc4466":"#ff886644";ctx.lineWidth=ln.levelUp?1.5:1;ctx.strokeRect(GW/2-100,_ny,200,26);
 ctx.save();ctx.translate(GW/2-84,_ny+13);ctx.strokeStyle=ln.levelUp?"#ffcc44":"#ff9966";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,-6);ctx.lineTo(-3,-1);ctx.lineTo(-6,6);ctx.lineTo(6,6);ctx.lineTo(3,-1);ctx.lineTo(3,-6);ctx.closePath();ctx.stroke();ctx.fillStyle=ln.levelUp?"#ffcc4444":"#ff996644";ctx.beginPath();ctx.moveTo(-5,3);ctx.lineTo(-6,6);ctx.lineTo(6,6);ctx.lineTo(5,3);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-2,-6);ctx.lineTo(2,-6);ctx.stroke();ctx.restore();
 ctx.fillStyle=ln.levelUp?"#ffcc44":"#ff9966";ctx.font="bold 9px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="center";
 if(ln.levelUp){ctx.fillText(`${ln.name} Lv${ln.level} COMPLETE!`,GW/2+10,_ny+17);
 if(ln.confetti){ln.confetti.forEach(c=>{if(ln.timer>0){ctx.globalAlpha=la*0.8;ctx.save();ctx.translate(GW/2+c.x,_ny+13+c.y);ctx.rotate(c.rot);ctx.fillStyle=c.col;ctx.fillRect(-2,-1.5,4,3);ctx.restore();}});}}
 else{ctx.fillText(`${ln.name} Lv${ln.level} ${ln.progress}/${ln.needed}`,GW/2+10,_ny+17);}
 ctx.globalAlpha=1;});}
 if(gs.isCargo)renderCargoOverlay(ctx,gs);
 if(gs.isCargo&&gs._cargoBuffNotif){const bn=gs._cargoBuffNotif;const ba=Math.min(1,bn.timer/30);
 ctx.globalAlpha=ba;
 ctx.fillStyle="rgba(6,6,14,0.85)";ctx.fillRect(GW/2-95,68,190,28);
 ctx.strokeStyle="#ff446699";ctx.lineWidth=1.5;ctx.strokeRect(GW/2-95,68,190,28);
 const _iconCx=GW/2-72,_iconCy=82;
 ctx.save();ctx.translate(_iconCx,_iconCy);
 ctx.fillStyle="#cc6688";
 ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(5,4);ctx.lineTo(-5,4);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#ff4466";ctx.lineWidth=1;ctx.stroke();
 ctx.fillStyle="#ff8899";ctx.beginPath();ctx.arc(0,-1,1.5,0,PI2);ctx.fill();
 ctx.restore();
 ctx.strokeStyle="#ff6688";ctx.lineWidth=1.5;ctx.lineCap="round";
 const _plusPositions=[[-10,-6],[8,-7],[6,7]];
 _plusPositions.forEach(([_pox,_poy])=>{
 const _px=_iconCx+_pox,_py=_iconCy+_poy;
 ctx.beginPath();ctx.moveTo(_px-2,_py);ctx.lineTo(_px+2,_py);
 ctx.moveTo(_px,_py-2);ctx.lineTo(_px,_py+2);ctx.stroke();
 });
 ctx.lineCap="butt";
 ctx.fillStyle="#ff6688";ctx.font="bold 10px 'DejaVu Sans Mono', 'Courier New', monospace";ctx.textAlign="center";
 ctx.fillText("ENEMIES STRONGER",GW/2+12,79);
 ctx.fillStyle="#cc8899";ctx.font="8px 'DejaVu Sans Mono', 'Courier New', monospace";
 ctx.fillText("Health & damage increased",GW/2+12,91);
 ctx.globalAlpha=1;ctx.textAlign="left";
 }
 }finally{ctx.restore();}
 }
 useEffect(()=>{const loop=t=>{const _rawDt=t-ltRef.current;const dt=Math.min(_rawDt,50);ltRef.current=t;try{
 const _gs=gsRef.current;
 if(phRef.current==="playing"&&!pausedRef.current&&_gs){
  if(_gs._replay){_gs._replay.frames.push({dt:dt,k:_vsEncodeKeys(keysRef.current),t:_vsEncodeTouch(touchRef.current)});}
  update(dt);
 } else if(phRef.current==="replay"&&_gs&&!_replayPausedRef.current){
  _gs._replayPacer=(_gs._replayPacer||0)+Math.min(_rawDt,1000);
  let _safety=0;
  while(_gs._replayIdx<_gs._replayFrames.length&&_safety<400){
   const _f=_gs._replayFrames[_gs._replayIdx];
   if(_gs._replayPacer<_f.dt)break;
   _gs._replayPacer-=_f.dt;_gs._replayConsumedGameTime+=_f.dt;_gs._replayIdx++;
   keysRef.current=_vsDecodeKeys(_f.k);
   touchRef.current=_vsDecodeTouch(_f.t);
   update(_f.dt);_safety++;
  }
  if(_gs._replayTotalGameTime>0)_setReplayProgress(_gs._replayConsumedGameTime/_gs._replayTotalGameTime);
  if(_gs._replayIdx>=_gs._replayFrames.length&&!_replayPausedRef.current){_setReplayPaused(true);_replayPausedRef.current=true;}
 }
 {const _rngBk=_vsPeekRng();render();_vsPokeRng(_rngBk);}
}catch(e){console.error("Game loop error:",e);}rafRef.current=requestAnimationFrame(loop);};rafRef.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rafRef.current);},[]);
 useEffect(()=>{const d=e=>{keysRef.current[e.key.toLowerCase()]=true;if(e.key===" ")e.preventDefault();};const u=e=>{keysRef.current[e.key.toLowerCase()]=false;};window.addEventListener("keydown",d);window.addEventListener("keyup",u);return()=>{window.removeEventListener("keydown",d);window.removeEventListener("keyup",u);};},[]);
 const _settersRef=useRef({});
 _settersRef.current={setPhase,setMeta,setDeathData,setShopData,setAbChoices,setTutStep,setPgMode,_setCargoDeath,_setEnforcerDeath,saveMeta};
 const _replayPrevGsRef=useRef(null),_replayPrevMetaRef=useRef(null);
 const[_replayProgress,_setReplayProgress]=useState(0);
 const[_replayPaused,_setReplayPaused]=useState(false);
 const _replayPausedRef=useRef(false);_replayPausedRef.current=_replayPaused;
 const[_replayUiMin,_setReplayUiMin]=useState(false);
 const _currentReplayRef=useRef(null);
 function _startReplay(replay){
  if(!replay||!replay.gsSnapshot||!replay.frames)return;
  _replayPrevGsRef.current=gsRef.current;
  _replayPrevMetaRef.current=metaRef.current;
  const rgs=_vsRestoreGs(replay.gsSnapshot);
  rgs._isReplay=true;rgs._replayFrames=replay.frames;rgs._replayIdx=0;rgs._replayPacer=0;
  rgs._replayTotalGameTime=replay.frames.reduce((s,f)=>s+f.dt,0);
  rgs._replayConsumedGameTime=0;
  gsRef.current=rgs;
  metaRef.current=replay.metaSnapshot||metaRef.current;
  _vsResumeRng(replay.seed);
  _currentReplayRef.current=replay;
  _setReplayProgress(0);_setReplayPaused(false);_setReplayUiMin(false);
  keysRef.current={};
  touchRef.current={active:false,startX:0,startY:0,curX:0,curY:0,id:null};
  setPhase("replay");
 }
 function _exitReplay(){
  _vsDeactivateRng();
  if(_replayPrevGsRef.current)gsRef.current=_replayPrevGsRef.current;
  if(_replayPrevMetaRef.current)metaRef.current=_replayPrevMetaRef.current;
  keysRef.current={};
  touchRef.current={active:false,startX:0,startY:0,curX:0,curY:0,id:null};
  setPhase("history");
 }
 function _restartReplay(){
  const gs=gsRef.current;if(!gs||!gs._isReplay)return;
 }
 useEffect(()=>{
 const c=canvasRef.current;if(!c)return;
 const getT=(e)=>{const r=c.getBoundingClientRect();const scl=GW/r.width;return{x:(e.clientX-r.left)*scl,y:(e.clientY-r.top)*scl};};
 const ts=(e)=>{if(phRef.current!=="playing"||pausedRef.current)return;const mc=metaRef.current.mobileControls||"reactive";const t=e.changedTouches[0];if(!t)return;e.preventDefault();const p=getT(t);
 if(p.x>GW-70&&p.x<GW-10&&p.y>58&&p.y<100){setPaused(pr=>!pr);return;}
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
 if((k==="p"||k==="escape")&&phRef.current==="playing"){
 if(wikiRef.current&&!_wikiClosingRef.current){_setWikiClosing(true);_wikiClosingRef.current=true;setShowStats(false);setTimeout(()=>{setShowWiki(false);_setWikiClosing(false);_wikiClosingRef.current=false;},200);}
 else{setPaused(p=>!p);setShowStats(false);}
 }
 if(k==="enter"&&phRef.current==="shop"){const gs=gsRef.current;if(gs&&!gs.isTutorial){cont();}}
 
 if(k===" "&&!e.repeat&&phRef.current==="playing"){const _gs=gsRef.current;if(_gs){if(_gs._inSprint&&metaRef.current.pathsUpg?.sp_stop){_gs._sprintStopReq=true;}if(_gs._isEnforcer&&metaRef.current.pathsUpg?.ef_shield&&!_gs._efShieldUsed){_gs._efShieldUsed=true;_gs._efShieldActive=true;_gs._efShieldT=2500;sp(_gs,_gs.player.x,_gs.player.y,"#ff5577",12,4);}if(_gs.isCargo&&metaRef.current.pathsUpg?.cg_rev){_gs._cargoFireRev=!_gs._cargoFireRev;}if(_gs.isNewMode&&metaRef.current.pathsUpg?.ph_wave&&!_gs._phWaveUsed){_gs._phWaveUsed=true;let _tok=Math.floor(_gs.enemies.filter(en=>en.hp>0).length*0.5);const _mk=[];_gs.enemies.forEach((en,ei)=>{if(_tok>0&&en.hp>0){_mk.push(ei);_tok--;}});_mk.sort((a2,b2)=>b2-a2).forEach(ki=>killE(_gs,_gs.enemies[ki],ki));_gs.screenShake=8;sp(_gs,_gs.player.x,_gs.player.y,"#cc66cc",30,6);}}}
 };window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);
 function buyShop(uid){const gs=gsRef.current;if(!gs)return;if(gs.isTutorial&&(tutRef.current===3||tutRef.current===4)&&uid!=="maxhp")return;const up=SHOP.find(u=>u.id===uid);if(up.wave>gs.wave)return;const lvl=gs.upgrades[uid]||0;const _ohB=metaRef.current.overheatUpgrades?.[uid]||0;if(lvl>=up.max+_ohB)return;const _owcL=metaRef.current.lab?.completed?.overheat_wave_cost||0;const _owcM=Math.max(0,1-_owcL*0.01);let cost=lvl>=up.max?Math.ceil(up.base*Math.pow(1+lvl*up.scale*3.5,up.exp)*10*Math.pow(OVERCHARGE_GROWTH,lvl-up.max)*_owcM):Math.ceil(up.base*Math.pow(1+lvl*up.scale,up.exp));if(gs[up.cur]<cost)return;gs[up.cur]-=cost;gs.upgrades[uid]=lvl+1;const _hpBefore=gs.player.hp;up.fn(gs.player);if(uid==="maxhp"){const _healed=gs.player.hp-_hpBefore;if(_healed>0)trackHeal(gs,"Hull Plating",_healed);if(gs.isTutorial&&tutRef.current<=4)setTutStep(45);}setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});}
 function cont(){setPhase("playing");const gs=gsRef.current;if(gs)startWave(gs);}
 function _startMainRun(){if(metaRef.current.autoDealerOn&&((metaRef.current.totalEchoesEarned||0)>=1500)&&!_dealerAuto&&(metaRef.current._dealerActive||[]).length<(metaRef.current._dealerSlots||1)){if(!_dealerOffers)_genDealerOffers();_setDealerAuto(true);goTo("dealer");return;}initGame();}
 function calcEchoes(gs){const w=gs?.wave||0,k=gs?.kills||0;const raw=Math.max(0,Math.floor(w*1.5+k*0.38+Math.pow(w,2.8)*0.065+Math.pow(w,1.8)*0.4)-(k===0&&w<=1?1:0));const _t=metaRef.current.metaTier||1;const _tv=_t===3?2.5:_t===2?1.5:1;const _ph=_t>=2?(1+(metaRef.current.phantomHighWave||0)*(0.01+(metaRef.current.lab?.completed?.phantom_enhance||0)*0.001)):1;const _pr=_t>=2?(1+(metaRef.current.practiseHighWave||0)*(0.006+(metaRef.current.lab?.completed?.practise_enhance||0)*0.001)):1;const _enf=_t>=2?1+(metaRef.current.enforcerKills||0)*0.025:1;const _des=_t>=2?1+((metaRef.current.ownedDesigns||[]).length)*0.004:1;return Math.floor(raw*_tv*_ph*_pr*_enf*_des*((gs?._diffuseMult||1)+((metaRef.current.pathsUpg?.pr_diff&&(metaRef.current.practiseHighWave||0)>0&&(metaRef.current.practiseHighWave||0)%5===0)?0.045:0)));}
 function forfeit(){const gs=gsRef.current;if(!gs)return;if(gs.isTutorial){const ee=calcEchoes(gs);gs.player.alive=false;const tutEchoes=Math.max(ee,50);setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:tutEchoes,cause:"Tutorial"});setMeta(prev=>{const nx={...prev,echoes:prev.echoes+tutEchoes,highWave:Math.max(prev.highWave||0,gs.wave),totalEchoesEarned:(prev.totalEchoesEarned||0)+tutEchoes};saveMeta(nx);return nx;});setTutStep(8);setConfirmForfeit(false);setPhase("dead");return;}if(gs.isCargo){gs.player.alive=false;gs._cargoFinished=true;const _d=Math.floor(gs.cargoDistance);setMeta(prev=>{const nx={...prev,cargoHighDistance:Math.max(prev.cargoHighDistance||0,_d),packages:(prev.packages||0)+Math.floor(gs.cargoPackages||0)};saveMeta(nx);return nx;});_setCargoDeath({distance:_d,kills:gs.kills,packages:Math.floor(gs.cargoPackages||0)});setConfirmForfeit(false);setPhase("menu");return;}if(gs.isPlayground||gs.isNewMode){gs.player.alive=false;if(gs.isNewMode)setMeta(prev=>{const nx={...prev,phantomHighWave:Math.max(prev.phantomHighWave||0,Math.max(0,gs.wave-1))};saveMeta(nx);return nx;});setPhase("menu");return;}const ee=calcEchoes(gs);gs.player.alive=false;setDeathData({wave:gs.wave,kills:gs.kills,echoesEarned:ee,cause:"Self"});setMeta(prev=>{const _ohF=gs._overheatPoints||0;const nx={...prev,echoes:prev.echoes+ee,overheat:(prev.overheat||0)+_ohF,highWave:Math.max(prev.highWave||0,gs.wave),totalEchoesEarned:(prev.totalEchoesEarned||0)+ee};saveMeta(nx);return nx;});
 try{const _hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");
 const _entry={date:Date.now(),wave:gs.wave,kills:gs.kills,echoes:ee,cause:"Forfeited",scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,totalScrap:gs._totalScrap||gs.scrap,totalCores:gs._totalCores||gs.cores,totalPlasma:gs._totalPlasma||gs.plasma,forfeited:true,lifetimeEchoes:(meta.echoes||0)+ee,
 stats:{dmg:gs.dmgTrack||{},heal:gs.healTrack||{},pain:gs.painTrack||{},shieldPain:gs.shieldPain||{},waveDmg:gs.waveDmg||{},waveHeal:gs.waveHeal||{},wavePain:gs.wavePain||{},waveShieldPain:gs.waveShieldPain||{}},
 replay:null};
 _hist.push(_entry);
 {let _rCount=0;for(let _ri=_hist.length-1;_ri>=0;_ri--){if(_hist[_ri].replay){_rCount++;if(_rCount>20)delete _hist[_ri].replay;}}}
 localStorage.setItem("vs4-history",JSON.stringify(_hist));}catch(e){}
 setConfirmForfeit(false);setPhase("dead");}
 function buyMeta(uid){if(tutRef.current===10&&uid!=="m_dmg")return;const up=META.find(u=>u.id===uid);const tier=meta.metaTier||1;const lvl=meta.levels[uid]||0;const mx=up.max*tier;if(lvl>=mx)return;const cost=metaCost(up,lvl,tier);if(meta.echoes<cost)return;setMeta(prev=>{const nx={...prev,echoes:prev.echoes-cost,levels:{...prev.levels,[uid]:lvl+1}};saveMeta(nx);return nx;});}
 function buyBotUnlock(id){const owned=meta.bots||{};if(owned[id])return;const cnt=Object.keys(owned).length;const cost=BOT_UNLOCK[Math.min(cnt,BOT_UNLOCK.length-1)];if((meta.echoes||0)<cost)return;setMeta(prev=>{const nb={...(prev.bots||{})};nb[id]={size:0,time:0,custom:0};const nx={...prev,echoes:prev.echoes-cost,bots:nb};saveMeta(nx);return nx;});}
 function buyBotStat(id,stat){const owned=meta.bots||{};const lv=owned[id];if(!lv||(lv[stat]||0)>=20)return;const cost=botUpCost(lv[stat]||0);if((meta.echoes||0)<cost)return;setMeta(prev=>{const nb={...(prev.bots||{})};const cur={...(nb[id]||{size:0,time:0,custom:0})};cur[stat]=(cur[stat]||0)+1;nb[id]=cur;const nx={...prev,echoes:prev.echoes-cost,bots:nb};saveMeta(nx);return nx;});}
 function buyTier(){const tier=meta.metaTier||1;if(tier>=3)return;const allMaxed=META.every(up=>(meta.levels[up.id]||0)>=up.max*tier);const tierCost=tier===1?800:25000;if(!allMaxed||meta.echoes<tierCost)return;setMeta(prev=>{const nx={...prev,echoes:prev.echoes-tierCost,metaTier:(prev.metaTier||1)+1};saveMeta(nx);return nx;});}
 const _affDot={position:"absolute",top:-4,right:-4,width:9,height:9,borderRadius:"50%",background:"#ff4455",boxShadow:"0 0 6px #ff4455",pointerEvents:"none",zIndex:2}; const _affDotBig={position:"absolute",top:-4,right:-4,width:15,height:15,borderRadius:"50%",background:"#ff4455",boxShadow:"0 0 9px #ff4455",pointerEvents:"none",zIndex:2}; const _isCheater=(m)=>!!m&&(m.totalEchoesEarned||0)>0&&(m.echoes||0)>(m.totalEchoesEarned||0);
 const _dotsOn=meta.affordDotOff!==true;
 const _affordPaths=(!meta.pathsCore&&(meta.packages||0)>=20)||(!!meta.pathsCore&&(meta.packages||0)>=50&&PATH_DEFS.some(p=>!(meta.pathsCat&&meta.pathsCat[p.id])));
 const _affordDesign=SHIP_DESIGNS.some(d=>d.cost>0&&!(meta.ownedDesigns||[]).includes(d.id)&&(meta.bossShards||0)>=d.cost);
 const _affordMeta=()=>{const m=meta;const tier=m.metaTier||1;const lv=m.levels||{};const ec=m.echoes||0;let ship=META.some(up=>{const l=lv[up.id]||0;const mx=up.max*tier;return l<mx&&ec>=metaCost(up,l,tier);});if(!ship&&tier<3){const allMaxed=META.every(up=>(lv[up.id]||0)>=up.max*tier);const tc=tier===1?800:25000;if(allMaxed&&ec>=tc)ship=true;}const shards=m.shards||0;const bought=m.shardsBought||0;const au=m.abUpgrades||{};let used=0;ABILITIES.forEach(ab=>{if(au[ab.id+"_sub1"])used++;if(au[ab.id+"_sub2"])used++;if(au[ab.id+"_mastery"])used+=3;});const shardsLeft=Math.max(0,60-shards-used);const shardCost=Math.ceil(100*Math.pow(1+bought*0.12,1.6)+(bought>15?Math.pow(bought-15,1.8)*0.8:0)+(bought>30?Math.pow(bought-30,1.5)*2.5:0));let abilities=(shardsLeft>0&&ec>=shardCost);if(!abilities&&shards>0){abilities=ABILITIES.some(ab=>{const s1=!!au[ab.id+"_sub1"],s2=!!au[ab.id+"_sub2"],ms=!!au[ab.id+"_mastery"];if(!s1||!s2)return true;return !ms&&shards>=3;});}const slots=(m.lab&&m.lab.slots)||0;const lab=slots<LAB_SLOT_COSTS.length&&ec>=LAB_SLOT_COSTS[slots];const owned=m.bots||{};const cnt=Object.keys(owned).length;let bots=cnt<BOTS.length&&ec>=BOT_UNLOCK[Math.min(cnt,BOT_UNLOCK.length-1)];if(!bots){bots=BOTS.some(b=>{const l=owned[b.id];if(!l)return false;return ["size","time","custom"].some(st=>(l[st]||0)<20&&ec>=botUpCost(l[st]||0));});}let overheat;if(!m.overheatUnlocked){overheat=ec>=OH_COSTS.unlock;}else{const ohPts=m.overheat||0;const ohUp=m.overheatUpgrades||{};const ohIU=m.overheatItemUnlocked||{};const _shop=SHOP.filter(u=>u.id!=="rear"&&u.id!=="shield");overheat=_shop.some(up=>{if(!ohIU[up.id])return ec>=OH_COSTS.itemEc(up.id)&&ohPts>=OH_COSTS.itemOhCost(up.id);const ol=ohUp[up.id]||0;return ol<OH_COSTS.maxLvl&&ohPts>=OH_COSTS.lvlCost(up.id,ol);});}return{ship,abilities,lab,bots,overheat,any:ship||abilities||lab||bots||overheat};};
 const bs2=(c)=>({padding:"10px 28px",background:"transparent",border:`2px solid ${c}`,color:c,fontSize:14,fontFamily:"inherit",cursor:"pointer",letterSpacing:2,transition:"all 0.2s"});
 const hv=c=>({onMouseOver:e=>{e.target.style.background=c;e.target.style.color="#06060e";},onMouseOut:e=>{e.target.style.background="transparent";e.target.style.color=c;}});
 const [sc2,setSc2]=useState(()=>typeof window!=="undefined"?Math.min((window.innerWidth-32)/GW,(window.innerHeight-32)/GH):1);
 useEffect(()=>{const _onResize=()=>setSc2(Math.min((window.innerWidth-32)/GW,(window.innerHeight-32)/GH));window.addEventListener("resize",_onResize);window.addEventListener("orientationchange",_onResize);return()=>{window.removeEventListener("resize",_onResize);window.removeEventListener("orientationchange",_onResize);};},[]);
 const EnemyIcon=({type,size,color,cardMode})=>{
 const ref=useRef(null);
 useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext("2d");ctx.setTransform(3,0,0,3,0,0);ctx.clearRect(0,0,size,size);
 const ed=ED[type];if(ed)drawShape(ctx,type,size/2,size/2,size*0.35,color||ed.col,0,{_cardMode:!!cardMode});
 else if(type==="boss")drawShape(ctx,"boss",size/2,size/2,size*0.35,color||"#ff2266",0,{_cardMode:!!cardMode});
 },[type,size,color,cardMode]);
 return <canvas ref={ref} width={size*3} height={size*3} style={{width:size,height:size,flexShrink:0}} />;
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
 useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext("2d");ctx.setTransform(3,0,0,3,0,0);ctx.clearRect(0,0,size,size);
 const s=size*0.3;const cx=size/2,cy=size/2;
 ctx.shadowColor=sc.glow;ctx.shadowBlur=10;ctx.fillStyle=sc.color;
 ctx.beginPath();ctx.moveTo(cx,cy-s-3);ctx.lineTo(cx-s,cy+s);ctx.lineTo(cx,cy+s*0.4);ctx.lineTo(cx+s,cy+s);ctx.closePath();ctx.fill();
 ctx.shadowBlur=0;const _sdM=SHIP_DESIGNS.find(d=>d.id===(metaRef.current.shipDesign||"none"));if(_sdM&&_sdM.draw){const _dcIdM=metaRef.current.designColor||"orange";const _dcM=SHIP_COLORS.find(c2=>c2.id===_dcIdM)||SHIP_COLORS[0];_sdM.draw(ctx,cx,cy,s,_dcM.color);ctx.globalAlpha=1;ctx.shadowBlur=0;}ctx.fillStyle=sc.color;ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(cx,cy+s+3,3,0,PI2);ctx.fill();ctx.globalAlpha=1;
 },[size,sc,meta.shipDesign,meta.designColor]);
 return <canvas ref={ref} width={size*3} height={size*3} onClick={onClick} style={{width:size,height:size,cursor:"pointer",borderRadius:"50%",border:`1px solid ${sc.color}22`,transition:"all 0.2s"}}
 onMouseOver={e=>e.currentTarget.style.borderColor=sc.color+"66"} onMouseOut={e=>e.currentTarget.style.borderColor=sc.color+"22"} />;
 };
 const [MenuBG]=useState(()=>()=>{
 const bgRef=useRef(null);const bgStars=useRef(null);const bgNebula=useRef(null);const bgDebris=useRef(null);const bgTime=useRef(0);const bgRaf=useRef(null);
 useEffect(()=>{
 if(!bgStars.current){const _sd=getBgShared();bgStars.current=_sd.stars;bgNebula.current=_sd.neb;bgDebris.current=_sd.deb;
 }
 const draw=()=>{const c=bgRef.current;if(!c)return;const ctx=c.getContext("2d");bgTime.current+=16;const t=bgTime.current;
 ctx.fillStyle="#04040a";ctx.fillRect(0,0,GW,GH);
 ctx.strokeStyle="rgba(0,229,255,0.04)";ctx.lineWidth=0.5;const hSz=40;const hH=hSz*Math.sqrt(3);for(let gy=-1;gy<GH/hH+1;gy++){for(let gx=-1;gx<GW/(hSz*1.5)+1;gx++){const ox=gx*hSz*1.5;const oy=gy*hH+(gx%2===0?0:hH/2);ctx.beginPath();for(let hi=0;hi<6;hi++){const ha=(Math.PI/3)*hi+Math.PI/6;ctx.lineTo(ox+Math.cos(ha)*hSz*0.45,oy+Math.sin(ha)*hSz*0.45);}ctx.closePath();ctx.stroke();}}
 bgNebula.current.forEach(n=>{n.x+=n.drift;n.y+=n.driftY;if(n.x<-n.r)n.x=GW+n.r;if(n.x>GW+n.r)n.x=-n.r;if(n.y<-n.r)n.y=GH+n.r;if(n.y>GH+n.r)n.y=-n.r;const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);g.addColorStop(0,n.col);g.addColorStop(0.6,n.col.slice(0,7)+"33");g.addColorStop(1,"transparent");ctx.globalAlpha=n.opc+Math.sin(t*0.0002+n.x*0.01)*0.03;ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();});
 ctx.globalAlpha=1;bgDebris.current.forEach(d=>{d.rot+=d.rotSpd*16;d.y+=d.spY;d.x+=d.spX;if(d.y>GH+30){d.y=-30;d.x=rand(0,GW);}if(d.x<-30)d.x=GW+30;if(d.x>GW+30)d.x=-30;ctx.globalAlpha=d.opc;ctx.strokeStyle=d.col;ctx.lineWidth=1;ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.beginPath();for(let si=0;si<d.sides;si++){const sa=(Math.PI*2/d.sides)*si;ctx.lineTo(Math.cos(sa)*d.sz,Math.sin(sa)*d.sz);}ctx.closePath();ctx.stroke();ctx.restore();});
 ctx.globalAlpha=1;bgStars.current.forEach(s=>{const lSpd=[0.3,0.6,1.0,0.15][s.layer];s.y+=s.sp*lSpd;if(s.y>GH){s.y=-2;s.x=rand(0,GW);}s.pulse+=s.pulseSpd*16;const b=s.br+Math.sin(s.pulse)*0.2;ctx.globalAlpha=clamp(b,0.08,1);if(s.col){ctx.fillStyle=s.col;ctx.shadowColor=s.col;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(s.x,s.y,s.sz*0.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}else{ctx.fillStyle="#8899cc";ctx.fillRect(s.x,s.y,s.sz,s.sz);}});
 ctx.globalAlpha=1;
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
 return <canvas ref={bgRef2} width={GW} height={GH} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",zIndex:0,opacity:0.35,pointerEvents:"none"}} />;
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
 const[codexOpen,setCodexOpen]=useState({controls:false,mechanics:false,currencies:false,enemies:false,abilities:false,scrap:false,cores:false,plasma:false,meta:false,metaab:false,designs:false,labs:false,overheat:false,bots:false,paths:false,cargo:false});
 const togCodex=(k)=>setCodexOpen(p=>({...p,[k]:!p[k]}));
 const CodexSec=({id,title,color,children})=>(<div style={{marginBottom:4}}>
 <h3 onClick={()=>togCodex(id)} style={{color:color||"#bbccdd",fontSize:13,letterSpacing:2,margin:"10px 0 4px",cursor:"pointer",userSelect:"none",textDecoration:"underline",textDecorationColor:(color||"#bbccdd")+"44",textUnderlineOffset:3}}>{codexOpen[id]?"▾":"▸"} {title}</h3>
 {codexOpen[id]&&children}</div>);
 const Wiki=()=>(
 <div style={{position:"absolute",inset:0,background:"#06060e",zIndex:20,display:"flex",flexDirection:"column",animation:_wikiClosing?"menuFadeOut 200ms ease-out forwards":"vsElemIn 200ms cubic-bezier(0.22,1,0.36,1) both"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px 10px",background:"#06060e",borderBottom:"1px solid #1a1a2e",flexShrink:0,zIndex:1}}>
 <h2 style={{color:"#dde",fontSize:18,margin:0,letterSpacing:3}}>VOID CODEX</h2>
 <button onClick={()=>closeWiki()} style={{background:"none",border:"1px solid #667",color:"#bbc",padding:"4px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:11}}>✕</button>
 </div>
 <div className={"vs-scroll "+(_wikiEntering&&!_wikiClosing?"vs-enter":"")} style={{flex:1,overflow:"auto",padding:"10px 16px 16px",minHeight:0}}>
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
 <span style={{color:c.color,fontSize:16*(c.sz||1),minWidth:20,display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22}}>{c.icon}</span>
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
 <div style={{display:"flex",gap:10,alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1a1a2e"}}>
 <div style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",color:"#ffcc44",fontSize:22,fontWeight:"bold"}}>✦</div>
 <div style={{flex:1}}>
 <div style={{color:"#ffcc44",fontSize:10,fontWeight:"bold"}}>Elite <span style={{color:"#667788",fontSize:8}}>[Wave 25+]</span></div>
 <div style={{color:"#8899aa",fontSize:9}}>From wave 25 onward, a regular enemy can spawn as an elite (bombers and splitters never do). The chance starts at 2% and rises by 6 percentage points each wave past 25, up to a maximum of 95%.</div>
 <div style={{color:"#667788",fontSize:8}}>An elite has 60% more health and, about six seconds after appearing, summons a group of reinforcement enemies. Reinforcements do not count toward kills or wave-clear progress, drop no currency, and cannot be destroyed until every other enemy in the wave has been cleared.</div>
 </div>
 </div>
 </CodexSec>
 <CodexSec id="abilities" title="ABILITIES" color="#66bbff">
 <div style={{color:"#778899",fontSize:8,marginBottom:3}}>Choose 1 of 3 every 3 waves. Permanent for the run. Cannot be duplicated.</div>
 {ABILITIES.map(ab=>(<div key={ab.id} style={{padding:"3px 0",borderBottom:"1px solid #1a1a2e"}}><span style={{color:"#dde",fontSize:10,display:"inline-flex",alignItems:"center",gap:4}}><AbilityIcon id={ab.id} size={14} color="#dde" /><b>{ab.name}</b></span><div style={{color:"#8899aa",fontSize:8}}>{ab.desc}</div></div>))}
 </CodexSec>
 <CodexSec id="designs" title={"SHIP DESIGNS"} color="#cc7744">
 <div style={{color:"#8899aa",fontSize:11,lineHeight:1.6,marginBottom:6}}>
 Custom ship designs are cosmetic overlays that change the look of your ship without affecting its size or hitbox.<br/><br/>
 <b style={{color:"#bbccdd"}}>Unlocking</b> — designs are purchased with <span style={{color:"#cc3333"}}>{String.fromCharCode(9672)} Boss Shards</span>, a permanent currency dropped by bosses. You need the Boss Shard Drop Rate lab to start earning them. There are 15 designs ranging from 5 to 100 boss shards, with more intricate designs costing more.<br/><br/>
 <b style={{color:"#bbccdd"}}>Equipping</b> — go to Settings, Customisation, Custom Designs. Tap any owned design to equip it. Only one design can be active at a time.<br/><br/>
 <b style={{color:"#bbccdd"}}>Design Colour</b> — designs have their own colour, separate from your ship colour. You can change it in the Custom Designs menu. The design colour cannot be the same as your ship colour.<br/><br/>
 <b style={{color:"#bbccdd"}}>HyperEcho Bonus</b> — each design you own (excluding the default) adds <span style={{color:"#ffcc44"}}>+0.004</span> to the Designer multiplier in HyperEcho. This is permanent and based on how many you own, not which one is equipped. Requires Meta Tier 2+.
 </div>
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
 <b style={{color:"#bbccdd"}}>Shard Costs</b> — each shard costs more than the last. {(()=>{const _sc=n=>Math.ceil(100*Math.pow(1+n*0.12,1.6)+(n>15?Math.pow(n-15,1.8)*0.8:0)+(n>30?Math.pow(n-30,1.5)*2.5:0));return `First shard: ${_sc(0)}⬢, 5th: ~${_sc(4)}⬢, 10th: ~${_sc(9)}⬢, 30th: ~${_sc(29).toLocaleString()}⬢.`;})()}<br/>
 <b style={{color:"#bbccdd"}}>Total Shards Needed</b> — 12 abilities × (2 subs + 1 mastery of 3 shards) = 60 shards to max everything.<br/>
 <b style={{color:"#bbccdd"}}>Total Echoes for All Shards</b> — approximately {(()=>{let t=0;for(let n=0;n<60;n++)t+=Math.ceil(100*Math.pow(1+n*0.12,1.6)+(n>15?Math.pow(n-15,1.8)*0.8:0)+(n>30?Math.pow(n-30,1.5)*2.5:0));return t.toLocaleString();})()}⬢
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
<CodexSec id="labs" title={"META LAB UPGRADES"} color="#ff9966">
 <div style={{color:"#8899aa",fontSize:11,lineHeight:1.6,marginBottom:6}}>Labs let you research upgrades over multiple waves. Progress carries across runs.</div>
 {[...LAB_UPGRADES].sort((a,b)=>(a.tier||1)-(b.tier||1)||(a.minWave-b.minWave)).map((lab,li,arr)=>{const curLvl=meta.lab?.completed?.[lab.id]||0;const _prevTier=li>0?(arr[li-1].tier||1):0;const _curTier=lab.tier||1;const _showTierH=_curTier!==_prevTier;const _unresVal=(()=>{if(lab.id==="boss_shard_drop")return "0%";if(lab.id==="intro_sprint")return "0%";if(lab.id==="sprint_efficiency")return "30%";if(lab.id==="cheaper_respec")return "0⬢ discount";if(lab.id==="phantom_enhance")return "+0.010 per wave";if(lab.id==="practise_enhance")return "+0.006 per wave";if(lab.id==="sprint_currency_lifespan")return "1 wave";if(lab.id==="diffusion_chance")return "0%";if(lab.id==="diffusion_multi")return "+0.038 per diffuse";if(lab.id==="overheat_bot_mult")return "+0 overheat";if(lab.id==="overheat_wave_cost")return "-0%";if(lab.id==="overheat_chance")return "25%";return "";})();return(
 <div key={lab.id}>{_showTierH&&<div style={{color:_curTier===3?"#ff5577":_curTier===2?"#bb99ff":"#44ccaa",fontSize:10,fontWeight:"bold",letterSpacing:1,marginTop:li>0?10:0,paddingBottom:4,borderBottom:"1px solid "+(_curTier===3?"#ff557722":_curTier===2?"#bb99ff22":"#44ccaa22")}}>TIER {_curTier}</div>}
 <div style={{padding:"6px 0",borderBottom:"1px solid #1a1a2e"}}>
 <div style={{color:"#44ccaa",fontSize:12,fontWeight:"bold"}}>{lab.name} <span style={{color:"#667788",fontSize:10}}>· Min wave: {lab.minWave} · Current: Lv{curLvl}/{lab.levels.length}</span></div>
 <div style={{color:"#8899aa",fontSize:10,marginTop:2}}>{lab.desc}</div>
 <div style={{color:"#667788",fontSize:9,marginTop:2}}>Unresearched value: <span style={{color:"#88aacc"}}>{_unresVal}</span></div>
 <div style={{marginTop:4,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:3}}>
 {lab.levels.map((lv,li)=>{const done=curLvl>li;const _lVal=(()=>{if(lab.id==="boss_shard_drop")return `${lv.pct}%`;if(lab.id==="intro_sprint")return `${lv.pct}%`;if(lab.id==="sprint_efficiency")return `${lv.pct}%`;if(lab.id==="cheaper_respec")return `-${lv.reduce}⬢`;if(lab.id==="phantom_enhance")return `+${((li+1)*0.001).toFixed(3)}`;if(lab.id==="practise_enhance")return `+${((li+1)*0.001).toFixed(3)}`;if(lab.id==="sprint_currency_lifespan")return `${li+2} waves`;if(lab.id==="diffusion_chance")return `${lv.pct}%`;if(lab.id==="diffusion_multi")return `+${((li+1)*0.009).toFixed(3)}`;if(lab.id==="overheat_bot_mult")return `+${li+1} overheat`;if(lab.id==="overheat_wave_cost")return `-${li+1}%`;if(lab.id==="overheat_chance")return `${lv.pct}%`;return "";})();return(
 <div key={li} style={{fontSize:9,padding:"2px 4px",background:done?"#0a1a1a":"#08080f",border:"1px solid "+(done?"#44ccaa33":"#22223322"),borderRadius:2,textAlign:"center"}}>
 <span style={{color:done?"#44ccaa":"#667788"}}>Lv{li+1}</span> <span style={{color:"#556677"}}>{lv.waves}w</span>{_lVal&&<span style={{color:done?"#88ddaa":"#778899",fontSize:8}}> {_lVal}</span>}
 </div>);})}
 </div>
 </div></div>);})}
 </CodexSec>
<CodexSec id="bots" title={"META BOT UPGRADES"} color="#55ddaa">
<div style={{color:"#8899aa",fontSize:11,lineHeight:1.6,marginBottom:6}}>Bots are deployable zones that activate during a run, each affecting enemies (or your bullets) inside its radius. Unlock them permanently with Echoes, then upgrade each bot's stats.</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:4}}><b style={{color:"#55ddaa"}}>Unlocking:</b> Each new bot costs more than the last — <span style={{color:CUR.echoes.color}}>⬢ {BOT_UNLOCK.map(c=>c.toLocaleString()).join(" / ")}</span> echoes for your 1st through 4th bot.</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:6}}><b style={{color:"#55ddaa"}}>Upgrading:</b> Every bot has three stats — <span style={{color:"#ccddee"}}>Size</span> (radius), <span style={{color:"#ccddee"}}>Time</span> (active duration) and a unique <span style={{color:"#ccddee"}}>custom</span> stat. Each goes up to <span style={{color:"#ccddee"}}>20</span> levels with Echoes; cost scales with level.</div>
{BOTS.map((b,i)=>{const _owned=!!(meta.bots&&meta.bots[b.id]);return(
<div key={b.id} style={{padding:"6px 0",borderBottom:"1px solid #1a1a2e"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:b.col,fontSize:12,fontWeight:"bold"}}>{b.name}</span><span style={{color:_owned?"#55ddaa":"#667788",fontSize:9}}>{_owned?"Unlocked":"Locked"}</span></div>
<div style={{color:"#8899aa",fontSize:10,marginTop:2}}>{b.desc}</div>
<div style={{color:"#667788",fontSize:9,marginTop:2}}>Custom stat: <span style={{color:"#88aacc"}}>{b.custom.label}</span></div>
</div>);})}
</CodexSec>
<CodexSec id="overheat" title={"META OVERHEAT UPGRADES"} color="#ff6622">
<div style={{color:"#8899aa",fontSize:11,lineHeight:1.6,marginBottom:6}}>Overheat lets you push wave upgrades beyond their normal max level.</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:4}}>
<b style={{color:"#ff6622"}}>How to unlock:</b> Purchase the overheat system for <span style={{color:CUR.echoes.color}}>⬢ {OH_COSTS.unlock.toLocaleString()} echoes</span> in the Overheat Upgrades tab of Meta Upgrades.
</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:4}}>
<b style={{color:"#ff6622"}}>Earning ✹ Overheat:</b> When overheat is unlocked, enemies killed by flame (Flame Coating) or while burning have a <span style={{color:"#ccddee"}}>{(()=>{const _l=meta.lab?.completed?.overheat_chance||0;return _l>0?[30,35,40,45,50][Math.min(_l-1,4)]:25;})()}%</span> chance to earn 1 overheat point. Overheat is awarded at the end of a run (death or forfeit).
</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:4}}>
<b style={{color:"#ff6622"}}>Per-item unlock:</b> Each wave upgrade must be individually unlocked before overheating, costing both <span style={{color:CUR.echoes.color}}>⬢ echoes</span> and <span style={{color:"#ff6622"}}>✹ overheat</span> — costs vary per upgrade and are shown below. Rear Turret and Barrier Cell cannot be overheated.
</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:4}}>
<b style={{color:"#ff6622"}}>Overheating:</b> Spend <span style={{color:"#ff6622"}}>✹ overheat</span> to increase the max level, up to <span style={{color:"#ccddee"}}>+{OH_COSTS.maxLvl}</span> beyond the default max. Each level costs more than the last. Overheated levels cost significantly more in wave currencies during a run.
</div>
<div style={{color:"#ff6622",fontSize:10,fontWeight:"bold",letterSpacing:1,marginTop:8,marginBottom:4}}>AVAILABLE UPGRADES</div>
<div style={{color:"#667788",fontSize:8,marginBottom:4}}>Each upgrade must be individually unlocked before overheating. Costs shown are per-upgrade.</div>
{SHOP.filter(u=>u.id!=="rear"&&u.id!=="shield").map(up=>{const _ohLvl=meta.overheatUpgrades?.[up.id]||0;const _ohUn=!!meta.overheatItemUnlocked?.[up.id];return(
<div key={up.id} style={{padding:"5px 0",borderBottom:"1px solid #1a1a2e"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<span style={{color:CC[up.cat],fontSize:10,fontWeight:"bold"}}>{up.name}</span>
<span style={{color:_ohUn?"#ff6622":"#556677",fontSize:9}}>{_ohUn?`+${_ohLvl}/${OH_COSTS.maxLvl}`:"Locked"}</span>
</div>
<div style={{color:"#556677",fontSize:8,marginTop:2}}>Default max: {up.max} · Unlock: <span style={{color:CUR.echoes.color}}>⬢ {OH_COSTS.itemEc(up.id).toLocaleString()}</span> + <span style={{color:"#ff6622"}}>✹ {OH_COSTS.itemOhCost(up.id).toLocaleString()}</span> · First level: <span style={{color:"#ff6622"}}>✹ {OH_COSTS.lvlCost(up.id,0).toLocaleString()}</span></div>
</div>);})}
</CodexSec>
<CodexSec id="cargo" title={"CARGO & PATH UPGRADES"} color="#cc9955">
<div style={{color:"#8899aa",fontSize:11,lineHeight:1.6,marginBottom:6}}>Cargo is an endless escort side mode. Instead of clearing waves you protect a multi-segment train that rolls continuously through the void, scored on the <span style={{color:"#ccddee"}}>distance</span> it survives.</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:4}}><b style={{color:"#cc9955"}}>The train:</b> A chain of segments follows the track. Enemies attack the segments, not only you — lose every segment and the run ends. Base speed is <span style={{color:"#ccddee"}}>5 m/s</span> and creeps up the further you travel.</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:4}}><b style={{color:"#cc9955"}}>Packages (▣):</b> Every <span style={{color:"#ccddee"}}>500m</span> the train crosses a checkpoint and banks packages. The payout is the number of <span style={{color:"#ccddee"}}>surviving segments</span> times a checkpoint multiplier that grows +0.5 each crossing (×1, ×1.5, ×2, ...). Keeping the train intact is worth far more than scraping by.</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7,marginBottom:4}}><b style={{color:"#cc9955"}}>Banking &amp; rules:</b> Packages are kept whether the train is destroyed or you forfeit from pause, so you can cash out any time. Best distance is tracked between runs. Cargo grants no Echoes and never advances labs.</div>
<div style={{color:"#667788",fontSize:9,lineHeight:1.7}}><b style={{color:"#cc9955"}}>Paths:</b> Packages are spent in the Paths tree from the main menu. The root <span style={{color:"#ccddee"}}>Train Core</span> costs ▣ 20 and multiplies train speed by 2.5x; it must be bought before any branch opens. More path nodes are planned — only the Core is live for now.</div>
</CodexSec>

 </div>
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
 <div style={{width:"100%",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace",position:"relative",background:"#06060e"}}>
 <div style={{position:"absolute",inset:0,zIndex:0}} ref={(el)=>{if(el){const bgId=meta.bgDesign||"void";const bg=BG_DESIGNS.find(b=>b.id===bgId)||BG_DESIGNS[0];el.style.cssText=`position:absolute;inset:0;z-index:0;${bg.css}`;el.className=bg.id==="galaxy"?"vs-galaxy":"";}}} /> <style>{`
@font-face{font-family:'DejaVu Sans Mono';font-style:normal;font-weight:400;src:local('DejaVu Sans Mono'),local('DejaVuSansMono'),local('DejaVu Sans Mono Book'),url('https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSansMono.ttf') format('truetype');font-display:swap;}@font-face{font-family:'DejaVu Sans Mono';font-style:normal;font-weight:700;src:local('DejaVu Sans Mono Bold'),local('DejaVuSansMono-Bold'),local('DejaVu Sans Mono'),url('https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSansMono-Bold.ttf') format('truetype');font-display:swap;}
 .vs-scroll::-webkit-scrollbar{width:5px;}
 .vs-scroll::-webkit-scrollbar-track{background:#0a0a14;}
 .vs-scroll::-webkit-scrollbar-thumb{background:#1a1a3a;border-radius:4px;}
 .vs-scroll::-webkit-scrollbar-thumb:hover{background:#2a2a5a;}
 .vs-scroll{scrollbar-width:thin;scrollbar-color:#1a1a3a #0a0a14;}
 input,textarea{user-select:text;-webkit-user-select:text;cursor:text;}
 @keyframes goldShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
 @keyframes auroraShift{0%{filter:hue-rotate(0deg) brightness(1)}50%{filter:hue-rotate(20deg) brightness(1.15)}100%{filter:hue-rotate(-15deg) brightness(0.9)}}
 @keyframes starDrift{0%{background-position:0% 0%}100%{background-position:100% 100%}}
 @keyframes nebulaPulse{0%{filter:brightness(0.9) hue-rotate(0deg)}100%{filter:brightness(1.2) hue-rotate(10deg)}}
 @keyframes gridScroll{0%{background-position:0 0}100%{background-position:40px 40px}}
 @keyframes hexDrift{0%{background-position:0 0}100%{background-position:56px 98px}}
 @keyframes deepPulse{0%{filter:brightness(0.85)}50%{filter:brightness(1.15) saturate(1.2)}100%{filter:brightness(0.85)}}
 @keyframes circuitPulse{0%{filter:brightness(0.9)}100%{filter:brightness(1.3)}}
 @keyframes emberGlow{0%{filter:brightness(0.8) saturate(0.8)}100%{filter:brightness(1.3) saturate(1.4)}}
        @keyframes solarPulse{0%{filter:brightness(0.82) saturate(1)}50%{filter:brightness(1.18) saturate(1.35)}100%{filter:brightness(0.95) saturate(1.15)}}
        @keyframes frostShimmer{0%{filter:brightness(0.9) hue-rotate(-8deg)}100%{filter:brightness(1.18) hue-rotate(10deg)}}
        @keyframes venomPulse{0%{filter:brightness(0.78) saturate(1.1) hue-rotate(0deg)}100%{filter:brightness(1.2) saturate(1.5) hue-rotate(-14deg)}}
        @keyframes galaxyDrift{0%{transform:rotate(0deg) scale(2)}100%{transform:rotate(360deg) scale(2)}}
        @keyframes galaxyDrift2{0%{transform:rotate(0deg) scale(1.45)}100%{transform:rotate(-360deg) scale(1.45)}}
        @keyframes galaxyDriftMini{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        .vs-galaxy{position:relative;overflow:hidden;}
        .vs-galaxy::before{content:"";position:absolute;inset:0;background-image:radial-gradient(2px 2px at 18% 28%,#ffffffcc,transparent),radial-gradient(1.5px 1.5px at 72% 62%,#ffccffaa,transparent),radial-gradient(2px 2px at 86% 24%,#ffffffaa,transparent),radial-gradient(1.5px 1.5px at 38% 82%,#ddaaffaa,transparent),radial-gradient(1.5px 1.5px at 60% 12%,#ffffff99,transparent),radial-gradient(2px 2px at 12% 66%,#eebbff99,transparent),radial-gradient(1.5px 1.5px at 28% 50%,#ffffffaa,transparent),radial-gradient(1px 1px at 50% 40%,#ffffff99,transparent),radial-gradient(2px 2px at 64% 78%,#ddbbffaa,transparent),radial-gradient(1.5px 1.5px at 80% 70%,#ffffff99,transparent),radial-gradient(1px 1px at 44% 22%,#eeccffaa,transparent),radial-gradient(1.5px 1.5px at 32% 70%,#ffffff88,transparent),radial-gradient(1px 1px at 56% 88%,#ffffffaa,transparent),radial-gradient(2px 2px at 22% 14%,#ffddffaa,transparent),radial-gradient(1px 1px at 90% 52%,#ffffff88,transparent),radial-gradient(1.5px 1.5px at 8% 38%,#ddbbff99,transparent),radial-gradient(1px 1px at 48% 64%,#ffffff77,transparent),radial-gradient(1.5px 1.5px at 68% 34%,#ffeeffaa,transparent),radial-gradient(1px 1px at 76% 86%,#ffffff88,transparent),radial-gradient(2px 2px at 40% 92%,#eeccffaa,transparent);background-size:100% 100%;background-position:center;opacity:0.6;animation:galaxyDrift 135s linear infinite;pointer-events:none;}
        .vs-galaxy::after{content:"";position:absolute;inset:0;background-image:radial-gradient(1px 1px at 24% 36%,#ffffff66,transparent),radial-gradient(1px 1px at 70% 58%,#ddbbff55,transparent),radial-gradient(1.5px 1.5px at 52% 22%,#ffffff55,transparent),radial-gradient(1px 1px at 84% 78%,#eeccff44,transparent),radial-gradient(1px 1px at 16% 70%,#ffffff44,transparent),radial-gradient(1px 1px at 62% 88%,#ddaaff44,transparent),radial-gradient(1.5px 1.5px at 38% 54%,#ffffff44,transparent),radial-gradient(1px 1px at 90% 30%,#ffffff33,transparent),radial-gradient(1px 1px at 8% 44%,#ccbbff33,transparent),radial-gradient(1px 1px at 46% 76%,#ffffff33,transparent);background-size:100% 100%;background-position:center;opacity:0.4;animation:galaxyDrift2 195s linear infinite;pointer-events:none;}
        .vs-galaxy-mini{position:relative;overflow:hidden;}
        .vs-galaxy-mini::before{content:"";position:absolute;inset:0;background-image:radial-gradient(1px 1px at 18% 30%,#ffffffaa,transparent),radial-gradient(1px 1px at 72% 62%,#ddbbff99,transparent),radial-gradient(1px 1px at 86% 24%,#ffffff99,transparent),radial-gradient(1px 1px at 38% 78%,#ddaaff88,transparent),radial-gradient(1px 1px at 60% 14%,#ffffff88,transparent),radial-gradient(1px 1px at 12% 66%,#eebbff88,transparent),radial-gradient(1px 1px at 28% 48%,#ffffff88,transparent),radial-gradient(1px 1px at 64% 82%,#ddbbff88,transparent),radial-gradient(1px 1px at 80% 70%,#ffffff77,transparent),radial-gradient(1px 1px at 44% 24%,#eeccff88,transparent),radial-gradient(1px 1px at 50% 56%,#ffffff66,transparent),radial-gradient(1px 1px at 90% 50%,#ffffff66,transparent);background-size:100% 100%;background-position:center;opacity:0.85;animation:galaxyDriftMini 150s linear infinite;pointer-events:none;}
 @keyframes pulseExpand{0%{background-size:100% 100%}50%{background-size:200% 200%}100%{background-size:100% 100%}}
 @keyframes fadeSlideIn{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
 @keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
 @keyframes pulseGlow{0%,100%{text-shadow:0 0 30px #00e5ff88}50%{text-shadow:0 0 50px #00e5ffcc,0 0 80px #00e5ff44}}
 .vs-fade-in{animation:fadeSlideIn 0.25s ease-out both}
 .vs-fade{animation:fadeIn 0.2s ease-out both}
 .vs-title-glow{animation:pulseGlow 4s ease-in-out infinite}
 
        .vs-exit>canvas,.vs-enter>canvas{animation:none!important}
        @keyframes vsElemOut{to{opacity:0;transform:translateY(-10px) scale(0.97)}}
        @keyframes vsElemIn{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}
        .vs-exit>*{animation:vsElemOut 120ms ease-in forwards}
        .vs-exit>*:nth-child(1){animation-delay:0ms}.vs-exit>*:nth-child(2){animation-delay:20ms}
        .vs-exit>*:nth-child(3){animation-delay:35ms}.vs-exit>*:nth-child(4){animation-delay:50ms}
        .vs-exit>*:nth-child(5){animation-delay:60ms}.vs-exit>*:nth-child(6){animation-delay:70ms}
        .vs-exit>*:nth-child(7){animation-delay:80ms}.vs-exit>*:nth-child(n+8){animation-delay:90ms}
        .vs-enter>*{animation:vsElemIn 160ms ease-out both}
        .vs-enter>*:nth-child(1){animation-delay:20ms}.vs-enter>*:nth-child(2){animation-delay:50ms}
        .vs-enter>*:nth-child(3){animation-delay:75ms}.vs-enter>*:nth-child(4){animation-delay:95ms}
        .vs-enter>*:nth-child(5){animation-delay:110ms}.vs-enter>*:nth-child(6){animation-delay:125ms}
        .vs-enter>*:nth-child(7){animation-delay:135ms}.vs-enter>*:nth-child(n+8){animation-delay:145ms}
        @keyframes popupBgEnter{from{opacity:0}to{opacity:1}}
        @keyframes popupBgExit{from{opacity:1}to{opacity:0}}
        @keyframes popupEnter{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:none}}
        @keyframes popupExit{from{opacity:1;transform:none}to{opacity:0;transform:scale(0.95)}}
        @keyframes tabSlideLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}
        @keyframes tabSlideRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}
        @keyframes dealerDeal{from{opacity:0;transform:translateY(-70px) scale(0.45) rotate(-12deg)}55%{opacity:1}to{opacity:1;transform:none}}
        @keyframes dealerFlip{0%{opacity:0;transform:translateY(-55px) scale(0.72) rotateY(180deg)}45%{opacity:1;transform:translateY(-14px) scale(1) rotateY(180deg)}100%{opacity:1;transform:translateY(0) scale(1) rotateY(0deg)}}
        @keyframes dealerFaceFront{0%,49.9%{opacity:0}50%,100%{opacity:1}}
        @keyframes dealerFaceBack{0%,49.9%{opacity:1}50%,100%{opacity:0}}
        @keyframes cardFlyUp{0%{opacity:1;transform:translateY(0) scale(1)}25%{opacity:1;transform:translateY(-12px) scale(1.07)}100%{opacity:0;transform:translateY(-240px) scale(0.62)}}
        @keyframes cardBurn{0%{opacity:1;transform:scale(1) rotate(0);filter:brightness(1);box-shadow:0 0 0 rgba(255,120,30,0)}25%{opacity:1;transform:scale(0.98) translateY(-3px) rotate(-2deg);filter:brightness(1.5) sepia(0.7) hue-rotate(-18deg) saturate(1.6);box-shadow:0 6px 22px rgba(255,120,30,0.55)}60%{opacity:0.8;transform:scale(0.86) translateY(-14px) rotate(-5deg);filter:brightness(0.9) sepia(1) hue-rotate(-25deg) saturate(2);box-shadow:0 4px 16px rgba(255,80,20,0.4)}100%{opacity:0;transform:scale(0.5) translateY(-40px) rotate(-11deg);filter:brightness(0.2) sepia(1) blur(4px);box-shadow:0 0 0 rgba(0,0,0,0)}}
        @keyframes menuFadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.96)}}
        @keyframes shipLaunch{from{transform:scale(1) translateY(0)}to{transform:scale(var(--vs-ss,0.22)) translateY(var(--vs-sy,440px))}}
        @keyframes transInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes transOutRight{from{transform:translateX(0)}to{transform:translateX(100%)}}
        .gold-shimmer{position:absolute;inset:0;border-radius:3px;background:linear-gradient(105deg,transparent 30%,rgba(255,204,68,0.06) 45%,rgba(255,204,68,0.12) 50%,rgba(255,204,68,0.06) 55%,transparent 70%);background-size:200% 100%;animation:goldShimmer 4s ease-in-out infinite;pointer-events:none;z-index:0;}
        .platinum-shimmer{position:absolute;inset:0;border-radius:3px;background:linear-gradient(105deg,transparent 30%,rgba(180,210,255,0.06) 45%,rgba(180,210,255,0.14) 50%,rgba(180,210,255,0.06) 55%,transparent 70%);background-size:200% 100%;animation:goldShimmer 4s ease-in-out infinite;pointer-events:none;z-index:0;}
 `}</style> <div style={{position:"relative",width:GW,height:GH,transform:`scale(${sc2})`,transformOrigin:"center center",userSelect:"none",WebkitUserSelect:"none",outline:meta.showBorder!==false?"1px solid #2a2a3a":"none",border:"none",zIndex:1,overflow:"hidden",background:"#06060e"}}>
 <canvas ref={canvasRef} width={GW*(meta.resScale||2)} height={GH*(meta.resScale||2)} style={{width:"100%",height:"100%",display:"block"}} />
 {phase==="replay"&&(()=>{const _done=gsRef.current&&gsRef.current._replayIdx>=gsRef.current._replayFrames.length;
 if(_replayUiMin)return(
 <div style={{position:"absolute",bottom:10,right:10,zIndex:25}}>
 <button onClick={()=>_setReplayUiMin(false)} title="Show replay controls" style={{width:30,height:30,borderRadius:"50%",background:"rgba(10,10,24,0.82)",border:"1px solid #ffaa4488",color:"#ffcc44",cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>▶</button>
 </div>);
 return(
 <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",zIndex:25,width:"min(440px,calc(100% - 24px))"}}>
 <div style={{background:"rgba(8,8,20,0.86)",border:"1px solid #ffaa4455",borderRadius:8,padding:"8px 10px",backdropFilter:"blur(2px)"}}>
 <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
 <div style={{color:"#ffcc44",fontSize:10,letterSpacing:1.5,fontWeight:"bold",flexShrink:0}}>▶ REPLAY · W{_currentReplayRef.current?.wave??(gsRef.current?.wave||"?")}</div>
 <div style={{flex:1,height:5,background:"rgba(20,20,42,0.9)",borderRadius:3,overflow:"hidden"}}>
 <div style={{height:"100%",width:`${Math.round(_replayProgress*100)}%`,background:"linear-gradient(90deg,#ffcc44,#ff6644)",transition:"width 80ms linear"}} />
 </div>
 <div style={{color:"#998866",fontSize:8,flexShrink:0,minWidth:30,textAlign:"right"}}>{Math.round(_replayProgress*100)}%</div>
 </div>
 <div style={{display:"flex",gap:6,justifyContent:"center"}}>
 <button onClick={()=>{if(_done){_startReplay(_currentReplayRef.current);}else{_setReplayPaused(p=>!p);}}} style={{flex:1,background:"#1a1530",border:"1px solid #ffaa4466",color:"#ffcc88",padding:"6px 0",borderRadius:5,cursor:"pointer",fontFamily:"inherit",fontSize:11}}>{_done?"↻ REPLAY AGAIN":(_replayPaused?"▶ PLAY":"⏸ PAUSE")}</button>
 <button onClick={()=>_setReplayUiMin(true)} title="Minimise" style={{width:40,background:"#12121f",border:"1px solid #44556666",color:"#aabbcc",padding:"6px 0",borderRadius:5,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>—</button>
 <button onClick={()=>_exitReplay()} style={{width:60,background:"#1a0e12",border:"1px solid #cc556666",color:"#ee8899",padding:"6px 0",borderRadius:5,cursor:"pointer",fontFamily:"inherit",fontSize:10}}>EXIT</button>
 </div>
 </div>
 </div>);})()}
 {phase!=="playing"&&phase!=="replay"&&<div style={{position:"absolute",inset:0,background:"#06060e",zIndex:5,pointerEvents:"none"}}><div style={{position:"absolute",inset:0,opacity:phase==="menu"&&(!_transTo||_transTo==="menu")?0:1,transition:"opacity 220ms ease"}}><SubMenuBG/></div></div>}
 {showWiki&&<div style={{position:"absolute",inset:0,zIndex:15,opacity:_wikiClosing?0:1,transition:"opacity 200ms ease"}}>{Wiki()}</div>}
 {}
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
 <span style={{color:"#667788",fontSize:9}}>Second row, on the left — costs 8 ⬡ scrap.</span>
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
 {tutStep===10&&phase==="metashop"&&metaTab==="ship"&&(meta.levels?.m_dmg||0)>0&&<TutPopup title="ABILITY UPGRADES" btnText="SHOW ME" onBtn={()=>{setTutStep(11);(()=>{_setMetaTabFrom(metaTab);setMetaTab("abilities");})();}}>
 Nice! That damage boost applies to every future run.<br/><br/>
 There's another type of permanent upgrade too — let's check it out.
 </TutPopup>}
 {tutStep===11&&phase==="metashop"&&metaTab==="abilities"&&<TutPopup title="ABILITY SHARDS" btnText="ONE MORE THING" onBtn={()=>{setTutStep(12);goTo("settings");}}>
 Each ability has <b style={{color:"#44ddcc"}}>sub-upgrades</b> and a <b style={{color:"#ffcc44"}}>mastery</b>.<br/>
 You buy <b style={{color:"#44ddcc"}}>◈ Ability Shards</b> with Echoes, then spend shards to unlock upgrades.<br/><br/>
 These are permanent — once bought, they apply to every run where you pick that ability.<br/><br/>
 You'll need more Echoes before you can afford one. Keep pushing deeper!
 </TutPopup>}
 {tutStep===12&&phase==="settings"&&<TutPopup title="CLOUD SYNC" btnText="FINISH TUTORIAL" onBtn={()=>setTutStep(0)}>
 One last thing — you can <b style={{color:"#44ccaa"}}>sync your progress</b> across devices!<br/><br/>
 In <b style={{color:"#ccddee"}}>Settings → Cloud Sync</b>, enter any <b style={{color:"#44ccaa"}}>4 to 6 digit code</b> to create your save file.<br/><br/>
 Use the same code on another device to pick up where you left off — your data saves automatically every 2 minutes and on every death.<br/><br/>You can <b style={{color:"#44ccaa"}}>lock</b> your account so the code alone can't overwrite your save from another device, and you'll be warned if a different device signs in with your code.<br/><br/>Set a <b style={{color:"#ccddee"}}>username</b> to appear on the global leaderboard, ranked by total Echoes earned.<br/><br/>
 <b style={{color:"#ccddee"}}>Good luck out there, pilot.</b>
 </TutPopup>}
 {paused&&phase==="playing"&&!showWiki&&(
 <div className="vs-scroll vs-fade" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(6,6,14,0.88)",zIndex:15,overflow:"auto",padding:"20px 0"}}>
 <h2 style={{color:"#ccddee",fontSize:20,letterSpacing:4,margin:0}}>PAUSED</h2>
 {(()=>{const _mr=metaRef.current;const _t=_mr.metaTier||1;const _gsSide=gsRef.current;if(_t<2||(_gsSide&&(_gsSide.isPlayground||_gsSide.isNewMode||_gsSide.isPractise||_gsSide.isCargo||_gsSide.isTutorial)))return null;const _phW=_mr.phantomHighWave||0;const _prW=_mr.practiseHighWave||0;const _phL=(_mr.lab?.completed?.phantom_enhance||0)*0.001;const _prL=(_mr.lab?.completed?.practise_enhance||0)*0.001;const _tv=_t===3?2.5:_t===2?1.5:1;const _enf2=_t>=2?1+(_mr.enforcerKills||0)*0.025:1;const _des3=_t>=2?1+((_mr.ownedDesigns||[]).length)*0.004:1;const _em=_tv*(_t>=2?(1+_phW*(0.01+_phL)):1)*(_t>=2?(1+_prW*(0.006+_prL)):1)*_enf2*_des3*((gsRef.current?._diffuseMult||1)+((metaRef.current.pathsUpg?.pr_diff&&(metaRef.current.practiseHighWave||0)>0&&(metaRef.current.practiseHighWave||0)%5===0)?0.045:0));return(
 <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6}}>
 <span style={{color:"#ffcc44",fontSize:10,fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>Echo ×{_em.toFixed(3)}</span>
 <div onClick={()=>setHeInfoId(heInfoId==="pause_echo"?null:"pause_echo")} style={{width:13,height:13,borderRadius:"50%",border:"1px solid #ffcc4466",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#ffcc4488",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#ffcc44"} onMouseOut={e=>e.currentTarget.style.color="#ffcc4488"}>?</div>
 </div>);})()}
 {(heInfoId==="pause_echo"||(heInfoId&&heInfoId.startsWith("ph_")))&&(()=>{const _mr2=metaRef.current;const _t2=_mr2.metaTier||1;const _phW2=_mr2.phantomHighWave||0;const _prW2=_mr2.practiseHighWave||0;const _phL2=(_mr2.lab?.completed?.phantom_enhance||0)*0.001;const _prL2=(_mr2.lab?.completed?.practise_enhance||0)*0.001;const _phV2=1+_phW2*(0.01+_phL2);const _prV2=1+_prW2*(0.006+_prL2);const _pMults=[{name:"Tier Bonus",color:"#bb99ff",val:_t2===3?2.5:_t2===2?1.5:1,desc:""},{name:"Phantom",color:"#cc66cc",val:_t2>=2?_phV2:1,desc:"+" + (0.01+_phL2).toFixed(3) + " per phantom max wave."},{name:"Practise",color:"#cc9966",val:_t2>=2?_prV2:1,desc:"+" + (0.006+_prL2).toFixed(3) + " per practise max wave."},{name:"Enforcer",color:"#ff5577",val:_t2>=2?1+(_mr2.enforcerKills||0)*0.025:1,desc:"+0.025 per enforcer defeated."},{name:"Designer",color:"#cc7744",val:_t2>=2?1+((_mr2.ownedDesigns||[]).length)*0.004:1,desc:"+0.004 per custom design owned."},{name:"Diffusion",color:"#44ddcc",val:(gsRef.current?._diffuseMult||1)+((metaRef.current.pathsUpg?.pr_diff&&(metaRef.current.practiseHighWave||0)>0&&(metaRef.current.practiseHighWave||0)%5===0)?0.045:0),desc:"Per-run bonus from diffusing ability slots."+((metaRef.current.pathsUpg?.pr_diff&&(metaRef.current.practiseHighWave||0)>0&&(metaRef.current.practiseHighWave||0)%5===0)?" Includes a permanent +0.045 because your best practise wave is a boss wave.":"")}];const _pTot=_pMults.reduce((a,m)=>a*m.val,1);return(
 <div onClick={()=>setHeInfoId(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #ffcc4433",borderRadius:6,padding:"16px 14px",maxWidth:340,width:"100%"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
 <div style={{color:"#ffcc44",fontSize:15,fontWeight:"bold",letterSpacing:2}}>HYPERECHO</div>
 <button onClick={()=>setHeInfoId(null)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <div style={{display:"flex",flexDirection:"column",gap:4}}>
 {_pMults.map(m=><div key={m.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0"}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{color:m.color,fontSize:12,fontWeight:"bold"}}>{m.name}</span>{m.desc&&<div onClick={(e)=>{e.stopPropagation();setHeInfoId(heInfoId==="ph_"+m.name?null:"ph_"+m.name);}} style={{width:11,height:11,borderRadius:"50%",border:"1px solid "+m.color+"44",display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:6,color:m.color+"88",flexShrink:0}}>?</div>}</div><div style={{color:"#ccddee",fontSize:16,fontWeight:"bold",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>×{m.val.toFixed(3)}</div></div>)}
 </div>
 {(()=>{const _hd=_pMults.find(m=>heInfoId==="ph_"+m.name);if(!_hd||!_hd.desc)return null;return <div style={{background:"#0a0e14",border:"1px solid "+_hd.color+"33",borderRadius:4,padding:"6px 10px",marginTop:4}}><span style={{color:_hd.color,fontSize:9}}>{_hd.desc}</span></div>;})()}
 <div style={{borderTop:"1px solid #44556644",marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:"#ffcc44",fontSize:13,fontWeight:"bold"}}>TOTAL</div><div style={{color:"#ffcc44",fontSize:22,fontWeight:"bold",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>×{_pTot.toFixed(3)}</div></div>
 </div>
 </div>);})()}
 {(()=>{const gs=gsRef.current;if(!gs)return null;const p=gs.player;const rawHp=Math.round(BASE_HP*hpScale(gs.wave));const rawDmg=Math.round((7+gs.wave*1.8)*dmgScale(gs.wave)*0.35);return(
 <div style={{color:"#8899aa",fontSize:10,marginTop:10,textAlign:"center",lineHeight:1.8}}>
 {gs.isCargo?<>{gs.kills} killed · {gs.enemies.length} alive</>:<><span style={{color:"#99aabb"}}>WAVE {gs.wave}</span> · {gs.waveKilled}/{gs.waveTotal} killed · {gs.enemies.length} alive</>}<br/>
 Enemy base HP: {rawHp} · Base dmg: {rawDmg}<br/>
 {!gs.isPlayground&&!gs.isNewMode&&!gs.isPractise&&!gs.isCargo&&!gs.isTutorial&&<><span style={{color:CUR.scrap.color}}>⬡{gs.scrap}</span> · <span style={{color:CUR.cores.color}}>◆{gs.cores}</span> · <span style={{color:CUR.plasma.color}}>✦{gs.plasma}</span></>}
 </div>
 );})()}
 <div style={{marginTop:14}}><ShipDisplay onClick={()=>setShowShipStats(true)} size={50} /></div>
 {showShipStats&&(()=>{const _live=!!(gsRef.current&&gsRef.current.player&&phase!=="menu"&&phase!=="leaderboard"&&phase!=="settings"&&phase!=="metashop");return(<div onClick={()=>closePopup(setShowShipStats)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:32,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"1px solid #00e5ff33",borderRadius:6,padding:"14px 16px",maxWidth:340,width:"100%",maxHeight:"80vh",overflow:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{color:"#00e5ff",fontSize:13,fontWeight:"bold",letterSpacing:1}}>SHIP STATS</div><button onClick={()=>closePopup(setShowShipStats)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button></div><ShipStats metaData={meta} gsData={_live?gsRef.current:null} homeMode={!_live} /></div></div>);})()}
 
 
 <div style={{display:"flex",gap:10,marginTop:16,flexDirection:"column",alignItems:"center"}}>
 <button onClick={()=>setPaused(false)} style={{...bs2("#44ff88"),padding:"10px 40px",fontSize:14}} {...hv("#44ff88")}>CONTINUE</button>
 <div style={{display:"flex",gap:8,marginTop:2}}>
 <button onClick={()=>{setShowWiki(true);setCodexOpen({controls:false,mechanics:false,currencies:false,enemies:false,abilities:false,scrap:false,cores:false,plasma:false,meta:false,metaab:false,designs:false,labs:false,overheat:false})}} style={{...bs2("#55667744"),padding:"8px 16px",fontSize:11,borderWidth:1,color:"#8899aa"}}>CODEX</button>
 <button onClick={()=>setShowPauseLabs(true)} style={{...bs2("#55667744"),padding:"8px 16px",fontSize:11,borderWidth:1,color:"#8899aa"}}>LABS</button>
 <button onClick={()=>setShowPauseCards(true)} style={{...bs2("#55667744"),padding:"8px 16px",fontSize:11,borderWidth:1,color:"#8899aa"}}>CARDS</button>
 <button onClick={()=>{_returnToPauseRef.current=true;goToFast("settings");}} style={{...bs2("#55667744"),padding:"8px 16px",fontSize:11,borderWidth:1,color:"#8899aa"}}>SETTINGS</button>
 </div>
 </div>
 {(gsRef.current?.isPlayground||gsRef.current?.isNewMode||gsRef.current?.isCargo)?<button onClick={forfeit} style={{background:"none",border:"none",color:"#554444",fontSize:9,cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",marginTop:8}}>EXIT TO MENU</button>
 :gsRef.current?.isTutorial&&tutStep!==7?null
 :<>{!confirmForfeit?<button onClick={()=>setConfirmForfeit(true)} style={{background:"none",border:"none",color:"#554444",fontSize:9,cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",marginTop:8}}>FORFEIT RUN</button>
 :<div style={{textAlign:"center",marginTop:8}}><div style={{color:"#cc5555",fontSize:9,marginBottom:4}}>End this run? You'll receive <span style={{color:CUR.echoes.color}}>⬢ {calcEchoes(gsRef.current)}</span> echoes.</div>
 <div style={{display:"flex",gap:8,justifyContent:"center"}}><button onClick={forfeit} style={{...bs2("#ff3344"),padding:"5px 14px",fontSize:10,borderWidth:1}} {...hv("#ff3344")}>FORFEIT</button><button onClick={()=>setConfirmForfeit(false)} style={{...bs2("#55667744"),padding:"5px 14px",fontSize:10,borderWidth:1,color:"#8899aa"}}>CANCEL</button></div></div>}</>}
 <div style={{color:"#556677",fontSize:9,marginTop:10}}>P / Esc to resume</div>
{showPauseCards&&(
 <div onClick={()=>closePopup(setShowPauseCards)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #9955dd33",borderRadius:6,padding:"16px 14px",maxWidth:380,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
 <div style={{color:"#bb77ff",fontSize:15,fontWeight:"bold",letterSpacing:2}}>CARDS</div>
 <button onClick={()=>closePopup(setShowPauseCards)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <div style={{color:"#667788",fontSize:8,textAlign:"center",marginBottom:10}}>View only — Dealer cards affecting this run.</div>
 {(()=>{const cards=gsRef.current?._dealerCards||[];const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
 if(!cards.length)return <div style={{color:"#556677",fontSize:10,textAlign:"center",padding:"16px 0"}}>No Dealer cards active this run.</div>;
 return <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>{cards.map((c,ci)=>(
 <div key={ci} style={{width:128,background:"#160a30",border:"1px solid #6633aa55",borderRadius:6,padding:6}}>
 <canvas width={384} height={534} style={{width:"100%",height:"auto",borderRadius:4,display:"block"}} ref={el=>{if(el){const cx=el.getContext("2d");if(cx)drawDealerCard(cx,c,el.width,el.height);}}} />
 <div style={{color:"#7dffc0",fontSize:8,lineHeight:1.3,marginTop:5}}>− {cap(c.nerf.enemy)}: {c.nerf.label}</div>
 <div style={{color:"#ff9a8a",fontSize:8,lineHeight:1.3,marginTop:2}}>+ {cap(c.buff.enemy)}: {c.buff.label}</div>
 </div>))}</div>;})()}
 </div>
 </div>
 )}
 {showPauseLabs&&(
 <div onClick={()=>closePopup(setShowPauseLabs)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #ff884433",borderRadius:6,padding:"16px 14px",maxWidth:380,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
 <div style={{color:"#ff9966",fontSize:15,fontWeight:"bold",letterSpacing:2}}>LABS</div>
 <button onClick={()=>closePopup(setShowPauseLabs)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <div style={{color:"#667788",fontSize:8,textAlign:"center",marginBottom:10}}>View only — labs cannot be changed during a run.</div>
 {(()=>{const lab=meta.lab||{slots:0,active:[],completed:{}};const slotsUnlocked=lab.slots||0;const activeResearch=lab.active||[];const completedLevels=lab.completed||{};
 return [0,1,2].map(slotIdx=>{
 const unlocked=slotsUnlocked>slotIdx;
 const research=activeResearch[slotIdx];
 const lu=research?LAB_UPGRADES.find(l=>l.id===research.id):null;
 const curLvl=research?(completedLevels[research.id]||0):0;
 const pct=research?Math.min(100,(research.wavesProgress/research.wavesNeeded)*100):0;
 return <div key={slotIdx} style={{borderRadius:5,overflow:"hidden",marginBottom:6,border:`1px solid ${unlocked?"#ff884422":"#1a1a2e"}`}}>
 <div style={{padding:"3px 10px",background:unlocked?"#0e1420":"#08080f"}}>
 <span style={{color:unlocked?"#ff9966":"#445566",fontSize:8,fontWeight:"bold",letterSpacing:1}}>Lab {slotIdx+1}</span>
 </div>
 {!unlocked?<div style={{padding:"14px",background:"#0a0a14",textAlign:"center"}}><div style={{color:"#445566",fontSize:10}}>Locked</div></div>
 :!research?<div style={{padding:"14px",background:"#0a0a14",textAlign:"center"}}><div style={{color:"#556677",fontSize:10}}>Lab Offline</div></div>
 :<div style={{padding:"14px",background:"#0a0a14"}}>
 <div style={{color:"#ccddee",fontSize:11,fontWeight:"bold"}}>{lu?.name||"?"} <span style={{color:"#667788",fontSize:8}}>Lv.{curLvl} → Lv.{curLvl+1}</span></div>
 <div style={{color:"#8899aa",fontSize:8,marginTop:3}}>{lu?.desc||""}</div>
 <div style={{height:8,background:"#14142a",borderRadius:4,marginTop:8}}><div style={{height:8,background:"linear-gradient(90deg, #ff8844, #ffaa66)",borderRadius:4,width:pct+"%",transition:"width 0.3s"}} /></div>
 <div style={{color:"#778899",fontSize:8,marginTop:4}}>{research.wavesProgress}/{research.wavesNeeded} waves</div>
 </div>}
 </div>;
 });
 })()}
 </div>
 </div>
 )}
 </div>
 )}
 {phase==="menu"&&(
 <div className={"vs-scroll "+(_launching?"":_phaseClass("menu"))} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#06060e",zIndex:10,overflow:"auto",padding:"20px 0",animation:_launching?"menuFadeOut 400ms ease-out forwards":"none"}}>
 <MenuBG/>
 <h1 className="vs-title-glow" style={{color:"#00e5ff",fontSize:40,fontWeight:"bold",letterSpacing:6,margin:0,zIndex:1,position:"relative"}}>VOID STORM</h1>
 <p style={{color:"#8899bb",fontSize:11,marginTop:8,letterSpacing:2,zIndex:1,position:"relative"}}>BULLET HELL ROGUELITE</p>
 <div ref={_menuShipRef} style={{marginTop:14,zIndex:_launching?20:1,position:"relative",animation:_launching?"shipLaunch 400ms cubic-bezier(0.5,0,0.5,1) forwards":"none"}}><ShipDisplay onClick={_launching?undefined:()=>setShowShipStats(true)} size={56} /></div>
 
 
 {meta.echoes>0&&<p style={{color:CUR.echoes.color,fontSize:13,marginTop:8,zIndex:1,position:"relative"}}>⬢ {meta.echoes} Echoes</p>}
 {meta.highWave>0&&<p style={{color:"#667788",fontSize:10,marginTop:meta.echoes>0?2:8,zIndex:1,position:"relative"}}>Best: <span style={{color:"#ccddee"}}>Wave {meta.highWave}</span></p>}
 {meta.highWave>0&&(()=>{const _isUnlocked=(meta.lab?.completed?.intro_sprint||0)>0;const _isOn=_isUnlocked&&!meta.introSprintOff;return(
 <div style={{marginTop:4,zIndex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:_isUnlocked?1:0.35}}>
 <div onClick={_isUnlocked?()=>setMeta(prev=>{const nx={...prev,introSprintOff:!prev.introSprintOff};saveMeta(nx);return nx;}):undefined} style={{width:26,height:13,borderRadius:7,background:_isOn?"#44ccaa22":"#1a1a2e",border:"1px solid "+(_isOn?"#44ccaa66":"#33445566"),position:"relative",transition:"all 0.2s",flexShrink:0,cursor:_isUnlocked?"pointer":"default"}}>
 <div style={{width:9,height:9,borderRadius:5,background:_isOn?"#44ccaa":"#556677",position:"absolute",top:1,left:_isOn?15:1,transition:"all 0.2s"}} />
 </div>
 <span style={{fontSize:8,color:_isUnlocked?(_isOn?"#88ccaa":"#778899"):"#556677",display:"inline-block",width:84,textAlign:"left",whiteSpace:"nowrap"}}>{!_isUnlocked?"🔒 ":""}Intro Sprint{_isUnlocked?(_isOn?" ON":" OFF"):""}</span>
 {_isUnlocked?<div onClick={()=>setSprintInfo(true)} style={{width:13,height:13,borderRadius:"50%",border:"1px solid #44667788",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#667788",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#88aacc"} onMouseOut={e=>e.currentTarget.style.color="#667788"}>i</div>:<div style={{width:13,flexShrink:0}} />}
 </div>);})()}
 {meta.highWave>0&&(()=>{const _adUnlocked=(meta.totalEchoesEarned||0)>=1500;const _adOn=_adUnlocked&&!!meta.autoDealerOn;return(
 <div style={{marginTop:4,zIndex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:_adUnlocked?1:0.35}}>
 <div onClick={_adUnlocked?()=>setMeta(prev=>{const nx={...prev,autoDealerOn:!prev.autoDealerOn};saveMeta(nx);return nx;}):undefined} style={{width:26,height:13,borderRadius:7,background:_adOn?"#bb77ff22":"#1a1a2e",border:"1px solid "+(_adOn?"#bb77ff66":"#33445566"),position:"relative",transition:"all 0.2s",flexShrink:0,cursor:_adUnlocked?"pointer":"default"}}>
 <div style={{width:9,height:9,borderRadius:5,background:_adOn?"#bb77ff":"#556677",position:"absolute",top:1,left:_adOn?15:1,transition:"all 0.2s"}} />
 </div>
 <span style={{fontSize:8,color:_adUnlocked?(_adOn?"#bb99ff":"#778899"):"#556677",display:"inline-block",width:84,textAlign:"left",whiteSpace:"nowrap"}}>{!_adUnlocked?"🔒 ":""}Auto Dealer{_adUnlocked?(_adOn?" ON":" OFF"):""}</span>
 {_adUnlocked?<div onClick={()=>setAutoDealerInfo(true)} style={{width:13,height:13,borderRadius:"50%",border:"1px solid #44667788",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#667788",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#bb99ff"} onMouseOut={e=>e.currentTarget.style.color="#667788"}>i</div>:<div style={{width:13,flexShrink:0}} />}
 </div>);})()}
 {(()=>{const _off=!_online&&!!syncCode;const _dot=syncCode?(_off?"#ffaa44":"#44ff88"):"#ff4455";const _txt=syncCode?(_off?"Synced, no connection":"Progress synced"):"Progress not synced";const _tc=syncCode?(_off?"#ddaa66":"#88ccaa"):"#cc6666";return <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4,zIndex:1,position:"relative"}}><div style={{width:8,height:8,borderRadius:"50%",background:_dot,flexShrink:0}} /><span style={{fontSize:8,color:_tc}}>{_txt}</span></div>;})()}
 {syncCode&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,zIndex:1,position:"relative"}}><div style={{width:8,height:8,borderRadius:"50%",background:"#556677",flexShrink:0}} /><span style={{fontSize:8,color:"#778899"}}>{meta.locked?"Account locked":"Account unlocked"}</span></div>}
 <button onClick={()=>{if(_launching)return;
if(metaRef.current.autoDealerOn&&((metaRef.current.totalEchoesEarned||0)>=1500)&&!_dealerAuto&&(metaRef.current._dealerActive||[]).length<(metaRef.current._dealerSlots||1)){if(!_dealerOffers)_genDealerOffers();_setDealerAuto(true);goTo("dealer");return;}
const _cv=canvasRef.current;if(_cv){const _cx=_cv.getContext("2d");_cx.fillStyle="#06060e";_cx.fillRect(0,0,GW,GH);}
const _ship=metaRef.current;
gsRef.current={player:{x:GW/2,y:GH-80,size:14,hp:100,maxHp:100,speed:3,alive:true,shields:0,goldenShields:0,invTimer:0,color:_ship.shipColor||"#00e5ff",bulletColor:_ship.bulletColor||"teal",damage:0,fireTimer:0,fireDelay:9999,pierce:1,magnetRange:80,pickupLife:0},stars:gsRef.current?.stars||Array.from({length:60},(_,i)=>({x:(i*97)%GW,y:(i*137)%GH,sp:0.3+i%4*0.3,color:"#aabbcc"})),enemies:[],bullets:[],eBullets:[],pickups:[],particles:[],gravWells:[],hitTexts:[],_slices:[],novaRings:[],time:0,flashTimer:0,screenShake:0,wave:0,waveActive:false,isTutorial:false,isPractise:false,isPlayground:false,_isEnforcer:false};
const _cont=_cv?.parentElement;
if(_menuShipRef.current&&_cont){
  const _sr=_menuShipRef.current.getBoundingClientRect();
  const _cr=_cont.getBoundingClientRect();
  const _sc=_cr.width/GW;
  const _shipCY=_sr.top-_cr.top+_sr.height/2;
  const _gameCY=(GH-80)*_sc;
  const _ty=_gameCY-_shipCY;
  const _ts=(_sc*28)/_sr.height;
  _cont.style.setProperty("--vs-sy",`${_ty}px`);
  _cont.style.setProperty("--vs-ss",`${_ts}`);
}
_setLaunching(true);setTimeout(()=>{_setLaunching(false);initGame();},800);}} style={{...bs2("#00e5ff"),marginTop:8,padding:"12px 40px",fontSize:16,zIndex:1,position:"relative",animation:_launching?"menuFadeOut 400ms ease-out forwards":"none"}} {...hv("#00e5ff")}>LAUNCH</button>
 {showShipStats&&(()=>{const _live=!!(gsRef.current&&gsRef.current.player&&phase!=="menu"&&phase!=="leaderboard"&&phase!=="settings"&&phase!=="metashop");return(
 <div onClick={()=>closePopup(setShowShipStats)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:32,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"1px solid #00e5ff33",borderRadius:6,padding:"14px 16px",maxWidth:340,width:"100%",maxHeight:"80vh",overflow:"auto",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
 <div style={{color:"#00e5ff",fontSize:13,fontWeight:"bold",letterSpacing:1}}>SHIP STATS</div>
 <button onClick={()=>closePopup(setShowShipStats)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <ShipStats metaData={meta} gsData={_live?gsRef.current:null} homeMode={!_live} />
 </div>
 </div>);})()}
 {autoDealerInfo&&(
 <div onClick={()=>closePopup(setAutoDealerInfo)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0c0c1a",border:"1px solid #bb77ff44",borderRadius:6,padding:"14px 16px",maxWidth:320,width:"100%"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
 <div style={{color:"#bb99ff",fontSize:13,fontWeight:"bold"}}>AUTO DEALER</div>
 <button onClick={()=>closePopup(setAutoDealerInfo)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <div style={{color:"#bbccdd",fontSize:10,lineHeight:1.6}}>When enabled, launching a main run opens the Dealer card screen first so you can choose your loadout, then start straight from there with "Play With This Loadout". If every card slot is already filled, the run begins immediately with no detour.</div>
 </div>
 </div>
 )}
 {sprintInfo&&(()=>{const _isLvl=(meta.lab?.completed?.intro_sprint||0);const _isPct=_isLvl>0?[10,20,30,40,50][Math.min(_isLvl-1,4)]:0;const _isMax=meta.highWave||0;const _dur=Math.floor(_isMax*_isPct/100);const _seLvl=meta.lab?.completed?.sprint_efficiency||0;const _sePct=_seLvl>0?[40,50,60,70,80][Math.min(_seLvl-1,4)]:30;return(
 <div onClick={()=>closePopup(setSprintInfo)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0c0c1a",border:"1px solid #44ccaa44",borderRadius:6,padding:"14px 16px",maxWidth:320,width:"100%"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
 <div style={{color:"#44ccaa",fontSize:13,fontWeight:"bold"}}>INTRO SPRINT</div>
 <button onClick={()=>closePopup(setSprintInfo)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <div style={{color:"#99aabb",fontSize:10,lineHeight:1.6}}>
 Sprint rapidly progresses through the first <span style={{color:"#44ccaa"}}>{_isPct}%</span> of your best wave (<span style={{color:"#44ccaa"}}>{_isMax}</span>), auto-progressing through <span style={{color:"#44ccaa"}}>{_dur} waves</span>.<br/><br/>
 <span style={{color:"#bbccdd"}}>Lab Efficiency:</span> Each sprint wave has a <span style={{color:"#44ccaa"}}>{_sePct}%</span> chance of contributing progress to active labs.{_seLvl>0?` (Level ${_seLvl})`:""}
 </div>
 </div>
 </div>);})()}
 {_modeUnlock&&_modeUnlock.length>0&&<TutPopup title="NEW GAMEMODE UNLOCKED" btnText="GOT IT" onBtn={()=>_setModeUnlock(null)}>{(()=>{const _MD={PLAYGROUND:"A free sandbox — spawn any enemy and test builds at no cost. Beat the Enforcer challenge for a permanent echo multiplier.",PRACTISE:"Risk-free practice runs that never touch your main stats. Your best practice wave adds to your echo multiplier.",PHANTOM:"A harder endless gauntlet. Your highest Phantom wave permanently boosts your echo multiplier.",CARGO:"Escort a cargo train as far as you can — distance and delivered packages earn ▣ Packages for the Paths tree.",DEALER:"Gamble echoes on risk/reward cards that reshape your next run."};return _modeUnlock.map((m,_i)=><div key={_i} style={{marginBottom:_i<_modeUnlock.length-1?12:0}}><div style={{color:"#44ddcc",fontWeight:"bold",letterSpacing:1,marginBottom:3,fontSize:12}}>{m}</div><div style={{color:"#99aabb"}}>{_MD[m]||""}</div></div>);})()}<div style={{color:"#667788",fontSize:9,marginTop:12}}>You can play it any time from the main menu.</div></TutPopup>}
 {showTutPrompt&&<TutPopup title="FIRST TIME?">
 Welcome to Void Storm! Would you like a guided tutorial?<br/>You'll play through 5 waves and learn the basics.<br/><br/>
 <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:10}}>
 <button onClick={()=>{setShowTutPrompt(false);goTo("settings");}} style={{padding:"8px 18px",background:"transparent",border:"2px solid #44ccaa",color:"#44ccaa",fontSize:11,fontFamily:"inherit",cursor:"pointer",letterSpacing:1,transition:"all 0.2s"}} onMouseOver={e=>{e.target.style.background="#44ccaa";e.target.style.color="#06060e";}} onMouseOut={e=>{e.target.style.background="transparent";e.target.style.color="#44ccaa";}}>I HAVE AN ACCOUNT</button>
 <button onClick={()=>initTutorial()} style={{padding:"8px 28px",background:"transparent",border:"2px solid #ffcc44",color:"#ffcc44",fontSize:12,fontFamily:"inherit",cursor:"pointer",letterSpacing:1,transition:"all 0.2s"}} onMouseOver={e=>{e.target.style.background="#ffcc44";e.target.style.color="#06060e";}} onMouseOut={e=>{e.target.style.background="transparent";e.target.style.color="#ffcc44";}}>START TUTORIAL</button>
 </div>
 <span style={{color:"#667788",fontSize:9,cursor:"pointer"}} onClick={(e)=>{e.stopPropagation();setShowTutPrompt(false);}}>No thanks, I'll figure it out →</span>
 </TutPopup>}
 <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10,zIndex:1,position:"relative",alignItems:"center",width:"100%"}}>
 <div style={{display:"flex",gap:8,justifyContent:"center"}}>
 <button onClick={()=>goTo("metashop")} style={{...bs2("#bb77ff44"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#bb99ff",position:"relative"}}>META{_dotsOn&&_affordMeta().any&&<span style={_affDot} />}</button>
 <button onClick={()=>{setHeInfoId(null);setAbInfoId(null);setSprintInfo(false);if((metaRef.current.metaTier||1)>=2&&!metaRef.current._heSeen){setMeta(prev=>{const nx={...prev,_heSeen:true};saveMeta(nx);return nx;});}goTo("hyperecho");}} style={{...bs2("#ffcc4433"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#ffcc44",position:"relative"}}>HYPERECHO{(meta.metaTier||1)>=2&&!meta._heSeen&&<span style={_affDot} />}</button>
 <button onClick={()=>{const _cur=meta.totalEchoesEarned||0;if(_cur<1500){_setSideLockPopup({mode:"DEALER",required:1500,current:_cur});return;}_setDealerAuto(false);if(!_dealerOffers&&(meta._dealerActive||[]).length<(meta._dealerSlots||1))_genDealerOffers();goTo("dealer");}} style={{...bs2("#ff668844"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#ff6688"}}>DEALER</button>
 <button onClick={()=>goTo("paths")} style={{...bs2("#cc884444"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#cc8844",position:"relative"}}>PATHS{_dotsOn&&_affordPaths&&<span style={_affDot} />}</button>
 </div>
 <div style={{display:"flex",gap:8,justifyContent:"center"}}>
 <button onClick={()=>{const _cur=meta.totalEchoesEarned||0;if(_cur<100){_setSideLockPopup({mode:"PLAYGROUND",required:100,current:_cur});return;}setEnforcerMode(false);goTo("playground");}} style={{...bs2("#44bbdd44"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#44bbdd"}}>PLAYGROUND</button>
 <button onClick={()=>{const _cur=meta.totalEchoesEarned||0;if(_cur<250){_setSideLockPopup({mode:"PRACTISE",required:250,current:_cur});return;}goTo("practise");}} style={{...bs2("#cc884433"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#cc9966"}}>PRACTISE</button>
 <button onClick={()=>{const _cur=meta.totalEchoesEarned||0;if(_cur<500){_setSideLockPopup({mode:"PHANTOM",required:500,current:_cur});return;}goTo("phantom_info");}} style={{...bs2("#cc66cc44"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#cc66cc"}}>PHANTOM</button>
 <button onClick={()=>{const _cur=meta.totalEchoesEarned||0;if(_cur<1000){_setSideLockPopup({mode:"CARGO",required:1000,current:_cur});return;}goTo("cargo");}} style={{...bs2("#eebb4444"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#eebb44"}}>CARGO</button>
 </div>
 <div style={{display:"flex",gap:8,justifyContent:"center"}}>
 <button onClick={()=>{setShowWiki(true);setCodexOpen({controls:false,mechanics:false,currencies:false,enemies:false,abilities:false,scrap:false,cores:false,plasma:false,meta:false,metaab:false,designs:false,labs:false,overheat:false})}} style={{...bs2("#44aacc33"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#66bbcc"}}>CODEX</button>
 <button onClick={()=>{setTutSel({mode:null,ab:null,bot:null,enemy:null,fx:null});goTo("tutorials");}} style={{...bs2("#55cc9944"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#55cc99"}}>SANDBOX</button>
 <button onClick={()=>{setHistoryMode("waves");goTo("history");}} style={{...bs2("#ff884466"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#ffaa66"}}>HISTORY</button>
 <button onClick={()=>goTo("settings")} style={{...bs2("#55667744"),padding:"5px 12px",fontSize:10,borderWidth:1,color:"#778899",position:"relative"}}>SETTINGS{_dotsOn&&_affordDesign&&<span style={_affDot} />}</button>
 </div>
 </div>
 {(leaderboardData.length>0||!_online)&&(()=>{const sorted=_online?[...leaderboardData].sort((a,b)=>lbSort==="echoes"?(b.echoes-a.echoes):(b.wave-a.wave)):[];const top3=sorted.slice(0,3);while(top3.length<3)top3.push(null);return <div style={{width:"100%",maxWidth:300,marginTop:14,zIndex:1,position:"relative"}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
 <span style={{color:!_online?"#aa7744":_isCheater(meta)?"#ff5566":"#556677",fontSize:8,letterSpacing:2}}>{!_online?"LEADERBOARD - NO CONNECTION":_isCheater(meta)?"LEADERBOARD - ACCOUNT BANNED":"LEADERBOARD"}</span>
 <div style={{display:"flex",gap:3}}>
 <button onClick={()=>setLbSort("echoes")} style={{padding:"2px 8px",background:lbSort==="echoes"?"#bb77ff22":"transparent",border:"1px solid "+(lbSort==="echoes"?"#bb77ff66":"#33445544"),borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:7,color:lbSort==="echoes"?"#bb99ff":"#667788",letterSpacing:1}}>ECHOES</button>
 <button onClick={()=>setLbSort("wave")} style={{padding:"2px 8px",background:lbSort==="wave"?"#44ccaa22":"transparent",border:"1px solid "+(lbSort==="wave"?"#44ccaa66":"#33445544"),borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:7,color:lbSort==="wave"?"#88ccaa":"#667788",letterSpacing:1}}>WAVES</button>
 </div>
 </div>
 {top3.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 8px",borderRadius:3,marginBottom:2}}>
 <span style={{color:i===0?"#ffcc44":"#99aabb",fontSize:9}}><span style={{color:"#556677",fontSize:8,marginRight:4}}>{i+1}.</span>{p?p.username:"-"}</span>
 <span style={{color:lbSort==="echoes"?"#bb77ff":"#44ccaa",fontSize:9,fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>{p?(lbSort==="echoes"?"⬢ "+p.echoes.toLocaleString():"W"+p.wave):""}</span>
 </div>)}
 <button onClick={_online?()=>goTo("leaderboard"):undefined} disabled={!_online} style={{width:"100%",marginTop:4,padding:"4px 8px",background:"none",border:"1px solid #33445544",borderRadius:3,cursor:_online?"pointer":"default",fontFamily:"inherit",fontSize:8,color:_online?"#667788":"#445566",letterSpacing:1,opacity:_online?1:0.5}}>VIEW ALL →</button>
 </div>;})()}
 </div>
 )}
 {phase==="paths"&&(()=>{
 const _zb={width:30,height:30,borderRadius:"50%",background:"#12100a",border:"1px solid #cc995566",color:"#cc9955",fontSize:16,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1};
 const CX=550,CY=550;
 const links=[];const catNodes=[];const upNodes=[];
 const _featOK={phantom:(meta.phantomHighWave||0)>0,practise:(meta.practiseHighWave||0)>0,cargo:(meta.cargoHighDistance||0)>0,enforcer:(meta.metaTier||1)>=2,dealer:!!meta._dealerPlayed,bots:Object.keys(meta.bots||{}).length>0,intro_sprint:(meta.lab?.completed?.intro_sprint||0)>=1};
 const _FEATREQ={phantom:"Play a Phantom run to unlock this path.",practise:"Play a Practise run to unlock this path.",cargo:"Play a Cargo run to unlock this path.",enforcer:"Reach meta Ship Tier 2 to unlock this path.",dealer:"Play a run with a Dealer card active to unlock this path.",bots:"Unlock a Bot to unlock this path.",intro_sprint:"Research Intro Sprint (Lv 1) to unlock this path."};
 PATH_DEFS.forEach((pd,i)=>{const ang0=(-90+i*(360/PATH_DEFS.length))*Math.PI/180;const RC=160;const ccx=CX+Math.cos(ang0)*RC,ccy=CY+Math.sin(ang0)*RC;
  catNodes.push({pd,x:ccx,y:ccy,r:34,ang:ang0});
  links.push({x1:CX,y1:CY,x2:ccx,y2:ccy,col:pd.col,main:true,r1:30,r2:34});
  const _ups=PATH_UPG[pd.id]||[];const _byP={};_ups.forEach(u=>{(_byP[u.parent||"_root"]=_byP[u.parent||"_root"]||[]).push(u);});
  const _lc=(id)=>{const ch=_byP[id]||[];return ch.length?ch.reduce((s,c)=>s+_lc(c.id),0):1;};
  const _W=0.80;
  const _place=(pid,pn,a0,a1,rad,depth)=>{const ch=_byP[pid]||[];if(!ch.length)return;const tot=ch.reduce((s,c)=>s+_lc(c.id),0)||1;let acc=a0;ch.forEach(c=>{const span=(a1-a0)*(_lc(c.id)/tot);const ca=acc+span/2;acc+=span;const x=CX+Math.cos(ca)*rad,y=CY+Math.sin(ca)*rad;const nr=depth>=3?14:depth===2?16:20;upNodes.push({up:c,pd,cat:pd.id,x,y,r:nr,ang:ca,depth});links.push({x1:pn.x,y1:pn.y,x2:x,y2:y,col:pd.col,r1:pn.r,r2:nr});_place(c.id,{x,y,r:nr},ca-span/2,ca+span/2,rad+(depth===1?100:112),depth+1);});};
  _place("_root",{x:ccx,y:ccy,r:34},ang0-_W/2,ang0+_W/2,255,1);
 });
 const _pick=(pd)=>{if(_pathMovedRef.current){return;}_setPathSel({catId:pd.id});};
 const _pickUp=(n)=>{if(_pathMovedRef.current){return;}_setPathSel({upId:n.up.id,cat:n.cat});};
 const _clpPan=(p,z)=>{const e=481*(z==null?pathsZoom:z)+40;return{x:Math.max(-e,Math.min(e,p.x)),y:Math.max(-e,Math.min(e,p.y))};};
 return <div className={_phaseClass("paths")} style={{position:"absolute",inset:0,zIndex:6,display:"flex",flexDirection:"column",background:"rgba(7,7,15,0.84)"}}>
  <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #1a1a2e",zIndex:3,background:"#08080e"}}>
   <button onClick={()=>goTo("menu")} style={{...bs2("#44556644"),borderWidth:1,color:"#778899",padding:"5px 12px",fontSize:10}} {...hv("#778899")}>← BACK</button>
   <div style={{color:"#cc9955",fontSize:13,fontWeight:"bold",letterSpacing:4}}>PATHS</div>
   <div style={{display:"flex",alignItems:"center",gap:5,color:"#ccaa66",fontSize:13,fontWeight:"bold"}}><span style={{fontSize:15,color:"#cc9955"}}>▣</span>{(meta.packages||0).toLocaleString()}</div>
  </div>
  <div
   onWheel={e=>{const _r=e.currentTarget.getBoundingClientRect();const _rx=e.clientX-(_r.left+_r.width/2),_ry=e.clientY-(_r.top+_r.height/2);const _z0=pathsZoom;const _z1=Math.max(0.35,Math.min(2.4,_z0-(e.deltaY>0?0.12:-0.12)));setPathsZoom(_z1);setPathsPan(p=>_clpPan({x:_rx-(_rx-p.x)*(_z1/_z0),y:_ry-(_ry-p.y)*(_z1/_z0)},_z1));}}
   onPointerDown={e=>{_pathDragRef.current={sx:e.clientX,sy:e.clientY,px:pathsPan.x,py:pathsPan.y,moved:false};_pathMovedRef.current=false;}}
   onPointerMove={e=>{const d=_pathDragRef.current;if(d){const ddx=e.clientX-d.sx,ddy=e.clientY-d.sy;if(Math.abs(ddx)+Math.abs(ddy)>4){d.moved=true;_pathMovedRef.current=true;}setPathsPan(_clpPan({x:d.px+ddx,y:d.py+ddy}));}}}
   onPointerUp={()=>{_pathDragRef.current=null;setTimeout(()=>{_pathMovedRef.current=false;},60);}}
   onPointerLeave={()=>{_pathDragRef.current=null;}}
   style={{flex:"1 1 0",minHeight:0,overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",touchAction:"none"}}>
   <div style={{position:"relative",width:1100,height:1100,transform:`translate(${pathsPan.x}px,${pathsPan.y}px) scale(${pathsZoom})`,transformOrigin:"center center",transition:_pathDragRef.current?"none":"transform 90ms linear"}}>
    <svg width={1100} height={1100} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
     {links.map((l,i)=>{const _ddx=l.x2-l.x1,_ddy=l.y2-l.y1,_dln=Math.hypot(_ddx,_ddy)||1,_ux=_ddx/_dln,_uy=_ddy/_dln;const _X1=l.x1+_ux*(l.r1||0),_Y1=l.y1+_uy*(l.r1||0),_X2=l.x2-_ux*(l.r2||0),_Y2=l.y2-_uy*(l.r2||0);return <line key={"pl"+i} x1={_X1} y1={_Y1} x2={_X2} y2={_Y2} stroke={l.col} strokeWidth={l.main?3:2} strokeOpacity={l.main?0.5:0.25} strokeDasharray={l.main?"":"6 6"}/>;})}
    </svg>
    {upNodes.map((n,i)=>{const _catOwned=!!(meta.pathsCat&&meta.pathsCat[n.cat]);const _owned=!!(meta.pathsUpg&&meta.pathsUpg[n.up.id]);const _po=n.up.parent?!!(meta.pathsUpg&&meta.pathsUpg[n.up.parent]):_catOwned;const _av=_catOwned&&_po;return <div key={"up"+i} onClick={()=>_pickUp(n)} style={{position:"absolute",left:n.x-n.r,top:n.y-n.r,width:n.r*2,height:n.r*2,borderRadius:"50%",border:`2px solid ${_owned?"#66ff88":_av?n.pd.col:"#3b3b4d"}`,background:_owned?"#08200e":"#0c0c16",boxShadow:_owned?"0 0 10px #66ff8855":(_av?`0 0 8px ${n.pd.col}33`:"none"),opacity:_owned?1:_av?0.95:0.34,cursor:"pointer",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center"}}>{n.up.enemy?<EnemyIcon type={n.up.enemy} size={n.r*1.45} color={_owned?"#88ff99":(_av?n.pd.col:"#55556a")} cardMode/>:<canvas width={44} height={44} style={{width:n.r*1.62,height:n.r*1.62,display:"block"}} ref={el=>{if(el){const _x=el.getContext("2d");if(_x)drawUpgIcon(_x,n.up.id,44,_owned?"#88ff99":(_av?n.pd.col:"#55556a"));}}} />}{_owned&&<span style={{position:"absolute",top:-3,right:-3,width:13,height:13,borderRadius:"50%",background:"#44dd66",color:"#06180a",fontSize:9,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 6px #44dd66"}}>✓</span>}</div>;})}
    {catNodes.map((n,i)=>{const _co=!!(meta.pathsCat&&meta.pathsCat[n.pd.id]);const _hx=n.pd.id==="intro_sprint"?Math.sin(n.ang):-Math.sin(n.ang);return <div key={"mn"+i} onClick={()=>_pick(n.pd)} style={{position:"absolute",left:n.x-n.r,top:n.y-n.r,width:n.r*2,height:n.r*2,cursor:"pointer",opacity:meta.pathsCore?1:0.4}}>
      <div style={{width:n.r*2,height:n.r*2,borderRadius:"50%",border:`2px solid ${_co?"#66ff88":n.pd.col}`,background:_co?"#0d0d18":"rgba(10,10,22,0.22)",boxShadow:`0 0 ${_co?16:12}px ${_co?"#66ff8855":n.pd.col+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",boxSizing:"border-box"}}>
       <canvas width={168} height={168} style={{width:n.r*1.5,height:n.r*1.5}} ref={el=>{if(el){const cx=el.getContext("2d");if(cx){cx.setTransform(3,0,0,3,0,0);cx.clearRect(0,0,56,56);drawPathIcon(cx,n.pd.id,28,28,24,n.pd.col);}}}} />
      </div>
      {_co&&<span style={{position:"absolute",top:-2,right:-2,width:18,height:18,borderRadius:"50%",background:"#44dd66",color:"#06180a",fontSize:11,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 8px #44dd66",border:"2px solid #08180c",zIndex:3}}>✓</span>}<div style={{position:"absolute",left:n.r+(_hx)*(n.r+13),top:n.r+(Math.cos(n.ang))*(n.r+13),transform:`translate(${_hx>0.34?"0%":(_hx<-0.34?"-100%":"-50%")},-50%)`,color:_co?"#88ff99":n.pd.col,fontSize:13,fontWeight:"bold",fontFamily:"monospace",whiteSpace:"nowrap",textShadow:"0 0 6px #000,0 0 4px #000",pointerEvents:"none"}}>{n.pd.name}</div>
     </div>;})}
    <div onClick={()=>{if(!_pathMovedRef.current)_setPathSel({core:true});}} style={{position:"absolute",left:CX-50,top:CY-50,width:100,height:100,borderRadius:"50%",border:`1px solid ${meta.pathsCore?"#66ff8855":((meta.packages||0)>=20?"#ffcc7799":"#cc995544")}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
     <div style={{width:80,height:80,borderRadius:"50%",border:`3px solid ${meta.pathsCore?"#66ff88":"#cc9955"}`,background:meta.pathsCore?"#08200e":"#1a1206",boxShadow:`0 0 18px ${meta.pathsCore?"#66ff8866":"#cc995566"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <span style={{color:meta.pathsCore?"#88ff99":"#ffcc77",fontSize:30,fontFamily:"monospace",fontWeight:"bold"}}>▣</span>
      <span style={{color:meta.pathsCore?"#88dd99":"#ccaa66",fontSize:9,fontFamily:"monospace",letterSpacing:2}}>CORE</span>{meta.pathsCore&&<span style={{position:"absolute",top:6,right:6,width:24,height:24,borderRadius:"50%",background:"#44dd66",color:"#06180a",fontSize:14,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 10px #44dd66",border:"2px solid #08180c",zIndex:2}}>✓</span>}
     </div>
    </div>
   </div>
   <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",maxWidth:"calc(100% - 130px)",textAlign:"center",color:"#aab7c7",fontSize:10,lineHeight:1.4,pointerEvents:"none",background:"rgba(8,8,17,0.78)",padding:"6px 12px",borderRadius:7,border:"1px solid #21213a"}}>Path upgrades are permanent boosts bought with packages (▣) earned across your runs. Each branch strengthens a different mode or system, and its effect lasts forever once unlocked.</div>
   <div style={{position:"absolute",right:10,top:24,display:"flex",flexDirection:"column",gap:6}}>
    <button onClick={()=>{const _nz=Math.min(2.4,pathsZoom+0.2);setPathsZoom(_nz);setPathsPan(p=>_clpPan(p,_nz));}} style={_zb}>+</button>
    <button onClick={()=>{const _nz=Math.max(0.35,pathsZoom-0.2);setPathsZoom(_nz);setPathsPan(p=>_clpPan(p,_nz));}} style={{..._zb,fontSize:18}}>−</button>
    <button onClick={()=>{setPathsPan({x:0,y:0});setPathsZoom(0.7);}} style={{..._zb,fontSize:13}}>⤢</button>
   </div>
   {_pathSel&&(()=>{if(_pathSel.core){const _owned=!!meta.pathsCore;const _canBuy=!_owned&&(meta.packages||0)>=20;return <div style={{position:"absolute",left:10,right:10,bottom:10,background:"#0c0c1a",border:"1px solid #cc995566",borderRadius:6,padding:"12px 14px",zIndex:4,boxShadow:"0 0 22px #cc995522",animation:"popupBgEnter 150ms ease-out both"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
     <div style={{width:30,height:30,borderRadius:"50%",border:"2px solid #cc9955",display:"flex",alignItems:"center",justifyContent:"center",color:"#ffcc77",fontSize:15,flexShrink:0}}>▣</div>
     <div style={{flex:1,minWidth:0}}><div style={{color:"#cc9955",fontSize:12,fontWeight:"bold",letterSpacing:1}}>TRAIN CORE</div><div style={{color:"#667788",fontSize:8}}>Root upgrade · unlocks the tree</div></div>
     <div onClick={()=>_setPathSel(null)} style={{color:"#778899",fontSize:16,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</div>
    </div>
    <div style={{color:"#bbccdd",fontSize:9,lineHeight:1.5,marginBottom:8}}>Multiply the train's speed by 2.5x. Must be purchased before any other path upgrade can be unlocked.</div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
     <div style={{color:"#ccaa66",fontSize:11,fontWeight:"bold"}}><span style={{color:"#cc9955"}}>▣</span> 20</div>
     <button onClick={()=>{if(_canBuy)setMeta(prev=>{const nx={...prev,packages:(prev.packages||0)-20,pathsCore:true};saveMeta(nx);return nx;});}} disabled={!_canBuy} style={{padding:"6px 18px",background:_owned?"#0c1a0c":_canBuy?"#1a1206":"#0a0a14",border:`1px solid ${_owned?"#66ff8866":_canBuy?"#cc9955":"#33445544"}`,borderRadius:4,color:_owned?"#88ff99":_canBuy?"#ffcc77":"#556677",fontFamily:"inherit",fontSize:9,letterSpacing:1,cursor:_canBuy?"pointer":"default"}}>{_owned?"✓ OWNED":_canBuy?"UNLOCK":"NEED 20 ▣"}</button>
    </div>
   </div>;}
   if(_pathSel.catId){const pd=PATH_DEFS.find(p=>p.id===_pathSel.catId);if(!pd)return null;const _co=!!(meta.pathsCat&&meta.pathsCat[pd.id]);const _nc=!meta.pathsCore;const _feat=!!_featOK[pd.id];const _cb=!_co&&!_nc&&_feat&&(meta.packages||0)>=50;return <div style={{position:"absolute",left:10,right:10,bottom:10,background:"#0c0c1a",border:`1px solid ${pd.col}66`,borderRadius:6,padding:"12px 14px",zIndex:4,boxShadow:`0 0 22px ${pd.col}22`,animation:"popupBgEnter 150ms ease-out both"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
     <canvas width={132} height={132} style={{width:30,height:30,flexShrink:0}} ref={el=>{if(el){const cx=el.getContext("2d");if(cx){cx.setTransform(3,0,0,3,0,0);cx.clearRect(0,0,44,44);drawPathIcon(cx,pd.id,22,22,18,pd.col);}}}} />
     <div style={{flex:1,minWidth:0}}><div style={{color:pd.col,fontSize:12,fontWeight:"bold",letterSpacing:1}}>{pd.name} PATH</div><div style={{color:"#667788",fontSize:8}}>Category entry · 50 ▣</div></div>
     <div onClick={()=>_setPathSel(null)} style={{color:"#778899",fontSize:16,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</div>
    </div>
    <div style={{color:"#bbccdd",fontSize:9,lineHeight:1.5,marginBottom:8}}>{_co?("The "+pd.name+" path is unlocked — its upgrades are now available."):(_nc?"Unlock the Core before any path can be opened.":(!_feat?_FEATREQ[pd.id]:("Unlock the "+pd.name+" path for 50 ▣. This opens access to the category's upgrades — it has no effect on its own.")))}</div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
     <div style={{color:"#ccaa66",fontSize:11,fontWeight:"bold"}}><span style={{color:"#cc9955"}}>▣</span> 50</div>
     <button onClick={()=>{if(_cb)setMeta(prev=>{const nx={...prev,packages:(prev.packages||0)-50,pathsCat:{...(prev.pathsCat||{}),[pd.id]:true}};saveMeta(nx);return nx;});}} disabled={!_cb} style={{padding:"6px 18px",background:_co?"#0c1a0c":_cb?"#1a1206":"#0a0a14",border:`1px solid ${_co?"#66ff8866":_cb?pd.col:"#33445544"}`,borderRadius:4,color:_co?"#88ff99":_cb?pd.col:"#556677",fontFamily:"inherit",fontSize:9,letterSpacing:1,cursor:_cb?"pointer":"default"}}>{_co?"✓ OWNED":_nc?"🔒 NEEDS CORE":!_feat?"🔒 LOCKED":_cb?"UNLOCK":"NEED 50 ▣"}</button>
    </div>
   </div>;}
   const _u=(PATH_UPG[_pathSel.cat]||[]).find(u=>u.id===_pathSel.upId);if(!_u)return null;const pd=PATH_DEFS.find(p=>p.id===_pathSel.cat);if(!pd)return null;const _catOwned=!!(meta.pathsCat&&meta.pathsCat[pd.id]);const _owned=!!(meta.pathsUpg&&meta.pathsUpg[_u.id]);const _po=_u.parent?!!(meta.pathsUpg&&meta.pathsUpg[_u.parent]):_catOwned;const _pName=_u.parent?(((PATH_UPG[_pathSel.cat]||[]).find(x=>x.id===_u.parent)||{}).name||"PREVIOUS"):(pd.name+" CATEGORY");const _cb=!_owned&&_catOwned&&_po&&(meta.packages||0)>=_u.cost;return <div style={{position:"absolute",left:10,right:10,bottom:10,background:"#0c0c1a",border:`1px solid ${pd.col}66`,borderRadius:6,padding:"12px 14px",zIndex:4,boxShadow:`0 0 22px ${pd.col}22`,animation:"popupBgEnter 150ms ease-out both"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
     <div style={{width:30,height:30,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{_u.enemy?<EnemyIcon type={_u.enemy} size={28} color={pd.col} cardMode/>:<canvas width={48} height={48} style={{width:28,height:28,display:"block"}} ref={el=>{if(el){const _x=el.getContext("2d");if(_x)drawUpgIcon(_x,_u.id,48,pd.col);}}} />}</div>
     <div style={{flex:1,minWidth:0}}><div style={{color:pd.col,fontSize:12,fontWeight:"bold",letterSpacing:1}}>{_u.name}</div><div style={{color:"#667788",fontSize:8}}>{pd.name} path upgrade</div></div>
     <div onClick={()=>_setPathSel(null)} style={{color:"#778899",fontSize:16,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</div>
    </div>
    <div style={{color:"#bbccdd",fontSize:12,lineHeight:1.45,marginBottom:8}}>{_u.desc}</div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
     <div style={{color:"#ccaa66",fontSize:11,fontWeight:"bold"}}><span style={{color:"#cc9955"}}>▣</span> {_u.cost.toLocaleString()}</div>
     <button onClick={()=>{if(_cb)setMeta(prev=>{const nx={...prev,packages:(prev.packages||0)-_u.cost,pathsUpg:{...(prev.pathsUpg||{}),[_u.id]:true},...(_u.id==="dl_s3"?{_dealerSlots:3}:_u.id==="dl_s2"?{_dealerSlots:Math.max(2,prev._dealerSlots||1)}:{})};saveMeta(nx);return nx;});}} disabled={!_cb} style={{padding:"6px 18px",background:_owned?"#0c1a0c":_cb?"#1a1206":"#0a0a14",border:`1px solid ${_owned?"#66ff8866":_cb?pd.col:"#33445544"}`,borderRadius:4,color:_owned?"#88ff99":_cb?pd.col:"#556677",fontFamily:"inherit",fontSize:9,letterSpacing:1,cursor:_cb?"pointer":"default"}}>{_owned?"✓ OWNED":!_catOwned?"🔒 NEEDS CATEGORY":!_po?("🔒 NEEDS "+_pName.toUpperCase()):_cb?"UNLOCK":("NEED "+_u.cost+" ▣")}</button>
    </div>
   </div>;})()}
  </div>
 </div>;
})()}
{phase==="leaderboard"&&(
 <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden",animation:"none"}} className={_phaseClass("leaderboard")}>
 <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}>
 <h2 style={{color:!_online?"#cc9955":_isCheater(meta)?"#ff5566":"#ccddee",fontSize:17,letterSpacing:3,margin:0}}>{!_online?"LEADERBOARD - NO CONNECTION":_isCheater(meta)?"LEADERBOARD - ACCOUNT BANNED":"LEADERBOARD"}</h2>
 <div style={{display:"flex",gap:6,marginTop:12,marginBottom:12}}>
 <button onClick={()=>setLbSort("echoes")} style={{padding:"5px 16px",background:lbSort==="echoes"?"#bb77ff22":"transparent",border:"1px solid "+(lbSort==="echoes"?"#bb77ff66":"#33445544"),borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,color:lbSort==="echoes"?"#bb99ff":"#667788",letterSpacing:1}}>ECHOES</button>
 <button onClick={()=>setLbSort("wave")} style={{padding:"5px 16px",background:lbSort==="wave"?"#44ccaa22":"transparent",border:"1px solid "+(lbSort==="wave"?"#44ccaa66":"#33445544"),borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,color:lbSort==="wave"?"#88ccaa":"#667788",letterSpacing:1}}>WAVES</button>
 </div>
 <div style={{width:"100%",maxWidth:380}}>
 {(()=>{if(!_online)return [];let _lb=[...leaderboardData];return _lb.sort((a,b)=>lbSort==="echoes"?(b.echoes-a.echoes):(b.wave-a.wave));})().map((p,i)=><div key={i} onClick={()=>{return;const _n=Date.now();const _dbl=(_n-_lbTapRef.current.t<400&&_lbTapRef.current.i===i);_lbTapRef.current={t:_n,i};if(!_dbl)return;if(p._self){_setAdmHist(null);_setAdmHistName(null);setHistoryMode("waves");goTo("history");}else if(p.code&&_SYNC_OK){fetch(SUPABASE_URL+"/rest/v1/saves?code=eq."+p.code+"&select=data",{headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}).then(r=>r.json()).then(rows=>{const _h=(rows[0]&&rows[0].data&&rows[0].data.history)||[];_setAdmHist(_h);_setAdmHistName(p.username||"Unknown Pilot");setHistoryMode("waves");goTo("history");}).catch(()=>{});}}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:i===0?"#1a1408":i%2===0?"#0a0a14":"transparent",borderRadius:3,marginBottom:1,border:i===0?"1px solid #ffcc4422":"1px solid transparent"}}>
 <span style={{color:i===0?"#ffcc44":i===1?"#ccddee":i===2?"#cc8844":"#99aabb",fontSize:10}}><span style={{color:"#556677",fontSize:9,marginRight:6,fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>{String(i+1).padStart(2," ")}.</span>{p.username}</span>
 <span style={{color:lbSort==="echoes"?"#bb77ff":"#44ccaa",fontSize:10,fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>{lbSort==="echoes"?"⬢ "+p.echoes.toLocaleString():"Wave "+p.wave}</span>
 </div>)}
 {(leaderboardData.length===0||!_online)&&<div style={{color:"#556677",fontSize:10,textAlign:"center",padding:20}}>{_online?"No players found.":"No connection — leaderboard unavailable."}</div>}
 </div>
 </div>
 <div style={{padding:10,borderTop:"1px solid #1a1a2e",display:"flex",justifyContent:"center"}}>
 <button onClick={()=>goTo("menu")} style={{padding:"8px 24px",background:"#0a0a16",border:"1px solid #55667744",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:11,color:"#8899aa"}}>← BACK</button>
 </div>
 </div>
 )}
 {phase==="phantom_info"&&(
 <div className={_phaseClass("phantom_info")} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden"}}>
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
 <button onClick={()=>goTo("menu")} style={{...bs2("#55667744"),borderWidth:1,color:"#8899aa"}}>← BACK</button>
 </div>
 </div></div>
 )}
 {phase==="ability"&&(
 <div className="vs-fade" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(6,6,14,0.92)",zIndex:10}}>
 {gsRef.current?._sprintJustEnded&&<div style={{color:"#44ccaa",fontSize:22,fontWeight:"bold",letterSpacing:5,marginBottom:8,textShadow:"0 0 12px #44ccaa44"}}>INTRO SPRINT OVER</div>}
 <h2 style={{color:"#ffcc44",fontSize:18,letterSpacing:4,margin:0}}>CHOOSE AN ABILITY</h2>
 <p style={{color:"#778899",fontSize:10,marginTop:5,marginBottom:14}}>Permanent for this run</p>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:600,padding:"0 10px"}}>
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
 {gsRef.current?._showDiffuse&&<div style={{display:"flex",justifyContent:"center",marginTop:10}}><button onClick={()=>{const gs=gsRef.current;if(!gs)return;const _dmB=gs._diffuseBonus||0.0375;gs._diffuseCount++;gs._diffuseMult+=_dmB;gs._showDiffuse=false;gs._sprintJustEnded=false;if(gs._pAb>0){gs._pAb--;offerAb(gs);}else if(gs.isCargo){setPhase("playing");if(gs.wave===0)startCargoNextWave(gs);}else if(gs.isNewMode){setPhase("playing");startWave(gs);}else if(gs.isPractise||gs.wave===0){const _dSLvl=metaRef.current.lab?.completed?.intro_sprint||0;const _dSPct=_dSLvl>0?[10,20,30,40,50][Math.min(_dSLvl-1,4)]:0;const _dSMax=metaRef.current.highWave||0;const _dSThr=Math.floor(_dSMax*_dSPct/100);const _dDoS=!gs.isPractise&&_dSPct>0&&!metaRef.current.introSprintOff&&_dSThr>0;setPhase("playing");startWave(gs,_dDoS);}else{setShopData({scrap:gs.scrap,cores:gs.cores,plasma:gs.plasma,upgrades:{...gs.upgrades},wave:gs.wave});setPhase("shop");}}} style={{width:148,padding:"12px 8px",background:"#12081e",border:"2px solid #bb77ff33",borderRadius:5,cursor:"pointer",textAlign:"center",fontFamily:"inherit",transition:"all 0.2s"}} onMouseOver={e=>e.currentTarget.style.borderColor="#bb77ff"} onMouseOut={e=>e.currentTarget.style.borderColor="#bb77ff33"}><div style={{fontSize:22,marginBottom:4,color:"#bb77ff"}}>⬢</div><div style={{color:"#bb77ff",fontSize:11,fontWeight:"bold",marginBottom:3}}>DIFFUSE</div><div style={{color:"#9988bb",fontSize:8,lineHeight:1.3}}>Skip this ability slot permanently. Gain +{(gsRef.current?._diffuseBonus||0.0375).toFixed(3)} echo multiplier this run.<br/><span style={{color:"#cc6666",fontSize:7}}>This slot is gone for good.</span><br/><span style={{color:"#bb99ff"}}>Current: ×{gsRef.current?._diffuseMult?.toFixed(3)||"1.000"}</span></div></button></div>}
 </div>
 )}
 {phase==="tutorials"&&(
<div className={_phaseClass("tutorials")} style={{position:"absolute",inset:0,zIndex:10,display:"flex",flexDirection:"column",background:"rgba(7,7,15,0.93)"}}>
 <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #1a1a2e",background:"#08080e"}}>
  <button onClick={()=>{if(tutSel.ab||tutSel.enemy){setTutSel({...tutSel,ab:null,enemy:null,fx:null});}else if(tutSel.mode){setTutSel({mode:null,ab:null,bot:null,enemy:null,fx:null});}else{goTo("menu");}}} style={{...bs2("#44556644"),borderWidth:1,color:"#778899",padding:"5px 12px",fontSize:10}} {...hv("#778899")}>BACK</button>
  <div style={{color:"#55cc99",fontSize:13,fontWeight:"bold",letterSpacing:4}}>SANDBOX</div>
  <div style={{width:54}} />
 </div>
 <div key={"sb-"+(tutSel.mode||"r")+(tutSel.ab||"")+(tutSel.enemy||"")} className="vs-scroll vs-fade" style={{flex:"1 1 0",minHeight:0,overflow:"auto",padding:"14px",display:"flex",flexDirection:"column",alignItems:"center"}}>
  {!tutSel.mode&&[0].map(()=>(
  <div key="pick" style={{width:"100%",maxWidth:440}}>
   <div style={{color:"#8899aa",fontSize:10,lineHeight:1.6,textAlign:"center",marginBottom:12}}>Sandbox runs let you try one piece of the game in isolation. No currency, no rewards, no bosses. Exit from the pause menu whenever you like.</div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
   {[{m:"ability",c:"#ffcc44",t:"Abilities",d:"One ability upgrade, alone."},{m:"bot",c:"#55ddaa",t:"Bots",d:"One fully-maxed bot, no abilities."},{m:"card",c:"#cc99ff",t:"Card Effects",d:"A card buff or nerf on one enemy type."},{m:"elite",c:"#ff5577",t:"Elites",d:"A chosen enemy spawns as an elite."}].map(o=>(
   <button key={o.m} onClick={()=>setTutSel({mode:o.m,ab:null,bot:null,enemy:null,fx:null})} style={{minHeight:86,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"12px 10px",background:"#0a0a1a",border:"1px solid "+o.c+"44",borderRadius:6,cursor:"pointer",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.borderColor=o.c} onMouseOut={e=>e.currentTarget.style.borderColor=o.c+"44"}>
    <div style={{color:o.c,fontSize:13,fontWeight:"bold",letterSpacing:1}}>{o.t}</div>
    <div style={{color:"#8899aa",fontSize:9,marginTop:5,lineHeight:1.4}}>{o.d}</div>
   </button>))}
   </div>
  </div>))}
  {tutSel.mode==="ability"&&(()=>{const ab=ABILITIES.find(a=>a.id===tutSel.ab);return(<div style={{width:"100%",maxWidth:440}}>
   {!tutSel.ab&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{ABILITIES.map(a=>(
    <button key={a.id} onClick={()=>setTutSel({...tutSel,ab:a.id})} style={{minHeight:80,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"#0a0a1a",border:"1px solid #ffcc4433",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.borderColor="#ffcc44"} onMouseOut={e=>e.currentTarget.style.borderColor="#ffcc4433"}>
     <AbilityIcon id={a.id} size={30} color="#ffcc44" />
     <div style={{color:"#ffcc44",fontSize:10,textAlign:"center"}}>{a.name}</div>
    </button>))}</div>}
   {tutSel.ab&&<div>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><AbilityIcon id={tutSel.ab} size={26} color="#ffcc44" /><div style={{color:"#ffcc44",fontSize:13,fontWeight:"bold"}}>{ab?ab.name:tutSel.ab}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
    {[{k:"sub1",l:"Sub-upgrade 1"},{k:"sub2",l:"Sub-upgrade 2"},{k:"mastery",l:"Mastery"},{k:null,l:"Base only"}].map(o=>{const key=o.k?tutSel.ab+"_"+o.k:null;const desc=key?(AB_DESCS[key]||""):"Just the base ability, no upgrade.";const isM=o.k==="mastery";const col=isM?"#ffcc44":"#44ddcc";return(
     <button key={o.l} onClick={()=>startTutAbility(tutSel.ab,key)} style={{minHeight:74,textAlign:"left",padding:"10px",background:"#0c0c1a",border:"1px solid "+col+"33",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.borderColor=col} onMouseOut={e=>e.currentTarget.style.borderColor=col+"33"}>
      <div style={{color:col,fontSize:10,fontWeight:"bold"}}>{o.l}</div>
      <div style={{color:"#8899aa",fontSize:8.5,marginTop:3,lineHeight:1.4}}>{desc}</div>
     </button>);})}
    </div>
   </div>}
  </div>);})()}
  {tutSel.mode==="bot"&&<div style={{width:"100%",maxWidth:440}}>
   <div style={{color:"#8899aa",fontSize:9,textAlign:"center",marginBottom:8}}>The chosen bot starts fully maxed. No abilities.</div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{BOTS.map(b=>(
    <button key={b.id} onClick={()=>startTutBot(b.id)} style={{minHeight:96,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"#0a0a1a",border:"1px solid "+b.col+"44",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.borderColor=b.col} onMouseOut={e=>e.currentTarget.style.borderColor=b.col+"44"}>
     <canvas width={120} height={120} style={{width:32,height:32}} ref={el=>{if(el){const cx=el.getContext("2d");if(cx){cx.setTransform(3,0,0,3,0,0);cx.clearRect(0,0,40,40);_drawBotIcon(cx,b.id,20,20,13,b.col);}}}} />
     <div style={{color:b.col,fontSize:11,fontWeight:"bold"}}>{b.name}</div>
     <div style={{color:"#8899aa",fontSize:8,textAlign:"center",lineHeight:1.3}}>{b.desc}</div>
    </button>))}</div>
  </div>}
  {tutSel.mode==="card"&&(()=>{const fx=tutSel.enemy?DEALER_FX[tutSel.enemy]:null;const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);return(<div style={{width:"100%",maxWidth:440}}>
   {!tutSel.enemy&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{Object.keys(DEALER_FX).map(t=>(
    <button key={t} onClick={()=>setTutSel({...tutSel,enemy:t})} style={{minHeight:74,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,padding:"10px",background:"#0a0a1a",border:"1px solid #cc99ff33",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.borderColor="#cc99ff"} onMouseOut={e=>e.currentTarget.style.borderColor="#cc99ff33"}>
     <EnemyIcon type={t} size={34} color="#cc99ff" cardMode />
     <div style={{color:"#cc99ff",fontSize:10}}>{cap(t)}</div>
    </button>))}</div>}
   {tutSel.enemy&&fx&&<div>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><EnemyIcon type={tutSel.enemy} size={28} color="#cc99ff" cardMode /><div style={{color:"#cc99ff",fontSize:13,fontWeight:"bold"}}>{cap(tutSel.enemy)}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
    {fx.nerfs.map((o,i)=>(<button key={"n"+i} onClick={()=>startTutEnemy(tutSel.enemy,o.mod)} style={{minHeight:80,position:"relative",textAlign:"left",padding:"10px",background:"#0a140a",border:"1px solid #66ff8833",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.borderColor="#66ff88"} onMouseOut={e=>e.currentTarget.style.borderColor="#66ff8833"}><div style={{position:"absolute",top:5,right:9,color:"#7dffc0",fontSize:18,fontWeight:"bold"}}>-</div><div style={{color:"#7dffc0",fontSize:9,fontWeight:"bold",marginBottom:3}}>NERF</div><div style={{color:"#aaccaa",fontSize:9,lineHeight:1.35}}>{o.label}</div></button>))}
    {fx.buffs.map((o,i)=>(<button key={"b"+i} onClick={()=>startTutEnemy(tutSel.enemy,o.mod)} style={{minHeight:80,position:"relative",textAlign:"left",padding:"10px",background:"#160a0a",border:"1px solid #ff557733",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.borderColor="#ff5577"} onMouseOut={e=>e.currentTarget.style.borderColor="#ff557733"}><div style={{position:"absolute",top:5,right:9,color:"#ff9a8a",fontSize:18,fontWeight:"bold"}}>+</div><div style={{color:"#ff9a8a",fontSize:9,fontWeight:"bold",marginBottom:3}}>BUFF</div><div style={{color:"#ddaaaa",fontSize:9,lineHeight:1.35}}>{o.label}</div></button>))}
    </div>
    <button onClick={()=>startTutEnemy(tutSel.enemy,{})} style={{display:"block",width:"100%",textAlign:"center",padding:"8px",marginTop:8,background:"transparent",border:"1px solid #33445544",borderRadius:5,cursor:"pointer",fontFamily:"inherit",color:"#8899aa",fontSize:9}}>No modifier (vanilla enemy)</button>
   </div>}
  </div>);})()}
  {tutSel.mode==="elite"&&(()=>{const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);return(<div style={{width:"100%",maxWidth:440}}>
   <div style={{color:"#8899aa",fontSize:9,textAlign:"center",marginBottom:8}}>The chosen enemy spawns as an elite each wave (with reinforcements), using your normal loadout.</div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{Object.keys(DEALER_FX).filter(t=>t!=="splitter"&&t!=="bomber").map(t=>(
    <button key={t} onClick={()=>startTutElite(t)} style={{minHeight:74,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,padding:"10px",background:"#0a0a1a",border:"1px solid #ff557733",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}} onMouseOver={e=>e.currentTarget.style.borderColor="#ff5577"} onMouseOut={e=>e.currentTarget.style.borderColor="#ff557733"}>
     <EnemyIcon type={t} size={34} color="#cc99ff" cardMode />
     <div style={{color:"#ff7799",fontSize:10}}>{cap(t)}</div>
    </button>))}</div>
  </div>);})()}
 </div>
</div>)}
 {phase==="playground"&&(
 <div className={_phaseClass("playground")} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden"}}>
 <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflowY:"auto",overflowX:"hidden",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}><h2 style={{color:enforcerMode?"#ff5577":"#55aa88",fontSize:18,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>{enforcerMode?"ENFORCER":"PLAYGROUND"}</h2>
 <div style={{display:"flex",gap:0,marginTop:10,borderRadius:4,overflow:"hidden",border:"1px solid #33445544",flexShrink:0,position:"relative",zIndex:2}}>
 <button onClick={()=>setEnforcerMode(false)} style={{padding:"6px 16px",background:!enforcerMode?"#141428":"#0a0a16",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:10,color:!enforcerMode?"#55aa88":"#667788",borderRight:"1px solid #33445544",whiteSpace:"nowrap"}}>PLAYGROUND</button>
 <button onClick={()=>setEnforcerMode(true)} style={{padding:"6px 16px",background:enforcerMode?"#1a1020":"#0a0a16",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:10,color:enforcerMode?"#ff5577":"#667788",whiteSpace:"nowrap"}}>ENFORCER</button>
 </div>
 <div key={enforcerMode?"enforcer":"playground"} style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",animation:(_transStage==="exiting"&&_transFrom==="playground")?undefined:((enforcerMode?"tabSlideRight":"tabSlideLeft")+" 200ms cubic-bezier(0.22,1,0.36,1) both")}}>
 <p style={{color:"#ccddee",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.5}}>{enforcerMode?"Survive 60 seconds against an ultimate enemy. Any hit kills you instantly. You cannot damage them. Each first victory adds +0.025 to your echo multiplier. Enforcers are not in any particular difficulty order.":"Pick an enemy to fight. You'll face 1 solo, then 5 at once (boss: 1 only). Stats match the wave that enemy first appears. No drops, no upgrades, no echoes."}</p>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14,width:"100%",maxWidth:480,position:"relative"}}>
 {Object.entries(ED).sort(([a],[b])=>(ENEMY_UNLOCK[a]||1)-(ENEMY_UNLOCK[b]||1)).map(([k,ed])=>{
 const w=ENEMY_UNLOCK[k]||1;
 const _enfDef=!!(meta.enforcerDefeated||{})[k];
 const _enfBest=(meta.enforcerBest||{})[k]||0;
 const _pgDone=!!(meta.pgCompleted||{})[k];
 const _pathOk=!!(meta.pathsUpg||{})["ef_"+k];
 const _enfLocked=enforcerMode&&(!_pgDone||!_pathOk);
 const _canPlay=enforcerMode?!_enfLocked:true;
 return(
 <button key={k} onClick={()=>_canPlay&&startPlayground(k,enforcerMode)} disabled={!_canPlay}
 style={{display:"flex",gap:10,alignItems:"center",padding:"10px",background:"#0a0a1a",border:`1px solid ${enforcerMode&&_enfDef?"#ffcc4444":"#22334444"}`,borderRadius:4,cursor:_canPlay?"pointer":"default",fontFamily:"inherit",textAlign:"left",transition:"all 0.2s",opacity:_enfLocked?0.4:1,position:"relative",overflow:"hidden"}}
 onMouseOver={e=>_canPlay&&(e.currentTarget.style.borderColor=enforcerMode?"#ff5577":"#55aa88")} onMouseOut={e=>(e.currentTarget.style.borderColor=enforcerMode&&_enfDef?"#ffcc4444":"#22334444")}>
 {enforcerMode&&_enfDef&&<div className="gold-shimmer"/>}
 <EnemyIcon type={k} size={32} />
 <div>
 <div style={{color:"#ccddee",fontSize:11,fontWeight:"bold",textTransform:"capitalize"}}>{k}</div>
 {enforcerMode?<div style={{color:_enfDef?"#ffcc44":_enfLocked?"#cc6666":"#aabbcc",fontSize:8}}>{_enfLocked?((!_pgDone&&!_pathOk)?"Need: round + Paths unlock":!_pgDone?"Complete playground round first":"Unlock in Paths first"):_enfDef?"Enforcer defeated":`Longest survived: ${_enfBest}s`}</div>
 :<div style={{color:"#aabbcc",fontSize:8}}>Wave {w} · HP×{ed.hpM} · DMG×{ed.dM}</div>}
 </div>
 </button>
 );
 })}
 <button onClick={()=>{const _bPgDone=!!(meta.pgCompleted||{}).boss;const _bPathOk=!!(meta.pathsUpg||{}).ef_boss;const _bCanPlay=enforcerMode?(_bPgDone&&_bPathOk):true;if(_bCanPlay)startPlayground("boss",enforcerMode);}} disabled={enforcerMode&&!((meta.pgCompleted||{}).boss&&(meta.pathsUpg||{}).ef_boss)}
 style={{display:"flex",gap:10,alignItems:"center",padding:"10px",background:"#0a0a1a",border:`1px solid ${enforcerMode&&(meta.enforcerDefeated||{}).boss?"#ffcc4444":"#22334444"}`,borderRadius:4,cursor:enforcerMode&&!((meta.pgCompleted||{}).boss&&(meta.pathsUpg||{}).ef_boss)?"default":"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.2s",gridColumn:"1 / -1",opacity:enforcerMode&&!((meta.pgCompleted||{}).boss&&(meta.pathsUpg||{}).ef_boss)?0.4:1,position:"relative",overflow:"hidden"}}
 onMouseOver={e=>{const _bp2=enforcerMode&&!((meta.pgCompleted||{}).boss&&(meta.pathsUpg||{}).ef_boss);if(!_bp2)e.currentTarget.style.borderColor=enforcerMode?"#ff5577":"#ff2266";}} onMouseOut={e=>(e.currentTarget.style.borderColor=enforcerMode&&(meta.enforcerDefeated||{}).boss?"#ffcc4444":"#22334444")}>
 {enforcerMode&&(meta.enforcerDefeated||{}).boss&&<div className="gold-shimmer"/>}
 <EnemyIcon type="boss" size={32} />
 <div>
 <div style={{color:"#ff2266",fontSize:11,fontWeight:"bold"}}>Boss</div>
 {enforcerMode?<div style={{color:(meta.enforcerDefeated||{}).boss?"#ffcc44":(!(meta.pgCompleted||{}).boss||!(meta.pathsUpg||{}).ef_boss)?"#cc6666":"#aabbcc",fontSize:8}}>{(!(meta.pgCompleted||{}).boss||!(meta.pathsUpg||{}).ef_boss)?((!(meta.pgCompleted||{}).boss&&!(meta.pathsUpg||{}).ef_boss)?"Need: round + Paths unlock":!(meta.pgCompleted||{}).boss?"Complete playground round first":"Unlock in Paths first"):(meta.enforcerDefeated||{}).boss?"Enforcer defeated":`Longest survived: ${(meta.enforcerBest||{}).boss||0}s`}</div>
 :<div style={{color:"#aabbcc",fontSize:8}}>Wave 5 · HP×18 · Solo only</div>}
 </div>
 </button>
 {enforcerMode&&(meta.metaTier||1)<2&&<div style={{position:"absolute",inset:0,background:"rgba(6,6,14,0.88)",zIndex:5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:6,pointerEvents:"all"}}>
 <div style={{fontSize:36,marginBottom:8}}>🔒</div>
 <div style={{color:"#8899aa",fontSize:12,fontWeight:"bold",letterSpacing:2,marginBottom:8}}>LOCKED</div>
 <div style={{color:"#667788",fontSize:10,textAlign:"center",maxWidth:260,lineHeight:1.6}}>Reach <span style={{color:"#bb99ff"}}>Meta Tier 2</span> to unlock Enforcer mode. Max all Ship Upgrades at Tier 1 first. Once maxed, you will be able to unlock tier 2 for <span style={{color:"#bb99ff"}}>⬢ 800</span>.</div>
 </div>}
 </div>
 </div>
 <button onClick={()=>goTo("menu")} style={{...bs2("#55667744"),marginTop:16,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
 </div></div>
 )}
 {phase==="practise"&&(
 <div className={_phaseClass("practise")} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden"}}>
 <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}><h2 style={{color:"#cc8844",fontSize:18,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>PRACTISE</h2>
 <p style={{color:"#ccddee",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.5}}>Play any wave with base stats. No drops, no upgrades, no echoes.<br/>Survive the full wave to win. Die and you'll return to the menu.</p>
 <div style={{display:"flex",alignItems:"center",gap:12,marginTop:18}}>
 <button onClick={()=>setPracticeWave(w=>Math.max(1,w-10))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12,borderRadius:3}}>−10</button>
 <button onClick={()=>setPracticeWave(w=>Math.max(1,w-1))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:14,borderRadius:3}}>−</button>
 <div style={{minWidth:80,textAlign:"center"}}><span style={{color:"#ccddee",fontSize:28,fontWeight:"bold"}}>{practiceWave}</span><div style={{color:"#aabbcc",fontSize:8,marginTop:2}}>WAVE</div></div>
 <button onClick={()=>setPracticeWave(w=>Math.min(99,w+1))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:14,borderRadius:3}}>+</button>
 <button onClick={()=>setPracticeWave(w=>Math.min(99,w+10))} style={{background:"none",border:"1px solid #44556644",color:"#cc8844",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12,borderRadius:3}}>+10</button>
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
 {(()=>{const _eCount=4+Math.floor(practiceWave*1.0)+Math.floor(Math.pow(practiceWave,1.1)*0.25);const _rawHp=Math.round(BASE_HP*hpScale(practiceWave));const _rawDmg=Math.round((7+practiceWave*1.8)*dmgScale(practiceWave)*0.35);const _cumEchoes=(()=>{let totalK=0;for(let w2=1;w2<=practiceWave;w2++)totalK+=4+Math.floor(w2*1.0)+Math.floor(Math.pow(w2,1.1)*0.25);return Math.max(0,Math.floor(practiceWave*1.5+totalK*0.38+Math.pow(practiceWave,2.8)*0.065+Math.pow(practiceWave,1.8)*0.4));})();return <>Enemy HP scale: ×{hpScale(practiceWave).toFixed(1)} ({_rawHp}) · DMG scale: ×{dmgScale(practiceWave).toFixed(1)} ({_rawDmg}) · Count: {_eCount}<br/>Cumulative echoes through wave {practiceWave}: <span style={{color:CUR.echoes.color}}>⬢ {_cumEchoes.toLocaleString()}</span>{(()=>{const _t=metaRef.current.metaTier||1;if(_t<2)return null;const _phW=metaRef.current.phantomHighWave||0;const _prW=metaRef.current.practiseHighWave||0;const _phL=(metaRef.current.lab?.completed?.phantom_enhance||0)*0.001;const _prL=(metaRef.current.lab?.completed?.practise_enhance||0)*0.001;const _tv=_t===3?2.5:_t===2?1.5:1;const _ph=_t>=2?(1+_phW*(0.01+_phL)):1;const _pr=_t>=2?(1+_prW*(0.006+_prL)):1;const _enf=_t>=2?1+(metaRef.current.enforcerKills||0)*0.025:1;const _des4=_t>=2?1+((metaRef.current.ownedDesigns||[]).length)*0.004:1;const _heMult=_tv*_ph*_pr*_enf*_des4;if(_heMult<=1)return null;const _final=Math.floor(_cumEchoes*_heMult);return <>{" "}<span style={{color:"#ffcc44"}}>×{_heMult.toFixed(3)}</span>{" = "}<span style={{color:CUR.echoes.color}}>⬢ {_final.toLocaleString()}</span></>;})()}</>})()}
 </div>
 </div>
 <button onClick={()=>startPractise(practiceWave)} style={{...bs2("#cc8844"),marginTop:16,padding:"10px 32px",fontSize:14}} {...hv("#cc8844")}>PLAY WAVE {practiceWave}</button>
 <button onClick={()=>goTo("menu")} style={{...bs2("#55667744"),marginTop:10,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
 </div></div>
 )}
 {phase==="history"&&(()=>{
 let _hist=[];if(_admHist){_hist=_admHist;}else{try{_hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");}catch(e){}}
 const _filtered=historyHideForfeits?_hist.filter(r=>!r.forfeited):_hist;
 const _maxW=_filtered.length>0?Math.max(..._filtered.map(r=>historyMode==="echoes"?(r.echoes||0):r.wave)):1;
 const _totalRuns=_hist.length;const _totalKills=_hist.reduce((s,r)=>s+(r.kills||0),0);const _totalEchoes=_hist.reduce((s,r)=>s+(r.echoes||0),0);
 const _chartH=300;const _chartW=GW-80;
 const _barGap=_filtered.length>40?1:2;const _barW=_filtered.length>0?Math.max(2,Math.min(24,Math.floor((_chartW-(_filtered.length-1)*_barGap)/_filtered.length))):24;
 const _cumEchoes=[];let _runCum=0;_hist.forEach(r=>{_runCum+=(r.echoes||0);_cumEchoes.push(_runCum);});
 const _trendWindow=Math.max(3,Math.floor(_filtered.length/8));
 const _trend=_filtered.map((_,i)=>{let s=0,c=0;for(let j=Math.max(0,i-_trendWindow+1);j<=i;j++){s+=(historyMode==="echoes"?(_filtered[j].echoes||0):_filtered[j].wave);c++;}return s/c;});
 return(
 <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden",animation:"none"}} className={_phaseClass("history")}>
 <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}><h2 style={{color:"#99aacc",fontSize:18,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>PLAY HISTORY</h2>{_admHist&&<div style={{color:"#ff9966",fontSize:10,marginTop:5,letterSpacing:1,zIndex:1,position:"relative"}}>VIEWING: {_admHistName||"Unknown Pilot"} (admin)</div>}
 <div style={{color:"#aabbcc",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.6}}>
 Lifetime runs: <span style={{color:"#ccddee"}}>{_totalRuns - _hist.filter(r=>r.forfeited).length}</span> · Lifetime kills: <span style={{color:"#ccddee"}}>{_totalKills.toLocaleString()}</span> · Lifetime echoes: <span style={{color:CUR.echoes.color}}>⬢ {_totalEchoes.toLocaleString()}</span>
 </div>
 <div style={{color:"#ff66aa",fontSize:9,marginTop:4,textAlign:"center",letterSpacing:1}}>Double click to view detailed stats and a video replay</div>
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
 {(()=>{const _hw=r.wave||0,_hk=r.kills||0;const _hRaw=Math.max(1,Math.floor(_hw*1.5+_hk*0.38+Math.pow(_hw,2.8)*0.065+Math.pow(_hw,1.8)*0.4)-(_hk===0&&_hw<=1?1:0));const _hMult=(r.echoes||0)>0&&_hRaw>0?(r.echoes/_hRaw):1;const _showHeMult=(meta.metaTier||1)>=2;return _showHeMult?<><span style={{color:"#ff66aa"}}>Hyperecho: ×{_hMult.toFixed(3)}</span> · Lifetime echoes: <span style={{color:CUR.echoes.color}}>⬢ {cumE.toLocaleString()}</span></>:<>Lifetime echoes: <span style={{color:CUR.echoes.color}}>⬢ {cumE.toLocaleString()}</span></>;})()}
 </div>})():<span>Hover over a bar for run details</span>}
 </div>
 <div style={{display:"flex"}}>
 {}
 <div style={{width:30,flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"space-between",paddingRight:4,height:_chartH}}>
 <span style={{color:"#445566",fontSize:7,textAlign:"right"}}>{historyMode==="echoes"?"⬢":"W"}{historyMode==="echoes"?_maxW.toLocaleString():_maxW}</span>
 {_maxW>2&&<span style={{color:"#334455",fontSize:7,textAlign:"right"}}>{historyMode==="echoes"?"⬢":"W"}{historyMode==="echoes"?Math.round(_maxW/2).toLocaleString():Math.round(_maxW/2)}</span>}
 <span style={{color:"#445566",fontSize:7,textAlign:"right"}}>0</span>
 </div>
 {}
 <div style={{flex:1,position:"relative"}}>
 <div onMouseLeave={()=>setHistoryHover(null)} style={{display:"grid",gridTemplateColumns:`repeat(${_filtered.length},1fr)`,alignItems:"end",height:_chartH,borderBottom:"1px solid #22334466",borderLeft:"1px solid #22334466",overflow:"hidden"}}>
 {_filtered.map((r,i)=>{const _bVal=historyMode==="echoes"?(r.echoes||0):r.wave;const h=Math.max(4,(_chartH-10)*(_bVal/_maxW));return <div key={i}
 onMouseEnter={()=>setHistoryHover(i)} onMouseLeave={()=>{}} onDoubleClick={()=>{_setHistPanel(null);_setHistDetail(r);}}
 style={{height:h,margin:"0 1px",background:r.forfeited?"#cc885566":"#00e5ff55",borderTop:historyHover===i?`1px solid ${r.forfeited?"#cc8855":"#00e5ff"}`:"1px solid transparent",borderLeft:historyHover===i?`1px solid ${r.forfeited?"#cc8855":"#00e5ff"}`:"1px solid transparent",borderRight:historyHover===i?`1px solid ${r.forfeited?"#cc8855":"#00e5ff"}`:"1px solid transparent",borderBottom:"none",borderRadius:"2px 2px 0 0",cursor:"pointer",transition:"border 0.1s"}} />})}
 </div>
 {}
 {_filtered.length>=3&&(()=>{const _heData=_filtered.map(r=>{const w=r.wave||0,k=r.kills||0;const rawE=Math.max(1,Math.floor(w*1.5+k*0.38+Math.pow(w,2.8)*0.065+Math.pow(w,1.8)*0.4)-(k===0&&w<=1?1:0));const actualE=r.echoes||0;return actualE>0&&rawE>0?actualE/rawE:1;});const _heMax=Math.max(0.001,..._heData);const _showHe=(meta.metaTier||1)>=2&&historyHideForfeits;return <svg style={{position:"absolute",top:0,left:0,width:"100%",height:_chartH,pointerEvents:"none"}} viewBox={`0 0 1000 ${_chartH}`} preserveAspectRatio="none">
 <polyline fill="none" stroke="#ffcc44" strokeWidth="2" strokeOpacity="0.5" strokeLinejoin="round" points={_trend.map((tw,i)=>{const x=(i+0.5)/_filtered.length*1000;const y=_chartH-(_chartH-10)*(tw/_maxW);return `${x},${y}`;}).join(" ")} />
 {_showHe&&<polyline fill="none" stroke="#ff66aa" strokeWidth="1.5" strokeOpacity="0.7" strokeLinejoin="round" points={_heData.map((he,i)=>{const x=(i+0.5)/_filtered.length*1000;const y=_chartH-(_chartH-10)*(he/_heMax);return `${x},${y}`;}).join(" ")} />}
 </svg>;})()}
 {}
 <div style={{position:"absolute",top:_chartH/2,left:0,right:0,borderTop:"1px dashed #22334433",pointerEvents:"none"}} />
 <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{color:"#445566",fontSize:7}}>Run 1</span><span style={{color:"#445566",fontSize:7}}>Run {_filtered.length}</span></div>
 </div>
 </div>
 {_trend.length>0&&<div style={{color:"#ffcc4466",fontSize:7,textAlign:"center",marginTop:4}}>— trend ({_trendWindow}-run avg){(meta.metaTier||1)>=2&&<span style={{color:"#ff66aa66"}}> — hyperecho multiplier</span>}</div>}
 </div>)}
 <button onClick={()=>goTo("menu")} style={{...bs2("#55667744"),marginTop:16,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
 </div></div>);})()}
 {phase==="hyperecho"&&(
 <div className={_phaseClass("hyperecho")} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden"}}>
 <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}>
 <h2 style={{color:"#ffcc44",fontSize:18,letterSpacing:3,margin:0}}>HYPERECHO</h2>
 <div style={{color:"#ccddee",fontSize:10,marginTop:8,textAlign:"center",lineHeight:1.6,maxWidth:380}}>Echo multipliers stack multiplicatively. Earn more echoes per run by unlocking multiplier sources.</div>
 <div style={{marginTop:20,width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:6,position:"relative"}}>
 {(()=>{const _tier=meta.metaTier||1;const _phW=meta.phantomHighWave||0;const _prW=meta.practiseHighWave||0;const _phLab=(meta.lab?.completed?.phantom_enhance||0)*0.001;const _prLab=(meta.lab?.completed?.practise_enhance||0)*0.001;const _phV=1+_phW*(0.01+_phLab);const _prV=1+_prW*(0.006+_prLab);const _mults=[{id:"tier",name:"Tier",desc:"",color:"#bb99ff",val:_tier===3?2.5:_tier===2?1.5:1},{id:"phantom",name:"Phantom",desc:`+${(0.01+_phLab).toFixed(3)} per phantom max wave (${_phW}).`,color:"#cc66cc",val:_tier>=2?_phV:1},{id:"practise",name:"Practise",desc:`+${(0.006+_prLab).toFixed(3)} per practise max wave (${_prW}).`,color:"#cc9966",val:_tier>=2?_prV:1},{id:"enforcer",name:"Enforcer",desc:"+0.025 per enforcer defeated in Playground.",color:"#ff5577",val:_tier>=2?1+(meta.enforcerKills||0)*0.025:1},{id:"designer",name:"Designer",desc:"+0.004 per custom ship design owned. Unlock designs with boss shards in Settings > Custom Designs.",color:"#cc7744",val:_tier>=2?1+((meta.ownedDesigns||[]).length)*0.004:1},{id:"diffusion",name:"Diffusion",desc:"Per-run echo bonus from diffusing ability slots. Each diffuse adds +" + ((metaRef.current.lab?.completed?.diffusion_multi||0)*0.009+0.0375).toFixed(3) + " to the multiplier. Resets each run."+((meta.pathsUpg?.pr_diff&&(meta.practiseHighWave||0)>0&&(meta.practiseHighWave||0)%5===0)?" Plus a permanent +0.045 because your best practise wave is a boss wave.":""),color:"#44ddcc",val:(gsRef.current?._diffuseMult||1)+((meta.pathsUpg?.pr_diff&&(meta.practiseHighWave||0)>0&&(meta.practiseHighWave||0)%5===0)?0.045:0)}];const _total=_mults.reduce((a,m)=>a*m.val,1);return _mults.map(m=>(
 <div key={m.id} style={{padding:"6px 0"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
 <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{color:m.color,fontSize:14,fontWeight:"bold"}}>{m.name}</div>
 {m.desc&&<div onClick={(e)=>{e.stopPropagation();setHeInfoId(heInfoId===m.id?null:m.id);}} style={{width:14,height:14,borderRadius:7,border:"1px solid #44667744",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#667788"}}>?</div>}</div>
 <div style={{color:"#ccddee",fontSize:18,fontWeight:"bold",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace",minWidth:70,textAlign:"right"}}>×{m.val.toFixed(3)}</div>
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
 {(()=>{const _tier=meta.metaTier||1;const _phW2=meta.phantomHighWave||0;const _prW2=meta.practiseHighWave||0;const _phL2=(meta.lab?.completed?.phantom_enhance||0)*0.001;const _prL2=(meta.lab?.completed?.practise_enhance||0)*0.001;const _tv=_tier===3?2.5:_tier===2?1.5:1;const _enfK=meta.enforcerKills||0;const _total=_tv*(_tier>=2?(1+_phW2*(0.01+_phL2)):1)*(_tier>=2?(1+_prW2*(0.006+_prL2)):1)*(_tier>=2?1+_enfK*0.025:1)*(_tier>=2?1+((meta.ownedDesigns||[]).length)*0.004:1)*(gsRef.current?._diffuseMult||1);return <div style={{color:"#ffcc44",fontSize:26,fontWeight:"bold",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>×{_total.toFixed(3)}</div>;})()}
 </div>
 <button onClick={()=>goTo("menu")} style={{...bs2("#55667744"),marginTop:20,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
 </div></div>
 )}
 {phase==="settings"&&(
 <div onClick={()=>{if(confirmReset)setConfirmReset(false);}} className={_phaseClass("settings")} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden"}}>
 <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 16px 20px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}><h2 style={{color:"#ccddee",fontSize:17,letterSpacing:3,margin:0,zIndex:1,position:"relative"}}>SETTINGS</h2>
 <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:"16px 0 8px"}}>ACCOUNT</h3>
 <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"center",maxWidth:300}}>
 {!syncCode?<>
 <input type="text" inputMode="numeric" maxLength={6} value={syncCodeInput} onChange={e=>setSyncCodeInput(e.target.value.replace(/\D/g,""))} placeholder="0000" style={{width:88,padding:"6px 8px",background:"#0a0a16",border:"1px solid #33445566",borderRadius:4,color:"#ccddee",fontSize:12,fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace",textAlign:"center",letterSpacing:3,outline:"none"}} />
 <button onClick={()=>{const c=syncCodeInput;if(c.length<4){setSyncStatus("tooshort");return;}if(c.length>6){setSyncStatus("error");return;}if(BLOCKED_CODES.has(c)){setSyncStatus("blocked");return;}if(!_SYNC_OK){setSyncStatus("noconfig");return;}setSyncStatus("syncing");fetch(SUPABASE_URL+"/rest/v1/saves?code=eq."+c+"&select=data,updated_at",{headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Cache-Control":"no-cache"}}).then(r=>r.json()).then(rows=>{const cd=rows.length>0&&rows[0].data?rows[0].data:null;if(cd&&cd.meta&&cd.meta.locked){const _lk=localStorage.getItem("vs4-lock-key");if(!_lk||_lk!==cd.meta.lock_key){setSyncStatus("locked");return;}}const lm=meta;const lp=(lm.highWave||0)>0||(lm.echoes||0)>0||Object.keys(lm.levels||{}).length>0;if(cd&&cd.meta&&lp){let _llp=lm.savedAt||0;if(!_llp){try{const _lh=JSON.parse(localStorage.getItem("vs4-history")||"[]");if(_lh.length>0)_llp=_lh[_lh.length-1].date||0;}catch(_e2){}}const _clp=cd.meta.savedAt||(rows[0].updated_at?new Date(rows[0].updated_at).getTime():0);setSyncConflict({code:c,local:{savedAt:_llp,echoes:lm.echoes||0,highWave:lm.highWave||0,totalEchoesEarned:lm.totalEchoesEarned||0},cloud:{savedAt:_clp,echoes:cd.meta.echoes||0,highWave:cd.meta.highWave||0,totalEchoesEarned:cd.meta.totalEchoesEarned||0},cloudData:cd});setSyncStatus("conflict");}else if(cd&&cd.meta){if(cd.meta.locked){const _lk2=localStorage.getItem("vs4-lock-key");if(!_lk2||_lk2!==cd.meta.lock_key){setSyncStatus("locked");return;}}localStorage.setItem("vs4-sync-code",c);setSyncCode(c);syncCodeRef.current=c;setMeta(cd.meta);try{localStorage.setItem("vs4-meta",JSON.stringify(cd.meta));}catch(e){}if(cd.history)try{localStorage.setItem("vs4-history",JSON.stringify(cd.history));}catch(e){}if(cd.tut)try{localStorage.setItem("vs4-tut",cd.tut);}catch(e){}setSyncStatus("synced");{const _tsS=Date.now();const _msS={...cd.meta,savedAt:_tsS};try{const _hS=localStorage.getItem("vs4-history")||"[]";const _tS=localStorage.getItem("vs4-tut")||"0";fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code:c,data:{meta:_msS,history:_vsHistForSync(),tut:_tS,session_id:_sessionIdRef.current,devices:{[_sessionIdRef.current]:Date.now()}},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(_e){}}}else{localStorage.setItem("vs4-sync-code",c);setSyncCode(c);syncCodeRef.current=c;setSyncStatus("synced");const _ts3=Date.now();const _pushM={...lm,savedAt:_ts3};try{const h=localStorage.getItem("vs4-history")||"[]";const t=localStorage.getItem("vs4-tut")||"0";fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code:c,data:{meta:_pushM,history:_vsHistForSync(),tut:t,session_id:_sessionIdRef.current,devices:{[_sessionIdRef.current]:Date.now()}},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(e){}}}).catch(()=>setSyncStatus("error"));}} style={{padding:"6px 14px",background:"#141428",border:"1px solid #44ccaa66",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,color:"#88ccaa",letterSpacing:1}}>SYNC</button>
 <div onClick={()=>setShowSyncInfo(true)} style={{width:15,height:15,borderRadius:"50%",border:"1px solid #44ccaa44",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#44ccaa66",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#44ccaa"} onMouseOut={e=>e.currentTarget.style.color="#44ccaa66"}>?</div>
 </>:<>
 <span style={{color:"#44ccaa",fontSize:13,fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace",letterSpacing:3}}>{syncCode}</span>
 {!confirmDisconnect?<button onClick={()=>{if(meta.locked){setSyncStatus("unlock_first");setTimeout(()=>setSyncStatus("synced"),3000);return;}setConfirmDisconnect(true);}} style={{padding:"4px 14px",background:"#141428",border:"1px solid #ff334466",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#cc6666",letterSpacing:1}}>DISCONNECT</button>:<div style={{display:"flex",gap:4,alignItems:"center"}}><button onClick={()=>{if(metaRef.current.locked){setConfirmDisconnect(false);setSyncStatus("unlock_first");setTimeout(()=>setSyncStatus("synced"),3000);return;}const _ms=metaRef.current;const _ts=Date.now();const _pushFinal={..._ms,savedAt:_ts};try{const _h=localStorage.getItem("vs4-history")||"[]";const _t=localStorage.getItem("vs4-tut")||"0";fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code:syncCodeRef.current,data:{meta:_pushFinal,history:_vsHistForSync(),tut:_t,session_id:"disconnected",devices:{}},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(_e){}setSyncCode(null);syncCodeRef.current=null;setSyncStatus("none");setSyncCodeInput("");setConfirmDisconnect(false);setSessionTakeover(false);try{localStorage.removeItem("vs4-sync-code");localStorage.removeItem("vs4-meta");localStorage.removeItem("vs4-history");localStorage.removeItem("vs4-tut");}catch(e){}const _def={echoes:0,levels:{},shards:0,shardsBought:0,abUpgrades:{},shipColor:"cyan",bulletColor:"teal",bossShards:0,ownedDesigns:[],shipDesign:"none",designColor:undefined,showNewEnemy:true,showHitText:true,showMagnetRange:true,highWave:0,username:_genUsername()};setMeta(_def);setShowTutPrompt(true);}} style={{padding:"4px 10px",background:"#1a0a0a",border:"1px solid #ff3344",borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#ff4455"}}>CONFIRM</button><button onClick={()=>setConfirmDisconnect(false)} style={{padding:"4px 10px",background:"none",border:"1px solid #33445544",borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#667788"}}>CANCEL</button></div>}
 <div onClick={()=>setShowSyncInfo(true)} style={{width:15,height:15,borderRadius:"50%",border:"1px solid #44ccaa44",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#44ccaa66",flexShrink:0}} onMouseOver={e=>e.currentTarget.style.color="#44ccaa"} onMouseOut={e=>e.currentTarget.style.color="#44ccaa66"}>?</div>
 </>}
 </div>
 {syncStatus==="tooshort"&&<div style={{color:"#cc5555",fontSize:8,marginTop:4}}>Code must be at least 4 characters.</div>}
 {syncStatus==="error"&&<div style={{color:"#cc5555",fontSize:8,marginTop:4}}>Sync failed. Check your connection.</div>}
 {syncStatus==="blocked"&&<div style={{color:"#cc8855",fontSize:8,marginTop:4}}>That code is too obvious. Try something less guessable.</div>}
 {syncStatus==="noconfig"&&<div style={{color:"#cc8855",fontSize:8,marginTop:4}}>Cloud sync not configured. See SUPABASE_URL in code.</div>}
 {syncStatus==="syncing"&&<div style={{color:"#44ccaa",fontSize:8,marginTop:4}}>Syncing...</div>}
 {syncStatus==="synced"&&syncCode&&<div style={{color:"#44ccaa88",fontSize:8,marginTop:4}}>Connected</div>}
 {syncStatus==="locked"&&<div style={{color:"#ff8844",fontSize:8,marginTop:4}}>This account is locked by its owner. New connections are not allowed.</div>}
 {syncStatus==="unlock_first"&&<div style={{color:"#ff8844",fontSize:8,marginTop:4}}>Unlock your account before disconnecting.</div>}
 {syncStatus==="conflict"&&<div style={{color:"#ffcc44",fontSize:8,marginTop:4}}>Choose which save to keep below.</div>}
 {syncConflict&&(
 <div style={{marginTop:10,width:"100%",maxWidth:360}}>
 <div style={{display:"flex",gap:8}}>
 <div style={{flex:1,background:"#0a0a16",border:"1px solid #44ccaa44",borderRadius:6,padding:"12px 10px",textAlign:"center"}}>
 <div style={{color:"#44ccaa",fontSize:11,fontWeight:"bold",letterSpacing:1,marginBottom:8}}>THIS DEVICE</div>
 <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Last played</div>
 <div style={{color:"#ccddee",fontSize:9,marginBottom:8,fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>{syncConflict.local.savedAt?new Date(syncConflict.local.savedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Pre-update save"}</div>
 <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Best wave</div>
 <div style={{color:"#ccddee",fontSize:13,fontWeight:"bold",marginBottom:6}}>Wave {syncConflict.local.highWave||0}</div>
 <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Echoes</div>
 <div style={{color:"#bb77ff",fontSize:13,fontWeight:"bold",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>⬢ {syncConflict.local.echoes||0}</div>
 <button onClick={()=>{const c=syncConflict.code;if(syncConflict.cloudData?.meta?.locked){const _lk3=localStorage.getItem("vs4-lock-key");if(!_lk3||_lk3!==syncConflict.cloudData.meta.lock_key){setSyncConflict(null);setSyncStatus("locked");return;}}localStorage.setItem("vs4-sync-code",c);setSyncCode(c);syncCodeRef.current=c;setSyncConflict(null);setSyncStatus("synced");const _ts4=Date.now();const _pushM2={...meta,savedAt:_ts4};try{const h=localStorage.getItem("vs4-history")||"[]";const t=localStorage.getItem("vs4-tut")||"0";fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code:c,data:{meta:_pushM2,history:_vsHistForSync(),tut:t,session_id:_sessionIdRef.current,devices:{[_sessionIdRef.current]:Date.now()}},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(e){}}} style={{marginTop:10,padding:"6px 16px",background:"transparent",border:"1px solid #44ccaa66",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",letterSpacing:1,transition:"all 0.2s"}} onMouseOver={e=>{e.currentTarget.style.background="#44ccaa";e.currentTarget.style.color="#06060e";}} onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#88ccaa";}}>USE THIS</button>
 </div>
 <div style={{flex:1,background:"#0a0a16",border:"1px solid #bb77ff44",borderRadius:6,padding:"12px 10px",textAlign:"center"}}>
 <div style={{color:"#bb77ff",fontSize:11,fontWeight:"bold",letterSpacing:1,marginBottom:8}}>CLOUD</div>
 <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Last played</div>
 <div style={{color:"#ccddee",fontSize:9,marginBottom:8,fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>{syncConflict.cloud.savedAt?new Date(syncConflict.cloud.savedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Pre-update save"}</div>
 <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Best wave</div>
 <div style={{color:"#ccddee",fontSize:13,fontWeight:"bold",marginBottom:6}}>Wave {syncConflict.cloud.highWave||0}</div>
 <div style={{color:"#8899aa",fontSize:9,marginBottom:2}}>Echoes</div>
 <div style={{color:"#bb77ff",fontSize:13,fontWeight:"bold",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>⬢ {syncConflict.cloud.echoes||0}</div>
 <button onClick={()=>{const c=syncConflict.code;const cd=syncConflict.cloudData;if(cd?.meta?.locked){const _lk4=localStorage.getItem("vs4-lock-key");if(!_lk4||_lk4!==cd.meta.lock_key){setSyncConflict(null);setSyncStatus("locked");return;}}localStorage.setItem("vs4-sync-code",c);setSyncCode(c);syncCodeRef.current=c;if(cd.meta){setMeta(cd.meta);try{localStorage.setItem("vs4-meta",JSON.stringify(cd.meta));}catch(e){}}if(cd.history)try{localStorage.setItem("vs4-history",JSON.stringify(cd.history));}catch(e){}if(cd.tut)try{localStorage.setItem("vs4-tut",cd.tut);}catch(e){}{const _tsS2=Date.now();const _msS2={...cd.meta,savedAt:_tsS2};try{fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code:c,data:{meta:_msS2,history:cd.history||[],tut:cd.tut||"0",session_id:_sessionIdRef.current,devices:{[_sessionIdRef.current]:Date.now()}},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(_e2){}}setSyncConflict(null);setSyncStatus("synced");}} style={{marginTop:10,padding:"6px 16px",background:"transparent",border:"1px solid #bb77ff66",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#bb99ff",letterSpacing:1,transition:"all 0.2s"}} onMouseOver={e=>{e.currentTarget.style.background="#bb77ff";e.currentTarget.style.color="#06060e";}} onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#bb99ff";}}>USE THIS</button>
 </div>
 </div>
 <button onClick={()=>{setSyncConflict(null);setSyncStatus("none");setSyncCodeInput("");}} style={{marginTop:8,padding:"5px 12px",background:"none",border:"1px solid #33445544",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:8,color:"#667788",width:"100%"}}>CANCEL</button>
 </div>
 )}
 {showSyncInfo&&(
 <div onClick={()=>closePopup(setShowSyncInfo)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:340,width:"100%"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
 <div style={{color:"#44ccaa",fontSize:14,fontWeight:"bold",letterSpacing:2}}>CLOUD SYNC</div>
 <button onClick={()=>closePopup(setShowSyncInfo)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <div style={{color:"#99aabb",fontSize:10,lineHeight:1.7}}>
 Your <b style={{color:"#ccddee"}}>4 to 6 digit code</b> is your account — no username or password needed. Just remember it.<br/><br/>
 Enter the same code on any device to <b style={{color:"#44ccaa"}}>load your progress</b>. All meta upgrades, ability shards, echoes, lab progress, and run history are synced.<br/><br/>
 Data saves <b style={{color:"#44ccaa"}}>automatically</b> every 2 minutes while playing and whenever you die or forfeit a run. When you switch devices, your latest save is loaded automatically.<br/><br/>
 If both your device and the cloud have progress, you'll be asked to <b style={{color:"#ffcc44"}}>choose which save to keep</b> — nothing gets overwritten without your say-so.
 </div>
 </div>
 </div>
 )}
 {syncCode&&<>
 <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:"16px 0 6px"}}>USERNAME:</h3>
 <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"center",maxWidth:300}}>
 <input type="text" maxLength={16} value={usernameInput||""} onChange={e=>setUsernameInput(e.target.value)} placeholder={meta.username||"Pilot"} style={{width:120,padding:"6px 8px",background:"#0a0a16",border:"1px solid #33445566",borderRadius:4,color:"#ccddee",fontSize:11,fontFamily:"inherit",textAlign:"center",outline:"none"}} />
 <button onClick={()=>{const u=usernameInput.trim();if(!u||u.length<2){return;}if(_hasProfanity(u)){setSyncStatus("profanity");setTimeout(()=>setSyncStatus("synced"),3000);return;}if(leaderboardData.some(p=>p.username.toLowerCase()===u.toLowerCase())){setSyncStatus("taken");setTimeout(()=>setSyncStatus("synced"),3000);return;}setMeta(prev=>{const nx={...prev,username:u};saveMeta(nx);return nx;});setUsernameInput("");}} style={{padding:"6px 14px",background:"#141428",border:"1px solid #44ccaa66",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,color:"#88ccaa",letterSpacing:1}}>SET</button>
 </div>
 {syncStatus==="profanity"&&<div style={{color:"#ff5555",fontSize:8,marginTop:3}}>That username contains inappropriate language.</div>}
 {syncStatus==="taken"&&<div style={{color:"#ff8844",fontSize:8,marginTop:3}}>That username is already taken.</div>}
 <div style={{display:"flex",gap:10,alignItems:"center",justifyContent:"center",marginTop:10}}>
 <span style={{color:"#99aabb",fontSize:9}}>Lock Account</span>
 <div onClick={()=>{if(meta.locked){setMeta(prev=>{const nx={...prev,locked:false,lock_key:null};saveMeta(nx);return nx;});try{localStorage.removeItem("vs4-lock-key");}catch(e){}}else{setShowLockWarning(true);}}} style={{width:36,height:18,borderRadius:9,background:meta.locked?"#44ccaa":"#1a1a2e",position:"relative",cursor:"pointer",border:"1px solid "+(meta.locked?"#44ccaa66":"#33445566"),transition:"background 0.2s"}}><div style={{width:14,height:14,borderRadius:7,background:meta.locked?"#fff":"#556677",position:"absolute",top:1,left:meta.locked?19:1,transition:"left 0.2s"}}/></div>
 <div onClick={()=>setShowLockInfo(true)} style={{width:14,height:14,borderRadius:"50%",border:"1px solid #44ccaa44",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:7,color:"#44ccaa66",flexShrink:0}}>?</div>
 </div>
 </>}
 {showLockInfo&&<div onClick={()=>closePopup(setShowLockInfo)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:320,width:"100%"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{color:"#44ccaa",fontSize:13,fontWeight:"bold",letterSpacing:2}}>ACCOUNT LOCK</div><button onClick={()=>closePopup(setShowLockInfo)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button></div><div style={{color:"#99aabb",fontSize:10,lineHeight:1.7}}>When your account is locked, nobody else can sign into it using your code — even if they know it.<br/><br/>You can unlock it at any time from this device. Just make sure to <b style={{color:"#ffcc44"}}>unlock before clearing your browser data or losing access to this browser/device</b>, or you won't be able to get back in.</div></div></div>}
 {showLockWarning&&<div onClick={()=>closePopup(setShowLockWarning)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #ffcc4433",borderRadius:6,padding:"16px 14px",maxWidth:320,width:"100%"}}><div style={{color:"#ffcc44",fontSize:13,fontWeight:"bold",letterSpacing:2,marginBottom:10}}>LOCK ACCOUNT?</div><div style={{color:"#99aabb",fontSize:10,lineHeight:1.7,marginBottom:14}}>This will prevent anyone else from signing into your account. You can always unlock it from this device.<br/><br/><span style={{color:"#cc8866",fontSize:9}}>If you clear your browser data, or lose access to this browser/device while locked, you will be permanently locked out of this account.</span></div><div style={{display:"flex",gap:8,justifyContent:"center"}}><button onClick={()=>{const _lkey=Math.random().toString(36).slice(2,14);try{localStorage.setItem("vs4-lock-key",_lkey);}catch(e){}setMeta(prev=>{const nx={...prev,locked:true,lock_key:_lkey};saveMeta(nx);return nx;});setShowLockWarning(false);}} style={{padding:"6px 16px",background:"transparent",border:"1px solid #ffcc4466",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#ffcc44",letterSpacing:1}}>LOCK MY ACCOUNT</button><button onClick={()=>closePopup(setShowLockWarning)} style={{padding:"6px 16px",background:"none",border:"1px solid #33445544",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#667788"}}>CANCEL</button></div></div></div>}
 <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:"20px 0 8px"}}>CUSTOMISATION</h3>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:380}}>
 <button onClick={()=>{setShowShipPopup(true);}} style={{padding:"10px 14px",flex:1,minWidth:90,background:"#0a0a16",border:"1px solid #44ccaa44",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"space-between"}} onMouseOver={e=>e.currentTarget.style.borderColor="#44ccaa"} onMouseOut={e=>e.currentTarget.style.borderColor="#44ccaa44"}><span>Ship & Bullet Colours</span><span style={{color:"#44ccaa44",fontSize:11}}>›</span></button>
 <button onClick={()=>setShowBgPopup(true)} style={{padding:"10px 14px",flex:1,minWidth:90,background:"#0a0a16",border:"1px solid #44ccaa44",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"space-between"}} onMouseOver={e=>e.currentTarget.style.borderColor="#44ccaa"} onMouseOut={e=>e.currentTarget.style.borderColor="#44ccaa44"}><span>Backgrounds</span><span style={{color:"#44ccaa44",fontSize:11}}>›</span></button>
 <button onClick={()=>setShowDesignPopup(true)} style={{padding:"10px 14px",flex:1,minWidth:90,background:"#0a0a16",border:"1px solid #44ccaa44",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}} onMouseOver={e=>e.currentTarget.style.borderColor="#44ccaa"} onMouseOut={e=>e.currentTarget.style.borderColor="#44ccaa44"}>{_dotsOn&&_affordDesign&&<span style={_affDot} />}<span>Custom Designs</span><span style={{color:"#44ccaa44",fontSize:11}}>›</span></button>
 </div>
 {showDesignPopup&&(()=>{const _dCol=SHIP_COLORS.find(c=>c.id===(meta.designColor||"orange"))||SHIP_COLORS[0];return(
 <div onClick={()=>closePopup(setShowDesignPopup)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} className="vs-scroll" style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #cc333333",borderRadius:6,padding:"16px 14px",maxWidth:420,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
 <div style={{color:"#cc3333",fontSize:17,fontWeight:"bold",letterSpacing:2}}>CUSTOM DESIGNS</div>
 <button onClick={()=>closePopup(setShowDesignPopup)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:11,borderRadius:3}}>✕</button>
 </div>
 <div style={{color:"#aabbcc",fontSize:12,marginBottom:12}}>Boss Shards: <span style={{color:"#cc3333",fontWeight:"bold",fontSize:14}}>{CUR.bossShards.icon} {meta.bossShards||0}</span></div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
 {SHIP_DESIGNS.map((sd,sdi)=>{const owned=sd.cost===0||(meta.ownedDesigns||[]).includes(sd.id);const selected=(meta.shipDesign||"none")===sd.id;const canBuy=!owned&&(meta.bossShards||0)>=sd.cost;return(
 <button key={sd.id} onClick={()=>{if(owned){setMeta(prev=>{const nx={...prev,shipDesign:sd.id};saveMeta(nx);return nx;});}else if(canBuy){setMeta(prev=>{const nx={...prev,bossShards:(prev.bossShards||0)-sd.cost,ownedDesigns:[...(prev.ownedDesigns||[]),sd.id],shipDesign:sd.id};saveMeta(nx);return nx;});}}}
 style={{padding:"4px 2px",minHeight:90,background:selected?"#1a1420":owned?"#0a0a16":"#08080f",border:`2px solid ${selected?"#cc3333":owned?"#cc333344":"#22223322"}`,borderRadius:4,cursor:owned||canBuy?"pointer":"default",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}
 onMouseOver={e=>{if(owned||canBuy)e.currentTarget.style.borderColor="#cc3333";}} onMouseOut={e=>e.currentTarget.style.borderColor=selected?"#cc3333":owned?"#cc333344":"#22223322"}>
 <canvas width={192} height={192} ref={cvs=>{if(!cvs)return;const cx=cvs.getContext("2d");cx.setTransform(3,0,0,3,0,0);cx.clearRect(0,0,64,64);const _shipC=SHIP_COLORS.find(c=>c.id===(meta.shipColor||"cyan"))||SHIP_COLORS[0];cx.fillStyle=_shipC.color;cx.shadowColor=_shipC.glow;cx.shadowBlur=5;const sz=13,px=32,py=34;cx.beginPath();cx.moveTo(px,py-sz-4);cx.lineTo(px-sz,py+sz);cx.lineTo(px,py+sz*0.4);cx.lineTo(px+sz,py+sz);cx.closePath();cx.fill();cx.shadowBlur=0;if(sd.draw){sd.draw(cx,px,py,sz,_dCol.color);cx.globalAlpha=1;}}} style={{display:"block",margin:"0 auto",width:64,height:64}} />
 {!owned&&<div style={{color:canBuy?"#cc3333":"#44556688",fontSize:9,marginTop:2}}>{CUR.bossShards.icon} {sd.cost}</div>}
 {selected&&<div style={{color:"#cc3333",fontSize:8,marginTop:2}}>equipped</div>}
 </button>);})}
 </div>
 <div style={{color:"#8899aa",fontSize:10,marginTop:12,marginBottom:6,letterSpacing:1}}>DESIGN COLOUR</div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4}}>
 {SHIP_COLORS.map(sc=>{const _isShipCol=(meta.shipColor||"cyan")===sc.id;const sel=(meta.designColor||"orange")===sc.id&&!_isShipCol;return(
 <button key={sc.id} onClick={()=>{if(_isShipCol)return;setMeta(prev=>{const nx={...prev,designColor:sc.id};saveMeta(nx);return nx;});}}
 style={{padding:"6px 2px",background:sel?"#141428":"#0a0a16",border:`2px solid ${_isShipCol?"#22222233":sel?sc.color:sc.color+"33"}`,borderRadius:3,cursor:_isShipCol?"default":"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s",opacity:_isShipCol?0.25:1}}
 onMouseOver={e=>{if(!_isShipCol)e.currentTarget.style.borderColor=sc.color;}} onMouseOut={e=>e.currentTarget.style.borderColor=_isShipCol?"#22222233":sel?sc.color:sc.color+"33"}>
 <div style={{width:14,height:14,margin:"0 auto",background:sc.color,borderRadius:"50%",boxShadow:_isShipCol?"none":`0 0 6px ${sc.glow}66`}} />
 </button>);})}
 </div>
 <div style={{color:"#667788",fontSize:10,marginTop:10,lineHeight:1.6}}>Earn boss shards from bosses. (Current boss shard drop rate: <span style={{color:"#44ccaa"}}>{(metaRef.current.lab?.completed?.boss_shard_drop||0)*8}%</span>)</div>
 </div>
 </div>);})()}
 <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:"20px 0 8px"}}>MOBILE CONTROLS</h3>
 <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:380}}>
 {[{id:"reactive",label:"Reactive Joystick"},{id:"stationary",label:"Stationary Joystick"},{id:"arrows",label:"On-Screen Arrows"}].map(mc=>{
 const sel=(meta.mobileControls||"reactive")===mc.id;
 return <button key={mc.id} onClick={()=>setMeta(prev=>{const nx={...prev,mobileControls:mc.id};saveMeta(nx);return nx;})}
 style={{padding:"5px 10px",flex:1,minWidth:100,background:sel?"#141428":"#0a0a16",border:`1px solid ${sel?"#44ccaa66":"#33445544"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:sel?"#88ccaa":"#667788",textAlign:"center"}}>
 {mc.label}
 </button>;
 })}
 </div>
 <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,margin:"20px 0 8px"}}>
 <h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:0}}>GAMEPLAY</h3>
 <div onClick={()=>_setShowAdvInfo(true)} style={{width:14,height:14,borderRadius:"50%",border:"1px solid #44667788",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#556688",fontWeight:"bold"}} onMouseOver={e=>{e.currentTarget.style.color="#88bbdd";e.currentTarget.style.borderColor="#88bbddaa";}} onMouseOut={e=>{e.currentTarget.style.color="#556688";e.currentTarget.style.borderColor="#44667788";}}>i</div>
 </div>
 <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:380}}>
 {[
 {key:"showNewEnemy",label:"New enemy alerts",get:()=>meta.showNewEnemy!==false,toggle:()=>setMeta(prev=>{const nx={...prev,showNewEnemy:prev.showNewEnemy===false?true:false};saveMeta(nx);return nx;})},
 {key:"labAlertFreq",skipSuffix:true,label:(()=>{const f=meta.labAlertFreq===undefined?5:meta.labAlertFreq;return f===0?"Lab alerts: OFF":`Lab alerts: Every ${f} wave${f>1?"s":""}`;})(),get:()=>(meta.labAlertFreq===undefined?5:meta.labAlertFreq)>0,toggle:()=>setMeta(prev=>{const f=prev.labAlertFreq===undefined?5:prev.labAlertFreq;const cycle={1:5,5:10,10:0,0:1};const nx={...prev,labAlertFreq:cycle[f]??5};saveMeta(nx);return nx;})},
 {key:"hitMode",skipSuffix:true,label:(()=>{const m=meta.hitMode||(meta.showHitText===false?"off":"small");return m==="off"?"Hit numbers: OFF":m==="large"?"Hit numbers: ON (large)":"Hit numbers: ON (small)";})(),get:()=>{const m=meta.hitMode||(meta.showHitText===false?"off":"small");return m!=="off";},toggle:()=>setMeta(prev=>{const m=prev.hitMode||(prev.showHitText===false?"off":"small");const cyc={small:"large",large:"off",off:"small"};const nm=cyc[m]||"small";const nx={...prev,hitMode:nm,showHitText:nm!=="off"};saveMeta(nx);return nx;})},
 {key:"showMagnetRange",label:"Pickup range indicator",get:()=>!!meta.showMagnetRange,toggle:()=>setMeta(prev=>{const nx={...prev,showMagnetRange:!prev.showMagnetRange};saveMeta(nx);return nx;})},
 {key:"overheatAnim",label:"Overheat animation",get:()=>!meta.overheatBorderOff,toggle:()=>setMeta(prev=>{const nx={...prev,overheatBorderOff:!prev.overheatBorderOff};saveMeta(nx);return nx;})},
 {key:"showBorder",label:"Screen border",get:()=>meta.showBorder!==false,toggle:()=>setMeta(prev=>{const nx={...prev,showBorder:!prev.showBorder};saveMeta(nx);return nx;})},
{key:"affordDot",label:"Affordability dot",get:()=>meta.affordDotOff!==true,toggle:()=>setMeta(prev=>{const nx={...prev,affordDotOff:!prev.affordDotOff};saveMeta(nx);return nx;})},
{key:"epilepsy",label:"Epilepsy safety",get:()=>!!meta.epilepsySafe,toggle:()=>setMeta(prev=>{const nx={...prev,epilepsySafe:!prev.epilepsySafe};saveMeta(nx);return nx;})},
 ].map(tog=>{const isOn=tog.get();return(
 <button key={tog.key} onClick={tog.toggle}
 style={{padding:"8px 10px",width:"calc(50% - 3px)",boxSizing:"border-box",background:isOn?"#141428":"#0a0a16",border:`1px solid ${isOn?"#44ccaa66":"#33445544"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:isOn?"#88ccaa":"#667788",textAlign:"center"}}>
 {tog.skipSuffix?tog.label:`${tog.label}: ${isOn?"ON":"OFF"}`}
 </button>);})}
 </div>
 <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,margin:"20px 0 8px"}}><h3 style={{color:"#ddeeff",fontSize:11,letterSpacing:2,margin:0}}>RESOLUTION</h3></div>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,maxWidth:380,width:"100%"}}>
<div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
{[{s:1,l:"600 \u00d7 800"},{s:2,l:"1200 \u00d7 1600"},{s:3,l:"1800 \u00d7 2400"},{s:4,l:"2400 \u00d7 3200"}].map(r=>{const sel=(meta.resScale||2)===r.s;return <button key={r.s} onClick={()=>setMeta(prev=>{const nx={...prev,resScale:r.s};saveMeta(nx);return nx;})} style={{padding:"6px 10px",background:sel?"#141428":"#0a0a16",border:"1px solid "+(sel?"#44ccaa66":"#33445544"),borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:sel?"#88ccaa":"#667788"}}>{r.l}</button>;})}
</div>


</div>
<div style={{display:"flex",gap:10,marginTop:20}}>
 <button onClick={()=>setConfirmReset(true)} style={{...bs2("#ff334433"),padding:"8px 20px",fontSize:11,borderWidth:1,color:"#886666"}}>{syncCode?"DELETE ACCOUNT":"RESET ALL PROGRESS"}</button>
 </div>
 {confirmReset&&<div onClick={e=>{e.stopPropagation();setConfirmReset(false);}} style={{position:"absolute",inset:0,background:"rgba(2,2,8,0.88)",zIndex:40,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div onClick={e=>e.stopPropagation()} style={{background:"#0c0c1a",border:"2px solid #ff334466",borderRadius:8,padding:"18px 22px",maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.6)"}}><div style={{color:"#ff5566",fontSize:14,fontWeight:"bold",letterSpacing:2,marginBottom:10}}>{syncCode?"DELETE ACCOUNT":"RESET ALL PROGRESS"}</div><div style={{color:"#bbaaaa",fontSize:10,lineHeight:1.7,marginBottom:16}}>{syncCode&&meta.locked?"Unlock your account before deleting.":syncCode?"This will permanently delete your account, erase all progress, and remove you from the leaderboard. This cannot be undone.":"This will erase all Echoes, meta upgrades, ability shards, and ability upgrades permanently. This cannot be undone."}</div><div style={{display:"flex",gap:8,justifyContent:"center"}}><button onClick={()=>{if(_delTimer>0)return;if(syncCode&&meta.locked)return;if(syncCode){const _delCode=syncCodeRef.current;const f={echoes:0,levels:{},shards:0,shardsBought:0,abUpgrades:{},shipColor:"cyan",bulletColor:"teal",bossShards:0,ownedDesigns:[],shipDesign:"none",designColor:undefined,showNewEnemy:true,showHitText:true,showMagnetRange:true,highWave:0,username:_genUsername()};try{fetch(SUPABASE_URL+"/rest/v1/saves?code=eq."+_delCode,{method:"DELETE",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}).catch(()=>{});}catch(_e){}setSyncCode(null);syncCodeRef.current=null;setSyncStatus("none");setSyncCodeInput("");try{localStorage.removeItem("vs4-sync-code");localStorage.removeItem("vs4-meta");localStorage.removeItem("vs4-history");localStorage.removeItem("vs4-tut");localStorage.removeItem("vs4-lock-key");}catch(e){}setMeta(f);setConfirmReset(false);setShowTutPrompt(true);}else{const f={echoes:0,levels:{},shards:0,shardsBought:0,abUpgrades:{},shipColor:"cyan",bulletColor:"teal",bossShards:0,ownedDesigns:[],shipDesign:"none",designColor:undefined,showNewEnemy:metaRef.current.showNewEnemy,showHitText:metaRef.current.showHitText,showMagnetRange:true,highWave:0};setMeta(f);saveMeta(f);try{localStorage.removeItem("vs4-history");localStorage.removeItem("vs4-tut");}catch(e){}setConfirmReset(false);setShowTutPrompt(true);}}} disabled={_delTimer>0||!!(syncCode&&meta.locked)} style={{padding:"8px 20px",background:(_delTimer>0||(syncCode&&meta.locked))?"#1a0a0a":"#ff3344",border:"1px solid "+((_delTimer>0||(syncCode&&meta.locked))?"#55334433":"#ff4455"),borderRadius:4,fontFamily:"inherit",fontSize:11,letterSpacing:1,color:(_delTimer>0||(syncCode&&meta.locked))?"#774444":"#0c0c1a",cursor:(_delTimer>0||(syncCode&&meta.locked))?"default":"pointer",fontWeight:"bold"}}>{(syncCode&&meta.locked)?"LOCKED":_delTimer>0?("WAIT "+_delTimer+"s"):"CONFIRM DELETE"}</button><button onClick={()=>setConfirmReset(false)} style={{padding:"8px 20px",background:"none",border:"1px solid #33445544",borderRadius:4,fontFamily:"inherit",fontSize:11,letterSpacing:1,color:"#8899aa",cursor:"pointer"}}>CANCEL</button></div></div></div>}
 <button onClick={()=>{if(_returnToPauseRef.current){_setTransFrom("settings");_setTransStage("exiting");_transTimerRef.current=setTimeout(()=>{setPhase("playing");_setTransStage("idle");_setTransFrom(null);_setTransTo(null);},200);}else{goTo("menu");}}} style={{...bs2("#55667744"),marginTop:20,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>
 <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}>
 <span style={{color:"#334455",fontSize:8,letterSpacing:1}}>Version 3.0</span>
 <div onClick={()=>setShowChangelog(true)} style={{width:14,height:14,borderRadius:"50%",border:"1px solid #44667788",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:8,color:"#556688",fontWeight:"bold"}} onMouseOver={e=>{e.currentTarget.style.color="#88bbdd";e.currentTarget.style.borderColor="#88bbddaa";}} onMouseOut={e=>{e.currentTarget.style.color="#556688";e.currentTarget.style.borderColor="#44667788";}}>i</div>
 {_showAdvInfo&&(()=>{
 const _sz=(k)=>{try{const v=localStorage.getItem(k);return v?v.length:0;}catch(e){return 0;}};
 const _fmt=(n)=>n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(2)+" MB";
 const _metaSz=_sz("vs4-meta"),_histSz=_sz("vs4-history"),_tutSz=_sz("vs4-tut"),_totSz=_metaSz+_histSz+_tutSz;
 let _hist=[],_rCount=0,_rBytes=0;try{_hist=JSON.parse(localStorage.getItem("vs4-history")||"[]");_hist.forEach(e=>{if(e.replay){_rCount++;_rBytes+=JSON.stringify(e.replay).length;}});}catch(e){}
 const _syncSz=Math.max(0,_totSz-_rBytes); // approx bytes that would be uploaded (replays stripped)
 const _row=(k,v)=>(<div style={{display:"flex",justifyContent:"space-between",fontSize:9,padding:"3px 0",borderBottom:"1px solid #1a1a2e"}}><span style={{color:"#8899aa"}}>{k}</span><span style={{color:"#ccddee",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>{v}</span></div>);
 return <div onClick={()=>closePopup(_setShowAdvInfo)} style={{position:"absolute",inset:0,background:"rgba(2,2,8,0.9)",zIndex:40,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #44556677",borderRadius:6,padding:"16px 18px",maxWidth:360,width:"100%",maxHeight:"86%",overflow:"auto"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
 <div style={{color:"#99aacc",fontSize:12,fontWeight:"bold",letterSpacing:2}}>ADVANCED INFO</div>
 <button onClick={()=>closePopup(_setShowAdvInfo)} style={{background:"none",border:"1px solid #33445566",color:"#778899",fontSize:9,padding:"2px 8px",borderRadius:3,cursor:"pointer",fontFamily:"inherit"}}>CLOSE</button>
 </div>
 <div style={{color:"#667788",fontSize:8,letterSpacing:1,marginBottom:4}}>SAVE FILE</div>
 {_row("Total local size",_fmt(_totSz))}
 {_row("Progress (meta)",_fmt(_metaSz))}
 {_row("History",_fmt(_histSz))}
 {_row("Replay data (local only)",_fmt(_rBytes))}
 {_row("Cloud upload size ≈",_fmt(_syncSz))}
 <div style={{color:"#667788",fontSize:8,letterSpacing:1,margin:"12px 0 4px"}}>DATA</div>
 {_row("Runs recorded",String(_hist.length))}
 {_row("Replays stored",String(_rCount)+" / 20")}
 {_row("High wave",String(meta.highWave||0))}
 {_row("Account",syncCode?("synced #"+syncCode):"local only")}
 <div style={{color:"#667788",fontSize:8,letterSpacing:1,margin:"12px 0 4px"}}>SYSTEM</div>
 {_row("Resolution",`${GW}×${GH}`)}
 {_row("Device pixel ratio",String(window.devicePixelRatio||1))}
 {_row("Viewport",`${Math.round(window.innerWidth)}×${Math.round(window.innerHeight)}`)}
 <div style={{display:"flex",alignItems:"center",gap:8,marginTop:14,paddingTop:10,borderTop:"1px solid #1a1a2e"}}>
 <div onClick={()=>setMeta(prev=>{const nx={...prev,showFps:!prev.showFps};saveMeta(nx);return nx;})} style={{width:26,height:13,borderRadius:7,background:meta.showFps?"#44ccaa22":"#1a1a2e",border:"1px solid "+(meta.showFps?"#44ccaa66":"#33445566"),position:"relative",transition:"all 0.2s",flexShrink:0,cursor:"pointer"}}>
 <div style={{width:9,height:9,borderRadius:5,background:meta.showFps?"#44ccaa":"#556677",position:"absolute",top:1,left:meta.showFps?15:1,transition:"all 0.2s"}} />
 </div>
 <span style={{fontSize:9,color:meta.showFps?"#88ccaa":"#778899"}}>Show FPS counter{meta.showFps?" — ON":" — OFF"}</span>
 </div>
 <div style={{color:"#556677",fontSize:8,marginTop:10,lineHeight:1.5}}>Replays are stored only on this device and never uploaded — they don't count toward your cloud save size.</div>
 </div>
 </div>;})()}
 </div>
 {showChangelog&&(
 <div onClick={()=>closePopup(setShowChangelog)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} className="vs-scroll" style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:380,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
 <div style={{color:"#ccddee",fontSize:14,fontWeight:"bold",letterSpacing:2}}>CHANGELOG</div>
 <button onClick={()=>closePopup(setShowChangelog)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <button onClick={()=>setClExpanded(p=>p.v30?{}:{v30:true})} style={{width:"100%",background:"none",border:"1px solid #44ccaa55",color:"#44ccaa",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:"bold",borderRadius:3,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span>v3.0</span><span style={{fontSize:8}}>{clExpanded.v30?"▼":"►"}</span></button>{clExpanded.v30&&<div>
 <div style={{color:"#44ccaa99",fontSize:9,fontWeight:"bold",letterSpacing:1,marginBottom:4}}>NEW MODES AND SYSTEMS</div>
 <div style={{color:"#99aabb",fontSize:10,lineHeight:1.75,marginBottom:8}}>
 • Paths — a permanent upgrade tree bought with packages (▣)<br/>
 • Dealer — buff/nerf cards, plus an optional auto-dealer<br/>
 • Cargo — escort-the-train survival mode<br/>
 • Sandbox — experiment freely with any loadout<br/>
 • Bots — deployable field bots with their own upgrades<br/>
 • Overheat — push upgrades past their normal caps<br/>
 • Elites — tougher enemies that summon protected reinforcements<br/>
 • History replays — review and re-watch past runs<br/>
 </div>
 <div style={{color:"#bb99ff99",fontSize:9,fontWeight:"bold",letterSpacing:1,marginBottom:4}}>NEW LABS</div>
 <div style={{color:"#99aabb",fontSize:10,lineHeight:1.75,marginBottom:8}}>
 • Overheat Chance<br/>
 • Overheat Bot Multiplier<br/>
 • Overheat Wave Cost<br/>
 </div>
 <div style={{color:"#cc884499",fontSize:9,fontWeight:"bold",letterSpacing:1,marginBottom:4}}>QUALITY OF LIFE</div>
 <div style={{color:"#99aabb",fontSize:10,lineHeight:1.75,marginBottom:12}}>
 • 4 new backgrounds<br/>
 • Higher resolution presets<br/>
 • Affordability dots on menu buttons<br/>
 • Epilepsy safety settings<br/>
 </div>
 </div>}
 <button onClick={()=>setClExpanded(p=>p.v222?{}:{v222:true})} style={{width:"100%",background:"none",border:"1px solid #334455",color:"#778899",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
 <span>v2.2.2</span><span style={{fontSize:8}}>{clExpanded.v222?"▼":"►"}</span>
 </button>
 {clExpanded.v222&&<div style={{padding:"0 0 8px 0"}}>
 <div style={{color:"#778899",fontSize:9,lineHeight:1.8}}>
 • Account system: usernames, leaderboard, account locking<br/>
 • Smooth menu transitions and launch animation<br/>
 • Enforcer death screen with retry option<br/>
 • New lab: Sprint Currency Lifespan<br/>
 • Various balance tweaks and bug fixes<br/>
 </div>
 </div>}
 <button onClick={()=>setClExpanded(p=>p.v221?{}:{v221:true})} style={{width:"100%",background:"none",border:"1px solid #334455",color:"#778899",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
 <span>v2.2.1</span><span style={{fontSize:8}}>{clExpanded.v221?"▼":"►"}</span>
 </button>
 {clExpanded.v221&&<div style={{padding:"0 0 8px 0"}}>
 <div style={{color:"#778899",fontSize:9,lineHeight:1.8}}>
 • New lab: Sprint Currency Lifespan<br/>
 • Diffusion slot removal fixed<br/>
 • Enforcer rebalancing and sprint fixes<br/>
 • Lab cost rebalancing and UI tweaks<br/>
 </div>
 </div>}
 <button onClick={()=>setClExpanded(p=>p.v22?{}:{v22:true})} style={{width:"100%",background:"none",border:"1px solid #334455",color:"#778899",padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
 <span>v2.2</span><span style={{fontSize:8}}>{clExpanded.v22?"▼":"►"}</span>
 </button>
 {clExpanded.v22&&<div style={{padding:"8px 0 0 0"}}>
 <div style={{color:"#44ccaa88",fontSize:10,fontWeight:"bold",letterSpacing:1,marginBottom:4}}>NEW</div>
 <div style={{color:"#778899",fontSize:9,lineHeight:1.8}}>
 • Custom ship designs — unlock 15 designs with boss shards<br/>
 • Boss shards — new currency dropped by bosses<br/>
 • View your labs from the pause menu<br/>
 • Hyperecho multiplier shown in run history graph<br/>
 • Enforcer mode rebalanced — new attack patterns<br/>
 • Codex improvements<br/>
 </div>
 <div style={{color:"#cc884488",fontSize:10,fontWeight:"bold",letterSpacing:1,marginTop:6,marginBottom:4}}>FIXES</div>
 <div style={{color:"#778899",fontSize:9,lineHeight:1.8}}>
 • HyperEcho diffusion multiplier fixed<br/>
 • Sprint lab progress now works properly<br/>
 • Various UI and description fixes<br/>
 </div>
 </div>}
 </div>
 </div>
 )}
 {showShipPopup&&(
 <div onClick={()=>closePopup(setShowShipPopup)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:380,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
 <div style={{color:"#44ccaa",fontSize:15,fontWeight:"bold",letterSpacing:2}}>SHIP & BULLET COLOURS</div>
 <button onClick={()=>closePopup(setShowShipPopup)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <div style={{marginBottom:10,display:"flex",justifyContent:"center",pointerEvents:"none"}}><ShipDisplay onClick={()=>{}} size={64} /></div>
 <div style={{color:"#8899aa",fontSize:9,marginBottom:6,letterSpacing:1}}>SHIP COLOUR</div>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
 {SHIP_COLORS.map(sc=>{const sel=meta.shipColor===sc.id||(sc.id==="cyan"&&!meta.shipColor);return(
 <button key={sc.id} onClick={()=>{setMeta(prev=>{const nx={...prev,shipColor:sc.id};if(nx.designColor===sc.id){const _alt=SHIP_COLORS.find(c=>c.id!==sc.id);if(_alt)nx.designColor=_alt.id;}saveMeta(nx);return nx;});const _sc2=SHIP_COLORS.find(c=>c.id===sc.id)||SHIP_COLORS[0];if(gsRef.current)gsRef.current.shipCol=_sc2;}}
 style={{padding:"10px 6px",background:sel?"#141428":"#0a0a16",border:`2px solid ${sel?sc.color:sc.color+"33"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s"}}
 onMouseOver={e=>e.currentTarget.style.borderColor=sc.color} onMouseOut={e=>e.currentTarget.style.borderColor=sel?sc.color:sc.color+"33"}>
 <div style={{width:20,height:20,margin:"0 auto 6px",background:sc.color,borderRadius:"50%",boxShadow:`0 0 8px ${sc.glow}66`}} />
 <div style={{color:sel?sc.color:"#8899aa",fontSize:8,fontWeight:sel?"bold":"normal"}}>{sc.name}</div>
 </button>);})}
 </div>
 <div style={{color:"#8899aa",fontSize:9,marginTop:14,marginBottom:6,letterSpacing:1}}>BULLET COLOUR</div>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
 {BULLET_COLORS.map(bc=>{const sel=meta.bulletColor===bc.id||(bc.id==="teal"&&(!meta.bulletColor||meta.bulletColor==="match"));const dispCol=bc.color;return(
 <button key={bc.id} onClick={()=>{setMeta(prev=>{const nx={...prev,bulletColor:bc.id};saveMeta(nx);return nx;});if(gsRef.current){const _bcId=bc.id;if(_bcId==="match")gsRef.current.bulCol="#44ddcc";else{const _bc2=BULLET_COLORS.find(c=>c.id===_bcId);gsRef.current.bulCol=_bc2?.color||"#44ddcc";}}}}
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
 <div onClick={()=>closePopup(setShowBgPopup)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #44ccaa33",borderRadius:6,padding:"16px 14px",maxWidth:400,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
 <div style={{color:"#44ccaa",fontSize:15,fontWeight:"bold",letterSpacing:2}}>BACKGROUND</div>
 <button onClick={()=>closePopup(setShowBgPopup)} style={{background:"none",border:"1px solid #334455",color:"#8899aa",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
 {BG_DESIGNS.map(bg=>{const sel=(meta.bgDesign||"void")===bg.id;return(
 <button key={bg.id} onClick={()=>setMeta(prev=>{const nx={...prev,bgDesign:bg.id};saveMeta(nx);return nx;})}
 style={{padding:"8px 6px",background:sel?"#0a1a1a":"#08080f",border:`2px solid ${sel?"#44ddcc":"#22334433"}`,borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.2s",overflow:"hidden"}}
 onMouseOver={e=>!sel&&(e.currentTarget.style.borderColor="#44ddcc66")} onMouseOut={e=>!sel&&(e.currentTarget.style.borderColor="#22334433")}>
 <div style={{width:"100%",height:32,borderRadius:3,marginBottom:4,border:"1px solid #1a1a2e"}} ref={el=>{if(el){el.style.cssText=`width:100%;height:32px;border-radius:3px;margin-bottom:4px;border:1px solid #1a1a2e;${bg.css}`;el.className=bg.id==="galaxy"?"vs-galaxy-mini":"";}}} />
 <div style={{color:sel?"#44ddcc":"#ccddee",fontSize:8,fontWeight:sel?"bold":"normal"}}>{bg.name}</div>
 </button>);})}
 </div>
 </div>
 </div>
 )}
 </div></div>
 )}
 {phase==="dealer"&&(
 <div className={_phaseClass("dealer")} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden"}}>
 <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",position:"relative",zIndex:1,width:"100%",boxSizing:"border-box"}}>
 <h2 style={{color:"#bb77ff",fontSize:18,letterSpacing:3,margin:0}}>THE DEALER</h2>
 <p style={{color:"#ccddee",fontSize:9,marginTop:6,textAlign:"center",lineHeight:1.5,maxWidth:360}}>The Dealer reads who has been ending your recent runs. Each card <span style={{color:"#7dffc0"}}>weakens</span> an enemy that has killed you — at the price of <span style={{color:"#ff9a8a"}}>empowering</span> another. Cards last a single run.</p>
 {(()=>{const slots=meta._dealerSlots||1;const active=meta._dealerActive||[];const full=active.length>=slots;return <>
 <div style={{display:"flex",alignItems:"center",gap:8,marginTop:16,marginBottom:4}}><span style={{color:"#aa88dd",fontSize:10,letterSpacing:2}}>ACTIVE CARDS</span><span style={{color:"#667788",fontSize:9}}>{active.length}/{slots}</span></div>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:430}}>
 {[...active.map((c,ci)=>_dealerCardEl(c,ci,"active")),...Array(Math.max(0,slots-active.length)).fill(0).map((_x,pi)=>_dealerEmptySlot(pi))]}
 </div>
 <div style={{height:1,background:"#22183a",width:"90%",maxWidth:400,margin:"18px 0 10px"}} />
 <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{color:"#aa88dd",fontSize:10,letterSpacing:2}}>ON OFFER</span>{full&&<span style={{color:"#cc8855",fontSize:8}}>Slots full</span>}</div>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:460}}>
 {(_dealerOffers||[]).map((c,ci)=>{const _burning=_dealerBurn!=null;const _picked=ci===_dealerBurn;return <div key={"off"+ci} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,...(_burning?{animation:(_picked?"cardFlyUp 780ms cubic-bezier(0.4,0,0.65,1) forwards":"cardBurn 720ms ease-in forwards"),pointerEvents:"none"}:{})}}>{_dealerCardEl(c,ci,full?"locked":"offer")}{!full&&!_burning&&<button onClick={()=>_pickDealerCard(c,ci)} style={{width:128,background:"#2a1850",border:"1px solid #9955dd",color:"#cc99ff",padding:"6px 0",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:4,letterSpacing:1,boxSizing:"border-box"}} onMouseOver={e=>e.currentTarget.style.background="#3a2068"} onMouseOut={e=>e.currentTarget.style.background="#2a1850"}>PICK</button>}</div>;})}
 </div>
 
 </>;})()}
 {_dealerAuto?<button onClick={()=>{_setDealerAuto(false);initGame();}} style={{...bs2("#00e5ff"),marginTop:16,padding:"11px 26px",fontSize:13}} {...hv("#00e5ff")}>PLAY WITH THIS LOADOUT</button>:<button onClick={()=>goTo("menu")} style={{...bs2("#55667744"),marginTop:16,padding:"8px 24px",fontSize:11,borderWidth:1,color:"#8899aa"}}>← BACK</button>}
 </div></div>
 )}
 {phase==="shop"&&shopData&&(
 <div className="vs-fade" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",background:"rgba(6,6,14,0.93)",zIndex:10,overflow:"hidden"}}>
 <div style={{padding:"10px 14px",borderBottom:"1px solid #1a1a2e",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
 <div>
 <h2 style={{color:"#ccddee",fontSize:13,margin:0,letterSpacing:3}}>UPGRADE STATION</h2>{(()=>{const gs=gsRef.current;if(!gs||!has(gs,"drone"))return null;const g=gs._droneGift;if(g!==undefined&&g!==null&&!gs._droneGiftShown){gs._droneGiftShown=true;gs._droneGiftDisplay=g;}const dg=gs?._droneGiftDisplay;if(dg===undefined||dg===null)return null;const parts=[];if(dg.scrap)parts.push(`+${dg.scrap} ⬡`);if(dg.cores)parts.push(`+${dg.cores} ◆`);if(dg.plasma)parts.push(`+${dg.plasma} ✦`);if(parts.length===0)parts.push("nothing this wave");return <div style={{color:"#44ddcc",fontSize:10,marginTop:3,padding:"3px 8px",background:"#0a1a1a",border:"1px solid #44ddcc33",borderRadius:3}}>Drone gift: {parts.join(" ")}</div>;})()}
 <div style={{display:"flex",gap:10,marginTop:3,fontSize:12}}>
 <span style={{color:CUR.scrap.color}}>⬡{shopData.scrap}</span><span style={{color:CUR.cores.color}}>◆{shopData.cores}</span><span style={{color:CUR.plasma.color}}>✦{shopData.plasma}</span></div>
 </div>
 <div style={{display:"flex",gap:6}}>
 <button onClick={()=>{setShowAnalyser(false);setShowRegenAnalyser(false);setShowPainAnalyser(false);setShowStats(p=>!p);}} style={{background:"none",border:"1px solid #334455",color:showStats?"#4488ff":"#778899",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9}}>SHIP</button>
 <button onClick={()=>{setShowStats(false);setShowRegenAnalyser(false);setShowPainAnalyser(false);setShowAnalyser(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:showAnalyser?"#ff8866":"#778899"}}>DMG</button>
 <button onClick={()=>{setShowStats(false);setShowAnalyser(false);setShowPainAnalyser(false);setShowRegenAnalyser(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:showRegenAnalyser?"#44ff88":"#778899"}}>REGEN</button>
 <button onClick={()=>{setShowStats(false);setShowAnalyser(false);setShowRegenAnalyser(false);setShowPainAnalyser(p=>!p);}} style={{background:"none",border:"1px solid #334455",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:showPainAnalyser?"#ff4466":"#778899"}}>PAIN</button>
 <button onClick={()=>{setShowWiki(true);setCodexOpen({controls:false,mechanics:false,currencies:false,enemies:false,abilities:false,scrap:false,cores:false,plasma:false,meta:false,metaab:false,designs:false,labs:false,overheat:false})}} style={{background:"none",border:"1px solid #334455",color:"#778899",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",fontSize:9}}>CODEX</button>
 </div>
 </div>
 
 {showStats&&(()=>{const gs=gsRef.current;return <div className="vs-scroll" style={{padding:"8px 14px",borderBottom:"1px solid #1a1a2e",maxHeight:280,overflow:"auto",display:"flex",justifyContent:"center"}}><ShipStats metaData={meta} gsData={gs} homeMode={false} /></div>;})()}
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
 const lvl=shopData.upgrades[up.id]||0,_shopOhB=metaRef.current?.overheatUpgrades?.[up.id]||0,maxed=lvl>=up.max+_shopOhB,_defaultMaxed=lvl>=up.max,locked=up.wave>shopData.wave;
 const _owcL2=metaRef.current?.lab?.completed?.overheat_wave_cost||0;const _owcM2=Math.max(0,1-_owcL2*0.01);let cost=lvl>=up.max?Math.ceil(up.base*Math.pow(1+lvl*up.scale*3.5,up.exp)*10*Math.pow(OVERCHARGE_GROWTH,lvl-up.max)*_owcM2):Math.ceil(up.base*Math.pow(1+lvl*up.scale,up.exp));
 const canAfford=!locked&&!maxed&&shopData[up.cur]>=cost;
 const unlockedCantAfford=!locked&&!maxed&&shopData[up.cur]<cost;
 const borderCol=locked?"#14142a":maxed?"#14142a":canAfford?"#44aacc66":"#22334444";
 return(
 <button key={up.id} onClick={()=>canAfford&&buyShop(up.id)} disabled={!canAfford}
 style={{padding:"5px 6px",
 background:locked?"#06060e":maxed?(_shopOhB>0?"#0c1420":"#1a1408"):canAfford?"#0c1020":"#0a0a16",
 border:`1px solid ${maxed?(_shopOhB>0?"#88aadd33":"#ffcc4433"):borderCol}`,
 borderRadius:3,cursor:canAfford?"pointer":"default",textAlign:"left",
 opacity:locked?0.45:1,fontFamily:"inherit",transition:"all 0.15s",position:"relative",overflow:"hidden"}}
 onMouseOver={e=>canAfford&&(e.currentTarget.style.borderColor="#44ccee")}
 onMouseOut={e=>(e.currentTarget.style.borderColor=maxed?(_shopOhB>0?"#88aadd33":"#ffcc4433"):borderCol)}>
 {maxed&&<div className={_shopOhB>0?"platinum-shimmer":"gold-shimmer"}/>}{locked&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#8899aa",fontSize:9,fontWeight:"bold",zIndex:1,background:"rgba(6,6,14,0.65)",borderRadius:3}}>🔒 Wave {up.wave}</div>}
 <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:locked?"#667788":CC[up.cat],fontSize:10,fontWeight:"bold"}}>{up.name}</span><span style={{color:"#667788",fontSize:8}}>{lvl}/{up.max+_shopOhB}</span></div>
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
 {_cargoDeath&&(
 <div style={{position:"absolute",inset:0,background:"rgba(2,2,8,0.92)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"popupBgEnter 200ms ease-out both"}}>
 <div style={{background:"#0c0c1a",border:"1px solid #55cc8866",borderRadius:8,padding:"24px 28px",maxWidth:340,width:"100%",textAlign:"center",animation:"popupEnter 220ms cubic-bezier(0.22,1,0.36,1) both"}}>
 <div style={{color:"#55cc88",fontSize:18,fontWeight:"bold",letterSpacing:3,marginBottom:14}}>TRAIN DESTROYED</div>
 <div style={{color:"#ccddee",fontSize:14,marginBottom:4}}>Distance Travelled</div>
 <div style={{color:"#55cc88",fontSize:24,fontWeight:"bold",marginBottom:6}}>{_cargoDeath.distance}m</div>
 <div style={{color:"#ccaa66",fontSize:13,marginBottom:18}}>▣ {_cargoDeath.packages||0} packages earned</div>
 <div style={{display:"flex",gap:10,justifyContent:"center"}}>
 <button onClick={()=>{_setCargoDeath(null);startCargo();}} style={{...bs2("#55cc88"),padding:"8px 22px"}} {...hv("#55cc88")}>RETRY</button>
 <button onClick={()=>{_setCargoDeath(null);goTo("menu");}} style={{...bs2("#55667744"),borderWidth:1,color:"#8899aa",padding:"8px 22px"}}>MENU</button>
 </div>
 </div>
 </div>
 )}
 {_sideLockPopup&&(
 <div onClick={()=>_setSideLockPopup(null)} style={{position:"absolute",inset:0,background:"rgba(2,2,8,0.85)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"popupBgEnter 200ms ease-out both"}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0c0c1a",border:"1px solid #aa770055",borderRadius:8,padding:"22px 26px",maxWidth:340,width:"100%",textAlign:"center",animation:"popupEnter 220ms cubic-bezier(0.22,1,0.36,1) both"}}>
 <div style={{color:"#ffaa44",fontSize:15,fontWeight:"bold",letterSpacing:3,marginBottom:8}}>MODE LOCKED</div>
 <div style={{color:"#ccddee",fontSize:11,lineHeight:1.55,marginBottom:14}}>{_sideLockPopup.mode} requires a minimum of lifetime earned echoes to unlock.</div>
 <div style={{display:"flex",justifyContent:"center",alignItems:"baseline",gap:14,marginBottom:10}}>
 <div>
 <span style={{color:"#8899aa",fontSize:9,letterSpacing:1,marginRight:6}}>YOU HAVE</span>
 <span style={{color:CUR.echoes.color,fontSize:14,fontWeight:"bold",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>⬢ {(_sideLockPopup.current||0).toLocaleString()}</span>
 </div>
 <div style={{color:"#445566",fontSize:11}}>·</div>
 <div>
 <span style={{color:"#8899aa",fontSize:9,letterSpacing:1,marginRight:6}}>REQUIRED</span>
 <span style={{color:"#ffaa44",fontSize:14,fontWeight:"bold",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace"}}>⬢ {_sideLockPopup.required.toLocaleString()}</span>
 </div>
 </div>
 <div style={{color:"#667788",fontSize:9,marginBottom:12}}>{Math.max(0,_sideLockPopup.required-(_sideLockPopup.current||0)).toLocaleString()} echoes to go</div>
 <button onClick={()=>_setSideLockPopup(null)} style={{...bs2("#55667744"),borderWidth:1,color:"#aabbcc",padding:"7px 26px"}}>OK</button>
 </div>
 </div>
 )}
 {_histDetail&&(()=>{const r=_histDetail;const _has=!!r.stats;
 const _mkR=(data,label,col)=>{const ents=Object.entries(data||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);const tot=ents.reduce((s,[,v])=>s+v,0);return <div style={{marginBottom:8}}><div style={{color:col,fontSize:10,fontWeight:"bold",marginBottom:4}}>{label}</div>{ents.length===0?<div style={{color:"#556677",fontSize:9}}>None</div>:ents.map(([s,v])=>{const pct=tot>0?v/tot*100:0;return <div key={s} style={{marginBottom:3}}><div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:"#ccddee",textTransform:"capitalize"}}>{s}</span><span style={{color:"#99aabb"}}>{Math.round(v).toLocaleString()} ({Math.round(pct)}%)</span></div><div style={{height:6,background:"#14142a",borderRadius:2,marginTop:2}}><div style={{height:6,background:col+"66",borderRadius:2,width:pct+"%"}} /></div></div>;})}</div>;};
 const _mkPR=(hpD,shD,label)=>{const allS=new Set([...Object.keys(hpD||{}),...Object.keys(shD||{})]);const ents=[...allS].map(s=>({s,hp:hpD?.[s]||0,sh:shD?.[s]||0,t:(hpD?.[s]||0)+(shD?.[s]||0)})).filter(e=>e.t>0).sort((a,b)=>b.t-a.t);const gt=ents.reduce((a,e)=>a+e.t,0);return <div style={{marginBottom:8}}><div style={{color:"#ff4466",fontSize:10,fontWeight:"bold",marginBottom:4}}>{label}</div>{ents.length===0?<div style={{color:"#556677",fontSize:9}}>No damage taken</div>:ents.map(e=>{const pct=gt>0?e.t/gt*100:0;return <div key={e.s} style={{marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between",fontSize:9}}><span style={{color:"#ccddee",textTransform:"capitalize"}}>{e.s}</span><span style={{color:"#99aabb"}}>{Math.round(e.hp)}HP{e.sh>0?` + ${Math.round(e.sh)} Shield`:""} ({Math.round(pct)}%)</span></div><div style={{height:7,background:"#14142a",borderRadius:2,marginTop:2,overflow:"hidden"}}><div style={{height:7,width:pct+"%",display:"flex",overflow:"hidden",borderRadius:2}}><div style={{height:7,background:"#ff446666",flex:e.hp}} />{e.sh>0&&<div style={{height:7,background:"#44aaff66",flex:e.sh}} />}</div></div></div>;})}</div>;};
 const _p=_histPanel;
 const _tabBtn=(id,txt,col)=>(<button onClick={()=>_setHistPanel(_p===id?null:id)} style={{background:"none",border:"1px solid #334455",padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:9,color:_p===id?col:"#778899",borderRadius:3}}>{txt}</button>);
 return <div onClick={()=>{_setPopupClosing(true);setTimeout(()=>{_setHistDetail(null);_setHistPanel(null);_setPopupClosing(false);},170);}} style={{position:"absolute",inset:0,background:"rgba(2,2,8,0.92)",zIndex:35,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
 <div onClick={e=>e.stopPropagation()} className="vs-scroll" style={{background:"#0a0a18",animation:_popupClosing?"popupExit 170ms ease-in forwards":"popupEnter 200ms cubic-bezier(0.22,1,0.36,1) both",border:"1px solid #44556677",borderRadius:6,padding:"14px 16px",maxWidth:420,width:"100%",maxHeight:"86%",overflow:"auto",fontSize:10}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8}}>
 <div><div style={{color:"#99aacc",fontSize:13,fontWeight:"bold",letterSpacing:2}}>RUN DETAIL</div><div style={{color:"#667788",fontSize:8,marginTop:2}}>{new Date(r.date).toLocaleString()} · <span style={{color:r.forfeited?"#cc8899":"#ee8866"}}>{r.cause}</span></div></div>
 <button onClick={()=>{_setPopupClosing(true);setTimeout(()=>{_setHistDetail(null);_setHistPanel(null);_setPopupClosing(false);},170);}} style={{background:"none",border:"1px solid #33445566",color:"#778899",fontSize:9,padding:"2px 8px",borderRadius:3,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>CLOSE</button>
 </div>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
 <div style={{background:"#0e0e1a",padding:5,borderRadius:3,textAlign:"center"}}><div style={{color:"#667788",fontSize:7,letterSpacing:1}}>WAVE</div><div style={{color:"#ccddee",fontSize:13,fontWeight:"bold"}}>{r.wave}</div></div>
 <div style={{background:"#0e0e1a",padding:5,borderRadius:3,textAlign:"center"}}><div style={{color:"#667788",fontSize:7,letterSpacing:1}}>KILLS</div><div style={{color:"#ccddee",fontSize:13,fontWeight:"bold"}}>{r.kills}</div></div>
 <div style={{background:"#0e0e1a",padding:5,borderRadius:3,textAlign:"center"}}><div style={{color:"#667788",fontSize:7,letterSpacing:1}}>ECHOES</div><div style={{color:CUR.echoes.color,fontSize:13,fontWeight:"bold"}}>⬢{r.echoes}</div></div>
 </div>
 <div style={{marginBottom:10,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><button disabled={!r.replay} onClick={r.replay?()=>{_setHistDetail(null);_setHistPanel(null);_startReplay(r.replay);}:undefined} style={{...bs2("#ffaa44"),padding:"6px 16px",fontSize:10,opacity:r.replay?1:0.4,cursor:r.replay?"pointer":"default",borderColor:r.replay?"#ffaa44":"#55556655",color:r.replay?"#ffaa44":"#778899"}} {...(r.replay?hv("#ffaa44"):{})}>▶ REPLAY LAST WAVE</button><div style={{color:"#667788",fontSize:8,fontStyle:"italic"}}>{r.replay?"Replays are saved locally only.":r.forfeited?"Forfeited runs don't save a replay.":"No replay saved for this run."}</div></div>
 {_has?<>
 <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:10,flexWrap:"wrap"}}>
 {_tabBtn("dmg","DMG analyser","#ff8866")}
 {_tabBtn("regen","REGEN analyser","#44ff88")}
 {_tabBtn("pain","PAIN analyser","#ff4466")}
 </div>
 {_p==="dmg"&&<>{_mkR(r.stats.waveDmg,"Final Wave","#ff8866")}{_mkR(r.stats.dmg,"Entire Run","#ff8866")}</>}
 {_p==="regen"&&<>{_mkR(r.stats.waveHeal,"Final Wave","#44ff88")}{_mkR(r.stats.heal,"Entire Run","#44ff88")}</>}
 {_p==="pain"&&<>{_mkPR(r.stats.wavePain,r.stats.waveShieldPain,"Final Wave")}{_mkPR(r.stats.pain,r.stats.shieldPain,"Entire Run")}</>}
 </>:<div style={{color:"#778899",fontSize:10,textAlign:"center",padding:"24px 12px",fontStyle:"italic"}}>No data was recorded for this run.</div>}
 </div>
 </div>;})()}
 {_enforcerDeath&&(()=>{const _ed=_enforcerDeath;const _en=(_ed.enemy||"enemy").charAt(0).toUpperCase()+(_ed.enemy||"enemy").slice(1);const _win=_ed.defeated;const _col=_win?"#ff5577":"#ffaa44";return(
 <div style={{position:"absolute",inset:0,background:"rgba(2,2,8,0.92)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"popupBgEnter 200ms ease-out both"}}>
 <div style={{background:"#0c0c1a",border:"1px solid "+_col+"66",borderRadius:8,padding:"24px 28px",maxWidth:340,width:"100%",textAlign:"center",animation:"popupEnter 220ms cubic-bezier(0.22,1,0.36,1) both"}}>
 <div style={{color:_col,fontSize:18,fontWeight:"bold",letterSpacing:3,marginBottom:6}}>{_win?"ENFORCER DEFEATED":"DEFEATED"}</div>
 <div style={{color:"#ccddee",fontSize:12,marginBottom:14}}>{_en} Enforcer</div>
 <div style={{color:"#8899aa",fontSize:13,marginBottom:4}}>Time Survived</div>
 <div style={{color:_col,fontSize:24,fontWeight:"bold",marginBottom:18}}>{_ed.survived}s{_win?" \u00b7 CLEARED":""}</div>
 <div style={{display:"flex",gap:10,justifyContent:"center"}}>
 <button onClick={()=>{_setEnforcerDeath(null);startPlayground(_ed.enemy,true);}} style={{...bs2(_col),padding:"8px 22px"}} {...hv(_col)}>RETRY</button>
 <button onClick={()=>{_setEnforcerDeath(null);goTo("menu");}} style={{...bs2("#55667744"),borderWidth:1,color:"#8899aa",padding:"8px 22px"}}>MENU</button>
 </div>
 </div>
 </div>
 );})()}
 {phase==="cargo"&&(
 <div className={_phaseClass("cargo")} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:10,textAlign:"center"}}>
 <h2 style={{color:"#55cc88",fontSize:20,letterSpacing:4,margin:0}}>CARGO RUN</h2>
 <div style={{color:"#8899aa",fontSize:10,lineHeight:1.7,maxWidth:340,marginTop:12,marginBottom:6}}>Protect the train as it travels through the void. Enemies teleport in to attack the carriages — keep them alive as long as possible.</div>
 <div style={{color:"#556677",fontSize:9,marginTop:4}}>Engine + 4 carriages · 150 HP each</div>
 <div style={{display:"flex",gap:10,marginTop:16}}>
 <button onClick={()=>{
 startCargo();
 }} style={bs2("#55cc88")} {...hv("#55cc88")}>LAUNCH</button>
 <button onClick={()=>goTo("menu")} style={{...bs2("#44556644"),borderWidth:1,color:"#778899"}}>BACK</button>
 </div>
 </div>
 )}
 {phase==="dead"&&deathData&&(()=>{const _newMU=(()=>{const _nt=meta.totalEchoesEarned||0;const _ot=_nt-(deathData.echoesEarned||0);return [[100,"PLAYGROUND"],[250,"PRACTISE"],[500,"PHANTOM"],[1000,"CARGO"],[1500,"DEALER"]].filter(x=>_ot<x[0]&&_nt>=x[0]).map(x=>x[1]);})();const _hasMU=_newMU.length>0;return (
 <div className={deathData.cause==="Self"?"":"vs-fade"} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(6,6,14,0.9)",zIndex:10}}>
 <h2 style={{color:"#ff3355",fontSize:24,letterSpacing:4,margin:0}}>VOID CLAIMED</h2>{_hasMU&&<div style={{color:"#44ddaa",fontSize:12,fontWeight:"bold",letterSpacing:1,marginTop:8,textShadow:"0 0 8px #44ddaa88"}}>New gamemode available!</div>}
 <div style={{color:"#667788",fontSize:10,marginTop:8}}>Killed by: <span style={{color:"#cc8899"}}>{deathData.cause}</span></div>
 <div style={{color:"#8899aa",fontSize:12,marginTop:16,textAlign:"center",lineHeight:2.2}}>
 Waves: <span style={{color:"#dde"}}>{deathData.wave}</span> · Kills: <span style={{color:"#dde"}}>{deathData.kills}</span>
 <div style={{color:CUR.echoes.color,marginTop:6,fontSize:15}}>+{deathData.echoesEarned} Echoes</div>{(gsRef.current?._overheatPoints||0)>0&&<div style={{color:"#ff6622",marginTop:1,fontSize:12}}>+{gsRef.current._overheatPoints} Overheat</div>}</div>
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
 <button onClick={()=>{if(!_hasMU)goTo("metashop");}} style={{...bs2(_hasMU?"#44445533":"#bb77ff"),position:"relative",opacity:_hasMU?0.45:1,cursor:_hasMU?"default":"pointer"}} {...(_hasMU?{}:hv("#bb77ff"))}>META{!_hasMU&&_dotsOn&&_affordMeta().any&&<span style={_affDotBig} />}</button>
 <button onClick={()=>{if(!_hasMU)_startMainRun();}} style={{...bs2(_hasMU?"#33445522":"#00e5ff"),opacity:_hasMU?0.45:1,cursor:_hasMU?"default":"pointer"}} {...(_hasMU?{}:hv("#00e5ff"))}>RETRY</button>
 <button onClick={()=>{if(_hasMU)_setModeUnlock(_newMU);goTo("menu");}} style={{...bs2("#55667744"),borderWidth:1,color:"#8899aa",padding:"10px 20px"}}>MENU</button></div>
 </div>
 );})()}
 {phase==="metashop"&&(
 <div className={_phaseClass("metashop")} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",zIndex:10,overflow:"hidden"}}>
 <div style={{padding:"12px 14px 6px",borderBottom:"1px solid #1a1a2e",position:"relative",zIndex:1}}>
 <h2 style={{color:CUR.echoes.color,fontSize:15,margin:0,letterSpacing:3}}>META UPGRADES</h2>
 <div style={{display:"flex",gap:10,alignItems:"center",marginTop:3}}>
 <span style={{color:CUR.echoes.color,fontSize:13}}>⬢ {meta.echoes} Echoes</span>
 {metaTab==="abilities"&&<span style={{color:"#44ddcc",fontSize:11}}><span style={{fontSize:13}}>◈</span> {meta.shards||0} Shards</span>}
{metaTab==="overheat"&&<span style={{color:"#ff6622",fontSize:11}}><span style={{fontSize:13}}>✹</span> {meta.overheat||0} Overheat</span>}
 </div>
 <div style={{display:"flex",gap:4,marginTop:8}}>
 <button onClick={()=>{(()=>{_setMetaTabFrom(metaTab);setMetaTab("ship");})();setAbInfoId(null);}} style={{padding:"5px 9px",background:metaTab==="ship"?"#1a1a2e":"transparent",borderTop:`1px solid ${metaTab==="ship"?"#bb77ff66":"#33445544"}`,borderLeft:`1px solid ${metaTab==="ship"?"#bb77ff66":"#33445544"}`,borderRight:`1px solid ${metaTab==="ship"?"#bb77ff66":"#33445544"}`,borderBottom:"none",borderRadius:"4px 4px 0 0",color:metaTab==="ship"?"#bb99ff":"#667788",fontSize:8.5,cursor:"pointer",fontFamily:"inherit",position:"relative"}}>Ship Upgrades{_dotsOn&&_affordMeta().ship&&<span style={_affDot} />}</button>
 {tutStep===9||tutStep===10?<button style={{padding:"5px 14px",background:"transparent",borderTop:"1px solid #22223344",borderLeft:"1px solid #22223344",borderRight:"1px solid #22223344",borderBottom:"none",borderRadius:"4px 4px 0 0",color:"#334455",fontSize:10,fontFamily:"inherit",cursor:"default"}}>Ability Upgrades</button>
 :<button onClick={()=>{(()=>{_setMetaTabFrom(metaTab);setMetaTab("abilities");})();setAbInfoId(null);}} style={{padding:"5px 9px",background:metaTab==="abilities"?"#1a1a2e":"transparent",borderTop:`1px solid ${metaTab==="abilities"?"#44ddcc66":"#33445544"}`,borderLeft:`1px solid ${metaTab==="abilities"?"#44ddcc66":"#33445544"}`,borderRight:`1px solid ${metaTab==="abilities"?"#44ddcc66":"#33445544"}`,borderBottom:"none",borderRadius:"4px 4px 0 0",color:metaTab==="abilities"?"#44ddcc":"#667788",fontSize:8.5,cursor:"pointer",fontFamily:"inherit",position:"relative"}}>Ability Upgrades{_dotsOn&&_affordMeta().abilities&&<span style={_affDot} />}</button>}
 <button onClick={()=>{(()=>{_setMetaTabFrom(metaTab);setMetaTab("lab");})();setAbInfoId(null);}} style={{padding:"5px 9px",background:metaTab==="lab"?"#1a1a2e":"transparent",borderTop:`1px solid ${metaTab==="lab"?"#ff884466":"#33445544"}`,borderLeft:`1px solid ${metaTab==="lab"?"#ff884466":"#33445544"}`,borderRight:`1px solid ${metaTab==="lab"?"#ff884466":"#33445544"}`,borderBottom:"none",borderRadius:"4px 4px 0 0",color:metaTab==="lab"?"#ff9966":"#667788",fontSize:8.5,cursor:"pointer",fontFamily:"inherit",position:"relative"}}>Lab Upgrades{_dotsOn&&_affordMeta().lab&&<span style={_affDot} />}</button>
 <button onClick={()=>{(()=>{_setMetaTabFrom(metaTab);setMetaTab("bots");})();setAbInfoId(null);}} style={{padding:"5px 9px",background:metaTab==="bots"?"#1a1a2e":"transparent",borderTop:`1px solid ${metaTab==="bots"?"#4d9fff66":"#33445544"}`,borderLeft:`1px solid ${metaTab==="bots"?"#4d9fff66":"#33445544"}`,borderRight:`1px solid ${metaTab==="bots"?"#4d9fff66":"#33445544"}`,borderBottom:"none",borderRadius:"4px 4px 0 0",color:metaTab==="bots"?"#4d9fff":"#667788",fontSize:8.5,cursor:"pointer",fontFamily:"inherit",position:"relative"}}>Bot Upgrades{_dotsOn&&_affordMeta().bots&&<span style={_affDot} />}</button>
<button onClick={()=>{(()=>{_setMetaTabFrom(metaTab);setMetaTab("overheat");})();setAbInfoId(null);}} style={{padding:"5px 9px",background:metaTab==="overheat"?"#1a1a2e":"transparent",borderTop:`1px solid ${metaTab==="overheat"?"#ff662266":"#33445544"}`,borderLeft:`1px solid ${metaTab==="overheat"?"#ff662266":"#33445544"}`,borderRight:`1px solid ${metaTab==="overheat"?"#ff662266":"#33445544"}`,borderBottom:"none",borderRadius:"4px 4px 0 0",color:metaTab==="overheat"?"#ff6622":"#667788",fontSize:8.5,cursor:"pointer",fontFamily:"inherit",position:"relative"}}>Overheat Upgrades{_dotsOn&&_affordMeta().overheat&&<span style={_affDot} />}</button>
 </div>
 </div>
 <div key={metaTab} style={{flex:"1 1 0",minHeight:0,display:"flex",flexDirection:"column",animation:(_transStage==="exiting"&&_transFrom==="metashop")?undefined:((()=>{const _tabs=["ship","abilities","lab","bots","overheat"];const _ci=_tabs.indexOf(metaTab);const _pi=_tabs.indexOf(_metaTabFrom||metaTab);return _ci>_pi?"tabSlideRight":"tabSlideLeft";})()+" 200ms cubic-bezier(0.22,1,0.36,1) both")}}>
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
 const shardCost=(()=>{const n=bought;return Math.ceil(100*Math.pow(1+n*0.12,1.6)+(n>15?Math.pow(n-15,1.8)*0.8:0)+(n>30?Math.pow(n-30,1.5)*2.5:0));})();
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
 <div style={{color:"#667788",fontSize:8}}>You have: <span style={{color:"#44ddcc"}}>{shards}</span> · Purchased: {bought} · Left to max: <span style={{color:shardsLeft>0?"#cc8855":"#44ddcc"}}>{shardsLeft}</span> · Cost to max: <span style={{color:CUR.echoes.color}}>{(()=>{let c=0;const b2=meta.shardsBought||0;for(let i=0;i<shardsLeft;i++){const n=b2+i;c+=Math.ceil(100*Math.pow(1+n*0.12,1.6)+(n>15?Math.pow(n-15,1.8)*0.8:0)+(n>30?Math.pow(n-30,1.5)*2.5:0));}return c;})()}⬢</span></div></div>
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
 const _abDescs=AB_DESCS; const _abDescsOld={orbitals_sub1:"Increase the number of electrons by 2.",orbitals_sub2:"Hitting an enemy with any electron deals 30% damage, once per enemy. Marked enemies burn blue and take double flame damage.",orbitals_mastery:"Gain another layer of 4 electrons, that travel in an elliptical orbit.",chain_sub1:"Chain lightning now targets 4 enemies.",chain_sub2:"The original target of the chain lightning gets electrocuted and it receives 60% of damage.",chain_mastery:"Echo Clone, Seeker Swarm and Combat Drone now apply a green chain lightning: it targets 4 enemies for every 3rd successful hit, dealing 25% damage on arc and 40% damage on electrocution.",homing_sub1:"Fires missiles every second.",homing_sub2:"Missiles now have a 15% chance to be critical, dealing 2.5x damage.",homing_mastery:"Missiles activate a burning bomb on hit with a radius of 6 that applies burn that does 10% dmg/s for 5 seconds.",slowfield_sub1:"Increase radius to 18.",slowfield_sub2:"The field effects the max pickup range, causing it to expand to 1.25x what it usually is, before contracting to its regular size, repeating continuously over 6s cycles.",slowfield_mastery:"Slows down bomber enemies that enter your Temporal Drag at the same rate that bullets are slowed down, and any bombers killed in the Temporal Drag will only release half the amount of bullets.",mirror_sub1:"Make the clone have the same fire rate as your main ship.",mirror_sub2:"Currency drops can be picked up by the clone if it directly collides with them.",mirror_mastery:"Every 12 seconds, the clone unleashes a lasso, that winds up for 2 seconds before launching at the most dense group of enemies and moves them away from you, of a radius of 10 and lasts for 4 seconds. Captured enemies cannot attack.",drone_sub1:"If you take HP damage from an enemy, your drone gets mad at it, firing at 2x firing rate. It will solely target that enemy until it is dead.",drone_sub2:"Adds 3% to its damage percentage compared to your main weapon for every other ability you own.",drone_mastery:"Gives you a gift after every wave equal to half of all the pickups you failed to pick up during the wave, rounded up to the nearest integer. Does not activate during intro sprint.",gravity_sub1:"Bullets that are in the gravity well get smaller by 4% every second, for a maximum of 32% size reduction.",gravity_sub2:"The vortex gets a second, conjoined vortex with a radius of 7 that has its own gravitational pull.",gravity_mastery:"Every other time a vortex is activated, it turns golden, and any enemies killed in those golden vortexes drop double the currency.",overcharge_sub1:"Max overcharge amount is increased to 140% of max health.",overcharge_sub2:"Plasma pickups now heal 6 HP instead of 3.",overcharge_mastery:"Overcharge now persists between waves, with a limit of 110% of max health.",blackhole_sub1:"Increase bullets removed to 50%.",blackhole_sub2:"Sniper bullets will be removed first, and any snipers about to fire will have their attack fail.",blackhole_mastery:"Ability will be triggered on shield loss as well as HP damage.",void_regen_sub1:"Increase the max that can be regenerated to 90% of max health (without Overcharge active).",void_regen_sub2:"If you kill at least 1 enemy whilst waiting for void regen to start, the windup time is reduced to 3 seconds.",void_regen_mastery:"Taking no damage for an entire wave grants a golden shield with invincibility frames. Golden shields persist between waves but when lost are lost forever. Maximum of 5 golden shields.",ricochet_sub1:"Bullets that ricochet receive a random small angle offset.",ricochet_sub2:"Bullets can hit one more wall before being destroyed.",ricochet_mastery:"When a ricocheted bullet hits an enemy, it performs a rage slice with a length of 12, dealing 200% damage to the first enemy it hits and 120% damage to all others.",nova_sub1:"Increase the physical size of the landmine by 60%, making it easier for enemies to trigger.",nova_sub2:"Landmines deal 4x damage to any bosses that are damaged by the landmine.",nova_mastery:"Landmines persist after waves instead of being cleared."};
 const boxStyle=(owned,canBuy)=>({flex:1,minHeight:56,padding:"10px 8px",background:owned?"#0e1a1a":canBuy?"#0c0c1a":"#08080f",border:`1px solid ${owned?"#44ddcc55":canBuy?"#44ddcc33":"#22223344"}`,borderRadius:3,cursor:canBuy&&!owned?"pointer":"default",textAlign:"center",fontFamily:"inherit",opacity:owned?1:canBuy?0.9:0.4,transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"});
 return <div key={ab.id} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 8px",background:allOwned?"#1a1408":"#0a0a14",borderRadius:3,border:`1px solid ${allOwned?"#ffcc4466":"#14142a"}`,boxShadow:allOwned?"0 0 12px #ffcc4418, inset 0 0 8px #ffcc4408":"none",transition:"all 0.3s",position:"relative",overflow:"hidden",flexShrink:0}}>
 {allOwned&&<div className="gold-shimmer"/>}
 {}
 <div style={{width:82,flexShrink:0}}>
 <div style={{color:"#ccddee",fontSize:10,fontWeight:"bold",display:"flex",alignItems:"center",gap:3}}><AbilityIcon id={ab.id} size={14} color="#ccddee" />{ab.name}</div>
 <div onClick={(e)=>{e.stopPropagation();setAbInfoId(abInfoId===ab.id?null:ab.id);}} style={{color:"#44667788",fontSize:9,cursor:"pointer",marginTop:3,display:"inline-flex",alignItems:"center",gap:3}}
 onMouseOver={e=>e.currentTarget.style.color="#6688aa"} onMouseOut={e=>e.currentTarget.style.color="#44667788"}>
 <span style={{display:"inline-block",width:13,height:13,borderRadius:"50%",border:"1px solid currentColor",textAlign:"center",lineHeight:"12px",fontSize:8}}>i</span>
 </div>
 </div>
 {}
 <div style={{flex:1,display:"flex",alignItems:"center",gap:5}}>
 {}
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
 {}
 <div style={{color:s1&&s2?"#44ddcc66":"#22334444",fontSize:14,flexShrink:0,width:18,textAlign:"center"}}>→</div>
 {}
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
 {}
 {abInfoId&&(()=>{const ab=ABILITIES.find(a=>a.id===abInfoId);if(!ab)return null;return(
 <div onClick={()=>setAbInfoId(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
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
 if(newActive[slotIdx]){newSaved[newActive[slotIdx].id]=newActive[slotIdx].wavesProgress||0;}
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
 {}
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
 <button onClick={()=>canBuy&&buySlot(slotIdx)} style={{width:"100%",padding:"28px 14px",background:"#0a0a14",borderTop:"none",border:"none",cursor:canBuy?"pointer":"default",fontFamily:"inherit",textAlign:"center",opacity:canBuy?1:0.55}}>
 <div style={{color:"#aabbcc",fontSize:12,fontWeight:"bold"}}>Unlock {slotIdx===0?"Lab":"slot "+(slotIdx+1)}</div>
 <div style={{color:canBuy?CUR.echoes.color:"#667788",fontSize:11,marginTop:4}}>⬢ {LAB_SLOT_COSTS[slotIdx]}</div>
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
 <div style={{color:"#778899",fontSize:8,marginTop:4}}>{research.wavesProgress}/{research.wavesNeeded} waves{(()=>{const _lu=LAB_UPGRADES.find(l=>l.id===research.id);if(!_lu)return null;const _curLvl=completedLevels[research.id]||0;if(lu?.id==="boss_shard_drop")return ` · ${_curLvl===0?0:lu.levels[_curLvl-1]?.pct||0}% → ${lu.levels[_curLvl]?.pct||0}%`;if(lu?.id==="intro_sprint")return ` · ${_curLvl===0?0:lu.levels[_curLvl-1]?.pct||0}% → ${lu.levels[_curLvl]?.pct||0}%`;if(lu?.id==="sprint_efficiency")return ` · ${_curLvl===0?30:lu.levels[_curLvl-1]?.pct||0}% → ${lu.levels[_curLvl]?.pct||0}%`;if(lu?.id==="cheaper_respec")return ` · -${_curLvl===0?0:lu.levels[_curLvl-1]?.reduce||0}⬢ → -${lu.levels[_curLvl]?.reduce||0}⬢`;if(lu?.id==="phantom_enhance")return ` · +${(_curLvl===0?'0.000':(_curLvl*0.001).toFixed(3))} → +${((_curLvl+1)*0.001).toFixed(3)}`;if(lu?.id==="practise_enhance")return ` · +${(_curLvl===0?'0.000':(_curLvl*0.001).toFixed(3))} → +${((_curLvl+1)*0.001).toFixed(3)}`;if(lu?.id==="sprint_currency_lifespan")return ` · ${_curLvl+1} → ${_curLvl+2} waves`;if(lu?.id==="diffusion_chance")return ` · ${_curLvl===0?0:lu.levels[_curLvl-1]?.pct||0}% → ${lu.levels[_curLvl]?.pct||0}%`;if(lu?.id==="diffusion_multi")return ` · +${(_curLvl===0?'0.000':(_curLvl*0.009).toFixed(3))} → +${((_curLvl+1)*0.009).toFixed(3)}`;if(lu?.id==="overheat_bot_mult")return ` · +${_curLvl} → +${_curLvl+1} overheat`;if(lu?.id==="overheat_wave_cost")return ` · -${_curLvl}% → -${_curLvl+1}%`;if(lu?.id==="overheat_chance")return ` · ${_curLvl===0?25:lu.levels[_curLvl-1]?.pct||0}% → ${lu.levels[_curLvl]?.pct||0}%`;return null;})()}</div>
 </button>
 )}
 </div>;
 })}
 </div>;
 })()}
{metaTab==="bots"&&(()=>{
 const owned=meta.bots||{};const ownedCount=Object.keys(owned).length;
 const unlockCost=BOT_UNLOCK[Math.min(ownedCount,BOT_UNLOCK.length-1)];
 const statVal=(def,lv,stat)=>{const l=lv[stat]||0;if(stat==="size")return (5+l*0.5).toFixed(1);if(stat==="time")return (2+l*0.5).toFixed(1)+"s";return def.custom.fmt(botCustomRaw(def,lv));};
 const STK=[{k:"size",name:"Field Size"},{k:"time",name:"Active Time"}];
 const boxStyle=(maxed,canBuy,col)=>({flex:1,minHeight:64,padding:"8px 5px",background:maxed?"#1a1408":canBuy?"#0c0c1a":"#08080f",border:`1px solid ${maxed?"#ffcc4455":canBuy?col+"44":"#22223344"}`,borderRadius:3,cursor:canBuy&&!maxed?"pointer":"default",textAlign:"center",fontFamily:"inherit",opacity:maxed?1:canBuy?0.95:0.5,transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,position:"relative",overflow:"hidden",boxSizing:"border-box"});
 return <>
 <div style={{padding:"6px 10px",borderBottom:"1px solid #1a1a2e"}}>
 <div style={{padding:"8px 10px",background:"#0a0a1a",border:"1px solid #44cc9922",borderRadius:4}}>
 <div style={{color:"#55ddaa",fontSize:11,fontWeight:"bold"}}>Bots</div>
 <div style={{color:"#778899",fontSize:8,marginTop:2}}>Drifting fields that periodically expand to affect enemies inside them. Active in all modes except Cargo. Each bot has three upgrade tracks.</div>
 <div style={{color:"#667788",fontSize:8,marginTop:2}}>Owned: {ownedCount}/{BOTS.length} · Cost to max all: <span style={{color:CUR.echoes.color}}>⬢ {(()=>{let _t=0;let _o=ownedCount;BOTS.forEach(d=>{if(!owned[d.id]){_t+=BOT_UNLOCK[Math.min(_o,BOT_UNLOCK.length-1)];_o++;}});BOTS.forEach(d=>{const _l=owned[d.id]||{size:0,time:0,custom:0};["size","time","custom"].forEach(k=>{for(let i=(_l[k]||0);i<20;i++)_t+=botUpCost(i);});});return _t.toLocaleString();})()}</span></div>
 </div>
 </div>
 <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,padding:10,overflow:"auto",display:"flex",flexDirection:"column",gap:6}}>
 {BOTS.map(def=>{const lv=owned[def.id];
  const allMax=lv&&["size","time","custom"].every(k=>(lv[k]||0)>=20);
  if(!lv){const canAfford=(meta.echoes||0)>=unlockCost;
   return <div key={def.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 8px",background:"#0a0a14",borderRadius:3,border:"1px solid #14142a",flexShrink:0,minHeight:96,boxSizing:"border-box"}}>
    <div style={{width:84,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
     <canvas width={120} height={120} style={{width:34,height:34}} ref={el=>{if(el){const cx=el.getContext("2d");if(cx){cx.setTransform(3,0,0,3,0,0);cx.clearRect(0,0,40,40);cx.globalAlpha=1;_drawBotIcon(cx,def.id,20,20,13,"#556677");}}}} />
     <div style={{color:"#8899aa",fontSize:9,fontWeight:"bold",textAlign:"center",lineHeight:1.15}}>{def.name}</div>
     <div onClick={()=>_setBotInfo(_botInfo===def.id?null:def.id)} style={{width:13,height:13,borderRadius:"50%",border:"1px solid #44667788",textAlign:"center",lineHeight:"12px",fontSize:8,color:"#667788",cursor:"pointer"}}>i</div>
    </div>
    <div style={{flex:1,display:"flex",justifyContent:"center"}}>
     <button onClick={()=>canAfford&&buyBotUnlock(def.id)} disabled={!canAfford} style={{...boxStyle(false,canAfford,def.col),maxWidth:180}}>
      <div style={{color:canAfford?def.col:"#667788",fontSize:11,fontWeight:"bold",letterSpacing:1}}>🔒 UNLOCK</div>
      <div style={{color:"#ccddee",fontSize:9,marginTop:2}}><span style={{color:CUR.echoes.color}}>⬢</span> {unlockCost.toLocaleString()}</div>
     </button>
    </div>
   </div>;}
  const stats=[...STK,{k:"custom",name:def.custom.label}];
  return <div key={def.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 8px",background:allMax?"#1a1408":"#0a0a14",borderRadius:3,border:`1px solid ${allMax?"#ffcc4466":"#14142a"}`,boxShadow:allMax?"0 0 12px #ffcc4418, inset 0 0 8px #ffcc4408":"none",position:"relative",overflow:"hidden",flexShrink:0,minHeight:96,boxSizing:"border-box"}}>
   {allMax&&<div className="gold-shimmer"/>}
   <div style={{width:84,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3,zIndex:1}}>
    <canvas width={120} height={120} style={{width:34,height:34}} ref={el=>{if(el){const cx=el.getContext("2d");if(cx){cx.setTransform(3,0,0,3,0,0);cx.clearRect(0,0,40,40);cx.globalAlpha=1;_drawBotIcon(cx,def.id,20,20,13,def.col);}}}} />
    <div style={{color:def.col,fontSize:9,fontWeight:"bold",textAlign:"center",lineHeight:1.15}}>{def.name}</div>
    <div onClick={()=>_setBotInfo(_botInfo===def.id?null:def.id)} style={{width:13,height:13,borderRadius:"50%",border:"1px solid #44667788",textAlign:"center",lineHeight:"12px",fontSize:8,color:"#667788",cursor:"pointer"}}>i</div>
   </div>
   <div style={{flex:1,display:"flex",gap:5,zIndex:1}}>
    {stats.map(st=>{const l=lv[st.k]||0;const maxed=l>=20;const cost=botUpCost(l);const canAfford=(meta.echoes||0)>=cost;return <button key={st.k} onClick={()=>!maxed&&canAfford&&buyBotStat(def.id,st.k)} disabled={maxed||!canAfford} style={boxStyle(maxed,canAfford,def.col)}>
     {maxed&&<div className="gold-shimmer"/>}
     <div style={{color:"#8899aa",fontSize:8,zIndex:1,lineHeight:1.1}}>{st.name}</div>
     <div style={{color:maxed?"#ffcc44":def.col,fontSize:13,fontWeight:"bold",zIndex:1}}>{statVal(def,lv,st.k)}</div>
     <div style={{color:"#556677",fontSize:7,zIndex:1}}>+{l}/20</div>
     <div style={{color:maxed?"#ffcc44":canAfford?def.col:"#554433",fontSize:8.5,marginTop:1,zIndex:1}}>{maxed?"MAX":<><span style={{color:CUR.echoes.color}}>⬢</span>{cost.toLocaleString()}</>}</div>
    </button>;})}
   </div>
  </div>;
 })}
 {_botInfo&&(()=>{const def=BOTS.find(b=>b.id===_botInfo);if(!def)return null;return <div onClick={()=>_setBotInfo(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:30,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
  <div onClick={e=>e.stopPropagation()} style={{background:"#0c0c1a",border:`1px solid ${def.col}44`,borderRadius:6,padding:"14px 16px",maxWidth:320,width:"100%"}}>
   <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><canvas width={120} height={120} style={{width:32,height:32}} ref={el=>{if(el){const cx=el.getContext("2d");if(cx){cx.setTransform(3,0,0,3,0,0);cx.clearRect(0,0,40,40);_drawBotIcon(cx,def.id,20,20,13,def.col);}}}} /><div style={{color:def.col,fontSize:13,fontWeight:"bold"}}>{def.name}</div></div>
   <div style={{color:"#bbccdd",fontSize:10,lineHeight:1.6}}>{def.desc}</div>
  </div>
 </div>;})()}
 </div>
 </>;
})()}
{metaTab==="overheat"&&(()=>{
const ohUnlocked=!!meta.overheatUnlocked;const ohPts=meta.overheat||0;const ohUpgrades=meta.overheatUpgrades||{};const ohItemUnlocked=meta.overheatItemUnlocked||{};
const buyOhUnlock=()=>{if(meta.echoes<OH_COSTS.unlock)return;setMeta(prev=>{const nx={...prev,echoes:prev.echoes-OH_COSTS.unlock,overheatUnlocked:true};saveMeta(nx);return nx;});};
const unlockOhItem=(uid)=>{const _eC=OH_COSTS.itemEc(uid),_oC=OH_COSTS.itemOhCost(uid);if(meta.echoes<_eC||(meta.overheat||0)<_oC)return;setMeta(prev=>{const nx={...prev,echoes:prev.echoes-_eC,overheat:(prev.overheat||0)-_oC,overheatItemUnlocked:{...(prev.overheatItemUnlocked||{}),[uid]:true}};saveMeta(nx);return nx;});};
const buyOhLevel=(uid)=>{const ohLvl=ohUpgrades[uid]||0;if(ohLvl>=OH_COSTS.maxLvl)return;const _lvlCost=OH_COSTS.lvlCost(uid,ohLvl);if(ohPts<_lvlCost)return;setMeta(prev=>{const nx={...prev,overheat:(prev.overheat||0)-_lvlCost,overheatUpgrades:{...(prev.overheatUpgrades||{}),[uid]:(prev.overheatUpgrades?.[uid]||0)+1}};saveMeta(nx);return nx;});};
const _ohShop=SHOP.filter(u=>u.id!=="rear"&&u.id!=="shield");
if(!ohUnlocked)return <div style={{flex:"1 1 0",minHeight:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center"}}>
<div style={{color:"#ff6622",fontSize:16,fontWeight:"bold",letterSpacing:3,marginBottom:12}}>OVERHEAT</div>
<div style={{color:"#8899aa",fontSize:10,lineHeight:1.7,maxWidth:340,marginBottom:20}}>Unlock the overheat system. Enemies killed by flame or while burning have a 25% chance to earn overheat points. Spend them to push wave upgrades beyond their normal limits.</div>
<button onClick={buyOhUnlock} disabled={meta.echoes<OH_COSTS.unlock} style={{padding:"10px 28px",background:meta.echoes>=OH_COSTS.unlock?"#1a0e08":"#0a0a14",border:"1px solid "+(meta.echoes>=OH_COSTS.unlock?"#ff662266":"#33445522"),borderRadius:4,cursor:meta.echoes>=OH_COSTS.unlock?"pointer":"default",fontFamily:"inherit",fontSize:12,color:meta.echoes>=OH_COSTS.unlock?"#ff6622":"#556677",letterSpacing:1,opacity:meta.echoes>=OH_COSTS.unlock?1:0.5}} onMouseOver={e=>{if(meta.echoes>=OH_COSTS.unlock){e.currentTarget.style.borderColor="#ff6622";e.currentTarget.style.background="#2a1608";}}} onMouseOut={e=>{e.currentTarget.style.borderColor=meta.echoes>=OH_COSTS.unlock?"#ff662266":"#33445522";e.currentTarget.style.background=meta.echoes>=OH_COSTS.unlock?"#1a0e08":"#0a0a14";}}>UNLOCK · ⬢ {OH_COSTS.unlock.toLocaleString()}</button>
</div>;
const _renderItem=(up)=>{const ohLvl=ohUpgrades[up.id]||0;const itemUn=!!ohItemUnlocked[up.id];const ohMaxed=ohLvl>=OH_COSTS.maxLvl;
if(!itemUn){const canUn=meta.echoes>=OH_COSTS.itemEc(up.id)&&ohPts>=OH_COSTS.itemOhCost(up.id);return <div key={up.id} style={{flex:"1 1 0",padding:0,background:"#08080e",border:"1px solid #22223322",borderRadius:3,textAlign:"left",fontFamily:"inherit",position:"relative",overflow:"hidden",display:"flex",height:66,flexShrink:0,alignItems:"stretch",boxSizing:"border-box",minWidth:0}}>
<div style={{flex:"1 1 0",padding:"7px 8px",opacity:0.4,display:"flex",flexDirection:"column",justifyContent:"center"}}>
<div style={{color:CC[up.cat],fontSize:10,fontWeight:"bold"}}>{up.name}</div>
<div style={{color:"#556677",fontSize:8,marginTop:2}}>{up.desc}</div>
</div>
<button onClick={()=>canUn&&unlockOhItem(up.id)} disabled={!canUn} style={{width:70,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:canUn?"#ff662218":"#0c0c14",border:"1px solid "+(canUn?"#ff662244":"#22223322"),opacity:canUn?1:0.45,padding:"4px 2px",margin:"6px 6px 6px 4px",borderRadius:3,cursor:canUn?"pointer":"default",fontFamily:"inherit",flexShrink:0}} onMouseOver={e=>canUn&&(e.currentTarget.style.borderColor="#ff6622")} onMouseOut={e=>(e.currentTarget.style.borderColor=canUn?"#ff662244":"#22223322")}>
<div style={{color:canUn?"#ff6622":"#667788",fontSize:9,fontWeight:"bold",letterSpacing:0.5}}>UNLOCK</div>
<div style={{color:"#ccddee",fontSize:8}}><span style={{color:CUR.echoes.color}}>⬢</span>{_ohFmt(OH_COSTS.itemEc(up.id))} <span style={{color:"#ff6622"}}>✹</span>{_ohFmt(OH_COSTS.itemOhCost(up.id))}</div>
</button>
</div>;}
const _curLvlCost=OH_COSTS.lvlCost(up.id,ohLvl);const canBuy=!ohMaxed&&ohPts>=_curLvlCost;
return <button key={up.id} onClick={()=>canBuy&&buyOhLevel(up.id)} disabled={!canBuy} style={{flex:"1 1 0",padding:"7px 8px",background:ohMaxed?"#0c1420":canBuy?"#1a0e08":"#0a0a14",height:66,border:"1px solid "+(ohMaxed?"#88aadd33":canBuy?"#ff662244":"#22334422"),borderRadius:3,cursor:canBuy?"pointer":"default",textAlign:"left",fontFamily:"inherit",position:"relative",overflow:"hidden",boxShadow:ohMaxed?"0 0 8px #88aadd18":"none",flexShrink:0,boxSizing:"border-box",minWidth:0}} onMouseOver={e=>canBuy&&(e.currentTarget.style.borderColor="#ff6622")} onMouseOut={e=>(e.currentTarget.style.borderColor=ohMaxed?"#88aadd33":canBuy?"#ff662244":"#22334422")}>{ohMaxed&&<div className="platinum-shimmer"/>}
<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:CC[up.cat],fontSize:10,fontWeight:"bold"}}>{up.name}</span><span style={{color:"#88aadd",fontSize:8}}>Max Level: {up.max} <span style={{color:"#ff6622"}}>+{ohLvl}</span></span></div>
<div style={{color:"#8899aa",fontSize:8,marginTop:1}}>{up.desc}</div>
{!ohMaxed?<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:2}}><span style={{color:canBuy?"#ff6622":"#554433",fontSize:9}}>✹ {_curLvlCost.toLocaleString()}</span><span style={{color:"#556677",fontSize:8}}>+{ohLvl}/{OH_COSTS.maxLvl}</span></div>:<div style={{color:"#88aadd",fontSize:8,marginTop:1}}>MAXED +{OH_COSTS.maxLvl}</div>}
</button>;};
const _ohRows=[];for(let _i=0;_i<_ohShop.length;_i+=2){_ohRows.push([_ohShop[_i],_ohShop[_i+1]].filter(Boolean));}
return <div className="vs-scroll" style={{flex:"1 1 0",minHeight:0,padding:10,display:"flex",flexDirection:"column",gap:4,overflow:"auto",background:"#06060e"}}>
<div style={{color:"#99aabb",fontSize:9,textAlign:"center",marginBottom:2,flexShrink:0}}>Increase the maximum level of wave upgrades. <span style={{color:"#44ddcc"}}>{(()=>{const _l=meta.lab?.completed?.overheat_chance||0;return _l>0?[30,35,40,45,50][Math.min(_l-1,4)]:25;})()}%</span> of flame kills earn ✹ overheat points.</div>
{_ohRows.map((row,ri)=>(<div key={ri} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,flexShrink:0}}>{row.map(_renderItem)}{row.length<2&&<div/>}</div>))}
</div>;
})()}
 </div>
 <div style={{padding:10,borderTop:"1px solid #1a1a2e",display:"flex",justifyContent:"center",gap:8}}>
 {tutStep>=9&&tutStep<=11?<div style={{color:"#667788",fontSize:9}}>Complete the tutorial to continue</div>:<>
 <button onClick={()=>_startMainRun()} style={bs2("#00e5ff")} {...hv("#00e5ff")}>PLAY</button>
 <button onClick={()=>goTo("menu")} style={{...bs2("#44556644"),borderWidth:1,color:"#778899"}}>MENU</button></>}</div> {labConfirm&&labConfirm.startsWith("pick_")&&(()=>{
 const _pSlotIdx=parseInt(labConfirm.split("_")[1]);
 const _pLab=meta.lab||{};const _pCompleted=_pLab.completed||{};const _pActive=_pLab.active||[];const _pSaved=_pLab.saved||{};const _pHW=meta.highWave||0;
 const _pAssign=(labId,slotIdx)=>{setMeta(prev=>{const newActive=[...(prev.lab?.active||[])];const newSaved={...(prev.lab?.saved||{})};const lu=LAB_UPGRADES.find(l=>l.id===labId);const cl=prev.lab?.completed?.[labId]||0;if(!lu||cl>=lu.levels.length)return prev;const needed=lu.levels[cl].waves;if(newActive[slotIdx]){newSaved[newActive[slotIdx].id]=newActive[slotIdx].wavesProgress||0;}const existIdx=newActive.findIndex(a=>a&&a.id===labId);if(existIdx>=0&&existIdx!==slotIdx){newSaved[newActive[existIdx].id]=newActive[existIdx].wavesProgress||0;newActive[existIdx]=null;}newActive[slotIdx]={id:labId,wavesNeeded:needed,wavesProgress:newSaved[labId]||0};delete newSaved[labId];const nx={...prev,lab:{...(prev.lab||{}),active:newActive,saved:newSaved}};saveMeta(nx);return nx;});setLabConfirm(null);};
 return <div onClick={()=>setLabConfirm(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:20,animation:_popupClosing?"popupBgExit 170ms ease-in forwards":"popupBgEnter 150ms ease-out both",display:"flex",alignItems:"center",justifyContent:"center"}}>
 <div onClick={e=>e.stopPropagation()} style={{background:"#0a0a16",border:"1px solid #ff884455",borderRadius:8,width:"92%",maxHeight:"80%",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.8)"}}>
 <div style={{padding:"12px 12px 0",flexShrink:0}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
 <span style={{color:"#ff9966",fontSize:12,fontWeight:"bold",letterSpacing:2}}>SELECT RESEARCH</span>
 <button onClick={()=>setLabConfirm(null)} style={{background:"none",border:"1px solid #556677",color:"#99aabb",padding:"4px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:10,borderRadius:3}}>✕</button>
 </div>
 </div>
 <div className="vs-scroll" style={{flex:1,minHeight:0,overflow:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,padding:"8px 12px",alignContent:"start"}}>
 {[...LAB_UPGRADES].sort((a,b)=>(a.tier||1)-(b.tier||1)||(a.minWave-b.minWave)).map((lu2,li,arr)=>{const _prevTier=li>0?(arr[li-1].tier||1):0;const _curTier=lu2.tier||1;const _showTierHeader=_curTier!==_prevTier;return <>{_showTierHeader&&<div style={{gridColumn:"1/-1",color:_curTier===3?"#ff5577":_curTier===2?"#bb99ff":"#ff9966",fontSize:10,fontWeight:"bold",letterSpacing:1,marginTop:li>0?8:0,paddingBottom:4,borderBottom:`1px solid ${_curTier===3?"#ff557722":_curTier===2?"#bb99ff22":"#ff884422"}`}}>TIER {_curTier}</div>}{(()=>{
 const cl=_pCompleted[lu2.id]||0;
 const maxed=cl>=lu2.levels.length;
 const locked=_pHW<lu2.minWave||((meta.metaTier||1)<(lu2.tier||1));
 const isCurrentSlot=_pActive[_pSlotIdx]?.id===lu2.id;
 const saved=_pSaved[lu2.id]||0;
 const canPick=!maxed&&!locked&&!isCurrentSlot;
 return <button key={lu2.id} onClick={()=>canPick&&_pAssign(lu2.id,_pSlotIdx)} disabled={!canPick}
 style={{padding:"12px",background:isCurrentSlot?"#0e1a1a":canPick?"#0c0c1a":"#08080f",border:`1px solid ${isCurrentSlot?"#44ddcc44":maxed?"#ffcc4444":canPick?"#ff884433":"#1a1a2e"}`,borderRadius:5,cursor:canPick?"pointer":"default",fontFamily:"inherit",textAlign:"left",opacity:locked?0.35:1,flexShrink:0,position:"relative",overflow:"visible"}}>
 {maxed&&<div style={{position:"absolute",inset:0,overflow:"hidden",borderRadius:5}}><div className="gold-shimmer"/></div>}
 <div style={{color:maxed?"#ffcc44":isCurrentSlot?"#44ddcc":"#ccddee",fontSize:12,fontWeight:"bold"}}>{lu2.name} <span style={{color:(lu2.tier||1)===3?"#ff5577":(lu2.tier||1)===2?"#bb99ff":"#667788",fontSize:8}}>{(lu2.tier||1)>1?"T"+lu2.tier+" · ":""}Lv.{cl}/{lu2.levels.length} · Min wave {lu2.minWave}{locked&&(meta.metaTier||1)<(lu2.tier||1)?` · Needs Tier ${lu2.tier}`:""}{isCurrentSlot?" · Current":""}</span></div>
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
 </div>
 )}
 {_dupTabPopup&&<div style={{position:"absolute",inset:0,background:"rgba(2,2,8,0.96)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div style={{background:"#0a0a18",border:"1px solid #ffcc4444",borderRadius:8,padding:"24px 20px",maxWidth:330,width:"100%",textAlign:"center"}}>
 <div style={{color:"#ffcc44",fontSize:13,fontWeight:"bold",letterSpacing:2,marginBottom:10}}>ALREADY OPEN</div>
 <div style={{color:"#99aabb",fontSize:10,lineHeight:1.7,marginBottom:8}}>This account is already open in another tab on this device.</div>
 <div style={{color:"#ff8844",fontSize:9,lineHeight:1.6,marginBottom:16}}>⚠ Any active run in the other tab will not be saved when it closes.</div>
 <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:10}}>
 <button onClick={()=>{if(_bcRef.current&&_otherTabIdRef.current)_bcRef.current.postMessage({type:"close_me",code:syncCode,tab:_otherTabIdRef.current});_setDupTabPopup(false);}} style={{padding:"8px 14px",background:"transparent",border:"1px solid #44ccaa66",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:9,color:"#88ccaa",letterSpacing:1}}>CONTINUE HERE</button>
 </div>
 </div>
 </div>}
 {sessionTakeover&&syncCode&&<div style={{position:"absolute",inset:0,background:"rgba(2,2,8,0.92)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
 <div style={{background:"#0a0a18",border:"1px solid #ff884444",borderRadius:8,padding:"24px 20px",maxWidth:340,width:"100%",textAlign:"center"}}>
 <div style={{color:"#ffcc44",fontSize:14,fontWeight:"bold",letterSpacing:2,marginBottom:12}}>SESSION TAKEN OVER</div>
 <div style={{color:"#99aabb",fontSize:10,lineHeight:1.7,marginBottom:16}}>
 Another device has connected to save <span style={{color:"#44ccaa",fontFamily:"'DejaVu Sans Mono', 'Courier New', monospace",letterSpacing:2}}>{syncCode}</span>. Only one device can play at a time.
 </div>
 <div style={{display:"flex",gap:8,justifyContent:"center"}}>
 <button onClick={()=>{if(_takeoverLocked)return;const code=syncCodeRef.current;if(!code||!_SYNC_OK)return;fetch(SUPABASE_URL+"/rest/v1/saves?code=eq."+code+"&select=data",{headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}).then(r=>r.json()).then(rows=>{if(rows.length>0&&rows[0].data&&rows[0].data.meta){if(rows[0].data.meta.locked){_setTakeoverLocked(true);return;}const cd=rows[0].data;setMeta(cd.meta);try{localStorage.setItem("vs4-meta",JSON.stringify(cd.meta));}catch(e){}if(cd.history)try{localStorage.setItem("vs4-history",JSON.stringify(cd.history));}catch(e){}if(cd.tut)try{localStorage.setItem("vs4-tut",cd.tut);}catch(e){}const _tsTC=Date.now();const _msTC={...cd.meta,savedAt:_tsTC};try{const _hTC=JSON.stringify(cd.history||[]);const _tTC=cd.tut||"0";fetch(SUPABASE_URL+"/rest/v1/saves",{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({code,data:{meta:_msTC,history:cd.history||[],tut:_tTC,session_id:_sessionIdRef.current,devices:{[_sessionIdRef.current]:Date.now()}},updated_at:new Date().toISOString()})}).catch(()=>{});}catch(_e){}}setSessionTakeover(false);setPhase("menu");}).catch(()=>{setSessionTakeover(false);});}} style={{padding:"8px 18px",background:"transparent",border:"1px solid "+(_takeoverLocked?"#33445544":"#44ccaa66"),borderRadius:4,cursor:_takeoverLocked?"not-allowed":"pointer",fontFamily:"inherit",fontSize:10,color:_takeoverLocked?"#556677":"#88ccaa",letterSpacing:1,transition:"all 0.2s",opacity:_takeoverLocked?0.4:1}} onMouseOver={e=>{if(!_takeoverLocked){e.currentTarget.style.background="#44ccaa";e.currentTarget.style.color="#06060e";}}} onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=_takeoverLocked?"#556677":"#88ccaa";}}>TAKE CONTROL</button>
 <button onClick={()=>{setSyncCode(null);syncCodeRef.current=null;setSyncStatus("none");setSyncCodeInput("");setConfirmDisconnect(false);setSessionTakeover(false);try{localStorage.removeItem("vs4-sync-code");localStorage.removeItem("vs4-meta");localStorage.removeItem("vs4-history");localStorage.removeItem("vs4-tut");}catch(e){}const _def2={echoes:0,levels:{},shards:0,shardsBought:0,abUpgrades:{},shipColor:"cyan",bulletColor:"teal",bossShards:0,ownedDesigns:[],shipDesign:"none",designColor:undefined,showNewEnemy:true,showHitText:true,showMagnetRange:true,highWave:0,username:_genUsername()};setMeta(_def2);setShowTutPrompt(true);setPhase("menu");}} style={{padding:"8px 18px",background:"transparent",border:"1px solid #ff334466",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:10,color:"#cc6666",letterSpacing:1,transition:"all 0.2s"}} onMouseOver={e=>{e.currentTarget.style.background="#ff3344";e.currentTarget.style.color="#06060e";}} onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#cc6666";}}>LOG OUT</button>
 </div>
 {_takeoverLocked&&<div style={{marginTop:12,color:"#cc6644",fontSize:9,lineHeight:1.6,textAlign:"center"}}>This account has been <b style={{color:"#ff8866"}}>locked</b> by the owner. You cannot take control while it is locked.</div>}
 </div>
 </div>}
 </div>
 </div>
 );
}