// Adams UPS Trainer v0.7
// Parallel UPS simulator logic.

const pids=["pUIB1","pUOB1","pUIB2","pUOB2","pSIB","pMBB","pSSIB"];
let p={
  pUIB1:true,pUOB1:true,
  pUIB2:true,pUOB2:true,
  pSIB:true,pMBB:false,pSSIB:true,
  pStatic:false
};

function pStepClass(done,next){
  return done?"stepdone":(next?"stepnext":"");
}

function updateParallelSteps(){
  const oneUobOpen=!p.pUOB1 || !p.pUOB2;
  const bothUobsOpen=!p.pUOB1 && !p.pUOB2;
  const isolatedInputs=!p.pUIB1 && !p.pUIB2 && !p.pSSIB;

  $("pSteps").innerHTML="<strong>Parallel maintenance bypass sequence:</strong> "+
    `<span class="${pStepClass(p.pStatic,!p.pStatic)}">Go to Static Bypass</span> → `+
    `<span class="${pStepClass(p.pMBB,p.pStatic&&!p.pMBB)}">Close MBB</span> → `+
    `<span class="${pStepClass(!p.pSIB,p.pMBB&&p.pSIB)}">Open SIB</span> → `+
    `<span class="${pStepClass(oneUobOpen,!p.pSIB&&!oneUobOpen)}">Open either UOB</span> → `+
    `<span class="${pStepClass(bothUobsOpen,oneUobOpen&&!bothUobsOpen)}">Open the second UOB</span> → `+
    `<span class="${pStepClass(isolatedInputs,bothUobsOpen&&!isolatedInputs)}">Open UIB 1, UIB 2 & SSIB / Mains 2</span>`;
}

function updateParallel(){
  pids.forEach(id=>breakerState($(id),p[id]));

  const staticAvailable=p.pStatic && p.pSSIB;
  const ups1Source=p.pStatic ? staticAvailable : p.pUIB1;
  const ups2Source=p.pStatic ? staticAvailable : p.pUIB2;
  const a=ups1Source&&p.pUOB1;
  const b=ups2Source&&p.pUOB2;
  const bus=a||b;
  const upsLoad=bus&&p.pSIB;
  const bypass=p.pMBB;
  const load=upsLoad||bypass;
  const dual=upsLoad&&bypass;

  wire("pTo1","live");
  wire("pTo2","live");
  wire("p1a",p.pUIB1?"live":null);
  wire("p2a",p.pUIB2?"live":null);

  wire("pMains2Feed","live");
  wire("pSSIBIn","live");
  wire("pStaticBus",p.pSSIB?"live":null);
  wire("pStatic1",p.pSSIB?(p.pStatic?"warn":"live"):null);
  wire("pStatic2",p.pSSIB?(p.pStatic?"warn":"live"):null);

  wire("p1b",ups1Source?(p.pStatic?"warn":"live"):null);
  wire("p1c",a?(p.pStatic?"warn":"live"):null);
  wire("p2b",ups2Source?(p.pStatic?"warn":"live"):null);
  wire("p2c",b?(p.pStatic?"warn":"live"):null);
  wire("pBus",bus?(p.pStatic?"warn":"live"):null);
  wire("pBusSIB",bus?(p.pStatic?"warn":"live"):null);
  wire("pLoadWire",upsLoad?(dual?"warn":(p.pStatic?"warn":"live")):null);

  wire("pBy1","live");
  wire("pBy2",bypass?(dual?"warn":"live"):null);

  $("pUPS1Mode").textContent=p.pStatic?"→ STATIC BYPASS":"→ INVERTER";
  $("pUPS2Mode").textContent=p.pStatic?"→ STATIC BYPASS":"→ INVERTER";
  $("pUPS1State").textContent=ups1Source?"AVAILABLE":"UNAVAILABLE";
  $("pUPS2State").textContent=ups2Source?"AVAILABLE":"UNAVAILABLE";

  const staticButton=$("pStaticToggle");
  staticButton.textContent=p.pStatic?"Return to Inverter":"Go to Static Bypass";
  staticButton.classList.toggle("active",p.pStatic);

  const modeText=p.pStatic
    ? (staticAvailable?"UPS Mode: STATIC BYPASS":"UPS Mode: STATIC BYPASS — MAINS 2 UNAVAILABLE")
    : "UPS Mode: INVERTER";
  $("pMode").textContent=modeText;
  $("pMode").className="pill "+(p.pStatic?(staticAvailable?"warn":"bad"):"ok");

  let pLoadMsg="LOAD DROPPED";
  if(upsLoad&&bypass) pLoadMsg="SUPPORTED BY UPS SYSTEM + MAINTENANCE BYPASS";
  else if(p.pStatic&&a&&b&&p.pSIB) pLoadMsg="SUPPORTED BY STATIC BYPASS";
  else if(p.pStatic&&(a||b)&&p.pSIB) pLoadMsg="SUPPORTED BY STATIC BYPASS";
  else if(a&&b&&p.pSIB) pLoadMsg="SUPPORTED BY UPS 1 + UPS 2";
  else if(a&&p.pSIB) pLoadMsg="SUPPORTED BY UPS 1";
  else if(b&&p.pSIB) pLoadMsg="SUPPORTED BY UPS 2";
  else if(bypass) pLoadMsg="LOAD IS SUPPLIED THROUGH MAINTENANCE BYPASS";

  $("pLoad").textContent=pLoadMsg;
  $("pLoadText").textContent=load?"ON":"OFF";

  if(dual) pill("pState","UPS SYSTEM + MAINTENANCE BYPASS CONNECTED — DUAL FED","warn");
  else if(pypassOnly()) pill("pState","MAINTENANCE BYPASS SUPPLYING LOAD","ok");
  else if(p.pStatic&&upsLoad) pill("pState","STATIC BYPASS SUPPLYING LOAD","warn");
  else if(a&&b&&p.pSIB) pill("pState","UPS 1 + UPS 2 PARALLELED — LOAD SUPPLIED","ok");
  else if(a&&p.pSIB) pill("pState","UPS 1 SUPPLYING LOAD","ok");
  else if(b&&p.pSIB) pill("pState","UPS 2 SUPPLYING LOAD","ok");
  else pill("pState","LOAD NOT SUPPLIED","bad");

  updateParallelSteps();
}

function pypassOnly(){
  return p.pMBB && (!p.pSIB || (!p.pUOB1&&!p.pUOB2));
}

pids.forEach(id=>{
  $(id).onclick=()=>{
    p[id]=!p[id];
    updateParallel();
  };
});

$("pStaticToggle").onclick=()=>{
  p.pStatic=!p.pStatic;
  updateParallel();
};

$("pNormal").onclick=()=>{
  p={
    pUIB1:true,pUOB1:true,
    pUIB2:true,pUOB2:true,
    pSIB:true,pMBB:false,pSSIB:true,
    pStatic:false
  };
  updateParallel();
};

$("pOne").onclick=()=>{
  p={
    pUIB1:true,pUOB1:true,
    pUIB2:false,pUOB2:false,
    pSIB:true,pMBB:false,pSSIB:true,
    pStatic:false
  };
  updateParallel();
};

$("pBypass").onclick=()=>{
  p={
    pUIB1:false,pUOB1:false,
    pUIB2:false,pUOB2:false,
    pSIB:false,pMBB:true,pSSIB:false,
    pStatic:false
  };
  updateParallel();
};

$("pOpen").onclick=()=>{
  p={
    pUIB1:false,pUOB1:false,
    pUIB2:false,pUOB2:false,
    pSIB:false,pMBB:false,pSSIB:false,
    pStatic:false
  };
  updateParallel();
};

updateParallel();
