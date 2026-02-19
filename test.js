// test.js - Jest tests for Pomodoro Timer

// Mock DOM elements
document.body.innerHTML = `
  <div id="minutes">25</div>
  <div id="seconds">00</div>
  <button id="start"></button>
  <button id="pause"></button>
  <button id="reset"></button>
  <p id="current-session"></p>
  <p id="next-session"></p>
  <button id="dark-mode-toggle"></button>
  <ul id="event-list"></ul>
`;

// Load the script
require('./script.js');

describe('Pomodoro Timer', () => {
  beforeEach(() => {
    // Reset global variables
    timer = null;
    isRunning = false;
    timeLeft = 25 * 60;
    isWorkSession = true;
    pomodoroCount = 0;
    isLongBreak = false;
    jest.clearAllMocks();
  });

  test('initial state', () => {
    expect(timeLeft).toBe(25 * 60);
    expect(isWorkSession).toBe(true);
    expect(pomodoroCount).toBe(0);
    expect(isLongBreak).toBe(false);
  });

  test('reset timer', () => {
    timeLeft = 10;
    isWorkSession = false;
    pomodoroCount = 2;
    isLongBreak = true;
    resetTimer();
    expect(timeLeft).toBe(25 * 60);
    expect(isWorkSession).toBe(true);
    expect(pomodoroCount).toBe(0);
    expect(isLongBreak).toBe(false);
    expect(document.getElementById('event-list').innerHTML).toBe('');
  });

  test('switch session - work to short break', () => {
    timeLeft = 0;
    isWorkSession = true;
    pomodoroCount = 0;
    switchSession();
    expect(timeLeft).toBe(5 * 60);
    expect(isWorkSession).toBe(false);
    expect(isLongBreak).toBe(false);
  });

  test('switch session - break to work', () => {
    timeLeft = 0;
    isWorkSession = false;
    isLongBreak = false;
    switchSession();
    expect(timeLeft).toBe(25 * 60);
    expect(isWorkSession).toBe(true);
    expect(pomodoroCount).toBe(1);
  });

  test('long break after 4 pomodoros', () => {
    pomodoroCount = 3;
    timeLeft = 0;
    isWorkSession = true;
    switchSession();
    expect(timeLeft).toBe(15 * 60);
    expect(isLongBreak).toBe(true);
  });

  test('update display', () => {
    timeLeft = 65; // 1:05
    updateDisplay();
    expect(document.getElementById('minutes').textContent).toBe('01');
    expect(document.getElementById('seconds').textContent).toBe('05');
  });

  test('play beep does not throw error', () => {
    expect(() => playBeep()).not.toThrow();
  });

  test('log event adds to list', () => {
    const eventList = document.getElementById('event-list');
    const initialLength = eventList.children.length;
    logEvent('Test event');
    expect(eventList.children.length).toBe(initialLength + 1);
    expect(eventList.lastChild.textContent).toContain('Test event');
  });

  test('switch session logs events', () => {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = '';
    timeLeft = 0;
    isWorkSession = true;
    pomodoroCount = 0;
    switchSession();
    expect(eventList.children.length).toBe(1);
    expect(eventList.lastChild.textContent).toContain('Work session completed');
  });

  test('update session info - work session', () => {
    updateSessionInfo();
    expect(document.getElementById('current-session').textContent).toBe('Current Session: Work (25 min)');
    expect(document.getElementById('next-session').textContent).toBe('Next: Short Break (5 min)');
  });

  test('update session info - long break', () => {
    isWorkSession = false;
    isLongBreak = true;
    updateSessionInfo();
    expect(document.getElementById('current-session').textContent).toBe('Current Session: Long Break (15 min)');
    expect(document.getElementById('next-session').textContent).toBe('Next: Work (25 min)');
  });
});