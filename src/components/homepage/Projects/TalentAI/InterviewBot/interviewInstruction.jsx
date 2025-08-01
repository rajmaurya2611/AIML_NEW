import "./interviewInstruction.css";
import screenshare from "../assets_talentAI/screenshare.png";
import { useState } from "react";

export default function InterviewInstruction(props) {
    const [accepted, setAccepted] = useState(false);
    
    const handleCheckboxChange = (event) => {
      setAccepted(event.target.checked);
    };

    return(
        <div className="interview-bot-instruction-popup" >
          <div className="interview-bot-intruction-popup-body">
            <h1 style={{fontSize:"x-large",textAlign:"center"}}>Interview Instructions</h1>
            <br></br>
            <br></br>
            <p>Thank you for your interest in this opportunity. Please read the following instructions carefully before beginning your AI powered Interview</p>
            <p style={{fontWeight:"bold"}}>1. Interview Format</p>
            <p>- This is automated one way interview.</p>
            <p>- You will be presented with a series of prerecorded questions.</p>
            <p>- Your responses will be recorded via webcam and microphone.</p>

            <p style={{fontWeight:"bold"}}>2. Preparation Tips</p>
            <p>- Find a light, well-lit space where you won't be interrupted</p>
            <p>- Make sure your device (laptop, tablet or phone) is fully charged and has a stable internet connection.</p>
            <p>- Test your camera, microphone, internet before starting.</p>

            <p style={{fontWeight:"bold"}}>3. During the Interview</p>
            <p>- You will typically have 30 seconds to prepare for each question.</p>
            <p>- You will then have 1-2 minutes to respond (timing may vary per question).</p>
            <p>- If allowed, you will be given the option to re record your answer once (check before starting)</p>
            
            <p style={{fontWeight:"bold"}}>4.Tips for success</p>
            <p>- Speak clearly and confidently.</p>
            <p>- Maintain eye contact with camera.</p>
            <p>- Stay on topic and try to be concise but informative.</p>
            <p>- It's okay to take a breadth before you begin speaking.</p>
            
            <p style={{fontWeight:"bold"}}>5. Technical Support</p>
            <p>- If you encounter any technical issues:</p>
            <p>- Refresh the page and restart your browser.</p>
            <p>- Contact your support team at [support email link]</p>

            
            <p><br></br>Before you begin, please ensure you have:</p>
            <p>- Read and accepted the AI Video Interview Disclaimer</p>
            <p>- A functioning camera and microphone</p>
            <p>- A quiet environment free of distractions</p>
            <p>- Allow entire screen share with system audio (check the image attached)</p>
            <img src={screenshare} style={{position: "absolute",right: "0",height: "350px",width: "390px",top: "120%"}}/>
            <p>Click start interview when you're ready.</p>
            
            {!props.recordStatus && 
              <>
                <br></br>  
                <p> <input type="checkbox" checked={accepted} onChange={handleCheckboxChange}/> Accept Terms and Conditions</p>  
                <br></br>  
                <button disabled={!accepted} onClick={props.closePopup} style={{background: accepted ? "#DA2129" : "grey", color: "white",height: "36px",width: "170px",fontSize: "15px",borderRadius: "5px",position:"relative",left:"45%"}}>START INTERVIEW</button>
              </>
            }
            {props.recordStatus &&
              <button onClick={()=>{props.setShowPopup(false)}} style={{background: "#DA2129",color: "white",height: "36px",width: "170px",fontSize: "15px",borderRadius: "5px",position:"relative",left:"45%"}}>CLOSE</button>
            }
            
          </div>
        </div>
    )
}
