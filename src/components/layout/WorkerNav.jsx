import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { workerNavItems } from "../../constants/navItems";
import "../../styles/workerNav.css";

export default function WorkerNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // 현재 경로에서 activeId 추출
  const getActiveIdFromPath = () => {
    const path = location.pathname;
    const match = path.match(/\/worker\/([^/]+)/);
    return match ? match[1] : "monthly-calendar";
  };

  const [activeId, setActiveId] = useState(getActiveIdFromPath());

  // 경로가 변경될 때마다 activeId 업데이트
  useEffect(() => {
    setActiveId(getActiveIdFromPath());
  }, [location.pathname]);

  const handleItemClick = (id) => {
    setActiveId(id);
    navigate(`/worker/${id}`);
  };

  return (
    <aside className="worker-sidebar">
    <div className="nav-icon-list">
    {workerNavItems.map(({ id, label, icon: Icon }) => (
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
