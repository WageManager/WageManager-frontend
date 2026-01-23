import type { UserType } from "../../../types/auth";

interface DevLoginPanelProps {
  onDevLogin: (userId: number, userName: string, userType: UserType) => void;
}

interface TestUser {
  userId: number;
  name: string;
  userType: UserType;
}

export default function DevLoginPanel({ onDevLogin }: DevLoginPanelProps) {
  if (!import.meta.env.DEV) {
    return null;
  }

  const testUsers: TestUser[] = [
    { userId: 1, name: '박지성', userType: 'EMPLOYER' },
    { userId: 2, name: '김민준', userType: 'WORKER' },
    { userId: 3, name: '이서연', userType: 'WORKER' },
    { userId: 4, name: '박지훈', userType: 'WORKER' },
    { userId: 5, name: '정수빈', userType: 'WORKER' },
    { userId: 6, name: '최유진', userType: 'WORKER' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      opacity: '0.3',
      transition: 'opacity 0.2s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
    >
      {testUsers.map((user) => (
        <button
          key={user.userId}
          onClick={() => onDevLogin(user.userId, user.name, user.userType)}
          className="px-3 py-2 rounded text-xs font-medium transition-all duration-200 hover:opacity-90 active:opacity-80"
          style={{
            backgroundColor: user.userType === 'EMPLOYER' ? '#769fcd' : '#f5f5f5',
            color: user.userType === 'EMPLOYER' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {user.name} {user.userType === 'EMPLOYER' ? '(고용주)' : ''}
        </button>
      ))}
    </div>
  );
}