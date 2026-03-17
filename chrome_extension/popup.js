document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const classInput = document.getElementById('classId');
    const statusDiv = document.getElementById('status');
    const inputsDiv = document.getElementById('inputs');

    // Load State
    chrome.storage.local.get(['isMonitoring', 'classId'], (result) => {
        if (result.isMonitoring) {
            showRunningState();
            if (result.classId) classInput.value = result.classId;
        }
    });

    startBtn.addEventListener('click', () => {
        const cId = classInput.value;

        if (!cId) {
            statusDiv.innerText = "Please enter Class ID";
            statusDiv.style.color = "#f87171";
            return;
        }

        chrome.runtime.sendMessage({
            action: "START_MONITORING",
            classId: cId
        }, (response) => {
            showRunningState();
        });
    });

    stopBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "STOP_MONITORING" }, (response) => {
            showStoppedState();
        });
    });

    function showRunningState() {
        startBtn.style.display = 'none';
        inputsDiv.style.display = 'none';
        stopBtn.style.display = 'block';
        statusDiv.innerText = "Monitoring Active";
        statusDiv.style.color = "#34d399";
    }

    function showStoppedState() {
        startBtn.style.display = 'block';
        inputsDiv.style.display = 'block';
        stopBtn.style.display = 'none';
        statusDiv.innerText = "Monitoring Stopped";
        statusDiv.style.color = "#94a3b8";
    }
});
