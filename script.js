let startTime
let ready=false
let timeout

const gameBox=document.getElementById("gameBox")
const message=document.getElementById("message")
const result=document.getElementById("result")

function startGame(){

result.innerHTML=""
message.innerText="Wait for green..."
gameBox.style.background="#444"

ready=false

let delay=Math.random()*3000+2000

timeout=setTimeout(()=>{

gameBox.style.background="green"
message.innerText="TAP NOW!"

startTime=Date.now()
ready=true

},delay)

}

gameBox.onclick=function(){

if(!ready){

clearTimeout(timeout)

message.innerText="Too soon! Try again."
return

}

let reaction=Date.now()-startTime

result.innerHTML="Your reaction time: "+reaction+" ms"

ready=false
message.innerText="Tap START to play again."

}

function share(){

let text="My reaction time is amazing! Try beating me!"

let url=window.location.href

window.open(
"https://www.facebook.com/sharer/sharer.php?u="+url+"&quote="+text
)

}
