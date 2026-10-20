import { Outlet } from "react-router";

import logoIcon from "../assets/Logo_IconDark.svg";
import background from "../assets/Login_Background.png";
import "../auth.css";

export function AuthLayout() {
  return (
    <div className="auth-layout" style={{ backgroundImage: `url(${background})` }}>
      <main className="auth-panel">
        <div className="auth-content">
          <div className="auth-brand" aria-label="HelpDesk">
            <img src={logoIcon} alt="" />
            <span>HelpDesk</span>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
