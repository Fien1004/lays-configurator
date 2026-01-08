// src/shared/storage.js
const TOKEN_KEY = "lays_token"
const USERNAME_KEY = "lays_username"
const EMAIL_KEY = "lays_email"
const SUBMITTED_KEY = "lays_submitted"
const MY_BAG_ID_KEY = "lays_my_bag_id"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t)
}
export function setUserInfo(name, email) {
  localStorage.setItem(USERNAME_KEY, name)
  localStorage.setItem(EMAIL_KEY, email)
}
export function getUserInfo() {
  return {
    name: localStorage.getItem(USERNAME_KEY) || "",
    email: localStorage.getItem(EMAIL_KEY) || ""
  }
}
export function setSubmittedState(submitted, myBagId) {
  localStorage.setItem(SUBMITTED_KEY, submitted ? "1" : "0")
  localStorage.setItem(MY_BAG_ID_KEY, myBagId || "")
}
export function getSubmittedState() {
  return {
    submitted: localStorage.getItem(SUBMITTED_KEY) === "1",
    myBagId: localStorage.getItem(MY_BAG_ID_KEY) || ""
  }
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(SUBMITTED_KEY)
  localStorage.removeItem(MY_BAG_ID_KEY)
}
