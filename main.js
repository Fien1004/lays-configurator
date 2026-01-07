import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import gsap from "gsap"
import { showLoader } from "./src/loaders/loader.js"
import { textureLoader, gltfLoader } from "./src/loaders/three-loader-setup.js"

showLoader()

/* ================= UI ================= */
const naamInput = document.getElementById("naamInput")
const smaakInput = document.getElementById("smaakInput")
const kleurButtons = document.querySelectorAll(".kleur-btn")
const opslaanBtn = document.getElementById("opslaanBtn")

const userNameInput = document.getElementById("userNameInput")
const userEmailInput = document.getElementById("userEmailInput")
const startBtn = document.getElementById("startBtn")
const resetBtn = document.getElementById("resetBtn")
const authStatus = document.getElementById("authStatus")
const statusP = document.getElementById("status")

const voteOverlay = document.getElementById("voteOverlay")
const closeVoteBtn = document.getElementById("closeVoteBtn")
const prevBtn = document.getElementById("prevBtn")
const nextBtn = document.getElementById("nextBtn")
const voteBtn = document.getElementById("voteBtn")
const voteStatus = document.getElementById("voteStatus")
const voteName = document.getElementById("voteName")
const voteFlavor = document.getElementById("voteFlavor")
const voteColor = document.getElementById("voteColor")

const votePreviewImg = document.getElementById("votePreviewImg")

const step1El = document.getElementById("step1")
const step2El = document.getElementById("step2")
const step3El = document.getElementById("step3")
const step4El = document.getElementById("step4")

const dot1 = document.getElementById("dot1")
const dot2 = document.getElementById("dot2")
const dot3 = document.getElementById("dot3")
const dot4 = document.getElementById("dot4")

const nextBtnWizard = document.getElementById("nextBtnWizard")
const prevBtnWizard = document.getElementById("prevBtnWizard")
const nextBtnWizard2 = document.getElementById("nextBtnWizard2")
const prevBtnWizard2 = document.getElementById("prevBtnWizard2")
const nextBtnWizard3 = document.getElementById("nextBtnWizard3")
const prevBtnWizard3 = document.getElementById("prevBtnWizard3")

const imgGrid = document.getElementById("imgGrid")

/* ================= CONFIG ================= */
const config = {
  naam: "",
  smaak: "",
  kleur: "#F1B11B",
  image: ""
}

/* ================= API ================= */
const API_BASE = "https://lays-api-6rne.onrender.com"
const TOKEN_KEY = "lays_token"
const USERNAME_KEY = "lays_username"
const EMAIL_KEY = "lays_email"
const SUBMITTED_KEY = "lays_submitted"
const MY_BAG_ID_KEY = "lays_my_bag_id"

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t)
}
function setUserInfo(name, email) {
  localStorage.setItem(USERNAME_KEY, name)
  localStorage.setItem(EMAIL_KEY, email)
}
function getUserInfo() {
  return {
    name: localStorage.getItem(USERNAME_KEY) || "",
    email: localStorage.getItem(EMAIL_KEY) || ""
  }
}
function setSubmittedState(submitted, myBagId) {
  localStorage.setItem(SUBMITTED_KEY, submitted ? "1" : "0")
  localStorage.setItem(MY_BAG_ID_KEY, myBagId || "")
}
function getSubmittedState() {
  return {
    submitted: localStorage.getItem(SUBMITTED_KEY) === "1",
    myBagId: localStorage.getItem(MY_BAG_ID_KEY) || ""
  }
}
function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(SUBMITTED_KEY)
  localStorage.removeItem(MY_BAG_ID_KEY)
}

/* ================= FLOW STATE ================= */
let hasSubmitted = false
let myBagId = null

let carouselBags = []
let carouselIndex = 0

function openVoteOverlay() {
  voteStatus.textContent = ""
  voteOverlay.classList.remove("hidden")
}
function closeVoteOverlay() {
  voteOverlay.classList.add("hidden")
}

/* ================= WIZARD STATE ================= */
let currentStep = 1

function step1Valid() {
  return !!getToken()
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
  if (nextBtnWizard) nextBtnWizard.disabled = !step1Valid()
  if (nextBtnWizard2) nextBtnWizard2.disabled = !step2Valid()
  if (nextBtnWizard3) nextBtnWizard3.disabled = !step3Valid()
}

function updateSubmitState() {
  const okAll = step1Valid() && step2Valid() && step3Valid() && step4Valid()
  opslaanBtn.disabled = !okAll

  if (!step1Valid()) {
    if (statusP) statusP.textContent = ""
    return
  }
}

function setStep(step) {
  currentStep = Math.max(1, Math.min(4, step))

  if (step1El) step1El.classList.toggle("hidden", currentStep !== 1)
  if (step2El) step2El.classList.toggle("hidden", currentStep !== 2)
  if (step3El) step3El.classList.toggle("hidden", currentStep !== 3)
  if (step4El) step4El.classList.toggle("hidden", currentStep !== 4)

  if (dot1) dot1.classList.toggle("active", currentStep === 1)
  if (dot2) dot2.classList.toggle("active", currentStep === 2)
  if (dot3) dot3.classList.toggle("active", currentStep === 3)
  if (dot4) dot4.classList.toggle("active", currentStep === 4)

  if (currentStep === 1) moveCamera(cameraPos.default)
  if (currentStep === 2) moveCamera(cameraPos.name)
  if (currentStep === 3) moveCamera(cameraPos.flavor)
  if (currentStep === 4) moveCamera(cameraPos.color)

  updateWizardButtons()
  updateSubmitState()
}

/* ================= THREE ================= */
const canvas = document.getElementById("canvas")
const scene = new THREE.Scene()

const envTexture = textureLoader.load("/environments/environment1.png")
envTexture.mapping = THREE.EquirectangularReflectionMapping
scene.background = envTexture

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0.6, 2)

const renderer = new THREE.WebGLRenderer({
  canvas,
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

function getCanvasPreviewDataUrl() {
  try {
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL("image/jpeg", 0.7)
  } catch (e) {
    return ""
  }
}

let bagMesh = null
let textMesh = null
let imageMesh = null

function setImageOnBag(filename) {
  config.image = filename || ""
  updateSubmitState()

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
      naamInput.value = initialText

      c.renderOrder = 30
    }

    if (c.name === "Plane_Bottom") {
      imageMesh = c
      imageMesh.visible = true
      imageMesh.material = new THREE.MeshBasicMaterial({ transparent: true })
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

/* ================= API CALLS ================= */
async function startGuestSession(username, email) {
  const cleanName = (username || "").trim().slice(0, 20)
  const cleanEmail = (email || "").trim().slice(0, 50)

  if (!cleanName) throw new Error("Gebruikersnaam is verplicht")
  if (!cleanEmail) throw new Error("Email is verplicht")
  if (!cleanEmail.includes("@")) throw new Error("Email is niet geldig")

  const res = await fetch(`${API_BASE}/user/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail })
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || "Kon niet starten")
  if (!data.token) throw new Error("Geen token ontvangen")

  setToken(data.token)
  setUserInfo(cleanName, cleanEmail)
}

async function loadBags() {
  const res = await fetch(`${API_BASE}/bag`)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || "Kon inzendingen niet laden")
  return data
}

async function saveBag() {
  const token = getToken()
  if (!token) throw new Error("Klik eerst Start")

  const user = getUserInfo()

  const res = await fetch(`${API_BASE}/bag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      naam: config.naam,
      smaak: config.smaak,
      kleur: config.kleur,
      image: config.image,
      previewImage: getCanvasPreviewDataUrl(),
      submittedByName: user.name,
      submittedByEmail: user.email
    })
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || "Fout bij opslaan")
  return data
}

async function voteForBag(bagId) {
  const token = getToken()
  if (!token) throw new Error("Klik eerst Start")
  if (!hasSubmitted) throw new Error("Dien eerst je eigen chipszak in")

  const res = await fetch(`${API_BASE}/vote/${bagId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || "Stemmen faalde")
  return data
}

/* ================= CAROUSEL ================= */
function setCarouselIndex(i) {
  if (!carouselBags.length) return
  carouselIndex = (i + carouselBags.length) % carouselBags.length
  renderCarousel()
}

function renderCarousel() {
  if (!carouselBags.length) {
    voteName.textContent = "Geen inzendingen"
    voteFlavor.textContent = ""
    voteColor.style.background = "#ddd"
    voteBtn.disabled = true
    prevBtn.disabled = true
    nextBtn.disabled = true

    if (votePreviewImg) {
      votePreviewImg.src = ""
      votePreviewImg.style.display = "none"
    }
    return
  }

  const b = carouselBags[carouselIndex]
  voteName.textContent = b.naam || "Zonder naam"
  voteFlavor.textContent = b.smaak || ""
  voteColor.style.background = b.kleur || "#ddd"

  if (votePreviewImg) {
    votePreviewImg.src = b.previewImage || ""
    votePreviewImg.style.display = b.previewImage ? "block" : "none"
  }

  voteBtn.disabled = false
  prevBtn.disabled = false
  nextBtn.disabled = false
}

async function buildCarousel() {
  const all = await loadBags()
  carouselBags = (all || []).filter(b => b._id !== myBagId)
  carouselIndex = 0
  renderCarousel()
}

/* ================= UI EVENTS ================= */
naamInput.addEventListener("focus", () => moveCamera(cameraPos.name))
naamInput.addEventListener("input", e => {
  const v = (e.target.value || "").replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 20)
  naamInput.value = v
  config.naam = v

  if (textMesh) {
    textMesh.material.map = v ? createTextTexture(v) : null
    textMesh.material.needsUpdate = true
  }

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
    if (bagMesh) bagMesh.material.color.set(config.kleur)
  })
})

if (imgGrid) {
  imgGrid.addEventListener("click", e => {
    const btn = e.target.closest(".img-card")
    if (!btn) return

    const filename = btn.dataset.img
    if (!filename) return

    imgGrid.querySelectorAll(".img-card").forEach(b => b.classList.remove("selected"))
    btn.classList.add("selected")

    setImageOnBag(filename)
  })
}

if (dot1) dot1.addEventListener("click", () => setStep(1))
if (dot2) dot2.addEventListener("click", () => {
  if (step1Valid()) setStep(2)
})
if (dot3) dot3.addEventListener("click", () => {
  if (step1Valid() && step2Valid()) setStep(3)
})
if (dot4) dot4.addEventListener("click", () => {
  if (step1Valid() && step2Valid() && step3Valid()) setStep(4)
})

if (nextBtnWizard) nextBtnWizard.addEventListener("click", () => {
  if (!step1Valid()) return
  setStep(2)
})
if (prevBtnWizard) prevBtnWizard.addEventListener("click", () => setStep(1))

if (nextBtnWizard2) nextBtnWizard2.addEventListener("click", () => {
  if (!step2Valid()) return
  setStep(3)
})
if (prevBtnWizard2) prevBtnWizard2.addEventListener("click", () => setStep(2))

if (nextBtnWizard3) nextBtnWizard3.addEventListener("click", () => {
  if (!step3Valid()) return
  setStep(4)
})
if (prevBtnWizard3) prevBtnWizard3.addEventListener("click", () => setStep(3))

startBtn.addEventListener("click", async () => {
  authStatus.textContent = ""
  statusP.textContent = ""

  try {
    await startGuestSession(userNameInput.value, userEmailInput.value)
    authStatus.textContent = "Ok, je kan nu verder"
    updateWizardButtons()
    setStep(2)
  } catch (e) {
    authStatus.textContent = e.message || "Kon niet starten"
  }
})

resetBtn.addEventListener("click", () => {
  clearSession()

  userNameInput.value = ""
  userEmailInput.value = ""
  authStatus.textContent = "Reset gedaan"
  statusP.textContent = ""
  voteStatus.textContent = ""

  hasSubmitted = false
  myBagId = null
  carouselBags = []
  carouselIndex = 0

  updateWizardButtons()
  updateSubmitState()
  setStep(1)
})

opslaanBtn.addEventListener("click", async () => {
  statusP.textContent = ""
  voteStatus.textContent = ""

  try {
    const saved = await saveBag()

    hasSubmitted = true
    myBagId = saved._id
    setSubmittedState(true, myBagId)

    statusP.textContent = "Inzending opgeslagen, je kan nu stemmen"
    moveCamera(cameraPos.default)

    await buildCarousel()
    openVoteOverlay()
  } catch (e) {
    statusP.textContent = e.message || "Fout bij opslaan"
  }
})

closeVoteBtn.addEventListener("click", () => closeVoteOverlay())
prevBtn.addEventListener("click", () => setCarouselIndex(carouselIndex - 1))
nextBtn.addEventListener("click", () => setCarouselIndex(carouselIndex + 1))

voteBtn.addEventListener("click", async () => {
  voteStatus.textContent = ""

  if (!carouselBags.length) return

  const b = carouselBags[carouselIndex]
  voteBtn.disabled = true
  voteBtn.textContent = "Bezig..."

  try {
    await voteForBag(b._id)
    voteStatus.textContent = `Gestemd op: ${b.naam || "chipszak"}`
    voteBtn.textContent = "Gestemd"
  } catch (e) {
    voteBtn.disabled = false
    voteBtn.textContent = "Stem"
    voteStatus.textContent = e.message || "Stemmen faalde"
  }
})

const u = getUserInfo()
if (u.name) userNameInput.value = u.name
if (u.email) userEmailInput.value = u.email

const s = getSubmittedState()
if (s.submitted && s.myBagId) {
  hasSubmitted = true
  myBagId = s.myBagId
  buildCarousel().then(() => openVoteOverlay()).catch(() => {})
}

updateWizardButtons()
updateSubmitState()
setStep(1)

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
