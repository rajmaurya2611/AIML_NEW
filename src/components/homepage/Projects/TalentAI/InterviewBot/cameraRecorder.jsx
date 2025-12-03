import { useEffect, useRef, useState } from "react";
import "./cameraRecorder.css";
import camera_logo from "../assets_talentAI/video_logo.svg";
import microphone from "../assets_talentAI/microphone.svg";
import audio from "../assets_talentAI/volume.svg";
import fixWebmDuration from "webm-duration-fix";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CameraRecorder(props) {
  const videoRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const saveButtonRef = useRef(null);

  const [screenRecording, setScreenRecording] = useState(false);
  const [screenChunks, setScreenChunks] = useState([]);
  const recordedDurationRef = useRef(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (props.recordStatus) startScreenRecording();
    else stopScreenRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.recordStatus]);

  const startScreenRecording = async () => {
    try {
      // 1) Screen + system audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const track = screenStream.getVideoTracks()[0];
      if (track.getSettings().displaySurface !== "monitor") {
        alert("🔕Caution: To begin with the interview you need to present your entire screen.");
        props.setRecord(false);
        props.setShowPopup(true);
        clearInterval(props.timerRef.current);
        screenStream.getTracks().forEach((t) => t.stop());
        return;
      }

      // 2) Webcam + mic
      const micStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: { noiseSuppression: true, echoCancellation: true },
      });

      // Show webcam preview (fits parent box)
      if (videoRef.current) {
        videoRef.current.srcObject = micStream;
      }

      // 3) Mix audios
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      const systemAudioSource = audioContext.createMediaStreamSource(screenStream);
      const micAudioSource = audioContext.createMediaStreamSource(micStream);
      systemAudioSource.connect(destination);
      micAudioSource.connect(destination);

      // 4) Merge video + mixed audio
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(combinedStream);
      screenRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) setScreenChunks((prev) => [...prev, e.data]);
      };

      const startTime = Date.now();
      recorder.onstop = () => {
        recordedDurationRef.current = (Date.now() - startTime) / 1000;
        screenStream.getTracks().forEach((t) => t.stop());
        micStream.getTracks().forEach((t) => t.stop());
        audioContext.close();
      };

      recorder.start();
      setScreenRecording(true);
      props.startInterview();
    } catch (err) {
      if (err.name === "NotAllowedError") {
        alert("You must share your screen to start the interview.");
        props.setRecord(false);
        props.setShowPopup(true);
        clearInterval(props.timerRef.current);
      } else if (err.name === "NotFoundError") {
        console.warn("No screen media sources found.");
        alert("Your system must have a camera to appear for this interview");
        props.setRecord(false);
        props.setShowPopup(true);
        clearInterval(props.timerRef.current);
      } else {
        console.error("Error starting screen recording:", err);
      }
      setScreenRecording(false);
    }
  };

  const stopScreenRecording = () => {
    const recorder = screenRecorderRef.current;
    if (recorder && screenRecording) {
      recorder.stop();
      setScreenRecording(false);
      setTimeout(() => {
        saveButtonRef.current?.click();
      }, 3000);
    }
  };

  const saveScreenRecording = async () => {
    const blob = new Blob(screenChunks, { type: "video/webm" });
    const fixedBlob = await fixWebmDuration(blob, {
      duration: recordedDurationRef.current,
    });
    const url = URL.createObjectURL(fixedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "screen-recording-fixed.webm";
    a.click();
    URL.revokeObjectURL(url);
    setScreenChunks([]);
  };

  return (
    <div
      className="interview-bot-camera-container"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 8,
        position: "relative",
        background: "white",
        paddingLeft: 0,
      }}
    >
      {/* Webcam Preview — fills wrapper */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          display: "block",
          width: "100%",
          height: "80%",
          //objectFit: "cover",
          borderRadius: 8,
          //paddingLeft:"14px"
        }}
      />

      {/* hidden auto-save trigger */}
      {screenChunks.length > 0 && (
        <button ref={saveButtonRef} onClick={saveScreenRecording} style={{ display: "none" }} />
      )}
    </div>
  );
}
