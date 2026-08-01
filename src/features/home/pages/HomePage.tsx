import { useNavigate } from "react-router-dom"
import { AuthShell } from "@/common/components/Auth/AuthShell"
import { authButtonClass } from "@/common/components/Auth/authStyles"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"

/** 승인 크리에이터 진입점. 대시보드는 이번 작업 범위 밖이라 자리만 잡아 둔다. */
export default function HomePage() {
  const navigate = useNavigate()
  const [, , removeAccessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)
  const [, , removeRefreshToken] = useCookie<string>(COOKIE_NAME.REFRESH_TOKEN)
  const [, , removeRole] = useCookie<string>(COOKIE_NAME.ROLE)

  const logout = () => {
    removeAccessToken()
    removeRefreshToken()
    removeRole()
    navigate("/login", { replace: true })
  }

  return (
    <AuthShell variant="auth" subtitle="쇼룸 스튜디오">
      <div className="text-center">
        <h1 className="mb-2.5 text-[16px] font-semibold text-sz-n-900">
          로그인되었습니다
        </h1>
        <p className="mb-5 text-[12px] leading-[1.7] text-sz-n-600">
          스튜디오 대시보드는 준비 중입니다.
        </p>
        <button
          type="button"
          onClick={logout}
          className={authButtonClass("line", "w-full")}
        >
          로그아웃
        </button>
      </div>
    </AuthShell>
  )
}
