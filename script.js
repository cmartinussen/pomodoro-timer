let timer;
let isRunning = false;
let isWorkSession = true;
let pomodoroCount = 0;
let isLongBreak = false;
let timerEndTime = null; // Track when the timer should end
let autoContinue = true; // Auto-continue to next session (default on)
let soundEnabled = true; // Sound notifications (default on)
let audioContext = null;
let audioUnlocked = false;

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {
            logEvent('Offline support unavailable');
        });
    });
}

// Settings variables
let settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 30,
    popupAlerts: false
};
let timeLeft = settings.workDuration * 60; // Use settings for initial work duration

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const toggleButton = document.getElementById('toggle');
const resetButton = document.getElementById('reset');
const nextSession = document.getElementById('next-session');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const eventList = document.getElementById('event-list');
const clearLogButton = document.getElementById('clear-log');
const autoContinueToggle = document.getElementById('auto-continue-toggle');
const settingsToggle = document.getElementById('settings-toggle');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const saveSettingsButton = document.getElementById('save-settings');
const resetSettingsButton = document.getElementById('reset-settings');
const workDurationInput = document.getElementById('work-duration');
const shortBreakDurationInput = document.getElementById('short-break-duration');
const longBreakDurationInput = document.getElementById('long-break-duration');
const soundEnabledToggle = document.getElementById('sound-enabled-toggle');
const popupAlertsToggle = document.getElementById('popup-alerts-toggle');
const sessionVisual = document.getElementById('session-visual');
const sessionIcon = document.getElementById('session-icon');

// Settings functions
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            settings = {
                workDuration: Number(parsedSettings.workDuration) || 25,
                shortBreakDuration: Number(parsedSettings.shortBreakDuration) || 5,
                longBreakDuration: Number(parsedSettings.longBreakDuration) || 30,
                popupAlerts: parsedSettings.popupAlerts === true
            };
        } catch {
            settings = {
                workDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 30,
                popupAlerts: false
            };
        }
    }
    // Update input values
    workDurationInput.value = settings.workDuration;
    shortBreakDurationInput.value = settings.shortBreakDuration;
    longBreakDurationInput.value = settings.longBreakDuration;
    popupAlertsToggle.checked = settings.popupAlerts;
}

function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    logEvent('Settings saved');
}

function resetSettings() {
    settings = {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 30,
        popupAlerts: false
    };
    workDurationInput.value = settings.workDuration;
    shortBreakDurationInput.value = settings.shortBreakDuration;
    longBreakDurationInput.value = settings.longBreakDuration;
    popupAlertsToggle.checked = settings.popupAlerts;
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

function initAudioContext() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioContext = new AudioContextClass();
        }
    }
    return audioContext;
}

function unlockAudioContext() {
    const context = initAudioContext();
    if (!context) {
        return;
    }

    const markUnlocked = () => {
        if (context.state === 'running') {
            // Prime the graph with a silent oscillator; Safari often needs this.
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            gainNode.gain.setValueAtTime(0, context.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.01);
            audioUnlocked = true;
        }
    };

    if (context.state === 'suspended') {
        context.resume().then(markUnlocked).catch(() => {});
    } else {
        markUnlocked();
    }
}

function playBeep() {
    if (!soundEnabled) {
        return false;
    }

    const context = initAudioContext();
    if (!context) {
        return false;
    }

    if (context.state === 'suspended') {
        context.resume().catch(() => {});
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.setValueAtTime(800, context.currentTime); // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
    return true;
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

function updateSessionVisual(sessionType) {
    if (!sessionVisual || !sessionIcon) {
        return;
    }

    sessionVisual.classList.remove('work', 'short-break', 'long-break');

    if (sessionType === 'work') {
        sessionVisual.classList.add('work');
        sessionIcon.textContent = '💼';
    } else if (sessionType === 'long-break') {
        sessionVisual.classList.add('long-break');
        sessionIcon.textContent = '🌴';
    } else {
        sessionVisual.classList.add('short-break');
        sessionIcon.textContent = '☕';
    }
}

function updateSessionInfo() {
    if (isWorkSession) {
        const currentWorkSession = (pomodoroCount % 4) + 1;
        nextSession.textContent = pomodoroCount % 4 === 3 ? `Next: Long Break (${settings.longBreakDuration} min)` : `Next: Short Break (${settings.shortBreakDuration} min)`;
        updateSessionVisual('work');
        updateCycleProgress(currentWorkSession, true);
    } else {
        if (isLongBreak) {
            nextSession.textContent = `Next: Work (${settings.workDuration} min)`;
            updateSessionVisual('long-break');
            updateCycleProgress(4, false, true); // Long break after 4th work session
        } else {
            const currentWorkSession = pomodoroCount % 4 || 4; // Handle case where we're in break after 4th session
            nextSession.textContent = `Next: Work (${settings.workDuration} min)`;
            updateSessionVisual('short-break');
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
        } else if (!isWork && !isLongBreak && index < workSession) {
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
        if (!audioUnlocked) {
            unlockAudioContext();
        }
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
    const didPlaySound = playBeep();
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

    if (settings.popupAlerts) {
        if (didPlaySound) {
            // Give Safari a moment to start audio before opening a blocking alert.
            setTimeout(() => {
                alert(message);
            }, 550);
        } else {
            alert(message);
        }
    }
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
if (savedAutoContinue !== null) {
    autoContinue = savedAutoContinue === 'true';
}
autoContinueToggle.checked = autoContinue;

const savedSoundEnabled = localStorage.getItem('soundEnabled');
if (savedSoundEnabled !== null) {
    soundEnabled = savedSoundEnabled === 'true';
}
soundEnabledToggle.checked = soundEnabled;

toggleButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', resetTimer);
darkModeToggle.addEventListener('click', toggleDarkMode);
clearLogButton.addEventListener('click', clearLog);
autoContinueToggle.addEventListener('change', (e) => {
    autoContinue = e.target.checked;
    localStorage.setItem('autoContinue', autoContinue);
    logEvent(`Auto-continue ${autoContinue ? 'enabled' : 'disabled'}`);
});

soundEnabledToggle.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
    localStorage.setItem('soundEnabled', soundEnabled);
    logEvent(`Sound notifications ${soundEnabled ? 'enabled' : 'disabled'}`);
});

// Safari requires audio to be unlocked by a user gesture.
document.addEventListener('click', unlockAudioContext, { once: true });
document.addEventListener('touchstart', unlockAudioContext, { once: true });
document.addEventListener('keydown', unlockAudioContext, { once: true });

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
    const workDuration = parseInt(workDurationInput.value, 10);
    const shortBreakDuration = parseInt(shortBreakDurationInput.value, 10);
    const longBreakDuration = parseInt(longBreakDurationInput.value, 10);

    settings.workDuration = Number.isFinite(workDuration) && workDuration > 0 ? workDuration : 25;
    settings.shortBreakDuration = Number.isFinite(shortBreakDuration) && shortBreakDuration > 0 ? shortBreakDuration : 5;
    settings.longBreakDuration = Number.isFinite(longBreakDuration) && longBreakDuration > 0 ? longBreakDuration : 30;
    settings.popupAlerts = popupAlertsToggle.checked;

    workDurationInput.value = settings.workDuration;
    shortBreakDurationInput.value = settings.shortBreakDuration;
    longBreakDurationInput.value = settings.longBreakDuration;
    popupAlertsToggle.checked = settings.popupAlerts;
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
timeLeft = settings.workDuration * 60;
updateDisplay();
updateSessionInfo();

// Initialize clear button state
updateClearButtonState();

updateCycleProgress(1, true); // Initialize to first work session

registerServiceWorker();
