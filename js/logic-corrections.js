// Adams UPS Trainer v0.7
// Behaviour corrections for battery backup, UIB/static bypass and UOB operation.

(function installLogicCorrections(){
  function ready(){
    return window.__staticBypassTrainingInstalled &&
      typeof updateSingle === "function" &&
      typeof updateCastell === "function" &&
      document.getElementById("sUOB") &&
      document.getElementById("sUIB") &&
      document.getElementById("cUOB") &&
      document.getElementById("cUIB");
  }

  if(!ready()){
    setTimeout(installLogicCorrections,50);
    return;
  }
  if(window.__logicCorrectionsInstalled) return;
  window.__logicCorrectionsInstalled=true;

  function renderBatteryBackupPath(prefix,state){
    const backup=$(prefix+"BatteryBackup");
    if(!backup) return;

    // Battery backup is only available to the load while the battery is usable
    // AND the UPS output breaker provides a path to the load.
    const available=state.battery && state.batteryPct>0 && state.uob;
    backup.textContent="Battery Backup: "+(available?"AVAILABLE":"UNAVAILABLE");
    backup.className="pill "+(available?"ok":"bad");
  }

  function renderMechanicalUOB(prefix,state){
    const uob=$(prefix+"UOB");
    if(!uob) return;

    // With MBB open there is no maintenance-bypass source on the load bus in
    // this model, so UOB can still be mechanically operated even if the UPS
    // has no output (for example UIB open or battery breaker open).
    // Lamp colour remains independent and continues to indicate safe/available steps.
    if(!state.mbb && !state.batteryTest){
      lockBreaker(uob,false);
    }
  }

  function suspendStaticBypassForOpenUIB(state){
    if(state.uib || !state.static) return;
    state._staticSelectedBeforeUIB=true;
    state.static=false;
    state.syncOk=false;
  }

  function restoreStaticSelectionOnUIBClose(state){
    if(!state.uib || !state._staticSelectedBeforeUIB) return;
    state.static=true;
    state.syncOk=true;
    state._staticSelectedBeforeUIB=false;
  }

  const previousUpdateSingle=updateSingle;
  updateSingle=function(){
    suspendStaticBypassForOpenUIB(s);
    restoreStaticSelectionOnUIBClose(s);
    previousUpdateSingle();
    renderBatteryBackupPath("s",s);
    renderMechanicalUOB("s",s);
  };

  const previousUpdateCastell=updateCastell;
  updateCastell=function(){
    suspendStaticBypassForOpenUIB(c);
    restoreStaticSelectionOnUIBClose(c);
    previousUpdateCastell();
    renderBatteryBackupPath("c",c);
    renderMechanicalUOB("c",c);
  };

  function installUIBHandler(prefix,state,update,isCastell=false){
    const uib=$(prefix+"UIB");
    const previous=uib?.onclick;
    if(!uib) return;

    uib.onclick=()=>{
      const castellFree=!isCastell || (!state.returning || state.keyAt2);

      // If Static Bypass is selected, opening UIB removes its source. Remember
      // the selection for restoration, but immediately leave Static Bypass and
      // let the battery/inverter support the UPS output if available.
      if(state.uib && state.static && !state.batteryTest && castellFree){
        state._staticSelectedBeforeUIB=true;
        state.uib=false;
        state.static=false;
        state.syncOk=false;
        state.bang=false;
        update();
        return;
      }

      // Reclosing UIB after the above restores the previously selected bypass
      // state so the normal return sequence can continue.
      if(!state.uib && state._staticSelectedBeforeUIB && !state.batteryTest && castellFree){
        state.uib=true;
        state.static=true;
        state.syncOk=true;
        state._staticSelectedBeforeUIB=false;
        state.bang=false;
        update();
        return;
      }

      previous?.();
    };
  }

  function installUOBHandler(prefix,state,update){
    const uob=$(prefix+"UOB");
    const previous=uob?.onclick;
    if(!uob) return;

    uob.onclick=()=>{
      // When MBB is open, allow UOB to be toggled regardless of UIB or battery
      // breaker state. If there is no source this simply changes breaker position;
      // if it was the only live load path, the existing load-drop logic shows it.
      if(!state.mbb && !state.batteryTest){
        state.bang=false;
        state.uob=!state.uob;
        update();
        return;
      }

      previous?.();
    };
  }

  installUIBHandler("s",s,updateSingle,false);
  installUIBHandler("c",c,updateCastell,true);
  installUOBHandler("s",s,updateSingle);
  installUOBHandler("c",c,updateCastell);

  updateSingle();
  updateCastell();
})();
