import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { Button, Space, Typography, message } from "antd";
 
const { Title } = Typography;
 
/**
 * Exposes start(), speak(text), stop() to parent via ref.
 */
const handleStartInterview = () =>{
   
}
const AvatarPanel = forwardRef((_, ref) => {
  const [isConnected, setIsConnected] = useState(false);
  const containerRef = useRef(null);
  const avatarSynthRef = useRef(null);
  const pcRef         = useRef(null);
 
  // Expose methods
  useImperativeHandle(ref, () => ({
    start: startSession,
    speak: speakText,
    stop: stopSession,
  }));
 
  async function startSession() {
    const region = import.meta.env.VITE_AZURE_SPEECH_REGION;
    const apiKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
    if (!region || !apiKey) {
      message.error("Set VITE_AZURE_REGION & VITE_AZURE_SPEECH_KEY in .env");
      return;
    }
 
    // 1️⃣ Configure Speech & Avatar (Lisa built-in voice)
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
    const avatarCfg    = new SpeechSDK.AvatarConfig("lisa", "casual-sitting");
    avatarCfg.useBuiltInVoice = true;
    avatarCfg.customized     = false;
    avatarSynthRef.current = new SpeechSDK.AvatarSynthesizer(speechConfig, avatarCfg);
 
    // 2️⃣ Fetch ICE relay token
    const tokenRes = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`,
      { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
    );
    const { Urls, Username, Password } = await tokenRes.json();
 
    // 3️⃣ Setup WebRTC
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: [Urls[0]], username: Username, credential: Password }],
    });
    pc.addTransceiver("video", { direction: "sendrecv" });
    pc.addTransceiver("audio", { direction: "sendrecv" });
 
    pc.ontrack = (event) => {
      const container = containerRef.current;
      if (event.track.kind === "video") {
        container.innerHTML = "";
        const v = document.createElement("video");
        v.autoplay = true; v.playsInline = true; v.srcObject = event.streams[0];
        container.appendChild(v);
      } else if (event.track.kind === "audio") {
        container.querySelectorAll("audio").forEach(a => a.remove());
        const a = document.createElement("audio");
        a.autoplay = true; a.srcObject = event.streams[0]; a.muted = false;
        container.appendChild(a);
      }
    };
 
    pcRef.current = pc;
    await avatarSynthRef.current.startAvatarAsync(pc);
    setIsConnected(true);
    message.success("Avatar session started");
   
  }
 
  function speakText(text) {
    if (!avatarSynthRef.current) return;
    avatarSynthRef.current.speakTextAsync(
      text,
      () => console.log("Avatar done speaking"),
      (err) => {
        console.error("Avatar speak error", err);
        message.error("Avatar failed to speak");
      }
    );
  }
 
  function stopSession() {
    avatarSynthRef.current?.close();
    pcRef.current?.close();
    setIsConnected(false);
    if (containerRef.current) containerRef.current.innerHTML = "";
    message.info("Avatar session stopped");
  }
 
  return (
    <div className="p-4 bg-white shadow rounded text-center">
      {/* <Title level={4}>Avatar Panel</Title>
      <Space size="middle" className="mb-4">
        <Button type="primary" onClick={startSession} disabled={isConnected}>
          Start Avatar
        </Button>
        <Button onClick={() => speakText("Hello!")} disabled={!isConnected}>
          Speak Test
        </Button>
        <Button danger onClick={stopSession} disabled={!isConnected}>
          Stop Avatar
        </Button>
      </Space> */}
      <div
        ref={containerRef}
        className="w-full h-78 bg-black rounded overflow-hidden"
      />
    </div>
  );
});
 
export default AvatarPanel;