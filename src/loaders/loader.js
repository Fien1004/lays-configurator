const loaderEl = document.getElementById("loader")
const barFill = document.getElementById("loaderBarFill")
const pctEl = document.getElementById("loaderPct")

export function showLoader() {
  if (!loaderEl) return
  loaderEl.classList.remove("hidden")
  setLoaderProgress(0)
}

export function hideLoader() {
  if (!loaderEl) return
  loaderEl.classList.add("hidden")
}

export function setLoaderProgress(pct) {
  if (!barFill || !pctEl) return
  const clamped = Math.max(0, Math.min(100, Math.round(pct)))
  barFill.style.width = clamped + "%"
  pctEl.textContent = clamped + "%"
}
