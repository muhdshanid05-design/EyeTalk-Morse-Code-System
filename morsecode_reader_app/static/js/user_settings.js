function getCookie(name) {
  let cookieValue = null;
  if (document.cookie) {
    const cookies = document.cookie.split(";");
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(c.split("=")[1]);
      }
    }
  }
  return cookieValue;
}

let GET_URL = "/api/get-settings/";
let SAVE_URL = "/api/save-settings/";
let RESET_URL = "/api/reset-settings/";

if (typeof GUARDIAN_MODE !== "undefined" && GUARDIAN_MODE === true) {
  GET_URL = `/guardian/api/get-settings/${TARGET_USER_ID}/`;
  SAVE_URL = `/guardian/api/save-settings/${TARGET_USER_ID}/`;
  RESET_URL = `/guardian/api/reset-settings/${TARGET_USER_ID}/`;
}

const short = document.getElementById("short");
const medium = document.getElementById("medium");
const longB = document.getElementById("long");
const extra = document.getElementById("extra");
const pause = document.getElementById("pause");
const ear = document.getElementById("ear");
const wordGap = document.getElementById("wordGap");

const shortVal = document.getElementById("shortVal");
const mediumVal = document.getElementById("mediumVal");
const longVal = document.getElementById("longVal");
const extraVal = document.getElementById("extraVal");
const pauseVal = document.getElementById("pauseVal");
const wordGapVal = document.getElementById("wordGapVal");
const earVal = document.getElementById("earVal");

const enableEye = document.getElementById("enableEye");
const enableSOS = document.getElementById("enableSOS");
const facialMouse = document.getElementById("facialMouse");

const backBtn = document.getElementById("backBtn");
const saveBtn = document.getElementById("saveSettingsBtn");
const resetBtn = document.getElementById("resetSettingsBtn");
const autoCalibrationBtn = document.getElementById("autoCalibrationBtn");
const statusBox = document.getElementById("eyeControlStatus");
const calibrationStatus = document.getElementById("autoCalibrationStatus");
const video = document.getElementById("settingsEyeVideo");

const DASHBOARD_URL = typeof SETTINGS_BACK_URL !== "undefined" ? SETTINGS_BACK_URL : "/user_dashboard/";
const MIN_BLINK_MS = 100;
const BLINK_COOLDOWN_MS = 250;
const LEFT_EYE = [33,160,158,133,153,144];
const RIGHT_EYE = [263,387,385,362,380,373];

let faceMesh = null;
let camera = null;
let EAR_THRESHOLD = 0.22;
let blinkActive = false;
let blinkStart = 0;
let lastProcessedBlinkAt = 0;
let faceMissingAnnounced = false;
let scanIndex = 0;

const eyeOptions = [autoCalibrationBtn, saveBtn, resetBtn].filter(Boolean);

const eyeOptionStyle = document.createElement("style");
eyeOptionStyle.textContent = `
  .eye-option-active {
    outline: 3px solid #66f0ff;
    outline-offset: 3px;
  }
`;
document.head.appendChild(eyeOptionStyle);

function setStatus(text) {
  if (statusBox) {
    statusBox.innerText = text;
  }
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

function updateUI() {
  shortVal.innerText = short.value;
  mediumVal.innerText = medium.value;
  longVal.innerText = longB.value;
  extraVal.innerText = extra.value;
  pauseVal.innerText = pause.value;
  wordGapVal.innerText = wordGap.value;
  earVal.innerText = ear.value;
}

[short, medium, longB, extra, pause, wordGap, ear].forEach((el) => {
  el.oninput = updateUI;
});

function highlightOption() {
  eyeOptions.forEach((btn, index) => {
    btn.classList.toggle("eye-option-active", index === scanIndex);
  });
}

function nextOption() {
  scanIndex = (scanIndex + 1) % eyeOptions.length;
  highlightOption();
  announceStatus(`Selected ${eyeOptions[scanIndex].innerText}`);
}

function previousOption() {
  scanIndex = (scanIndex - 1 + eyeOptions.length) % eyeOptions.length;
  highlightOption();
  announceStatus(`Selected ${eyeOptions[scanIndex].innerText}`);
}

function triggerSelectedOption() {
  const selected = eyeOptions[scanIndex];
  announceStatus(`Activated ${selected.innerText}`);
  selected.click();
}

if (autoCalibrationBtn) {
  autoCalibrationBtn.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = "/calibration/";
  });
}

async function saveSettings() {
  await fetch(SAVE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({
      short: parseInt(short.value, 10),
      medium: parseInt(medium.value, 10),
      long: parseInt(longB.value, 10),
      extra: parseInt(extra.value, 10),
      pause: parseInt(pause.value, 10),
      word_gap: parseInt(wordGap.value, 10),
      ear: parseFloat(ear.value),
      enable_eye: enableEye.checked,
      enable_sos: enableSOS.checked,
      facialMouse: facialMouse.checked,
    }),
  });

  announceStatus("Settings saved");
}

async function resetSettings() {
  await fetch(RESET_URL, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
  });

  location.reload();
}

function earValue(lm, idx) {
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const p = idx.map((i) => lm[i]);
  return (d(p[1], p[5]) + d(p[2], p[4])) / (2 * d(p[0], p[3]) + 1e-6);
}

async function classifyBlink(duration) {
  const res = await fetch("/api/blink/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duration }),
  });
  return res.json();
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

  const data = await classifyBlink(duration);
  if (!data.blink) {
    return;
  }

  if (data.blink === "EXTRA") {
    announceStatus("Extra long blink detected");
    window.location.href = DASHBOARD_URL;
    return;
  }

  if (data.blink === "SHORT") {
    announceStatus("Short blink detected");
    nextOption();
    return;
  }

  if (data.blink === "MEDIUM") {
    announceStatus("Medium blink detected");
    previousOption();
    return;
  }

  if (data.blink === "LONG") {
    announceStatus("Long blink detected");
    triggerSelectedOption();
  }
}

async function loadInitialSettings() {
  const response = await fetch(GET_URL);
  const data = await response.json();

  short.value = data.short;
  medium.value = data.medium;
  longB.value = data.long;
  extra.value = data.extra;
  pause.value = data.pause;
  wordGap.value = data.word_gap;
  ear.value = data.ear;
  EAR_THRESHOLD = data.ear;

  enableEye.checked = data.enable_eye;
  enableSOS.checked = data.enable_sos;
  facialMouse.checked = data.facialMouse;

  updateUI();
  scanIndex = 0;
  highlightOption();
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

  faceMesh.onResults(async (res) => {
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
    const currentEar = (earValue(lm, LEFT_EYE) + earValue(lm, RIGHT_EYE)) / 2;
    const now = performance.now();

    if (currentEar < EAR_THRESHOLD && !blinkActive) {
      blinkActive = true;
      blinkStart = now;
    }

    if (currentEar >= EAR_THRESHOLD && blinkActive) {
      blinkActive = false;
      const duration = Math.round(now - blinkStart);
      await handleBlink(duration);
    }
  });
}

async function startEyeControl() {
  if (GUARDIAN_MODE) {
    announceStatus("Testing mode ready");
    return;
  }

  initFaceMesh();
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: 180,
    height: 130,
  });

  camera.start();
}

window.addEventListener("load", async () => {
  await loadInitialSettings();
  await startEyeControl();
});
