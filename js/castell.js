// Adams UPS Trainer v0.7
// Castell-key simulator logic and shared battery-test timer.

/* CASTELL */
let c={input:true,static:false,battery:true,batteryPct:100,syncOk:false,rectifierFault:false,batteryTest:false,forcedBypass:false,returning:false,bang:false,testSeconds:0,testResult:"",keyReleased:false,keyAt2:false,mbb:false,uob:true,uib:true};

function cCanUOB(){
  if(c.uob) return c.mbb;

  const rectifierActive=c.input&&c.uib&&!c.rectifierFault;
  const batteryAvailable=c.battery&&c.batteryPct>0;
  const staticFeed=c.static&&c.input&&c.uib;
  const inverterFeed=!staticFeed&&(rectifierActive||batteryAvailable);
  const upsOutput=staticFeed||inverterFeed;
  const liveBus=c.mbb&&c.input;

  return upsOutput && (!liveBus || c.syncOk);
}
function cCanMBB(){
  if(!c.mbb) return c.keyAt2;
  return c.uob;
}
function cCanUIB(){ return c.mbb&&!c.uob; }

function updateCastell(){
  breakerState($("cMBB"),c.mbb); breakerState($("cUOB"),c.uob); breakerState($("cUIB"),c.uib);
  $("cFaultBanner").classList.toggle("active",c.bang);
  lockBreaker($("cMBB"),!cCanMBB()); lockBreaker($("cUOB"),!cCanUOB()); lockBreaker($("cUIB"),!cCanUIB());
  lamp("cLampMBB",cCanMBB()); lamp("cLampUOB",cCanUOB()); lamp("cLampUIB",cCanUIB());
  staticVisual("cStaticToggle","cStaticToggleText",c.static);
  staticVisual("cBatteryToggle","cBatteryToggleText",c.battery);
  inputVisual("cInputToggle","cInputToggleText",c.input);
  batteryMeter("c",c.batteryPct);
  const cSyncAvailable = (c.static || c.forcedBypass) && c.input && c.uib;
  updateSyncPanel("c", cSyncAvailable && c.syncOk);
  batteryTestVisual("c",c);

  const rectifierActive = c.input && c.uib && !c.rectifierFault;
  const batteryAvailable = c.battery && c.batteryPct > 0;
  const staticFeed = c.static && c.input && c.uib;
  const forcedBypassFeed = c.forcedBypass && c.input && c.uib;
  const bypassInternalFeed = staticFeed || forcedBypassFeed;
  const inverterFeed = !bypassInternalFeed && (rectifierActive || batteryAvailable);
  const upsOutput = bypassInternalFeed || inverterFeed;
  const upsPath = upsOutput && c.uob;
  const bypassFeed = c.mbb && c.input;
  const dual = upsPath && bypassFeed;
  const load = upsPath || bypassFeed;
  const onBattery = inverterFeed && !rectifierActive && batteryAvailable;

  const cLoadDropped = !load && !c.bang;
  $("cLoadDropBanner").classList.toggle("active",cLoadDropped);

  wire("cW1",c.input?"live":null);
  wire("cW2",rectifierActive?"live":null);
  wire("cW3",upsOutput?"live":null);
  wire("cW4",upsPath?(dual?"warn":"live"):null);
  wire("cBW1",c.input?"live":null);
  wire("cBW2",bypassFeed?(dual?"warn":"live"):null);

  $("cRectifier").classList.toggle("component-live",rectifierActive);
  $("cInverter").classList.toggle("component-live",inverterFeed);
  $("cInverter").classList.toggle("component-bypass",bypassInternalFeed);
  $("cBattery").classList.toggle("component-live",c.battery);

  $("cRectState").textContent=c.rectifierFault?"FAULT / OFF":(rectifierActive?"ACTIVE":(c.uib?"NO INPUT":"INPUT ISOLATED"));
  $("cInvState").textContent=bypassInternalFeed?(c.forcedBypass?"FORCED BYPASS":"BYPASSED"):(inverterFeed?(onBattery?"ON BATTERY":"SUPPLYING"):"NOT SUPPLYING");
  if(!c.battery) $("cBatState").textContent="ISOLATED";
  else if(c.batteryPct<=0) $("cBatState").textContent="DEPLETED";
  else if(c.batteryTest) $("cBatState").textContent="DISCHARGING";
  else if(rectifierActive && c.batteryPct < 100) $("cBatState").textContent="CHARGING";
  else if(rectifierActive) $("cBatState").textContent="FLOAT";
  else if(onBattery) $("cBatState").textContent="DISCHARGING";
  else $("cBatState").textContent="CONNECTED";

  $("cDC1").classList.toggle("live",rectifierActive);
  $("cDC2").classList.toggle("live",inverterFeed);
  $("cBatWire").classList.toggle("battery",c.battery);
  $("cBatWire").classList.toggle("live",onBattery);

  $("cUpsMode").textContent=c.forcedBypass&&forcedBypassFeed?"UPS ON FORCED BYPASS":
    (c.static&&!c.keyReleased&&staticFeed?"UPS ON STATIC BYPASS":
    (c.keyReleased&&!c.keyAt2?"LOCKED BYPASS":
    (c.mbb?"MAINTENANCE BYPASS":
    (onBattery?"UPS ON BATTERY":(inverterFeed?"UPS ONLINE":"UPS OUTPUT UNAVAILABLE")))));
  $("cSolText").textContent="SOLENOID: "+(c.static&&!c.keyReleased&&staticFeed?"ENERGISED":"DE-ENERGISED");
  let cLoadMsg = "LOAD DROPPED";
  if(c.bang) cLoadMsg = "FAULT — CHECK INSTALLATION";
  else if(upsPath && bypassFeed) cLoadMsg = "SUPPORTED BY UPS + BYPASS";
  else if(upsPath && onBattery) cLoadMsg = "SUPPORTED BY UPS (ON BATTERY)";
  else if(upsPath && (c.forcedBypass || staticFeed)) cLoadMsg = c.forcedBypass ? "SUPPORTED BY FORCED BYPASS" : "SUPPORTED BY STATIC BYPASS";
  else if(upsPath) cLoadMsg = "SUPPORTED BY UPS";
  else if(bypassFeed) cLoadMsg = "SUPPORTED BY MAINTENANCE BYPASS";

  $("cLoad").textContent=cLoadMsg;
  $("cLoadText").textContent=load?"ON":"OFF";

  const cPos1El = $("cPos1"), cPos2El = $("cPos2");
  if(cPos1El && cPos2El){
    if(c.returning){
      if(c.keyAt2){
        cPos1El.textContent="EMPTY — WAITING FOR RETURNED KEY";
        cPos2El.textContent=c.mbb
          ? "KEY LOCKED — OPEN MBB BEFORE REMOVAL"
          : "MBB OPEN — KEY CAN BE REMOVED";
      }else if(c.keyReleased){
        cPos1El.textContent="READY FOR RETURNED KEY";
        cPos2El.textContent="KEY REMOVED — RETURN TO POSITION 1";
      }else{
        cPos1El.textContent="KEY RETURNED / TURNED";
        cPos2El.textContent="EMPTY / LOCKED";
      }
    }else{
      cPos1El.textContent=!c.static?"KEY TRAPPED — SOLENOID OFF":
        (!c.keyReleased?(staticFeed?"KEY RELEASE ENABLED — SOLENOID ON":"STATIC SELECTED — NO BYPASS INPUT"):
        "KEY REMOVED — UPS LOCKED IN BYPASS");
      cPos2El.textContent=!c.keyReleased?"EMPTY / LOCKED":
        (!c.keyAt2?"READY FOR KEY":"KEY LOCKED IN POSITION 2 — MBB RELEASED");
    }
  }

  lamp("cLampReleased", (staticFeed || forcedBypassFeed) && !c.keyAt2);
  lamp("cLampLocked", c.keyAt2);

  if(c.returning){
    if(c.keyAt2){
      $("cTurnRemove").textContent="Insert & Turn Key at Position 1";
      $("cTurnRemove").disabled=true;
      $("cInsertTurn").textContent="Remove Key from Position 2";
      $("cInsertTurn").disabled=c.mbb;
    }else if(c.keyReleased){
      $("cTurnRemove").textContent="Insert & Turn Key at Position 1";
      $("cTurnRemove").disabled=false;
      $("cInsertTurn").textContent="Remove Key from Position 2";
      $("cInsertTurn").disabled=true;
    }else{
      $("cTurnRemove").textContent="Turn & Remove Key at Position 1";
      $("cTurnRemove").disabled=true;
      $("cInsertTurn").textContent="Insert & Turn Key at Position 2";
      $("cInsertTurn").disabled=true;
    }
  }else{
    $("cTurnRemove").textContent="Turn & Remove Key at Position 1";
    $("cInsertTurn").textContent="Insert & Turn Key at Position 2";
    $("cTurnRemove").disabled=!c.static||!staticFeed||c.keyReleased;
    $("cInsertTurn").disabled=!c.keyReleased||c.keyAt2;
  }

  if(c.bang) pill("cState","BANG!! VOLTAGES WERE OUT OF SYNC — CHECK INSTALLATION FOR DAMAGE","bad");
  else if(c.batteryTest && load) pill("cState","BATTERY RUN-DOWN TEST — "+c.testSeconds+"s REMAINING","warn");
  else if(!load && c.testResult) pill("cState",c.testResult,"bad");
  else if(!load) pill("cState","LOAD NOT SUPPLIED","bad");
  else if(c.returning && c.forcedBypass && c.keyReleased && !c.keyAt2)
    pill("cState","FORCED BYPASS — RETURN KEY TO POSITION 1 AND TURN","warn");
  else if(c.returning && c.forcedBypass && c.keyAt2 && !c.mbb)
    pill("cState","FORCED BYPASS — MBB OPEN, REMOVE KEY FROM POSITION 2","warn");
  else if(c.returning && c.forcedBypass)
    pill("cState","FORCED BYPASS — RETURN SEQUENCE IN PROGRESS","warn");
  else if(c.testResult && (staticFeed||forcedBypassFeed)) pill("cState",c.testResult,"warn");
  else if(!c.uob && bypassFeed && !c.syncOk) pill("cState","MAINTENANCE BYPASS — UOB CLOSE BLOCKED: NOT IN SYNC","warn");
  else if(onBattery && !bypassFeed) pill("cState","BATTERY → INVERTER SUPPLYING LOAD","warn");
  else if(c.static&&!c.keyReleased&&staticFeed)pill("cState","STATIC BYPASS ACTIVE — CASTELL SOLENOID ENERGISED","warn");
  else if(c.keyReleased&&!c.keyAt2)pill("cState","KEY REMOVED — UPS LOCKED IN BYPASS","warn");
  else if(c.keyAt2&&!c.mbb)pill("cState","KEY LOCKED IN POSITION 2 — CLOSE MBB","warn");
  else if(c.mbb&&c.uob)pill("cState","MBB CLOSED — LOAD DUAL FED","warn");
  else if(c.mbb&&!c.uob&&c.uib)pill("cState","MAINTENANCE BYPASS SUPPLYING LOAD — UOB OPEN","ok");
  else if(c.mbb&&!c.uob&&!c.uib)pill("cState","MAINTENANCE BYPASS — UPS INPUT & OUTPUT ISOLATED","ok");
  else pill("cState","UPS SUPPLYING LOAD","ok");

  $("cState").classList.toggle("fault-status-hidden", c.bang || (!load && !c.bang));

  if(c.returning || (!c.uib && !c.uob && c.mbb && c.keyAt2)){
    $("cSteps").innerHTML="<strong>Castell return sequence:</strong> "+
      `<span class="${c.uib?'stepdone':'stepnext'}">Close UIB</span> → `+
      `<span class="${c.uob?'stepdone':(c.uib?'stepnext':'')}">Close UOB (sync required)</span> → `+
      `<span class="${!c.mbb?'stepdone':(c.uob?'stepnext':'')}">Open MBB</span> → `+
      `<span class="${!c.keyAt2&&c.keyReleased?'stepdone':(!c.mbb?'stepnext':'')}">Remove key from Position 2</span> → `+
      `<span class="${!c.keyReleased&&!c.keyAt2?'stepdone':(c.keyReleased&&!c.keyAt2?'stepnext':'')}">Return & turn key at Position 1</span> → `+
      `<span class="${!c.returning&&!c.forcedBypass?'stepdone':''}">Normal operation</span>`;
  }else{
    $("cSteps").innerHTML="<strong>Castell sequence:</strong> "+
      `<span class="${c.static?'stepdone':'stepnext'}">Static bypass / energise solenoid</span> → `+
      `<span class="${c.keyReleased?'stepdone':(c.static?'stepnext':'')}">Turn & remove key</span> → `+
      `<span class="${c.keyAt2?'stepdone':(c.keyReleased?'stepnext':'')}">Insert & lock key at Position 2</span> → `+
      `<span class="${c.mbb?'stepdone':(c.keyAt2?'stepnext':'')}">Close MBB</span> → `+
      `<span class="${!c.uob?'stepdone':(c.mbb?'stepnext':'')}">Open UOB</span> → `+
      `<span class="${!c.uib?'stepdone':(!c.uob?'stepnext':'')}">Open UIB</span>`;
  }
}

$("cInputToggle").onclick=()=>{ if(!c.batteryTest){c.input=!c.input; c.bang=false; updateCastell();} };
$("cDesync").onclick=()=>{ if(c.static || c.forcedBypass){ c.syncOk=false; c.bang=false; updateCastell(); } };
$("cSync").onclick=()=>{ if(c.static || c.forcedBypass){ c.syncOk=true; c.bang=false; updateCastell(); } };
$("cStaticToggle").onclick=()=>{
  if(!c.keyReleased&&!c.keyAt2&&!c.batteryTest&&!c.returning){
    c.static=!c.static;
    c.bang=false;
    c.syncOk=c.static;
    updateCastell();
  }
};
$("cBatteryToggle").onclick=()=>{ if(!c.batteryTest){c.battery=!c.battery; c.bang=false; updateCastell();} };

$("cBatteryTest").onclick=()=>{
  if(c.batteryTest) return;
  c.input=true;
  c.static=false;
  c.battery=true;
  c.batteryPct=100;
  c.rectifierFault=true;
  c.forcedBypass=false;
  c.returning=false;
  c.bang=false;
  c.syncOk=false;
  c.batteryTest=true;
  c.testSeconds=5;
  c.testResult="";
  c.keyReleased=false;
  c.keyAt2=false;
  c.mbb=false;
  c.uob=true;
  c.uib=true;
  updateCastell();
};
$("cTurnRemove").onclick=()=>{
  if(c.returning && c.keyReleased && !c.keyAt2){
    c.keyReleased=false;
    c.keyAt2=false;
    c.returning=false;
    c.forcedBypass=false;
    c.static=false;
    c.bang=false;
    c.testResult="";
    updateCastell();
    return;
  }

  if(c.static && !c.keyReleased && !c.keyAt2){
    c.keyReleased=true;
    c.bang=false;
    updateCastell();
  }
};

$("cInsertTurn").onclick=()=>{
  if(c.returning && c.keyAt2 && !c.mbb){
    c.keyAt2=false;
    c.keyReleased=true;
    c.bang=false;
    updateCastell();
    return;
  }

  if(c.keyReleased && !c.keyAt2 && !c.returning){
    c.keyAt2=true;
    c.bang=false;
    updateCastell();
  }
};

$("cMBB").onclick=()=>{
  if(!cCanMBB()){
    if(!c.mbb && !c.static && !c.forcedBypass){
      c.bang=true;
      updateCastell();
    }
    return;
  }

  c.bang=false;
  const wasClosed=c.mbb;
  c.mbb=!c.mbb;

  if(wasClosed && !c.mbb && c.keyAt2){
    c.returning=true;
    c.static=false;
    c.forcedBypass=true;
    c.testResult="";
  }

  updateCastell();
};
$("cUOB").onclick=()=>{if(cCanUOB()){c.uob=!c.uob;updateCastell();}};
$("cUIB").onclick=()=>{if(cCanUIB()){c.uib=!c.uib;updateCastell();}};
$("cReset").onclick=()=>{c={input:true,static:false,battery:true,batteryPct:100,syncOk:false,rectifierFault:false,batteryTest:false,forcedBypass:false,returning:false,bang:false,testSeconds:0,testResult:"",keyReleased:false,keyAt2:false,mbb:false,uob:true,uib:true};updateCastell();};

updateSingle();updateParallel();updateCastell();

function tickBatteryModel(){
  let changed=false;

  const sRect=s.input&&s.uib&&!s.rectifierFault;
  const sBattSupply=s.battery && s.batteryPct>0 && !sRect && !s.static;
  if(s.battery && !s.batteryTest){
    if(sBattSupply && s.uob && s.batteryPct>0){ s.batteryPct=Math.max(0,s.batteryPct-1); changed=true; }
    else if(sRect && s.batteryPct<100){ s.batteryPct=Math.min(100,s.batteryPct+1); changed=true; }
  }

  const cRect=c.input&&c.uib&&!c.rectifierFault;
  const cBattSupply=c.battery && c.batteryPct>0 && !cRect && !c.static;
  if(c.battery && !c.batteryTest){
    if(cBattSupply && c.uob && c.batteryPct>0){ c.batteryPct=Math.max(0,c.batteryPct-1); changed=true; }
    else if(cRect && c.batteryPct<100){ c.batteryPct=Math.min(100,c.batteryPct+1); changed=true; }
  }

  if(changed){ updateSingle(); updateCastell(); }
}
setInterval(tickBatteryModel,1500);

function tickFiveSecondBatteryTests(){
  if(s.batteryTest){
    s.testSeconds=Math.max(0,s.testSeconds-1);
    s.batteryPct=Math.max(0,s.batteryPct-20);

    if(s.testSeconds<=0 || s.batteryPct<=0){
      s.batteryPct=0;
      s.batteryTest=false;
      s.static=false;
      if(s.input && s.uib && s.syncOk){
        s.forcedBypass=true;
        s.testResult="BATTERY DEPLETED — FORCED BYPASS ACTIVE";
      }else if(!s.input){
        s.forcedBypass=false;
        s.testResult="LOAD DROPPED!! — BYPASS FAILED: NO MAINS AVAILABLE";
      }else if(!s.syncOk){
        s.forcedBypass=false;
        s.testResult="LOAD DROPPED!! — BYPASS FAILED: NOT IN SYNC";
      }else{
        s.forcedBypass=false;
        s.testResult="LOAD DROPPED!! — BYPASS FAILED";
      }
    }
    updateSingle();
  }

  if(c.batteryTest){
    c.testSeconds=Math.max(0,c.testSeconds-1);
    c.batteryPct=Math.max(0,c.batteryPct-20);

    if(c.testSeconds<=0 || c.batteryPct<=0){
      c.batteryPct=0;
      c.batteryTest=false;

      c.static=false;
      if(c.input && c.uib && c.syncOk){
        c.forcedBypass=true;
        c.testResult="BATTERY DEPLETED — FORCED BYPASS ACTIVE";
      }else if(!c.input){
        c.forcedBypass=false;
        c.testResult="LOAD DROPPED!! — BYPASS FAILED: NO MAINS AVAILABLE";
      }else if(!c.syncOk){
        c.forcedBypass=false;
        c.testResult="LOAD DROPPED!! — BYPASS FAILED: NOT IN SYNC";
      }else{
        c.forcedBypass=false;
        c.testResult="LOAD DROPPED!! — BYPASS FAILED";
      }
    }
    updateCastell();
  }
}
setInterval(tickFiveSecondBatteryTests,1000);
