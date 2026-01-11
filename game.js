const canvas=document.getElementById('gameCanvas')
const ctx=canvas.getContext('2d')

const STATE={MENU:0,PLAYING:1,GAMEOVER:2,SHOP:3}
let currentState=STATE.MENU,width,height,frames=0,score=0,crystals=0,difficulty=1
let player,bullets=[],enemies=[],particles=[],loot=[],stars=[]
let paused=false

const input={x:0,y:0,active:false}
const playerStats={maxHp:100,damage:10,fireRate:15,speed:0.18,spread:1}

const pauseBtn=document.getElementById('pauseBtn')

pauseBtn.onclick=()=>{
    paused=!paused
    pauseBtn.innerText=paused?'REPRENDRE':'PAUSE'
}

function resize(){
    width=canvas.width=window.innerWidth
    height=canvas.height=window.innerHeight
}

class Player{
    constructor(){
        this.x=width/2
        this.y=height-100
        this.hp=playerStats.maxHp
        this.lastShot=0
        this.inv=0
    }
    update(){
        if(input.active){
            this.x+=(input.x-this.x)*playerStats.speed
            this.y+=(input.y-60-this.y)*playerStats.speed
        }
        this.x=Math.max(20,Math.min(width-20,this.x))
        this.y=Math.max(20,Math.min(height-20,this.y))
        if(frames-this.lastShot>=playerStats.fireRate){
            this.lastShot=frames
            bullets.push({x:this.x,y:this.y-20,v:-12,o:'p'})
        }
        if(this.inv>0) this.inv--
    }
    draw(){
        ctx.strokeStyle='#00f3ff'
        ctx.lineWidth=3
        ctx.beginPath()
        ctx.moveTo(this.x,this.y-20)
        ctx.lineTo(this.x+15,this.y+15)
        ctx.lineTo(this.x,this.y+5)
        ctx.lineTo(this.x-15,this.y+15)
        ctx.closePath()
        ctx.stroke()
    }
}

function startGame(){
    player=new Player()
    bullets=[]
    enemies=[]
    loot=[]
    particles=[]
    score=0
    difficulty=1
    frames=0
    paused=false
    pauseBtn.innerText='PAUSE'
    pauseBtn.classList.remove('hidden')
    currentState=STATE.PLAYING
    document.getElementById('mainMenu').classList.add('hidden')
    document.getElementById('gameOverMenu').classList.add('hidden')
    document.getElementById('shopMenu').classList.add('hidden')
    document.getElementById('hud').classList.remove('hidden')
}

function gameOver(){
    currentState=STATE.GAMEOVER
    pauseBtn.classList.add('hidden')
    document.getElementById('finalScore').innerText=score
    document.getElementById('hud').classList.add('hidden')
    document.getElementById('gameOverMenu').classList.remove('hidden')
}

function loop(){
    ctx.fillStyle='#000'
    ctx.fillRect(0,0,width,height)
    if(currentState===STATE.PLAYING && !paused){
        frames++
        player.update()
        player.draw()
    }
    requestAnimationFrame(loop)
}

window.onload=()=>{
    resize()
    window.addEventListener('resize',resize)
    document.getElementById('startBtn').onclick=startGame
    document.getElementById('restartBtn').onclick=startGame
    loop()
}
