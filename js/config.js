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

// ---- Kampanya: 30 bölüm, her bölümde 5-10 parkur ----
export const LEVEL_COUNT = 30;
export const PARKUR_MIN = 5;
export const PARKUR_MAX = 10;

// Onur puanı: parkur bitirince kazanılır; bir sonraki bölümün kilidini açmak için gerekir
export const HONOR = {
  CLEAR: 10,            // parkuru bitirmek
  PER_PERCENT_OVER: 1,  // %80 üstü her yüzde (en fazla 20)
  SPECIAL: 10,          // boss'u lazerle yok etmek
  NO_DEATH: 5,          // hiç can kaybetmeden
  PER_PARKUR_REQUIRED: 15, // sonraki bölüm için parkur başına gereken onur
};

// HEPCOIN
export const COIN = {
  SPAWN_MIN: 5,    // sn
  SPAWN_MAX: 11,
  MAX_ON_FIELD: 3,
  LIFETIME: 14,    // sn, sonra kaybolur
  VALUES: [1, 1, 1, 2, 2, 3, 5],
};

// Hangar yükseltmeleri (HEPCOIN ile)
export const UPGRADES = {
  engine:  { name: 'İYON MOTORU',       desc: 'Gemi hızı +%8 / seviye',            icon: '⚡', costs: [60, 140, 280] },
  shield:  { name: 'KALKAN JENERATÖRÜ', desc: 'Parkura kalkanla başla; 3. seviyede 2 kalkan', icon: '🛡', costs: [80, 180, 340] },
  laser:   { name: 'LAZER ÇEKİRDEĞİ',   desc: 'Lazer süresi +3 sn / seviye, hasar artar', icon: '🔺', costs: [70, 160, 300] },
  cells:   { name: 'YEDEK GÜÇ HÜCRESİ', desc: 'Başlangıç canı +1 / seviye',        icon: '♥', costs: [100, 220, 400] },
  time:    { name: 'ZAMAN DİLATÖRÜ',    desc: 'Parkur süresi +15 sn / seviye',     icon: '⏱', costs: [50, 120, 240] },
  magnet:  { name: 'COIN MIKNATISI',    desc: 'HEPCOIN daha sık ve daha değerli düşer', icon: '◎', costs: [90, 200, 360] },
};

// Mastertool hesap bütünleşmesi (sözleşme v1: prelogin + PBKDF2 auth_hash + login)
// Oyun mastertool.download altında sunuluyorsa API otomatik etkinleşir (aynı köken, çerezli oturum).
// Başka bir kökende API_BASE boşsa yalnız yerel misafir profili çalışır.
const onMastertool = typeof location !== 'undefined' && /(^|\.)mastertool\.download$/.test(location.hostname);
export const MASTERTOOL = {
  API_BASE: onMastertool ? location.origin : '',   // ör. 'https://mastertool.download'
  APP_CODE: 'vf',                                   // VOLFAI uygulama kodu → /api/vf/...
  APP_VERSION: '0.2.0',
  REGISTER_URL: 'https://mastertool.download/kayit?app=vf',
  LOGIN_URL: 'https://mastertool.download/giris?app=vf',
};
