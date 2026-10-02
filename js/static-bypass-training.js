// Adams UPS Trainer v0.7
// Training-only unsafe operations while Static Bypass is selected.
// The breakers remain physically clickable so the consequence of an incorrect
// operation can be demonstrated. Availability lamps are not forced green here.

(function installStaticBypassTraining(){
  function ready(){
    return typeof updateSingle === "function" &&
      typeof updateCastell === "function" &&
      typeof clearAuxHighlight === "function" &&
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

  function staticBypassControls(prefix,state,isCastell=false){
    const permitted = state.static && !state.mbb && !state.batteryTest && state.input &&
      (!isCastell || (!state.returning && !state.keyReleased && !state.keyAt2));
    if(!permitted) return;

    // These are intentionally clickable for the training exercise, but their
    // lamps remain controlled by the normal safe-sequence logic.
    lockBreaker($(prefix+"UOB"),false);
    lockBreaker($(prefix+"UIB"),false);
  }

  const previousUpdateSingle=updateSingle;
  updateSingle=function(){
    previousUpdateSingle();
    staticBypassControls("s",s,false);
  };

  const previousUpdateCastell=updateCastell;
  updateCastell=function(){
    previousUpdateCastell();
    staticBypassControls("c",c,true);
  };

  const sUOB=$("sUOB");
  const previousSUOB=sUOB.onclick;
  sUOB.onclick=()=>{
    const staticBypassOperation=s.static && !s.mbb && !s.batteryTest && s.input;
    if(staticBypassOperation){
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
    const staticBypassOperation=c.static && !c.mbb && !c.batteryTest && c.input &&
      !c.returning && !c.keyReleased && !c.keyAt2;
    if(staticBypassOperation){
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
