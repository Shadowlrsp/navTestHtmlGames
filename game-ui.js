// DOM 
const scoreDisplay = document.getElementById('scoreDisplay');
const crystalDisplay = document.getElementById('crystalDisplay');
const healthBar = document.getElementById('healthBar');
const bossHud = document.getElementById('bossHud');
const bossHealthBar = document.getElementById('bossHealthBar');
const pauseBtn = document.getElementById('pauseBtn');
const quitBtn = document.getElementById('quitBtn');
const shopPlayBtn = document.getElementById('shopPlayBtn');

pauseBtn.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!player) return;
    paused = !paused;
    pauseBtn.innerText = paused ? 'REPRENDRE' : 'PAUSE';
};

quitBtn.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    backToMenu();
};

function updateHUD() {
    scoreDisplay.innerText = score;
    crystalDisplay.innerText = crystals;
    if (player) {
        healthBar.style.width = Math.max(0, (player.hp / playerStats.maxHp) * 100) + '%';
    } else {
        healthBar.style.width = '0%';
    }
}

function renderShop() {
    const list = document.getElementById('upgradeList');
    list.innerHTML = '';
    upgrades.forEach(u => {
        const cost = Math.floor(u.cost * Math.pow(1.6, u.lvl - 1));
        const div = document.createElement('div');
        div.className = 'p-3 border border-cyan-500 rounded flex justify-between items-center bg-cyan-950/20';
        div.innerHTML = `<span>${u.name} Lvl ${u.lvl > u.max ? 'MAX' : u.lvl}</span>
                         <button class="px-3 py-1 bg-cyan-500/20 border border-cyan-500 rounded text-sm">${u.lvl > u.max ? 'MAX' : cost + ' 💎'}</button>`;

        if (crystals >= cost && u.lvl <= u.max) {
            div.querySelector('button').onclick = e => {
                e.preventDefault();
                e.stopPropagation();
                crystals -= cost;
                localStorage.setItem('savedCrystals', crystals);
                u.lvl++;
                u.apply();
                renderShop();
                updateHUD();
            };
        } else {
            div.style.opacity = .4;
        }
        list.appendChild(div);
    });

    if (player && player.hp > 0) {
        shopPlayBtn.innerText = "REPRENDRE";
    } else {
        shopPlayBtn.innerText = "JOUER";
    }
}

function saveScore() {
    let lb = localStorage.getItem('leaderboard');
    lb = lb ? JSON.parse(lb) : [7500, 5100, 3200, 1500, 600];
    lb.push(score);
    lb = lb.sort((a, b) => b - a).slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(lb));

    const ul = document.getElementById('leaderboard');
    ul.innerHTML = '';
    lb.forEach(s => {
        const li = document.createElement('li');
        li.innerText = s + " PTS";
        ul.appendChild(li);
    });
}

function loadInitialLeaderboard() {
    let lb = localStorage.getItem('leaderboard');
    if (!lb) {
        lb = [7500, 5100, 3200, 1500, 600];
        localStorage.setItem('leaderboard', JSON.stringify(lb));
    } else {
        lb = JSON.parse(lb);
    }
    const ul = document.getElementById('leaderboard');
    ul.innerHTML = '';
    lb.forEach(s => {
        const li = document.createElement('li');
        li.innerText = s + " PTS";
        ul.appendChild(li);
    });
}

function startGame() {
    resize();
    input.x = w / 2;
    input.y = h - 100;
    player = new Player();
    bullets = [];
    enemies = [];
    loot = [];
    particles = [];
    frames = 0;
    score = 0;
    difficulty = 1;
    paused = false;
    bossActive = false;
    bossCount = 0;
    bossHealthBar.style.width = '100%';
    bossHud.classList.add('hidden');
    pauseBtn.innerText = 'PAUSE';

    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('shopMenu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    updateHUD();

    checkEasterEgg();
}

function gameOver() {
    paused = true;
    localStorage.setItem('savedCrystals', crystals);
    bossHud.classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('finalScore').innerText = score;
    document.getElementById('finalCrystals').innerText = crystals;
    saveScore();
    player = null;
    document.getElementById('gameOverMenu').classList.remove('hidden');
}

function backToMenu() {
    paused = true;
    localStorage.setItem('savedCrystals', crystals);
    player = null;
    bullets = [];
    enemies = [];
    loot = [];
    particles = [];
    bossHud.classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('shopMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
}

function loop() {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    if (frames % 4 === 0 && !paused && player) {
        particles.push({x: Math.random() * w, y: 0, vx: 0, vy: 3, size: 1, alpha: 0.5, color: '#fff', bgStar: true});
    }

    if (!paused && player) {
        frames++;
        if (frames % 700 === 0) difficulty += .2;

        if (frames % 1800 === 0 && !bossActive) {
            spawnBoss();
        } else {
            let screenScale = Math.max(0.5, 1200 / w);
            let spawnInterval = Math.max(8, Math.floor((45 - difficulty * 5) * screenScale));
            if (frames % spawnInterval === 0 && !bossActive) {
                spawnEnemy();
            }
        }

        player.update();

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (!p.bgStar) p.alpha -= 0.02;
        });
        particles = particles.filter(p => p.y < h && (p.bgStar || p.alpha > 0));

        loot.forEach(l => {
            l.y += 3;
            l.x += Math.sin(frames / 15 + l.y) * 0.5;
            if (player && Math.hypot(l.x - player.x, l.y - player.y) < 30) {
                l.collected = true;
                crystals += l.value;
                localStorage.setItem('savedCrystals', crystals);
                updateHUD();
            }
        });
        loot = loot.filter(l => !l.collected && l.y < h);

        bullets.forEach(b => b.y += b.v);

        enemies.forEach(e => {
            if (e.dmgCd > 0) e.dmgCd--;
            if (e.pattern === 'zigzag') {
                e.y += e.v;
                e.x += Math.sin(frames / 10 + e.seed) * 4;
            } else if (e.pattern === 'boss') {
                if (e.y < 100) e.y += e.v;
                else e.x += Math.sin(frames / 40) * 3;
            } else if (e.pattern === 'boss_zigzag') {
                if (e.y < 120) e.y += e.v * 1.5;
                else {
                    e.x += Math.sin(frames / 20) * 5;
                    e.y += Math.cos(frames / 40) * 0.8;
                }
            } else if (e.pattern === 'boss_heavy') {
                if (e.y < 80) e.y += e.v * 0.8;
                else e.x += Math.sin(frames / 60) * 2;
            } else {
                e.y += e.v;
            }

            if (e.canShoot && frames - e.lastShot >= e.fireRate) {
                e.lastShot = frames;
                if (e.type === 'boss') {
                    if (e.bossType === 'fast') {
                        bullets.push({ x: e.x - 20, y: e.y + 20, v: 9, vx: -0.5, o: 'e' });
                        bullets.push({ x: e.x + 20, y: e.y + 20, v: 9, vx: 0.5, o: 'e' });
                    } else if (e.bossType === 'shielded') {
                        for (let angle = -3; angle <= 3; angle += 1.5) {
                            bullets.push({ x: e.x, y: e.y + 40, v: 6, vx: angle, o: 'e' });
                        }
                    } else {
                        for (let angle = -2; angle <= 2; angle++) {
                            bullets.push({ x: e.x, y: e.y + 30, v: 7, vx: angle * 1.5, o: 'e' });
                        }
                    }
                } else {
                    bullets.push({ x: e.x, y: e.y + e.w / 2, v: 7, vx: 0, o: 'e' });
                }
            }
        });

        bullets.forEach(b => { if (b.vx) b.x += b.vx; });

        bullets.forEach(b => {
            if (b.o === 'p') {
                enemies.forEach(e => {
                    if (!e.dead && Math.hypot(b.x - e.x, b.y - e.y) < e.w) {
                        b.dead = true;
                        e.hp -= godMode ? 500 : playerStats.damage;
                        if (e.type === 'boss') {
                            bossHealthBar.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';
                        }
                        if (e.hp <= 0) {
                            e.dead = true;
                            score += e.s;
                            createExplosion(e.x, e.y, e.color, e.type === 'boss' ? 50 : 15);
                            const drops = e.type === 'boss' ? 8 : (Math.random() > .5 ? 1 : 0);
                            for(let i=0; i<drops; i++) {
                                loot.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y, value: 5, collected: false });
                            }
                            if (e.type === 'boss') {
                                bossActive = false;
                                bossHud.classList.add('hidden');
                            }
                            updateHUD();
                        }
                    }
                });
            } else if (b.o === 'e') {
                if (player && Math.hypot(b.x - player.x, b.y - player.y) < 18) {
                    b.dead = true;
                    player.damage(15);
                }
            }
        });

        enemies.forEach(e => {
            if (player && !e.dead && Math.hypot(e.x - player.x, e.y - player.y) < e.w + 10) {
                if (e.type === 'boss') {
                    if (e.dmgCd === 0) {
                        player.damage(50);
                        e.dmgCd = 30;
                    }
                } else {
                    e.dead = true;
                    player.damage(25);
                    createExplosion(e.x, e.y, e.color, 15);
                }
            }
        });

        bullets = bullets.filter(b => !b.dead && b.y > -20 && b.y < h + 20);
        enemies = enemies.filter(e => !e.dead && e.y < h + 50 && e.x > -50 && e.x < w + 50);
    }

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    if (player) player.draw();

    loot.forEach(l => {
        ctx.fillStyle = '#eab308';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#eab308';
        ctx.beginPath();
        ctx.moveTo(l.x, l.y - 8);
        ctx.lineTo(l.x + 6, l.y);
        ctx.lineTo(l.x, l.y + 8);
        ctx.lineTo(l.x - 6, l.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    bullets.forEach(b => {
        ctx.fillStyle = b.o === 'p' ? '#00f3ff' : '#ff00ee';
        ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
    });

    enemies.forEach(e => {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = e.color;
        ctx.beginPath();
        if (e.type === 'scout') {
            ctx.moveTo(e.x, e.y + e.w);
            ctx.lineTo(e.x - e.w/2, e.y - e.w/2);
            ctx.lineTo(e.x + e.w/2, e.y - e.w/2);
        } else if (e.type === 'heavy') {
            ctx.moveTo(e.x - e.w/2, e.y - e.w/2);
            ctx.lineTo(e.x + e.w/2, e.y - e.w/2);
            ctx.lineTo(e.x + e.w/4, e.y + e.w/2);
            ctx.lineTo(e.x - e.w/4, e.y + e.w/2);
        } else if (e.type === 'boss') {
            ctx.moveTo(e.x, e.y + e.w/2);
            ctx.lineTo(e.x + e.w, e.y - e.w/4);
            ctx.lineTo(e.x + e.w/2, e.y - e.w/2);
            ctx.lineTo(e.x - e.w/2, e.y - e.w/2);
            ctx.lineTo(e.x - e.w, e.y - e.w/4);
        } else {
            ctx.moveTo(e.x, e.y - e.w/2);
            ctx.lineTo(e.x + e.w/2, e.y);
            ctx.lineTo(e.x, e.y + e.w/2);
            ctx.lineTo(e.x - e.w/2, e.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
    });

    requestAnimationFrame(loop);
}

window.onload = () => {
    resize();
    window.addEventListener('resize', resize);
    loadInitialLeaderboard();

    const setIn = e => {
        if (!player || paused) return;
        input.x = e.clientX || (e.touches && e.touches[0].clientX) || w / 2;
        input.y = e.clientY || (e.touches && e.touches[0].clientY) || h - 100;
    };

    canvas.addEventListener('mousemove', setIn);
    canvas.addEventListener('touchmove', e => {
        if (!player || paused) return;
        e.preventDefault();
        setIn(e);
    }, { passive: false });

    document.getElementById('startBtn').onclick = e => { e.preventDefault(); e.stopPropagation(); startGame(); };
    document.getElementById('restartBtn').onclick = e => { e.preventDefault(); e.stopPropagation(); startGame(); };

    document.getElementById('goShopBtn').onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('shopMenu').classList.remove('hidden');
        renderShop();
    };

    document.getElementById('mainShopBtn').onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('shopMenu').classList.remove('hidden');
        renderShop();
    };

    shopPlayBtn.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        if (player && player.hp > 0) {
            document.getElementById('shopMenu').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
            paused = false;
        } else {
            startGame();
        }
    };

    document.getElementById('verifyBtn').onclick = e => { e.preventDefault(); e.stopPropagation(); checkEasterEgg(); };
    document.getElementById('secretInput').onkeydown = e => {
        if (e.key === 'Enter') checkEasterEgg();
    };

    loop();
};