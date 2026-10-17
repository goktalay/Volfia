import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, recordParkur, isLevelUnlocked, isParkurUnlocked, computeHonor, levelHonorRequired, buyUpgrade, upgradeCost, mergeProfiles, addCoins } from '../js/profile.js';
import { parkurCount, totalParkurs, parkurDef } from '../js/levels.js';
import { LEVEL_COUNT, PARKUR_MIN, PARKUR_MAX } from '../js/config.js';

test('her bölümde 5-10 parkur var, sayı azalmaz', () => {
  let prev = 0;
  for (let L = 1; L <= LEVEL_COUNT; L++) { const n = parkurCount(L); assert.ok(n >= PARKUR_MIN && n <= PARKUR_MAX); assert.ok(n >= prev); prev = n; }
  assert.equal(parkurCount(1), 5); assert.equal(parkurCount(30), 10);
  assert.ok(totalParkurs() > 200);
});

test('zorluk bölüm ve parkur ile artar', () => {
  let prevSpeed = 0;
  for (let L = 1; L <= LEVEL_COUNT; L++) for (let p = 1; p <= parkurCount(L); p++) {
    const d = parkurDef(L, p);
    if (!d.isBossParkur) { assert.ok(d.bossSpeed >= prevSpeed - 1e-9, `L${L}P${p}`); prevSpeed = d.bossSpeed; }
    assert.ok(d.time >= 90 && d.time <= 150);
  }
});

test('onur puanı hesabı', () => {
  assert.equal(computeHonor({ percent: 80, special: false, deaths: 1 }), 10);
  assert.equal(computeHonor({ percent: 95, special: false, deaths: 0 }), 30);
  assert.equal(computeHonor({ percent: 100, special: true, deaths: 0 }), 45);
});

test('bölüm kilidi onur eşiğiyle açılır, parkurlar sırayla açılır', () => {
  const p = emptyProfile();
  assert.ok(isLevelUnlocked(p, 1)); assert.ok(!isLevelUnlocked(p, 2));
  assert.ok(isParkurUnlocked(p, 1, 1)); assert.ok(!isParkurUnlocked(p, 1, 2));
  // 5 parkuru tam %80 ile bitir → 50 onur < 75 → bölüm 2 kapalı
  for (let k = 1; k <= 5; k++) recordParkur(p, 1, k, { percent: 80, special: false, deaths: 1, score: 100 });
  assert.equal(levelHonorRequired(1), 75);
  assert.ok(!isLevelUnlocked(p, 2));
  // daha iyi sonuçlarla tekrar oyna → açılır
  for (let k = 1; k <= 3; k++) recordParkur(p, 1, k, { percent: 90, special: false, deaths: 0, score: 100 });
  assert.ok(isLevelUnlocked(p, 2));
  assert.ok(isParkurUnlocked(p, 2, 1));
  // daha kötü sonuç en iyiyi bozmaz
  const r = recordParkur(p, 1, 1, { percent: 80, special: false, deaths: 2, score: 1 });
  assert.equal(r.improved, false); assert.equal(p.levels[1].parkurs[1].honor, 25);
});

test('HEPCOIN ve yükseltmeler', () => {
  const p = emptyProfile();
  assert.equal(upgradeCost(p, 'engine'), 60);
  assert.equal(buyUpgrade(p, 'engine'), false);
  addCoins(p, 500);
  assert.ok(buyUpgrade(p, 'engine')); assert.equal(p.coins, 440); assert.equal(p.upgrades.engine, 1);
  assert.ok(buyUpgrade(p, 'engine')); assert.ok(buyUpgrade(p, 'engine'));
  assert.equal(upgradeCost(p, 'engine'), null); assert.equal(buyUpgrade(p, 'engine'), false);
});

test('profil birleştirme en iyi değerleri korur', () => {
  const a = emptyProfile(), b = emptyProfile();
  addCoins(a, 100); recordParkur(a, 1, 1, { percent: 90, special: false, deaths: 0, score: 5 });
  addCoins(b, 300); recordParkur(b, 1, 2, { percent: 80, special: false, deaths: 1, score: 5 });
  const m = mergeProfiles(a, b);
  assert.equal(m.coins, 300);
  assert.equal(m.levels[1].parkurs[1].honor, 25);
  assert.equal(m.levels[1].parkurs[2].honor, 10);
});
