const roomName = JSON.parse(document.getElementById('room-name').textContent);
const user = JSON.parse(document.getElementById('user').textContent);
document.getElementById('hiddeninput').addEventListener('change',handleFileSelect,false)
function handleFileSelect(){
    var file = document.getElementById('hiddeninput').files[0]
    getBase64(file, file.type)
}
function getBase64(file, filetype){
    var type = filetype.split('/')[0]
    var reader = new FileReader();
    reader.readAsDataURL(file)

    reader.onload = function(){
        chatSocket.send(JSON.stringify({
            'type_control':type,
            'message':reader.result
        }))
    }
}

var isRecord = false
const startStop = document.getElementById('mic');

startStop.onclick=()=>{
    if(isRecord){
        StopRecord();
        mic.style.color = "";
        isRecord = false;
    }
    else{
        StartRecord();
        mic.style.color = "red";
        isRecord = true;
    }
}

function StartRecord(){
    navigator.mediaDevices.getUserMedia({audio:true})
    .then(stream=>{
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        dataArray = [];

        mediaRecorder.ondataavailable = function(e){
            dataArray.push(e.data);
        }

        mediaRecorder.onstop = function(e){
            audioData = new Blob(dataArray, {'type':"audio/mp3"})
            dataArray= []
            getBase64(audioData, audioData.type)

        stream.getTracks().forEach(function(track){
            if(track.readyState=="live" && track.kind==="audio"){
                track.stop();
            }
        })
        }
    })
}

function StopRecord(){
    mediaRecorder.stop();
}


const conservation = document.getElementById('conversation');
// Scrool
conservation.scrollTop = conservation.scrollHeight;
        // Connection / Bağlantı 
        const chatSocket = new WebSocket(
            'ws://' + window.location.host + '/ws/chat/' + roomName + '/'
        );
        // WEbSoketten veri geldiğinde çalışır.
        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            const message_type = data.type_control;
            if (message_type === "text"){
                var message = data.message
            }
            else if(message_type === "image"){
                var message = `<img src="${data.message}" width="250" heigth="250">`
            }
            else if(message_type === "audio"){
                var message = `<audio width="250" controls><source src="${data.message}"></audio>`
            }
            else if(message_type === "video"){
                var message = `<video width="320" height="240" controls><source src="${data.message}"></video>`
            }
            if(user==data.user){
                var message = `<div class="row message-body">
                <div class="col-sm-12 message-main-sender">
                <div class="sender">
                    <div class="message-text">
                    ${message}
                    </div>
                    <span class="message-time pull-right">
                    ${data.date}
                    </span>
                </div>
                </div>
            </div>`
            }
            else{
                var message = `<div class="row message-body">
                <div class="col-sm-12 message-main-receiver">
                <div class="receiver">
                    <div class="message-text">
                    ${message}
                    </div>
                    <span class="message-time pull-right">
                    ${data.date}
                    </span>
                </div>
                </div>
            </div>`
            }
        conservation.innerHTML += message;
        // Scrool
        conservation.scrollTop = conservation.scrollHeight;
        };
        // WEbSoketten bağlantısı kapandığında 
        chatSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };
        // Sayfa açıldığında inputa odaklar
        document.querySelector('#comment').focus();
        // Enter tuşuna basıldığında mesajı göndermek için

        document.querySelector('#comment').onkeyup = function(e) {
            if (e.keyCode === 13) {  // enter, return
                document.querySelector('#send').click();
            }
        };
        // Mesajın json'a çevirilirip gönderilmesi işin yapar.
        document.querySelector('#send').onclick = function(e) {
            const messageInputDom = document.querySelector('#comment');
            const message = messageInputDom.value;
            chatSocket.send(JSON.stringify({
                'type_control':"text",
                'message': message
            }));
            messageInputDom.value = '';
        };