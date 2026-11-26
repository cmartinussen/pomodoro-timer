(() => {
    const picker = document.querySelector('#christmas-theme');
    const scene = document.querySelector('.holiday-scene');
    const lights = scene.querySelector('.holiday-lights');
    const snow = scene.querySelector('.holiday-snow');
    const key = 'pomodoroChristmasTheme';

    function refresh() {
        const enabled = picker.value === 'on' ||
            (picker.value === 'auto' && new Date().getMonth() === 11);
        document.body.classList.toggle('christmas', enabled);
        if (!enabled || lights.childElementCount) return;

        for (let i = 0; i < 24; i++) {
            lights.append(document.createElement('i'));
            const flake = document.createElement('span');
            flake.textContent = i % 3 ? '❄' : '❅';
            flake.style.left = ((i * 37) % 100) + '%';
            flake.style.top = ((i * 29) % 100) + '%';
            flake.style.fontSize = (12 + i % 5 * 3) + 'px';
            flake.style.animationDuration = (13 + i % 8) + 's';
            flake.style.animationDelay = -i + 's';
            snow.append(flake);
        }
    }

    function choose(value) {
        picker.value = value;
        localStorage.setItem(key, value);
        refresh();
    }

    const saved = localStorage.getItem(key);
    picker.value = ['on', 'off'].includes(saved) ? saved : 'auto';
    picker.addEventListener('change', () => choose(picker.value));
    document.querySelector('#reset-settings').addEventListener('click', () => choose('auto'));
    document.addEventListener('visibilitychange', refresh);
    function scheduleMidnight() {
        refresh();
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        setTimeout(scheduleMidnight, midnight - now);
    }
    scheduleMidnight();
})();
