// Adams UPS Trainer v0.7
// Training-only unsafe breaker operations.
// Breakers may remain physically clickable so the consequence of an incorrect
// operation can be demonstrated. Availability lamps are not forced green here.

(function installStaticBypassTraining(){
  function ready(){
    return typeof updateSingle === "function" &&
      typeof updateCastell === "function" &&
      document.getElementById("sUOB") &&
      document.getElementById("sUIB") &&
      document.getElementById("cUOB") &&
      document.getElementById("cUIB");
  }

  if(!ready()){
    setTimeout(installStaticBypassTraining,50);
    return;
  }
  if(window.__staticBypassTrainingInstalled) return;
  window.__staticBypassTrainingInstalled=true;

  function enhanceLoadDropBanner(id){
    const banner=$(id);
    if(!banner) return;
    banner.innerHTML=
      '<span class="drop-title" style="font-size:24px">✖ LOAD DROPPED ✖</span>'+
      '<span class="drop-sub">Unfortunately the load has been dropped due to incorrect switching.</span>';
  }

  enhanceLoadDropBanner("sLoadDropBanner");
  enhanceLoadDropBanner("cLoadDropBanner");

  function trainingControls(prefix,state,isCastell=false){
    const castellClear = !isCastell || (!state.returning && !state.keyReleased && !state.keyAt2);

    // While Static Bypass is selected, UOB and UIB remain physically operable
    // so incorrect switching can be demonstrated.
    const staticBypassControls = state.static && !state.mbb && !state.batteryTest && state.input && castellClear;
    if(staticBypassControls){
      lockBreaker($(prefix+"UOB"),false);
      lockBreaker($(prefix+"UIB"),false);
    }

    // If UIB has been opened and the UPS is running on battery, keep UOB
    // physically operable. Opening UOB then removes the remaining load path and
    // the existing LOAD DROPPED banner is shown.
    const onBatteryWithUIBOpen = !state.uib && state.uob && !state.mbb &&
      !state.batteryTest && state.input && state.battery && state.batteryPct>0 && castellClear;
    if(onBatteryWithUIBOpen){
      lockBreaker($(prefix+"UOB"),false);
    }
  }

  const previousUpdateSingle=updateSingle;
  updateSingle=function(){
    previousUpdateSingle();
    trainingControls("s",s,false);
  };

  const previousUpdateCastell=updateCastell;
  updateCastell=function(){
    previousUpdateCastell();
    trainingControls("c",c,true);
  };

  const sUOB=$("sUOB");
  const previousSUOB=sUOB.onclick;
  sUOB.onclick=()=>{
    const staticBypassOperation=s.static && !s.mbb && !s.batteryTest && s.input;
    const batteryOperation=!s.uib && s.uob && !s.mbb && !s.batteryTest &&
      s.input && s.battery && s.batteryPct>0;
    if(staticBypassOperation || batteryOperation){
      s.bang=false;
      s.uob=!s.uob;
      updateSingle();
      return;
    }
    previousSUOB?.();
  };

  const sUIB=$("sUIB");
  const previousSUIB=sUIB.onclick;
  sUIB.onclick=()=>{
    const staticBypassOperation=s.static && !s.mbb && !s.batteryTest && s.input;
    if(staticBypassOperation){
      s.bang=false;
      s.uib=!s.uib;
      updateSingle();
      return;
    }
    previousSUIB?.();
  };

  const cUOB=$("cUOB");
  const previousCUOB=cUOB.onclick;
  cUOB.onclick=()=>{
    const castellClear=!c.returning && !c.keyReleased && !c.keyAt2;
    const staticBypassOperation=c.static && !c.mbb && !c.batteryTest && c.input && castellClear;
    const batteryOperation=!c.uib && c.uob && !c.mbb && !c.batteryTest &&
      c.input && c.battery && c.batteryPct>0 && castellClear;
    if(staticBypassOperation || batteryOperation){
      c.bang=false;
      c.uob=!c.uob;
      updateCastell();
      return;
    }
    previousCUOB?.();
  };

  const cUIB=$("cUIB");
  const previousCUIB=cUIB.onclick;
  cUIB.onclick=()=>{
    const staticBypassOperation=c.static && !c.mbb && !c.batteryTest && c.input &&
      !c.returning && !c.keyReleased && !c.keyAt2;
    if(staticBypassOperation){
      c.bang=false;
      c.uib=!c.uib;
      updateCastell();
      return;
    }
    previousCUIB?.();
  };

  updateSingle();
  updateCastell();
})();
