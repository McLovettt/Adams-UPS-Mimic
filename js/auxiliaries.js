// Adams UPS Trainer v0.7
// Lights & Auxiliaries mode and signal highlighting.

function clearAuxHighlight(){
  document.querySelectorAll(".aux-card").forEach(card=>{
    card.classList.remove("aux-has-selection");
    card.querySelectorAll(".aux-active").forEach(el=>el.classList.remove("aux-active"));
  });
  const help=$("auxHighlightHelp");
  if(help) help.innerHTML="Tap any terminal, label or coloured route to highlight the matching signal end-to-end.";
}

function highlightAuxNet(net){
  clearAuxHighlight();
  if(!net) return;
  const visibleCard = $("auxSingleWrap").style.display !== "none" ? $("auxSingleWrap") : $("auxDualWrap");
  visibleCard.classList.add("aux-has-selection");
  visibleCard.querySelectorAll(`[data-net="${CSS.escape(net)}"]`).forEach(el=>el.classList.add("aux-active"));
  const help=$("auxHighlightHelp");
  if(help) help.innerHTML=`Selected signal: <strong>${net.replaceAll("_"," ")}</strong>`;
}

function wireAuxClickHandlers(){
  document.querySelectorAll("#aux .aux-node, #aux .aux-route").forEach(el=>{
    el.onclick=(ev)=>{
      ev.stopPropagation();
      highlightAuxNet(el.dataset.net);
    };
  });
}

function setAuxMode(mode){
  const dualWrap=$("auxDualWrap"), singleWrap=$("auxSingleWrap");
  if(!dualWrap || !singleWrap) return;
  const dual = mode === "dual";
  singleWrap.style.display = dual ? "none" : "block";
  dualWrap.style.display = dual ? "block" : "none";
  $("auxModeLabel").textContent = dual ? "Dual Mains" : "Single UPS Mains";
  $("auxSingleBtn").classList.toggle("active", !dual);
  $("auxDualBtn").classList.toggle("active", dual);
  clearAuxHighlight();
}
if($("auxDualBtn") && $("auxSingleBtn")){
  $("auxSingleBtn").onclick=()=>setAuxMode("single");
  $("auxDualBtn").onclick=()=>setAuxMode("dual");
  $("auxClearHighlight").onclick=clearAuxHighlight;
  wireAuxClickHandlers();
  setAuxMode("single");
}
