// main.js
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// 获取本地视频流
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;
    
    // 连接WebSocket服务器
    const ws = new WebSocket('ws://your-server-ip:8080');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.sdp) {
        // 处理SDP信息，设置远程描述
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
          .then(() => {
            if (message.sdp.type === 'offer') {
              // 如果是offer，回复一个answer
              return peerConnection.createAnswer();
            }
          })
          .then((answer) => {
            return peerConnection.setLocalDescription(answer);
          })
          .then(() => {
            // 发送answer给对方
            ws.send(JSON.stringify({ sdp: peerConnection.localDescription }));
          });
      } else if (message.candidate) {
        // 添加ICE候选者
        peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    };
    
    // 创建PeerConnection对象
    const peerConnection = new RTCPeerConnection();
    
    // 添加本地视频流到PeerConnection
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
    
    // 监听ICE候选者生成
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // 发送ICE候选者给对方
        ws.send(JSON.stringify({ candidate: event.candidate }));
      }
    };
    
    // 监听远程视频流
    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };
    
    // 创建一个offer
    peerConnection.createOffer()
      .then((offer) => {
        return peerConnection.setLocalDescription(offer);
      })
      .then(() => {
        // 发送offer给对方
        ws.send(JSON.stringify({ sdp: peerConnection.localDescription }));
      });
  })
  .catch((error) => {
    console.error('Error accessing media devices:', error);
  });
