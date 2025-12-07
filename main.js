import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TextureLoader } from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

// Canvas
const canvas = document.getElementById("canvas");

// Scene
const scene = new THREE.Scene();

// Environment map (PNG)
const envTexture = new TextureLoader().load("/environments/environment1.png");
envTexture.mapping = THREE.EquirectangularReflectionMapping;

scene.environment = null;
scene.background = envTexture;

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.5, 3.5);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Licht
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(2, 4, 3);
dirLight.intensity = 0.9;
dirLight.castShadow = true;
scene.add(dirLight);

// Front light
const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
frontLight.position.set(0, 2, 4); 
frontLight.castShadow = false;
scene.add(frontLight);

// Rim light voor mooie randjes
const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
rimLight.position.set(-4, 3, -2);
scene.add(rimLight);

// Fill light om schaduwen zachter te maken
const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(2, 1, -2);
scene.add(fillLight);

// Vloer
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4),
  new THREE.MeshStandardMaterial({ color: "#ffffff" })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);


// Chipszak
const geo = new THREE.BoxGeometry(1, 1.6, 0.4, 16, 16, 16);
const mat = new THREE.MeshStandardMaterial({
  color: "#ffcc00",
  roughness: 0.4,
  metalness: 0.1
  
});
const bag = new THREE.Mesh(geo, mat);
bag.castShadow = true;
bag.position.y = 0.8;
scene.add(bag);

// Vervorming voor zachtere zak
for (let i = 0; i < geo.attributes.position.count; i++) {
  const y = geo.attributes.position.getY(i);
  if (y > 0.5 || y < -0.5) {
    geo.attributes.position.setZ(i, Math.sin(y * 3) * 0.08);
  }
}
geo.computeVertexNormals();

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 2;
controls.maxDistance = 6;

// UI elementen
const naamInput = document.getElementById("naamInput");
const kleurInput = document.getElementById("kleurInput");
const smaakSelect = document.getElementById("smaakSelect");
const nieuweSmaakInput = document.getElementById("nieuweSmaakInput");
const voegSmaakToeBtn = document.getElementById("voegSmaakToeBtn");
const opslaanBtn = document.getElementById("opslaanBtn");
const statusP = document.getElementById("status");

// Startsmaken
let smaken = ["Paprika", "Naturel", "BBQ", "Pickles"];

// Drop-down vullen
function updateSmaakDropdown() {
  smaakSelect.innerHTML = "";
  smaken.forEach(smaak => {
    const opt = document.createElement("option");
    opt.value = smaak;
    opt.textContent = smaak;
    smaakSelect.appendChild(opt);
  });
}
updateSmaakDropdown();

// Config object
const config = {
  naam: "",
  smaak: smaken[0],
  kleur: kleurInput.value
};

// kleur kiezen
kleurInput.addEventListener("input", () => {
  config.kleur = kleurInput.value;
  mat.color.set(config.kleur);
});

// smaak kiezen
smaakSelect.addEventListener("change", () => {
  config.smaak = smaakSelect.value;
});

// eigen smaak toevoegen
voegSmaakToeBtn.addEventListener("click", () => {
  const nieuwe = nieuweSmaakInput.value.trim();
  if (nieuwe === "") return;

  smaken.push(nieuwe);
  updateSmaakDropdown();
  smaakSelect.value = nieuwe;
  config.smaak = nieuwe;
  nieuweSmaakInput.value = "";
});

// naam
naamInput.addEventListener("input", () => {
  config.naam = naamInput.value;
});

// API versturen
opslaanBtn.addEventListener("click", async () => {
  if (!config.naam.trim()) {
    statusP.style.color = "red";
    statusP.textContent = "Vul een naam in.";
    return;
  }

  statusP.style.color = "black";
  statusP.textContent = "Bezig met versturen...";

  const payload = {
    naam: config.naam,
    smaak: config.smaak,
    kleur: config.kleur,
    toppings: [],
    datum: new Date().toISOString()
  };

  try {
    const res = await fetch("https://lays-api-6rne.onrender.com/bag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    statusP.style.color = "green";
    statusP.textContent = "Opgeslagen met id: " + data._id;
  } catch (err) {
    statusP.style.color = "red";
    statusP.textContent = "Er ging iets mis bij het opslaan.";
  }
});

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const gui = new GUI();

// Licht map
const lightFolder = gui.addFolder("Licht");
lightFolder.add(dirLight, "intensity", 0, 2, 0.01).name("Sterkte");

// Product map
const bagFolder = gui.addFolder("Chipszak");
bagFolder.add(bag.rotation, "y", -Math.PI, Math.PI, 0.01).name("Rotatie");
bagFolder.add(bag.scale, "x", 0.5, 2, 0.01).name("Schaal X");
bagFolder.add(bag.scale, "y", 0.5, 2, 0.01).name("Schaal Y");
bagFolder.add(bag.scale, "z", 0.5, 2, 0.01).name("Schaal Z");

lightFolder.open();
bagFolder.open();



// Animatie
function animate() {
  requestAnimationFrame(animate);
  bag.rotation.y += 0.006;
  controls.update();
  renderer.render(scene, camera);
}
animate();
