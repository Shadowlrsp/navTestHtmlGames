const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

let w,h,frames=0,score=0,paused=false
let bullets=[],enemies=[]
let player

const pauseBtn=document.getElementById('pauseBtn')
const scoreDisplay=document.getElementById('scoreDisplay')

pauseBtn.onclick=e=>{
    e.stopPropagation()
    paused=!paused
    pauseBtn.innerText=paused?'REPRENDRE':'PAUSE'
}

function resize(){
    w=canvas.width=window.innerWidth
    h=canvas.height=window.innerHeight
}

class Player{
    constructor(){
        this.x=w/2
        this.y=h-80
    }
    update(){
        if(frames%15===0) bullets.push({x:this.x,y:this.y})
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

function spawnEnemy(){
    enemies.push({x:Math.random()*w,y:-20})
}

function loop(){
    ctx.fillStyle='#000'
    ctx.fillRect(0,0,w,h)

    if(!paused){
        frames++

        if(frames%60===0) spawnEnemy()

        bullets.forEach(b=>b.y-=10)
        enemies.forEach(e=>e.y+=3)

        bullets=bullets.filter(b=>b.y>-20)
        enemies=enemies.filter(e=>e.y<h+20)

        bullets.forEach(b=>{
            enemies.forEach(e=>{
                if(Math.hypot(b.x-e.x,b.y-e.y)<20){
                    e.hit=true
                    b.hit=true
                    score+=100
                    scoreDisplay.innerText=score
                }
            })
        })

        bullets=bullets.filter(b=>!b.hit)
        enemies=enemies.filter(e=>!e.hit)

        player.update()
    }

    player.draw()

    ctx.fillStyle='#00f3ff'
    bullets.forEach(b=>ctx.fillRect(b.x-2,b.y-10,4,10))

    ctx.strokeStyle='#ff0055'
    enemies.forEach(e=>ctx.strokeRect(e.x-15,e.y-15,30,30))

    requestAnimationFrame(loop)
}

function startGame(){
    bullets=[]
    enemies=[]
    score=0
    frames=0
    paused=false
    pauseBtn.innerText='PAUSE'
    pauseBtn.classList.remove('hidden')
    document.getElementById('hud').classList.remove('hidden')
    document.getElementById('mainMenu').classList.add('hidden')
    scoreDisplay.innerText=0
    player=new Player()
}

window.onload=()=>{
    resize()
    window.addEventListener('resize',resize)
    document.getElementById('startBtn').onclick=startGame
    loop()
}
