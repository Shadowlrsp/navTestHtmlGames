const canvas=document.getElementById('gameCanvas')
const ctx=canvas.getContext('2d')

const STATE={MENU:0,PLAYING:1,GAMEOVER:2}
let currentState=STATE.MENU
let width,height,frames=0,score=0
let player,paused=false

const input={x:0,y:0,active:false}

const pauseBtn=document.getElementById('pauseBtn')

pauseBtn.onclick=e=>{
    e.stopPropagation()
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
    }
    update(){
        if(input.active){
            this.x+=(input.x-this.x)*0.18
            this.y+=(input.y-60-this.y)*0.18
        }
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
    paused=false
    frames=0
    pauseBtn.innerText='PAUSE'
    pauseBtn.classList.remove('hidden')
    currentState=STATE.PLAYING
    document.getElementById('mainMenu').classList.add('hidden')
    document.getElementById('gameOverMenu').classList.add('hidden')
    document.getElementById('hud').classList.remove('hidden')
}

function gameOver(){
    currentState=STATE.GAMEOVER
    pauseBtn.classList.add('hidden')
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

    const setIn=e=>{
        input.active=true
        input.x=e.clientX||e.touches[0].clientX
        input.y=e.clientY||e.touches[0].clientY
    }

    canvas.addEventListener('mousedown',setIn)
    canvas.addEventListener('mousemove',e=>input.active&&setIn(e))
    canvas.addEventListener('mouseup',()=>input.active=false)

    canvas.addEventListener('touchstart',e=>{e.preventDefault();setIn(e)},{passive:false})
    canvas.addEventListener('touchmove',e=>{e.preventDefault();input.active&&setIn(e)},{passive:false})
    canvas.addEventListener('touchend',()=>input.active=false)

    document.getElementById('startBtn').onclick=startGame
    document.getElementById('restartBtn').onclick=startGame

    loop()
}
