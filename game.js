const canvas=document.getElementById('gameCanvas')
const ctx=canvas.getContext('2d')

let w,h,frames=0,score=0,crystals=0,difficulty=1,paused=false
let bullets=[],enemies=[],loot=[],particles=[]
let player

const scoreDisplay=document.getElementById('scoreDisplay')
const crystalDisplay=document.getElementById('crystalDisplay')
const healthBar=document.getElementById('healthBar')
const pauseBtn=document.getElementById('pauseBtn')

const playerStats={maxHp:100,damage:10,fireRate:15,speed:.18,spread:1}

const upgrades=[
{id:'dmg',name:'DÉGÂTS',cost:50,lvl:1,max:10,apply:()=>playerStats.damage+=5},
{id:'rate',name:'CADENCE',cost:75,lvl:1,max:8,apply:()=>playerStats.fireRate=Math.max(4,playerStats.fireRate-1)},
{id:'hp',name:'COQUE',cost:60,lvl:1,max:10,apply:()=>{playerStats.maxHp+=30;player.hp=playerStats.maxHp}},
{id:'spr',name:'MULTI-TIR',cost:200,lvl:1,max:5,apply:()=>playerStats.spread++}
]

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
this.y=h-100
this.hp=playerStats.maxHp
this.lastShot=0
this.inv=0
}
update(){
this.x+=(input.x-this.x)*playerStats.speed
this.y+=(input.y-60-this.y)*playerStats.speed
this.x=Math.max(20,Math.min(w-20,this.x))
this.y=Math.max(20,Math.min(h-20,this.y))
if(frames-this.lastShot>=playerStats.fireRate){
this.lastShot=frames
for(let i=0;i<playerStats.spread;i++){
bullets.push({x:this.x+(i-(playerStats.spread-1)/2)*15,y:this.y-20,v:-12,o:'p'})
}
}
if(this.inv>0)this.inv--
}
draw(){
if(this.inv>0&&Math.floor(frames/5)%2)return
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
damage(a){
if(this.inv>0)return
this.hp-=a
this.inv=40
updateHUD()
if(this.hp<=0)gameOver()
}
}

function spawnEnemy(){
const r=Math.random()
let e={x:Math.random()*(w-40)+20,y:-40}
if(r<.7){e.hp=20*difficulty;e.v=2.5;e.w=25;e.s=100}
else if(r<.9){e.hp=10*difficulty;e.v=5;e.w=15;e.s=150}
else{e.hp=60*difficulty;e.v=1.2;e.w=40;e.s=300}
enemies.push(e)
}

function updateHUD(){
scoreDisplay.innerText=score
crystalDisplay.innerText=crystals
healthBar.style.width=Math.max(0,(player.hp/playerStats.maxHp)*100)+'%'
}

function renderShop(){
const list=document.getElementById('upgradeList')
list.innerHTML=''
upgrades.forEach(u=>{
const cost=Math.floor(u.cost*Math.pow(1.6,u.lvl-1))
const div=document.createElement('div')
div.className='p-3 border border-cyan-500 rounded flex justify-between'
div.innerHTML=`<span>${u.name} Lvl ${u.lvl>u.max?'MAX':u.lvl}</span><button>${u.lvl>u.max?'MAX':cost+' 💎'}</button>`
if(crystals>=cost&&u.lvl<=u.max){
div.onclick=()=>{
crystals-=cost
u.lvl++
u.apply()
renderShop()
updateHUD()
}
}else div.style.opacity=.4
list.appendChild(div)
})
}

function saveScore(){
let lb=JSON.parse(localStorage.getItem('leaderboard')||'[]')
lb.push(score)
lb=lb.sort((a,b)=>b-a).slice(0,5)
localStorage.setItem('leaderboard',JSON.stringify(lb))
const ul=document.getElementById('leaderboard')
ul.innerHTML=''
lb.forEach(s=>{
const li=document.createElement('li')
li.innerText=s
ul.appendChild(li)
})
}

function startGame(){
player=new Player()
bullets=[]
enemies=[]
loot=[]
particles=[]
frames=0
score=0
crystals=0
difficulty=1
paused=false
pauseBtn.innerText='PAUSE'
pauseBtn.classList.remove('hidden')
document.getElementById('mainMenu').classList.add('hidden')
document.getElementById('gameOverMenu').classList.add('hidden')
document.getElementById('shopMenu').classList.add('hidden')
document.getElementById('hud').classList.remove('hidden')
updateHUD()
}

function gameOver(){
pauseBtn.classList.add('hidden')
document.getElementById('hud').classList.add('hidden')
document.getElementById('finalScore').innerText=score
saveScore()
document.getElementById('gameOverMenu').classList.remove('hidden')
}

const input={x:0,y:0}

function loop(){
ctx.fillStyle='#000'
ctx.fillRect(0,0,w,h)

if(!paused&&player){
frames++
if(frames%600===0)difficulty+=.2
if(frames%Math.max(20,80-difficulty*5)===0)spawnEnemy()

player.update()
player.draw()

bullets.forEach(b=>b.y+=b.v)
enemies.forEach(e=>e.y+=e.v)

bullets.forEach(b=>{
if(b.o==='p'){
enemies.forEach(e=>{
if(!e.dead&&Math.hypot(b.x-e.x,b.y-e.y)<e.w){
b.dead=true
e.hp-=playerStats.damage
if(e.hp<=0){
e.dead=true
score+=e.s
if(Math.random()>.6)crystals+=5
updateHUD()
}
}
})
}
})

enemies.forEach(e=>{
if(Math.hypot(e.x-player.x,e.y-player.y)<e.w+10){
e.dead=true
player.damage(25)
}
})

bullets=bullets.filter(b=>!b.dead&&b.y>-20)
enemies=enemies.filter(e=>!e.dead&&e.y<h+40)
}

ctx.fillStyle='#00f3ff'
bullets.forEach(b=>ctx.fillRect(b.x-2,b.y-10,4,10))

ctx.strokeStyle='#ff0055'
enemies.forEach(e=>ctx.strokeRect(e.x-e.w/2,e.y-e.w/2,e.w,e.w))

requestAnimationFrame(loop)
}

window.onload=()=>{
resize()
window.addEventListener('resize',resize)

const setIn=e=>{
input.x=e.clientX||e.touches[0].clientX
input.y=e.clientY||e.touches[0].clientY
}

canvas.addEventListener('mousemove',setIn)
canvas.addEventListener('touchmove',e=>{e.preventDefault();setIn(e)},{passive:false})

document.getElementById('startBtn').onclick=startGame
document.getElementById('restartBtn').onclick=startGame
document.getElementById('goShopBtn').onclick=()=>{
document.getElementById('gameOverMenu').classList.add('hidden')
document.getElementById('shopMenu').classList.remove('hidden')
renderShop()
}
document.getElementById('shopPlayBtn').onclick=startGame

loop()
}
