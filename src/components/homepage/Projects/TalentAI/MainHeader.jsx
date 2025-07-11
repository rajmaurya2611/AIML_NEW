import { useEffect, useState } from "react";
import mothersonLogo from './assets_talentAI/motherson_logo.svg'
import "./MainHeader.css";
import { Link } from "react-router-dom";
function MainHeader() {
{/* The topmost header section containing the name of the app and logo of the company */}
  return (
    <div className="mainHeader">
        <Link to="/talentai">
          <img className="mothersonLogo" src={mothersonLogo} alt="mothersonLogo" />
        </Link>
        <div class="vertical-line"></div>
        <h3 className="appName">Talent AI</h3>
    </div>
  );
}

export default MainHeader;