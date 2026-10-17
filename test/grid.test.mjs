import test from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../js/grid.js';
import { CELL } from '../js/config.js';

test('başlangıçta çerçeve ele geçirilmiş, iç boş', () => {
  const g = new Grid(20, 20);
  assert.equal(g.get(0, 0), CELL.CLAIMED);
  assert.equal(g.get(10, 10), CELL.EMPTY);
  assert.equal(g.percent(), 0);
  assert.ok(g.isWalkableEdge(0, 5));
  assert.ok(g.isWalkableEdge(0, 0));
});

test('hat kapatınca boss\'un olmadığı taraf dolar', () => {
  const g = new Grid(20, 20);
  // soldan sağa x=5 sütununda dikey hat: (5,1)..(5,18)
  const trail = [];
  for (let y = 1; y <= 18; y++) { g.set(5, y, CELL.TRAIL); trail.push([5, y]); }
  const r = g.closeTrail(trail, [{ x: 15, y: 10 }]);
  // sol taraf (x=1..4, y=1..18) = 4*18 = 72 hücre + hat 18 = 90
  assert.equal(r.claimedCells, 90);
  assert.equal(g.get(2, 2), CELL.CLAIMED);
  assert.equal(g.get(15, 10), CELL.EMPTY);
  assert.ok(Math.abs(g.percent() - (90 / 324) * 100) < 1e-9);
});

test('kutu kuşatılınca captured olur ve yüzdeye dahil edilmez', () => {
  const g = new Grid(20, 20);
  g.addBlock(2, 2, 2); // (2,2)-(3,3)
  assert.equal(g.interiorTotal, 324 - 4);
  const trail = [];
  for (let y = 1; y <= 18; y++) { g.set(6, y, CELL.TRAIL); trail.push([6, y]); }
  const r = g.closeTrail(trail, [{ x: 15, y: 10 }]);
  assert.equal(r.newlyCaptured.length, 1);
  assert.ok(g.blocks[0].captured);
  // sol taraf 5*18=90 - 4 kutu = 86, + hat 18 = 104
  assert.equal(r.claimedCells, 104);
});

test('canExtendTrail kendi hattına yapışmayı engeller', () => {
  const g = new Grid(20, 20);
  g.set(5, 5, CELL.TRAIL); g.set(5, 6, CELL.TRAIL); g.set(5, 7, CELL.TRAIL);
  // (6,7)'ye (5,7)'den geçiş: komşusu (5,7) önceki -> OK
  assert.ok(g.canExtendTrail(6, 7, 5, 7));
  // (6,6)'ya (6,7)'den: komşusu (5,6) hat -> yasak
  assert.ok(!g.canExtendTrail(6, 6, 6, 7));
});

test('boss hat üstüne denk gelirse en yakın boş hücreden taşar', () => {
  const g = new Grid(20, 20);
  const trail = [];
  for (let y = 1; y <= 18; y++) { g.set(10, y, CELL.TRAIL); trail.push([10, y]); }
  const r = g.closeTrail(trail, [{ x: 10, y: 10 }]);
  // tohum hattın üstünde; en yakın boş (9,10) veya (11,10) -> yalnızca bir taraf dolar
  assert.ok(r.claimedCells > 18 && r.claimedCells < 324);
});
