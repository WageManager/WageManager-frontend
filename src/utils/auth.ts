export interface UserInfo {
  userId: number;
  name: string;
  userType: string;
  workerCode?: string;
  kakaoPayLink?: string;
  profileImageUrl?: string;
  phone?: string;
}

export interface AuthInfo extends UserInfo {
  accessToken: string;
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getUserInfo = (): UserInfo | null => {
  const userId = localStorage.getItem('userId');
  const name = localStorage.getItem('name');
  const userType = localStorage.getItem('userType');

  if (!userId || !name || !userType) {
    return null;
  }

  const userInfo: UserInfo = {
    userId: Number(userId),
    name,
    userType,
  };

  const workerCode = localStorage.getItem('workerCode');
  if (workerCode) userInfo.workerCode = workerCode;

  const kakaoPayLink = localStorage.getItem('kakaoPayLink');
  if (kakaoPayLink) userInfo.kakaoPayLink = kakaoPayLink;

  const profileImageUrl = localStorage.getItem('profileImageUrl');
  if (profileImageUrl) userInfo.profileImageUrl = profileImageUrl;

  const phone = localStorage.getItem('phone');
  if (phone) userInfo.phone = phone;

  return userInfo;
};

export const setAuthInfo = (authInfo: AuthInfo) => {
  localStorage.setItem('token', authInfo.accessToken);
  localStorage.setItem('userId', String(authInfo.userId));
  localStorage.setItem('name', authInfo.name);
  localStorage.setItem('userType', authInfo.userType);

  if (authInfo.workerCode) localStorage.setItem('workerCode', authInfo.workerCode);
  if (authInfo.kakaoPayLink) localStorage.setItem('kakaoPayLink', authInfo.kakaoPayLink);
  if (authInfo.profileImageUrl) localStorage.setItem('profileImageUrl', authInfo.profileImageUrl);
  if (authInfo.phone) localStorage.setItem('phone', authInfo.phone);
};

export const clearAuthInfo = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('name');
  localStorage.removeItem('userType');
  localStorage.removeItem('workerCode');
  localStorage.removeItem('kakaoPayLink');
  localStorage.removeItem('profileImageUrl');
  localStorage.removeItem('phone');
};
