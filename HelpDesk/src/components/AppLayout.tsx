import { useState } from "react";
import { NavLink, Outlet } from "react-router";

import logoIcon from "../assets/Logo_IconLight.svg";
import clipboardIcon from "../assets/icon/clipboard-list.png";
import wrenchIcon from "../assets/icon/wrench.png";
import usersIcon from "../assets/icon/users.png";
import briefcaseIcon from "../assets/icon/briefcase-business.png";
import plusIcon from "../assets/icon/plus.png";
import menuIcon from "../assets/icon/menu.png";
import logoutIcon from "../assets/icon/log-out.png";
import { useAuth } from "../hooks/useAuth";
import "../app.css";

const roleLabel = {
  admin: "ADMIN",
  technician: "TÉCNICO",
  client: "CLIENTE",
};

const navigation = {
  admin: [
    { to: "/tickets", label: "Chamados", icon: clipboardIcon },
    { to: "/technicians", label: "Técnicos", icon: wrenchIcon },
    { to: "/clients", label: "Clientes", icon: usersIcon },
    { to: "/services", label: "Serviços", icon: briefcaseIcon },
  ],
  technician: [
    { to: "/", label: "Meus chamados", icon: clipboardIcon },
  ],
  client: [
    { to: "/", label: "Meus chamados", icon: clipboardIcon },
    { to: "/new", label: "Criar chamado", icon: plusIcon },
  ],
};

export function AppLayout() {
  const { session, remove } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session!.user;
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="workspace">
      {menuOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar${menuOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <img src={logoIcon} alt="" />
          <div><strong>HelpDesk</strong><small>{roleLabel[user.role]}</small></div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navigation[user.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <img src={item.icon} alt="" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-profile">
          <span className="user-avatar" aria-hidden="true">{initials}</span>
          <div className="sidebar-profile-text"><strong>{user.name}</strong><small>{user.email}</small></div>
          <button className="sidebar-logout" type="button" title="Sair" aria-label="Sair" onClick={remove}>
            <img src={logoutIcon} alt="" />
          </button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="mobile-topbar">
          <button type="button" className="mobile-menu-button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <img src={menuIcon} alt="" />
          </button>
          <div className="sidebar-brand compact"><img src={logoIcon} alt="" /><div><strong>HelpDesk</strong><small>{roleLabel[user.role]}</small></div></div>
          <span className="user-avatar" aria-label={user.name}>{initials}</span>
        </header>
        <main className="workspace-content"><Outlet /></main>
      </div>
    </div>
  );
}
