// src/voting/voting.js
import { loadBags, voteForBag } from "../shared/api.js"

export function initVoting({
  dom,
  getMyBagId,
  getHasSubmitted,
  setCarouselBags,
  getCarouselBags,
  getCarouselIndex,
  setCarouselIndex,
  renderVoteCard
}) {
  const { voteOverlay, closeVoteBtn, prevBtn, nextBtn, voteBtn } = dom

  function openVoteOverlay() {
    dom.voteStatus.textContent = ""
    voteOverlay.classList.remove("hidden")
  }
  function closeVoteOverlay() {
    voteOverlay.classList.add("hidden")
  }

  async function buildCarousel() {
    const all = await loadBags()
    const myId = getMyBagId()
    const bags = (all || []).filter(b => b._id !== myId)
    setCarouselBags(bags)
    setCarouselIndex(0)
    renderVoteCard()
  }

  async function voteCurrent() {
    const bags = getCarouselBags()
    if (!bags.length) return

    const b = bags[getCarouselIndex()]
    voteBtn.disabled = true
    voteBtn.textContent = "Bezig..."

    try {
      await voteForBag(b._id, getHasSubmitted())
      dom.voteStatus.textContent = `Gestemd op: ${b.naam || "chipszak"}`
      voteBtn.textContent = "Gestemd"
    } catch (e) {
      const msg = String(e?.message || "Stemmen faalde")

      if (msg.includes("E11000") || msg.toLowerCase().includes("duplicate key")) {
        dom.voteStatus.textContent = "Je hebt al op deze chipszak gestemd"
        voteBtn.textContent = "Al gestemd"
        return
      }

      voteBtn.disabled = false
      voteBtn.textContent = "Stem"
      dom.voteStatus.textContent = msg
    }
  }

  closeVoteBtn.addEventListener("click", closeVoteOverlay)
  prevBtn.addEventListener("click", () => {
    setCarouselIndex(getCarouselIndex() - 1)
    renderVoteCard()
  })
  nextBtn.addEventListener("click", () => {
    setCarouselIndex(getCarouselIndex() + 1)
    renderVoteCard()
  })
  voteBtn.addEventListener("click", voteCurrent)

  return { openVoteOverlay, closeVoteOverlay, buildCarousel }
}
