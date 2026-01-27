import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { employerNavItems } from "../../constants/navItems";
import "../../styles/employerNav.css";

export default function EmployerNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // 현재 경로에서 activeId 추출
  const getActiveIdFromPath = () => {
    const path = location.pathname;
    const match = path.match(/\/employer\/([^/]+)/);
    return match ? match[1] : "daily-calendar";
  };

  const [activeId, setActiveId] = useState(getActiveIdFromPath());

  // 경로가 변경될 때마다 activeId 업데이트
  useEffect(() => {
    setActiveId(getActiveIdFromPath());
  }, [location.pathname]);

  const handleItemClick = (id) => {
    setActiveId(id);
    navigate(`/employer/${id}`);
  };

  return (
    <aside className="employer-sidebar">
      <div className="nav-icon-list">
        {employerNavItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="nav-icon-button"
            data-active={activeId === id}
            onClick={() => handleItemClick(id)}
            aria-label={label}
          >
            <Icon size={28} />
          </button>
        ))}
      </div>
    </aside>
  );
}

