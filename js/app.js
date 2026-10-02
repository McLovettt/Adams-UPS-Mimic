// Adams UPS Trainer v0.7
// Shared helpers and tab navigation.

const $=id=>document.getElementById(id);

function breakerState(el,closed){
  el.classList.toggle("closed",closed); el.classList.toggle("open",!closed);
  el.querySelector(".state").textContent=closed?"CLOSED":"OPEN";
}
function lockBreaker(el,locked){ el.classList.toggle("locked",locked); }
function wire(id,mode){ const e=$(id); e.classList.remove("live","warn"); if(mode)e.classList.add(mode); }
function pill(id,text,kind){ const e=$(id); e.textContent=text; e.className="pill "+kind; }
function lamp(id,available){ const e=$(id); e.classList.toggle("available",available); e.classList.toggle("blocked",!available); }
function staticVisual(id,textId,on){ $(id).classList.toggle("on",on); $(textId).textContent=on?"ON":"OFF"; }

function inputVisual(id,textId,on){
  const el=$(id);
  el.classList.toggle("on",on);
  el.classList.toggle("off",!on);
  $(textId).textContent=on?"ON":"OFF";
}
function batteryMeter(prefix,pct){
  const p=Math.max(0,Math.min(100,pct));
  $(prefix+"BatPct").textContent=Math.round(p)+"%";
  $(prefix+"BatBar").setAttribute("width", 1.06*p);
}

function batteryTestVisual(prefix,state){
  const box=$(prefix+"BatteryTest");
  const label=$(prefix+"BatteryTestText");
  const status=$(prefix+"BatteryTestStatus");
  box.classList.toggle("running",state.batteryTest);

  if(state.batteryTest){
    label.textContent="RUNNING — "+state.testSeconds+"s";
    status.textContent="RECTIFIER FAILED • BATTERY DISCHARGING";
  }else{
    label.textContent="START TEST";
    status.textContent=state.testResult||"READY";
  }
}

function updateSyncPanel(prefix, syncOk){
  const vals = syncOk
    ? {uv:[400,400,400], bv:[400,400,400], uhz:50.0, bhz:50.0, phase:0.0}
    : {uv:[397,401,399], bv:[400,400,400], uhz:49.8, bhz:50.0, phase:12.0};

  $(prefix+"UpsV12").textContent=vals.uv[0]+" V";
  $(prefix+"UpsV23").textContent=vals.uv[1]+" V";
  $(prefix+"UpsV31").textContent=vals.uv[2]+" V";
  $(prefix+"BusV12").textContent=vals.bv[0]+" V";
  $(prefix+"BusV23").textContent=vals.bv[1]+" V";
  $(prefix+"BusV31").textContent=vals.bv[2]+" V";
  $(prefix+"UpsHz").textContent=vals.uhz.toFixed(1)+" Hz";
  $(prefix+"BusHz").textContent=vals.bhz.toFixed(1)+" Hz";
  $(prefix+"PhaseDelta").textContent=vals.phase.toFixed(1)+"°";

  $(prefix+"SyncLamp").classList.toggle("ok",syncOk);
  $(prefix+"SyncText").textContent=syncOk?"SYNC OK":"NOT IN SYNC";
}

function prepareBatteryBreakerUI(prefix,panelId){
  const toggle=$(prefix+"BatteryToggle");
  if(toggle){
    const name=toggle.querySelector("text");
    if(name) name.textContent="BATTERY BREAKER";
    const stateText=$(prefix+"BatteryToggleText");
    if(stateText) stateText.textContent="CLOSED";
  }

  const panel=$(panelId);
  const topbar=panel?.querySelector(".topbar");
  if(topbar && !$(prefix+"BatteryBackup")){
    const status=document.createElement("div");
    status.id=prefix+"BatteryBackup";
    status.className="pill ok";
    status.textContent="Battery Backup: AVAILABLE";
    topbar.appendChild(status);
  }
}

function renderBatteryBreaker(prefix,state){
  const toggle=$(prefix+"BatteryToggle");
  const stateText=$(prefix+"BatteryToggleText");
  if(toggle){
    toggle.classList.toggle("on",state.battery);
    toggle.classList.toggle("off",!state.battery);
  }
  if(stateText) stateText.textContent=state.battery?"CLOSED":"OPEN";

  const backupAvailable=state.battery && state.batteryPct>0;
  const backup=$(prefix+"BatteryBackup");
  if(backup){
    backup.textContent="Battery Backup: "+(backupAvailable?"AVAILABLE":"UNAVAILABLE");
    backup.className="pill "+(backupAvailable?"ok":"bad");
  }
}

function prepareFailureTestUI(prefix,panelId,controlsSelector){
  const original=$(prefix+"BatteryTest");
  const originalStatus=$(prefix+"BatteryTestStatus");
  if(original) original.style.display="none";
  if(originalStatus) originalStatus.style.display="none";

  const controls=$(panelId)?.querySelector(controlsSelector);
  if(!controls || $(prefix+"FailureTestButton")) return;

  const button=document.createElement("button");
  button.id=prefix+"FailureTestButton";
  button.textContent="Part Failure During Battery Mode";
  button.onclick=()=>{
    if(original){
      original.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));
    }
  };

  const reset=$(prefix+"Reset");
  if(reset && reset.parentElement===controls) controls.insertBefore(button,reset);
  else controls.appendChild(button);
}

function renderFailureTestButton(prefix,state){
  const button=$(prefix+"FailureTestButton");
  if(!button) return;
  button.textContent=state.batteryTest
    ? `Part Failure During Battery Mode — ${state.testSeconds}s`
    : "Part Failure During Battery Mode";
  button.disabled=state.batteryTest;
  button.style.borderColor=state.batteryTest?"var(--danger)":"";
}

function renderMaintenanceBypassLoadText(prefix,state){
  const loadStatus=$(prefix+"Load");
  if(loadStatus && state.mbb && !state.uob){
    loadStatus.textContent="LOAD IS SUPPLIED THROUGH MAINTENANCE BYPASS";
  }
}

function installBatteryBreakerStatusWrappers(){
  const baseSingle=updateSingle;
  updateSingle=function(){
    baseSingle();
    renderBatteryBreaker("s",s);
    renderFailureTestButton("s",s);
    renderMaintenanceBypassLoadText("s",s);
  };

  const baseCastell=updateCastell;
  updateCastell=function(){
    baseCastell();
    renderBatteryBreaker("c",c);
    renderFailureTestButton("c",c);
    renderMaintenanceBypassLoadText("c",c);
  };

  updateSingle();
  updateCastell();
}

async function injectPartial(id,path){
  const res=await fetch(path);
  if(!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  $(id).innerHTML=await res.text();
}
function loadScript(path){
  return new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=path;
    s.onload=resolve;
    s.onerror=()=>reject(new Error(`Failed to load ${path}`));
    document.body.appendChild(s);
  });
}
async function initTrainer(){
  await Promise.all([
    injectPartial("single","partials/single.html"),
    injectPartial("parallel","partials/parallel.html"),
    injectPartial("castell","partials/castell.html"),
    injectPartial("aux","partials/aux.html")
  ]);
  await Promise.all([
    injectPartial("auxSingleWrap","partials/aux-single.html"),
    injectPartial("auxDualWrap","partials/aux-dual.html")
  ]);

  prepareBatteryBreakerUI("s","single");
  prepareBatteryBreakerUI("c","castell");
  prepareFailureTestUI("s","single",".single-top-controls .controls");
  prepareFailureTestUI("c","castell",".castell-top-controls .controls");

  document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active"); $(btn.dataset.panel).classList.add("active");
  });
  await loadScript("js/single-ups.js");
  await loadScript("js/parallel-ups.js");
  await loadScript("js/castell.js");
  installBatteryBreakerStatusWrappers();
  await loadScript("js/auxiliaries.js");
}
initTrainer().catch(err=>{
  console.error(err);
  document.body.insertAdjacentHTML("afterbegin",`<div style="padding:12px;background:#3a0f12;color:#fee2e2;font-weight:700">Trainer failed to load: ${err.message}</div>`);
});
