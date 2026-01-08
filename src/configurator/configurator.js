// src/configurator/configurator.js
import { saveBag } from "../shared/api.js"
import { getUserInfo, setSubmittedState } from "../shared/storage.js"

export function initConfigurator({
  dom,
  config,
  getCanvasPreviewDataUrl,
  moveCamera,
  cameraPos,
  buildCarousel,
  openVoteOverlay,
  setHasSubmitted,
  setMyBagId,
  updateWizardButtons,
  updateSubmitState
}) {
  const { naamInput, smaakInput, kleurButtons, imgGrid, opslaanBtn, statusP } = dom

  naamInput.addEventListener("focus", () => moveCamera(cameraPos.name))
  naamInput.addEventListener("input", e => {
    const v = (e.target.value || "").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 20)
    naamInput.value = v
    config.naam = v
    updateWizardButtons()
    updateSubmitState()
  })

  smaakInput.addEventListener("focus", () => moveCamera(cameraPos.flavor))
  smaakInput.addEventListener("input", e => {
    config.smaak = (e.target.value || "").slice(0, 20)
    updateWizardButtons()
    updateSubmitState()
  })

  kleurButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      kleurButtons.forEach(b => b.classList.remove("active"))
      btn.classList.add("active")
      config.kleur = btn.dataset.color
    })
  })

  imgGrid.addEventListener("click", e => {
    const btn = e.target.closest(".img-card")
    if (!btn) return

    imgGrid.querySelectorAll(".img-card").forEach(b => b.classList.remove("selected"))
    btn.classList.add("selected")

    config.image = btn.dataset.img || ""
    updateSubmitState()
  })

  opslaanBtn.addEventListener("click", async () => {
    statusP.textContent = ""

    try {
      const user = getUserInfo()

      const saved = await saveBag({
        naam: config.naam,
        smaak: config.smaak,
        kleur: config.kleur,
        image: config.image,
        previewImage: getCanvasPreviewDataUrl(),
        submittedByName: user.name,
        submittedByEmail: user.email
      })

      setHasSubmitted(true)
      setMyBagId(saved._id)
      setSubmittedState(true, saved._id)

      statusP.textContent = "Inzending opgeslagen, je kan nu stemmen"
      moveCamera(cameraPos.default)

      await buildCarousel()
      openVoteOverlay()
    } catch (e) {
      statusP.textContent = e.message || "Fout bij opslaan"
    }
  })
}
