// src/ui/dom.js
export function getDom() {
  return {
    // step 1
    userNameInput: document.getElementById("userNameInput"),
    userEmailInput: document.getElementById("userEmailInput"),
    authStatus: document.getElementById("authStatus"),
    nextBtnWizard: document.getElementById("nextBtnWizard"),

    // step 2
    naamInput: document.getElementById("naamInput"),
    nextBtnWizard2: document.getElementById("nextBtnWizard2"),
    prevBtnWizard: document.getElementById("prevBtnWizard"),

    // step 3
    smaakInput: document.getElementById("smaakInput"),
    nextBtnWizard3: document.getElementById("nextBtnWizard3"),
    prevBtnWizard2: document.getElementById("prevBtnWizard2"),

    // step 4
    opslaanBtn: document.getElementById("opslaanBtn"),
    prevBtnWizard3: document.getElementById("prevBtnWizard3"),
    statusP: document.getElementById("status"),

    // shared inputs
    kleurButtons: document.querySelectorAll(".kleur-btn"),
    imgGrid: document.getElementById("imgGrid"),

    // steps containers
    step1El: document.getElementById("step1"),
    step2El: document.getElementById("step2"),
    step3El: document.getElementById("step3"),
    step4El: document.getElementById("step4"),

    // dots
    dot1: document.getElementById("dot1"),
    dot2: document.getElementById("dot2"),
    dot3: document.getElementById("dot3"),
    dot4: document.getElementById("dot4"),

    // voting
    voteOverlay: document.getElementById("voteOverlay"),
    closeVoteBtn: document.getElementById("closeVoteBtn"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    voteBtn: document.getElementById("voteBtn"),
    voteStatus: document.getElementById("voteStatus"),
    voteName: document.getElementById("voteName"),
    voteFlavor: document.getElementById("voteFlavor"),
    voteColor: document.getElementById("voteColor"),
    votePreviewImg: document.getElementById("votePreviewImg"),

    // three
    canvas: document.getElementById("canvas")
  }
}
