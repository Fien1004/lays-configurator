import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { TextureLoader } from "three"

// Canvas
const canvas = document.getElementById("canvas")

// Scene
const scene = new THREE.Scene()

// Environment background
const envTexture = new TextureLoader().load("/environments/environment1.png")
envTexture.mapping = THREE.EquirectangularReflectionMapping
scene.background = envTexture
scene.environment = null

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.set(0, 0, 1.8)

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Licht
scene.add(new THREE.AmbientLight(0xffffff, 0.8))

const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(2, 4, 3)
dirLight.castShadow = true
scene.add(dirLight)

const frontLight = new THREE.DirectionalLight(0xffffff, 1.2)
frontLight.position.set(0, 2, 4)
scene.add(frontLight)

const rimLight = new THREE.DirectionalLight(0xffffff, 0.6)
rimLight.position.set(-4, 3, -2)
scene.add(rimLight)

const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
fillLight.position.set(2, 1, -2)
scene.add(fillLight)

// Vloer
const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5, 1.5, 0.1, 100),
  new THREE.MeshStandardMaterial({ color: "#ffffff" })
)
floor.receiveShadow = true
floor.position.y = -0.8
floor.position.z = -0.2
floor.scale.set(1.4, 1, 1.4)
scene.add(floor)

// Chipszak
const bagGeometry = new THREE.BoxGeometry(1, 1.6, 0.4, 16, 16, 16)
const bagMaterial = new THREE.MeshStandardMaterial({
  color: "#F1B11B",
  roughness: 0.4,
  metalness: 0.1
})
const bag = new THREE.Mesh(bagGeometry, bagMaterial)
bag.position.y = 0
bag.castShadow = true
scene.add(bag)

// Zachte vervorming
for (let i = 0; i < bagGeometry.attributes.position.count; i++) {
  const y = bagGeometry.attributes.position.getY(i)
  if (y > 0.5 || y < -0.5) {
    bagGeometry.attributes.position.setZ(i, Math.sin(y * 3) * 0.08)
  }
}
bagGeometry.computeVertexNormals()

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.minDistance = 1.6
controls.maxDistance = 3
controls.maxPolarAngle = Math.PI / 2
controls.target.set(0, 0, 0)
controls.update()

// UI
const naamInput = document.getElementById("naamInput")
const smaakInput = document.getElementById("smaakInput")
const kleurButtons = document.querySelectorAll(".kleur-btn")
const opslaanBtn = document.getElementById("opslaanBtn")
const statusP = document.getElementById("status")

// State
const config = {
  naam: "",
  smaak: "",
  kleur: "#F1B11B"
}

// Helper
function updateSubmitState() {
  opslaanBtn.disabled = !(config.naam && config.smaak)
}

// Naam input
naamInput.addEventListener("input", () => {
  let value = naamInput.value
  value = value.replace(/[^a-zA-Z0-9 ]/g, "")
  value = value.slice(0, 16).toUpperCase()

  naamInput.value = value
  config.naam = value

  updateSubmitState()
})

// Smaak input
smaakInput.addEventListener("input", () => {
  let value = smaakInput.value
  value = value.replace(/[^a-zA-Z0-9 ]/g, "")
  value = value.slice(0, 20)

  smaakInput.value = value
  config.smaak = value

  updateSubmitState()
})

// Kleur kiezen
kleurButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    kleurButtons.forEach(b => b.classList.remove("active"))
    btn.classList.add("active")

    const kleur = btn.dataset.color
    config.kleur = kleur
    bagMaterial.color.set(kleur)
  })
})

// Submit
opslaanBtn.addEventListener("click", async () => {
  statusP.textContent = "Bezig met versturen..."

  const payload = {
    naam: config.naam,
    smaak: config.smaak,
    kleur: config.kleur,
    datum: new Date().toISOString()
  }

  try {
    const res = await fetch("https://lays-api-6rne.onrender.com/bag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    await res.json()
    statusP.textContent = "Inzending opgeslagen"
  } catch {
    statusP.textContent = "Fout bij opslaan"
  }
})

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Animate
function animate() {
  requestAnimationFrame(animate)
  bag.rotation.y += 0.006
  controls.update()
  renderer.render(scene, camera)
}
animate()
