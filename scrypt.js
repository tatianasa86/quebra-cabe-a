const board = document.getElementById("board");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const restartBtn = document.getElementById("restart-btn");
const imageUpload = document.getElementById("image-upload");
const imageOptions = document.querySelectorAll(".image-option");
const levelOptions = document.querySelectorAll(".level-option");
const userStatus = document.getElementById("user-status");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const closeLoginBtn = document.getElementById("close-login");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rankingLevel = document.getElementById("ranking-level");
const rankingList = document.getElementById("ranking-list");

// Imagem padrão
let currentImageUrl = "imagem1.jpg";
let gridSize = 3;
let tiles = [];
let moves = 0;
let timerSeconds = 0;
let timerInterval = null;
let gameStarted = false;
let gameWon = false;

const levelNames = { 3: "Fácil", 4: "Médio", 5: "Difícil" };

function getCurrentUser() {
  try {
    const account = JSON.parse(localStorage.getItem("puzzleAccount") || "null");
    return account?.name || localStorage.getItem("puzzleUser");
  } catch {
    return localStorage.getItem("puzzleUser");
  }
}

function getAccount() {
  try {
    return JSON.parse(localStorage.getItem("puzzleAccount") || "null");
  } catch {
    return null;
  }
}

function updateAccount() {
  const user = getCurrentUser();
  userStatus.textContent = user ? `Olá, ${user}` : "Visitante";
  loginBtn.classList.toggle("hidden", Boolean(user));
  logoutBtn.classList.toggle("hidden", !user);
}

function getRanking() {
  try {
    return JSON.parse(localStorage.getItem("puzzleRanking") || "{}");
  } catch {
    return {};
  }
}

function renderRanking() {
  const level = levelNames[gridSize];
  const entries = getRanking()[gridSize] || [];
  rankingLevel.textContent = level;
  rankingList.innerHTML = "";

  if (!entries.length) {
    rankingList.innerHTML = '<li class="ranking-empty">Nenhuma partida registrada</li>';
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const score = document.createElement("strong");
    name.textContent = entry.name;
    score.textContent = `${entry.moves} mov. · ${entry.time}`;
    item.append(name, score);
    rankingList.appendChild(item);
  });
}

function saveScore() {
  const user = getCurrentUser();
  if (!user) return;

  const ranking = getRanking();
  const entries = ranking[gridSize] || [];
  entries.push({
    name: user,
    moves,
    seconds: timerSeconds,
    time: timerDisplay.textContent,
  });
  entries.sort((first, second) => first.moves - second.moves || first.seconds - second.seconds);
  ranking[gridSize] = entries.slice(0, 5);
  localStorage.setItem("puzzleRanking", JSON.stringify(ranking));
  renderRanking();
}

function getWinningOrder() {
  return Array.from({ length: gridSize * gridSize }, (_, i) => i);
}

function initGame() {
  stopTimer();
  moves = 0;
  timerSeconds = 0;
  gameStarted = false;
  gameWon = false;
  movesDisplay.textContent = "0";
  timerDisplay.textContent = "00:00";

  // Cria as peças [0, 1, 2, ..., 8] onde 8 é a peça vazia
  tiles = [...getWinningOrder()];
  board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
  board.classList.remove("solved");

  // Embaralha com movimentos válidos para garantir que o jogo tenha solução
  shuffleTiles();
  renderBoard();
  renderRanking();
}

function startTimer() {
  if (gameStarted) return;
  gameStarted = true;
  timerInterval = setInterval(() => {
    timerSeconds++;
    const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
    const seconds = String(timerSeconds % 60).padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function renderBoard() {
  board.innerHTML = "";

  tiles.forEach((tileValue, currentIndex) => {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    if (tileValue === gridSize * gridSize - 1 && !gameWon) {
      tile.classList.add("empty");
    } else {
      tile.style.backgroundImage = `url("${currentImageUrl}")`;

      // Calcula a posição da imagem recortada
      tile.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
      const row = Math.floor(tileValue / gridSize);
      const col = tileValue % gridSize;
      tile.style.backgroundPosition = `${(col / (gridSize - 1)) * 100}% ${(row / (gridSize - 1)) * 100}%`;

      // Evento de toque / clique
      tile.addEventListener("click", () => moveTile(currentIndex));
    }

    board.appendChild(tile);
  });
}

function moveTile(index) {
  if (gameWon) return;

  const emptyIndex = tiles.indexOf(gridSize * gridSize - 1);

  if (isAdjacent(index, emptyIndex)) {
    startTimer();

    // Troca as posições no array
    [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];

    moves++;
    movesDisplay.textContent = moves;

    renderBoard();
    checkWin();
  }
}

function isAdjacent(index1, index2) {
  const row1 = Math.floor(index1 / gridSize);
  const col1 = index1 % gridSize;
  const row2 = Math.floor(index2 / gridSize);
  const col2 = index2 % gridSize;

  return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
}

function shuffleTiles() {
  // Embaralha com movimentos válidos para manter a solução possível.
  const shuffleMoves = gridSize === 3 ? 4 : gridSize === 4 ? 20 : 50;
  let previousEmptyIndex = -1;

  for (let i = 0; i < shuffleMoves; i++) {
    const emptyIndex = tiles.indexOf(gridSize * gridSize - 1);
    const validMoves = [];

    const row = Math.floor(emptyIndex / gridSize);
    const col = emptyIndex % gridSize;

    if (row > 0) validMoves.push(emptyIndex - gridSize);
    if (row < gridSize - 1) validMoves.push(emptyIndex + gridSize);
    if (col > 0) validMoves.push(emptyIndex - 1);
    if (col < gridSize - 1) validMoves.push(emptyIndex + 1);

    const availableMoves = validMoves.filter((move) => move !== previousEmptyIndex);
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    previousEmptyIndex = emptyIndex;
    [tiles[emptyIndex], tiles[randomMove]] = [tiles[randomMove], tiles[emptyIndex]];
  }

  if (tiles.every((value, index) => value === index)) {
    shuffleTiles();
  }
}

function checkWin() {
  const winningOrder = getWinningOrder();
  const isWon = tiles.every((val, index) => val === winningOrder[index]);
  if (isWon) {
    gameWon = true;
    stopTimer();
    saveScore();
    board.classList.add("solved");
    renderBoard();
    setTimeout(() => {
      alert(`🎉 Parabéns! Você venceu em ${moves} movimentos e no tempo de ${timerDisplay.textContent}!`);
    }, 200);
  }
}

// Evento de Upload da Imagem
imageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageUrl = e.target.result;
      initGame();
    };
    reader.readAsDataURL(file);
  }
});

imageOptions.forEach((option) => {
  option.addEventListener("click", () => {
    currentImageUrl = option.dataset.image;
    imageOptions.forEach((item) => item.classList.remove("selected"));
    option.classList.add("selected");
    initGame();
  });
});

levelOptions.forEach((option) => {
  option.addEventListener("click", () => {
    gridSize = Number(option.dataset.size);
    levelOptions.forEach((item) => item.classList.remove("selected"));
    option.classList.add("selected");
    initGame();
  });
});

loginBtn.addEventListener("click", () => {
  loginModal.classList.remove("hidden");
  usernameInput.focus();
});

closeLoginBtn.addEventListener("click", () => {
  loginModal.classList.add("hidden");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || password.length < 4) return;

  const account = getAccount();
  if (account && (account.name !== username || account.password !== password)) {
    alert("Nome ou senha incorretos.");
    return;
  }

  localStorage.setItem("puzzleAccount", JSON.stringify({ name: username, password }));
  localStorage.removeItem("puzzleUser");
  updateAccount();
  loginModal.classList.add("hidden");
  loginForm.reset();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("puzzleAccount");
  localStorage.removeItem("puzzleUser");
  updateAccount();
});

restartBtn.addEventListener("click", initGame);

// Inicia o jogo ao carregar
updateAccount();
initGame();