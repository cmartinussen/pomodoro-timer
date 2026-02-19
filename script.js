let timer;
let isRunning = false;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isWorkSession = true;
let pomodoroCount = 0;
let isLongBreak = false;

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const currentSession = document.getElementById('current-session');
const nextSession = document.getElementById('next-session');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const eventList = document.getElementById('event-list');

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
    eventList.appendChild(li);
    eventList.scrollTop = eventList.scrollHeight; // Auto-scroll to bottom
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

function updateSessionInfo() {
    if (isWorkSession) {
        currentSession.textContent = 'Current Session: Work (25 min)';
        nextSession.textContent = pomodoroCount % 4 === 3 ? 'Next: Long Break (15 min)' : 'Next: Short Break (5 min)';
    } else {
        if (isLongBreak) {
            currentSession.textContent = 'Current Session: Long Break (15 min)';
            nextSession.textContent = 'Next: Work (25 min)';
        } else {
            currentSession.textContent = 'Current Session: Short Break (5 min)';
            nextSession.textContent = 'Next: Work (25 min)';
        }
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timer = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) {
                clearInterval(timer);
                isRunning = false;
                notifyUser();
                switchSession();
            }
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = 25 * 60;
    isWorkSession = true;
    pomodoroCount = 0;
    isLongBreak = false;
    updateDisplay();
    updateSessionInfo();
    eventList.innerHTML = '';
}

function switchSession() {
    const wasWork = isWorkSession;
    if (isWorkSession) {
        pomodoroCount++;
        if (pomodoroCount % 4 === 0) {
            timeLeft = 15 * 60; // Long break
            isLongBreak = true;
        } else {
            timeLeft = 5 * 60; // Short break
            isLongBreak = false;
        }
        isWorkSession = false;
    } else {
        timeLeft = 25 * 60; // Back to work
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
    darkModeToggle.textContent = isDark ? 'Light' : 'Dark';
    localStorage.setItem('darkMode', isDark);
}

// Load dark mode preference
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = 'Light';
} else {
    darkModeToggle.textContent = 'Dark';
}

startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
darkModeToggle.addEventListener('click', toggleDarkMode);

updateDisplay();
updateSessionInfo();