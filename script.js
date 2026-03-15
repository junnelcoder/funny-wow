let score=0
let time=10
let gameRunning=false

const dot=document.getElementById("dot")
const scoreText=document.getElementById("score")
const timerText=document.getElementById("timer")

function randomPosition(){

let x=Math.random()*260
let y=Math.random()*260

dot.style.left=x+"px"
dot.style.top=y+"px"

}

dot.onclick=function(){

if(!gameRunning) return

score++
scoreText.innerText="Score: "+score

randomPosition()

}

function startGame(){

score=0
time=10
gameRunning=true

scoreText.innerText="Score: 0"
timerText.innerText="Time: 10"

randomPosition()

let countdown=setInterval(()=>{

time--
timerText.innerText="Time: "+time

if(time<=0){

clearInterval(countdown)
gameRunning=false

alert("Game Over! Score: "+score)

}

},1000)

}
