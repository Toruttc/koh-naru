// ── Quiz data ──
const quizData = {
  math: {
    name: 'さんすう',
    icon: '🔢',
    questions: [
      { q: '🍎🍎🍎 と 🍎🍎 をあわせると？', choices: ['3', '4', '5', '6'], ans: 2 },
      { q: '7 から 3 を ひくと？', choices: ['2', '3', '4', '5'], ans: 2 },
      { q: '2 × 4 = ?', choices: ['6', '8', '10', '12'], ans: 1 },
      { q: '10 ÷ 2 = ?', choices: ['3', '4', '5', '6'], ans: 2 },
      { q: '15 + 8 = ?', choices: ['21', '22', '23', '24'], ans: 2 },
    ]
  },
  read: {
    name: 'こくご',
    icon: '📖',
    questions: [
      { q: '「いぬ」はどれ？', choices: ['🐱', '🐶', '🐸', '🐦'], ans: 1 },
      { q: '「あか」のくだものは？', choices: ['🍇', '🍋', '🍎', '🍏'], ans: 2 },
      { q: '「おおきい」のはんたいは？', choices: ['ながい', 'たかい', 'ちいさい', 'かるい'], ans: 2 },
      { q: '「あたたかい」のはんたいは？', choices: ['つめたい', 'くらい', 'おもい', 'はやい'], ans: 0 },
      { q: '春・夏・秋・冬で いちばん さむい きせつは？', choices: ['春', '夏', '秋', '冬'], ans: 3 },
    ]
  },
  life: {
    name: 'せいかつ',
    icon: '🌈',
    questions: [
      { q: 'あめが ふっているとき つかうものは？', choices: ['🧢', '☂️', '🧣', '🕶️'], ans: 1 },
      { q: 'てを あらうとき つかうのは？', choices: ['🥤', '🧴', '☕', '🍶'], ans: 1 },
      { q: 'ごはんを たべるとき つかうのは？', choices: ['✏️', '🖌️', '🥢', '📏'], ans: 2 },
      { q: 'ねるまえに すること は？', choices: ['はをみがく', 'テレビをみる', 'そとであそぶ', 'ごはんをたべる'], ans: 0 },
      { q: 'がっこうに もっていく ものは？', choices: ['フライパン', 'ランドセル', 'まくら', 'かさたて'], ans: 1 },
    ]
  }
};

// ── State ──
let currentSubject = null;
let currentIndex = 0;
let correctCount = 0;
let answered = false;

// ── Navigation ──
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  const btns = document.querySelectorAll('.nav-btn');
  const map = { home: 0, tools: 1, support: 2 };
  if (map[name] !== undefined) btns[map[name]].classList.add('active');
}

// ── Subject selection ──
function buildSubjectGrid() {
  const grid = document.getElementById('subject-grid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.entries(quizData).forEach(([key, data]) => {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <div class="subject-icon">${data.icon}</div>
      <div class="subject-name">${data.name}</div>
      <div class="subject-meta">${data.questions.length}もんだい</div>
    `;
    card.onclick = () => startQuiz(key);
    grid.appendChild(card);
  });
}

// ── Quiz ──
function startQuiz(key) {
  currentSubject = key;
  currentIndex = 0;
  correctCount = 0;
  answered = false;
  document.getElementById('subject-select').style.display = 'none';
  document.getElementById('quiz-view').style.display = 'block';
  document.getElementById('result-view').style.display = 'none';
  renderQuestion();
}

function renderQuestion() {
  answered = false;
  const data = quizData[currentSubject];
  const q = data.questions[currentIndex];
  const total = data.questions.length;

  document.getElementById('q-bar-fill').style.width = (currentIndex / total * 100) + '%';
  document.getElementById('q-count').textContent = (currentIndex + 1) + ' / ' + total;
  document.getElementById('q-text').textContent = q.q;

  const fb = document.getElementById('feedback');
  fb.className = 'feedback';
  fb.textContent = '';

  const choices = document.getElementById('choices');
  choices.innerHTML = '';
  q.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = () => answer(i, btn);
    choices.appendChild(btn);
  });
}

function answer(i, btn) {
  if (answered) return;
  answered = true;
  const q = quizData[currentSubject].questions[currentIndex];
  const fb = document.getElementById('feedback');
  const allBtns = document.querySelectorAll('.choice-btn');

  if (i === q.ans) {
    btn.classList.add('correct');
    fb.className = 'feedback correct';
    fb.textContent = '⭕ せいかい！すごい！';
    correctCount++;
  } else {
    btn.classList.add('wrong');
    allBtns[q.ans].classList.add('correct');
    fb.className = 'feedback wrong';
    fb.textContent = '❌ ざんねん… こたえは「' + q.choices[q.ans] + '」だよ';
  }

  const total = quizData[currentSubject].questions.length;
  if (currentIndex < total - 1) {
    setTimeout(() => { currentIndex++; renderQuestion(); }, 1600);
  } else {
    setTimeout(() => showResult(total), 1600);
  }
}

function showResult(total) {
  document.getElementById('quiz-view').style.display = 'none';
  document.getElementById('result-view').style.display = 'block';

  const pct = correctCount / total;
  let emoji, msg;
  if (pct === 1)       { emoji = '🎉'; msg = 'ぜんもん せいかい！すばらしい！'; }
  else if (pct >= 0.6) { emoji = '😊'; msg = 'よくがんばったね！'; }
  else                 { emoji = '💪'; msg = 'もう一度チャレンジしてみよう！'; }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-msg').textContent = msg;
  document.getElementById('result-score').textContent = total + 'もんちゅう ' + correctCount + 'もん せいかい';

  document.getElementById('retry-btn').onclick = () => startQuiz(currentSubject);
}

function backToSubjects() {
  document.getElementById('subject-select').style.display = 'block';
  document.getElementById('quiz-view').style.display = 'none';
  document.getElementById('result-view').style.display = 'none';
}

// ── Init ──
buildSubjectGrid();
