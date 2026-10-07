// Adams UPS Trainer v0.7
// Parallel UPS simulator logic.

const pids=["pUIB1","pSSIB1","pBB1","pUOB1","pUIB2","pSSIB2","pBB2","pUOB2","pSIB","pMBB"];
let p={
  pUIB1:true,pSSIB1:true,pBB1:true,pUOB1:true,
  pUIB2:true,pSSIB2:true,pBB2:true,pUOB2:true,
  pSIB:true,pMBB:false,
  pStatic:false,
  bang:false
};

function pStepClass(done,next){
  return done?"stepdone":(next?"stepnext":"");
}

function setParallelLamp(id,available){
  lamp("pLamp"+id,available);
}

function updateParallelLamps(){
  const oneUobOpen=!p.pUOB1||!p.pUOB2;
  const bothUobsOpen=!p.pUOB1&&!p.pUOB2;

  const canCloseMBB=p.pStatic&&!p.pMBB&&p.pSIB;
  const canOpenSIB=p.pStatic&&p.pMBB&&p.pSIB;
  const canOpenUOBs=p.pStatic&&p.pMBB&&!p.pSIB;
  const canIsolateInputs=p.pMBB&&!p.pSIB&&bothUobsOpen;

  setParallelLamp("MBB",canCloseMBB);
  setParallelLamp("SIB",canOpenSIB);

  setParallelLamp("UOB1",canOpenUOBs&&p.pUOB1);
  setParallelLamp("UOB2",canOpenUOBs&&p.pUOB2);

  setParallelLamp("UIB1",canIsolateInputs&&p.pUIB1);
  setParallelLamp("SSIB1",canIsolateInputs&&p.pSSIB1);
  setParallelLamp("BB1",canIsolateInputs&&p.pBB1);

  setParallelLamp("UIB2",canIsolateInputs&&p.pUIB2);
  setParallelLamp("SSIB2",canIsolateInputs&&p.pSSIB2);
  setParallelLamp("BB2",canIsolateInputs&&p.pBB2);

  // Once one UOB has been opened, only the remaining closed UOB is the next
  // correct output breaker operation.
  if(canOpenUOBs&&oneUobOpen&&!bothUobsOpen){
    if(!p.pUOB1) setParallelLamp("UOB1",false);
    if(!p.pUOB2) setParallelLamp("UOB2",false);
  }
}

function updateParallelSteps(){
  const oneUobOpen=!p.pUOB1||!p.pUOB2;
  const bothUobsOpen=!p.pUOB1&&!p.pUOB2;
  const isolatedInputs=!p.pUIB1&&!p.pUIB2&&!p.pSSIB1&&!p.pSSIB2&&!p.pBB1&&!p.pBB2;

  $("pSteps").innerHTML="<strong>Parallel maintenance bypass sequence:</strong> "+
    `<span class="${pStepClass(p.pStatic,!p.pStatic)}">Go to Static Bypass</span> → `+
    `<span class="${pStepClass(p.pMBB,p.pStatic&&!p.pMBB)}">Close MBB</span> → `+
    `<span class="${pStepClass(!p.pSIB,p.pMBB&&p.pSIB)}">Open SIB</span> → `+
    `<span class="${pStepClass(oneUobOpen,!p.pSIB&&!oneUobOpen)}">Open either UOB</span> → `+
    `<span class="${pStepClass(bothUobsOpen,oneUobOpen&&!bothUobsOpen)}">Open the second UOB</span> → `+
    `<span class="${pStepClass(isolatedInputs,bothUobsOpen&&!isolatedInputs)}">Open UIBs, SSIBs / Mains 2 & Battery Breakers</span>`;
}

function updateParallel(){
  pids.forEach(id=>breakerState($(id),p[id]));

  const ups1BatteryMode=!p.pStatic&&!p.pUIB1&&p.pBB1;
  const ups2BatteryMode=!p.pStatic&&!p.pUIB2&&p.pBB2;

  const ups1Available=p.pStatic?p.pSSIB1:(p.pUIB1||p.pBB1);
  const ups2Available=p.pStatic?p.pSSIB2:(p.pUIB2||p.pBB2);

  const path1=ups1Available&&p.pUOB1;
  const path2=ups2Available&&p.pUOB2;
  const outputBus=path1||path2;
  const upsLoad=outputBus&&p.pSIB;
  const bypass=p.pMBB;
  const load=upsLoad||bypass;
  const dual=upsLoad&&bypass;

  wire("pSourceIn","live");
  wire("pSourceBus","live");

  wire("pUIB1Feed","live");
  wire("pUIB1Out",p.pUIB1?"live":null);
  wire("pSSIB1Feed",p.pStatic?"warn":null);
  wire("pSSIB1Out",(p.pStatic&&p.pSSIB1)?"warn":null);

  wire("pUIB2Feed","live");
  wire("pUIB2Out",p.pUIB2?"live":null);
  wire("pSSIB2Feed",p.pStatic?"warn":null);
  wire("pSSIB2Out",(p.pStatic&&p.pSSIB2)?"warn":null);

  wire("pUPS1Out",ups1Available?(p.pStatic?"warn":"live"):null);
  wire("pUOB1Out",path1?(p.pStatic?"warn":"live"):null);
  wire("pUPS2Out",ups2Available?(p.pStatic?"warn":"live"):null);
  wire("pUOB2Out",path2?(p.pStatic?"warn":"live"):null);

  wire("pOutputBus",outputBus?(p.pStatic?"warn":"live"):null);
  wire("pSIBFeed",outputBus?(p.pStatic?"warn":"live"):null);
  wire("pLoadWire",upsLoad?(dual?"warn":(p.pStatic?"warn":"live")):null);

  wire("pMBBFeed","live");
  wire("pMBBOut",bypass?(dual?"warn":"live"):null);

  $("pBB1Wire").classList.toggle("battery",p.pBB1);
  $("pBB2Wire").classList.toggle("battery",p.pBB2);

  $("pUPS1Mode").textContent=p.pStatic?"STATIC BYPASS":(ups1BatteryMode?"ON BATTERY":"INVERTER");
  $("pUPS2Mode").textContent=p.pStatic?"STATIC BYPASS":(ups2BatteryMode?"ON BATTERY":"INVERTER");
  $("pUPS1State").textContent=ups1Available?"AVAILABLE":"UNAVAILABLE";
  $("pUPS2State").textContent=ups2Available?"AVAILABLE":"UNAVAILABLE";
  $("pUPS1Battery").textContent=p.pBB1?"BATTERY AVAILABLE":"BATTERY ISOLATED";
  $("pUPS2Battery").textContent=p.pBB2?"BATTERY AVAILABLE":"BATTERY ISOLATED";

  const staticButton=$("pStaticToggle");
  staticButton.textContent=p.pStatic?"Return to Inverter":"Go to Static Bypass";
  staticButton.classList.toggle("active",p.pStatic);

  const staticHealthy=p.pSSIB1&&p.pSSIB2;
  $("pMode").textContent=p.pStatic
    ?(staticHealthy?"UPS Mode: STATIC BYPASS":"UPS Mode: STATIC BYPASS — SSIB OPEN")
    :"UPS Mode: INVERTER";
  $("pMode").className="pill "+(p.pStatic?(staticHealthy?"warn":"bad"):"ok");

  $("pFaultBanner").classList.toggle("active",p.bang);
  $("pLoadDropBanner").classList.toggle("active",!load&&!p.bang);
  $("pState").classList.toggle("fault-status-hidden",p.bang||(!load&&!p.bang));

  let pLoadMsg="LOAD DROPPED";
  if(upsLoad&&bypass) pLoadMsg="SUPPORTED BY UPS SYSTEM + MAINTENANCE BYPASS";
  else if(p.pStatic&&upsLoad) pLoadMsg="SUPPORTED BY STATIC BYPASS";
  else if(path1&&path2&&p.pSIB) pLoadMsg="SUPPORTED BY UPS 1 + UPS 2";
  else if(path1&&p.pSIB) pLoadMsg=ups1BatteryMode?"SUPPORTED BY UPS 1 (ON BATTERY)":"SUPPORTED BY UPS 1";
  else if(path2&&p.pSIB) pLoadMsg=ups2BatteryMode?"SUPPORTED BY UPS 2 (ON BATTERY)":"SUPPORTED BY UPS 2";
  else if(bypass) pLoadMsg="LOAD IS SUPPLIED THROUGH MAINTENANCE BYPASS";

  $("pLoad").textContent=pLoadMsg;
  $("pLoadText").textContent=load?"ON":"OFF";

  if(p.bang) pill("pState","BANG!! VOLTAGES WERE OUT OF SYNC — CHECK INSTALLATION FOR DAMAGE","bad");
  else if(dual) pill("pState","UPS SYSTEM + MAINTENANCE BYPASS CONNECTED — DUAL FED","warn");
  else if(bypass&&!upsLoad) pill("pState","MAINTENANCE BYPASS SUPPLYING LOAD","ok");
  else if(p.pStatic&&upsLoad) pill("pState","STATIC BYPASS SUPPLYING LOAD","warn");
  else if(path1&&path2&&p.pSIB) pill("pState","UPS 1 + UPS 2 PARALLELED — LOAD SUPPLIED","ok");
  else if(path1&&p.pSIB) pill("pState",ups1BatteryMode?"UPS 1 ON BATTERY — LOAD SUPPLIED":"UPS 1 SUPPLYING LOAD","ok");
  else if(path2&&p.pSIB) pill("pState",ups2BatteryMode?"UPS 2 ON BATTERY — LOAD SUPPLIED":"UPS 2 SUPPLYING LOAD","ok");
  else pill("pState","LOAD NOT SUPPLIED","bad");

  updateParallelLamps();
  updateParallelSteps();
}

pids.forEach(id=>{
  $(id).onclick=()=>{
    if(id==="pMBB"){
      if(!p.pMBB&&!p.pStatic){
        p.pMBB=true;
        p.bang=true;
        updateParallel();
        return;
      }
      p.pMBB=!p.pMBB;
      if(!p.pMBB) p.bang=false;
      updateParallel();
      return;
    }

    p[id]=!p[id];
    updateParallel();
  };
});

$("pStaticToggle").onclick=()=>{
  p.pStatic=!p.pStatic;
  if(p.pStatic) p.bang=false;
  updateParallel();
};

$("pNormal").onclick=()=>{
  p={
    pUIB1:true,pSSIB1:true,pBB1:true,pUOB1:true,
    pUIB2:true,pSSIB2:true,pBB2:true,pUOB2:true,
    pSIB:true,pMBB:false,
    pStatic:false,
    bang:false
  };
  updateParallel();
};

$("pOne").onclick=()=>{
  p={
    pUIB1:true,pSSIB1:true,pBB1:true,pUOB1:true,
    pUIB2:false,pSSIB2:false,pBB2:false,pUOB2:false,
    pSIB:true,pMBB:false,
    pStatic:false,
    bang:false
  };
  updateParallel();
};

$("pBypass").onclick=()=>{
  p={
    pUIB1:false,pSSIB1:false,pBB1:false,pUOB1:false,
    pUIB2:false,pSSIB2:false,pBB2:false,pUOB2:false,
    pSIB:false,pMBB:true,
    pStatic:false,
    bang:false
  };
  updateParallel();
};

$("pOpen").onclick=()=>{
  p={
    pUIB1:false,pSSIB1:false,pBB1:false,pUOB1:false,
    pUIB2:false,pSSIB2:false,pBB2:false,pUOB2:false,
    pSIB:false,pMBB:false,
    pStatic:false,
    bang:false
  };
  updateParallel();
};

updateParallel();
