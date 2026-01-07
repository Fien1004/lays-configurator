import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { showLoader, hideLoader, setLoaderProgress } from "./loader.js"

const loadingManager = new THREE.LoadingManager()

loadingManager.onStart = () => {
  showLoader()
  setLoaderProgress(0)
}

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const pct = (itemsLoaded / itemsTotal) * 100
  setLoaderProgress(pct)
}

loadingManager.onLoad = () => {
  setLoaderProgress(100)
  setTimeout(() => hideLoader(), 200)
}

loadingManager.onError = (url) => {
  console.error("Error loading:", url)
}

export const textureLoader = new THREE.TextureLoader(loadingManager)
export const gltfLoader = new GLTFLoader(loadingManager)

loadingManager.onLoad = () => {
  setLoaderProgress(100)
  document.getElementById("app")?.classList.remove("hidden")
  setTimeout(() => hideLoader(), 150)
}
