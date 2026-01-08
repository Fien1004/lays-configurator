// src/shared/api.js
import { getToken, setToken, setUserInfo } from "./storage.js"

export const API_BASE = import.meta.env.VITE_API_BASE

console.log("API_BASE =", import.meta.env.VITE_API_BASE)

export async function startGuestSession(username, email) {
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

export async function loadBags() {
  const res = await fetch(`${API_BASE}/bag`)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || "Kon inzendingen niet laden")
  return data
}

export async function saveBag(payload) {
  const token = getToken()
  if (!token) throw new Error("Vul je gegevens in stap 1 in")

  const res = await fetch(`${API_BASE}/bag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || "Fout bij opslaan")
  return data
}

export async function voteForBag(bagId, hasSubmitted) {
  const token = getToken()
  if (!token) throw new Error("Vul je gegevens in stap 1 in")
  if (!hasSubmitted) throw new Error("Dien eerst je eigen chipszak in")

  const res = await fetch(`${API_BASE}/vote/${bagId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || "Stemmen faalde")
  return data
}
