import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import gsap from "gsap"
import { showLoader } from "./src/loaders/loader.js"
import { textureLoader, gltfLoader } from "./src/loaders/three-loader-setup.js"

import { getDom } from "./src/ui/dom.js"
import { initVoting } from "./src/voting/voting.js"
import { initConfigurator } from "./src/configurator/configurator.js"
import { startGuestSession } from "./src/shared/api.js"
import { getToken, getUserInfo, getSubmittedState } from "./src/shared/storage.js"

showLoader()

/* ================= DOM ================= */
const dom = getDom()

/* ================= FLOW STATE ================= */
let hasSubmitted = false
let myBagId = null

let carouselBags = []
let carouselIndex = 0

function setHasSubmitted(v) {
  hasSubmitted = !!v
}
function getHasSubmitted() {
  return hasSubmitted
}
function setMyBagId(v) {
  myBagId = v || null
}
function getMyBagId() {
  return myBagId
}
function setCarouselBags(bags) {
  carouselBags = bags || []
}
function getCarouselBags() {
  return carouselBags
}
function getCarouselIndex() {
  return carouselIndex
}
function setCarouselIndex(i) {
  if (!carouselBags.length) {
    carouselIndex = 0
    return
  }
  carouselIndex = (i + carouselBags.length) % carouselBags.length
}

/* ================= CONFIG ================= */
function createTextTexture(text) {
  const c = document.createElement("canvas")
  c.width = 1024
  c.height = 256

  const ctx = c.getContext("2d")
  ctx.clearRect(0, 0, c.width, c.height)

  ctx.fillStyle = "#dbd5d5"
  ctx.font = "900 150px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, c.width / 2, c.height / 2)

  const texture = new THREE.CanvasTexture(c)
  texture.flipY = false
  texture.needsUpdate = true
  return texture
}

let bagMesh = null
let textMesh = null
let imageMesh = null

function applyBagColor(hex) {
  if (bagMesh && bagMesh.material && bagMesh.material.color) {
    bagMesh.material.color.set(hex)
  }
}

function applyBagText(text) {
  if (!textMesh || !textMesh.material) return
  textMesh.material.map = text ? createTextTexture(text) : null
  textMesh.material.needsUpdate = true
}

function applyBagImage(filename) {
  if (!imageMesh || !filename) return

  textureLoader.load(
    `/images/${filename}`,
    tex => {
      tex.flipY = false
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true

      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 1
      })

      mat.depthTest = false
      mat.depthWrite = false
      mat.polygonOffset = true
      mat.polygonOffsetFactor = -4
      mat.polygonOffsetUnits = -4

      imageMesh.material = mat
      imageMesh.renderOrder = 999
    },
    undefined,
    err => {
      console.log("texture load failed:", `/images/${filename}`, err)
    }
  )
}

const rawConfig = {
  naam: "",
  smaak: "",
  kleur: "#F1B11B",
  image: ""
}

const config = new Proxy(rawConfig, {
  set(target, prop, value) {
    target[prop] = value

    if (prop === "kleur") applyBagColor(value)
    if (prop === "naam") applyBagText(value)
    if (prop === "image") applyBagImage(value)

    return true
  }
})

/* ================= WIZARD STATE ================= */
let currentStep = 1

function step1Valid() {
  const name = (dom.userNameInput?.value || "").trim()
  const email = (dom.userEmailInput?.value || "").trim()
  return name.length > 0 && email.length > 0 && email.includes("@")
}
function step2Valid() {
  return !!(config.naam && config.naam.trim().length > 0)
}
function step3Valid() {
  return !!(config.smaak && config.smaak.trim().length > 0)
}
function step4Valid() {
  return !!(config.image && config.image.trim().length > 0)
}

function updateWizardButtons() {
  if (dom.nextBtnWizard) dom.nextBtnWizard.disabled = !step1Valid()
  if (dom.nextBtnWizard2) dom.nextBtnWizard2.disabled = !step2Valid()
  if (dom.nextBtnWizard3) dom.nextBtnWizard3.disabled = !step3Valid()
}

function updateSubmitState() {
  const okAll = !!getToken() && step2Valid() && step3Valid() && step4Valid()
  if (dom.opslaanBtn) dom.opslaanBtn.disabled = !okAll

  if (!getToken()) {
    if (dom.statusP) dom.statusP.textContent = ""
    return
  }
}

function setStep(step) {
  currentStep = Math.max(1, Math.min(4, step))

  if (dom.step1El) dom.step1El.classList.toggle("hidden", currentStep !== 1)
  if (dom.step2El) dom.step2El.classList.toggle("hidden", currentStep !== 2)
  if (dom.step3El) dom.step3El.classList.toggle("hidden", currentStep !== 3)
  if (dom.step4El) dom.step4El.classList.toggle("hidden", currentStep !== 4)

  if (dom.dot1) dom.dot1.classList.toggle("active", currentStep === 1)
  if (dom.dot2) dom.dot2.classList.toggle("active", currentStep === 2)
  if (dom.dot3) dom.dot3.classList.toggle("active", currentStep === 3)
  if (dom.dot4) dom.dot4.classList.toggle("active", currentStep === 4)

  if (currentStep === 1) moveCamera(cameraPos.default)
  if (currentStep === 2) moveCamera(cameraPos.name)
  if (currentStep === 3) moveCamera(cameraPos.flavor)
  if (currentStep === 4) moveCamera(cameraPos.color)

  updateWizardButtons()
  updateSubmitState()
}

/* ================= THREE ================= */
const scene = new THREE.Scene()

const envTexture = textureLoader.load("/environments/environment1.png")
envTexture.mapping = THREE.EquirectangularReflectionMapping
scene.background = envTexture

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0.6, 2)

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  preserveDrawingBuffer: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true

scene.add(new THREE.AmbientLight(0xffffff, 0.8))

const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(2, 4, 3)
dirLight.castShadow = true
scene.add(dirLight)

const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 0.1, 64),
  new THREE.MeshStandardMaterial({ color: "#e86f3b" })
)
floor.position.set(0, -0.8, -0.2)
floor.scale.set(1.4, 1, 1.4)
floor.receiveShadow = true
scene.add(floor)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enablePan = false

controls.minDistance = 1
controls.maxDistance = 2.4

controls.minAzimuthAngle = -Math.PI * 0.25
controls.maxAzimuthAngle = Math.PI * 0.25
controls.minPolarAngle = Math.PI * 0.35
controls.maxPolarAngle = Math.PI * 0.65

controls.target.set(0, 0.45, 0)
controls.update()

const cameraPos = {
  default: { x: 0, y: 0.3, z: 2 },
  name: { x: 0, y: 0.38, z: 0.8 },
  flavor: { x: 0.08, y: 0.36, z: 1.9 },
  color: { x: 0, y: 0.32, z: 2.1 }
}

function moveCamera(pos) {
  gsap.to(camera.position, {
    x: pos.x,
    y: pos.y,
    z: pos.z,
    duration: 0.6,
    ease: "power2.out",
    onUpdate: () => controls.update()
  })
}

function getCanvasPreviewDataUrl() {
  try {
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL("image/jpeg", 0.7)
  } catch (e) {
    return ""
  }
}

gltfLoader.load("/models/Lays_Bag_Arthur.glb", gltf => {
  const bagRoot = gltf.scene
  bagRoot.scale.set(0.7, 0.7, 0.7)
  bagRoot.position.set(0, 0.5, 0)
  bagRoot.rotation.set(0.3, 0.5, 0)

  bagRoot.traverse(c => {
    if (!c.isMesh) return

    c.castShadow = true
    c.receiveShadow = true

    if (c.name === "Plane_Bag") {
      bagMesh = c
      bagMesh.material = new THREE.MeshStandardMaterial({
        color: config.kleur,
        roughness: 0.3,
        metalness: 0.1,
        envMapIntensity: 0.2
      })
    }

    if (c.name === "Plane_Logo") {
      c.castShadow = false
      c.receiveShadow = false
      if (c.material) {
        c.material.transparent = true
        c.material.depthWrite = false
        c.material.polygonOffset = true
        c.material.polygonOffsetFactor = -2
        c.material.polygonOffsetUnits = -2
        c.material.needsUpdate = true
      }
      c.renderOrder = 20
    }

    if (c.name === "Plane_Text") {
      textMesh = c
      textMesh.material = new THREE.MeshBasicMaterial({ transparent: true })

      const initialText = "Mijn Chipszak"
      textMesh.material.map = createTextTexture(initialText)
      textMesh.material.needsUpdate = true

      config.naam = initialText
      if (dom.naamInput) dom.naamInput.value = initialText

      c.renderOrder = 30
    }

    if (c.name === "Plane_Image" || c.name === "Plane_Topping" || c.name === "Plane_Bottom") {
      imageMesh = c
      imageMesh.visible = true
      imageMesh.material = new THREE.MeshBasicMaterial({ transparent: true })
      imageMesh.position.y += 0.05
      imageMesh.scale.set(0.75, 0.75, 0.75)
      c.renderOrder = 35
    }
  })

  scene.add(bagRoot)

  updateWizardButtons()
  updateSubmitState()
  setStep(1)
})

/* ================= VOTE UI RENDER ================= */
function renderVoteCard() {
  const bags = carouselBags

  if (!bags.length) {
    if (dom.voteName) dom.voteName.textContent = "Geen inzendingen"
    if (dom.voteFlavor) dom.voteFlavor.textContent = ""
    if (dom.voteColor) dom.voteColor.style.background = "#ddd"
    if (dom.voteBtn) dom.voteBtn.disabled = true
    if (dom.prevBtn) dom.prevBtn.disabled = true
    if (dom.nextBtn) dom.nextBtn.disabled = true

    if (dom.votePreviewImg) {
      dom.votePreviewImg.src = ""
      dom.votePreviewImg.style.display = "none"
    }
    return
  }

  const b = bags[carouselIndex]
  if (dom.voteName) dom.voteName.textContent = b.naam || "Zonder naam"
  if (dom.voteFlavor) dom.voteFlavor.textContent = b.smaak || ""
  if (dom.voteColor) dom.voteColor.style.background = b.kleur || "#ddd"

  if (dom.votePreviewImg) {
    dom.votePreviewImg.src = b.previewImage || ""
    dom.votePreviewImg.style.display = b.previewImage ? "block" : "none"
  }

  if (dom.voteBtn) dom.voteBtn.disabled = false
  if (dom.prevBtn) dom.prevBtn.disabled = false
  if (dom.nextBtn) dom.nextBtn.disabled = false
}

/* ================= INIT MODULES ================= */
const voting = initVoting({
  dom,
  getMyBagId,
  getHasSubmitted,
  setCarouselBags,
  getCarouselBags,
  getCarouselIndex,
  setCarouselIndex,
  renderVoteCard
})

initConfigurator({
  dom,
  config,
  getCanvasPreviewDataUrl,
  moveCamera,
  cameraPos,
  buildCarousel: voting.buildCarousel,
  openVoteOverlay: voting.openVoteOverlay,
  setHasSubmitted,
  setMyBagId,
  updateWizardButtons,
  updateSubmitState
})

/* ================= AUTH VIA VOLGENDE ================= */
async function startFromNext() {
  if (dom.authStatus) dom.authStatus.textContent = ""
  if (dom.statusP) dom.statusP.textContent = ""

  try {
    await startGuestSession(dom.userNameInput.value, dom.userEmailInput.value)
    if (dom.authStatus) dom.authStatus.textContent = "Ok, je kan nu verder"
    updateWizardButtons()
    updateSubmitState()
    setStep(2)
  } catch (e) {
    if (dom.authStatus) dom.authStatus.textContent = e.message || "Kon niet starten"
  }
}

function updateAuthNextState() {
  updateWizardButtons()
  updateSubmitState()
}

if (dom.userNameInput) dom.userNameInput.addEventListener("input", updateAuthNextState)
if (dom.userEmailInput) dom.userEmailInput.addEventListener("input", updateAuthNextState)

/* ================= WIZARD NAV EVENTS ================= */
if (dom.dot1) dom.dot1.addEventListener("click", () => setStep(1))
if (dom.dot2) dom.dot2.addEventListener("click", () => {
  if (getToken()) setStep(2)
})
if (dom.dot3) dom.dot3.addEventListener("click", () => {
  if (getToken() && step2Valid()) setStep(3)
})
if (dom.dot4) dom.dot4.addEventListener("click", () => {
  if (getToken() && step2Valid() && step3Valid()) setStep(4)
})

if (dom.nextBtnWizard) {
  dom.nextBtnWizard.addEventListener("click", async () => {
    if (!step1Valid()) return
    if (getToken()) {
      setStep(2)
      return
    }
    await startFromNext()
  })
}

if (dom.prevBtnWizard) dom.prevBtnWizard.addEventListener("click", () => setStep(1))

if (dom.nextBtnWizard2) {
  dom.nextBtnWizard2.addEventListener("click", () => {
    if (!step2Valid()) return
    setStep(3)
  })
}
if (dom.prevBtnWizard2) dom.prevBtnWizard2.addEventListener("click", () => setStep(2))

if (dom.nextBtnWizard3) {
  dom.nextBtnWizard3.addEventListener("click", () => {
    if (!step3Valid()) return
    setStep(4)
  })
}
if (dom.prevBtnWizard3) dom.prevBtnWizard3.addEventListener("click", () => setStep(3))

/* ================= INIT STATE FROM STORAGE ================= */
const s = getSubmittedState()
if (s.submitted && s.myBagId) {
  setHasSubmitted(true)
  setMyBagId(s.myBagId)
  voting.buildCarousel().then(() => voting.openVoteOverlay()).catch(() => {})
}

updateWizardButtons()
updateSubmitState()
setStep(1)

/* ================= RESIZE + ANIMATE ================= */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
animate()
