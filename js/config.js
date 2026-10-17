// VOLFAI - oyun sabitleri
export const GRID_W = 80;      // hücre (yatay)
export const GRID_H = 120;     // hücre (dikey)

export const CELL = {
  EMPTY: 0,      // sahipsiz (düşman bölgesi)
  CLAIMED: 1,    // ele geçirilmiş
  TRAIL: 2,      // çizilmekte olan hat
  BLOCK: 3,      // güç kutusu (içinden çizilemez)
};

export const CLEAR_PERCENT = 80;         // Volfied: en az %80
export const BASE_PLAYER_SPEED = 34;     // hücre/sn
export const SPEED_BOOST_MULT = 1.7;
export const FUSE_SPEED_RATIO = 0.85;    // fitil hızı / oyuncu hızı
export const LIVES_START = 3;

export const POWERUPS = {
  S: { name: 'HIZ',        duration: 12, weight: 24, color: '#ffd23f' },
  T: { name: 'DONDUR',     duration: 6,  weight: 20, color: '#5de4ff' },
  L: { name: 'LAZER',      duration: 10, weight: 22, color: '#ff5d8f' },
  P: { name: 'KALKAN',     duration: 0,  weight: 18, color: '#9bff8a' },
  E: { name: 'EK CAN',     duration: 0,  weight: 5,  color: '#ffffff' },
  B: { name: 'BONUS',      duration: 0,  weight: 11, color: '#ffa94d' },
};

export const SCORE = {
  PER_CELL: 10,
  BIG_AREA_MULT: 2,        // tek seferde >%20 alan
  BIG_AREA_THRESHOLD: 0.20,
  SMALL_ENEMY: 500,
  BOSS_HIT: 100,
  SPECIAL_CLEAR: 50000,
  ALL_BLOCKS: 20000,
  PER_PERCENT_OVER: 1000,
  PER_SECOND_LEFT: 50,
  BONUS_BOX: 2500,
};
