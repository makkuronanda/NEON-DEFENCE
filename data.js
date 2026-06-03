/* ============================================================
   NEON DEFENSE: OVERDRIVE III — data.js
   ============================================================ */

const playerData = {
  crystals: 600,
  baseLevels: [1,1,1,1,1,1,1,1,1,1,1,1,1],
  unlocked: [0,1],
  party: [0,1]
};

// Tower max upgrade level
const TOWER_MAX_LV = 5;

const CHAR_TEMPLATES = [
  // ── 既存ユニット ──────────────────────────────────────────────
  { id:0,  name:"BLASTER",   type:"連射型",   rarity:"R",   cost:50,  color:"#00e8ff", range:120, damage:15,  cooldown:20,  max:10, desc:"プラズマを連射。序盤の主力ユニット。" },
  { id:1,  name:"SNIPER",    type:"単体狙撃", rarity:"SR",  cost:130, color:"#ffaa00", range:280, damage:75,  cooldown:85,  max:5,  desc:"超遠距離の高電圧狙撃。貫通弾丸。" },
  { id:2,  name:"FREEZER",   type:"遅延型",   rarity:"R",   cost:70,  color:"#88ccff", range:100, damage:6,   cooldown:35,  max:4,  desc:"絶対零度で敵を鈍化させる。" },
  { id:3,  name:"TESLA",     type:"全方位",   rarity:"SR",  cost:160, color:"#cc44ff", range:95,  damage:28,  cooldown:50,  max:3,  desc:"周囲全敵に電磁パルス放電。" },
  { id:4,  name:"BOMBER",    type:"爆破型",   rarity:"SR",  cost:110, color:"#ff3355", range:150, damage:90,  cooldown:105, max:4,  desc:"量子炸裂爆発で広範囲殲滅。" },
  { id:5,  name:"PHANTOM",   type:"透過型",   rarity:"SSR", cost:200, color:"#ff44cc", range:130, damage:55,  cooldown:30,  max:3,  desc:"シールドを無視した次元貫通弾。" },
  { id:6,  name:"RAILGUN",   type:"貫通型",   rarity:"SR",  cost:180, color:"#ffd700", range:800, damage:120, cooldown:120, max:2,  desc:"直線上全敵を貫く超高速レール弾。" },
  { id:7,  name:"GUARDIAN",  type:"砦型",     rarity:"SSR", cost:250, color:"#00ff88", range:80,  damage:35,  cooldown:15,  max:2,  desc:"低射程だが超高速連射と高耐久を誇る最終守護者。" },

  // ── 新規ユニット ──────────────────────────────────────────────
  { id:8,  name:"VORTEX",    type:"吸引型",   rarity:"SR",  cost:145, color:"#aa55ff", range:160, damage:20,  cooldown:60,  max:3,
    desc:"重力場を生成して敵を引き寄せつつ継続ダメージを与える。",
    special:"vortex"  // 敵をタワーに向かって引き寄せる
  },
  { id:9,  name:"VIRUS",     type:"感染型",   rarity:"SR",  cost:155, color:"#55ff44", range:140, damage:12,  cooldown:45,  max:4,
    desc:"ウイルス弾で敵をDOT感染。感染した敵は毎フレームじわじわHPを削られる。",
    special:"virus"
  },
  { id:10, name:"OVERLOAD",  type:"過負荷型", rarity:"SSR", cost:220, color:"#ff8800", range:110, damage:45,  cooldown:40,  max:2,
    desc:"連続攻撃でヒートゲージが溜まり、満タンで超火力の熱爆発が炸裂。",
    special:"overload"
  },
  { id:11, name:"MIRROR",    type:"反射型",   rarity:"R",   cost:80,  color:"#88eeff", range:135, damage:22,  cooldown:30,  max:6,
    desc:"弾丸が1回だけ近くの敵に向かってバウンドし2体同時にダメージ。",
    special:"mirror"
  },
  { id:12, name:"OMEGA",     type:"終末型",   rarity:"SSR", cost:300, color:"#ff2200", range:200, damage:180, cooldown:150, max:1,
    desc:"OMEGAビームで画面全体の敵を同時に攻撃。最強だが発動間隔が長い。",
    special:"omega"
  },
];

const RARITY_COLORS = { R: "#00e8ff", SR: "#cc44ff", SSR: "#ffd700" };

const STAGE_TEMPLATES = [
  // ── 既存ステージ ──────────────────────────────────────────────
  {
    id:0, name:"NEON FOREST",     biome:"forest", diff:"NORMAL", pathId:0,
    gimmick:"植物活性: FREEZERの射程1.3倍", color:"#00ff88",
    waves:7,  startMoney:130, startHp:20
  },
  {
    id:1, name:"DESERT MATRIX",   biome:"desert", diff:"HARD",   pathId:0,
    gimmick:"熱波暴走: 敵の移動速度1.35倍", color:"#ffaa00",
    waves:8,  startMoney:110, startHp:15
  },
  {
    id:2, name:"CYBER CORE CITY", biome:"cyber",  diff:"EXPERT", pathId:0,
    gimmick:"電力安定: タワー攻撃力1.1倍 / 敵HP1.5倍", color:"#00e8ff",
    waves:10, startMoney:90,  startHp:10
  },

  // ── 新規ステージ ──────────────────────────────────────────────
  {
    id:3, name:"VOID LABYRINTH",  biome:"void",   diff:"HARD",   pathId:1,
    gimmick:"位相歪曲: GHOSTが常時出現 / VORTEXの引力2倍", color:"#cc44ff",
    waves:9,  startMoney:120, startHp:18,
    desc:"次元の裂け目に生まれた迷宮。見えない敵が徘徊する。"
  },
  {
    id:4, name:"ACID SWAMP",      biome:"swamp",  diff:"HARD",   pathId:2,
    gimmick:"腐食地帯: REGEN敵が増加 / VIRUSの感染力1.5倍", color:"#aaff22",
    waves:9,  startMoney:115, startHp:17,
    desc:"毒に満ちた沼地。再生能力を持つ敵が次々と湧き出る。"
  },
  {
    id:5, name:"STORM NEXUS",     biome:"storm",  diff:"EXPERT", pathId:3,
    gimmick:"電磁嵐: タワーのCD+20% / TESLAの射程1.5倍 & 全スキル発動", color:"#ffffaa",
    waves:11, startMoney:100, startHp:12,
    desc:"電磁嵐が吹き荒れる次元の頂点。最後の砦を守れ。"
  },
];

// ── 複数マップパス定義 ──────────────────────────────────────────
const ALL_PATHS = [
  // pathId:0 — オリジナルZ字
  [
    {x:0,   y:140},
    {x:400, y:140},
    {x:400, y:360},
    {x:120, y:360},
    {x:120, y:450},
    {x:800, y:450}
  ],
  // pathId:1 — 迷宮型S字（より複雑）
  [
    {x:0,   y:80},
    {x:600, y:80},
    {x:600, y:220},
    {x:200, y:220},
    {x:200, y:340},
    {x:650, y:340},
    {x:650, y:460},
    {x:0,   y:460}
  ],
  // pathId:2 — 沼地型C字（広い湾曲）
  [
    {x:0,   y:250},
    {x:200, y:100},
    {x:500, y:100},
    {x:700, y:250},
    {x:700, y:400},
    {x:400, y:450},
    {x:50,  y:450},
    {x:0,   y:500}
  ],
  // pathId:3 — 嵐型W字（4折れ）
  [
    {x:0,   y:60},
    {x:260, y:60},
    {x:260, y:260},
    {x:100, y:260},
    {x:100, y:180},
    {x:500, y:180},
    {x:500, y:420},
    {x:650, y:420},
    {x:650, y:100},
    {x:800, y:100}
  ]
];
