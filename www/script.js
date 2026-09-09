// ============ STATE MANAGEMENT ============
const state = {
    isRunning: false,
    startTime: 0,
    elapsedTime: 0,
    lapStartTime: 0,
    lapElapsedTime: 0,
    laps: [],
    animationFrameId: null,
    lastUpdateTime: 0,
    isBackground: false
};

// ============ DOM ELEMENTS ============
const elements = {
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    milliseconds: document.getElementById('milliseconds'),
    startBtn: document.getElementById('startBtn'),
    lapBtn: document.getElementById('lapBtn'),
    resetBtn: document.getElementById('resetBtn'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    statsContainer: document.getElementById('statsContainer'),
    fastestLap: document.getElementById('fastestLap'),
    slowestLap: document.getElementById('slowestLap'),
    totalLaps: document.getElementById('totalLaps'),
    lapContainer: document.getElementById('lapContainer'),
    lapList: document.getElementById('lapList'),
    clearLapsBtn: document.getElementById('clearLapsBtn')
};

// ============ UTILITY FUNCTIONS ============
function formatTime(milliseconds) {
    const totalMilliseconds = Math.floor(milliseconds);
    const hours = Math.floor(totalMilliseconds / 3600000);
    const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const ms = totalMilliseconds % 1000;
    
    return {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
        milliseconds: String(ms).padStart(3, '0')
    };
}

function getCurrentTime() {
    return performance.now();
}

function updateDisplay(timeInMs) {
    const formatted = formatTime(timeInMs);
    elements.hours.textContent = formatted.hours;
    elements.minutes.textContent = formatted.minutes;
    elements.seconds.textContent = formatted.seconds;
    elements.milliseconds.textContent = formatted.milliseconds;
}

function calculateLapStatistics() {
    if (state.laps.length === 0) return;
    
    const lapTimes = state.laps.map(lap => lap.time);
    const fastestTime = Math.min(...lapTimes);
    const slowestTime = Math.max(...lapTimes);
    
    elements.fastestLap.textContent = formatTime(fastestTime).seconds + '.' + formatTime(fastestTime).milliseconds;
    elements.slowestLap.textContent = formatTime(slowestTime).seconds + '.' + formatTime(slowestTime).milliseconds;
    elements.totalLaps.textContent = state.laps.length;
    
    elements.statsContainer.style.display = 'grid';
}

function renderLapList() {
    if (state.laps.length === 0) {
        elements.lapList.innerHTML = '<div class="empty-lap-message">Belum ada lap tercatat</div>';
        elements.clearLapsBtn.style.display = 'none';
        return;
    }
    
    const lapTimes = state.laps.map(lap => lap.time);
    const fastestTime = Math.min(...lapTimes);
    const slowestTime = Math.max(...lapTimes);
    
    elements.lapList.innerHTML = state.laps.map((lap, index) => {
        const lapTimeFormatted = formatTime(lap.time);
        const totalTimeFormatted = formatTime(lap.totalTime);
        
        let lapClass = '';
        if (state.laps.length > 1) {
            if (lap.time === fastestTime) {
                lapClass = 'lap-fastest';
            } else if (lap.time === slowestTime) {
                lapClass = 'lap-slowest';
            }
        }
        
        const indicator = lapClass === 'lap-fastest' ? '🟢' : lapClass === 'lap-slowest' ? '🔴' : '';
        
        return `
            <div class="lap-item ${lapClass}">
                <span class="lap-number">${indicator} Lap ${index + 1}</span>
                <span class="lap-time">+${lapTimeFormatted.minutes}:${lapTimeFormatted.seconds}.${lapTimeFormatted.milliseconds}</span>
                <span class="lap-total">${totalTimeFormatted.hours}:${totalTimeFormatted.minutes}:${totalTimeFormatted.seconds}.${totalTimeFormatted.milliseconds}</span>
                <button class="lap-remove" data-index="${index}" aria-label="Remove lap">×</button>
            </div>
        `;
    }).join('');
    
    elements.clearLapsBtn.style.display = 'block';
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.lap-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeLap(index);
        });
    });
}

function removeLap(index) {
    state.laps.splice(index, 1);
    renderLapList();
    if (state.laps.length > 0) {
        calculateLapStatistics();
    } else {
        elements.statsContainer.style.display = 'none';
    }
}

// ============ STOPWATCH FUNCTIONS ============
function startStopwatch() {
    if (state.isRunning) return;
    
    state.isRunning = true;
    state.startTime = getCurrentTime() - state.elapsedTime;
    state.lapStartTime = getCurrentTime() - state.lapElapsedTime;
    
    // Update button states
    elements.startBtn.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">Pause</span>';
    elements.lapBtn.disabled = false;
    elements.resetBtn.disabled = false;
    
    // Start animation loop
    updateStopwatch();
}

function pauseStopwatch() {
    if (!state.isRunning) return;
    
    state.isRunning = false;
    state.elapsedTime = getCurrentTime() - state.startTime;
    state.lapElapsedTime = getCurrentTime() - state.lapStartTime;
    
    // Cancel animation
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
    
    // Update button states
    elements.startBtn.innerHTML = '<span class="btn-icon">▶</span><span class="btn-text">Start</span>';
}

function resetStopwatch() {
    if (state.isRunning) {
        pauseStopwatch();
    }
    
    state.elapsedTime = 0;
    state.lapElapsedTime = 0;
    state.laps = [];
    
    updateDisplay(0);
    renderLapList();
    elements.statsContainer.style.display = 'none';
    
    elements.startBtn.innerHTML = '<span class="btn-icon">▶</span><span class="btn-text">Start</span>';
    elements.lapBtn.disabled = true;
    elements.resetBtn.disabled = true;
}

function recordLap() {
    if (!state.isRunning && state.elapsedTime === 0) return;
    
    const currentTotalTime = state.isRunning ? 
        getCurrentTime() - state.startTime : 
        state.elapsedTime;
    
    const currentLapTime = state.isRunning ?
        getCurrentTime() - state.lapStartTime :
        state.lapElapsedTime;
    
    state.laps.push({
        time: currentLapTime,
        totalTime: currentTotalTime
    });
    
    // Reset lap timer
    if (state.isRunning) {
        state.lapStartTime = getCurrentTime();
    } else {
        state.lapElapsedTime = 0;
    }
    
    renderLapList();
    calculateLapStatistics();
}

function updateStopwatch() {
    if (!state.isRunning) return;
    
    const currentTime = getCurrentTime();
    const elapsed = currentTime - state.startTime;
    
    updateDisplay(elapsed);
    
    state.animationFrameId = requestAnimationFrame(updateStopwatch);
}

// ============ THEME MANAGEMENT ============
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        body.removeAttribute('data-theme');
        elements.themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        elements.themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        elements.themeIcon.textContent = '☀️';
    }
}

// ============ BACKGROUND HANDLING ============
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // App going to background
        state.isBackground = true;
        if (state.isRunning) {
            // Store current time when going to background
            state.elapsedTime = getCurrentTime() - state.startTime;
            state.lapElapsedTime = getCurrentTime() - state.lapStartTime;
        }
    } else {
        // App coming back to foreground
        state.isBackground = false;
        if (state.isRunning) {
            // Recalculate start time based on stored elapsed time
            state.startTime = getCurrentTime() - state.elapsedTime;
            state.lapStartTime = getCurrentTime() - state.lapElapsedTime;
        }
    }
});

// ============ EVENT LISTENERS ============
elements.startBtn.addEventListener('click', () => {
    if (state.isRunning) {
        pauseStopwatch();
    } else {
        startStopwatch();
    }
});

elements.lapBtn.addEventListener('click', recordLap);

elements.resetBtn.addEventListener('click', resetStopwatch);

elements.themeToggle.addEventListener('click', toggleTheme);

elements.clearLapsBtn.addEventListener('click', () => {
    state.laps = [];
    renderLapList();
    elements.statsContainer.style.display = 'none';
});

// ============ INITIALIZATION ============
function initApp() {
    loadTheme();
    updateDisplay(0);
    renderLapList();
    elements.lapBtn.disabled = true;
    elements.resetBtn.disabled = true;
}

// Prevent double-tap zoom
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
});

// Initialize app
initApp();
