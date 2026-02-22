/* ================================
   ADVANCED AUTO CALIBRATION
   ================================ */

function getCookie(name){
 let cookieValue = null;
 if(document.cookie){
  const cookies = document.cookie.split(';');
  for(let c of cookies){
   c = c.trim();
   if(c.startsWith(name + '=')){
    cookieValue = decodeURIComponent(c.split('=')[1]);
   }
  }
 }
 return cookieValue;
}

const video = document.getElementById("video");
const stepTitle = document.getElementById("stepTitle");
const stepDesc = document.getElementById("stepDesc");

/* ================================
   SYSTEM VARIABLES
   ================================ */

let step = 0;
let blinkActive = false;
let blinkStart = 0;

let openEARValues = [];
let shortBlinkDurations = [];
let longBlinkDurations = [];

const shortBlinkCount = 5;
const longBlinkCount = 3;

const LEFT=[33,160,158,133,153,144];
const RIGHT=[263,387,385,362,380,373];

/* ================================
   EAR CALCULATION
   ================================ */

function ear(lm,idx){
 const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const p=idx.map(i=>lm[i]);
 return (d(p[1],p[5])+d(p[2],p[4]))/
        (2*d(p[0],p[3])+1e-6);
}

/* ================================
   UI STEP UPDATE
   ================================ */

function setStep(title, desc){
 stepTitle.innerText = title;
 stepDesc.innerText = desc;
}

/* ================================
   CALIBRATION FLOW
   ================================ */

async function startCalibration(){

 step = 1;
 setStep("Phase 1: Keep Eyes Open",
         "Look straight without blinking for 5 seconds.");
 await wait(5000);

 step = 2;
 setStep("Phase 2: Short Blinks",
         "Blink naturally 5 times.");
 await waitUntil(()=>shortBlinkDurations.length >= shortBlinkCount);

 step = 3;
 setStep("Phase 3: Long Blinks",
         "Hold your blink 3 times.");
 await waitUntil(()=>longBlinkDurations.length >= longBlinkCount);

 finishCalibration();
}

/* ================================
   HELPERS
   ================================ */

function wait(ms){
 return new Promise(resolve=>setTimeout(resolve, ms));
}

function waitUntil(condition){
 return new Promise(resolve=>{
  const interval = setInterval(()=>{
   if(condition()){
    clearInterval(interval);
    resolve();
   }
  },200);
 });
}

function safeAverage(arr){
 if(!arr.length) return 0;
 return arr.reduce((a,b)=>a+b,0)/arr.length;
}

/* ================================
   FINAL CALCULATION
   ================================ */

function finishCalibration(){

 if(shortBlinkDurations.length < shortBlinkCount ||
    longBlinkDurations.length < longBlinkCount){
    alert("Calibration failed. Try again.");
    location.reload();
    return;
 }

 const avgEAR = safeAverage(openEARValues);

 const shortAvg = safeAverage(shortBlinkDurations);
 const longAvg = safeAverage(longBlinkDurations);

 const medium = Math.round((shortAvg + longAvg)/2);
 const extra = Math.round(longAvg * 1.6);
 const pause = Math.round(shortAvg * 4);

 fetch('/api/save-settings/',{
  method:'POST',
  headers:{
   'Content-Type':'application/json',
   'X-CSRFToken':getCookie('csrftoken')
  },
  body:JSON.stringify({
   short:Math.round(shortAvg),
   medium:medium,
   long:Math.round(longAvg),
   extra:extra,
   pause:pause,
   ear:avgEAR,
   enable_eye:true,
   enable_sos:true,
   headMove:false,
   facialMouse:false
  })
 })
 .then(res=>res.json())
 .then(data=>{
   setStep("Calibration Complete",
           "Personalized settings saved successfully.");
   setTimeout(()=>{
     window.location.href="/user_settings/";
   },2000);
 })
 .catch(()=>{
   alert("Error saving settings.");
 });
}

/* ================================
   MEDIAPIPE SETUP
   ================================ */

const faceMesh=new FaceMesh({
 locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
});

faceMesh.setOptions({
 maxNumFaces:1,
 refineLandmarks:true
});

faceMesh.onResults(res=>{
 if(!res.multiFaceLandmarks) return;

 const lm=res.multiFaceLandmarks[0];
 const v=(ear(lm,LEFT)+ear(lm,RIGHT))/2;
 const now=performance.now();

 /* Phase 1 EAR collection */
 if(step===1){
  openEARValues.push(v);
 }

 /* Dynamic EAR threshold */
 const threshold = safeAverage(openEARValues) * 0.75 || 0.20;

 if(v < threshold && !blinkActive){
  blinkActive = true;
  blinkStart = now;
 }

 if(v >= threshold && blinkActive){
  blinkActive = false;
  const duration = Math.round(now-blinkStart);

  /* Ignore extremely small noise blinks */
  if(duration < 80) return;

  if(step===2 && shortBlinkDurations.length < shortBlinkCount){
   shortBlinkDurations.push(duration);
  }

  if(step===3 && longBlinkDurations.length < longBlinkCount){
   longBlinkDurations.push(duration);
  }
 }
});

/* ================================
   CAMERA START
   ================================ */

const camera=new Camera(video,{
 onFrame:async()=>faceMesh.send({image:video})
});
camera.start();

/* ================================
   AUTO START
   ================================ */

window.onload=()=>{
 setStep("Initializing...",
         "Camera starting. Please wait...");
 setTimeout(startCalibration,2000);
};
