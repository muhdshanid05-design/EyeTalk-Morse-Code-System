/* EyeTalk Morse communication with stable blink control. */

const video = document.getElementById("video");
const symbolSeq = document.getElementById("symbolSeq");
const decodedText = document.getElementById("decodedText");

const speakBtn = document.getElementById("speakBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const clearBtn = document.getElementById("clearBtn");

let faceMesh = null;
let camera = null;

let EAR_THRESH = 0.22;
let blinkActive = false;
let blinkStart = 0;
let lastProcessedBlinkAt = 0;
let faceMissingAnnounced = false;

let symbolBuffer = [];
let currentWord = "";
let messageText = "";
let charTimer = null;

let CHAR_GAP_MS = 1000;
let WORD_GAP_MS = 2200;
let lastBlinkTime = 0;

const MIN_BLINK_MS = 100;
const BLINK_COOLDOWN_MS = 250;
const DASHBOARD_URL = "/user_dashboard/";

const statusBox = createStatusBox();

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [263, 387, 385, 362, 380, 373];

function createStatusBox() {
  const box = document.createElement("div");
  box.id = "blinkStatus";
  box.style.marginTop = "10px";
  box.style.fontSize = "14px";
  box.style.color = "#dbeafe";
  box.textContent = "Ready";
  const container = video ? video.parentElement : document.body;
  container.appendChild(box);
  return box;
}

function setStatus(text) {
  if (statusBox) {
    statusBox.textContent = text;
  }
}

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function loadSettings() {
  const res = await fetch("/api/get-settings/");
  const data = await res.json();
  EAR_THRESH = data.ear;
  CHAR_GAP_MS = data.pause;
  WORD_GAP_MS = data.word_gap;
}

function speak(text) {
  if (!window.speechSynthesis || !text) return;
  speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(speech);
}

function announceStatus(text) {
  setStatus(text);
  speak(text);
}

function calcEAR(lm, idx) {
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const p = idx.map((i) => lm[i]);
  return (d(p[1], p[5]) + d(p[2], p[4])) / (2 * d(p[0], p[3]) + 1e-6);
}

function initFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(onResults);
}

function onResults(res) {
  if (!res.multiFaceLandmarks || !res.multiFaceLandmarks.length) {
    if (!faceMissingAnnounced) {
      faceMissingAnnounced = true;
      announceStatus("Please face the camera");
    }
    blinkActive = false;
    return;
  }

  faceMissingAnnounced = false;

  const lm = res.multiFaceLandmarks[0];
  const ear = (calcEAR(lm, LEFT_EYE) + calcEAR(lm, RIGHT_EYE)) / 2;
  const now = performance.now();

  if (ear < EAR_THRESH && !blinkActive) {
    blinkActive = true;
    blinkStart = now;
  }

  if (ear >= EAR_THRESH && blinkActive) {
    blinkActive = false;
    const duration = Math.round(now - blinkStart);
    handleBlink(duration);
  }
}

async function handleBlink(duration) {
  const now = performance.now();

  if (duration < MIN_BLINK_MS) {
    return;
  }

  if (now - lastProcessedBlinkAt < BLINK_COOLDOWN_MS) {
    return;
  }

  lastProcessedBlinkAt = now;

  const res = await fetch("/api/blink/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duration }),
  });

  const data = await res.json();
  if (!data.blink) return;

  if (data.blink === "EXTRA") {
    announceStatus("Extra long blink detected");
    if (currentWord) {
      messageText = messageText ? `${messageText} ${currentWord}` : currentWord;
      currentWord = "";
      decodedText.textContent = messageText;
    }
    if (messageText.trim()) {
      await saveMessage();
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(messageText);
      utter.onend = () => {
        window.location.href = DASHBOARD_URL;
      };
      speechSynthesis.speak(utter);
    } else {
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance("No message to save");
      utter.onend = () => {
        window.location.href = DASHBOARD_URL;
      };
      speechSynthesis.speak(utter);
    }
    return;
  }

  if (now - lastBlinkTime > WORD_GAP_MS && currentWord) {
    messageText = messageText ? `${messageText} ${currentWord}` : currentWord;
    currentWord = "";
    decodedText.textContent = `${messageText} `;
  }

  lastBlinkTime = now;

  if (data.blink === "SHORT") {
    announceStatus("Short blink detected");
    symbolBuffer.push(".");
    symbolSeq.textContent = symbolBuffer.join("");
    announceStatus("Dot entered");
    scheduleCharBoundary();
    return;
  }

  if (data.blink === "MEDIUM") {
    announceStatus("Medium blink detected");
    symbolBuffer.push("-");
    symbolSeq.textContent = symbolBuffer.join("");
    announceStatus("Dash entered");
    scheduleCharBoundary();
    return;
  }

  if (data.blink === "LONG") {
    announceStatus("Long blink detected");
    if (currentWord) {
      currentWord = currentWord.slice(0, -1);
    } else {
      messageText = messageText.slice(0, -1);
    }
    decodedText.textContent = `${messageText}${messageText && currentWord ? " " : ""}${currentWord}`;
    announceStatus("Delete action");
  }
}

function scheduleCharBoundary() {
  clearTimeout(charTimer);
  charTimer = setTimeout(decodeSymbolBuffer, CHAR_GAP_MS);
}

async function decodeSymbolBuffer() {
  if (!symbolBuffer.length) return;

  const res = await fetch("/api/decode-morse/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ morse: symbolBuffer.join("") }),
  });

  const data = await res.json();

  if (data.letter) {
    currentWord += data.letter;
    decodedText.textContent = `${messageText}${messageText && currentWord ? " " : ""}${currentWord}`;
    setStatus(`Decoded: ${data.letter}`);
  }

  symbolBuffer = [];
  symbolSeq.textContent = "-";
}

async function saveMessage() {
  if (!messageText.trim()) {
    speak("Nothing to save");
    return;
  }

  await fetch("/eyetalk/save/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
    },
    body: JSON.stringify({
      text: messageText,
      device_info: { source: "eyetalk_prog" },
    }),
  });

  announceStatus("Message saved");
}

if (speakBtn) speakBtn.onclick = () => speak(messageText);
if (saveBtn) saveBtn.onclick = saveMessage;

if (deleteBtn) {
  deleteBtn.onclick = () => {
    if (currentWord) {
      currentWord = currentWord.slice(0, -1);
    } else {
      messageText = messageText.slice(0, -1);
    }
    decodedText.textContent = `${messageText}${messageText && currentWord ? " " : ""}${currentWord}`;
    announceStatus("Delete action");
  };
}

if (clearBtn) {
  clearBtn.onclick = () => {
    messageText = "";
    currentWord = "";
    symbolBuffer = [];
    symbolSeq.textContent = "-";
    decodedText.textContent = "";
    announceStatus("Cleared");
  };
}

function startCamera() {
  if (!faceMesh) initFaceMesh();

  camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: 400,
    height: 300,
  });

  camera.start();
}

window.onload = async () => {
  await loadSettings();
  startCamera();
};
