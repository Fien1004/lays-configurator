import * as THREE from "three"

// Scene
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 1, 3)

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight)

// Licht
const light = new THREE.AmbientLight(0xffffff, 1)
scene.add(light)

// Kubus als chipszak placeholder
const geometry = new THREE.BoxGeometry(1, 1.4, 0.3)
const material = new THREE.MeshStandardMaterial({ color: "yellow" })
const bag = new THREE.Mesh(geometry, material)
scene.add(bag)

// Config object
const config = {
  naam: "Test Chips",
  smaak: "Paprika"
}

// UI elementen
const naamInput = document.getElementById("naamInput")
const smaakSelect = document.getElementById("smaakSelect")
const opslaanBtn = document.getElementById("opslaanBtn")
const statusP = document.getElementById("status")

naamInput.value = config.naam
smaakSelect.value = config.smaak

// kleur aanpassen
function updateColorForFlavor(smaak) {
  if (smaak === "Paprika") material.color.set("#ffcc00")
  if (smaak === "Naturel") material.color.set("#f5e6b3")
  if (smaak === "BBQ") material.color.set("#cc6600")
  if (smaak === "Pickles") material.color.set("#99cc00")
}

updateColorForFlavor(config.smaak)

// input listeners
naamInput.addEventListener("input", () => {
  config.naam = naamInput.value
})

smaakSelect.addEventListener("change", () => {
  config.smaak = smaakSelect.value
  updateColorForFlavor(config.smaak)
})

// POST naar API
opslaanBtn.addEventListener("click", async () => {
  statusP.textContent = "Bezig met versturen..."

  try {
    const res = await fetch("https://lays-api-6rne.onrender.com/bag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    })

    const data = await res.json()
    statusP.textContent = "Opgeslagen met id: " + data._id
  } catch (err) {
    statusP.textContent = "Er ging iets mis bij het opslaan"
  }
})

// animatie
function animate() {
  requestAnimationFrame(animate)
  bag.rotation.y += 0.01
  renderer.render(scene, camera)
}

animate()
