import { useState } from "react";
import { NavLink } from "react-router-dom";
import grey_jd from "./assets_talentAI/grey_jd.svg";
import grey_cvRanker from "./assets_talentAI/grey_cvRanker.svg";
import grey_jobFit from "./assets_talentAI/grey_jobFit.svg";
import grey_interviewBot from "./assets_talentAI/grey_interviewBot.svg";
import white_jd from "./assets_talentAI/white_jd.svg";
import white_cvRanker from "./assets_talentAI/white_cvRanker.svg";
import white_jobFit from "./assets_talentAI/white_jobFit.svg";
import white_interviewBot from "./assets_talentAI/white_interviewBot.svg";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const activeBg = "bg-[#DA2129] text-white font-semibold";
  const inactiveText = "text-[#555555]";
  const inactiveBgHover = "hover:bg-[#d3d3d3]";

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={`
        z-[1000]
        absolute left-0 top-[50px] h-screen pt-[5vh]
        ${open ? "w-48" : "w-12"}
        transition-all duration-75
        bg-[#F7F5F5] text-[#555555]
        shadow-[0px_0px_5px_0px_#c1c1c1]
        
      `}
    >
      {open ? (
        <div className="space-y-1">
          <NavLink
            to="/talentai/jd-generator"
            style={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
            className={({ isActive }) =>
              `block transition-colors ${
                isActive ? activeBg : `${inactiveText} ${inactiveBgHover}`
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  className="sidebarIcons"
                  src={isActive ? white_jd : grey_jd}
                />
                <span className="ml-2">JD Generator</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/talentai/CvRanker"
            style={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
            className={({ isActive }) =>
              `block transition-colors ${
                isActive ? activeBg : `${inactiveText} ${inactiveBgHover}`
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  className="sidebarIcons"
                  src={isActive ? white_cvRanker : grey_cvRanker}
                />
                <span className="ml-2">CV Ranker</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/talentai/JobFitRanker"
            style={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
            className={({ isActive }) =>
              `block transition-colors ${
                isActive ? activeBg : `${inactiveText} ${inactiveBgHover}`
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  className="sidebarIcons"
                  src={isActive ? white_jobFit : grey_jobFit}
                />
                <span className="ml-2">Job Fit Ranker</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="http://10.245.146.250:8790/interview"
            style={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
            className={({ isActive }) =>
              `block transition-colors ${
                isActive ? activeBg : `${inactiveText} ${inactiveBgHover}`
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  className="sidebarIcons"
                  src={isActive ? white_interviewBot : grey_interviewBot}
                />
                <span className="ml-2">Interview Bot</span>
              </>
            )}
          </NavLink>
        </div>
      ) : (
        <div className="space-y-1">
          <NavLink
            to="/talentai/jd-generator"
            style={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
            className={({ isActive }) =>
              `block transition-colors ${
                isActive ? activeBg : `${inactiveText} ${inactiveBgHover}`
              }`
            }
          >
            {({ isActive }) => (
              <img
                className="sidebarIcons"
                src={isActive ? white_jd : grey_jd}
              />
            )}
          </NavLink>

          <NavLink
            to="/talentai/CvRanker"
            style={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
            className={({ isActive }) =>
              `block transition-colors ${
                isActive ? activeBg : `${inactiveText} ${inactiveBgHover}`
              }`
            }
          >
            {({ isActive }) => (
              <img
                className="sidebarIcons"
                src={isActive ? white_cvRanker : grey_cvRanker}
              />
            )}
          </NavLink>

          <NavLink
            to="/talentai/JobFitRanker"
            style={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
            className={({ isActive }) =>
              `block transition-colors ${
                isActive ? activeBg : `${inactiveText} ${inactiveBgHover}`
              }`
            }
          >
            {({ isActive }) => (
              <img
                className="sidebarIcons"
                src={isActive ? white_jobFit : grey_jobFit}
              />
            )}
          </NavLink>

          <NavLink
            to="http://10.245.146.250:8790/interview"
            style={{
              paddingTop: "10px",
              paddingBottom: "10px",
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
            }}
            className={({ isActive }) =>
              `block transition-colors ${
                isActive ? activeBg : `${inactiveText} ${inactiveBgHover}`
              }`
            }
          >
            {({ isActive }) => (
              <img
                className="sidebarIcons"
                src={isActive ? white_interviewBot : grey_interviewBot}
              />
            )}
          </NavLink>
        </div>
      )}
    </div>
  );
}
