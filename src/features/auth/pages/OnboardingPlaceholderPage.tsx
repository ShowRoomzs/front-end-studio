import { useNavigate } from "react-router-dom"
import { AuthShell } from "@/common/components/Auth/AuthShell"
import { authButtonClass } from "@/common/components/Auth/authStyles"
import { NoticeBox } from "@/features/auth/components/NoticeBox"

/**
 * 승인 완료 후 최초 로그인(`isNewMember=true`) 진입점.
 *
 * 실제 온보딩(쇼룸명·사업자 구분·정산 계좌)은 이번 작업 범위 밖이다.
 * 백엔드는 이미 준비돼 있다 — `POST /v1/creator/auth/complete-registration`,
 * `GET /v1/creator/auth/check-showroom-name`. 구현 시 로그인에서 넘겨준
 * `location.state.registerToken`(5분 유효)을 Authorization 헤더에 실어 제출하면 된다.
 */
export default function OnboardingPlaceholderPage() {
  const navigate = useNavigate()

  return (
    <AuthShell variant="auth" subtitle="쇼룸 스튜디오">
      <div className="text-center">
        <h1 className="mb-2.5 text-[16px] font-semibold text-sz-n-900">
          승인이 완료되었습니다
        </h1>
        <p className="mb-5 text-[12px] leading-[1.7] text-sz-n-600">
          활동을 시작하려면 쇼룸명과 정산 정보를 입력해야 합니다.
        </p>
        <NoticeBox className="mb-5">
          필수 정보 입력 화면은 준비 중입니다. 준비가 끝나면 이 단계에서 바로
          이어서 진행할 수 있습니다.
        </NoticeBox>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className={authButtonClass("line", "w-full")}
        >
          로그인 화면으로
        </button>
      </div>
    </AuthShell>
  )
}
