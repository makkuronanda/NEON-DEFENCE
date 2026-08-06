/* ============================================================
   NEON DEFENSE: OVERDRIVE III — data.js
   ============================================================ */

const playerData = {
  crystals: 600,
  baseLevels: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  unlocked: [0,1],
  party: [0,1],
  stageBestWave: [0,0,0,0,0,0,0,0,0,0],
  stageCleared:  [false,false,false,false,false,false,false,false,false,false],
  augments: [0,0,0,0,0,0],
  soundEnabled: true
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

  // ── 増設ユニット ──────────────────────────────────────────────
  { id:13, name:"ARCLIGHT",  type:"連鎖型",   rarity:"SR",  cost:135, color:"#00ffcc", range:130, damage:24,  cooldown:40,  max:4,
    desc:"電撃弾が敵から敵へ渡り歩く連鎖攻撃。密集した敵の群れに強い。",
    special:"chain"
  },
  { id:14, name:"AMPLIFIER", type:"支援型",   rarity:"SR",  cost:150, color:"#ffee44", range:110, damage:5,   cooldown:60,  max:3,
    desc:"周囲の味方タワーの攻撃力とリロード速度を底上げする支援施設。単体火力は低いが編成の要になる。",
    special:"support"
  },
  { id:15, name:"PULSAR",    type:"麻痺型",   rarity:"R",   cost:90,  color:"#ff66ff", range:115, damage:10,  cooldown:55,  max:5,
    desc:"命中時に一定確率で敵を短時間スタンさせる衝撃波。足止めに優れる。",
    special:"stun"
  },
  { id:16, name:"METEOR",    type:"砲撃型",   rarity:"SSR", cost:260, color:"#ff4400", range:230, damage:150, cooldown:170, max:2,
    desc:"着弾まで時間差のある大質量弾を撃ち込み、着弾点周辺を壊滅させる超広範囲砲撃。",
    special:"artillery"
  },
];

const RARITY_COLORS = { R: "#00e8ff", SR: "#cc44ff", SSR: "#ffd700" };

// ── 解放プロトコル（永続アップグレード）──────────────────────
// 一度解放/強化すると、以後すべての戦闘で永久に効果を発揮する。
const AUGMENT_TEMPLATES = [
  { id:0, key:'income', name:"INCOME PROTOCOL", short:"収益プロトコル", icon:"⚡",
    desc:"戦闘中、時間経過で自動的にクレジットを獲得できるようになる。",
    maxLv:5, baseCost:120, costMult:1.7,
    effectText: lv => lv === 0 ? "未解放" : `毎秒 +${lv}C 自動獲得`
  },
  { id:1, key:'squad', name:"SQUAD EXPANSION", short:"編成拡張", icon:"◈",
    desc:"バトルに同時出撃させられるユニットの上限数を増やす。",
    maxLv:3, baseCost:400, costMult:2.2,
    effectText: lv => `パーティー上限 ${3+lv}体`
  },
  { id:2, key:'capital', name:"STARTING CAPITAL", short:"初期資金強化", icon:"$",
    desc:"すべてのステージで開始時クレジットが増加する。",
    maxLv:4, baseCost:100, costMult:1.6,
    effectText: lv => `開始クレジット +${lv*25}C`
  },
  { id:3, key:'fortify', name:"FORTIFICATION", short:"防衛基盤強化", icon:"◆",
    desc:"すべてのステージで開始時インテグリティ（HP）が増加する。",
    maxLv:4, baseCost:130, costMult:1.7,
    effectText: lv => `開始HP +${lv*2}`
  },
  { id:4, key:'deploy', name:"RAPID DEPLOY", short:"即応配備", icon:"▶",
    desc:"タワー設置に必要なコストを割り引く。",
    maxLv:3, baseCost:180, costMult:1.9,
    effectText: lv => `設置コスト -${lv*5}%`
  },
  { id:5, key:'reserves', name:"OVERDRIVE RESERVES", short:"予備タンク", icon:"☗",
    desc:"インテグリティ0による撃破を、バトル中1回だけ回避する緊急防壁を展開する。",
    maxLv:1, baseCost:600, costMult:1,
    effectText: lv => lv > 0 ? "緊急防壁：解放済み" : "未解放"
  },
];

// 現在のレベルからNレベル分の強化に必要な累計コストではなく、次の1レベル分のコストを返す
function getAugmentUpgradeCost(tmpl, curLv) {
  return Math.round(tmpl.baseCost * Math.pow(tmpl.costMult, curLv));
}
function getAugmentLevel(key) {
  const idx = AUGMENT_TEMPLATES.findIndex(a => a.key === key);
  if (idx < 0) return 0;
  return playerData.augments[idx] || 0;
}
function getMaxPartySize() {
  return 3 + getAugmentLevel('squad');
}
function getTowerCost(tmpl) {
  const discount = getAugmentLevel('deploy') * 0.05;
  return Math.max(10, Math.round(tmpl.cost * (1 - discount)));
}

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

  // ── 増設ステージ ──────────────────────────────────────────────
  {
    id:6, name:"GLACIAL BASTION", biome:"ice",    diff:"HARD",   pathId:4,
    gimmick:"絶対零度: 鈍化無効の重装甲JUGGERNAUTが増加 / FREEZERの射程1.2倍で援護せよ", color:"#66ccff",
    waves:10, startMoney:105, startHp:16,
    desc:"氷結した旧要塞。凍り付いた重装甲ユニットが行く手を阻む。"
  },
  {
    id:7, name:"ORBITAL RING",    biome:"space",  diff:"EXPERT", pathId:5,
    gimmick:"無重力浮遊: 潜伏型STEALTHが多発 / PULSARのスタン成功率上昇", color:"#aa88ff",
    waves:10, startMoney:100, startHp:14,
    desc:"軌道上を回るリング状要塞。影に潜む敵が索敵網をすり抜ける。"
  },
  {
    id:8, name:"ZERO POINT",      biome:"chaos",  diff:"EXPERT", pathId:6,
    gimmick:"臨界暴走: 全ギミック同時発動 / HEALERが敵を回復・AMPLIFIERの支援効果も上昇", color:"#ff0066",
    waves:12, startMoney:90,  startHp:10,
    desc:"全次元が交錯する特異点。これまでの試練を超えた最終決戦の地。"
  },

  // ── 無限モード ────────────────────────────────────────────────
  {
    id:9, name:"INFINITY PROTOCOL", biome:"infinity", diff:"∞",  pathId:7,
    gimmick:"無限湧き: ウェーブ上限なし。5ウェーブ毎にOVERDRIVEボスが出現し、敵は際限なく強化され続ける。", color:"#ffffff",
    waves:Infinity, startMoney:120, startHp:20,
    desc:"終わりなき防衛任務。データの許す限り、どこまでも生き延びよ。到達ウェーブが記録される。",
    endless:true
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
  // pathId:2 — 沼地型C字（広い湾曲／直角ターンのみ）
  [
    {x:0,   y:220},
    {x:180, y:220},
    {x:180, y:80},
    {x:520, y:80},
    {x:520, y:220},
    {x:700, y:220},
    {x:700, y:420},
    {x:300, y:420},
    {x:300, y:480},
    {x:0,   y:480}
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
  ],
  // pathId:4 — 氷結型階段状（ジグザグ上昇）
  [
    {x:0,   y:450},
    {x:180, y:450},
    {x:180, y:130},
    {x:400, y:130},
    {x:400, y:380},
    {x:620, y:380},
    {x:620, y:60},
    {x:800, y:60}
  ],
  // pathId:5 — 軌道型リング状（複雑な折り返し）
  [
    {x:0,   y:60},
    {x:220, y:60},
    {x:220, y:250},
    {x:60,  y:250},
    {x:60,  y:440},
    {x:400, y:440},
    {x:400, y:200},
    {x:580, y:200},
    {x:580, y:420},
    {x:800, y:420}
  ],
  // pathId:6 — 特異点型迷宮（最長・最多折れ）
  [
    {x:0,   y:250},
    {x:120, y:250},
    {x:120, y:60},
    {x:300, y:60},
    {x:300, y:220},
    {x:480, y:220},
    {x:480, y:40},
    {x:650, y:40},
    {x:650, y:300},
    {x:420, y:300},
    {x:420, y:460},
    {x:800, y:460}
  ],
  // pathId:7 — 無限回廊型（連続ジグザグ／エンドレスモード用）
  [
    {x:0,   y:60},
    {x:150, y:60},
    {x:150, y:440},
    {x:300, y:440},
    {x:300, y:60},
    {x:450, y:60},
    {x:450, y:440},
    {x:600, y:440},
    {x:600, y:60},
    {x:800, y:60}
  ]
];
