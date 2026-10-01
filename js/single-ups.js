// Adams UPS Trainer v0.7
// Single UPS simulator logic.

/* SINGLE */
let s={input:true,static:false,battery:true,batteryPct:100,syncOk:false,rectifierFault:false,batteryTest:false,forcedBypass:false,bang:false,testSeconds:0,testResult:"",mbb:false,uob:true,uib:true};

function sCanMBB(){
  if(!s.mbb) return s.static || s.forcedBypass;
  return s.uob;
}
function sCanUOB(){
  if(s.uob) return s.mbb;
  const rectifierActive=s.input&&s.uib&&!s.rectifierFault;
  const batteryAvailable=s.battery&&s.batteryPct>0;
  const staticFeed=s.static&&s.input&&s.uib;
  const inverterFeed=!staticFeed&&(rectifierActive||batteryAvailable);
  const upsOutput=staticFeed||inverterFeed;
  const liveBus=s.mbb&&s.input;
  return upsOutput && (!liveBus || s.syncOk);
}
function sCanUIB(){ return s.mbb && !s.uob; }

function updateSingle(){
  breakerState($("sMBB"),s.mbb); breakerState($("sUOB"),s.uob); breakerState($("sUIB"),s.uib);
  $("sFaultBanner").classList.toggle("active",s.bang);
  lockBreaker($("sMBB"),!sCanMBB()); lockBreaker($("sUOB"),!sCanUOB()); lockBreaker($("sUIB"),!sCanUIB());
  lamp("sLampMBB",sCanMBB()); lamp("sLampUOB",sCanUOB()); lamp("sLampUIB",sCanUIB());
  staticVisual("sStaticToggle","sStaticToggleText",s.static);
  staticVisual("sBatteryToggle","sBatteryToggleText",s.battery);
  inputVisual("sInputToggle","sInputToggleText",s.input);
  batteryMeter("s",s.batteryPct);
  const sSyncAvailable = (s.static || s.forcedBypass) && s.input && s.uib;
  updateSyncPanel("s", sSyncAvailable && s.syncOk);
  batteryTestVisual("s",s);

  const rectifierActive = s.input && s.uib && !s.rectifierFault;
  const batteryAvailable = s.battery && s.batteryPct > 0;
  const staticFeed = s.static && s.input && s.uib;
  const forcedBypassFeed = s.forcedBypass && s.input && s.uib;
  const bypassInternalFeed = staticFeed || forcedBypassFeed;
  const inverterFeed = !bypassInternalFeed && (rectifierActive || batteryAvailable);
  const upsOutput = bypassInternalFeed || inverterFeed;
  const upsPath = upsOutput && s.uob;
  const bypassFeed = s.mbb && s.input;
  const dual = upsPath && bypassFeed;
  const load = upsPath || bypassFeed;
  const onBattery = inverterFeed && !rectifierActive && batteryAvailable;

  const sLoadDropped = !load && !s.bang;
  $("sLoadDropBanner").classList.toggle("active",sLoadDropped);

  wire("sW1",s.input?"live":null);
  wire("sW2",rectifierActive?"live":null);
  wire("sW3",upsOutput?"live":null);
  wire("sW4",upsPath?(dual?"warn":"live"):null);
  wire("sBW1",s.input?"live":null);
  wire("sBW2",bypassFeed?(dual?"warn":"live"):null);

  $("sRectifier").classList.toggle("component-live",rectifierActive);
  $("sInverter").classList.toggle("component-live",inverterFeed);
  $("sInverter").classList.toggle("component-bypass",bypassInternalFeed);
  $("sBattery").classList.toggle("component-live",s.battery);

  $("sRectState").textContent=s.rectifierFault?"FAULT / OFF":(rectifierActive?"ACTIVE":(s.uib?"NO INPUT":"INPUT ISOLATED"));
  $("sInvState").textContent=bypassInternalFeed?(s.forcedBypass?"FORCED BYPASS":"BYPASSED"):(inverterFeed?(onBattery?"ON BATTERY":"SUPPLYING"):"NOT SUPPLYING");
  if(!s.battery) $("sBatState").textContent="ISOLATED";
  else if(s.batteryPct<=0) $("sBatState").textContent="DEPLETED";
  else if(s.batteryTest) $("sBatState").textContent="DISCHARGING";
  else if(rectifierActive && s.batteryPct < 100) $("sBatState").textContent="CHARGING";
  else if(rectifierActive) $("sBatState").textContent="FLOAT";
  else if(onBattery) $("sBatState").textContent="DISCHARGING";
  else $("sBatState").textContent="CONNECTED";

  $("sDC1").classList.toggle("live",rectifierActive);
  $("sDC2").classList.toggle("live",inverterFeed);
  $("sBatWire").classList.toggle("battery",s.battery);
  $("sBatWire").classList.toggle("live",onBattery);

  if(s.forcedBypass && forcedBypassFeed) $("sUpsMode").textContent="UPS ON FORCED BYPASS";
  else if(staticFeed) $("sUpsMode").textContent="UPS ON STATIC BYPASS";
  else if(onBattery) $("sUpsMode").textContent="UPS ON BATTERY";
  else if(inverterFeed) $("sUpsMode").textContent="UPS ONLINE";
  else $("sUpsMode").textContent="UPS OUTPUT UNAVAILABLE";

  let sLoadMsg = "LOAD DROPPED";
  if(s.bang) sLoadMsg = "FAULT — CHECK INSTALLATION";
  else if(upsPath && bypassFeed) sLoadMsg = "SUPPORTED BY UPS + BYPASS";
  else if(upsPath && onBattery) sLoadMsg = "SUPPORTED BY UPS (ON BATTERY)";
  else if(upsPath && (s.forcedBypass || staticFeed)) sLoadMsg = s.forcedBypass ? "SUPPORTED BY FORCED BYPASS" : "SUPPORTED BY STATIC BYPASS";
  else if(upsPath) sLoadMsg = "SUPPORTED BY UPS";
  else if(bypassFeed) sLoadMsg = "SUPPORTED BY MAINTENANCE BYPASS";

  $("sLoad").textContent=sLoadMsg;
  $("sLoadText").textContent=load?"ON":"OFF";

  if(s.bang) pill("sState","BANG!! VOLTAGES WERE OUT OF SYNC — CHECK INSTALLATION FOR DAMAGE","bad");
  else if(s.batteryTest && load) pill("sState","BATTERY RUN-DOWN TEST — "+s.testSeconds+"s REMAINING","warn");
  else if(!load && s.testResult) pill("sState",s.testResult,"bad");
  else if(!load) pill("sState","LOAD NOT SUPPLIED","bad");
  else if(s.testResult && staticFeed) pill("sState",s.testResult,"warn");
  else if(!s.uob && bypassFeed && !s.syncOk) pill("sState","MAINTENANCE BYPASS — UOB CLOSE BLOCKED: NOT IN SYNC","warn");
  else if(onBattery && !bypassFeed) pill("sState","BATTERY → INVERTER SUPPLYING LOAD","warn");
  else if(s.static&&!s.mbb&&staticFeed) pill("sState","STATIC BYPASS ACTIVE — MBB AVAILABLE","warn");
  else if(dual) pill("sState","DUAL FED — UPS PATH + MAINTENANCE BYPASS","warn");
  else if(s.mbb&&!s.uob&&s.uib) pill("sState","MAINTENANCE BYPASS SUPPLYING LOAD — UOB OPEN","ok");
  else if(s.mbb&&!s.uob&&!s.uib) pill("sState","MAINTENANCE BYPASS — UPS INPUT & OUTPUT ISOLATED","ok");
  else pill("sState","UPS SUPPLYING LOAD","ok");

  $("sState").classList.toggle("fault-status-hidden", s.bang || (!load && !s.bang));

  $("sSteps").innerHTML="<strong>Sequence:</strong> "+
    `<span class="${s.static?'stepdone':'stepnext'}">Static bypass</span> → `+
    `<span class="${s.mbb?'stepdone':(s.static?'stepnext':'')}">Close MBB</span> → `+
    `<span class="${!s.uob?'stepdone':(s.mbb?'stepnext':'')}">Open UOB</span> → `+
    `<span class="${!s.uib?'stepdone':(!s.uob?'stepnext':'')}">Open UIB</span>`;
}

$("sInputToggle").onclick=()=>{ if(!s.batteryTest){s.input=!s.input; s.forcedBypass=false; updateSingle();} };
$("sDesync").onclick=()=>{ if(s.static || s.forcedBypass){ s.syncOk=false; s.bang=false; updateSingle(); } };
$("sSync").onclick=()=>{ if(s.static || s.forcedBypass){ s.syncOk=true; s.bang=false; updateSingle(); } };
$("sStaticToggle").onclick=()=>{
  if(!s.batteryTest){
    s.static=!s.static;
    s.forcedBypass=false;
    s.bang=false;
    s.syncOk=s.static;
    updateSingle();
  }
};
$("sBatteryToggle").onclick=()=>{ if(!s.batteryTest){s.battery=!s.battery; s.bang=false; updateSingle();} };

$("sBatteryTest").onclick=()=>{
  if(s.batteryTest) return;
  s.input=true;
  s.static=false;
  s.battery=true;
  s.batteryPct=100;
  s.rectifierFault=true;
  s.forcedBypass=false;
  s.bang=false;
  s.syncOk=false;
  s.batteryTest=true;
  s.testSeconds=5;
  s.testResult="";
  s.mbb=false;
  s.uob=true;
  s.uib=true;
  updateSingle();
};
$("sMBB").onclick=()=>{
  if(sCanMBB()){
    s.bang=false;
    s.mbb=!s.mbb;
    updateSingle();
  }else if(!s.mbb && !s.static && !s.forcedBypass){
    s.bang=true;
    updateSingle();
  }
};
$("sUOB").onclick=()=>{ if(sCanUOB()){s.uob=!s.uob;updateSingle();} };
$("sUIB").onclick=()=>{ if(sCanUIB()){s.uib=!s.uib;updateSingle();} };
$("sReset").onclick=()=>{s={input:true,static:false,battery:true,batteryPct:100,syncOk:false,rectifierFault:false,batteryTest:false,forcedBypass:false,bang:false,testSeconds:0,testResult:"",mbb:false,uob:true,uib:true};updateSingle();};
