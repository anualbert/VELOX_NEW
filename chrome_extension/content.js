console.log("VELOX Teacher Monitor Loaded");

const counters = new WeakMap()

let monitoring = false
const FRAME_INTERVAL = 2000

// ==============================
// FIND GOOGLE MEET VIDEOS
// ==============================

function getMeetVideos() {

const videos = document.querySelectorAll("video")
const validVideos = []

videos.forEach(video => {

    const rect = video.getBoundingClientRect()

    if (rect.width < 200 || rect.height < 150) return

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

ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

return new Promise((resolve) => {

    canvas.toBlob(async (blob) => {

        try {

            const formData = new FormData()
            formData.append("file", blob, "frame.jpg")
            formData.append("student_id", "1")
            formData.append("class_id", "1")

            const res = await fetch("http://127.0.0.1:8000/infer_engagement", {
                method: "POST",
                body: formData
            })

            const data = await res.json()

            resolve(data)

        }

        catch (err) {

            console.error("VELOX backend error:", err)

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

        let score = result.score || 0
        let status = result.status || "Unknown"

        // create counter per participant
        if (!counters.has(video)) {
            counters.set(video, { sleepy:0, away:0, noface:0 })
        }

        const counter = counters.get(video)

        // --------------------------
        // NO FACE DETECTED
        // --------------------------

        if (status === "no_face") {

            counter.noface++

            if (counter.noface > 3) {

                createLabel(video, "⚠ Student Absent", "#ef4444")
                console.warn("VELOX ALERT: No face detected")

            }

            continue

        } else {

            counter.noface = 0

        }

        // --------------------------
        // SLEEP DETECTION
        // --------------------------

        if (result.sleepy || result.eye_closed) {

            counter.sleepy++

            if (counter.sleepy > 5) {

                createLabel(video, "⚠ Student Sleepy", "#f59e0b")
                console.warn("VELOX ALERT: Eyes closed too long")

                continue

            }

        } else {

            counter.sleepy = 0

        }

        // --------------------------
        // YAWNING
        // --------------------------

        if (result.yawning) {

            createLabel(video, "⚠ Yawning Detected", "#f97316")
            continue

        }

        // --------------------------
        // PHONE USAGE
        // --------------------------

        if (result.looking_down) {

            createLabel(video, "⚠ Using Phone", "#ef4444")
            continue

        }

        // --------------------------
        // LOOKING AWAY
        // --------------------------

        if (result.looking_away) {

            counter.away++

            if (counter.away > 3) {

                createLabel(video, "⚠ Looking Away", "#f59e0b")
                console.warn("VELOX ALERT: Looking away")

                continue

            }

        } else {

            counter.away = 0

        }

        // --------------------------
        // NORMAL ENGAGEMENT DISPLAY
        // --------------------------

        let labelText = status + " | " + score + "% Engagement"

        let color = "#16a34a"

        if (score < 40) color = "#dc2626"
        else if (score < 70) color = "#f59e0b"

        createLabel(video, labelText, color)

    }

    catch (err) {

        console.error("VELOX processing error:", err)

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

    startMonitoring()
    sendResponse({ status: "started" })

}

if (request.action === "STOP_MONITOR") {

    stopMonitoring()
    sendResponse({ status: "stopped" })

}

})