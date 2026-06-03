/* ============================================================
   NEON DEFENSE: OVERDRIVE III — game.js
   ============================================================ */

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const GS     = 40;
const COLS   = canvas.width  / GS;
const ROWS   = canvas.height / GS;

// battlePath is set dynamically from stage
let battlePath = [];
let pathCells  = new Set();
let effects    = [];

// ──────────────────────────────────────────────
//  GAME BOOTSTRAP
// ──────────────────────────────────────────────
function startBattle(stageData) {
  if (playerData.party.length === 0) { alert("編成してください。"); return; }
  switchScreen('game');

  // Set the path for this stage
  battlePath = ALL_PATHS[stageData.pathId ?? 0].map(p => ({...p}));
  buildPathCells();

  gameState = {
    state: 'playing', stage: stageData,
    hp: stageData.startHp || 20, money: stageData.startMoney || 150, wave: 1, frame: 0,
    enemies: [], towers: [], projectiles: [],
    particles: [], floatingTexts: [], railBeams: [],
    selectedBuildIdx: 0, selectedTower: null, hoverCell: null,
    spawnedBoss: false, waveTimer: 0,
    stageActiveChars: [], screenShake: 0,
    targetMode: 'first',   // 'first' | 'last' | 'strongest' | 'weakest'
    omegaBeams: []         // OMEGA全体攻撃エフェクト
  };

  document.getElementById('g-gimmick').innerText = 'GIMMICK: ' + stageData.gimmick;
  document.getElementById('game-modal').style.display = 'none';
  effects = [];
  initGameUI();
  updateGameUI();
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(gameLoop);
}

function endGameLoop() {
  gameState = null;
  if (animFrameId) cancelAnimationFrame(animFrameId);
}

function buildPathCells() {
  pathCells.clear();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = c * GS + GS / 2, cy = r * GS + GS / 2;
      for (let i = 0; i < battlePath.length - 1; i++) {
        const p1 = battlePath[i], p2 = battlePath[i+1];
        if (p1.y === p2.y && Math.abs(cy - p1.y) < 28 && cx >= Math.min(p1.x,p2.x)-10 && cx <= Math.max(p1.x,p2.x)+10)
          pathCells.add(`${c},${r}`);
        if (p1.x === p2.x && Math.abs(cx - p1.x) < 28 && cy >= Math.min(p1.y,p2.y)-10 && cy <= Math.max(p1.y,p2.y)+10)
          pathCells.add(`${c},${r}`);
      }
    }
  }
}

// ──────────────────────────────────────────────
//  UI
// ──────────────────────────────────────────────
function initGameUI() {
  const opts = document.getElementById('build-options');
  opts.innerHTML = '';
  playerData.party.forEach((cid, idx) => {
    const tmpl = CHAR_TEMPLATES[cid];
    gameState.stageActiveChars.push(tmpl);
    const btn = document.createElement('button');
    btn.className = 'tower-btn' + (idx === 0 ? ' active' : '');
    btn.id = `gbtn-${idx}`;
    btn.style.borderColor = idx === 0 ? tmpl.color : '';
    btn.onclick = () => {
      gameState.selectedBuildIdx = idx;
      document.querySelectorAll('.tower-btn').forEach((b, i) => {
        b.classList.toggle('active', i === idx);
        b.style.borderColor = i === idx ? gameState.stageActiveChars[i].color : '';
      });
    };
    opts.appendChild(btn);
  });
}

function updateGameUI() {
  if (!gameState) return;
  document.getElementById('g-hp').innerText    = gameState.hp;
  document.getElementById('g-money').innerText = gameState.money;
  document.getElementById('g-wave').innerText  = `${gameState.wave}/${gameState.stage.waves}`;

  gameState.stageActiveChars.forEach((t, i) => {
    const btn = document.getElementById(`gbtn-${i}`);
    if (!btn) return;
    const built = gameState.towers.filter(tw => tw.tmpl.id === t.id).length;
    btn.innerHTML = `<div class="tower-btn-name" style="color:${t.color}">${t.name}</div><div style="color:#778">${t.cost}C [${built}/${t.max}]</div>`;
    btn.disabled  = (built >= t.max) || (gameState.money < t.cost && gameState.selectedBuildIdx !== i);
  });

  const panel = document.getElementById('inspect-panel');
  if (gameState.selectedTower) {
    const t  = gameState.selectedTower;
    const uc = t.getUpgradeCost();
    const atMax = t.lv >= TOWER_MAX_LV;
    const sellAmt = Math.floor(t.tmpl.cost * 0.6);
    const heatBar = t.heat != null
      ? `<div style="font-size:0.6rem;color:#ff8800;margin-top:2px;">HEAT: ${'▮'.repeat(Math.floor(t.heat/20))}${'▯'.repeat(5-Math.floor(t.heat/20))} ${Math.floor(t.heat)}%</div>`
      : '';
    panel.innerHTML = `
      <div style="line-height:1.5;font-size:0.72rem;">
        <span style="font-family:var(--font-main);color:${t.tmpl.color}">${t.tmpl.name}</span>
        <span style="color:#557;"> [LV${t.lv}/${TOWER_MAX_LV}]</span><br>
        ATK:<span style="color:var(--green)"> ${Math.floor(t.getDamage())}</span>　
        RNG: <span style="color:#aab">${Math.floor(t.getRange())}</span>
      </div>
      ${heatBar}
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn-evolve" onclick="upgradeTower()" ${(atMax || gameState.money < uc) ? 'disabled' : ''}>${atMax ? 'MAX' : 'EVOLVE ' + uc + 'C'}</button>
        <button class="btn-sell" onclick="sellTower()">SELL ${sellAmt}C</button>
      </div>
      <div style="display:flex;gap:4px;align-items:center;margin-top:4px;">
        <span style="font-size:0.58rem;color:#446;letter-spacing:1px;">TARGET:</span>
        ${['first','last','strongest','weakest'].map(m=>`<button class="btn-target${gameState.targetMode===m?' active':''}" onclick="setTargetMode('${m}')">${{first:'前線',last:'最後',strongest:'最強',weakest:'最弱'}[m]}</button>`).join('')}
      </div>
    `;
  } else {
    panel.innerHTML = `<span style="color:#446;font-size:0.65rem;letter-spacing:1px;">タップしてタワー配置 / タワーをタップで選択・強化</span>`;
  }

  if (gameState.hp <= 0 && gameState.state === 'playing') {
    gameState.state = 'gameover';
    // Partial reward based on waves survived
    const totalWaves = gameState.stage.waves;
    const wavesDone  = gameState.wave - 1;  // completed waves
    const baseReward = 300 + (gameState.stage.id >= 3 ? 150 : 0);
    const partialReward = wavesDone > 0
      ? Math.floor(baseReward * (wavesDone / totalWaves) * 0.5)
      : 0;
    if (partialReward > 0) {
      playerData.crystals += partialReward;
      if (typeof autoSave === 'function') autoSave('gameover-partial');
      if (typeof updateMeta === 'function') updateMeta();
    }
    const rewardMsg = partialReward > 0
      ? `\nWAVE ${wavesDone}/${totalWaves} まで防衛。残存データより ${partialReward} コア結晶を回収した。`
      : `\n防衛記録なし。コア結晶は回収できなかった。`;
    showModal("SYSTEM FAILURE", "防衛グリッド崩壊。" + rewardMsg, "var(--red)");
  }
}

function upgradeTower() {
  if (!gameState?.selectedTower) return;
  const t = gameState.selectedTower;
  if (t.lv >= TOWER_MAX_LV) return;
  const c = t.getUpgradeCost();
  if (gameState.money >= c) {
    gameState.money -= c;
    t.lv++;
    spawnParticles(t.x, t.y, '#fff', 30);
    gameState.floatingTexts.push(new FloatText(t.x, t.y, `EVOLVE LV${t.lv}`, 'var(--pink)'));
    gameState.screenShake = 8;
    updateGameUI();
  }
}

function sellTower() {
  if (!gameState?.selectedTower) return;
  const t = gameState.selectedTower;
  const refund = Math.floor(t.tmpl.cost * 0.6);
  gameState.towers = gameState.towers.filter(tw => tw !== t);
  gameState.money += refund;
  gameState.floatingTexts.push(new FloatText(t.x, t.y, `SELL +${refund}C`, '#ffaa00'));
  spawnParticles(t.x, t.y, t.tmpl.color, 20);
  gameState.selectedTower = null;
  updateGameUI();
}

function setTargetMode(mode) {
  if (!gameState) return;
  gameState.targetMode = mode;
  updateGameUI();
}

function showModal(title, desc, color) {
  const m = document.getElementById('game-modal');
  const mt = document.getElementById('modal-title');
  mt.innerText = title;
  mt.style.color = color;
  mt.style.textShadow = `0 0 20px ${color}`;
  document.getElementById('modal-desc').innerText = desc;
  m.style.display = 'flex';
  document.getElementById('modal-close-btn').onclick = () => {
    m.style.display = 'none';
    endGameLoop();
    switchScreen('stage');
  };
}

// ──────────────────────────────────────────────
//  ENEMY CLASS
// ──────────────────────────────────────────────
class Enemy {
  constructor(wave, isBoss = false) {
    this.x = battlePath[0].x;
    this.y = battlePath[0].y;
    this.pathIdx   = 0;
    this.angle     = 0;
    this.slowTimer = 0;
    this.isBoss    = isBoss;
    this.infected  = 0;  // DOT countdown for VIRUS

    const biome = gameState.stage.biome;

    // Scale more steeply with wave
    let hm = 1 + wave * 0.55;
    if (biome === 'cyber')  hm *= 1.5;
    if (biome === 'void')   hm *= 1.3;
    if (biome === 'storm')  hm *= 1.6;

    if (isBoss) {
      this.type = 'BOSS'; this.spd = 0.6 + wave * 0.04;
      this.maxHp = 900 * hm; this.sz = 26; this.reward = 200;
      // Boss colour by biome
      const bossColors = { forest:'#cc44ff', desert:'#ff8800', cyber:'#00eeff',
                           void:'#ff00ff', swamp:'#88ff00', storm:'#ffff00' };
      this.color = bossColors[biome] || '#cc44ff';
      this.regenRate = wave >= 4 ? 0.6 : 0;
    } else {
      // void stage forces more GHOST
      const ghostBoost = biome === 'void' ? 5 : (wave >= 5 ? 2 : 0);
      // swamp stage forces more REGEN
      const regenBoost = biome === 'swamp' ? 4 : (wave >= 3 ? 2 : 0);

      const types   = ['NORM','RUN','TANK','SHIELD','SWARM','REGEN','GHOST','ARMOR','SPLITTER'];
      const weights = [
        3,                           // NORM
        3,                           // RUN
        2,                           // TANK
        2,                           // SHIELD
        3,                           // SWARM
        regenBoost,                  // REGEN
        ghostBoost,                  // GHOST
        wave >= 4 ? 2 : 0,           // ARMOR (new) — from wave 4
        wave >= 6 ? 1 : 0,           // SPLITTER (new) — from wave 6
      ];
      const total = weights.reduce((a,b)=>a+b,0);
      let rnd = Math.random() * total, t = types[0];
      for (let wi=0;wi<types.length;wi++) { rnd -= weights[wi]; if (rnd <= 0) { t = types[wi]; break; } }
      this.type = t;
      const cfg = {
        NORM:     { spd:1.5,  maxHp:45*hm,   color:'#ff4466', sz:13, reward:12 },
        RUN:      { spd:3.2,  maxHp:25*hm,   color:'#ff55bb', sz:11, reward:16 },
        TANK:     { spd:0.7,  maxHp:150*hm,  color:'#ffaa00', sz:19, reward:28 },
        SHIELD:   { spd:1.1,  maxHp:70*hm,   color:'#44ddff', sz:15, reward:22, shield:40*hm },
        SWARM:    { spd:2.3,  maxHp:18*hm,   color:'#44ff99', sz:9,  reward:8  },
        REGEN:    { spd:1.2,  maxHp:80*hm,   color:'#88ff44', sz:14, reward:20, regenRate:1.5 },
        GHOST:    { spd:1.8,  maxHp:55*hm,   color:'#cc88ff', sz:12, reward:24, ghosted:true  },
        ARMOR:    { spd:0.9,  maxHp:110*hm,  color:'#cc6600', sz:17, reward:30, armored:true  }, // 物理50%軽減
        SPLITTER: { spd:1.6,  maxHp:60*hm,   color:'#ff6688', sz:15, reward:35, splits:true   }, // 死亡時に2体のSWARMを生成
      };
      Object.assign(this, cfg[t]);
      if (!this.regenRate) this.regenRate = 0;
      if (!this.ghosted)   this.ghosted   = false;
      if (!this.armored)   this.armored   = false;
      if (!this.splits)    this.splits    = false;
    }

    // biome speed modifiers
    if (biome === 'desert') this.spd *= 1.35;
    if (biome === 'storm')  this.spd *= 1.2;

    this.hp = this.maxHp;
    if (!this.shield) this.shield = 0;
  }

  update() {
    const tgt = battlePath[this.pathIdx + 1];
    if (!tgt) return;
    let s = this.spd;
    if (this.slowTimer > 0) { s *= 0.45; this.slowTimer--; }

    // VORTEX pull (handled in Tower.update, but enemies get a flag)
    if (this.pulled) { s *= 0.5; this.pulled = false; }

    // Regen HP
    if (this.regenRate > 0 && this.hp > 0 && this.hp < this.maxHp) {
      let rr = this.regenRate;
      if (gameState.stage.biome === 'swamp') rr *= 1.5;
      this.hp = Math.min(this.maxHp, this.hp + rr);
    }

    // VIRUS DOT damage
    if (this.infected > 0) {
      this.hp -= 1.0;
      this.infected--;
    }

    const dx = tgt.x - this.x, dy = tgt.y - this.y, d = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);
    if (d < s) {
      this.x = tgt.x; this.y = tgt.y; this.pathIdx++;
      if (this.pathIdx >= battlePath.length - 1) {
        gameState.hp -= this.isBoss ? 7 : 1;
        updateGameUI();
        this.hp = 0;
      }
    } else {
      this.x += dx / d * s;
      this.y += dy / d * s;
    }
  }

  takeDamage(dmg) {
    if (this.armored) dmg *= 0.5;  // ARMOR type — 50% damage reduction
    if (this.shield > 0) {
      this.shield -= dmg;
      if (this.shield < 0) { this.hp += this.shield; this.shield = 0; }
    } else {
      this.hp -= dmg;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur  = this.isBoss ? 35 : 20;
    ctx.shadowColor = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 2;
    ctx.fillStyle   = this.ghosted ? 'rgba(40,10,60,0.5)' : 'rgba(4,4,20,0.88)';
    if (this.ghosted) ctx.globalAlpha = 0.65;
    ctx.rotate(this.angle);

    if (this.isBoss) {
      for (let layer = 0; layer < 2; layer++) {
        const r   = this.sz * (layer ? 0.6 : 1);
        const pts = layer ? 6 : 8;
        ctx.save();
        ctx.rotate(gameState.frame * 0.015 * (layer ? -1 : 1));
        ctx.beginPath();
        for (let i = 0; i < pts; i++) {
          const a  = Math.PI * 2 / pts * i;
          const rr = r * (i % 2 === 0 ? 1 : 0.7);
          ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, this.sz * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = this.color; ctx.fill();

    } else if (this.type === 'NORM') {
      ctx.rotate(gameState.frame * 0.04);
      ctx.beginPath(); ctx.rect(-this.sz/2, -this.sz/2, this.sz, this.sz);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-this.sz/2, 0); ctx.lineTo(this.sz/2, 0);
      ctx.moveTo(0, -this.sz/2); ctx.lineTo(0, this.sz/2);
      ctx.stroke();

    } else if (this.type === 'RUN') {
      ctx.beginPath();
      ctx.moveTo(this.sz, 0);
      ctx.lineTo(-this.sz, -this.sz * 0.65);
      ctx.lineTo(-this.sz * 0.35, 0);
      ctx.lineTo(-this.sz,  this.sz * 0.65);
      ctx.closePath(); ctx.fill(); ctx.stroke();

    } else if (this.type === 'TANK') {
      for (let s2 = 1; s2 >= 0.55; s2 -= 0.45) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i;
          ctx.lineTo(Math.cos(a) * this.sz * s2, Math.sin(a) * this.sz * s2);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }

    } else if (this.type === 'SHIELD') {
      ctx.strokeStyle = '#44ddff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, this.sz, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = this.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(-this.sz*0.6, -this.sz*0.6, this.sz*1.2, this.sz*1.2);
      ctx.fill(); ctx.stroke();

    } else if (this.type === 'SWARM') {
      ctx.rotate(gameState.frame * 0.08);
      for (let i = 0; i < 3; i++) {
        const a = Math.PI * 2 / 3 * i;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * this.sz * 0.5, Math.sin(a) * this.sz * 0.5, this.sz * 0.4, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
    } else if (this.type === 'REGEN') {
      ctx.rotate(gameState.frame * 0.02);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 2 / 5 * i;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * this.sz, Math.sin(a) * this.sz);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, this.sz * 0.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

    } else if (this.type === 'GHOST') {
      ctx.globalAlpha = 0.45;
      ctx.rotate(gameState.frame * 0.03);
      ctx.beginPath();
      ctx.arc(0, 0, this.sz, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(0, 0, this.sz * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#cc88ff'; ctx.fill();

    } else if (this.type === 'ARMOR') {
      // ヘキサゴン + 外装プレート
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI/3*i - Math.PI/6;
        ctx.lineTo(Math.cos(a)*this.sz, Math.sin(a)*this.sz);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 3; ctx.globalAlpha = 0.6;
      for (let i = 0; i < 6; i++) {
        const a1 = Math.PI/3*i - Math.PI/6, a2 = Math.PI/3*(i+1) - Math.PI/6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a1)*this.sz*1.15, Math.sin(a1)*this.sz*1.15);
        ctx.lineTo(Math.cos(a2)*this.sz*1.15, Math.sin(a2)*this.sz*1.15);
        ctx.stroke();
      }

    } else if (this.type === 'SPLITTER') {
      // ダイヤモンド型 + 内部の分裂ライン
      ctx.beginPath();
      ctx.moveTo(0, -this.sz); ctx.lineTo(this.sz, 0);
      ctx.lineTo(0, this.sz);  ctx.lineTo(-this.sz, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(-this.sz*0.7, 0); ctx.lineTo(this.sz*0.7, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -this.sz*0.7); ctx.lineTo(0, this.sz*0.7); ctx.stroke();
      ctx.setLineDash([]);
    }

    // INFECTED indicator
    if (this.infected > 0) {
      ctx.rotate(-this.angle);
      ctx.strokeStyle = '#55ff44'; ctx.lineWidth = 1.5; ctx.setLineDash([2,2]);
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(0, 0, this.sz + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.slowTimer > 0) {
      ctx.rotate(-this.angle);
      ctx.strokeStyle = '#88ccff'; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.arc(0, 0, this.sz + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // HP / shield bars
    const bw = this.isBoss ? 48 : 36;
    const barY = this.y - this.sz - 14;
    if (this.shield > 0) {
      ctx.fillStyle = '#003355';
      ctx.fillRect(this.x - bw/2, barY - 6, bw, 4);
      ctx.fillStyle = '#44ddff';
      ctx.fillRect(this.x - bw/2, barY - 6, bw * Math.min(1, this.shield / (this.maxHp * 0.5)), 4);
    }
    ctx.fillStyle = '#220010';
    ctx.fillRect(this.x - bw/2, barY, bw, 5);
    const hpR = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpR > 0.5 ? '#00ff88' : hpR > 0.25 ? '#ffaa00' : '#ff3355';
    ctx.fillRect(this.x - bw/2, barY, bw * hpR, 5);

    if (!this.isBoss) {
      ctx.save();
      ctx.font = 'bold 8px "Share Tech Mono", monospace';
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.9;
      ctx.textAlign = 'center';
      ctx.fillText(this.type, this.x, barY - 10);
      ctx.restore();
    } else {
      ctx.save();
      ctx.font = 'bold 10px "Orbitron", monospace';
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10; ctx.shadowColor = this.color;
      ctx.fillText('OVERDRIVE BOSS', this.x, barY - 10);
      ctx.restore();
    }
  }
}

// ──────────────────────────────────────────────
//  TOWER CLASS
// ──────────────────────────────────────────────
class Tower {
  constructor(c, r, tmpl) {
    this.c    = c; this.r = r;
    this.x    = c * GS + GS / 2;
    this.y    = r * GS + GS / 2;
    this.tmpl = tmpl;
    this.lv   = 1; this.cd = 0; this.angle = 0;
    // OVERLOAD heat gauge
    if (tmpl.special === 'overload') this.heat = 0;
  }

  getDamage() {
    const bf = 1 + (playerData.baseLevels[this.tmpl.id] - 1) * 0.1;
    const ef = 1 + (this.lv - 1) * 0.28;
    let d = this.tmpl.damage * bf * ef;
    if (gameState.stage.biome === 'cyber') d *= 1.1;
    return d;
  }

  getRange() {
    let r = this.tmpl.range + (this.lv - 1) * 12;
    if (gameState.stage.biome === 'forest' && this.tmpl.id === 2) r *= 1.3;
    if (this.tmpl.id === 6) r = 800;
    // Storm stage: TESLA range ×1.5
    if (gameState.stage.biome === 'storm' && this.tmpl.id === 3) r *= 1.5;
    // VORTEX bonus on void stage
    if (gameState.stage.biome === 'void' && this.tmpl.special === 'vortex') r *= 1.3;
    return r;
  }

  getUpgradeCost() { return Math.floor(this.tmpl.cost * 0.9 * this.lv); }

  // CD with storm gimmick
  getCooldown() {
    let cd = this.tmpl.cooldown;
    if (gameState.stage.biome === 'storm') cd = Math.floor(cd * 1.2);
    return cd;
  }

  update() {
    if (this.cd > 0) { this.cd--; return; }
    const rng = this.getRange();
    const inRange = gameState.enemies.filter(e => Math.hypot(e.x - this.x, e.y - this.y) < rng);
    if (inRange.length === 0) return;

    let tgt = null;
    const mode = gameState.targetMode || 'first';
    if (mode === 'first') {
      inRange.sort((a,b) => {
        if (b.pathIdx !== a.pathIdx) return b.pathIdx - a.pathIdx;
        const nA = battlePath[a.pathIdx+1], nB = battlePath[b.pathIdx+1];
        const da = nA ? Math.hypot(a.x-nA.x, a.y-nA.y) : 0;
        const db = nB ? Math.hypot(b.x-nB.x, b.y-nB.y) : 0;
        return da - db;
      });
      tgt = inRange[0];
    } else if (mode === 'last') {
      inRange.sort((a,b) => {
        if (a.pathIdx !== b.pathIdx) return a.pathIdx - b.pathIdx;
        const nA = battlePath[a.pathIdx+1], nB = battlePath[b.pathIdx+1];
        const da = nA ? Math.hypot(a.x-nA.x, a.y-nA.y) : 0;
        const db = nB ? Math.hypot(b.x-nB.x, b.y-nB.y) : 0;
        return db - da;
      });
      tgt = inRange[0];
    } else if (mode === 'strongest') {
      tgt = inRange.reduce((best, e) => (e.hp + (e.shield||0)) > (best.hp + (best.shield||0)) ? e : best, inRange[0]);
    } else if (mode === 'weakest') {
      tgt = inRange.reduce((best, e) => (e.hp + (e.shield||0)) < (best.hp + (best.shield||0)) ? e : best, inRange[0]);
    }
    if (!tgt) return;
    this.angle = Math.atan2(tgt.y - this.y, tgt.x - this.x);

    // ── SPECIAL ATTACK DISPATCH ────────────────────────────────────
    const sp = this.tmpl.special;

    if (this.tmpl.id === 3) {
      // TESLA – AOE pulse (storm stage triggers full aoe on every shot)
      gameState.enemies.forEach(e => {
        if (Math.hypot(e.x - this.x, e.y - this.y) <= this.getRange()) {
          e.takeDamage(this.getDamage());
          spawnParticles(e.x, e.y, this.tmpl.color, 4);
        }
      });
      addEffect({ type:'tesla', x:this.x, y:this.y, r:this.getRange(), t:8 });

    } else if (this.tmpl.id === 6) {
      // RAILGUN
      this.angle = Math.atan2(tgt.y - this.y, tgt.x - this.x);
      const cos = Math.cos(this.angle), sin = Math.sin(this.angle);
      gameState.enemies.forEach(e => {
        const ex = e.x - this.x, ey = e.y - this.y;
        const proj = ex * cos + ey * sin;
        const perp = Math.abs(-ex * sin + ey * cos);
        if (proj > 0 && perp < 18) {
          e.takeDamage(this.getDamage());
          spawnParticles(e.x, e.y, this.tmpl.color, 8);
        }
      });
      gameState.railBeams.push({
        x1:this.x, y1:this.y,
        x2:this.x + cos*800, y2:this.y + sin*800,
        t:12, color:this.tmpl.color
      });

    } else if (sp === 'vortex') {
      // VORTEX — pull enemies toward tower, then damage
      const pullMult = gameState.stage.biome === 'void' ? 2 : 1;
      inRange.forEach(e => {
        const dx = this.x - e.x, dy = this.y - e.y;
        const d  = Math.hypot(dx, dy) || 1;
        e.x += (dx/d) * 6 * pullMult;
        e.y += (dy/d) * 6 * pullMult;
        e.pulled = true;
        e.takeDamage(this.getDamage());
        spawnParticles(e.x, e.y, this.tmpl.color, 3);
      });
      addEffect({ type:'vortex', x:this.x, y:this.y, r:this.getRange(), t:12 });

    } else if (sp === 'virus') {
      // VIRUS — infect target with DOT
      const infectDuration = gameState.stage.biome === 'swamp' ? 220 : 150;
      tgt.infected = infectDuration;
      gameState.projectiles.push(new Projectile(this.x, this.y, tgt, this));
      spawnParticles(tgt.x, tgt.y, '#55ff44', 8);

    } else if (sp === 'overload') {
      // OVERLOAD — accumulate heat; at 100 trigger explosion
      this.heat = (this.heat || 0) + 22;
      if (this.heat >= 100) {
        // OVERHEAT BLAST
        addEffect({ type:'explosion', x:this.x, y:this.y, r:90, t:16 });
        gameState.enemies.forEach(e => {
          if (Math.hypot(e.x-this.x, e.y-this.y) <= 90) e.takeDamage(this.getDamage() * 4);
        });
        gameState.floatingTexts.push(new FloatText(this.x, this.y, 'OVERHEAT!!', '#ff8800'));
        gameState.screenShake = 12;
        this.heat = 0;
      } else {
        gameState.projectiles.push(new Projectile(this.x, this.y, tgt, this));
      }

    } else if (sp === 'mirror') {
      // MIRROR — projectile bounces to a second enemy
      gameState.projectiles.push(new MirrorProjectile(this.x, this.y, tgt, this, inRange));

    } else if (sp === 'omega') {
      // OMEGA — attack ALL enemies in range simultaneously
      inRange.forEach(e => {
        e.takeDamage(this.getDamage());
        spawnParticles(e.x, e.y, '#ff2200', 12);
        // beam from tower to each enemy
        gameState.omegaBeams.push({ x1:this.x, y1:this.y, x2:e.x, y2:e.y, t:14 });
      });
      gameState.screenShake = 15;
      gameState.floatingTexts.push(new FloatText(this.x, this.y, `OMEGA×${inRange.length}`, '#ff2200'));

    } else {
      gameState.projectiles.push(new Projectile(this.x, this.y, tgt, this));
      if (this.lv >= 2 && Math.random() < 0.35) {
        const captTgt = tgt;
        setTimeout(() => {
          if (gameState && captTgt.hp > 0)
            gameState.projectiles.push(new Projectile(this.x, this.y, captTgt, this));
        }, 70);
      }
    }
    this.cd = this.getCooldown();
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur  = 18;
    ctx.shadowColor = this.tmpl.color;
    ctx.fillStyle   = 'rgba(4,6,24,0.92)';
    ctx.strokeStyle = gameState.selectedTower === this ? '#ffffff' : this.tmpl.color;
    ctx.lineWidth   = gameState.selectedTower === this ? 2.5 : 1.8;

    // LV3 orbiting dots
    if (this.lv >= 3) {
      ctx.save();
      ctx.rotate(gameState.frame * 0.07);
      ctx.fillStyle = this.tmpl.color; ctx.shadowBlur = 20;
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 2 * i;
        ctx.beginPath();
        ctx.arc(Math.cos(a)*23, Math.sin(a)*23, 3, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = this.tmpl.color + '55'; ctx.lineWidth = 0.5; ctx.setLineDash([2,4]);
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = gameState.selectedTower === this ? '#ffffff' : this.tmpl.color;
      ctx.lineWidth   = gameState.selectedTower === this ? 2.5 : 1.8;
    }
    // LV2 ring
    if (this.lv >= 2) {
      ctx.strokeStyle = this.tmpl.color + '66'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = gameState.selectedTower === this ? '#ffffff' : this.tmpl.color;
      ctx.lineWidth   = gameState.selectedTower === this ? 2.5 : 1.8;
    }

    // OVERLOAD heat aura
    if (this.heat != null && this.heat > 0) {
      const heatAlpha = this.heat / 100 * 0.5;
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, 18 + this.heat * 0.2, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,${Math.floor(136*(1-this.heat/100))},0,${heatAlpha})`;
      ctx.fill();
      ctx.restore();
    }

    this.drawShape();

    // Barrel
    ctx.save();
    ctx.rotate(this.angle);
    const bw = this.lv >= 2 ? 7 : 4.5;
    const bl = this.lv >= 3 ? 22 : 16;
    ctx.fillStyle = 'rgba(200,220,255,0.92)';
    ctx.fillRect(0, -bw/2, bl, bw);
    ctx.fillStyle = this.tmpl.color;
    ctx.fillRect(bl-3, -bw/2-1, 4, bw+2);
    ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  drawShape() {
    const id = this.tmpl.id;
    if (id===0||id===4||id===7) {
      ctx.fillRect(-13,-13,26,26); ctx.strokeRect(-13,-13,26,26);
    } else if (id===1||id===5) {
      ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(14,12); ctx.lineTo(-14,12); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (id===2) {
      ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(15,0); ctx.lineTo(0,15); ctx.lineTo(-15,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (id===3) {
      ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.strokeRect(-6,-6,12,12);
    } else if (id===6) {
      ctx.beginPath(); ctx.moveTo(-5,-16); ctx.lineTo(5,-16); ctx.lineTo(8,16); ctx.lineTo(-8,16); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (id===8) {
      // VORTEX — spiral shape
      ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.rotate(gameState.frame * 0.05);
      ctx.strokeStyle = this.tmpl.color + 'aa'; ctx.lineWidth=1;
      for (let i = 0; i < 3; i++) {
        const a = Math.PI*2/3*i;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*13, Math.sin(a)*13); ctx.stroke();
      }
      ctx.restore();
    } else if (id===9) {
      // VIRUS — biohazard shape
      ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const a = Math.PI*2/3*i;
        ctx.beginPath(); ctx.arc(Math.cos(a)*12, Math.sin(a)*12, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      }
    } else if (id===10) {
      // OVERLOAD — double square
      ctx.fillRect(-13,-13,26,26); ctx.strokeRect(-13,-13,26,26);
      ctx.save();
      ctx.rotate(Math.PI/4);
      ctx.strokeStyle = this.tmpl.color + '88'; ctx.lineWidth=1;
      ctx.strokeRect(-10,-10,20,20);
      ctx.restore();
    } else if (id===11) {
      // MIRROR — diamond
      ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(14,0); ctx.lineTo(0,14); ctx.lineTo(-14,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = this.tmpl.color + '66';
      ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(10,0); ctx.stroke();
    } else if (id===12) {
      // OMEGA — star
      for (let i = 0; i < 8; i++) {
        const a = Math.PI/4*i + gameState.frame*0.01;
        const r = i%2===0 ? 15 : 7;
        ctx[i===0?'moveTo':'lineTo'](Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
}

// ──────────────────────────────────────────────
//  PROJECTILE CLASSES
// ──────────────────────────────────────────────
class Projectile {
  constructor(x, y, tgt, src) {
    this.x = x; this.y = y; this.tgt = tgt; this.src = src;
    this.spd   = src.tmpl.id === 1 ? 18 : src.tmpl.id === 5 ? 14 : 10;
    this.alive = true;
  }

  update() {
    if (!this.alive || this.tgt.hp <= 0) { this.alive = false; return; }
    const dx = this.tgt.x - this.x, dy = this.tgt.y - this.y, d = Math.hypot(dx, dy);
    if (d < this.spd) {
      if (this.src.tmpl.id === 2) {
        this.tgt.slowTimer = 110;
      } else if (this.src.tmpl.id === 4) {
        addEffect({ type:'explosion', x:this.x, y:this.y, r:65, t:14 });
        gameState.enemies.forEach(e => { if (Math.hypot(e.x-this.x, e.y-this.y) <= 65) e.takeDamage(this.src.getDamage()); });
        gameState.screenShake = 6;
      } else if (this.src.tmpl.id === 5) {
        this.tgt.hp -= this.src.getDamage(); // PHANTOM ignores shield and ghost
      } else if (this.src.tmpl.special === 'virus') {
        this.tgt.takeDamage(this.src.getDamage());
        // Re-apply infection
        const infectDuration = gameState.stage.biome === 'swamp' ? 220 : 150;
        this.tgt.infected = infectDuration;
      } else {
        let dmg = this.src.getDamage();
        if (this.tgt.ghosted && this.src.tmpl.id !== 5) dmg *= 0.4;
        this.tgt.takeDamage(dmg);
      }
      spawnParticles(this.x, this.y, this.src.tmpl.color, 7);
      this.alive = false;
    } else {
      this.x += dx / d * this.spd;
      this.y += dy / d * this.spd;
    }
  }

  draw() {
    if (!this.alive) return;
    ctx.save();
    ctx.shadowBlur = 14; ctx.shadowColor = this.src.tmpl.color;
    ctx.fillStyle  = this.src.tmpl.color;
    const sz = this.src.lv >= 3 ? 5 : 3.5;
    ctx.beginPath(); ctx.arc(this.x, this.y, sz, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(this.x, this.y, sz+2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

// MIRROR projectile — bounces once to a second target
class MirrorProjectile extends Projectile {
  constructor(x, y, tgt, src, pool) {
    super(x, y, tgt, src);
    this.bounced = false;
    this.pool = pool;
  }

  update() {
    if (!this.alive || this.tgt.hp <= 0) { this.alive = false; return; }
    const dx = this.tgt.x - this.x, dy = this.tgt.y - this.y, d = Math.hypot(dx, dy);
    if (d < this.spd) {
      let dmg = this.src.getDamage();
      if (this.tgt.ghosted) dmg *= 0.4;
      this.tgt.takeDamage(dmg);
      spawnParticles(this.x, this.y, this.src.tmpl.color, 7);

      if (!this.bounced) {
        // Find another enemy to bounce to
        const others = this.pool.filter(e => e !== this.tgt && e.hp > 0);
        if (others.length > 0) {
          this.bounced = true;
          const bounce = others.reduce((closest, e) => {
            return Math.hypot(e.x-this.x, e.y-this.y) < Math.hypot(closest.x-this.x, closest.y-this.y) ? e : closest;
          }, others[0]);
          this.x = this.tgt.x; this.y = this.tgt.y;
          this.tgt = bounce;
          spawnParticles(this.x, this.y, '#88eeff', 5);
          return; // don't kill — let it continue to bounce target
        }
      }
      this.alive = false;
    } else {
      this.x += dx / d * this.spd;
      this.y += dy / d * this.spd;
    }
  }
}

// ──────────────────────────────────────────────
//  PARTICLES & FLOAT TEXT
// ──────────────────────────────────────────────
class Particle {
  constructor(x, y, c) {
    this.x = x; this.y = y; this.c = c;
    const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 4;
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
    this.life = 1; this.decay = 0.02 + Math.random() * 0.04;
  }
  update() { this.x += this.vx; this.y += this.vy; this.vy += 0.05; this.life -= this.decay; }
  draw() {
    ctx.save(); ctx.globalAlpha = this.life;
    ctx.shadowBlur = 6; ctx.shadowColor = this.c;
    ctx.fillStyle = this.c; ctx.fillRect(this.x, this.y, 3, 3);
    ctx.restore();
  }
}

class FloatText {
  constructor(x, y, t, c) { this.x = x; this.y = y; this.t = t; this.c = c; this.life = 1; }
  update() { this.y -= 0.8; this.life -= 0.02; }
  draw() {
    ctx.save(); ctx.globalAlpha = this.life;
    ctx.font = 'bold 13px "Orbitron",monospace';
    ctx.fillStyle = this.c;
    ctx.shadowBlur = 8; ctx.shadowColor = this.c;
    ctx.fillText(this.t, this.x - 20, this.y);
    ctx.restore();
  }
}

function spawnParticles(x, y, c, n) {
  for (let i = 0; i < n; i++) gameState.particles.push(new Particle(x, y, c));
}
function addEffect(e) { effects.push(e); }

// ──────────────────────────────────────────────
//  DRAW BACKGROUND + PATH
// ──────────────────────────────────────────────
function drawBackground() {
  const stage = gameState.stage;

  const bgGrad = ctx.createRadialGradient(400, 250, 80, 400, 250, 500);
  const bgMap = {
    forest: ['#080e0a','#030806'],
    desert: ['#0e0a04','#070500'],
    cyber:  ['#060814','#020408'],
    void:   ['#080010','#020008'],
    swamp:  ['#060c02','#020600'],
    storm:  ['#0e0e04','#060600'],
  };
  const [bg0, bg1] = bgMap[stage.biome] || bgMap.cyber;
  bgGrad.addColorStop(0, bg0);
  bgGrad.addColorStop(1, bg1);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Biome ambient particles (void: floating purple dots, storm: flickering yellow lines)
  if (stage.biome === 'void' && gameState.frame % 3 === 0) {
    ctx.save();
    ctx.fillStyle = '#cc44ff';
    ctx.globalAlpha = 0.15 + Math.random() * 0.1;
    ctx.shadowBlur = 10; ctx.shadowColor = '#cc44ff';
    const vx = Math.random() * canvas.width, vy = Math.random() * canvas.height;
    ctx.fillRect(vx, vy, 2, 2);
    ctx.restore();
  }
  if (stage.biome === 'storm' && gameState.frame % 60 === 0) {
    // Lightning flash
    ctx.save();
    ctx.strokeStyle = '#ffffaa';
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    const lx = Math.random() * canvas.width;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx + (Math.random()-0.5)*60, canvas.height); ctx.stroke();
    ctx.restore();
  }

  const gcMap = {
    forest: 'rgba(0,200,80,0.12)',
    desert: 'rgba(220,140,0,0.12)',
    cyber:  'rgba(0,200,255,0.12)',
    void:   'rgba(180,0,255,0.12)',
    swamp:  'rgba(80,200,0,0.12)',
    storm:  'rgba(255,255,0,0.12)',
  };
  const gc = gcMap[stage.biome] || gcMap.cyber;
  ctx.strokeStyle = gc;
  ctx.lineWidth   = 0.7;
  for (let i = 0; i <= canvas.width;  i += GS) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
  for (let i = 0; i <= canvas.height; i += GS) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

  ctx.fillStyle = gc.replace('0.12', '0.25');
  for (let i = 0; i <= canvas.width;  i += GS) {
    for (let j = 0; j <= canvas.height; j += GS) {
      ctx.fillRect(i - 0.5, j - 0.5, 1.5, 1.5);
    }
  }

  pathCells.forEach(key => {
    const [c, r] = key.split(',').map(Number);
    ctx.fillStyle = 'rgba(255,40,80,0.04)';
    ctx.fillRect(c * GS, r * GS, GS, GS);
  });

  // Path road
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(6,5,18,0.94)'; ctx.lineWidth = 50;
  ctx.beginPath(); ctx.moveTo(battlePath[0].x, battlePath[0].y);
  for (let i = 1; i < battlePath.length; i++) ctx.lineTo(battlePath[i].x, battlePath[i].y);
  ctx.stroke();

  ctx.strokeStyle = stage.color;
  ctx.lineWidth   = 3;
  ctx.shadowBlur  = 18; ctx.shadowColor = stage.color;
  ctx.globalAlpha = 0.7;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  ctx.stroke();

  ctx.setLineDash([10, 20]);
  ctx.lineDashOffset = -(gameState.frame * 1.0 % 30);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  drawPathArrows(stage.color);
}

function drawPathArrows(color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowBlur = 6; ctx.shadowColor = color;
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < battlePath.length - 1; i++) {
    const p1 = battlePath[i], p2 = battlePath[i+1];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const ux = dx/len, uy = dy/len;
    const steps = Math.floor(len / 80);
    for (let s = 1; s <= steps; s++) {
      const ax = p1.x + ux * s * 80;
      const ay = p1.y + uy * s * 80;
      const angle = Math.atan2(uy, ux);
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-5, -4); ctx.lineTo(-5, 4);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

// ──────────────────────────────────────────────
//  HOVER PREVIEW
// ──────────────────────────────────────────────
function drawPreview() {
  if (!gameState?.hoverCell) return;
  const { c, r } = gameState.hoverCell;
  const cx = c * GS + GS / 2, cy = r * GS + GS / 2;
  const occupied = gameState.towers.some(t => t.c === c && t.r === r);

  if (occupied) {
    const tw = gameState.towers.find(t => t.c === c && t.r === r);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.arc(tw.x, tw.y, tw.getRange(), 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  const onPath = pathCells.has(`${c},${r}`);
  const tmpl   = gameState.stageActiveChars[gameState.selectedBuildIdx];
  const built  = gameState.towers.filter(t => t.tmpl.id === tmpl.id).length;
  const canBuild = !onPath && gameState.money >= tmpl.cost && built < tmpl.max;
  const rng = tmpl.range + (gameState.stage.biome === 'forest' && tmpl.id === 2 ? tmpl.range * 0.3 : 0);

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, rng, 0, Math.PI*2);
  ctx.fillStyle = canBuild ? 'rgba(0,245,255,0.05)' : 'rgba(255,40,60,0.07)';
  ctx.fill();
  ctx.strokeStyle = canBuild ? tmpl.color : 'var(--red)';
  ctx.lineWidth = 1.5; ctx.setLineDash([3,5]);
  ctx.stroke(); ctx.setLineDash([]);

  ctx.fillStyle   = canBuild ? tmpl.color : '#ff3355';
  ctx.globalAlpha = 0.3;
  ctx.fillRect(cx - 13, cy - 13, 26, 26);
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = canBuild ? tmpl.color : '#ff3355';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 13, cy - 13, 26, 26);
  ctx.restore();
}

// ──────────────────────────────────────────────
//  MAIN GAME LOOP
// ──────────────────────────────────────────────
function gameLoop() {
  if (!gameState || gameState.state !== 'playing') return;

  let sx = 0, sy = 0;
  if (gameState.screenShake > 0) {
    sx = (Math.random() - 0.5) * gameState.screenShake;
    sy = (Math.random() - 0.5) * gameState.screenShake;
    gameState.screenShake *= 0.82;
    if (gameState.screenShake < 0.5) gameState.screenShake = 0;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(sx, sy);

  drawBackground();

  // Spawn enemies
  gameState.waveTimer++;
  const spawnInterval = Math.max(14, 55 - gameState.wave * 5);
  const spawnWindow = 500 + gameState.wave * 30;
  if (gameState.waveTimer < spawnWindow && gameState.waveTimer % spawnInterval === 0) {
    gameState.enemies.push(new Enemy(gameState.wave, false));
    if (gameState.wave >= 5 && Math.random() < 0.35)
      gameState.enemies.push(new Enemy(gameState.wave, false));
  }
  if (gameState.wave === gameState.stage.waves && gameState.waveTimer >= 350 && !gameState.spawnedBoss) {
    gameState.enemies.push(new Enemy(gameState.wave, true));
    gameState.floatingTexts.push(new FloatText(canvas.width/2, 160, "⚠ OVERDRIVE BOSS DETECTED", "var(--red)"));
    gameState.spawnedBoss  = true;
    gameState.screenShake  = 20;
  }

  // Wave progression
  if (gameState.enemies.length === 0 && gameState.waveTimer > 650) {
    if (gameState.wave < gameState.stage.waves) {
      gameState.wave++;
      gameState.waveTimer  = 0;
      gameState.spawnedBoss = false;
      const waveBonus = 60 + gameState.wave * 10;
      gameState.money += waveBonus;
      gameState.floatingTexts.push(new FloatText(canvas.width/2, 100, `WAVE ${gameState.wave} / +${waveBonus}C`, '#00e8ff'));
      updateGameUI();
    } else if (gameState.state === 'playing') {
      gameState.state = 'clear';
      const reward = 300 + (gameState.stage.id >= 3 ? 150 : 0);
      playerData.crystals += reward;
      if (typeof autoSave === 'function') autoSave('mission-clear');
      showModal("MISSION COMPLETE", `セクターコアの完全防衛に成功。報酬: ${reward}コア結晶`, "var(--green)");
      updateMeta();
    }
  }

  // Rail beams
  gameState.railBeams.forEach(b => {
    ctx.save(); ctx.globalAlpha = b.t / 12;
    ctx.strokeStyle = b.color; ctx.lineWidth = 3;
    ctx.shadowBlur = 25; ctx.shadowColor = b.color;
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.lineWidth = 8; ctx.globalAlpha = (b.t / 12) * 0.3; ctx.stroke();
    ctx.restore(); b.t--;
  });
  gameState.railBeams = gameState.railBeams.filter(b => b.t > 0);

  // OMEGA beams
  if (!gameState.omegaBeams) gameState.omegaBeams = [];
  gameState.omegaBeams.forEach(b => {
    ctx.save(); ctx.globalAlpha = b.t / 14;
    ctx.strokeStyle = '#ff2200'; ctx.lineWidth = 2;
    ctx.shadowBlur = 20; ctx.shadowColor = '#ff4400';
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.restore(); b.t--;
  });
  gameState.omegaBeams = gameState.omegaBeams.filter(b => b.t > 0);

  // Towers
  gameState.towers.forEach(t => { t.update(); t.draw(); });

  // Projectiles
  gameState.projectiles.forEach(p => p.update());
  gameState.projectiles.forEach(p => p.draw());
  gameState.projectiles = gameState.projectiles.filter(p => p.alive);

  // Enemies
  const toSpawn = [];
  gameState.enemies.forEach(e => { e.update(); e.draw(); });
  gameState.enemies = gameState.enemies.filter(e => {
    if (e.hp <= 0 && e.pathIdx < battlePath.length - 1) {
      gameState.money += e.reward;
      spawnParticles(e.x, e.y, e.color, e.isBoss ? 80 : 18);
      gameState.floatingTexts.push(new FloatText(e.x, e.y, `+${e.reward}C`, '#ffd700'));
      if (e.isBoss) gameState.screenShake = 25;

      // SPLITTER — spawns 2 SWARM enemies on death
      if (e.splits) {
        for (let k = 0; k < 2; k++) {
          const s = new Enemy(gameState.wave, false);
          s.type = 'SWARM'; s.color = '#44ff99'; s.sz = 9;
          s.spd = 2.5; s.maxHp = e.maxHp * 0.25; s.hp = s.maxHp;
          s.reward = 5; s.splits = false;
          s.x = e.x + (Math.random()-0.5)*20; s.y = e.y + (Math.random()-0.5)*20;
          s.pathIdx = Math.max(0, e.pathIdx);
          toSpawn.push(s);
        }
        gameState.floatingTexts.push(new FloatText(e.x, e.y, 'SPLIT!', '#ff6688'));
      }

      updateGameUI();
      return false;
    }
    return e.hp > 0;
  });
  toSpawn.forEach(s => gameState.enemies.push(s));

  // Special effects
  effects.forEach(ef => {
    ctx.save(); ctx.shadowBlur = 18;
    if (ef.type === 'tesla') {
      ctx.strokeStyle = '#cc44ff'; ctx.lineWidth = 2; ctx.shadowColor = '#cc44ff';
      ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.r, 0, Math.PI*2); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i + gameState.frame * 0.1;
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(ef.x, ef.y);
        ctx.lineTo(ef.x + Math.cos(a) * ef.r, ef.y + Math.sin(a) * ef.r); ctx.stroke();
      }
    } else if (ef.type === 'explosion') {
      const p = ef.t / 14;
      ctx.strokeStyle = '#ff3355'; ctx.shadowColor = '#ff3355'; ctx.lineWidth = 2;
      ctx.fillStyle   = `rgba(255,60,0,${p * 0.12})`;
      ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.r * (1-p), 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 1; ctx.globalAlpha = p * 0.5;
      ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.r * (1.3 - p * 0.3), 0, Math.PI*2); ctx.stroke();
    } else if (ef.type === 'vortex') {
      // Spinning vortex effect
      ctx.strokeStyle = '#aa55ff'; ctx.shadowColor = '#aa55ff'; ctx.lineWidth = 1.5;
      ctx.globalAlpha = ef.t / 12 * 0.7;
      ctx.save();
      ctx.translate(ef.x, ef.y);
      ctx.rotate(gameState.frame * 0.12);
      for (let ri = 1; ri <= 3; ri++) {
        ctx.beginPath(); ctx.arc(0, 0, ef.r * ri / 3, 0, Math.PI * 1.5);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.restore(); ef.t--;
  });
  effects = effects.filter(e => e.t > 0);

  // Particles + float texts
  gameState.particles.forEach(p => { p.update(); p.draw(); });
  gameState.particles = gameState.particles.filter(p => p.life > 0);
  gameState.floatingTexts.forEach(t => { t.update(); t.draw(); });
  gameState.floatingTexts = gameState.floatingTexts.filter(t => t.life > 0);

  drawPreview();
  ctx.restore();
  gameState.frame++;
  animFrameId = requestAnimationFrame(gameLoop);
}

// ──────────────────────────────────────────────
//  INPUT HANDLING
// ──────────────────────────────────────────────
function getGrid(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
  let cx = e.clientX, cy = e.clientY;
  if (e.touches?.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
  const x = (cx - rect.left) * sx, y = (cy - rect.top) * sy;
  if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return null;
  return { c: Math.floor(x / GS), r: Math.floor(y / GS) };
}

function placeTower(cell) {
  if (!cell) return;
  const tw = gameState.towers.find(t => t.c === cell.c && t.r === cell.r);
  if (tw) { gameState.selectedTower = tw; updateGameUI(); return; }
  const onPath = pathCells.has(`${cell.c},${cell.r}`);
  const tmpl   = gameState.stageActiveChars[gameState.selectedBuildIdx];
  const built  = gameState.towers.filter(t => t.tmpl.id === tmpl.id).length;
  if (!onPath && gameState.money >= tmpl.cost && built < tmpl.max) {
    gameState.money -= tmpl.cost;
    const nt = new Tower(cell.c, cell.r, tmpl);
    gameState.towers.push(nt);
    gameState.selectedTower = nt;
    spawnParticles(nt.x, nt.y, tmpl.color, 15);
    gameState.floatingTexts.push(new FloatText(nt.x, nt.y, `${tmpl.name} DEPLOYED`, tmpl.color));
    updateGameUI();
  } else {
    gameState.selectedTower = null;
    updateGameUI();
  }
}

canvas.addEventListener('mousemove',  e => { if (gameState?.state === 'playing') gameState.hoverCell = getGrid(e); });
canvas.addEventListener('mouseleave', () => { if (gameState) gameState.hoverCell = null; });
canvas.addEventListener('click',      e => { if (gameState?.state === 'playing') placeTower(getGrid(e)); });

canvas.addEventListener('touchmove', e => { e.preventDefault(); if (gameState?.state === 'playing') gameState.hoverCell = getGrid(e); }, { passive:false });
canvas.addEventListener('touchstart', e => { e.preventDefault(); if (gameState?.state === 'playing') gameState.hoverCell = getGrid(e); }, { passive:false });
canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (!gameState || gameState.state !== 'playing') return;
  const cell = gameState.hoverCell;
  gameState.hoverCell = null;
  placeTower(cell);
}, { passive:false });
