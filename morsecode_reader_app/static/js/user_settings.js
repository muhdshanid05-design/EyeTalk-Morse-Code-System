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

let GET_URL = '/api/get-settings/';
let SAVE_URL = '/api/save-settings/';
let RESET_URL = '/api/reset-settings/';

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

function updateUI(){
  shortVal.innerText = short.value;
  mediumVal.innerText = medium.value;
  longVal.innerText = longB.value;
  extraVal.innerText = extra.value;
  pauseVal.innerText = pause.value;
  wordGapVal.innerText = wordGap.value;
  earVal.innerText = ear.value;
}

[short, medium, longB, extra, pause, wordGap, ear].forEach(el=>{
  el.oninput = updateUI;
});

fetch(GET_URL)
.then(r=>r.json())
.then(d=>{
  short.value=d.short;
  medium.value=d.medium;
  longB.value=d.long;
  extra.value=d.extra;
  pause.value=d.pause;
  wordGap.value=d.word_gap;
  ear.value=d.ear;

  enableEye.checked=d.enable_eye;
  enableSOS.checked=d.enable_sos;
  facialMouse.checked=d.facialMouse;

  updateUI();
});

function saveSettings(){
  fetch(SAVE_URL,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-CSRFToken':getCookie('csrftoken')
    },
    body:JSON.stringify({
      short:parseInt(short.value),
      medium:parseInt(medium.value),
      long:parseInt(longB.value),
      extra:parseInt(extra.value),
      pause:parseInt(pause.value),
      word_gap:parseInt(wordGap.value),
      ear:parseFloat(ear.value),
      enable_eye:enableEye.checked,
      enable_sos:enableSOS.checked,
      facialMouse:facialMouse.checked
    })
  }).then(()=>location.reload());
}

function resetSettings(){
  fetch(RESET_URL,{
    method:'POST',
    headers:{'X-CSRFToken':getCookie('csrftoken')}
  }).then(()=>location.reload());
}
