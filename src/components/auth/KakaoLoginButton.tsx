import kakaoLoginIcon from "../../assets/kakao_login_medium_wide.png";
import { AUTH_CONSTANTS } from "../../constants/auth";

const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

export default function KakaoLoginButton() {
  const handleKakaoLogin = () => {
    if (!REST_API_KEY || !REDIRECT_URI) {
      alert('카카오 로그인 설정이 완료되지 않았습니다. 관리자에게 문의하세요.');
      return;
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: REST_API_KEY,
      redirect_uri: REDIRECT_URI,
    });

    const authUrl = `${AUTH_CONSTANTS.KAKAO.AUTHORIZE_URL}?${params.toString()}`;
    window.location.href = authUrl;
  };

  return (
    <button
      className="bg-transparent border-0 p-0 cursor-pointer transition-opacity duration-200 hover:opacity-90 active:opacity-80 relative z-10"
      onClick={handleKakaoLogin}
    >
      <img
        src={kakaoLoginIcon}
        alt="카카오 로그인"
        className="block w-full h-auto pointer-events-none"
        draggable={false}
      />
    </button>
  );
}