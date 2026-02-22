/* =====================================================
   UNIVERSAL EYE ENGINE – LEARNING HOME
   REAL MediaPipe Blink + ARM MODE + Scroll + Back
   ===================================================== */

let video, statusBox;
let stream = null;

// MediaPipe
let faceMesh = null;

// Blink state
let blinkStart = 0;
let blinkActive = false;
let blinkCount = 0;
let blinkTimer = null;

// ARM MODE
let armed = false;
let armTimer = null;

// Thresholds
const EAR_THRESHOLD = 0.22;
const LONG_BLINK = 900;      // ms
const DOUBLE_GAP = 500;      // ms
const ARM_TIMEOUT = 5000;    // ms
const SCROLL_AMOUNT = 220;

// Eye landmarks
const LEFT_EYE = [33,160,158,133,153,144];
const RIGHT_EYE = [263,387,385,362,380,373];

/* -------- INIT -------- */
function initUniversalEyeEngine() {
  video = document.getElementById("eyeVideo");
  statusBox = document.getElementById("eyeStatus");

  startCamera();
  initFaceMesh();

  setStatus("Eye control inactive");
  speak("Learning page ready");
}

/* -------- CAMERA -------- */
async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await video.play();
}

/* -------- FaceMesh -------- */
function initFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: f =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onResults);

  requestAnimationFrame(faceLoop);
}

async function faceLoop() {
  if (faceMesh && video.readyState === 4) {
    await faceMesh.send({ image: video });
  }
  requestAnimationFrame(faceLoop);
}

/* -------- Blink Detection -------- */
function ear(lm, idx) {
  const d = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const p = idx.map(i=>lm[i]);
  return (d(p[1],p[5]) + d(p[2],p[4])) /
         (2 * d(p[0],p[3]) + 1e-6);
}

function onResults(res) {
  if (!res.multiFaceLandmarks) return;

  const lm = res.multiFaceLandmarks[0];
  const v = (ear(lm,LEFT_EYE) + ear(lm,RIGHT_EYE)) / 2;
  const now = performance.now();

  if (v < EAR_THRESHOLD && !blinkActive) {
    blinkActive = true;
    blinkStart = now;
  }

  if (v >= EAR_THRESHOLD && blinkActive) {
    blinkActive = false;
    const dur = now - blinkStart;
    handleBlink(dur);
  }
}

/* -------- Blink Logic -------- */
function handleBlink(duration) {
  // LONG BLINK
  if (duration >= LONG_BLINK) {
    toggleArm();
    return;
  }

  // SHORT BLINK (only if armed)
  if (!armed) return;

  blinkCount++;
  setStatus("Blink");

  if (blinkTimer) clearTimeout(blinkTimer);

  blinkTimer = setTimeout(() => {
    if (blinkCount === 1) scrollDown();
    else if (blinkCount >= 2) scrollUp();
    blinkCount = 0;
  }, DOUBLE_GAP);
}

/* -------- ARM MODE -------- */
function toggleArm() {
  if (!armed) {
    armed = true;
    setStatus("Control activated");
    speak("Control activated");

    armTimer = setTimeout(disarm, ARM_TIMEOUT);
  } else {
    disarm();
  }
}

function disarm() {
  armed = false;
  setStatus("Control deactivated");
  speak("Control deactivated");

  if (armTimer) clearTimeout(armTimer);
}

/* -------- ACTIONS -------- */
function scrollDown() {
  window.scrollBy({ top: SCROLL_AMOUNT, behavior: "smooth" });
  setStatus("Scroll down");
  speak("Scroll down");
}

function scrollUp() {
  window.scrollBy({ top: -SCROLL_AMOUNT, behavior: "smooth" });
  setStatus("Scroll up");
  speak("Scroll up");
}

/* -------- UI -------- */
function setStatus(txt) {
  statusBox.innerText = txt;
}

/* -------- VOICE -------- */
function speak(text) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

/* -------- STOP CAMERA -------- */
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}
