/**
 * 근무지 선택 드롭다운 컴포넌트
 */

import type { ChangeEvent } from "react";
import type { WorkplaceSelectProps } from "../../../types/employer/employerRemittancePage.types";

export default function WorkplaceSelect({
  workplaces,
  selectedWorkplaceId,
  onChange,
}: WorkplaceSelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newWorkplaceId = Number(e.target.value);
    onChange(newWorkplaceId);
  };

  return (
    <div className="remittance-workplace-select">
      <select value={selectedWorkplaceId ?? ""} onChange={handleChange}>
        <option value="" disabled>
          근무지를 선택하세요
        </option>
        {workplaces.map((wp) => (
          <option key={wp.id} value={wp.id}>
            {wp.name}
          </option>
        ))}
      </select>
    </div>
  );
}
