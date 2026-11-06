/**
 * CampaignStageManager - Mission Waves, Carrier Dialogues, Radio Chatter, Boss Encounters
 */

class CampaignStageManager {
  constructor() {
    this.stageIndex = 0;
    this.stageTimer = 0;
    this.bossActive = false;
    this.bossDefeated = false;

    this.stages = [
      {
        id: 1,
        title: "OPERATION HORNET'S NEST: STRAIT OF HORMUZ",
        theme: "ocean",
        bossName: "AIRBORNE DREADNOUGHT 'BEHEMOTH'",
        bossSubType: "behemoth",
        duration: 45, // Seconds until boss appearance
        dialogues: [
          { time: 1.0, speaker: "CARRIER COMMAND", text: "CVN-73 Independence: Hostile squadrons airborne! Clear the maritime corridor!" },
          { time: 12.0, speaker: "RADAR INTEL", text: "MiG-21 interceptors approaching fast. Watch your fuel and ammunition levels!" },
          { time: 26.0, speaker: "WINGMAN", text: "Heavy Hind gunships sighted at low altitude! Engage and claim bounties!" },
          { time: 44.0, speaker: "COMMANDER", text: "WARNING: Massive dreadnought detected! Concentrate fire on the core reactor!" }
        ],
        spawnScript: [
          { time: 2.0, count: 4, type: 'mig21', y: 180, interval: 0.4, aiPattern: 'straight' },
          { time: 6.5, count: 5, type: 'mig21', y: 380, interval: 0.35, aiPattern: 'sine', dropItem: 'fuel' },
          { time: 12.0, count: 2, type: 'hind', y: 260, interval: 0.8, hp: 55, aiPattern: 'straight', dropItem: 'powder' },
          { time: 18.0, count: 4, type: 'mig21', y: 140, interval: 0.4, aiPattern: 'dive' },
          { time: 23.0, count: 3, type: 'hind', y: 460, interval: 0.7, hp: 65, aiPattern: 'straight', dropItem: 'gold' },
          { time: 29.0, count: 5, type: 'mig21', y: 320, interval: 0.35, aiPattern: 'sine', dropItem: 'fuel' },
          { time: 35.0, count: 2, type: 'stealth_bomber', y: 240, interval: 1.1, hp: 110, aiPattern: 'straight', dropItem: 'powder' }
        ]
      },
      {
        id: 2,
        title: "OPERATION DESERT VIPER: IRON CANYON",
        theme: "desert",
        bossName: "FORTRESS FLAGSHIP 'YAMATO'",
        bossSubType: "yamato_carrier",
        duration: 50,
        dialogues: [
          { time: 1.0, speaker: "AIR COMMAND", text: "Pushing into enemy canyon sector. Heavy anti-air batteries active!" },
          { time: 15.0, speaker: "RADAR INTEL", text: "High-value stealth bombers in your sector. Take them down for ordnance funds!" },
          { time: 30.0, speaker: "WINGMAN", text: "Enormous radar return sighted near the canyon basin! That fortress is massive!" },
          { time: 49.0, speaker: "COMMANDER", text: "Destroy Dreadnought Yamato and secure undisputed air superiority!" }
        ],
        spawnScript: [
          { time: 2.0, count: 5, type: 'mig21', y: 220, interval: 0.35, aiPattern: 'sine' },
          { time: 8.0, count: 3, type: 'hind', y: 340, interval: 0.6, hp: 70, aiPattern: 'straight', dropItem: 'powder' },
          { time: 15.0, count: 3, type: 'stealth_bomber', y: 200, interval: 0.9, hp: 130, aiPattern: 'straight', dropItem: 'fuel' },
          { time: 22.0, count: 5, type: 'mig21', y: 160, interval: 0.3, aiPattern: 'dive', dropItem: 'gold' },
          { time: 30.0, count: 3, type: 'hind', y: 420, interval: 0.6, hp: 80, aiPattern: 'sine', dropItem: 'fuel' },
          { time: 38.0, count: 3, type: 'stealth_bomber', y: 280, interval: 1.0, hp: 140, aiPattern: 'straight', dropItem: 'powder' }
        ]
      }
    ];

    this.pendingSpawns = [];
    this.triggeredDialogues = new Set();
  }

  startStage(idx) {
    this.stageIndex = idx % this.stages.length;
    this.stageTimer = 0;
    this.bossActive = false;
    this.bossDefeated = false;
    this.pendingSpawns = [];
    this.triggeredDialogues.clear();

    const current = this.stages[this.stageIndex];
    current.spawnScript.forEach(w => {
      for (let i = 0; i < w.count; i++) {
        this.pendingSpawns.push({
          triggerTime: w.time + i * w.interval,
          type: w.type,
          y: w.y + (Math.random() * 50 - 25),
          hp: w.hp,
          aiPattern: w.aiPattern,
          dropItem: i === 0 ? w.dropItem : null
        });
      }
    });

    this.pendingSpawns.sort((a, b) => a.triggerTime - b.triggerTime);
  }

  getCurrentStage() {
    return this.stages[this.stageIndex];
  }

  update(dt, enemies, onDialogue, onBossWarning) {
    this.stageTimer += dt;
    const stage = this.stages[this.stageIndex];

    // Check dialogues
    for (const d of stage.dialogues) {
      if (!this.triggeredDialogues.has(d.time) && this.stageTimer >= d.time) {
        this.triggeredDialogues.add(d.time);
        onDialogue(d.speaker, d.text);
      }
    }

    // Spawn script
    while (this.pendingSpawns.length > 0 && this.stageTimer >= this.pendingSpawns[0].triggerTime) {
      const sp = this.pendingSpawns.shift();
      enemies.push(new EnemyUnit(sp));
    }

    // Boss spawn trigger
    if (!this.bossActive && !this.bossDefeated && this.stageTimer >= stage.duration) {
      this.bossActive = true;
      onBossWarning(stage.bossName, stage.bossSubType);
      enemies.push(new EnemyUnit({
        x: 1350,
        y: 360,
        type: 'boss',
        subType: stage.bossSubType,
        hp: this.stageIndex === 0 ? 550 : 850,
        score: 15000
      }));
    }
  }
}

window.CampaignStageManager = CampaignStageManager;

