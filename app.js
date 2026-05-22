// Theme Toggle
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.innerHTML = theme === 'light' ? '🌙' : '☀️';
  }
}

// State
let currentVocab = [];
let filteredVocab = [];
let currentCardIndex = 0;
let currentFilterBox = 'all';
let vocabBoxes = {};

const API_URL = 'https://script.google.com/macros/s/AKfycbyx1zuC_Gfq0-0zeqykHIjdWG9YsBbIjoQ96pTwdioHKoc-yAdTsScoJRg0BYnZXoEgNQ/exec';

// Google Sheet Functions
async function loadFromSheet() {
  try {
    document.getElementById('status').innerHTML = '⏳ Đang lấy danh sách sheet...';
    document.getElementById('sheetModal').classList.remove('hidden');

    const res = await fetch(`${API_URL}?action=sheets`);
    const sheets = await res.json();

    if (!sheets || sheets.length === 0) {
      document.getElementById('sheetModal').classList.add('hidden');
      document.getElementById('status').innerHTML = '❌ Không lấy được danh sách sheet';
      return;
    }

    const sheetList = document.getElementById('sheetList');
    sheetList.innerHTML = '';
    sheets.forEach(name => {
      const div = document.createElement('div');
      div.className = 'sheet-item';
      div.textContent = name;
      div.addEventListener('click', () => loadSheetData(name));
      sheetList.appendChild(div);
    });

    document.getElementById('status').innerHTML = 'Chọn sheet bên dưới';

  } catch (err) {
    console.error(err);
    document.getElementById('sheetModal').classList.add('hidden');
    document.getElementById('status').innerHTML = '❌ Lỗi lấy danh sách sheet';
  }
}

async function loadSheetData(sheetName) {
  try {
    document.getElementById('sheetModal').classList.add('hidden');
    document.getElementById('status').innerHTML = '⏳ Đang tải dữ liệu...';

    const url = `${API_URL}?sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.length === 0) {
      document.getElementById('status').innerHTML = '❌ Không có dữ liệu';
      return;
    }

    currentVocab = data.map((item, idx) => ({
      id: idx,
      term: item.term,
      meaning: item.meaning,
      box: getBox(item.term)
    }));

    document.getElementById('status').innerHTML = `✅ Đã load ${currentVocab.length} từ từ sheet "${sheetName}"!`;
    document.getElementById('mainContent').style.display = 'block';

    applyFilter();

  } catch (err) {
    console.error(err);
    document.getElementById('status').innerHTML = '❌ Lỗi load dữ liệu';
  }
}

// Box Management
function loadBoxes() {
  try {
    const saved = localStorage.getItem('vocab_boxes');
    if (saved) Object.assign(vocabBoxes, JSON.parse(saved));
  } catch (e) {}
}

function saveBoxes() {
  localStorage.setItem('vocab_boxes', JSON.stringify(vocabBoxes));
}

function getBoxKey(term) {
  return term;
}

function getBox(term) {
  return vocabBoxes[getBoxKey(term)] || 1;
}

function setBox(term, box) {
  vocabBoxes[getBoxKey(term)] = box;
  saveBoxes();
}

// Filter & Stats
function applyFilter() {
  let arr = [...currentVocab];
  if (currentFilterBox !== 'all') {
    const boxVal = { red: 1, yellow: 2, green: 3 }[currentFilterBox];
    arr = arr.filter(v => v.box === boxVal);
  }
  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  if (search) {
    arr = arr.filter(v =>
      v.term.toLowerCase().includes(search) ||
      v.meaning.toLowerCase().includes(search)
    );
  }
  filteredVocab = arr;
  if (filteredVocab.length && currentCardIndex >= filteredVocab.length) {
    currentCardIndex = 0;
  }
  updateStatsAndUI();
}

function updateStatsAndUI() {
  const total = currentVocab.length;
  const red = currentVocab.filter(v => v.box === 1).length;
  const yellow = currentVocab.filter(v => v.box === 2).length;
  const green = currentVocab.filter(v => v.box === 3).length;

  document.getElementById('totalCount').innerText = total;
  document.getElementById('redCount').innerText = red;
  document.getElementById('yellowCount').innerText = yellow;
  document.getElementById('greenCount').innerText = green;
  document.getElementById('allCount').innerText = total;

  renderVocabList();
  updateFlashcard();
}

// Vocab List Rendering
function renderVocabList() {
  const container = document.getElementById('vocabGrid');
  if (!currentVocab.length) {
    container.innerHTML = '<div>Chưa có dữ liệu</div>';
    return;
  }
  let html = '';
  currentVocab.forEach((item, idx) => {
    const boxClass = item.box === 1 ? 'red' : (item.box === 2 ? 'yellow' : 'green');
    html += `<div class="vocab-item ${boxClass}" data-idx="${idx}">
      <span class="vocab-item-term">${escapeHtml(item.term)}</span>
      <span class="vocab-item-meaning">${escapeHtml(item.meaning.substring(0, 40))}</span>
    </div>`;
  });
  container.innerHTML = html;

  document.querySelectorAll('.vocab-item').forEach(el => {
    el.addEventListener('click', () => {
      currentCardIndex = parseInt(el.dataset.idx);
      applyFilter();
      updateFlashcard();
    });
  });
}

// Flashcard
function updateFlashcard() {
  if (!filteredVocab.length) {
    document.getElementById('cardTerm').innerText = '📭 Không có từ';
    document.getElementById('cardMeaning').innerHTML = '---';
    document.getElementById('cardProgress').innerText = '0/0';
    return;
  }
  const item = filteredVocab[currentCardIndex];
  document.getElementById('cardTerm').innerText = item.term;
  document.getElementById('cardMeaning').innerHTML = item.meaning;
  document.getElementById('cardProgress').innerText = `${currentCardIndex + 1}/${filteredVocab.length}`;
  document.getElementById('flipCard').classList.remove('flipped');
}

function rateCurrent(boxValue) {
  if (!filteredVocab.length) return;
  const item = filteredVocab[currentCardIndex];
  const realItem = currentVocab.find(v => v.term === item.term);
  if (realItem) {
    const newBox = { red: 1, yellow: 2, green: 3 }[boxValue];
    realItem.box = newBox;
    setBox(realItem.term, newBox);
    applyFilter();
    if (filteredVocab.length && currentCardIndex >= filteredVocab.length) {
      currentCardIndex = filteredVocab.length - 1;
    }
    updateFlashcard();
  }
}

// Quiz
let quizQuestions = [], quizAnswers = [], quizResults = [];

function startQuiz() {
  const count = parseInt(document.getElementById('quizCount').value) || 10;
  const scope = document.getElementById('quizScope').value;
  const direction = document.getElementById('quizDirection').value;

  let pool = scope === 'current' ? [...currentVocab] : currentVocab.filter(v => v.box === 1 || v.box === 2);
  if (!pool.length) {
    alert('Không có từ nào!');
    return;
  }

  let rawQuestions = [];
  for (let item of pool) {
    if (direction === 'viet2trung' || direction === 'mixed') {
      rawQuestions.push({ type: 'viet2trung', question: item.term, answer: item.meaning, originalItem: item });
    }
    if (direction === 'trung2viet' || direction === 'mixed') {
      rawQuestions.push({ type: 'trung2viet', question: item.meaning, answer: item.term, originalItem: item });
    }
  }

  // Shuffle
  for (let i = rawQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rawQuestions[i], rawQuestions[j]] = [rawQuestions[j], rawQuestions[i]];
  }

  quizQuestions = rawQuestions.slice(0, Math.min(count, rawQuestions.length));
  quizAnswers = quizQuestions.map(() => '');
  quizResults = quizQuestions.map(() => null);
  renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!quizQuestions.length) {
    container.innerHTML = '<div>Nhấn "Bắt đầu"</div>';
    return;
  }

  let html = '<div style="margin-bottom:1.5rem; font-weight:600;">Trả lời câu hỏi:</div>';

  quizQuestions.forEach((q, idx) => {
    const isCorrect = quizResults[idx] === true;
    const isWrong = quizResults[idx] === false;
    const directionText = q.type === 'viet2trung' ? 'Việt → Trung' : 'Trung → Việt';

    html += `<div class="quiz-question">
      <div class="quiz-question-title">${directionText}</div>
      <div class="quiz-question-content">${escapeHtml(q.question)}</div>
      <input class="quiz-input ${isCorrect ? 'correct' : (isWrong ? 'incorrect' : '')}"
        data-idx="${idx}" type="text" placeholder="Nhập câu trả lời..."
        value="${escapeHtml(quizAnswers[idx] || '')}">
      <div class="quiz-feedback ${isCorrect ? 'correct' : (isWrong ? 'incorrect' : '')}">
        ${isCorrect ? '✓ Đúng!' : (isWrong ? '✗ Sai. Đáp án: ' + q.answer : '')}
      </div>
    </div>`;
  });

  const correctCount = quizResults.filter(r => r === true).length;
  html += `<div class="quiz-result">
    <div class="quiz-score">${correctCount}/${quizQuestions.length}</div>
    <button id="submitQuizBtn" class="btn btn-primary">Nộp bài & Lưu</button>
  </div>`;

  container.innerHTML = html;

  document.querySelectorAll('.quiz-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      quizAnswers[idx] = e.target.value;
      quizResults[idx] = null;
      renderQuiz();
    });
  });

  document.getElementById('submitQuizBtn')?.addEventListener('click', submitQuiz);
}

function submitQuiz() {
  quizQuestions.forEach((q, idx) => {
    const user = (quizAnswers[idx] || '').trim().toLowerCase();
    const ans = q.answer.trim().toLowerCase();
    const isOk = user === ans || (ans.includes(user) && user.length > 2) || (user.includes(ans));
    quizResults[idx] = isOk;

    if (q.originalItem && q.originalItem.term) {
      const realItem = currentVocab.find(v => v.term === q.originalItem.term);
      if (realItem) {
        if (isOk && realItem.box < 3) realItem.box++;
        else if (!isOk && realItem.box > 1) realItem.box = 1;
        setBox(realItem.term, realItem.box);
      }
    }
  });

  applyFilter();
  renderQuiz();
}

// Utilities
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Event Listeners
function initEventListeners() {
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Sheet modal
  document.getElementById('cancelSheetBtn').addEventListener('click', () => {
    document.getElementById('sheetModal').classList.add('hidden');
    document.getElementById('status').innerHTML = 'Chưa có dữ liệu';
  });

  document.getElementById('loadSheetBtn').addEventListener('click', loadFromSheet);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('flashcardTab').classList.toggle('hidden', btn.dataset.tab !== 'flashcard');
      document.getElementById('quizTab').classList.toggle('hidden', btn.dataset.tab !== 'quiz');
    });
  });

  // Stat box filtering
  document.querySelectorAll('.stat-box').forEach(box => {
    box.addEventListener('click', () => {
      document.querySelectorAll('.stat-box').forEach(b => b.classList.remove('selected'));
      box.classList.add('selected');
      currentFilterBox = box.dataset.filter || 'all';
      applyFilter();
    });
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', () => applyFilter());

  // Flashcard navigation
  document.getElementById('prevBtn').addEventListener('click', () => {
    if (filteredVocab.length) {
      currentCardIndex = (currentCardIndex - 1 + filteredVocab.length) % filteredVocab.length;
      updateFlashcard();
    }
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (filteredVocab.length) {
      currentCardIndex = (currentCardIndex + 1) % filteredVocab.length;
      updateFlashcard();
    }
  });

  // Flip card
  document.getElementById('flipCard').addEventListener('click', () => {
    if (filteredVocab.length) {
      document.getElementById('flipCard').classList.toggle('flipped');
    }
  });

  // Rating buttons
  document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => rateCurrent(btn.dataset.rating));
  });

  // Quiz
  document.getElementById('startQuizBtn').addEventListener('click', startQuiz);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadBoxes();
  initEventListeners();
});