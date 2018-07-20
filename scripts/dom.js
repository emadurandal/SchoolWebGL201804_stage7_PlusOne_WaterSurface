function moveCanvasToTarget(canvas, targetId) {
  const targetDom = document.getElementById(targetId);
  document.body.appendChild(canvas);
  canvas.style.position = "absolute";
  canvas.style.zIndex = -1;
  const rect = targetDom.getBoundingClientRect();

  canvas.style.display = "block";
  canvas.style.left = "" + rect.left - (canvas.clientWidth/2 - targetDom.clientWidth/2) + "px";
  canvas.style.top = "" + rect.top - (canvas.clientHeight/2 - targetDom.clientHeight) + "px";

  return targetDom;
}
