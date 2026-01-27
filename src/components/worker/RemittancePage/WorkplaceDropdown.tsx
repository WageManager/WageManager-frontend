import { useState } from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import type { Workplace } from "../../../types/worker/remittancePage.types";
import "../../../pages/workers/WorkerRemittancePage.css";

interface WorkplaceDropdownProps {
  workplaces: Workplace[];
  selectedWorkplaceId: number | null;
  onSelect: (workplaceId: number) => void;
}

export default function WorkplaceDropdown({
  workplaces,
  selectedWorkplaceId,
  onSelect,
}: WorkplaceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedName = workplaces.find((wp) => wp.id === selectedWorkplaceId)?.name;

  const handleSelect = (workplaceId: number) => {
    onSelect(workplaceId);
    setIsOpen(false);
  };

  return (
    <div className="remittance-workplace-select-top">
      <div className="workplace-dropdown-wrapper">
        <button
          type="button"
          className="workplace-dropdown-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedName || "근무지 선택"}</span>
          {isOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
        </button>
        {isOpen && (
          <div className="workplace-dropdown-menu">
            {workplaces.map((wp) => (
              <button
                key={wp.id}
                type="button"
                className={`workplace-dropdown-item ${
                  selectedWorkplaceId === wp.id ? "active" : ""
                }`}
                onClick={() => handleSelect(wp.id)}
              >
                {wp.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
