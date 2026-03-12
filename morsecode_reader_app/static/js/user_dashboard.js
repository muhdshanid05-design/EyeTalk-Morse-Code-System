/* =========================================================
   USER DASHBOARD – FULL DB CONNECTED VERSION
   ========================================================= */

const video = document.getElementById("video");
const cards = document.querySelectorAll(".card");
const cameraSelect = document.getElementById("cameraSelect");

let currentCamera = null;
let selectedDeviceId = null;

let currentIndex = 0;
let blinkActive = false;
let blinkStart = 0;

// DB values
let EAR_THRESHOLD = 0.22;
let COMMAND_GAP = 1500;

/* ---------------- LOAD SETTINGS FROM BACKEND ---------------- */

async function loadSettings(){
  const res = await fetch("/api/get-settings/");
  const data = await res.json();
  EAR_THRESHOLD = data.ear;
  COMMAND_GAP = data.pause;
}

/* ---------------- TEXT TO SPEECH ---------------- */

function speak(text){
  if(!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.9;
  speechSynthesis.speak(msg);
}

/* ---------------- CARD HIGHLIGHT ---------------- */

function highlightCard(index){
  cards.forEach((c,i)=>{
    c.style.border =
      i === index ? "2px solid #66f0ff" :
      "1px solid rgba(255,255,255,0.1)";
    c.style.transform =
      i === index ? "scale(1.08)" : "scale(1)";
  });

  const name = cards[index].querySelector("h3").innerText;
  speak(name);
}

function nextCard(){
  currentIndex = (currentIndex+1)%cards.length;
  highlightCard(currentIndex);
}

function prevCard(){
  currentIndex = (currentIndex-1+cards.length)%cards.length;
  highlightCard(currentIndex);
}

function openCard(){
  cards[currentIndex].click();
}

/* ---------------- EYEBLINK DETECTION ---------------- */

const LEFT_EYE = [33,160,158,133,153,144];
const RIGHT_EYE = [263,387,385,362,380,373];

function ear(lm, idx){
  const d = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const p = idx.map(i=>lm[i]);
  return (d(p[1],p[5])+d(p[2],p[4]))/
         (2*d(p[0],p[3])+1e-6);
}

const faceMesh = new FaceMesh({
  locateFile: f =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
});

faceMesh.setOptions({
  maxNumFaces:1,
  refineLandmarks:true,
  minDetectionConfidence:0.5,
  minTrackingConfidence:0.5
});

faceMesh.onResults(async res=>{
  if(!res.multiFaceLandmarks) return;

  const lm = res.multiFaceLandmarks[0];
  const v = (ear(lm,LEFT_EYE)+ear(lm,RIGHT_EYE))/2;
  const now = performance.now();

  if(v < EAR_THRESHOLD && !blinkActive){
    blinkActive = true;
    blinkStart = now;
  }

  if(v >= EAR_THRESHOLD && blinkActive){
    blinkActive = false;
    const duration = Math.round(now-blinkStart);

    const response = await fetch("/api/blink/",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ duration })
    });

    const data = await response.json();

    if(data.blink === "SHORT") nextCard();
    else if(data.blink === "MEDIUM") prevCard();
    else if(data.blink === "LONG") openCard();
    else if(data.blink === "EXTRA"){
      // Do nothing (back navigation disabled)
    }
  }
});

/* ---------------- CAMERA ---------------- */

async function loadCameras(){
  await navigator.mediaDevices.getUserMedia({video:true});
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter(d=>d.kind==="videoinput");

  cameraSelect.innerHTML="";
  cams.forEach((cam,i)=>{
    const opt=document.createElement("option");
    opt.value=cam.deviceId;
    opt.text=cam.label || `Camera ${i+1}`;
    cameraSelect.appendChild(opt);
  });

  if(cams.length>0){
    selectedDeviceId=cams[0].deviceId;
  }
}

cameraSelect.onchange=()=>{
  selectedDeviceId=cameraSelect.value;
  startCamera();
};

async function startCamera(){
  if(currentCamera) currentCamera.stop();

  currentCamera=new Camera(video,{
    deviceId:selectedDeviceId,
    onFrame:async()=>{ await faceMesh.send({image:video}); },
    width:320,
    height:240
  });

  currentCamera.start();
}

/* ---------------- INIT ---------------- */

window.onload=async()=>{
  await loadSettings();
  highlightCard(currentIndex);
  await loadCameras();
  startCamera();
};
