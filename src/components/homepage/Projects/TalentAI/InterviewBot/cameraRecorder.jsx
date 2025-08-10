import { useEffect, useRef, useState } from "react";
import "./cameraRecorder.css";
import camera_logo from "../assets_talentAI/video_logo.svg";
import microphone from "../assets_talentAI/microphone.svg";
import audio from "../assets_talentAI/volume.svg";
import fixWebmDuration from "webm-duration-fix"; // If using module system
import { useNavigate } from 'react-router-dom';
import axios from "axios";
 
 
export default function CameraRecorder(props) {
    const videoRef = useRef(null); // webcam video
    // const mediaRecorderRef = useRef(null); // for webcam
    const screenRecorderRef = useRef(null); // for screen
    const saveButtonRef = useRef(null);
    // const [recording, setRecording] = useState(false);
    const [screenRecording, setScreenRecording] = useState(false);
    // const [recordedChunks, setRecordedChunks] = useState([]);
    const [screenChunks, setScreenChunks] = useState([]);
    const recordedDurationRef = useRef(0);
 
    // For redirection after interview is completed
    const navigate = useNavigate();
 
    // Webcam stream setup
    // useEffect(() => {
    // async function startCamera() {
    //     try {
    //         const stream = await navigator.mediaDevices.getUserMedia({
    //             video: { facingMode: "user" },
    //             audio: true,
    //         });
    //         videoRef.current.srcObject = stream;
    //     } catch (err) {
    //         console.error("Error accessing camera:", err);
    //     }
    // }
 
        // startCamera();
    // }, []);
 
    // === Webcam Recording ===
    // const startRecording = () => {
    //     const stream = videoRef.current.srcObject;
    //     const mediaRecorder = new MediaRecorder(stream);
    //     mediaRecorderRef.current = mediaRecorder;
 
    //     mediaRecorder.ondataavailable = (e) => {
    //         if (e.data.size > 0) {
    //             setRecordedChunks((prev) => [...prev, e.data]);
    //         }
    //     };
 
    //     mediaRecorder.start();
    //     setRecording(true);
    // };
 
    // const stopRecording = () => {
    //     mediaRecorderRef.current.stop();
    //     setRecording(false);
    // };
 
    // const saveRecording = () => {
    //     const blob = new Blob(recordedChunks, { type: "video/webm" });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement("a");
    //     a.href = url;
    //     a.download = "camera-recording.webm";
    //     a.click();
    //     URL.revokeObjectURL(url);
    //     setRecordedChunks([]);
    // };
 
    useEffect(()=>{
        if(props.recordStatus){
            startScreenRecording(); // Trigger the start of screen recording
        }else {
            stopScreenRecording();
        }
    },[props.recordStatus])
 
    // === Screen Recording ===
   const startScreenRecording = async () => {
       
        try {
            // 1. Get screen with system audio
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true, // system audio
            });
           
           
            // To check if the User is presenting entire screen or just window
            const track = screenStream.getVideoTracks()[0];
            // console.log(track.getSettings().displaySurface); // "monitor", "window", or "browser"
            if(track.getSettings().displaySurface!=="monitor"){
                alert("🔕Caution: To begin with the interview you need to present your entire screen.")
                props.setRecord(false);
                props.setShowPopup(true);
                clearInterval(props.timerRef.current);
                screenStream.getTracks().forEach((track) => track.stop());
                return
            }
 
            // 2. Get webcam + mic
            const micStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio:  { noiseSuppression: true, echoCancellation: true }, // mic audio
            });
             
            videoRef.current.srcObject = micStream;
 
            // 3. Use Web Audio API to mix mic and system audio
            const audioContext = new AudioContext();
            const destination = audioContext.createMediaStreamDestination();
 
            const systemAudioSource = audioContext.createMediaStreamSource(screenStream);
            const micAudioSource = audioContext.createMediaStreamSource(micStream);
 
            systemAudioSource.connect(destination);
            micAudioSource.connect(destination);
 
            // 4. Merge video + mixed audio
            const combinedStream = new MediaStream([
                ...screenStream.getVideoTracks(),         // screen video
                ...destination.stream.getAudioTracks(),   // mixed audio
            ]);
 
            const recorder = new MediaRecorder(combinedStream);
            screenRecorderRef.current = recorder;
 
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setScreenChunks((prev) => [...prev, e.data]);
                }
            };
 
            recorder.onstop = () => {
                recordedDurationRef.current = (Date.now() - startTime) / 1000; // seconds
                screenStream.getTracks().forEach(t => t.stop());
                micStream.getTracks().forEach(t => t.stop());
                audioContext.close();
            };
 
            recorder.start();
            const startTime = Date.now();
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
 
            }else {
                console.error("Error starting screen recording:", err);
            }
 
            setScreenRecording(false); // Ensure it's off
        }
    };
 
 
    const stopScreenRecording = () => {
        const recorder = screenRecorderRef.current;
        if (recorder && screenRecording) {
            recorder.stop();
            setScreenRecording(false);
            setTimeout(()=>{
                saveButtonRef.current.click();
                // navigate("/")
 
            },3000);    
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
 
        // const saveScreenRecording = () => {
    //     const blob = new Blob(screenChunks, { type: "video/webm" });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement("a");
    //     a.href = url;
    //     a.download = "screen-recording.webm";
    //     a.click();
    //     URL.revokeObjectURL(url);
    //     setScreenChunks([]);
    // };
 
    return (
        <div className="interview-bot-camera-container">
            {/* Webcam Preview */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "35%", borderRadius: "10px" }}
            />
 
            <div style={{ marginTop: "10px" }}>
                {/* Camera Recording Controls */}
                {/* {!screenRecording ? (
                    <button
                        className="interview-bot-record-button"
                        onClick={startScreenRecording}
                    >
                        <img src={camera_logo} />
                    </button>
                ) : (
                    <button
                        className="interview-bot-stop-record-button"
                        onClick={stopScreenRecording}
                    >
                        <img src={camera_logo} />
                    </button>
                )} */}
 
                {/* <button className="interview-bot-audio">
                    <img src={audio} />
                </button>
                <button className="interview-bot-microphone">
                    <img src={microphone} />
                </button> */}
 
                {screenChunks.length > 0 && (
                    <button ref={saveButtonRef} onClick={saveScreenRecording} style={{ marginLeft: "10px" }}>
                       
                    </button>
                )}
 
                {/* Screen Recording Controls */}
                {/* {!screenRecording ? (
                    <button
                        className="interview-bot-record-button"
                        onClick={startScreenRecording}
                        style={{ marginLeft: "10px" }}
                    >
                        Start Screen Recording
                    </button>
                ) : (
                    <button
                        className="interview-bot-stop-record-button"
                        onClick={stopScreenRecording}
                        style={{ marginLeft: "10px" }}
                    >
                        Stop Screen Recording
                    </button>
                )}
 
                {screenChunks.length > 0 && (
                    <button onClick={saveScreenRecording} style={{ marginLeft: "10px" }}>
                        Save Screen Recording
                    </button>
                )} */}
            </div>
        </div>
    );
}