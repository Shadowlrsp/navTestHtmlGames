const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

let w, h, frames = 0,
    score = 0,
    crystals = 0,
    difficulty = 1,
    paused = false,
    bossActive = false

let bullets = [],
    enemies = [],
    loot = [],
    particles = []
let player

const scoreDisplay = document.getElementById('scoreDisplay')
const crystalDisplay = document.getElementById('crystalDisplay')
const healthBar = document.getElementById('healthBar')
const bossHud = document.getElementById('bossHud')
const bossHealthBar = document.getElementById('bossHealthBar')
const pauseBtn = document.getElementById('pauseBtn')

const playerStats = {
    maxHp: 100,
    damage: 10,
    fireRate: 15,
    speed: .18,
    spread: 1
}

const upgrades = [{
        id: 'dmg',
        name: 'DÉGÂTS',
        cost: 50,
        lvl: 1,
        max: 10,
        apply: () => playerStats.damage += 5
    },
    {
        id: 'rate',
        name: 'CADENCE',
        cost: 75,
        lvl: 1,
        max: 8,
        apply: () => playerStats.fireRate = Math.max(4, playerStats.fireRate - 1)
    },
    {
        id: 'hp',
        name: 'COQUE',
        cost: 60,
        lvl: 1,
        max: 10,
        apply: () => {
            playerStats.maxHp += 30;
            player.hp = playerStats.maxHp
        }
    },
    {
        id: 'spr',
        name: 'MULTI-TIR',
        cost: 200,
        lvl: 1,
        max: 5,
        apply: () => playerStats.spread++
    }
]

pauseBtn.onclick = e => {
    e.stopPropagation()
    paused = !paused
    pauseBtn.innerText = paused ? 'REPRENDRE' : 'PAUSE'
}

function resize() {
    w = canvas.width = window.innerWidth
    h = canvas.height = window.innerHeight
}

class Player {
    constructor() {
        this.x = w / 2
        this.y = h - 100
        this.hp = playerStats.maxHp
        this.lastShot = 0
        this.inv = 0
        this.knockbackY = 0
    }
    update() {
        // applique le deplacement normal combiné au recul s'il y en a un
        this.x += (input.x - this.x) * playerStats.speed
        this.y += (input.y - 60 - this.y) * playerStats.speed + this.knockbackY
        
        // reduit l'effet de recul progressivement jusqu'a zero
        this.knockbackY *= 0.8
        if (Math.abs(this.knockbackY) < 0.1) this.knockbackY = 0

        this.x = Math.max(20, Math.min(w - 20, this.x))
        this.y = Math.max(20, Math.min(h - 20, this.y))
        
        if (frames - this.lastShot >= playerStats.fireRate) {
            this.lastShot = frames
            for (let i = 0; i < playerStats.spread; i++) {
                bullets.push({
                    x: this.x + (i - (playerStats.spread - 1) / 2) * 15,
                    y: this.y - 20,
                    v: -14,
                    o: 'p'
                })
            }
        }
        if (this.inv > 0) this.inv--
    }
    draw() {
        if (this.inv > 0 && Math.floor(frames / 5) % 2) return
        ctx.strokeStyle = '#00f3ff'
        ctx.lineWidth = 3
        ctx.shadowBlur = 10
        ctx.shadowColor = '#00f3ff'
        ctx.beginPath()
        ctx.moveTo(this.x, this.y - 20)
        ctx.lineTo(this.x + 15, this.y + 15)
        ctx.lineTo(this.x, this.y + 5)
        ctx.lineTo(this.x - 15, this.y + 15)
        ctx.closePath()
        ctx.stroke()
        ctx.shadowBlur = 0
    }
    damage(a) {
        if (this.inv > 0) return
        this.hp -= a
        this.inv = 30
        this.knockbackY = 40 // pousse le joueur vers le bas lors d'un choc
        updateHUD()
        createExplosion(this.x, this.y, '#00f3ff', 10)
        if (this.hp <= 0) gameOver()
    }
}

function spawnEnemy() {
    if (bossActive) return
    
    const r = Math.random()
    let e = {
        x: Math.random() * (w - 60) + 30,
        y: -40,
        dead: false,
        lastShot: frames + Math.random() * 30,
        dmgCd: 0
    }

    if (r < .5) {
        e.hp = 20 * difficulty; e.maxHp = e.hp; e.v = 2.5; e.w = 26; e.s = 100; e.type = 'basic'; e.color = '#ff0055'; e.canShoot = false; e.pattern = 'straight';
    } else if (r < .8) {
        e.hp = 12 * difficulty; e.maxHp = e.hp; e.v = 4; e.w = 20; e.s = 150; e.type = 'scout'; e.color = '#00ffaa'; e.canShoot = true; e.fireRate = 45; e.pattern = 'zigzag'; e.seed = Math.random() * 100;
    } else {
        e.hp = 65 * difficulty; e.maxHp = e.hp; e.v = 1.2; e.w = 40; e.s = 300; e.type = 'heavy'; e.color = '#ffaa00'; e.canShoot = true; e.fireRate = 70; e.pattern = 'straight';
    }
    enemies.push(e)
}

function spawnBoss() {
    bossActive = true
    bossHealthBar.style.width = '100%'
    bossHud.classList.remove('hidden')
    let b = {
        x: w / 2,
        y: -100,
        hp: 500 * difficulty,
        maxHp: 500 * difficulty,
        v: 1,
        w: 90,
        s: 2000,
        type: 'boss',
        color: '#ff00ff',
        canShoot: true,
        fireRate: 35,
        lastShot: 0,
        pattern: 'boss',
        dead: false,
        dmgCd: 0
    }
    enemies.push(b)
}

function createExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 3 + 2,
            alpha: 1,
            color: color
        })
    }
}

function updateHUD() {
    scoreDisplay.innerText = score
    crystalDisplay.innerText = crystals
    healthBar.style.width = Math.max(0, (player.hp / playerStats.maxHp) * 100) + '%'
}

function renderShop() {
    const list = document.getElementById('upgradeList')
    list.innerHTML = ''
    upgrades.forEach(u => {
        const cost = Math.floor(u.cost * Math.pow(1.6, u.lvl - 1))
        const div = document.createElement('div')
        div.className = 'p-3 border border-cyan-500 rounded flex justify-between items-center bg-cyan-950/20'
        div.innerHTML = `<span>${u.name} Lvl ${u.lvl > u.max ? 'MAX' : u.lvl}</span>
                         <button class="px-3 py-1 bg-cyan-500/20 border border-cyan-500 rounded text-sm">${u.lvl > u.max ? 'MAX' : cost + ' 💎'}</button>`
        
        if (crystals >= cost && u.lvl <= u.max) {
            div.querySelector('button').onclick = () => {
                crystals -= cost
                u.lvl++
                u.apply()
                renderShop()
                updateHUD()
            }
        } else {
            div.style.opacity = .4
        }
        list.appendChild(div)
    })
}

function saveScore() {
    let lb = localStorage.getItem('leaderboard')
    if (!lb) {
        lb = [7500, 5100, 3200, 1500, 600]
    } else {
        lb = JSON.parse(lb)
    }
    
    lb.push(score)
    lb = lb.sort((a, b) => b - a).slice(0, 5)
    localStorage.setItem('leaderboard', JSON.stringify(lb))
    
    const ul = document.getElementById('leaderboard')
    ul.innerHTML = ''
    lb.forEach(s => {
        const li = document.createElement('li')
        li.innerText = s + " PTS"
        ul.appendChild(li)
    })
}

function loadInitialLeaderboard() {
    let lb = localStorage.getItem('leaderboard')
    if (!lb) {
        lb = [7500, 5100, 3200, 1500, 600]
        localStorage.setItem('leaderboard', JSON.stringify(lb))
    } else {
        lb = JSON.parse(lb)
    }
    const ul = document.getElementById('leaderboard')
    ul.innerHTML = ''
    lb.forEach(s => {
        const li = document.createElement('li')
        li.innerText = s + " PTS"
        ul.appendChild(li)
    })
}

function startGame() {
    player = new Player()
    bullets = []
    enemies = []
    loot = []
    particles = []
    frames = 0
    score = 0
    crystals = 0
    difficulty = 1
    paused = false
    bossActive = false
    bossHealthBar.style.width = '100%'
    bossHud.classList.add('hidden')
    pauseBtn.innerText = 'PAUSE'
    pauseBtn.classList.remove('hidden')
    document.getElementById('mainMenu').classList.add('hidden')
    document.getElementById('gameOverMenu').classList.add('hidden')
    document.getElementById('shopMenu').classList.add('hidden')
    document.getElementById('hud').classList.remove('hidden')
    updateHUD()
}

function gameOver() {
    paused = true // stop
    pauseBtn.classList.add('hidden')
    bossHud.classList.add('hidden')
    document.getElementById('hud').classList.add('hidden')
    document.getElementById('finalScore').innerText = score
    saveScore()
    document.getElementById('gameOverMenu').classList.remove('hidden')
}

const input = { x: window.innerWidth / 2, y: window.innerHeight - 100 }

function loop() {
    ctx.fillStyle = '#050510'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#ffffff'
    if (frames % 4 === 0 && !paused) {
        particles.push({x: Math.random() * w, y: 0, vx: 0, vy: 2, size: 1, alpha: 0.5, color: '#fff', bgStar: true})
    }

    if (!paused && player) {
        frames++
        
        if (frames % 700 === 0) difficulty += .2
        
        if (frames % 1600 === 0 && !bossActive) {
            spawnBoss()
        } else {
            // plus la fenetre est large w, plus l'intervalle diminue, donc plus d'ennemis apparaissent
            let screenScale = Math.max(0.5, 1200 / w)
            let spawnInterval = Math.max(8, Math.floor((45 - difficulty * 5) * screenScale))
            
            if (frames % spawnInterval === 0 && !bossActive) {
                spawnEnemy()
            }
        }

        player.update()

        particles.forEach(p => {
            p.x += p.vx
            p.y += p.vy
            if (!p.bgStar) p.alpha -= 0.02
        })
        particles = particles.filter(p => p.y < h && (p.bgStar || p.alpha > 0))

        loot.forEach(l => {
            l.y += 2
            l.x += Math.sin(frames / 15 + l.y) * 0.5
            if (Math.hypot(l.x - player.x, l.y - player.y) < 30) {
                l.collected = true
                crystals += l.value
                updateHUD()
            }
        })
        loot = loot.filter(l => !l.collected && l.y < h)

        bullets.forEach(b => b.y += b.v)

        enemies.forEach(e => {
            if (e.dmgCd > 0) e.dmgCd--

            if (e.pattern === 'zigzag') {
                e.y += e.v
                e.x += Math.sin(frames / 10 + e.seed) * 3
            } else if (e.pattern === 'boss') {
                if (e.y < 100) e.y += e.v
                else e.x += Math.sin(frames / 40) * 2
            } else {
                e.y += e.v
            }

            if (e.canShoot && frames - e.lastShot >= e.fireRate) {
                e.lastShot = frames
                if (e.type === 'boss') {
                    for (let angle = -2; angle <= 2; angle++) {
                        bullets.push({ x: e.x, y: e.y + 30, v: 5, vx: angle * 1.5, o: 'e' })
                    }
                } else {
                    bullets.push({ x: e.x, y: e.y + e.w / 2, v: 5, vx: 0, o: 'e' })
                }
            }
        })

        bullets.forEach(b => { if (b.vx) b.x += b.vx })

        bullets.forEach(b => {
            if (b.o === 'p') {
                enemies.forEach(e => {
                    if (!e.dead && Math.hypot(b.x - e.x, b.y - e.y) < e.w) {
                        b.dead = true
                        e.hp -= playerStats.damage
                        if (e.type === 'boss') {
                            bossHealthBar.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%'
                        }
                        if (e.hp <= 0) {
                            e.dead = true
                            score += e.s
                            createExplosion(e.x, e.y, e.color, e.type === 'boss' ? 50 : 15)
                            
                            const drops = e.type === 'boss' ? 8 : (Math.random() > .5 ? 1 : 0)
                            for(let i=0; i<drops; i++) {
                                loot.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y, value: 5, collected: false })
                            }
                            
                            if (e.type === 'boss') {
                                bossActive = false
                                bossHud.classList.add('hidden')
                            }
                            updateHUD()
                        }
                    }
                })
            } else if (b.o === 'e') {
                if (Math.hypot(b.x - player.x, b.y - player.y) < 18) {
                    b.dead = true
                    player.damage(15)
                }
            }
        })

        enemies.forEach(e => {
            if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) < e.w + 10) {
                if (e.type === 'boss') {
                    if (e.dmgCd === 0) {
                        player.damage(50)
                        e.dmgCd = 30 
                    }
                } else {
                    e.dead = true
                    player.damage(25)
                    createExplosion(e.x, e.y, e.color, 15)
                }
            }
        })

        bullets = bullets.filter(b => !b.dead && b.y > -20 && b.y < h + 20)
        enemies = enemies.filter(e => !e.dead && e.y < h + 50 && e.x > -50 && e.x < w + 50)
    }

    particles.forEach(p => {
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fillRect(p.x, p.y, p.size, p.size)
    })
    ctx.globalAlpha = 1

    if (player) player.draw()

    loot.forEach(l => {
        ctx.fillStyle = '#eab308'
        ctx.shadowBlur = 8
        ctx.shadowColor = '#eab308'
        ctx.beginPath()
        ctx.moveTo(l.x, l.y - 8)
        ctx.lineTo(l.x + 6, l.y)
        ctx.lineTo(l.x, l.y + 8)
        ctx.lineTo(l.x - 6, l.y)
        ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0
    })

    bullets.forEach(b => {
        ctx.fillStyle = b.o === 'p' ? '#00f3ff' : '#ff00ee'
        ctx.fillRect(b.x - 2, b.y - 8, 4, 16)
    })

    enemies.forEach(e => {
        ctx.strokeStyle = e.color
        ctx.lineWidth = 2
        ctx.shadowBlur = 8
        ctx.shadowColor = e.color
        ctx.beginPath()
        
        if (e.type === 'scout') {
            ctx.moveTo(e.x, e.y + e.w)
            ctx.lineTo(e.x - e.w/2, e.y - e.w/2)
            ctx.lineTo(e.x + e.w/2, e.y - e.w/2)
        } else if (e.type === 'heavy') {
            ctx.moveTo(e.x - e.w/2, e.y - e.w/2)
            ctx.lineTo(e.x + e.w/2, e.y - e.w/2)
            ctx.lineTo(e.x + e.w/4, e.y + e.w/2)
            ctx.lineTo(e.x - e.w/4, e.y + e.w/2)
        } else if (e.type === 'boss') {
            ctx.moveTo(e.x, e.y + e.w/2)
            ctx.lineTo(e.x + e.w, e.y - e.w/4)
            ctx.lineTo(e.x + e.w/2, e.y - e.w/2)
            ctx.lineTo(e.x - e.w/2, e.y - e.w/2)
            ctx.lineTo(e.x - e.w, e.y - e.w/4)
        } else {
            ctx.moveTo(e.x, e.y - e.w/2)
            ctx.lineTo(e.x + e.w/2, e.y)
            ctx.lineTo(e.x, e.y + e.w/2)
            ctx.lineTo(e.x - e.w/2, e.y)
        }
        
        ctx.closePath()
        ctx.stroke()
        ctx.shadowBlur = 0
    })

    requestAnimationFrame(loop)
}

window.onload = () => {
    resize()
    window.addEventListener('resize', resize)
    loadInitialLeaderboard()

    const setIn = e => {
        input.x = e.clientX || (e.touches && e.touches[0].clientX) || w / 2
        input.y = e.clientY || (e.touches && e.touches[0].clientY) || h - 100
    }

    canvas.addEventListener('mousemove', setIn)
    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        setIn(e)
    }, { passive: false })

    document.getElementById('startBtn').onclick = startGame
    document.getElementById('restartBtn').onclick = startGame
    document.getElementById('goShopBtn').onclick = () => {
        document.getElementById('gameOverMenu').classList.add('hidden')
        document.getElementById('shopMenu').classList.remove('hidden')
        renderShop()
    }
    document.getElementById('shopPlayBtn').onclick = startGame

    loop()
}