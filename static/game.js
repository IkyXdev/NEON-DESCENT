/* =========================
   ELEMENT
========================= */

const player = document.getElementById("player");
const game = document.getElementById("game");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const highScoreText = document.getElementById("highScore");
const timeText = document.getElementById("time");

const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");
const gameOverScreen = document.getElementById("gameOverScreen");

const playBtn = document.getElementById("playBtn");
const retryBtn = document.getElementById("retryBtn");
const menuBtn = document.getElementById("menuBtn");

const pauseBtn = document.getElementById("pauseBtn");
const pauseOverlay = document.getElementById("pauseOverlay");
const pauseMenu = document.getElementById("pauseMenu");

const resumeBtn = document.getElementById("resumeBtn");
const pauseRetryBtn = document.getElementById("pauseRetryBtn");
const pauseMenuBtn = document.getElementById("pauseMenuBtn");

const finalScore = document.getElementById("finalScore");
const finalHighScore = document.getElementById("finalHighScore");
const finalTime = document.getElementById("finalTime");
const finalBestTime = document.getElementById("finalBestTime");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const difficultyButtons =
    document.querySelectorAll(".difficultyBtn");


/* =========================
   NAME
========================= */

const nameBtn =
    document.getElementById("nameBtn");

const nameMenu =
    document.getElementById("nameMenu");

const nameInput =
    document.getElementById("nameInput");

const saveNameBtn =
    document.getElementById("saveNameBtn");

const closeName =
    document.getElementById("closeName");

const playerNameDisplay =
    document.getElementById("playerNameDisplay");


let playerName =
    localStorage.getItem("playerName") || "Rizki";


function updatePlayerNameDisplay() {

    playerNameDisplay.textContent =
        "👤 " + playerName;
}


function openNameMenu() {

    nameInput.value =
        playerName;

    nameMenu.style.display =
        "block";

    leaderboard.style.display =
        "none";

    themeMenu.style.display =
        "none";

    setTimeout(
        function() {
            nameInput.focus();
        },
        50
    );
}


function savePlayerName() {

    let newName =
        nameInput.value.trim();

    if (!newName) {
        newName = "Rizki";
    }

    newName =
        newName.slice(0, 20);

    playerName =
        newName;

    localStorage.setItem(
        "playerName",
        playerName
    );

    updatePlayerNameDisplay();

    nameMenu.style.display =
        "none";
}


nameBtn.addEventListener(
    "click",
    function() {

        if (gameStarted) {
            return;
        }

        openNameMenu();
    }
);


saveNameBtn.addEventListener(
    "click",
    function() {

        savePlayerName();
    }
);


closeName.addEventListener(
    "click",
    function() {

        nameMenu.style.display =
            "none";
    }
);


nameInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            savePlayerName();
        }
    }
);


/* =========================
   LEADERBOARD
========================= */

const leaderboardBtn =
    document.getElementById("leaderboardBtn");

const leaderboard =
    document.getElementById("leaderboard");

const leaderboardList =
    document.getElementById("leaderboardList");

const closeLeaderboard =
    document.getElementById("closeLeaderboard");


/* =========================
   THEME
========================= */

const themeBtn =
    document.getElementById("themeBtn");

const themeMenu =
    document.getElementById("themeMenu");

const closeTheme =
    document.getElementById("closeTheme");

const themeButtons =
    document.querySelectorAll(".themeBtn");

let currentTheme =
    localStorage.getItem("theme") || "neon";


function applyTheme(theme) {

    currentTheme = theme;

    localStorage.setItem(
        "theme",
        theme
    );

    if (theme === "neon") {

        document.body.removeAttribute(
            "data-theme"
        );

    } else {

        document.body.dataset.theme =
            "hell";
    }
}


/* =========================
   THEME MENU
========================= */

themeBtn.addEventListener(
    "click",
    function() {

        themeMenu.style.display =
            "block";

        leaderboard.style.display =
            "none";

        nameMenu.style.display =
            "none";
    }
);


closeTheme.addEventListener(
    "click",
    function() {

        themeMenu.style.display =
            "none";
    }
);


themeButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function() {

                const selectedTheme =
                    button.dataset.theme;

                applyTheme(
                    selectedTheme
                );

                themeMenu.style.display =
                    "none";
            }
        );
    }
);


/* =========================
   GAME VARIABLES
========================= */

let playerX = 0;

let movingLeft = false;
let movingRight = false;

let score = 0;
let lives = 3;

let gameOver = false;
let gameStarted = false;
let paused = false;

let difficulty = "normal";

let spawnTimer = null;


/* =========================
   SMOOTH MOVEMENT
========================= */

const PLAYER_SPEED = 300;

let lastFrameTime = 0;


/* =========================
   AUDIO
========================= */

let audioContext = null;


function getAudioContext() {

    try {

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        if (!audioContext) {

            audioContext =
                new AudioContextClass();
        }

        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume().catch(
                function() {}
            );
        }

        return audioContext;

    } catch (error) {

        return null;
    }
}


/* =========================
   HIGH SCORE
========================= */

let highScore =
    Number(
        localStorage.getItem(
            "highScore"
        )
    ) || 0;


/* =========================
   ONLINE LEADERBOARD
========================= */

let leaderboardData = [];


async function loadLeaderboardFromServer() {

    try {

        const response =
            await fetch(
                "/api/leaderboard"
            );

        if (!response.ok) {
            throw new Error(
                "Gagal mengambil leaderboard."
            );
        }


        const data =
            await response.json();


        if (Array.isArray(data)) {

            leaderboardData =
                data
                    .map(function(item) {

                        return {
                            name:
                                String(
                                    item.name ||
                                    "Rizki"
                                ),

                            score:
                                Number(
                                    item.score
                                )
                        };

                    })
                    .filter(function(item) {

                        return Number.isFinite(
                            item.score
                        );

                    })
                    .sort(function(a, b) {

                        return b.score -
                            a.score;

                    })
                    .slice(0, 5);
        }


        updateLeaderboard();

    } catch (error) {

        console.log(
            "Leaderboard server tidak bisa diakses."
        );

        leaderboardData = [];

        updateLeaderboard();
    }
}


/* =========================
   SUBMIT SCORE
========================= */

async function submitScoreToServer(
    scoreValue
) {

    try {

        const response =
            await fetch(
                "/api/leaderboard",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name:
                            playerName,

                        score:
                            Number(
                                scoreValue
                            ) || 0
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Gagal mengirim score."
            );
        }


        const data =
            await response.json();


        if (Array.isArray(data)) {

            leaderboardData =
                data
                    .map(function(item) {

                        return {
                            name:
                                String(
                                    item.name ||
                                    "Rizki"
                                ),

                            score:
                                Number(
                                    item.score
                                )
                        };

                    })
                    .filter(function(item) {

                        return Number.isFinite(
                            item.score
                        );

                    })
                    .sort(function(a, b) {

                        return b.score -
                            a.score;

                    })
                    .slice(0, 5);
        }


        updateLeaderboard();

    } catch (error) {

        console.log(
            "Score belum berhasil dikirim ke server."
        );
    }
}


/* =========================
   SURVIVAL TIME
========================= */

let survivalTime = 0;

let bestTime =
    Number(
        localStorage.getItem(
            "bestTime"
        )
    ) || 0;

let timerInterval = null;

let gameStartTime = 0;

let pausedTime = 0;

let pauseStartedAt = 0;


/* =========================
   DIFFICULTY
========================= */

const difficultySettings = {

    easy: {
        enemyMinSpeed: 2,
        enemyMaxSpeed: 3,
        spawnInterval: 1400
    },

    normal: {
        enemyMinSpeed: 3,
        enemyMaxSpeed: 5,
        spawnInterval: 1000
    },

    hard: {
        enemyMinSpeed: 4,
        enemyMaxSpeed: 7,
        spawnInterval: 700
    }
};


difficultyButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function() {

                difficulty =
                    button.dataset.level;

                difficultyButtons.forEach(
                    function(btn) {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );

                button.classList.add(
                    "active"
                );
            }
        );
    }
);


/* =========================
   TIME
========================= */

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {
        seconds = 0;
    }

    return seconds.toFixed(1) + "s";
}


function updateTimeDisplay() {

    timeText.textContent =
        "Time: " +
        formatTime(survivalTime);
}


function calculateCurrentTime() {

    if (!gameStartTime) {
        return 0;
    }

    let totalPaused =
        pausedTime;

    if (
        paused &&
        pauseStartedAt
    ) {

        totalPaused +=
            Date.now() -
            pauseStartedAt;
    }

    const result =
        (
            Date.now() -
            gameStartTime -
            totalPaused
        ) / 1000;

    return Math.max(
        0,
        result
    );
}


function startTimer() {

    stopTimer();

    survivalTime = 0;
    pausedTime = 0;
    pauseStartedAt = 0;

    gameStartTime =
        Date.now();

    updateTimeDisplay();

    timerInterval =
        setInterval(
            function() {

                if (
                    !gameStarted ||
                    gameOver ||
                    paused
                ) {
                    return;
                }

                survivalTime =
                    calculateCurrentTime();

                updateTimeDisplay();

            },
            100
        );
}


function stopTimer() {

    if (
        timerInterval !== null
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;
    }
}


/* =========================
   LEADERBOARD DISPLAY
========================= */

function updateLeaderboard() {

    leaderboardList.innerHTML = "";

    if (
        leaderboardData.length === 0
    ) {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "leaderboardRow";

        row.textContent =
            "Belum ada skor";

        leaderboardList.appendChild(
            row
        );

        return;
    }


    leaderboardData.forEach(
        function(item, index) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "leaderboardRow";


            const rank =
                document.createElement(
                    "span"
                );

            const scoreTextElement =
                document.createElement(
                    "span"
                );


            rank.textContent =
                (index + 1) + ".";


            scoreTextElement.textContent =
                String(
                    item.name
                ) +
                " — " +
                String(
                    item.score
                );


            row.appendChild(
                rank
            );

            row.appendChild(
                scoreTextElement
            );

            leaderboardList.appendChild(
                row
            );
        }
    );
}


/* =========================
   LEADERBOARD BUTTON
========================= */

leaderboardBtn.addEventListener(
    "click",
    async function() {

        if (gameStarted) {
            return;
        }

        leaderboardList.innerHTML =
            "<div class='leaderboardRow'>Memuat...</div>";

        leaderboard.style.display =
            "block";

        themeMenu.style.display =
            "none";

        nameMenu.style.display =
            "none";

        await loadLeaderboardFromServer();
    }
);


closeLeaderboard.addEventListener(
    "click",
    function() {

        leaderboard.style.display =
            "none";
    }
);


/* =========================
   PLAYER POSITION
========================= */

function getMaxPlayerX() {

    return Math.max(
        0,
        game.clientWidth -
        player.offsetWidth
    );
}


function clampPlayer() {

    const maxX =
        getMaxPlayerX();

    if (playerX < 0) {
        playerX = 0;
    }

    if (playerX > maxX) {
        playerX = maxX;
    }
}


function updatePlayerPosition() {

    clampPlayer();

    player.style.transform =
        "translate3d(" +
        playerX +
        "px, 0, 0)";
}


/* =========================
   START GAME
========================= */

function startGame() {

    getAudioContext();

    score = 0;
    lives = 3;

    gameOver = false;
    gameStarted = true;
    paused = false;

    movingLeft = false;
    movingRight = false;

    survivalTime = 0;
    pausedTime = 0;
    pauseStartedAt = 0;

    lastFrameTime = 0;


    document.body.classList.add(
        "game-active"
    );


    leaderboard.style.display =
        "none";

    themeMenu.style.display =
        "none";

    nameMenu.style.display =
        "none";

    pauseMenu.style.display =
        "none";

    pauseOverlay.style.display =
        "none";


    playerX =
        (
            game.clientWidth -
            player.offsetWidth
        ) / 2;

    clampPlayer();
    updatePlayerPosition();


    scoreText.textContent =
        "Score: 0";

    livesText.textContent =
        "Lives: 3";

    highScoreText.textContent =
        "High Score: " +
        highScore;


    updateTimeDisplay();


    document
        .querySelectorAll(".enemy")
        .forEach(
            function(enemy) {
                enemy.remove();
            }
        );


    menu.style.display =
        "none";

    gameOverScreen.style.display =
        "none";

    gameContainer.style.display =
        "block";

    leaderboardBtn.style.display =
        "none";

    pauseBtn.style.display =
        "block";


    startTimer();

    startSpawning();
}


/* =========================
   PLAY
========================= */

playBtn.addEventListener(
    "click",
    function() {

        getAudioContext();

        startGame();

        if (
            document.documentElement
                .requestFullscreen
        ) {

            document.documentElement
                .requestFullscreen()
                .catch(
                    function() {}
                );
        }
    }
);


/* =========================
   RETRY
========================= */

retryBtn.addEventListener(
    "click",
    function() {

        getAudioContext();

        startGame();
    }
);


/* =========================
   PAUSE
========================= */

pauseBtn.addEventListener(
    "click",
    function() {

        if (
            !gameStarted ||
            gameOver ||
            paused
        ) {
            return;
        }

        paused = true;

        pauseStartedAt =
            Date.now();

        pauseBtn.style.display =
            "none";

        pauseOverlay.style.display =
            "flex";

        pauseMenu.style.display =
            "block";
    }
);


/* =========================
   RESUME
========================= */

resumeBtn.addEventListener(
    "click",
    function() {

        if (gameOver) {
            return;
        }

        if (paused) {

            pausedTime +=
                Date.now() -
                pauseStartedAt;
        }

        paused = false;

        pauseStartedAt = 0;

        pauseBtn.style.display =
            "block";

        pauseOverlay.style.display =
            "none";

        pauseMenu.style.display =
            "none";
    }
);


/* =========================
   RETRY PAUSE
========================= */

pauseRetryBtn.addEventListener(
    "click",
    function() {

        getAudioContext();

        startGame();
    }
);


/* =========================
   MENU BUTTON
========================= */

pauseMenuBtn.addEventListener(
    "click",
    function() {

        goToMenu();
    }
);


menuBtn.addEventListener(
    "click",
    function() {

        goToMenu();
    }
);


/* =========================
   GO TO MENU
========================= */

function goToMenu() {

    stopSpawning();
    stopTimer();

    paused = false;
    gameStarted = false;
    gameOver = false;

    movingLeft = false;
    movingRight = false;

    pauseStartedAt = 0;

    document.body.classList.remove(
        "game-active"
    );


    pauseBtn.style.display =
        "none";

    pauseOverlay.style.display =
        "none";

    pauseMenu.style.display =
        "none";

    themeMenu.style.display =
        "none";

    nameMenu.style.display =
        "none";

    gameContainer.style.display =
        "none";

    gameOverScreen.style.display =
        "none";

    menu.style.display =
        "flex";

    leaderboardBtn.style.display =
        "block";


    document
        .querySelectorAll(".enemy")
        .forEach(
            function(enemy) {
                enemy.remove();
            }
        );
}


/* =========================
   MOVEMENT START
========================= */

function startMovingLeft(e) {

    if (e) {
        e.preventDefault();
    }

    movingLeft = true;
    movingRight = false;
}


function stopMovingLeft(e) {

    if (e) {
        e.preventDefault();
    }

    movingLeft = false;
}


function startMovingRight(e) {

    if (e) {
        e.preventDefault();
    }

    movingRight = true;
    movingLeft = false;
}


function stopMovingRight(e) {

    if (e) {
        e.preventDefault();
    }

    movingRight = false;
}


/* =========================
   TOUCH CONTROL
========================= */

leftBtn.addEventListener(
    "touchstart",
    startMovingLeft,
    { passive: false }
);

leftBtn.addEventListener(
    "touchend",
    stopMovingLeft,
    { passive: false }
);

leftBtn.addEventListener(
    "touchcancel",
    stopMovingLeft,
    { passive: false }
);


rightBtn.addEventListener(
    "touchstart",
    startMovingRight,
    { passive: false }
);

rightBtn.addEventListener(
    "touchend",
    stopMovingRight,
    { passive: false }
);

rightBtn.addEventListener(
    "touchcancel",
    stopMovingRight,
    { passive: false }
);


/* =========================
   MOUSE CONTROL
========================= */

leftBtn.addEventListener(
    "mousedown",
    startMovingLeft
);

leftBtn.addEventListener(
    "mouseup",
    stopMovingLeft
);

leftBtn.addEventListener(
    "mouseleave",
    stopMovingLeft
);


rightBtn.addEventListener(
    "mousedown",
    startMovingRight
);

rightBtn.addEventListener(
    "mouseup",
    stopMovingRight
);

rightBtn.addEventListener(
    "mouseleave",
    stopMovingRight
);


/* =========================
   STOP WHEN TOUCH ENDS
========================= */

document.addEventListener(
    "touchend",
    function() {

        movingLeft = false;
        movingRight = false;
    },
    { passive: true }
);


/* =========================
   CREATE ENEMY
========================= */

function createEnemy() {

    if (
        !gameStarted ||
        gameOver ||
        paused
    ) {
        return;
    }


    const enemy =
        document.createElement(
            "div"
        );

    enemy.classList.add(
        "enemy"
    );


    const enemyWidth = 42;

    const maxX =
        Math.max(
            0,
            game.clientWidth -
            enemyWidth
        );


    enemy.style.left =
        (
            Math.random() *
            maxX
        ) + "px";

    enemy.style.top =
        "-42px";


    game.appendChild(enemy);

    moveEnemy(enemy);
}


/* =========================
   MOVE ENEMY
========================= */

function moveEnemy(enemy) {

    let enemyY = -42;

    const settings =
        difficultySettings[
            difficulty
        ];


    let enemySpeed =
        settings.enemyMinSpeed +
        Math.random() *
        (
            settings.enemyMaxSpeed -
            settings.enemyMinSpeed
        );


    enemySpeed +=
        score * 0.1;


    function fall() {

        if (gameOver) {
            return;
        }


        if (paused) {

            requestAnimationFrame(
                fall
            );

            return;
        }


        if (
            !document.body.contains(
                enemy
            )
        ) {
            return;
        }


        enemyY += enemySpeed;

        enemy.style.top =
            enemyY + "px";


        /* COLLISION */

        if (
            checkCollision(
                player,
                enemy
            )
        ) {

            playHitSound();

            vibrateOnHit();


            player.classList.add(
                "playerHit"
            );


            setTimeout(
                function() {

                    player.classList.remove(
                        "playerHit"
                    );

                },
                300
            );


            enemy.remove();

            lives--;

            livesText.textContent =
                "Lives: " +
                lives;


            if (lives <= 0) {

                endGame();

                return;
            }

            return;
        }


        /* ENEMY LEWAT */

        if (
            enemyY >
            game.clientHeight
        ) {

            enemy.remove();

            score++;

            scoreText.textContent =
                "Score: " +
                score;


            if (score > highScore) {

                highScore =
                    score;

                localStorage.setItem(
                    "highScore",
                    String(highScore)
                );

                highScoreText.textContent =
                    "High Score: " +
                    highScore;
            }

            return;
        }


        requestAnimationFrame(
            fall
        );
    }


    fall();
}


/* =========================
   VIBRATION
========================= */

function vibrateOnHit() {

    if (
        "vibrate" in navigator
    ) {

        navigator.vibrate(100);
    }
}


/* =========================
   COLLISION
========================= */

function checkCollision(a, b) {

    if (
        !a ||
        !b ||
        !document.body.contains(a) ||
        !document.body.contains(b)
    ) {
        return false;
    }


    const aRect =
        a.getBoundingClientRect();

    const bRect =
        b.getBoundingClientRect();


    return !(
        aRect.bottom < bRect.top ||
        aRect.top > bRect.bottom ||
        aRect.right < bRect.left ||
        aRect.left > bRect.right
    );
}


/* =========================
   GAME OVER
========================= */

function endGame() {

    if (gameOver) {
        return;
    }


    survivalTime =
        calculateCurrentTime();


    gameOver = true;
    gameStarted = false;
    paused = false;

    movingLeft = false;
    movingRight = false;


    document.body.classList.remove(
        "game-active"
    );


    stopSpawning();
    stopTimer();


    updateTimeDisplay();


    /* BEST TIME */

    if (
        survivalTime >
        bestTime
    ) {

        bestTime =
            survivalTime;

        localStorage.setItem(
            "bestTime",
            String(bestTime)
        );
    }


    /* HAPUS ENEMY */

    document
        .querySelectorAll(".enemy")
        .forEach(
            function(enemy) {
                enemy.remove();
            }
        );


    /* =========================
       KIRIM SCORE KE SERVER
    ========================= */

    submitScoreToServer(
        score
    );


    /* FINAL TEXT */

    finalScore.textContent =
        "Score: " +
        score;

    finalHighScore.textContent =
        "High Score: " +
        highScore;

    finalTime.textContent =
        "Survival Time: " +
        formatTime(
            survivalTime
        );

    finalBestTime.textContent =
        "Best Time: " +
        formatTime(
            bestTime
        );


    /* GAME OVER SCREEN */

    pauseBtn.style.display =
        "none";

    pauseOverlay.style.display =
        "none";

    pauseMenu.style.display =
        "none";

    gameContainer.style.display =
        "none";

    gameOverScreen.style.display =
        "flex";

    leaderboardBtn.style.display =
        "block";


    playGameOverSound();
}


/* =========================
   SPAWN
========================= */

function startSpawning() {

    stopSpawning();

    const settings =
        difficultySettings[
            difficulty
        ];


    spawnTimer =
        setInterval(
            function() {

                if (
                    !gameStarted ||
                    gameOver ||
                    paused
                ) {
                    return;
                }

                createEnemy();

            },
            settings.spawnInterval
        );
}


function stopSpawning() {

    if (
        spawnTimer !== null
    ) {

        clearInterval(
            spawnTimer
        );

        spawnTimer = null;
    }
}


/* =========================
   SMOOTH PLAYER LOOP
========================= */

function gameLoop(timestamp) {

    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }


    let deltaTime =
        (
            timestamp -
            lastFrameTime
        ) / 1000;


    lastFrameTime =
        timestamp;


    deltaTime =
        Math.min(
            deltaTime,
            0.05
        );


    if (
        gameStarted &&
        !paused &&
        !gameOver
    ) {

        if (movingLeft) {

            playerX -=
                PLAYER_SPEED *
                deltaTime;
        }


        if (movingRight) {

            playerX +=
                PLAYER_SPEED *
                deltaTime;
        }


        clampPlayer();
    }


    updatePlayerPosition();


    requestAnimationFrame(
        gameLoop
    );
}


/* =========================
   HIT SOUND
========================= */

function playHitSound() {

    const audio =
        getAudioContext();

    if (!audio) {
        return;
    }


    try {

        const oscillator =
            audio.createOscillator();

        const gain =
            audio.createGain();


        oscillator.connect(gain);

        gain.connect(
            audio.destination
        );


        oscillator.type =
            "square";


        oscillator.frequency.setValueAtTime(
            220,
            audio.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            100,
            audio.currentTime + 0.12
        );


        gain.gain.setValueAtTime(
            0.001,
            audio.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.12,
            audio.currentTime + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.12
        );


        oscillator.start(
            audio.currentTime
        );

        oscillator.stop(
            audio.currentTime + 0.13
        );

    } catch (error) {

        console.log(
            "Hit sound tidak tersedia."
        );
    }
}


/* =========================
   GAME OVER SOUND
========================= */

function playGameOverSound() {

    const audio =
        getAudioContext();

    if (!audio) {
        return;
    }


    try {

        const notes = [
            600,
            500,
            400
        ];


        notes.forEach(
            function(freq, index) {

                const oscillator =
                    audio.createOscillator();

                const gain =
                    audio.createGain();


                oscillator.connect(gain);

                gain.connect(
                    audio.destination
                );


                oscillator.type =
                    "square";


                const startTime =
                    audio.currentTime +
                    index * 0.18;


                oscillator.frequency.setValueAtTime(
                    freq,
                    startTime
                );


                gain.gain.setValueAtTime(
                    0.001,
                    startTime
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.12,
                    startTime + 0.01
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    startTime + 0.13
                );


                oscillator.start(
                    startTime
                );

                oscillator.stop(
                    startTime + 0.14
                );
            }
        );

    } catch (error) {

        console.log(
            "Game over sound tidak tersedia."
        );
    }
}


/* =========================
   WINDOW RESIZE
========================= */

window.addEventListener(
    "resize",
    function() {

        if (!gameStarted) {
            return;
        }

        clampPlayer();

        updatePlayerPosition();
    }
);


/* =========================
   INITIALIZE
========================= */

applyTheme(
    currentTheme
);

updatePlayerNameDisplay();

updateTimeDisplay();

highScoreText.textContent =
    "High Score: " +
    highScore;

leaderboardBtn.style.display =
    "block";

gameContainer.style.display =
    "none";

gameOverScreen.style.display =
    "none";

pauseBtn.style.display =
    "none";

pauseOverlay.style.display =
    "none";

pauseMenu.style.display =
    "none";

nameMenu.style.display =
    "none";


/* LOAD LEADERBOARD DARI FLASK */

loadLeaderboardFromServer();


/* START PLAYER LOOP */

requestAnimationFrame(
    gameLoop
);
