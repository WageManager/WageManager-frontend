export interface UserInfo {
  id?: number;
  name: string;
  phone?: string;
  profileImageUrl?: string | null;
}

export interface UpdateMyInfoRequest {
  name?: string;
  phone?: string;
  profileImageUrl?: string;
}
