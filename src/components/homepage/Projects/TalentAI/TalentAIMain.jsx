import { useEffect, useState, useRef } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";
import "./Homepage.css";
import jdGenerator from './assets_talentAI/jdGenerator.svg';
import cvRanker from './assets_talentAI/cv_ranker.svg';
import jobFitRanker from './assets_talentAI/jobFitRanker.svg';
import aiInterviewBot from './assets_talentAI/aiInterviewBot.svg';
import MainHeader from "./MainHeader";
import Homepage_image from "./assets_talentAI/homepage_background_image.svg";
 
function TalentAIMain() {
  const [message, setMessage] = useState("");
 
  // This is to add carousel functionality to the cards  
  const scrollRef = useRef(null);
 
  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };
 
  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };
 
 
  return (
  <div className="homepageContainer bg-[#E7E7E7]">
    {/* The topmost header section containing the name of the app and logo of the company */}
    <MainHeader />
    {/* Description or about section of the app  */}
    <div className="appDescriptionContainer">
     
      <div className="appDescription"style={{backgroundImage: `linear-gradient(rgba(218, 33, 40, 0.15), rgba(218, 33, 40, 0.15)), url(${Homepage_image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',}}>
         
          <h1>Talent AI</h1>
          <strong>Transform Talent Acquisition with Smart, Data-Driven Features</strong>
          <p>
            {`Leverage AI-powered tools to generate job descriptions, rank candidates,
and conduct insightful interviews effortlessly.`}
          </p>
          {/* Removing the date for now, can be added on later, located on the top right side of the description card */}
          {/* <p className="date">
              30 June 2025
          </p> */}
      </div>  
    </div>
    {/* Features section starts from here  */}
    <div className="featuresContainer">
        <h1>Features</h1>
        <div className="carouselWrapper">
          {/* <button className="arrow left" onClick={scrollLeft}>←</button> */}
          <div className="cardsContainer" ref={scrollRef}>
              {/* Feature card for JD Generator  */}
              <Link to="/talentai/jd-generator" className="featureCard" >
                <p className="featureCardName">JD Generator</p>
                <img className="featureCardImage" src={jdGenerator} alt="jdGenerator" />
                <p className="featureCardDescription">Create comprehensive and tailored job description effortlessely</p>
                <button className="featureCardButton">Generate JD</button>
              </Link>
              {/* Feature card for CV ranker  */}
              <Link to="/talentai/CvRanker" className="featureCard" style={{marginLeft:"20px"}}>
                  <p className="featureCardName">CV Ranker</p>
                  <img className="featureCardImage" src={cvRanker} alt="cvRanker" />
                  <p className="featureCardDescription">Identify the best candidates by comparing resumes with job description.</p>
                  <button className="featureCardButton">Rank Candidates</button>
              </Link>
              {/* Feature card for job fit ranker  */}
              <Link to="/talentai/JobFitRanker" className="featureCard" style={{marginLeft:"20px"}}>
                <p className="featureCardName">Job Fit Ranker</p>
                <img className="featureCardImage" src={jobFitRanker} alt="jobFitRanker" />
                <p className="featureCardDescription">Evaluates and aligns CVs with suitable job descriptions.</p>
                <button className="featureCardButton">View Fit Score</button>
              </Link>
              {/* Feature card for AI interview bot  */}
              {/* <Link to="/talentai/interview" className="featureCard" style={{marginLeft:"20px"}}>
                <p className="featureCardName">AI Interview Bot</p>
                <img className="featureCardImage" src={aiInterviewBot} alt="aiInterviewBot" />
                <p className="featureCardDescription">Conducts adaptive interviews with real-time question generation.</p>
                <button className="featureCardButton">Start Interview</button>
              </Link> */}
              {/* Feature card for HR Page  */}
              <Link to="/talentai/HrView" className="featureCard" style={{marginLeft:"20px"}}>
                <p className="featureCardName">HR View</p>
                <img className="featureCardImage" src={aiInterviewBot} alt="aiInterviewBot" />
                <p className="featureCardDescription">Schedule interviews and see score cards.</p>
                <button className="featureCardButton">Open</button>
              </Link>
 
          </div>
          {/* <button className="arrow right" onClick={scrollRight}>→</button> */}
        </div>
         
    </div>
  </div>
)
}
 
export default TalentAIMain;