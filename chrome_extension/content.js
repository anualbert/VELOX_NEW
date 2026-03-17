console.log("VELOX Teacher Monitor Loaded");

const counters = new WeakMap()

let monitoring = false
const FRAME_INTERVAL = 2000

let currentClassId = "1";

// ==============================
// FIND GOOGLE MEET VIDEOS
// ==============================

function getMeetVideos() {

const videos = document.querySelectorAll("video")
const validVideos = []

videos.forEach(video => {

    const rect = video.getBoundingClientRect()

    // Relaxed constraints to ensure we catch all meeting tiles even if small
    if (rect.width < 50 || rect.height < 50) return
    if (video.readyState === 0) return // Skip videos that haven't loaded data

    validVideos.push(video)

})

return validVideos

}

// ==============================
// CREATE / UPDATE LABEL
// ==============================

function createLabel(video, text, color) {

let container = video.parentElement

if (!container) return

container.style.position = "relative"

let label = container.querySelector(".velox-label")

if (!label) {

    label = document.createElement("div")
    label.className = "velox-label"

    label.style.position = "absolute"
    label.style.top = "12px"
    label.style.left = "12px"
    label.style.padding = "8px 14px"
    label.style.fontSize = "14px"
    label.style.fontWeight = "700"
    label.style.borderRadius = "8px"
    label.style.color = "white"
    label.style.zIndex = "9999"
    label.style.pointerEvents = "none"
    label.style.boxShadow = "0 4px 10px rgba(0,0,0,0.35)"
    label.style.backdropFilter = "blur(4px)"

    // Google Meet hides overflow on some wrappers, destroying the label visibility
    container.style.overflow = "visible"

    container.appendChild(label)

}

label.innerText = text
label.style.background = color

}

// ==============================
// SEND FRAME TO BACKEND
// ==============================

async function analyzeVideo(video) {

const canvas = document.createElement("canvas")
canvas.width = 320
canvas.height = 240

const ctx = canvas.getContext("2d")

// Prevent dirty canvas taint which silently kills toBlob execution
video.crossOrigin = "anonymous";

ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

return new Promise((resolve) => {

    canvas.toBlob(async (blob) => {

        try {

            const formData = new FormData()
            formData.append("file", blob, "frame.jpg")
            formData.append("class_id", currentClassId)
            const participantName = getParticipantName(video)
            if (participantName) {
                formData.append("participant_name", participantName)
            }

            const res = await fetch("http://127.0.0.1:8000/infer_engagement", {
                method: "POST",
                body: formData
            })

            const data = await res.json()

            resolve(data)

        }

        catch (err) {

            console.error("VELOX backend error:", err.message, err)

            // If Chrome blocked the connection
            if (err.message.includes("Failed to fetch")) {
                console.error("VELOX: FATAL. Chrome blocked the connection to localhost. Check if backend is running or disabled block insecure content.");
            }

            resolve({
                score: 0,
                status: "Offline"
            })

        }

    }, "image/jpeg", 0.8)

})

}

// ==============================
// PROCESS ALL PARTICIPANTS
// ==============================

async function processParticipants() {

if (!monitoring) return

const videos = getMeetVideos()

for (let video of videos) {

    try {

        const result = await analyzeVideo(video)

        console.log("VELOX RESULT:", result)

        let score = result.score !== undefined ? result.score : 0;
        let status = result.status || "Unknown";
        const participantName = getParticipantName(video) || ""

        // --------------------------
        // NORMAL ENGAGEMENT DISPLAY
        // --------------------------

        let labelText = (participantName ? participantName + " • " : "") + status + " | " + score + "% Engagement"
        let color = "#16a34a"

        if (status === "STUDENT ABSENT") {
            labelText = "⚠ STUDENT ABSENT"
            color = "#ef4444"
        } else {
            if (score < 40) color = "#dc2626"
            else if (score < 70) color = "#f59e0b"
        }

        createLabel(video, labelText, color)

    }

    catch (err) {

        console.error("VELOX processing error:", err)

    }

}

// ==============================
// GET PARTICIPANT NAME PER TILE
// ==============================
function getParticipantName(video) {
    try {
        // Try to locate a reasonable "tile" container, then find the name text inside it.
        const tile =
            video.closest('div[role="listitem"]') ||
            video.closest('div[role="presentation"]') ||
            video.closest('div[jscontroller]') ||
            video.parentElement;

        if (!tile) return null;

        // Common pattern in Meet: name is a small text element near bottom of tile.
        const candidates = tile.querySelectorAll("span, div");
        for (const el of candidates) {
            const text = (el.textContent || "").trim();
            if (!text) continue;
            if (text.length < 2 || text.length > 40) continue;
            // Skip obvious non-name UI strings
            const lowered = text.toLowerCase();
            if (lowered.includes("presenting")) continue;
            if (lowered.includes("you")) continue;
            if (lowered.includes("% engagement")) continue;
            if (lowered.includes("muted")) continue;
            if (lowered.includes("camera")) continue;
            return text;
        }

        return null;
    } catch (e) {
        return null;
    }
}

}

// ==============================
// START MONITORING
// ==============================

let monitorInterval = null

function startMonitoring() {

if (monitoring) return

monitoring = true

console.log("VELOX Monitoring Started")

monitorInterval = setInterval(() => {

    processParticipants()

}, FRAME_INTERVAL)

}

// ==============================
// STOP MONITORING
// ==============================

function stopMonitoring() {

monitoring = false

if (monitorInterval) {

    clearInterval(monitorInterval)
    monitorInterval = null

}

console.log("VELOX Monitoring Stopped")

}

// ==============================
// EXTENSION MESSAGE LISTENER
// ==============================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

if (request.action === "INIT_MONITOR") {
    if (request.classId) currentClassId = request.classId;

    startMonitoring()
    sendResponse({ status: "started" })

}

if (request.action === "STOP_MONITOR") {

    stopMonitoring()
    sendResponse({ status: "stopped" })

}

})

// ==============================
// AUTO-RESUME ON PAGE REFRESH
// ==============================

chrome.storage.local.get(['isMonitoring', 'studentId', 'classId'], (result) => {
    if (result.classId) currentClassId = result.classId;
    if (result.isMonitoring) {
        console.log("VELOX: Auto-resuming monitor from storage");
        startMonitoring();
    }
});