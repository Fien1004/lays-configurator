import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { TextureLoader } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import gsap from "gsap"

/* ================= UI ================= */
const naamInput = document.getElementById("naamInput")
const smaakInput = document.getElementById("smaakInput")
const kleurButtons = document.querySelectorAll(".kleur-btn")
const opslaanBtn = document.getElementById("opslaanBtn")

const config = {
  naam: "",
  smaak: "",
  kleur: "#F1B11B"
}

function updateSubmitState() {
  opslaanBtn.disabled = !(config.naam && config.smaak)
}
updateSubmitState()

/* ================= THREE ================= */
const canvas = document.getElementById("canvas")
const scene = new THREE.Scene()

const envTexture = new TextureLoader().load("/environments/environment1.png")
envTexture.mapping = THREE.EquirectangularReflectionMapping
scene.background = envTexture

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.set(0, 0.6, 2)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true

/* ================= LIGHTS ================= */
scene.add(new THREE.AmbientLight(0xffffff, 0.8))

const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(2, 4, 3)
dirLight.castShadow = true
scene.add(dirLight)

/* ================= FLOOR ================= */
const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 0.1, 64),
  new THREE.MeshStandardMaterial({ color: "#ffffff" })
)
floor.position.set(0, -0.8, -0.2)
floor.scale.set(1.4, 1, 1.4)
floor.receiveShadow = true
scene.add(floor)

/* ================= CONTROLS ================= */
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enablePan = false
controls.minAzimuthAngle = -Math.PI * 0.25
controls.maxAzimuthAngle = Math.PI * 0.25
controls.minPolarAngle = Math.PI * 0.35
controls.maxPolarAngle = Math.PI * 0.65
controls.target.set(0, 0.45, 0)
controls.update()

/* ================= CAMERA ANIM ================= */
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

/* ================= TEXTURE ================= */
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

/* ================= MODEL ================= */
let bagRoot = null
let bagMesh = null
let textMesh = null

new GLTFLoader().load("/models/Lays_Bag_Arthur.glb", gltf => {
  bagRoot = gltf.scene
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
        envMapIntensity: 0.2,
        flatShading: false
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
      textMesh.material = new THREE.MeshBasicMaterial({
        transparent: true
      })

      const initialText = "Mijn Chipszak"
      textMesh.material.map = createTextTexture(initialText)
      textMesh.material.needsUpdate = true

      config.naam = initialText
      naamInput.value = initialText
      updateSubmitState()

      c.renderOrder = 30
    }

    if (c.name === "Plane_Bottom") {
      c.visible = false
      c.castShadow = false
      c.receiveShadow = false

      if (c.material) {
        c.material.depthWrite = true
        c.material.needsUpdate = true
      }

      c.renderOrder = 10
    }
  })
  

  scene.add(bagRoot)
})

/* ================= UI EVENTS ================= */
naamInput.addEventListener("focus", () => moveCamera(cameraPos.name))
naamInput.addEventListener("input", e => {
  const v = e.target.value.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 20)
  naamInput.value = v
  config.naam = v

  if (textMesh) {
    textMesh.material.map = v ? createTextTexture(v) : null
    textMesh.material.needsUpdate = true
  }

  updateSubmitState()
})

smaakInput.addEventListener("focus", () => moveCamera(cameraPos.flavor))
smaakInput.addEventListener("input", e => {
  config.smaak = e.target.value
  updateSubmitState()
})

kleurButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    kleurButtons.forEach(b => b.classList.remove("active"))
    btn.classList.add("active")

    config.kleur = btn.dataset.color
    if (bagMesh) bagMesh.material.color.set(config.kleur)

    moveCamera(cameraPos.color)
  })
})

opslaanBtn.addEventListener("click", async () => {
  const statusP = document.getElementById("status")
  try {
    await fetch("https://lays-api-6rne.onrender.com/bag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        naam: config.naam,
        smaak: config.smaak,
        kleur: config.kleur,
        datum: new Date().toISOString()
      })
    })
    statusP.textContent = "Inzending opgeslagen"
    moveCamera(cameraPos.default)
  } catch {
    statusP.textContent = "Fout bij opslaan"
  }
})

/* ================= LOOP ================= */
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
