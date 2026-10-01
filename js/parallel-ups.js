// Adams UPS Trainer v0.7
// Parallel UPS simulator logic.

/* PARALLEL */
const pids=["pUIB1","pUOB1","pUIB2","pUOB2","pSIB","pMBB"];
let p={pUIB1:true,pUOB1:true,pUIB2:true,pUOB2:true,pSIB:true,pMBB:false};
function updateParallel(){
  pids.forEach(id=>breakerState($(id),p[id]));
  const a=p.pUIB1&&p.pUOB1,b=p.pUIB2&&p.pUOB2,bus=a||b,upsLoad=bus&&p.pSIB,bypass=p.pMBB,load=upsLoad||bypass,dual=upsLoad&&bypass;
  wire("pTo1","live");wire("pTo2","live");
  wire("p1a",p.pUIB1?"live":null);wire("p1b",p.pUIB1?"live":null);wire("p1c",a?"live":null);
  wire("p2a",p.pUIB2?"live":null);wire("p2b",p.pUIB2?"live":null);wire("p2c",b?"live":null);
  wire("pBus",bus?"live":null);wire("pBusSIB",bus?"live":null);wire("pLoadWire",upsLoad?(dual?"warn":"live"):null);
  wire("pBy1","live");wire("pBy2",bypass?(dual?"warn":"live"):null);
  let pLoadMsg = "LOAD DROPPED";
  if(upsLoad && bypass) pLoadMsg = "SUPPORTED BY UPS + BYPASS";
  else if(a && b && p.pSIB) pLoadMsg = "SUPPORTED BY UPS 1 + UPS 2";
  else if(a && p.pSIB) pLoadMsg = "SUPPORTED BY UPS 1";
  else if(b && p.pSIB) pLoadMsg = "SUPPORTED BY UPS 2";
  else if(bypass) pLoadMsg = "SUPPORTED BY MAINTENANCE BYPASS";

  $("pLoad").textContent=pLoadMsg;$("pLoadText").textContent=load?"ON":"OFF";
  if(dual)pill("pState","UPS SYSTEM + MAINTENANCE BYPASS CONNECTED — VERIFY CONDITION","warn");
  else if(a&&b&&p.pSIB)pill("pState","UPS 1 + UPS 2 PARALLELED — LOAD SUPPLIED","ok");
  else if(a&&p.pSIB)pill("pState","UPS 1 SUPPLYING LOAD","ok");
  else if(b&&p.pSIB)pill("pState","UPS 2 SUPPLYING LOAD","ok");
  else if(bypass)pill("pState","MAINTENANCE BYPASS SUPPLYING LOAD","ok");
  else pill("pState","LOAD NOT SUPPLIED","bad");
}
pids.forEach(id=>$(id).onclick=()=>{p[id]=!p[id];updateParallel();});
$("pNormal").onclick=()=>{p={pUIB1:true,pUOB1:true,pUIB2:true,pUOB2:true,pSIB:true,pMBB:false};updateParallel();};
$("pOne").onclick=()=>{p={pUIB1:true,pUOB1:true,pUIB2:false,pUOB2:false,pSIB:true,pMBB:false};updateParallel();};
$("pBypass").onclick=()=>{p={pUIB1:false,pUOB1:false,pUIB2:false,pUOB2:false,pSIB:false,pMBB:true};updateParallel();};
$("pOpen").onclick=()=>{p={pUIB1:false,pUOB1:false,pUIB2:false,pUOB2:false,pSIB:false,pMBB:false};updateParallel();};
