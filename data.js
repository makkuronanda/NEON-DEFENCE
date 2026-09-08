/* ============================================================
   NEON DEFENSE: OVERDRIVE III — data.js (Balance Tuned)
   ============================================================ */

const playerData = {
  crystals: 600,
  baseLevels: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  unlocked: [0,1],
  party: [0,1],
  stageBestWave: [0,0,0,0,0,0,0,0,0,0],
  stageCleared:  [false,false,false,false,false,false,false,false,false,false],
  augments: [0,0,0,0,0,0],
  enemyKills: {},
  materials: {},
  settings: { lightMode:false, effectLevel:'high', autoSkip:false },
  soundEnabled: true
};

// Tower max upgrade level
const TOWER_MAX_LV = 5;

const CHAR_TEMPLATES = [
  // ── 既存ユニット（序盤救済 & 全体調整）─────────────────────
  { id:0,  name:"BLASTER",   type:"連射型",   rarity:"R",   cost:35,  color:"#00e8ff", range:130, damage:18,  cooldown:16,  max:10, desc:"プラズマを連射。序盤の主力ユニット。" },
  { id:1,  name:"SNIPER",    type:"単体狙撃", rarity:"SR",  cost:110, color:"#ffaa00", range:290, damage:80,  cooldown:75,  max:5,  desc:"超遠距離の高電圧狙撃。貫通弾丸。" },
  { id:2,  name:"FREEZER",   type:"遅延型",   rarity:"R",   cost:60,  color:"#88ccff", range:110, damage:10,  cooldown:30,  max:4,  desc:"絶対零度で敵を鈍化させる。" },
  { id:3,  name:"TESLA",     type:"全方位",   rarity:"SR",  cost:140, color:"#cc44ff", range:100, damage:45,  cooldown:40,  max:3,  desc:"周囲全敵に電磁パルス放電。" },
  { id:4,  name:"BOMBER",    type:"爆破型",   rarity:"SR",  cost:110, color:"#ff3355", range:150, damage:95,  cooldown:85,  max:4,  desc:"量子炸裂爆発で広範囲殲滅。" },
  { id:5,  name:"PHANTOM",   type:"透過型",   rarity:"SSR", cost:180, color:"#ff44cc", range:135, damage:65,  cooldown:30,  max:3,  desc:"シールドを無視した次元貫通弾。" },
  { id:6,  name:"RAILGUN",   type:"貫通型",   rarity:"SR",  cost:180, color:"#ffd700", range:620, damage:110, cooldown:130, max:2,  desc:"直線上の敵を貫く超高速レール弾。命中するごとに威力が減衰する（バランス調整済）。" },
  { id:7,  name:"GUARDIAN",  type:"砦型",     rarity:"SSR", cost:240, color:"#00ff88", range:110, damage:45,  cooldown:15,  max:2,  desc:"高速連射と高耐久を誇る最終守護者。" },

  // ── 新規ユニット ──────────────────────────────────────────────
  { id:8,  name:"VORTEX",    type:"吸引型",   rarity:"SR",  cost:130, color:"#aa55ff", range:160, damage:22,  cooldown:55,  max:3,
    desc:"重力場を生成して敵を引き寄せつつ継続ダメージを与える。",
    special:"vortex"
  },
  { id:9,  name:"VIRUS",     type:"感染型",   rarity:"SR",  cost:135, color:"#55ff44", range:145, damage:20,  cooldown:40,  max:4,
    desc:"ウイルス弾で敵をDOT感染。感染した敵は毎フレームじわじわHPを削られる。",
    special:"virus"
  },
  { id:10, name:"OVERLOAD",  type:"過負荷型", rarity:"SSR", cost:210, color:"#ff8800", range:115, damage:55,  cooldown:38,  max:2,
    desc:"連続攻撃でヒートゲージが溜まり、満タンで超火力の熱爆発が炸裂。",
    special:"overload"
  },
  { id:11, name:"MIRROR",    type:"反射型",   rarity:"R",   cost:70,  color:"#88eeff", range:140, damage:36,  cooldown:28,  max:6,
    desc:"弾丸が1回だけ近くの敵に向かってバウンドし2体同時にダメージ。",
    special:"mirror"
  },
  { id:12, name:"OMEGA",     type:"終末型",   rarity:"SSR", cost:300, color:"#ff2200", range:200, damage:130, cooldown:200, max:1,
    desc:"OMEGAビームで射程内の敵を同時に攻撃。強力だが発動間隔が長く、ボスへの効果は減衰する（バランス調整済）。",
    special:"omega"
  },

  // ── 増設ユニット ──────────────────────────────────────────────
  { id:13, name:"ARCLIGHT",  type:"連鎖型",   rarity:"SR",  cost:125, color:"#00ffcc", range:135, damage:26,  cooldown:38,  max:4,
    desc:"電撃弾が敵から敵へ渡り歩く連鎖攻撃。密集した敵の群れに強い。",
    special:"chain"
  },
  { id:14, name:"AMPLIFIER", type:"支援型",   rarity:"SR",  cost:130, color:"#ffee44", range:120, damage:10,  cooldown:50,  max:3,
    desc:"周囲の味方タワーの攻撃力とリロード速度を底上げする支援施設。",
    special:"support"
  },
  { id:15, name:"PULSAR",    type:"麻痺型",   rarity:"R",   cost:75,  color:"#ff66ff", range:120, damage:18,  cooldown:50,  max:5,
    desc:"命中時に高確率で敵を短時間スタンさせる衝撃波。足止けに優れる。",
    special:"stun"
  },
  { id:16, name:"METEOR",    type:"砲撃型",   rarity:"SSR", cost:250, color:"#ff4400", range:240, damage:195, cooldown:120, max:2,
    desc:"着弾まで時間差のある大質量弾を撃ち込み、着弾点周辺を壊滅させる超広範囲砲撃。強化済: 着弾加速・範囲拡大・LV3で2連撃・燃焼付与。",
    special:"artillery"
  },

  // ── 最新鋭ユニット（OVERDRIVE IV ライン）─────────────────────
  { id:17, name:"SENTINEL",  type:"双砲型",   rarity:"SSR", cost:220, color:"#00c8ff", range:155, damage:32,  cooldown:32,  max:3,
    desc:"双管キャノンで異なる敵2体を同時に攻撃。常に2倍の迎撃力を誇る自動哨戒機。",
    special:"sentry"
  },
  { id:18, name:"TEMPEST",   type:"混沌型",   rarity:"SR",  cost:150, color:"#ccff00", range:145, damage:28,  cooldown:35,  max:4,
    desc:"每一撃ごとにランダムで効果が変化する不安定な実験兵器。鈍化・スタン・炎上・会心のいずれかを引き当てる。",
    special:"chaos"
  },
  { id:19, name:"HAVOC",     type:"跳弾型",   rarity:"SR",  cost:160, color:"#ff8866", range:155, damage:32,  cooldown:50,  max:4,
    desc:"特殊跳弾が敵に当たるたびに威力が15%ずつ増大しながら最大6体へ跳ね返る。大群ほど壊滅的。",
    special:"ricochet"
  },
  { id:20, name:"AEGIS",     type:"修復型",   rarity:"SSR", cost:190, color:"#00ffcc", range:95,  damage:0,   cooldown:500, max:2,
    desc:"戦場グリッドを自動修復。定期稼働でインテグリティ（HP）を1ずつ回復し、上限まで持ち直させる。攻撃はしない。",
    special:"repair"
  },
  { id:21, name:"ECLIPSE",   type:"皆既型",   rarity:"SSR", cost:310, color:"#aa88ff", range:260, damage:175, cooldown:390, max:1,
    desc:"全画面を闇の衝撃波で包み、マップ上の全敵に大ダメージと全域鈍化を与える。長い充電間隔が欠点。",
    special:"eclipse"
  },
  { id:22, name:"TRINITY",   type:"三連型",   rarity:"SSR", cost:260, color:"#ffdd44", range:165, damage:42,  cooldown:45,  max:2,
    desc:"三重砲身が同一標的へ3連続射撃。単体に対する溶断性能は全ユニットトップクラス。",
    special:"burst"
  },

  // ── OVERDRIVE V — 宇宙・時間系ユニット ─────────────────────
  { id:23, name:"SINGULARITY", type:"特異点型", rarity:"SSR", cost:300, color:"#9944ff", range:155, damage:25, cooldown:45, max:2,
    desc:"標的地点にブラックホールを生成。範囲内の敵を引力で引きずり寄せながら継続ダメージを与える宇宙兵器。",
    special:"blackhole" },
  { id:24, name:"QUASAR", type:"宇宙線型", rarity:"SR", cost:155, color:"#00ffee", range:210, damage:48, cooldown:65, max:3,
    desc:"準恒星の宇宙線を扇状にスイープ。扇状範囲の敵全てに強力な貫通ダメージを与える。",
    special:"quasar" },
  { id:25, name:"STARFALL", type:"星降型", rarity:"SR", cost:150, color:"#ffee88", range:185, damage:65, cooldown:80, max:3,
    desc:"射程内のランダムな敵3体の頭上へ星屑の雨を落とす。時間差で連続着弾する幻想的な砲撃。",
    special:"starfall" },
  { id:26, name:"LUX", type:"光矛型", rarity:"R", cost:50, color:"#ffffaa", range:150, damage:26, cooldown:28, max:8,
    desc:"凝縮された光の矛を放ち、直線上の敵全てを貫通する。低コストで作れる光の壁。",
    special:"lux" },

  // ── 工房制作ユニット（素材で作れる特別な兵器）──────────────
  { id:27, name:"ASTRA", type:"銀河砲型", rarity:"SSR", cost:270, color:"#aaddff", range:250, damage:140, cooldown:120, max:2,
    desc:"銀河の引力を借りた光の砲撃。直撃に星屑の灼熱を纏わせ、周囲にも星雲ダメージを波及させる。",
    special:"astra",
    craft:{ stardust:40, voidshard:8, novacore:4 } },
  { id:28, name:"CHRONO", type:"時計型", rarity:"SSR", cost:210, color:"#ffd700", range:165, damage:8, cooldown:28, max:2,
    desc:"巨大な時計の針を刻み、範囲内の時間そのものを減速させるフィールドを展開。敵の動きを強制的に鈍らせる。",
    special:"chrono",
    craft:{ chronogear:10, quantum:25, voidshard:3 } },
  { id:29, name:"TEMPUS", type:"時停型", rarity:"SSR", cost:320, color:"#ffffff", range:115, damage:0, cooldown:55, max:1,
    desc:"設置するとバトルスキル「TIME STOP」が解放。好きなタイミングで敵全体の時間を完全停止させ、自軍だけが動ける時を作る。",
    special:"timestop",
    craft:{ chronogear:15, voidshard:10, novacore:5 } },
  { id:30, name:"NOVA", type:"超新星型", rarity:"SR", cost:175, color:"#ff8844", range:145, damage:34, cooldown:90, max:2,
    desc:"周期的に超新星爆発を起こし、周囲の敵を灼熱の衝撃波で薙ぎ払う。爆心地は小さな恒星のように輝く。",
    special:"supernova",
    craft:{ novacore:5, stardust:20 } },
];

const RARITY_COLORS = { R: "#00e8ff", SR: "#cc44ff", SSR: "#ffd700" };

// ── 敵アーカイブ（図鑑）データ ────────────────────────────────
// 序盤の敵（NORM, RUNNER）のステータスを抑えて難易度を適正化
const ENEMY_CATALOG = [
  { type:'NORM',        name:'NORM',       color:'#ff4466', hp:30,   spd:1.4, ability:'標準的な侵攻ユニット。特筆すべき能力は持たない。' },
  { type:'RUN',         name:'RUNNER',     color:'#ff55bb', hp:18,   spd:2.6, ability:'極めて高速。低耐久だが突破までの時間が非常に短い。' },
  { type:'TANK',        name:'TANK',       color:'#ffaa00', hp:140,  spd:0.7, ability:'超重装甲。高HP・低速度の歩く壁。' },
  { type:'SHIELD',      name:'SHIELD',     color:'#44ddff', hp:60,   spd:1.1, ability:'エネルギーシールドを展開。シールドを削りきるまでは本体にダメージが通らない。' },
  { type:'SWARM',       name:'SWARM',      color:'#44ff99', hp:14,   spd:2.2, ability:'小さく脆いが集団で襲来する。数で押し切るタイプ。' },
  { type:'REGEN',       name:'REGENERATOR',color:'#88ff44', hp:75,   spd:1.2, ability:'常時自己再生。長期戦・漏れ撃ちに弱い。' },
  { type:'GHOST',       name:'GHOST',      color:'#cc88ff', hp:50,   spd:1.7, ability:'半霊体化して物理攻撃を60%軽減する。PHANTOMが有効。' },
  { type:'ARMOR',       name:'ARMOR',      color:'#cc6600', hp:100,  spd:0.9, ability:'装甲板で全てのダメージを50%軽減する。' },
  { type:'SPLITTER',    name:'SPLITTER',   color:'#ff6688', hp:55,   spd:1.5, ability:'撃破時に2体のSWARMへ分裂する。' },
  { type:'HEALER',      name:'HEALER',     color:'#66ffaa', hp:60,   spd:1.0, ability:'周囲75pxの味方を毎フレーム回復させる。最優先で撃破すべき。' },
  { type:'STEALTH',     name:'STEALTH',    color:'#8888ff', hp:45,   spd:1.9, ability:'周期的に索敵不能になる。範囲攻撃には有効。' },
  { type:'JUGGERNAUT', name:'JUGGERNAUT', color:'#996633', hp:200,  spd:0.5, ability:'鈍化・スタン・引力への完全耐性を持つ超重装甲ユニット。' },
  { type:'DASHER',      name:'DASHER',     color:'#ffcc00', hp:42,   spd:1.5, ability:'周期的に3倍近い速度でダッシュ突進する。捉えどころがない。' },
  { type:'NINJA',       name:'NINJA',      color:'#99ffcc', hp:35,   spd:2.5, ability:'22%の確率で飛来弾を回避する。速射・連鎖系が苦手とする。' },
  { type:'WARPER',      name:'WARPER',     color:'#ff99ff', hp:65,   spd:1.2, ability:'経路を位相転移でショートカット。射程網の隙間を縫う。' },
  { type:'SWARMQUEEN', name:'SWARMQUEEN', color:'#33ff77', hp:100,  spd:1.0, ability:'生存中、約2.3秒ごとにSWARMを生産し続ける。放置すれば増殖する。' },
  { type:'MAGNAR',      name:'MAGNAR',     color:'#ff7744', hp:85,   spd:0.9, ability:'周囲75pxの味方を磁気フィールドで加速させる。先鋒ユニット。' },
  { type:'BOSS',        name:'OVERDRIVE BOSS', color:'#ffffff', hp:850, spd:0.6, ability:'全バイオームのコアが集約した圧倒的な超大型ユニット。コアへの侵入で大ダメージ。' },
];

// ── 解放プロトコル（永続アップグレード）──────────────────────
const AUGMENT_TEMPLATES = [
  { id:0, key:'income', name:"INCOME PROTOCOL", short:"収益プロトコル", icon:"⚡",
    desc:"戦闘中、時間経過で自動的にクレジットを獲得できるようになる。",
    maxLv:5, baseCost:100, costMult:1.6,
    effectText: lv => lv === 0 ? "未解放" : `毎秒 +${lv}C 自動獲得`
  },
  { id:1, key:'squad', name:"SQUAD EXPANSION", short:"編成拡張", icon:"◈",
    desc:"バトルに同時出撃させられるユニットの上限数を増やす。",
    maxLv:3, baseCost:350, costMult:2.0,
    effectText: lv => `パーティー上限 ${3+lv}体`
  },
  { id:2, key:'capital', name:"STARTING CAPITAL", short:"初期資金強化", icon:"$",
    desc:"すべてのステージで開始時クレジットが増加する。",
    maxLv:4, baseCost:80, costMult:1.5,
    effectText: lv => `開始クレジット +${lv*25}C`
  },
  { id:3, key:'fortify', name:"FORTIFICATION", short:"防衛基盤強化", icon:"◆",
    desc:"すべてのステージで開始時インテグリティ（HP）が増加する。",
    maxLv:4, baseCost:100, costMult:1.6,
    effectText: lv => `開始HP +${lv*2}`
  },
  { id:4, key:'deploy', name:"RAPID DEPLOY", short:"即応配備", icon:"▶",
    desc:"タワー設置に必要なコストを割り引く。",
    maxLv:3, baseCost:150, costMult:1.8,
    effectText: lv => `設置コスト -${lv*5}%`
  },
  { id:5, key:'reserves', name:"OVERDRIVE RESERVES", short:"予備タンク", icon:"☗",
    desc:"インテグリティ0による撃破を、バトル中1回だけ回避する緊急防壁を展開する。",
    maxLv:1, baseCost:500, costMult:1,
    effectText: lv => lv > 0 ? "緊急防壁：解放済み" : "未解放"
  },
];

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

// ── ステージテンプレート（ステージ0・1の初期資金とHPを増加）────────
const STAGE_TEMPLATES = [
  {
    id:0, name:"NEON FOREST",      biome:"forest", diff:"EASY",    pathId:0,
    gimmick:"植物活性: FREEZERの射程1.3倍", color:"#00ff88",
    waves:6,  startMoney:160, startHp:25
  },
  {
    id:1, name:"DESERT MATRIX",    biome:"desert", diff:"NORMAL",  pathId:0,
    gimmick:"熱波暴走: 敵の移動速度1.2倍", color:"#ffaa00",
    waves:8,  startMoney:140, startHp:20
  },
  {
    id:2, name:"CYBER CORE CITY", biome:"cyber",  diff:"HARD",    pathId:0,
    gimmick:"電力安定: タワー攻撃力1.1倍 / 敵HP1.3倍", color:"#00e8ff",
    waves:10, startMoney:120, startHp:15
  },
  {
    id:3, name:"VOID LABYRINTH",   biome:"void",   diff:"HARD",    pathId:1,
    gimmick:"位相歪曲: GHOSTが常時出現 / VORTEXの引力2倍", color:"#cc44ff",
    waves:9,  startMoney:120, startHp:18,
    desc:"次元の裂け目に生まれた迷宮。見えない敵が徘徊する。"
  },
  {
    id:4, name:"ACID SWAMP",       biome:"swamp",  diff:"HARD",    pathId:2,
    gimmick:"腐食地帯: REGEN敵が増加 / VIRUSの感染力1.5倍", color:"#aaff22",
    waves:9,  startMoney:115, startHp:17,
    desc:"毒に満ちた沼地。再生能力を持つ敵が次々と湧き出る。"
  },
  {
    id:5, name:"STORM NEXUS",      biome:"storm",  diff:"EXPERT", pathId:3,
    gimmick:"電磁嵐: タワーのCD+20% / TESLAの射程1.5倍 & 全スキル発動", color:"#ffffaa",
    waves:11, startMoney:100, startHp:12,
    desc:"電磁嵐が吹き荒れる次元の頂点。最後の砦を守れ。"
  },
  {
    id:6, name:"GLACIAL BASTION", biome:"ice",     diff:"HARD",    pathId:4,
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
  [
    {x:0,   y:140},
    {x:400, y:140},
    {x:400, y:360},
    {x:120, y:360},
    {x:120, y:450},
    {x:800, y:450}
  ],
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


// ── 素材システム（ステージクリア・ボス撃破で入手）────────────
const MATERIAL_TEMPLATES = [
  { id:'stardust',    name:'STARDUST',     nameJp:'星屑',       color:'#88ccff', rarity:'common', desc:'宇宙空間に漂う微細な結晶。様々な兵器の基礎素材。' },
  { id:'quantum',     name:'QUANTUM DUST', nameJp:'量子の塵',   color:'#00ffcc', rarity:'common', desc:'観測するたび状態が変化する不思議な粒子。' },
  { id:'voidshard',   name:'VOID SHARD',   nameJp:'虚無の欠片', color:'#cc44ff', rarity:'rare',   desc:'虚無空間の裂け目から回収された破片。強いエネルギーを帯びる。' },
  { id:'chronogear',  name:'CHRONO GEAR',  nameJp:'クロノ歯車', color:'#ffd700', rarity:'rare',   desc:'止まった時間の中から抽出された黄金の歯車。' },
  { id:'novacore',    name:'NOVA CORE',    nameJp:'ノヴァコア', color:'#ff6600', rarity:'rare',   desc:'超新星爆発の残滓。触れたものを灼熱に包む核。' },
];

function addMaterial(id, n) {
  playerData.materials[id] = (playerData.materials[id] || 0) + n;
}
function getMaterialCount(id) {
  return playerData.materials[id] || 0;
}
function grantStageMaterials(stage, wavesReached) {
  const gained = [];
  const give = (id, n) => { if (n > 0) { addMaterial(id, n); gained.push({ id, n }); } };
  const scale = stage.endless ? Math.min(3, 1 + Math.floor((wavesReached || 0) / 15)) : 1;
  give('stardust',  (5 + stage.id * 2) * scale);
  give('quantum',   (3 + stage.id) * scale);
  if (Math.random() < 0.45) give('voidshard', 1 + (stage.id >= 5 ? 1 : 0));
  if (Math.random() < 0.30) give('chronogear', 1);
  if (Math.random() < 0.28) give('novacore',   1);
  if (stage.endless && (wavesReached || 0) >= 20) { give('voidshard', 2); give('novacore', 1); }
  return gained;
}
function formatGainedMaterials(gained) {
  return gained.map(g => {
    const t = MATERIAL_TEMPLATES.find(m => m.id === g.id);
    return `${t ? t.nameJp : g.id}×${g.n}`;
  }).join(' ／ ');
}
function canCraftUnit(ch) {
  if (!ch.craft) return false;
  return Object.entries(ch.craft).every(([mid, n]) => getMaterialCount(mid) >= n);
}
