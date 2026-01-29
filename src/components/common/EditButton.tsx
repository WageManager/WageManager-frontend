import type { JSX } from "react";
import "./EditButton.css";

type EditButtonStatus = "default" | "cancel" | "complete";

interface EditButtonProps {
  isEditing: boolean;
  hasChanges: boolean;
  onEditClick: () => void;
  onSaveClick: () => void;
  className?: string;
}

export default function EditButton({
  isEditing,
  hasChanges,
  onEditClick,
  onSaveClick,
  className = "",
}: EditButtonProps): JSX.Element {
  const getStatus = (): EditButtonStatus => {
    if (!isEditing) return "default";
    return hasChanges ? "complete" : "cancel";
  };

  const status = getStatus();

  const getLabel = (): string => {
    switch (status) {
      case "default":
        return "수정";
      case "cancel":
        return "취소";
      case "complete":
        return "완료";
    }
  };

  const handleClick = (): void => {
    if (status === "complete") {
      onSaveClick();
    } else {
      onEditClick();
    }
  };

  return (
    <button
      type="button"
      className={`profile-edit-btn profile-edit-btn--${status} ${className}`}
      onClick={handleClick}
    >
      {getLabel()}
    </button>
  );
}
