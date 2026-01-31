/**
 * 프로필 박스 컴포넌트
 * - 사용자 프로필 이미지 및 이름 표시
 * - 탭 네비게이션 (프로필 수정, 근무지 관리, 보낸 근무 요청)
 */

import { FaUser } from 'react-icons/fa';
import '../../../pages/workers/WorkerMyPage.css';
import { TAB_LABELS } from '../../../constants/workerMypage';
import type { ProfileBoxProps, ActiveTab } from '../../../types/worker/workerMypage.types';

// 탭 목록 (순서 보장)
const TABS: ActiveTab[] = ['profile', 'workplace', 'editRequest'];

export default function ProfileBox({
  user,
  activeTab,
  onTabChange,
}: ProfileBoxProps) {
  const profileImageUrl = user.profileImageUrl;

  return (
    <nav className="worker-mypage-nav">
      <div className="worker-mypage-profile-card">
        <div className="worker-mypage-profile-info-wrapper">
          <ProfileAvatar imageUrl={profileImageUrl} />
          <div className="worker-mypage-profile-name">{user.name || ''}</div>
        </div>
        <hr />
      </div>
      <ul>
        {TABS.map((tab) => (
          <li key={tab}>
            <TabButton
              tab={tab}
              label={TAB_LABELS[tab]}
              isActive={activeTab === tab}
              onClick={() => onTabChange(tab)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ============ 내부 컴포넌트 ============

interface ProfileAvatarProps {
  imageUrl: string | undefined;
}

function ProfileAvatar({ imageUrl }: ProfileAvatarProps) {
  const hasImage = Boolean(imageUrl);

  return (
    <div className="worker-mypage-avatar-wrapper">
      {hasImage ? (
        <img
          src={imageUrl}
          alt="프로필"
          className="worker-mypage-avatar-image"
        />
      ) : (
        <div className="worker-mypage-avatar-placeholder">
          <FaUser className="worker-mypage-avatar-icon" />
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  tab: ActiveTab;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  const className = isActive
    ? 'worker-mypage-nav-checked'
    : 'worker-mypage-nav-li';

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}
