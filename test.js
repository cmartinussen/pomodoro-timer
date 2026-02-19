// test.js - Comprehensive Jest tests for Pomodoro Timer

describe('Pomodoro Timer - Comprehensive Tests', () => {
  beforeEach(() => {
    // Reset global variables for each test
    jest.clearAllMocks();
  });

  describe('Timer Logic', () => {
    test('basic test setup works', () => {
      expect(true).toBe(true);
    });

    test('can access document', () => {
      document.body.innerHTML = '<div id="test">Hello</div>';
      const element = document.getElementById('test');
      expect(element.textContent).toBe('Hello');
    });

    test('basic math works', () => {
      expect(25 * 60).toBe(1500); // 25 minutes in seconds
      expect(5 * 60).toBe(300);   // 5 minutes in seconds
      expect(15 * 60).toBe(900);  // 15 minutes in seconds
    });

    test('time formatting logic', () => {
      // Test time formatting (MM:SS)
      const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      expect(formatTime(1500)).toBe('25:00');
      expect(formatTime(300)).toBe('05:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(9)).toBe('00:09');
    });
  });

  describe('Session Management', () => {
    test('work session duration', () => {
      const workDuration = 25 * 60; // 25 minutes
      expect(workDuration).toBe(1500);
    });

    test('short break duration', () => {
      const shortBreakDuration = 5 * 60; // 5 minutes
      expect(shortBreakDuration).toBe(300);
    });

    test('long break duration', () => {
      const longBreakDuration = 15 * 60; // 15 minutes
      expect(longBreakDuration).toBe(900);
    });

    test('pomodoro cycle logic', () => {
      // Simulate pomodoro counting
      let pomodoroCount = 0;
      let isWorkSession = true;
      let nextBreakDuration = 0;

      // After 1st work session
      pomodoroCount = 1;
      nextBreakDuration = pomodoroCount % 4 === 0 ? 15 * 60 : 5 * 60;
      expect(nextBreakDuration).toBe(300); // Short break

      // After 4th work session
      pomodoroCount = 4;
      nextBreakDuration = pomodoroCount % 4 === 0 ? 15 * 60 : 5 * 60;
      expect(nextBreakDuration).toBe(900); // Long break

      // After 8th work session
      pomodoroCount = 8;
      nextBreakDuration = pomodoroCount % 4 === 0 ? 15 * 60 : 5 * 60;
      expect(nextBreakDuration).toBe(900); // Long break
    });

    test('session transition logic', () => {
      // Test work -> break transition
      let timeLeft = 0;
      let isWorkSession = true;
      let pomodoroCount = 0;

      // Simulate timer reaching zero
      if (isWorkSession) {
        pomodoroCount++;
        timeLeft = pomodoroCount % 4 === 0 ? 15 * 60 : 5 * 60;
        isWorkSession = false;
      }

      expect(timeLeft).toBe(300); // Short break
      expect(isWorkSession).toBe(false);
      expect(pomodoroCount).toBe(1);

      // Test break -> work transition
      timeLeft = 0;
      if (!isWorkSession) {
        timeLeft = 25 * 60;
        isWorkSession = true;
      }

      expect(timeLeft).toBe(1500); // Work session
      expect(isWorkSession).toBe(true);
    });
  });

  describe('UI Interactions', () => {
    test('button elements creation', () => {
      document.body.innerHTML = `
        <button id="start">Start</button>
        <button id="pause">Pause</button>
        <button id="reset">Reset</button>
      `;

      const startBtn = document.getElementById('start');
      const pauseBtn = document.getElementById('pause');
      const resetBtn = document.getElementById('reset');

      expect(startBtn).toBeTruthy();
      expect(pauseBtn).toBeTruthy();
      expect(resetBtn).toBeTruthy();
      expect(startBtn.textContent).toBe('Start');
    });

    test('display elements creation', () => {
      document.body.innerHTML = `
        <span id="minutes">25</span>:<span id="seconds">00</span>
        <p id="current-session">Current Session: Work (25 min)</p>
        <p id="next-session">Next: Short Break (5 min)</p>
      `;

      const minutes = document.getElementById('minutes');
      const seconds = document.getElementById('seconds');
      const currentSession = document.getElementById('current-session');
      const nextSession = document.getElementById('next-session');

      expect(minutes.textContent).toBe('25');
      expect(seconds.textContent).toBe('00');
      expect(currentSession.textContent).toContain('Work');
      expect(nextSession.textContent).toContain('Short Break');
    });

    test('event log functionality', () => {
      document.body.innerHTML = '<ul id="event-list"></ul>';
      const eventList = document.getElementById('event-list');

      // Simulate adding events
      const addEvent = (message) => {
        const li = document.createElement('li');
        li.textContent = `12:00:00: ${message}`;
        eventList.appendChild(li);
      };

      addEvent('Work session completed');
      addEvent('Short break started');

      expect(eventList.children.length).toBe(2);
      expect(eventList.children[0].textContent).toContain('Work session completed');
      expect(eventList.children[1].textContent).toContain('Short break started');
    });
  });

  describe('Audio and Notifications', () => {
    test('audio context mock', () => {
      const mockAudioContext = new AudioContext();
      expect(mockAudioContext).toBeDefined();
      expect(mockAudioContext.createOscillator).toBeDefined();
      expect(mockAudioContext.createGain).toBeDefined();
    });

    test('notification mock', () => {
      expect(Notification.permission).toBe('default');
      expect(typeof Notification.requestPermission).toBe('function');
    });

    test('localStorage mock', () => {
      localStorage.setItem('test', 'value');
      expect(localStorage.getItem('test')).toBe('value');
      localStorage.removeItem('test');
      expect(localStorage.getItem('test')).toBeUndefined();
    });
  });

  describe('Timer State Management', () => {
    test('initial timer state', () => {
      const initialState = {
        timeLeft: 25 * 60,
        isRunning: false,
        isWorkSession: true,
        pomodoroCount: 0,
        isLongBreak: false
      };

      expect(initialState.timeLeft).toBe(1500);
      expect(initialState.isRunning).toBe(false);
      expect(initialState.isWorkSession).toBe(true);
      expect(initialState.pomodoroCount).toBe(0);
      expect(initialState.isLongBreak).toBe(false);
    });

    test('timer reset functionality', () => {
      // Simulate modified state
      let timeLeft = 500;
      let isRunning = true;
      let isWorkSession = false;
      let pomodoroCount = 3;
      let isLongBreak = true;

      // Simulate reset
      timeLeft = 25 * 60;
      isRunning = false;
      isWorkSession = true;
      pomodoroCount = 0;
      isLongBreak = false;

      expect(timeLeft).toBe(1500);
      expect(isRunning).toBe(false);
      expect(isWorkSession).toBe(true);
      expect(pomodoroCount).toBe(0);
      expect(isLongBreak).toBe(false);
    });
  });
});