/* ============================================================
   NEON DEFENSE: OVERDRIVE III — data.js
   ============================================================ */

const playerData = {
  crystals: 600,
  baseLevels: [1,1,1,1,1,1,1,1],
  unlocked: [0,1],
  party: [0,1]
};

// Tower max upgrade level
const TOWER_MAX_LV = 5;

const CHAR_TEMPLATES = [
  { id:0, name:"BLASTER",  type:"連射型",   rarity:"R",  cost:50,  color:"#00e8ff", range:120, damage:15, cooldown:20, max:10, desc:"プラズマを連射。序盤の主力ユニット。" },
  { id:1, name:"SNIPER",   type:"単体狙撃", rarity:"SR", cost:130, color:"#ffaa00", range:280, damage:75, cooldown:85, max:5,  desc:"超遠距離の高電圧狙撃。貫通弾丸。" },
  { id:2, name:"FREEZER",  type:"遅延型",   rarity:"R",  cost:70,  color:"#88ccff", range:100, damage:6,  cooldown:35, max:4,  desc:"絶対零度で敵を鈍化させる。" },
  { id:3, name:"TESLA",    type:"全方位",   rarity:"SR", cost:160, color:"#cc44ff", range:95,  damage:28, cooldown:50, max:3,  desc:"周囲全敵に電磁パルス放電。" },
  { id:4, name:"BOMBER",   type:"爆破型",   rarity:"SR", cost:110, color:"#ff3355", range:150, damage:90, cooldown:105,max:4,  desc:"量子炸裂爆発で広範囲殲滅。" },
  { id:5, name:"PHANTOM",  type:"透過型",   rarity:"SSR",cost:200, color:"#ff44cc", range:130, damage:55, cooldown:30, max:3,  desc:"シールドを無視した次元貫通弾。" },
  { id:6, name:"RAILGUN",  type:"貫通型",   rarity:"SR", cost:180, color:"#ffd700", range:800, damage:120,cooldown:120,max:2,  desc:"直線上全敵を貫く超高速レール弾。" },
  { id:7, name:"GUARDIAN", type:"砦型",     rarity:"SSR",cost:250, color:"#00ff88", range:80,  damage:35, cooldown:15, max:2,  desc:"低射程だが超高速連射と高耐久を誇る最終守護者。" }
];

const RARITY_COLORS = { R: "#00e8ff", SR: "#cc44ff", SSR: "#ffd700" };

const STAGE_TEMPLATES = [
  { id:0, name:"NEON FOREST",     biome:"forest", diff:"NORMAL", gimmick:"植物活性: FREEZERの射程1.3倍", color:"#00ff88", waves:7,  startMoney:130, startHp:20 },
  { id:1, name:"DESERT MATRIX",   biome:"desert", diff:"HARD",   gimmick:"熱波暴走: 敵の移動速度1.35倍", color:"#ffaa00", waves:8,  startMoney:110, startHp:15 },
  { id:2, name:"CYBER CORE CITY", biome:"cyber",  diff:"EXPERT", gimmick:"電力安定: タワー攻撃力1.1倍 / 敵HP1.5倍", color:"#00e8ff", waves:10, startMoney:90,  startHp:10 }
];

// Overwrite STAGE_TEMPLATES with harder versions
