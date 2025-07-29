let target;
let attempts;
let guessedNumbers;
let isWaiting;

const result = document.getElementById("result");
const status = document.getElementById("status");
const attemptsText = document.getElementById("attempts");
const attemptedNumbersText = document.getElementById("attemptedNumbers");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

canvas.width = 640;
canvas.height = 480;

function initGame() {
  target = Math.floor(Math.random() * 6);
  attempts = 3;
  guessedNumbers = new Set();
  isWaiting = false;
  result.textContent = "";
  status.textContent = "Show a number with your hand";
  attemptsText.textContent = `Attempts left: ${attempts}`;
  attemptedNumbersText.textContent = "Guessed numbers: ";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

initGame();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function countFingers(landmarks) {
  if (!landmarks) return -1;
  let count = 0;
  const tips = [8, 12, 16, 20];
  const baseJoints = [6, 10, 14, 18];

  for (let i = 0; i < 4; i++) {
    if (landmarks[tips[i]].y < landmarks[baseJoints[i]].y) count++;
  }

  if (landmarks[4].x < landmarks[3].x) count++;

  return count;
}

async function handleGesture(number) {
  if (isWaiting || number < 0 || number > 5) return;

  if (guessedNumbers.has(number)) {
    status.textContent = `You've already guessed ${number}. Try another.`;
    return;
  }

  guessedNumbers.add(number);
  isWaiting = true;

  // 1초 기다리기
  status.textContent = "Processing...";
  await delay(1000);

  attempts--;
  if (attempts < 0) attempts = 0;

  attemptsText.textContent = `Attempts left: ${attempts}`;
  attemptedNumbersText.textContent = `Guessed numbers: ${Array.from(guessedNumbers).join(", ")}`;

  // 결과 표시
  if (number === target) {
    result.textContent = `Correct! The number was ${target}.`;
    result.className = "";
    status.textContent = "Game finished! Press RESTART to play again.";
    return;
  } else if (number < target) {
    result.textContent = "UP";
    result.className = "up";
  } else {
    result.textContent = "DOWN";
    result.className = "down";
  }

  if (attempts === 0) {
    result.textContent = `Game Over! The number was ${target}.`;
    result.className = "";
    status.textContent = "Game finished! Press RESTART to play again.";
    return;
  }

  // 3초 대기 후 다시 인식 가능하게
  status.textContent = "Waiting 3 seconds...";
  await delay(3000);

  if (attempts > 0) {
    isWaiting = false;
    status.textContent = "Show a number with your hand";
  }
}

const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (results.multiHandLandmarks.length > 0) {
    drawConnectors(ctx, results.multiHandLandmarks[0], HAND_CONNECTIONS, { color: '#000' });
    drawLandmarks(ctx, results.multiHandLandmarks[0], { color: '#000', lineWidth: 2 });
    const count = countFingers(results.multiHandLandmarks[0]);
    handleGesture(count);
  }
});

const video = document.createElement("video");
video.width = canvas.width;
video.height = canvas.height;

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
  video.play();
  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: canvas.width,
    height: canvas.height,
  });
  camera.start();
});

restartBtn.addEventListener("click", () => {
  initGame();
});

