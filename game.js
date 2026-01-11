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
ctx.line
