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
            <p>- Contact your support team at [support email link]</p>
           
            <br></br><br></br><br></br>
            <h1 style={{fontSize:"x-large",textAlign:"start"}}>Privacy Policy</h1>
            <p style={{fontWeight:"bold"}}>Motherson Technology Services Limited</p>
 
            <p><br></br>Effective Date: 06-08-2025 </p>
            <p>This Privacy Policy outlines how Motherson Technology Services Limited (“MTSL”, “we”, “our”, or
              “us”) collects, uses, shares, and protects the personal information of candidates (“you”, “your”)
              participating in AI-driven video interviews. We are committed to ensuring your privacy and the secure
              handling of your personal data. By accepting this policy and proceeding with the interview, you
              acknowledge and agree to the terms and conditions described herein.
            </p>
           
            <p style={{fontWeight:"bold"}}>1. Information We Collect </p>
            <p>When you participate in an AI-driven interview, we may collect the following data: - Video and audio
              recordings of your responses. - Facial expressions, tone, and body language.
              Environmental/background elements captured during the recording. - Device and technical metadata
              (e.g., IP address, device type, browser, operating system). - Interview metadata, such as time,
              duration, and system-generated analytics.
            </p>
 
            <p style={{fontWeight:"bold"}}>2. Purpose of Data Collection</p>
            <p>We collect and process your personal data for the following purposes: - To conduct and assess your
              interview using AI tools. - To evaluate your qualifications, communication skills, and job fit. - To
              generate automated interview assessments. - To maintain interview records for audit and
              compliance. - To improve the AI platform's performance and fairness.
            </p>
 
            <p style={{fontWeight:"bold"}}>3. Legal Basis for Processing</p>
            <p>We process your data based on the following legal grounds: - Your explicit consent provided at the
              start of the interview process. - MTSL’s legitimate interest in efficient, scalable, and objective
              recruitment. - Compliance with applicable legal and regulatory obligations.
            </p>
 
            <p style={{fontWeight:"bold"}}>4. Data Storage and Retention </p>
            <p>Your data will be securely stored in our systems or those of our authorized third-party service
              providers. Recordings and related metadata will be retained for a period of up to [Insert duration,
              e.g., 12 months], unless longer retention is required to comply with legal obligations or to resolve
              disputes.
            </p>
 
            <p style={{fontWeight:"bold"}}>5. Data Sharing and Disclosure</p>
            <p>We may share your personal data with: - MTSL’s internal recruitment and HR teams. - Authorized
              vendors providing AI interview services under data processing agreements. - Government or legal
              authorities, where required by law or regulation.
            </p>
            <br></br><br></br>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div>
                <p>Please read the instructions and policy carefully and click start interview when you're ready.</p>
                <p><br></br>Before you begin, please ensure you have:</p>
                <p>- Read and accepted the AI Video Interview Disclaimer</p>
                <p>- A functioning camera and microphone</p>
                <p>- A quiet environment free of distractions</p>
                <p>- Allow entire screen share with system audio (check the image attached)</p>
              </div>
              <img src={screenshare} style={{right: "0",height: "350px",width: "390px"}}/>
            </div>
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