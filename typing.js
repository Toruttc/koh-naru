'use strict';
/* =========================================================
   こーなる タイピング暗記バトル  typing.js
   ブロック構成
     1. 設定          … ここだけ書き換えれば差し替え・配布できる
     2. データ読み込み … シートCSVの取得・解析・キャッシュ
     3. 判定          … ローマ字の表記ゆれ対応・答え合わせ
     4. 記録          … マスター・攻略待ち・自己ベスト
     5. ゲーム進行    … ①なぞり打ち／②バトル
     6. 画面表示      … 各画面の描画
   ========================================================= */

/* ===== 1. 設定 ===== */
const CONFIG = {
  // スプレッドシートを「ウェブに公開」したCSVのURL（問題タブ・考査タブ）
  // 空のままだと、下のデモ問題で動く
  problemsCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTcnAWoSrjekkE406gspjTSivQhiAsfEyXS0pTBRR7K7T6Z6KrS045PQQgxjUr1NLp9Q1EJwY9ixAU_/pub?single=true&output=csv&gid=1270913479',
  examsCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTcnAWoSrjekkE406gspjTSivQhiAsfEyXS0pTBRR7K7T6Z6KrS045PQQgxjUr1NLp9Q1EJwY9ixAU_/pub?single=true&output=csv&gid=940579361',

  battleSize: 10,          // ②バトル1戦の問題数
  storageKey: 'kohnaru-typing-v1',
  cacheKey: 'kohnaru-typing-cache-v1',

  // レベルと称号（②で正解した累計数で上がる）
  levels: [
    { at: 0,    title: 'はじめの一歩' },
    { at: 10,   title: 'ルーキー' },
    { at: 30,   title: 'チャレンジャー' },
    { at: 60,   title: 'ファイター' },
    { at: 100,  title: 'エース' },
    { at: 150,  title: 'エキスパート' },
    { at: 220,  title: 'マスター' },
    { at: 300,  title: 'グランドマスター' },
    { at: 400,  title: 'チャンピオン' },
    { at: 500,  title: 'レジェンド' },
  ],
};

// デモ問題（URLが未設定のときだけ使う。シートと同じ形式）
const DEMO_PROBLEMS_CSV = `ID,教科,単元,問題,答え,よみ,別解,出典,状態
RIKA-JISHIN-001,理科,地震,最初に岩石が破壊された地下の場所は？,震源,しんげん,,理科教科書 p.74,確認済み
RIKA-JISHIN-002,理科,地震,震源の真上にある地表の位置は？,震央,しんおう,,理科教科書 p.74 図11,確認済み
RIKA-JISHIN-003,理科,地震,地震で最初にくる小さなゆれは？,初期微動,しょきびどう,,理科教科書 p.74,確認済み
RIKA-JISHIN-004,理科,地震,初期微動に続いてはじまる大きなゆれは？,主要動,しゅようどう,,理科教科書 p.74,確認済み
RIKA-JISHIN-005,理科,地震,届くと初期微動がはじまる波は？,P波,pは,ぴーは,理科教科書 p.76,確認済み
RIKA-JISHIN-006,理科,地震,届くと主要動がはじまる波は？,S波,sは,えすは,理科教科書 p.76,確認済み
RIKA-JISHIN-007,理科,地震,初期微動がはじまってから主要動がはじまるまでの時間は？,初期微動継続時間,しょきびどうけいぞくじかん,,理科教科書 p.74 図12,確認済み
RIKA-JISHIN-008,理科,地震,震源距離が長いほど、初期微動継続時間は？,長くなる,ながくなる,,理科教科書 p.76,確認済み
RIKA-JISHIN-009,理科,地震,ゆれの大きさを表すものは？,震度,しんど,,理科教科書 p.78,確認済み
RIKA-JISHIN-010,理科,地震,地震そのものの規模を表すものは？,マグニチュード,まぐにちゅーど,m,理科教科書 p.79,確認済み
RIKA-JISHIN-011,理科,地震,地震は、地下の岩石の破壊が一気に進み、何がずれる現象？,断層,だんそう,,理科教科書 p.74,確認済み
RIKA-JISHIN-012,理科,地震,震央から震源までの距離は？,震源の深さ,しんげんのふかさ,,理科教科書 p.74 図11,確認済み
RIKA-JISHIN-013,理科,地震,震源から観測点までの距離は？,震源距離,しんげんきょり,,理科教科書 p.74 図11,確認済み
RIKA-JISHIN-014,理科,地震,震央から観測点までの距離は？,震央距離,しんおうきょり,,理科教科書 p.74 図11,確認済み
RIKA-JISHIN-015,理科,地震,各地のゆれを記録する装置は？,地震計,じしんけい,,理科教科書 p.74,確認済み
RIKA-JISHIN-016,理科,地震,断層の上側部分が下がる断層は？,正断層,せいだんそう,,理科教科書 p.74 図10,確認済み
RIKA-JISHIN-017,理科,地震,断層の上側部分が上がる断層は？,逆断層,ぎゃくだんそう,,理科教科書 p.74 図10,確認済み
RIKA-JISHIN-018,理科,地震,横にずれ動く断層は？,横ずれ断層,よこずれだんそう,,理科教科書 p.74 図10,確認済み
RIKA-JISHIN-019,理科,地震,ゆれがはじまるまでの時間が同じ地点は、震央を中心に何状に広がる？,同心円,どうしんえん,,理科教科書 p.76,確認済み
RIKA-JISHIN-020,理科,地震,P波とS波のうち、伝わる速さが速いのは？,P波,pは,ぴーは,理科教科書 p.77 図16,確認済み
RIKA-JISHIN-021,理科,地震,初期微動継続時間をもとに、およそ何を知ることができる？,震源距離,しんげんきょり,,理科教科書 p.77,確認済み
RIKA-JISHIN-022,理科,地震,震源に近い地震計で検知したP波をもとに発せられる情報は？,緊急地震速報,きんきゅうじしんそくほう,,理科教科書 p.77,確認済み
RIKA-JISHIN-023,理科,地震,震度を測定する装置は？,震度計,しんどけい,,理科教科書 p.78,確認済み
RIKA-JISHIN-024,理科,地震,震度の階級は全部で何段階？,10段階,10だんかい,10/じゅうだんかい,理科教科書 p.78 図17,確認済み
RIKA-JISHIN-025,理科,地震,マグニチュードの記号は？,M,m,,理科教科書 p.79,確認済み
RIKA-JISHIN-026,理科,地震,ずれ動いた断層の範囲は？,震源域,しんげんいき,,理科教科書 p.79,確認済み
RIKA-JISHIN-027,理科,地震,マグニチュードが1ふえると、地震のエネルギーは約何倍？,約32倍,32ばい,32/やく32ばい,理科教科書 p.79,確認済み
RIKA-JISHIN-028,理科,地震,マグニチュードが2ふえると、地震のエネルギーは何倍？,1000倍,1000ばい,1000,理科教科書 p.79,確認済み
RIKA-JISHIN-029,理科,地震,ふつう、震央から近いところほど震度は？,大きくなる,おおきくなる,,理科教科書 p.79,確認済み
RIKA-JISHIN-030,理科,地震,震源域が広いほど、マグニチュードは？,大きくなる,おおきくなる,,理科教科書 p.79,確認済み`;
const DEMO_EXAMS_CSV = `考査名,教科,単元
試作,理科,地震`;


/* ===== 2. データ読み込み ===== */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim() !== ''));
}

function csvToObjects(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const head = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const o = {};
    head.forEach((h, i) => { o[h] = (r[i] || '').trim(); });
    return o;
  });
}

function toProblems(text) {
  return csvToObjects(text)
    .filter(o => o['状態'] === '確認済み' && o['ID'] && o['よみ'])
    .map(o => ({
      id: o['ID'],
      subject: o['教科'] || 'その他',
      unit: o['単元'] || '未分類',
      q: o['問題'],
      a: o['答え'] || o['よみ'],
      yomi: o['よみ'],
      alts: (o['別解'] || '').split('/').map(s => s.trim()).filter(Boolean),
      src: o['出典'] || '',
    }));
}

function toExams(text) {
  return csvToObjects(text)
    .filter(o => o['考査名'] && o['単元'])
    .map(o => ({ name: o['考査名'], subject: o['教科'] || 'その他', unit: o['単元'] }));
}

async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

async function loadData() {
  if (!CONFIG.problemsCsvUrl) {
    return { problems: toProblems(DEMO_PROBLEMS_CSV), exams: toExams(DEMO_EXAMS_CSV), source: 'demo' };
  }
  try {
    const [p, e] = await Promise.all([
      fetchText(CONFIG.problemsCsvUrl),
      CONFIG.examsCsvUrl ? fetchText(CONFIG.examsCsvUrl) : Promise.resolve(''),
    ]);
    const data = { problems: toProblems(p), exams: toExams(e), source: 'sheet' };
    if (!data.problems.length) throw new Error('問題が0件');
    try { localStorage.setItem(CONFIG.cacheKey, JSON.stringify({ p, e, at: Date.now() })); } catch (_) {}
    return data;
  } catch (err) {
    try {
      const c = JSON.parse(localStorage.getItem(CONFIG.cacheKey));
      if (c && c.p) return { problems: toProblems(c.p), exams: toExams(c.e || ''), source: 'cache', cachedAt: c.at };
    } catch (_) {}
    return { problems: [], exams: [], source: 'error', error: String(err.message || err) };
  }
}


/* ===== 3. 判定 ===== */
// 1文字のかな → ローマ字（先頭が画面のお手本に使われる）
const KANA1 = {
  'あ':['a'],'い':['i','yi'],'う':['u','wu','whu'],'え':['e'],'お':['o'],
  'か':['ka','ca'],'き':['ki'],'く':['ku','cu','qu'],'け':['ke'],'こ':['ko','co'],
  'さ':['sa'],'し':['shi','si','ci'],'す':['su'],'せ':['se','ce'],'そ':['so'],
  'た':['ta'],'ち':['chi','ti'],'つ':['tsu','tu'],'て':['te'],'と':['to'],
  'な':['na'],'に':['ni'],'ぬ':['nu'],'ね':['ne'],'の':['no'],
  'は':['ha'],'ひ':['hi'],'ふ':['fu','hu'],'へ':['he'],'ほ':['ho'],
  'ま':['ma'],'み':['mi'],'む':['mu'],'め':['me'],'も':['mo'],
  'や':['ya'],'ゆ':['yu'],'よ':['yo'],
  'ら':['ra'],'り':['ri'],'る':['ru'],'れ':['re'],'ろ':['ro'],
  'わ':['wa'],'を':['wo'],
  'が':['ga'],'ぎ':['gi'],'ぐ':['gu'],'げ':['ge'],'ご':['go'],
  'ざ':['za'],'じ':['ji','zi'],'ず':['zu'],'ぜ':['ze'],'ぞ':['zo'],
  'だ':['da'],'ぢ':['di'],'づ':['du'],'で':['de'],'ど':['do'],
  'ば':['ba'],'び':['bi'],'ぶ':['bu'],'べ':['be'],'ぼ':['bo'],
  'ぱ':['pa'],'ぴ':['pi'],'ぷ':['pu'],'ぺ':['pe'],'ぽ':['po'],
  'ぁ':['xa','la'],'ぃ':['xi','li'],'ぅ':['xu','lu'],'ぇ':['xe','le'],'ぉ':['xo','lo'],
  'ゃ':['xya','lya'],'ゅ':['xyu','lyu'],'ょ':['xyo','lyo'],'ゎ':['xwa','lwa'],
  'っ':['xtu','ltu','xtsu','ltsu'],
  'ゔ':['vu'],'ー':['-'],'、':[','],'。':['.'],
};
// 2文字のかな（拗音など）
const KANA2 = {
  'きゃ':['kya'],'きゅ':['kyu'],'きょ':['kyo'],'きぇ':['kye'],
  'しゃ':['sha','sya'],'しゅ':['shu','syu'],'しょ':['sho','syo'],'しぇ':['she','sye'],
  'ちゃ':['cha','tya','cya'],'ちゅ':['chu','tyu','cyu'],'ちょ':['cho','tyo','cyo'],'ちぇ':['che','tye','cye'],
  'にゃ':['nya'],'にゅ':['nyu'],'にょ':['nyo'],
  'ひゃ':['hya'],'ひゅ':['hyu'],'ひょ':['hyo'],
  'みゃ':['mya'],'みゅ':['myu'],'みょ':['myo'],
  'りゃ':['rya'],'りゅ':['ryu'],'りょ':['ryo'],
  'ぎゃ':['gya'],'ぎゅ':['gyu'],'ぎょ':['gyo'],
  'じゃ':['ja','zya','jya'],'じゅ':['ju','zyu','jyu'],'じょ':['jo','zyo','jyo'],'じぇ':['je','zye','jye'],
  'ぢゃ':['dya'],'ぢゅ':['dyu'],'ぢょ':['dyo'],
  'びゃ':['bya'],'びゅ':['byu'],'びょ':['byo'],
  'ぴゃ':['pya'],'ぴゅ':['pyu'],'ぴょ':['pyo'],
  'ふぁ':['fa'],'ふぃ':['fi'],'ふぇ':['fe'],'ふぉ':['fo'],
  'てぃ':['thi'],'でぃ':['dhi'],'でゅ':['dhu'],'うぃ':['wi'],'うぇ':['we'],
};

function toHiragana(s) {
  return s.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}
// シートの「よみ」と、打った内容をそろえる
function normalizeText(s) {
  return toHiragana(String(s).normalize('NFKC'))
    .toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.。]+$/, '');
}

// 1キーずつ判定するしくみ（①なぞり打ち・②の答え合わせの両方で使う）
class Matcher {
  constructor(target) {
    this.t = [...target];
    this.pos = 0;      // 何文字目まで打てたか
    this.buf = '';     // 今の文字で打ちかけのローマ字
    this.typed = '';   // これまでに受け付けたキー
    this.memo = {};
  }
  get done() { return this.pos >= this.t.length; }

  base(pos) {          // っ の重ね打ちを含まない候補
    const t = this.t, c = t[pos], out = [];
    if (c === 'ん') {
      const next = pos + 1 < t.length ? this.cands(pos + 1) : [];
      const single = next.length > 0 && next.every(x => !/^[aiueoyn']/.test(x.r));
      if (single) out.push({ len: 1, r: 'n' });
      out.push({ len: 1, r: 'nn' }, { len: 1, r: "n'" }, { len: 1, r: 'xn' });
      return out;
    }
    const two = c + (t[pos + 1] || '');
    if (KANA2[two]) KANA2[two].forEach(r => out.push({ len: 2, r }));
    if (KANA1[c]) KANA1[c].forEach(r => out.push({ len: 1, r }));
    else out.push({ len: 1, r: c });              // 英字・数字・記号はそのまま
    return out;
  }
  cands(pos) {
    if (pos >= this.t.length) return [];
    if (this.memo[pos]) return this.memo[pos];
    let out = [];
    if (this.t[pos] === 'っ' && pos + 1 < this.t.length && this.t[pos + 1] !== 'っ') {
      this.base(pos + 1).forEach(nx => {
        if (/^[bcdfghjklmpqrstvwxyz]/.test(nx.r)) out.push({ len: 1 + nx.len, r: nx.r[0] + nx.r });
      });
    }
    out = out.concat(this.base(pos));
    this.memo[pos] = out;
    return out;
  }
  commit(c) { this.pos += c.len; this.buf = ''; }

  // 受け付けたら true
  feed(key) {
    if (this.done) return false;
    const cs = this.cands(this.pos);
    const next = this.buf + key;
    const hit = cs.filter(c => c.r.startsWith(next));
    if (hit.length) {
      this.buf = next;
      this.typed += key;
      const exact = hit.find(c => c.r === next);
      const longer = hit.some(c => c.r.length > next.length);
      if (exact && !longer) this.commit(exact);
      return true;
    }
    const exactBuf = this.buf && cs.find(c => c.r === this.buf);
    if (exactBuf) {      // 例：ん を n だけで打って次の文字へ
      this.commit(exactBuf);
      return this.feed(key);
    }
    return false;
  }
  // Enter で答え合わせするときの最後の確定（最後の ん は n だけでもOK）
  finish() {
    if (this.buf) {
      const cs = this.cands(this.pos);
      const ex = cs.find(c => c.r === this.buf);
      if (ex) this.commit(ex);
      else if (this.buf === 'n' && this.t[this.pos] === 'ん' && this.pos === this.t.length - 1) this.commit({ len: 1 });
    }
    return this.done;
  }
  // 画面のお手本（打った部分／残り）
  guide() {
    let rest = '', p = this.pos;
    if (p < this.t.length) {
      const cs = this.cands(p);
      const c = cs.find(x => x.r.startsWith(this.buf)) || cs[0];
      rest += c.r.slice(this.buf.length); p += c.len;
    }
    while (p < this.t.length) { const c = this.cands(p)[0]; rest += c.r; p += c.len; }
    return { typed: this.typed, rest };
  }
}

// ②の答え合わせ：よみ・別解のどれかに合えば正解
function judgeAnswer(raw, problem) {
  const input = normalizeText(raw);
  if (!input) return false;
  return [problem.yomi, ...problem.alts].some(y => {
    const m = new Matcher(normalizeText(y));
    for (const ch of input) if (!m.feed(ch)) return false;
    return m.finish();
  });
}

// ②で打った内容をひらがなで見せる（表示用。判定には使わない）
const ROMA2KANA = (() => {
  const m = { nn: 'ん', "n'": 'ん', xn: 'ん' };
  for (const [k, rs] of Object.entries(KANA2)) rs.forEach(r => { if (!(r in m)) m[r] = k; });
  for (const [k, rs] of Object.entries(KANA1)) rs.forEach(r => { if (!(r in m)) m[r] = k; });
  return m;
})();
function toKanaDisplay(raw) {
  let out = '', i = 0;
  const s = raw.toLowerCase();
  while (i < s.length) {
    const c = s[i], n1 = s[i + 1];
    if (c === 'n') {
      if (n1 === undefined) { out += 'n'; i++; continue; }
      if (n1 === 'n' || n1 === "'") { out += 'ん'; i += 2; continue; }
      if (!/[aiueoy]/.test(n1)) { out += 'ん'; i++; continue; }
    }
    if (/[bcdfghjklmpqrstvwxyz]/.test(c) && n1 === c) { out += 'っ'; i++; continue; }
    let hit = false;
    for (let len = 4; len >= 1; len--) {
      const part = s.slice(i, i + len);
      if (part.length === len && ROMA2KANA[part]) { out += ROMA2KANA[part]; i += len; hit = true; break; }
    }
    if (!hit) { out += raw[i]; i++; }
  }
  return out;
}
const hasKana = s => /[\u3040-\u309F\u30A0-\u30FF]/.test(s);


/* ===== 4. 記録 ===== */
function defaultStore() {
  return { v: 1, log: [], mastered: {}, retry: {}, wrongOnce: {}, best: {},
           totalCorrect: 0, maxCombo: 0, lastUnit: null, sound: true };
}
let store = loadStore();
function loadStore() {
  try { return Object.assign(defaultStore(), JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {}); }
  catch (_) { return defaultStore(); }
}
function saveStore() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(store)); } catch (_) {}
}
const todayStr = () => new Date().toISOString().slice(0, 10);
const unitKeyOf = p => p.subject + '/' + p.unit;

function recordAnswer(p, mode, ok, ms) {
  store.log.push({ id: p.id, t: Date.now(), mode, ok, ms: ms == null ? null : Math.round(ms) });
  if (store.log.length > 5000) store.log = store.log.slice(-5000);
  let newly = false;
  if (mode === 'battle') {
    if (ok) {
      store.totalCorrect++;
      if (!store.mastered[p.id]) { store.mastered[p.id] = todayStr(); newly = true; }
      delete store.retry[p.id];
    } else {
      store.retry[p.id] = true;
      store.wrongOnce[p.id] = true;
    }
  }
  saveStore();
  return { newly };
}

function unitStats(ps) {
  const total = ps.length;
  const mastered = ps.filter(p => store.mastered[p.id]).length;
  const rate = total ? mastered / total : 0;
  const stage = rate >= 1 ? 4 : rate >= 0.75 ? 3 : rate >= 0.5 ? 2 : rate >= 0.25 ? 1 : 0;
  const gold = rate >= 1 && ps.every(p => !store.wrongOnce[p.id]);
  const retry = ps.filter(p => store.retry[p.id]).length;
  return { total, mastered, rate, stage, gold, retry };
}

function levelInfo(n = store.totalCorrect) {
  let i = 0;
  CONFIG.levels.forEach((l, k) => { if (n >= l.at) i = k; });
  const next = CONFIG.levels[i + 1];
  const cur = CONFIG.levels[i];
  return { lv: i + 1, title: cur.title, next: next ? next.at - n : 0,
           ratio: next ? (n - cur.at) / (next.at - cur.at) : 1 };
}


/* ===== 5. ゲーム進行 ===== */
let DATA = { problems: [], exams: [], source: 'demo' };
let game = null;            // プレイ中の状態
let timerId = null;
let screen = 'home';
let examFilter = '';

const unitsInOrder = () => {
  const seen = new Map();
  DATA.problems.forEach(p => {
    const k = unitKeyOf(p);
    if (!seen.has(k)) seen.set(k, { key: k, subject: p.subject, unit: p.unit, ps: [] });
    seen.get(k).ps.push(p);
  });
  return [...seen.values()];
};
const findUnit = key => unitsInOrder().find(u => u.key === key);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function startTrace(key) {
  const u = findUnit(key); if (!u) return;
  store.lastUnit = key; saveStore();
  const list = shuffle(u.ps);
  game = { mode: 'trace', unit: u, list, idx: 0, start: null, matcher: new Matcher(normalizeText(list[0].yomi)), shake: 0 };
  blurActive(); show('trace');
}

function startBattle(key) {
  const u = findUnit(key); if (!u) return;
  store.lastUnit = key; saveStore();
  // 出題順：攻略待ち → 未マスター → マスター済み（それぞれの中はランダム）
  const retry = shuffle(u.ps.filter(p => store.retry[p.id]));
  const fresh = shuffle(u.ps.filter(p => !store.retry[p.id] && !store.mastered[p.id]));
  const done = shuffle(u.ps.filter(p => !store.retry[p.id] && store.mastered[p.id]));
  const queue = [...retry, ...fresh, ...done].slice(0, CONFIG.battleSize);
  const before = unitStats(u.ps);
  game = { mode: 'battle', unit: u, queue, idx: 0, hp: queue.length, hpMax: queue.length,
           raw: '', qStart: null, phase: 'answer', matcher: null, lock: false,
           combo: 0, maxCombo: 0, correct: 0, newly: 0, feedback: null, before };
  blurActive(); show('battle');
}

function blurActive() { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }

function onKey(e) {
  if (!game || (screen !== 'trace' && screen !== 'battle')) return;
  if (e.isComposing || e.key === 'Process' || e.keyCode === 229) { imeWarn(true); e.preventDefault(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === ' ' || k === 'Enter' || k === 'Backspace' || k === "'" || k === '/') e.preventDefault();
  if (k.length === 1 || k === 'Enter' || k === 'Backspace') imeWarn(false);
  if (game.mode === 'trace') traceKey(k);
  else battleKey(k);
}

function traceKey(k) {
  if (k.length !== 1) return;
  const g = game;
  if (!g.start) { g.start = performance.now(); startTimer(); }
  const ok = g.matcher.feed(k.toLowerCase());
  if (!ok) { g.shake++; sfx('key-ng'); renderTraceBody(); return; }
  if (g.matcher.done) {
    recordAnswer(g.list[g.idx], 'trace', true, null);
    g.idx++;
    if (g.idx >= g.list.length) return finishTrace();
    g.matcher = new Matcher(normalizeText(g.list[g.idx].yomi));
    sfx('step');
  }
  renderTraceBody();
}

function finishTrace() {
  stopTimer();
  const g = game;
  const ms = performance.now() - g.start;
  const prev = store.best[g.unit.key];
  const isBest = prev == null || ms < prev;
  if (isBest) { store.best[g.unit.key] = Math.round(ms); saveStore(); }
  sfx('clear');
  game = { mode: 'trace-result', unit: g.unit, ms, prev, isBest, count: g.list.length };
  show('result');
}

function battleKey(k) {
  const g = game;
  if (g.lock) return;
  const p = g.queue[g.idx];
  if (g.phase === 'answer') {
    if (k === 'Backspace') { g.raw = g.raw.slice(0, -1); return renderBattleBody(); }
    if (k === 'Enter') {
      if (!g.raw.trim()) return;
      const ms = g.qStart ? performance.now() - g.qStart : null;
      const ok = judgeAnswer(g.raw, p);
      const r = recordAnswer(p, 'battle', ok, ms);
      if (ok) {
        g.correct++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
        if (g.maxCombo > store.maxCombo) { store.maxCombo = g.maxCombo; saveStore(); }
        if (r.newly) g.newly++;
        g.hp--; g.lock = true;
        g.feedback = { ok: true, answer: p.a, newly: r.newly };
        sfx('hit');
        renderBattleBody();
        setTimeout(nextBattleQuestion, 900);
      } else {
        g.combo = 0;
        g.phase = 'retype';
        g.matcher = new Matcher(normalizeText(p.yomi));
        g.feedback = { ok: false, answer: p.a, yomi: p.yomi };
        sfx('ng');
        renderBattleBody();
      }
      return;
    }
    if (k.length === 1) {
      if (!g.qStart) g.qStart = performance.now();
      g.raw += k;
      renderBattleBody();
    }
    return;
  }
  // 打ち直し（①と同じ1キー判定）
  if (k.length !== 1) return;
  const ok = g.matcher.feed(k.toLowerCase());
  if (!ok) { sfx('key-ng'); g.shake = (g.shake || 0) + 1; return renderBattleBody(); }
  if (g.matcher.done) {
    g.hp--; g.lock = true; sfx('step');
    renderBattleBody();
    setTimeout(nextBattleQuestion, 400);
    return;
  }
  renderBattleBody();
}

function nextBattleQuestion() {
  const g = game;
  if (!g || g.mode !== 'battle') return;
  g.idx++;
  if (g.idx >= g.queue.length) return finishBattle();
  Object.assign(g, { raw: '', qStart: null, phase: 'answer', matcher: null, lock: false, feedback: null });
  renderBattleBody();
}

function finishBattle() {
  const g = game;
  sfx('clear');
  const after = unitStats(g.unit.ps);
  game = { mode: 'battle-result', unit: g.unit, correct: g.correct, total: g.queue.length,
           newly: g.newly, maxCombo: g.maxCombo, before: g.before, after };
  show('result');
}

function quitPlay() { stopTimer(); game = null; show('units'); }

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    const el = document.getElementById('timer');
    if (el && game && game.start) el.textContent = fmtTime(performance.now() - game.start);
  }, 100);
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

// 効果音
let actx = null;
function tone(freq, start, dur, type = 'sine', vol = 0.07) {
  const t0 = actx.currentTime + start;
  const o = actx.createOscillator(), gn = actx.createGain();
  o.type = type; o.frequency.value = freq;
  gn.gain.setValueAtTime(vol, t0);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn).connect(actx.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function sfx(name) {
  if (!store.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (name === 'hit') { tone(660, 0, 0.12, 'triangle'); tone(990, 0.08, 0.18, 'triangle'); }
    else if (name === 'ng') tone(220, 0, 0.25, 'sine', 0.06);
    else if (name === 'key-ng') tone(160, 0, 0.06, 'square', 0.025);
    else if (name === 'step') tone(880, 0, 0.07, 'triangle', 0.05);
    else if (name === 'clear') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle'));
  } catch (_) {}
}


/* ===== 6. 画面表示 ===== */
const $app = () => document.getElementById('app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function fmtTime(ms) {
  if (ms == null) return '—';
  const s = ms / 1000, m = Math.floor(s / 60);
  return m ? `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}` : `${s.toFixed(1)}秒`;
}
function imeWarn(on) { const el = document.getElementById('imeWarn'); if (el) el.hidden = !on; }

function show(name) {
  screen = name;
  if (name !== 'trace' && name !== 'battle') { stopTimer(); imeWarn(false); }
  const r = { home: renderHome, units: renderUnits, trace: renderTrace, battle: renderBattle,
              result: renderResult, parent: renderParent, rules: renderRules }[name];
  r();
  window.scrollTo(0, 0);
}

// たまご（マスター率でヒビが入り、100%で割れる）
function eggSVG(stage, gold, size = 64) {
  const shell = gold ? 'var(--gold)' : 'var(--egg)';
  const edge = gold ? 'var(--gold-dark)' : 'var(--teal-dark)';
  const cracks = [
    '',
    '<polyline points="30,46 38,54 34,62 42,70" />',
    '<polyline points="30,46 38,54 34,62 42,70" /><polyline points="70,58 62,66 68,74 60,84" />',
    '<polyline points="30,46 38,54 34,62 42,70" /><polyline points="70,58 62,66 68,74 60,84" /><polyline points="44,26 50,34 46,40 54,46" />',
  ];
  if (stage < 4) {
    return `<svg class="egg" width="${size}" height="${size * 1.2}" viewBox="0 0 100 120" aria-hidden="true">
      <path d="M50 6 C78 6 92 48 92 74 C92 100 72 114 50 114 C28 114 8 100 8 74 C8 48 22 6 50 6 Z" fill="${shell}" stroke="${edge}" stroke-width="4"/>
      <g fill="none" stroke="${edge}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${cracks[stage]}</g></svg>`;
  }
  const medal = gold ? 'var(--gold)' : 'var(--orange)';
  return `<svg class="egg" width="${size}" height="${size * 1.2}" viewBox="0 0 100 120" aria-hidden="true">
    <circle cx="50" cy="40" r="22" fill="${medal}" stroke="${edge}" stroke-width="3"/>
    <path d="M50 27 L54 36 L64 37 L56 43 L59 53 L50 48 L41 53 L44 43 L36 37 L46 36 Z" fill="#fff"/>
    <path d="M8 74 L20 64 L30 74 L42 62 L52 74 L64 62 L74 74 L84 64 L92 74 C92 100 72 114 50 114 C28 114 8 100 8 74 Z" fill="${shell}" stroke="${edge}" stroke-width="4" stroke-linejoin="round"/></svg>`;
}

function sourceNote() {
  if (DATA.source === 'demo') return '<p class="note">デモ問題で動いています（設定にシートのURLが入っていません）。</p>';
  if (DATA.source === 'cache') return '<p class="note">シートが読めなかったため、前回読み込んだ問題で動いています。</p>';
  if (DATA.source === 'error') return `<p class="note warn">問題を読み込めませんでした（${esc(DATA.error)}）。シートの公開設定とURLを確認してください。</p>`;
  return '';
}

function renderHome() {
  const L = levelInfo();
  const units = unitsInOrder();
  const allPs = DATA.problems;
  const m = allPs.filter(p => store.mastered[p.id]).length;
  const last = store.lastUnit && findUnit(store.lastUnit);
  $app().innerHTML = `
  <section class="home">
    <div class="level-card">
      <div class="lv">Lv.<span>${L.lv}</span></div>
      <div class="lv-title">${esc(L.title)}</div>
      <div class="lv-bar"><i style="width:${Math.round(L.ratio * 100)}%"></i></div>
      <div class="lv-next">${L.next ? `次のレベルまで あと${L.next}問` : '最高レベル！'}</div>
    </div>
    <dl class="stats">
      <div><dt>②で正解した数</dt><dd>${store.totalCorrect}</dd></div>
      <div><dt>マスター</dt><dd>${m}<small> / ${allPs.length}</small></dd></div>
      <div><dt>最高コンボ</dt><dd>${store.maxCombo}</dd></div>
    </dl>
    <div class="home-actions">
      ${last ? `<button class="btn big primary" data-act="battle" data-unit="${esc(last.key)}">つづきから：${esc(last.unit)}のバトル</button>` : ''}
      <button class="btn big ${last ? '' : 'primary'}" data-go="units">単元をえらぶ（${units.length}）</button>
    </div>
    <nav class="sub-links">
      <button class="link" data-go="rules">ルール</button>
      <button class="link" data-go="parent">保護者向け</button>
    </nav>
    ${sourceNote()}
  </section>`;
}

function renderUnits() {
  let units = unitsInOrder();
  const examNames = [...new Set(DATA.exams.map(e => e.name))];
  if (examFilter) {
    const keys = new Set(DATA.exams.filter(e => e.name === examFilter).map(e => e.subject + '/' + e.unit));
    units = units.filter(u => keys.has(u.key));
  }
  const subjects = [...new Set(units.map(u => u.subject))];
  $app().innerHTML = `
  <section class="units">
    <div class="units-head">
      <button class="link" data-go="home">← ホーム</button>
      ${examNames.length ? `<label class="exam-pick">考査の範囲
        <select id="examSel"><option value="">すべての単元</option>
        ${examNames.map(n => `<option ${n === examFilter ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>` : ''}
    </div>
    ${units.length ? '' : '<p class="note">この範囲の問題はまだありません。</p>'}
    ${subjects.map(s => `
      <h2 class="subject">${esc(s)}</h2>
      <div class="unit-list">
      ${units.filter(u => u.subject === s).map(u => {
        const st = unitStats(u.ps);
        return `<article class="unit">
          <div class="unit-egg">${eggSVG(st.stage, st.gold)}</div>
          <div class="unit-main">
            <h3>${esc(u.unit)}${st.stage === 4 ? `<span class="badge ${st.gold ? 'gold' : ''}">${st.gold ? 'ゴールド' : 'コンプリート'}</span>` : ''}</h3>
            <p class="unit-meta">マスター <b>${st.mastered}</b> / ${st.total}
              ${st.retry ? `<span class="retry">攻略待ち ${st.retry}</span>` : ''}
              <span class="best">①ベスト ${fmtTime(store.best[u.key])}</span></p>
            <div class="unit-btns">
              <button class="btn" data-act="trace" data-unit="${esc(u.key)}">①なぞり打ち</button>
              <button class="btn primary" data-act="battle" data-unit="${esc(u.key)}">②バトル</button>
            </div>
          </div>
        </article>`;
      }).join('')}
      </div>`).join('')}
    <p class="rules-link"><button class="link" data-go="rules">ルールを見る</button></p>
  </section>`;
  const sel = document.getElementById('examSel');
  if (sel) sel.onchange = () => { examFilter = sel.value; renderUnits(); };
}

function renderTrace() {
  $app().innerHTML = `
  <section class="play">
    <div class="play-head">
      <button class="link" data-act="quit">やめる</button>
      <div class="play-title">${esc(game.unit.unit)}　①なぞり打ち</div>
      <div class="timer" id="timer">${fmtTime(0)}</div>
    </div>
    <div id="playBody"></div>
  </section>`;
  renderTraceBody();
}
function renderTraceBody() {
  const g = game, el = document.getElementById('playBody');
  if (!el || !g || g.mode !== 'trace') return;
  const p = g.list[g.idx], gd = g.matcher.guide();
  el.innerHTML = `
    <div class="progress">${g.idx + 1} / ${g.list.length}</div>
    <div class="q-card">
      <p class="q-text">${esc(p.q)}</p>
      <p class="q-answer">${esc(p.a)}</p>
      <p class="q-yomi">${esc(p.yomi)}</p>
      <p class="guide ${g.shake % 2 ? 'shake-a' : g.shake ? 'shake-b' : ''}"><span class="typed">${esc(gd.typed)}</span><span class="rest">${esc(gd.rest)}</span></p>
    </div>
    <p class="hint">${g.start ? '' : '打ち始めるとタイマーが動きます'}</p>`;
}

function renderBattle() {
  $app().innerHTML = `
  <section class="play">
    <div class="play-head">
      <button class="link" data-act="quit">やめる</button>
      <div class="play-title">${esc(game.unit.unit)}　②バトル</div>
      <div class="combo" id="combo"></div>
    </div>
    <div id="playBody"></div>
  </section>`;
  renderBattleBody();
}
function renderBattleBody() {
  const g = game, el = document.getElementById('playBody');
  if (!el || !g || g.mode !== 'battle') return;
  const p = g.queue[g.idx];
  const cells = Array.from({ length: g.hpMax }, (_, i) => `<i class="${i < g.hp ? 'on' : ''}"></i>`).join('');
  const comboEl = document.getElementById('combo');
  if (comboEl) comboEl.textContent = g.combo >= 2 ? `${g.combo}コンボ！` : '';
  let input = '';
  if (g.phase === 'answer' && !g.feedback) {
    const disp = hasKana(p.yomi) ? toKanaDisplay(g.raw) : g.raw;
    input = `<div class="answer-box"><span class="kana">${esc(disp) || '&nbsp;'}</span><span class="caret"></span></div>
      <p class="raw">${esc(g.raw)}</p>
      <p class="hint">打ち終わったら Enter　／　消すときは Backspace</p>`;
  }
  let fb = '';
  if (g.feedback && g.feedback.ok) {
    fb = `<div class="fb ok"><span class="fb-big">せいかい！</span><span class="fb-ans">${esc(g.feedback.answer)}</span>
      ${g.feedback.newly ? '<span class="fb-new">マスター！</span>' : ''}</div>`;
  } else if (g.feedback) {
    const gd = g.matcher.guide();
    fb = `<div class="fb ng"><p class="fb-label">答え</p><p class="fb-ans">${esc(g.feedback.answer)}</p>
      <p class="q-yomi">${esc(g.feedback.yomi)}</p>
      <p class="guide ${g.shake % 2 ? 'shake-a' : g.shake ? 'shake-b' : ''}"><span class="typed">${esc(gd.typed)}</span><span class="rest">${esc(gd.rest)}</span></p>
      <p class="hint">この答えを打つと、攻撃して次の問題へ。攻略待ちリストに入ります</p></div>`;
  }
  el.innerHTML = `
    <div class="boss">
      <div class="boss-name">ボス：${esc(g.unit.unit)}</div>
      <div class="hp" aria-label="のこりHP ${g.hp}">${cells}</div>
      <div class="boss-hp">HP ${g.hp} / ${g.hpMax}</div>
    </div>
    <div class="progress">${Math.min(g.idx + 1, g.queue.length)} / ${g.queue.length}</div>
    <div class="q-card">
      <p class="q-text">${esc(p.q)}</p>
      ${input}${fb}
    </div>`;
}

function renderResult() {
  const g = game;
  if (g.mode === 'trace-result') {
    $app().innerHTML = `
    <section class="result">
      <p class="result-kicker">${esc(g.unit.unit)}　①なぞり打ち</p>
      <p class="result-big">${fmtTime(g.ms)}</p>
      ${g.isBest ? `<p class="result-best">自己ベスト${g.prev != null ? '更新' : '記録'}！</p>` : `<p class="result-sub">ベスト ${fmtTime(g.prev)}</p>`}
      <p class="result-sub">${g.count}問を打ちきりました</p>
      <div class="result-btns">
        <button class="btn" data-act="trace" data-unit="${esc(g.unit.key)}">もう一度</button>
        <button class="btn primary" data-act="battle" data-unit="${esc(g.unit.key)}">②バトルへ</button>
        <button class="btn" data-go="units">単元へ戻る</button>
      </div>
    </section>`;
    return;
  }
  const a = g.after, L = levelInfo();
  const eggChanged = a.stage !== g.before.stage || a.gold !== g.before.gold;
  $app().innerHTML = `
  <section class="result">
    <p class="result-kicker">${esc(g.unit.unit)}　②バトル</p>
    <p class="result-big">撃破！</p>
    <dl class="stats">
      <div><dt>正解</dt><dd>${g.correct}<small> / ${g.total}</small></dd></div>
      <div><dt>新しくマスター</dt><dd>${g.newly}</dd></div>
      <div><dt>最大コンボ</dt><dd>${g.maxCombo}</dd></div>
    </dl>
    <div class="result-egg ${eggChanged ? 'pop' : ''}">${eggSVG(a.stage, a.gold, 96)}
      <p>${esc(g.unit.unit)}：マスター ${a.mastered} / ${a.total}${a.stage === 4 ? (a.gold ? '　ゴールドたまご！' : '　コンプリート！') : ''}</p></div>
    <p class="result-sub">Lv.${L.lv} ${esc(L.title)}${L.next ? `　次のレベルまで あと${L.next}問` : ''}</p>
    <div class="result-btns">
      <button class="btn primary" data-act="battle" data-unit="${esc(g.unit.key)}">もう1戦</button>
      <button class="btn" data-go="units">単元へ戻る</button>
    </div>
  </section>`;
}

function renderParent() {
  const units = unitsInOrder();
  const retry = DATA.problems.filter(p => store.retry[p.id]);
  $app().innerHTML = `
  <section class="parent">
    <button class="link" data-go="home">← ホーム</button>
    <h2>保護者向け</h2>
    <h3>単元ごとのマスター率</h3>
    <table class="tbl"><thead><tr><th>教科</th><th>単元</th><th>マスター</th><th class="bar-col">率</th></tr></thead><tbody>
    ${units.map(u => { const s = unitStats(u.ps); return `<tr><td>${esc(u.subject)}</td><td>${esc(u.unit)}</td>
      <td>${s.mastered} / ${s.total}</td><td class="bar-col"><span class="mini-bar"><i style="width:${Math.round(s.rate * 100)}%"></i></span> ${Math.round(s.rate * 100)}%</td></tr>`; }).join('')}
    </tbody></table>
    <h3>攻略待ちリスト（${retry.length}問）</h3>
    ${retry.length ? `<table class="tbl"><thead><tr><th>単元</th><th>問題</th><th>答え</th></tr></thead><tbody>
      ${retry.map(p => `<tr><td>${esc(p.unit)}</td><td>${esc(p.q)}</td><td>${esc(p.a)}</td></tr>`).join('')}
    </tbody></table>` : '<p class="note">いまは攻略待ちの問題はありません。</p>'}
  </section>`;
}

function renderRules() {
  $app().innerHTML = `
  <section class="rules">
    <button class="link" data-go="home">← ホーム</button>
    <h2>ルール</h2>
    <h3>①なぞり打ち</h3>
    <ul><li>答えが見えています。単元の問題を全部打ちきるまでのタイムをはかります。</li>
      <li>タイマーは最初のキーを押したときに動き出します。</li>
      <li>ローマ字の打ち方は自由です（shi / si、tsu / tu、n / nn など、どれでもOK）。</li></ul>
    <h3>②バトル</h3>
    <ul><li>答えは見えません。思い出して打ち、Enter で答え合わせ。</li>
      <li>1回のバトルは${CONFIG.battleSize}問。1問ごとにボスのHPが1減り、全部答えると撃破です。</li>
      <li>出る順番は、攻略待ち → まだマスターしていない問題 → マスター済み の順です。</li>
      <li>漢字に変換しなくてOK。ひらがなで打てば正解になります。英語は大文字・小文字を区別しません。</li></ul>
    <h3>マスターと攻略待ち</h3>
    <ul><li>②で1回正解すると、その問題は<b>マスター</b>。マスターは取り消されません。</li>
      <li>②で答えられなかった問題は、答えを打ち直して<b>攻略待ちリスト</b>に入ります。②で正解するとリストから外れます。</li></ul>
    <h3>たまご</h3>
    <ul><li>単元ごとにたまごがあり、マスターが25%・50%・75%になるとヒビが入ります。100%で割れてメダルが出ます（コンプリート）。</li>
      <li>単元の全問を、②で一度も答えられなかったことがないままマスターすると<b>ゴールドたまご</b>になります。</li></ul>
    <h3>レベル</h3>
    <ul><li>②で正解した数でレベルが上がります（①は数えません）。</li></ul>
    <h3>入力について</h3>
    <ul><li>日本語入力はオフ（英数）にして遊んでください。オンのときは画面の上にお知らせが出ます。</li></ul>
  </section>`;
}

// ボタン操作はまとめて受ける
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go],[data-act]');
  if (!b) return;
  if (b.dataset.go) return show(b.dataset.go);
  const act = b.dataset.act, unit = b.dataset.unit;
  if (act === 'trace') startTrace(unit);
  else if (act === 'battle') startBattle(unit);
  else if (act === 'quit') quitPlay();
});
document.addEventListener('keydown', onKey);

function renderSoundBtn() {
  const b = document.getElementById('soundBtn');
  if (b) b.textContent = store.sound ? '音：オン' : '音：オフ';
}

(async function init() {
  const sb = document.getElementById('soundBtn');
  if (sb) sb.onclick = () => { store.sound = !store.sound; saveStore(); renderSoundBtn(); sb.blur(); };
  renderSoundBtn();
  $app().innerHTML = '<p class="note">問題を読み込んでいます…</p>';
  DATA = await loadData();
  show('home');
})();
