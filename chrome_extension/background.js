// Background Service Worker
// Handles installation and state management

chrome.runtime.onInstalled.addListener(() => {
    console.log("VELOX Extension Installed");
    chrome.storage.local.set({ isMonitoring: false, classId: null });
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START_MONITORING") {
        console.log("Starting monitoring for class", request.classId);
        chrome.storage.local.set({
            isMonitoring: true,
            classId: request.classId
        });

        // Inject content script if not already running (managed by manifest usually, but good to trigger)
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "INIT_MONITOR",
                    classId: request.classId
                });
            }
        });

        sendResponse({ status: "started" });
    }

    if (request.action === "STOP_MONITORING") {
        chrome.storage.local.set({ isMonitoring: false });
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "STOP_MONITOR" });
            }
        });
        sendResponse({ status: "stopped" });
    }
});
