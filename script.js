let timer;
let isRunning = false;
let timeLeft = settings.workDuration * 60; // Use settings for initial work duration
let isWorkSession = true;
let pomodoroCount = 0;
let isLongBreak = false;
let timerEndTime = null; // Track when the timer should end
let autoContinue = false; // Auto-continue to next session

// Settings variables
let settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 30
};

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const toggleButton = document.getElementById('toggle');
const resetButton = document.getElementById('reset');
const currentSession = document.getElementById('current-session');
const nextSession = document.getElementById('next-session');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const eventList = document.getElementById('event-list');
const clearLogButton = document.getElementById('clear-log');
const autoContinueToggle = document.getElementById('auto-continue-toggle');

// Settings functions
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
    // Update input values
    workDurationInput.value = settings.workDuration;
    shortBreakDurationInput.value = settings.shortBreakDuration;
    longBreakDurationInput.value = settings.longBreakDuration;
}

function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    logEvent('Settings saved');
}

function resetSettings() {
    settings = {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 30
    };
    workDurationInput.value = settings.workDuration;
    shortBreakDurationInput.value = settings.shortBreakDuration;
    longBreakDurationInput.value = settings.longBreakDuration;
    saveSettings();
    logEvent('Settings reset to defaults');
}

function updateTimerFromSettings() {
    if (isWorkSession && !isLongBreak) {
        timeLeft = settings.workDuration * 60;
    } else if (isLongBreak) {
        timeLeft = settings.longBreakDuration * 60;
    } else {
        timeLeft = settings.shortBreakDuration * 60;
    }
    updateDisplay();
    updateSessionInfo();
}

// Modal functions
function openSettingsModal() {
    settingsModal.style.display = 'block';
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

function playBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function logEvent(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const li = document.createElement('li');
    li.textContent = `${timeString}: ${message}`;
    eventList.insertBefore(li, eventList.firstChild); // Add to top instead of bottom
    updateClearButtonState();
}

function updateClearButtonState() {
    clearLogButton.disabled = eventList.children.length === 0;
}

function clearLog() {
    if (eventList.children.length > 0) {
        logEvent('Event log cleared');
        eventList.innerHTML = '';
        updateClearButtonState();
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

function updateSessionInfo() {
    if (isWorkSession) {
        const currentWorkSession = (pomodoroCount % 4) + 1;
        currentSession.textContent = `Current Session: Work (${settings.workDuration} min)`;
        nextSession.textContent = pomodoroCount % 4 === 3 ? `Next: Long Break (${settings.longBreakDuration} min)` : `Next: Short Break (${settings.shortBreakDuration} min)`;
        updateCycleProgress(currentWorkSession, true);
    } else {
        if (isLongBreak) {
            currentSession.textContent = `Current Session: Long Break (${settings.longBreakDuration} min)`;
            nextSession.textContent = `Next: Work (${settings.workDuration} min)`;
            updateCycleProgress(4, false, true); // Long break after 4th work session
        } else {
            const currentWorkSession = pomodoroCount % 4 || 4; // Handle case where we're in break after 4th session
            currentSession.textContent = `Current Session: Short Break (${settings.shortBreakDuration} min)`;
            nextSession.textContent = `Next: Work (${settings.workDuration} min)`;
            updateCycleProgress(currentWorkSession, false, false);
        }
    }
}

function updateCycleProgress(workSession, isWork, isLongBreak = false) {
    // Update progress dots
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => {
        if (isWork && index < workSession) {
            dot.classList.add('active');
        } else if (!isWork && !isLongBreak && index < workSession - 1) {
            dot.classList.add('active');
        } else if (isLongBreak) {
            dot.classList.add('active'); // All dots active during long break
        } else {
            dot.classList.remove('active');
        }
    });

    // Update cycle info text
    const cycleInfo = document.getElementById('cycle-info');
    if (isWork) {
        cycleInfo.textContent = `Cycle Progress: Work Session ${workSession} of 4`;
    } else if (isLongBreak) {
        cycleInfo.textContent = `Cycle Progress: Long Break (${settings.longBreakDuration} min)`;
    } else {
        cycleInfo.textContent = `Cycle Progress: Break after Work Session ${workSession}`;
    }
}

function toggleTimer() {
    if (isRunning) {
        // Pause the timer
        clearInterval(timer);
        isRunning = false;
        // Recalculate timeLeft based on remaining time
        if (timerEndTime) {
            timeLeft = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
        }
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        logEvent(`Timer paused with ${minutes}:${seconds.toString().padStart(2, '0')} remaining`);
        toggleButton.textContent = 'Resume';
    } else {
        // Start or resume the timer
        isRunning = true;
        const wasPaused = toggleButton.textContent === 'Resume';
        logEvent(wasPaused ? 'Timer resumed' : 'Timer started');
        toggleButton.textContent = 'Pause';
        // Set end time based on remaining time
        timerEndTime = Date.now() + (timeLeft * 1000);

        timer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((timerEndTime - now) / 1000));

            if (remaining !== timeLeft) {
                timeLeft = remaining;
                updateDisplay();
            }

            if (timeLeft <= 0) {
                clearInterval(timer);
                isRunning = false;
                timerEndTime = null;
                notifyUser();
                switchSession();

                if (autoContinue) {
                    // Automatically start the next session
                    logEvent('Auto-continuing to next session');
                    setTimeout(() => {
                        toggleTimer(); // Start the next timer automatically
                    }, 1000); // Small delay for user feedback
                } else {
                    toggleButton.textContent = 'Start';
                }
            }
        }, 100); // Check more frequently (every 100ms) for better accuracy
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timerEndTime = null;
    timeLeft = settings.workDuration * 60;
    isWorkSession = true;
    pomodoroCount = 0;
    isLongBreak = false;
    toggleButton.textContent = 'Start';
    logEvent('Timer reset');
    updateDisplay();
    updateSessionInfo();
    updateCycleProgress(1, true); // Reset to first work session
}

function switchSession() {
    const wasWork = isWorkSession;
    if (isWorkSession) {
        pomodoroCount++;
        if (pomodoroCount % 4 === 0) {
            timeLeft = settings.longBreakDuration * 60; // Long break
            isLongBreak = true;
        } else {
            timeLeft = settings.shortBreakDuration * 60; // Short break
            isLongBreak = false;
        }
        isWorkSession = false;
    } else {
        timeLeft = settings.workDuration * 60; // Back to work
        isWorkSession = true;
        isLongBreak = false;
    }
    updateDisplay();
    updateSessionInfo();
    logEvent(wasWork ? 'Work session completed' : (isLongBreak ? 'Long break completed' : 'Short break completed'));
}

function notifyUser() {
    playBeep();
    const message = isWorkSession ? 'Work session complete! Time for a break.' : (isLongBreak ? 'Long break over! Back to work.' : 'Short break over! Back to work.');
    if (Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
            body: message,
            icon: 'https://example.com/icon.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Pomodoro Timer', {
                    body: message,
                    icon: 'https://example.com/icon.png'
                });
            }
        });
    }
    alert(message);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark);
    logEvent(`Switched to ${isDark ? 'dark' : 'light'} mode`);
}

// Load dark mode preference
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
} else {
    darkModeToggle.textContent = '🌙';
}

// Load auto-continue preference
const savedAutoContinue = localStorage.getItem('autoContinue');
if (savedAutoContinue === 'true') {
    autoContinue = true;
    autoContinueToggle.checked = true;
}

toggleButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', resetTimer);
darkModeToggle.addEventListener('click', toggleDarkMode);
clearLogButton.addEventListener('click', clearLog);
autoContinueToggle.addEventListener('change', (e) => {
    autoContinue = e.target.checked;
    localStorage.setItem('autoContinue', autoContinue);
    logEvent(`Auto-continue ${autoContinue ? 'enabled' : 'disabled'}`);
});

// Settings modal event listeners
settingsToggle.addEventListener('click', openSettingsModal);
closeSettings.addEventListener('click', closeSettingsModal);

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettingsModal();
    }
});

saveSettingsButton.addEventListener('click', () => {
    settings.workDuration = parseInt(workDurationInput.value);
    settings.shortBreakDuration = parseInt(shortBreakDurationInput.value);
    settings.longBreakDuration = parseInt(longBreakDurationInput.value);
    saveSettings();
    updateTimerFromSettings();
    closeSettingsModal();
});

resetSettingsButton.addEventListener('click', () => {
    resetSettings();
    updateTimerFromSettings();
    closeSettingsModal();
});

// Load settings and initialize
loadSettings();

// Initialize clear button state
updateClearButtonState();

updateDisplay();
updateSessionInfo();
updateCycleProgress(1, true); // Initialize to first work session