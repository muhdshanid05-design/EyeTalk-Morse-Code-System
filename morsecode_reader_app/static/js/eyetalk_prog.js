/* ===========================================================
   EYETALK – FULL DB CONNECTED VERSION (FINAL STABLE)
   - Uses backend 4-level blink classification
   - Loads EAR threshold from database
   - Fully centralized
   =========================================================== */

/* ===================== ELEMENTS ===================== */

const video = document.getElementById("video");
const symbolSeq = document.getElementById("symbolSeq");
const decodedText = document.getElementById("decodedText");

const speakBtn = document.getElementById("speakBtn");
const saveBtn  = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const clearBtn = document.getElementById("clearBtn");

/* ===================== STATE ===================== */

let faceMesh = null;
let camera = null;

let EAR_THRESH = 0.22;
let blinkActive = false;
let blinkStart = 0;

let symbolBuffer = [];
let messageText = "";
let charTimer = null;

let CHAR_GAP_MS = 1000;
let WORD_GAP_MS = 2200;
let lastBlinkTime = 0;




/* ===================== LOAD SETTINGS ===================== */

async function loadSettings(){
  const res = await fetch("/api/get-settings/");
  const data = await res.json();
  EAR_THRESH = data.ear;
  CHAR_GAP_MS = data.pause ;
  WORD_GAP_MS = data.word_gap;

}

/* ===================== AUDIO ===================== */

function speakText(text){
  if(!text) return;
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.9;
  speechSynthesis.speak(msg);
}

/* ===================== EYE LANDMARKS ===================== */

const LEFT_EYE  = [33,160,158,133,153,144];
const RIGHT_EYE = [263,387,385,362,380,373];

function calcEAR(lm, idx){
  const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const p=idx.map(i=>lm[i]);
  return (d(p[1],p[5])+d(p[2],p[4]))/(2*d(p[0],p[3])+1e-6);
}

/* ===================== FACEMESH ===================== */

function initFaceMesh(){
  faceMesh = new FaceMesh({
    locateFile: f =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
  });

  faceMesh.setOptions({
    maxNumFaces:1,
    refineLandmarks:true,
    minDetectionConfidence:0.5,
    minTrackingConfidence:0.5
  });

  faceMesh.onResults(onResults);
}

function onResults(res){
  if(!res.multiFaceLandmarks) return;

  const lm = res.multiFaceLandmarks[0];
  const ear = (calcEAR(lm,LEFT_EYE)+calcEAR(lm,RIGHT_EYE))/2;
  const now = performance.now();

  if(ear < EAR_THRESH && !blinkActive){
    blinkActive = true;
    blinkStart = now;
  }

  if(ear >= EAR_THRESH && blinkActive){
    blinkActive = false;
    const duration = Math.round(now-blinkStart);
    handleBlink(duration);
  }
}
async function handleBlink(duration){

  const now = performance.now();

  const res = await fetch("/api/blink/",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ duration })
  });

  const data = await res.json();

  if(!data.blink) return;

  // WORD GAP CHECK (after valid blink)
  if (now - lastBlinkTime > WORD_GAP_MS && messageText.length > 0){
      messageText += " ";
      decodedText.textContent = messageText;
  }

  lastBlinkTime = now;

  if(data.blink === "SHORT"){
      symbolBuffer.push(".");
      symbolSeq.textContent = symbolBuffer.join("");
      scheduleCharBoundary();
  }

  else if(data.blink === "MEDIUM"){
      symbolBuffer.push("-");
      symbolSeq.textContent = symbolBuffer.join("");
      scheduleCharBoundary();
  }

  else if(data.blink === "LONG"){
      messageText = messageText.slice(0,-1);
      decodedText.textContent = messageText;
  }

  else if(data.blink === "EXTRA"){
      messageText="";
      symbolBuffer=[];
      symbolSeq.textContent="-";
      decodedText.textContent="";
  }
}

/* ===================== LETTER GAP ===================== */

function scheduleCharBoundary(){
  clearTimeout(charTimer);
  charTimer = setTimeout(decodeSymbolBuffer, CHAR_GAP_MS);
}

/* ===================== DECODE ===================== */

async function decodeSymbolBuffer(){

  if(!symbolBuffer.length) return;

  const res = await fetch("/api/decode-morse/",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ morse: symbolBuffer.join("") })
  });

  const data = await res.json();

  if(data.letter){
    messageText += data.letter;
    decodedText.textContent = messageText;
  }

  symbolBuffer=[];
  symbolSeq.textContent="-";
}

/* ===================== SAVE ===================== */

async function saveMessage(){
  if(!messageText.trim()){
    speakText("Nothing to save");
    return;
  }

  await fetch("/eyetalk/save/",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "X-CSRFToken":document.cookie.split("csrftoken=")[1]
    },
    body:JSON.stringify({ text: messageText })
  });

  speakText("Message saved");
}

/* ===================== MANUAL BUTTONS ===================== */

if(speakBtn) speakBtn.onclick = ()=>speakText(messageText);
if(saveBtn)  saveBtn.onclick  = saveMessage;

if(deleteBtn){
  deleteBtn.onclick = ()=>{
    messageText = messageText.slice(0,-1);
    decodedText.textContent = messageText;
    speakText("Deleted");
  };
}

if(clearBtn){
  clearBtn.onclick = ()=>{
    messageText="";
    symbolBuffer=[];
    symbolSeq.textContent="-";
    decodedText.textContent="";
    speakText("Cleared");
  };
}

/* ===================== CAMERA START ===================== */

function startCamera(){
  if(!faceMesh) initFaceMesh();

  camera = new Camera(video,{
    onFrame:async()=>{ await faceMesh.send({image:video}); },
    width:400,
    height:300
  });

  camera.start();
}

window.onload = async ()=>{
  await loadSettings();
  startCamera();
};
