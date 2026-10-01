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

document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active"); $(btn.dataset.panel).classList.add("active");
});
