window.addEventListener('DOMContentLoaded', function() {
    const roomName = JSON.parse(document.getElementById('room-name').textContent);
    const user = JSON.parse(document.getElementById('user').textContent);
    document.getElementById('hiddeninput').addEventListener('change', handleFileSelect, false);

    function handleFileSelect() {
        var file = document.getElementById('hiddeninput').files[0];
        getBase64(file, file.type);
    }

    function getBase64(file, filetype) {
        var type = filetype.split('/')[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function () {
            chatSocket.send(JSON.stringify({
                'type_control': type,
                'message': reader.result
            }));
        };
    }

    var isRecord = false;
    const startStop = document.getElementById('mic');

    startStop.onclick = () => {
        if (isRecord) {
            StopRecord();
            mic.style.color = "";
            isRecord = false;
        }
        else {
            StartRecord();
            mic.style.color = "red";
            isRecord = true;
        }
    };

    function StartRecord() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                dataArray = [];

                mediaRecorder.ondataavailable = function (e) {
                    dataArray.push(e.data);
                };

                mediaRecorder.onstop = function (e) {
                    audioData = new Blob(dataArray, { 'type': "audio/mp3" });
                    dataArray = [];
                    getBase64(audioData, audioData.type);

                    stream.getTracks().forEach(function (track) {
                        if (track.readyState == "live" && track.kind === "audio") {
                            track.stop();
                        }
                    });
                };
            });
    }

    function StopRecord() {
        mediaRecorder.stop();
    }

    const conservation = document.getElementById('conversation');
    conservation.scrollTop = conservation.scrollHeight;

    const chatSocket = new WebSocket(
        'ws://' + window.location.host + '/ws/chat/' + roomName + '/'
    );

    function sendReadReceipts() {
        const messageDivs = document.querySelectorAll('.message-body');
        const messageIds = [];

        messageDivs.forEach(div => {
            const msgId = div.getAttribute('data-message-id');
            if (msgId) {
                messageIds.push(parseInt(msgId));
            }
        });

        if (messageIds.length > 0 && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify({
                command: "read",
                message_ids: messageIds
            }));
        }
    }

    chatSocket.onopen = function() {
        sendReadReceipts();
    };

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        if (data.type === 'typing' && data.user !== user) {
            typingIndicator.style.display = 'block';
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                typingIndicator.style.display = 'none';
            }, 2000);
            return;
        }
        // SADECE GERÇEK MESAJLAR İÇİN RENDER!
        if (!data.type_control) return;
        const message_type = data.type_control;
        let messageContent;

        if (message_type === "text") {
            messageContent = data.message;
        }
        else if (message_type === "image") {
            messageContent = `<img src="${data.message}" width="250" height="250">`;
        }
        else if (message_type === "audio") {
            messageContent = `<audio width="250" controls><source src="${data.message}"></audio>`;
        }
        else if (message_type === "video") {
            messageContent = `<video width="320" height="240" controls><source src="${data.message}"></video>`;
        }

        let messageHtml;
        let messageId = data.message_id || '';
        if (user == data.user) {
            messageHtml = `<div class="row message-body" data-message-id="${messageId}">
                <div class="col-sm-12 message-main-sender">
                    <div class="sender">
                        <div class="message-text">
                            ${messageContent}
                        </div>
                        <span class="message-time pull-right">
                            ${data.date}
                        </span>
                    </div>
                </div>
            </div>`;
        }
        else {
            messageHtml = `<div class="row message-body" data-message-id="${messageId}">
                <div class="col-sm-12 message-main-receiver">
                    <div class="receiver">
                        <div class="message-text">
                            ${messageContent}
                        </div>
                        <span class="message-time pull-right">
                            ${data.date}
                        </span>
                    </div>
                </div>
            </div>`;
        }

        conservation.innerHTML += messageHtml;
        conservation.scrollTop = conservation.scrollHeight;
        sendReadReceipts();
    };

    chatSocket.onclose = function (e) {
        console.error('Chat socket closed unexpectedly');
    };

    const commentInput = document.querySelector('#comment');
    if(commentInput) commentInput.focus();

    // Sadece Enter tuşunda mesaj gönder
    if(commentInput) {
        commentInput.onkeyup = function (e) {
            if (e.keyCode === 13) {  // enter, return
                document.querySelector('#send').click();
            }
        };
        // Sadece typing eventini gönder, mesajı asla gönderme!
        commentInput.addEventListener('input', function(e) {
            chatSocket.send(JSON.stringify({ type: 'typing' }));
        });
    }

    // Sadece gönder butonunda mesaj gönder
    const sendBtn = document.querySelector('#send');
    if(sendBtn && commentInput) {
        sendBtn.onclick = function (e) {
            const message = commentInput.value;
            if (message.trim() === '') return; // Boş mesaj gönderme!
            chatSocket.send(JSON.stringify({
                'type_control': "text",
                'message': message
            }));
            commentInput.value = '';
        };
    }

    // Yazıyor animasyonu için
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.style.display = 'none';
    typingIndicator.style.margin = '10px';
    typingIndicator.innerText = 'Yazıyor...';
    conservation.parentNode.insertBefore(typingIndicator, conservation.nextSibling);

    let typingTimeout;
});
