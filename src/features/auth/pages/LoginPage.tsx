import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"

import { AuthShell } from "@/common/components/Auth/AuthShell"
import {
  AlertModal,
  ClockIcon,
  EmptyInboxIcon,
  ModalButton,
} from "@/features/auth/components/AlertModal"
import SocialButton from "@/features/auth/components/SocialButton/SocialButton"
import { SOCIAL_TYPES } from "@/features/auth/constants/socialProviders"
import { useAuth } from "@/features/auth/hooks/useAuth"
import type { SocialLoginResponse } from "@/features/auth/hooks/useSocialLogin"
import {
  resolveLoginError,
  resolveLoginResult,
  SERVER_ERROR_MESSAGE,
  type LoginResult,
} from "@/features/auth/utils/resolveLoginResult"
import { useCookie } from "@/common/hooks/useCookie"
import { COOKIE_NAME } from "@/common/constants/cookie"

/**
 * ui-studio-01-login 상태 4종.
 *
 * B·C·D는 별도 페이지가 아니라 A 위에 뜨는 오버레이 모달이다(§8-1).
 * 라우팅을 새로 만들지 말고 로그인 액션 완료 시점에 모달만 토글한다.
 *
 * 화면 하단의 "스튜디오 신청하기" 링크는 §7-4에서 **삭제 확정**됐다.
 * 신청 진입은 오직 모달 D의 [신청하기]뿐이다.
 *
 * 구조는 앱(front-end)의 AuthHomeView와 같다 — SocialButton이 소셜 SDK 호출까지 끝내고
 * 결과만 handlePressSocialButton으로 올려주면, 여기서 백엔드 로그인 mutation을 태운다.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [, setAccessToken] = useCookie<string>(COOKIE_NAME.ACCESS_TOKEN)
  const [, setRefreshToken] = useCookie<string>(COOKIE_NAME.REFRESH_TOKEN)
  const [, setRole] = useCookie<string>(COOKIE_NAME.ROLE)

  const { socialLoginMutation } = useAuth()
  const { mutateAsync: socialLoginAsync, isPending } = socialLoginMutation
  const [result, setResult] = useState<LoginResult | null>(null)

  const handlePressSocialButton = useCallback(
    async (response: SocialLoginResponse) => {
      const { providerType, token, name } = response

      setResult(null)
      try {
        const res = await socialLoginAsync({ providerType, token, name })
        const next = resolveLoginResult(res)

        if (next.kind === "approved") {
          setAccessToken(next.accessToken)
          setRefreshToken(next.refreshToken)
          setRole("CREATOR")

          // ⚠️ navigate("/")를 쓰면 안 된다 — 온보딩 완료 처리와 같은 이유다.
          // navigate는 "지금" 마운트된 라우터에서 실행되는데, 그 시점의 라우터는
          // 아직 authRoutes다(role 쿠키 반영은 다음 렌더). authRoutes에서 "/"는
          // catch-all `*` → LoginPage에만 걸려, 주소만 "/"로 바뀐 채 로그인 화면이
          // 그대로 남는다(= 한 번 더 로그인해야 대시보드로 넘어가던 증상).
          //
          // role이 바뀌면 createRouter가 라우트 트리를 통째로 갈아끼우므로(router.ts),
          // 같은 라우터 안에서 이동시키지 말고 문서 자체를 새로 띄운다.
          // replace를 쓰는 이유: 뒤로 가기로 로그인 화면에 돌아오지 않게 한다.
          window.location.replace("/")
          return
        }

        if (next.kind === "onboarding") {
          navigate("/onboarding", {
            state: { registerToken: next.registerToken },
          })
          return
        }

        // 모달 D에서 [신청하기]를 누르면 곧바로 신청 API를 호출해야 하는데
        // 그 API는 로그인 상태를 요구한다. 모달을 띄우기 전에 토큰을 저장해 둔다.
        if (next.kind === "noApplication") {
          setAccessToken(next.accessToken)
          if (next.refreshToken) {
            setRefreshToken(next.refreshToken)
          }
          setRole("USER")
        }

        setResult(next)
      } catch (err) {
        setResult(resolveLoginError(err))
      }
    },
    [navigate, setAccessToken, setRefreshToken, setRole, socialLoginAsync]
  )

  // provider SDK 단계의 실패(설정 누락·팝업 차단·사용자 취소)는 백엔드까지 가지 않는다.
  const handleSocialError = useCallback((message: string) => {
    setResult({ kind: "error", message })
  }, [])

  const closeModal = () => setResult(null)

  return (
    <AuthShell variant="auth" subtitle="쇼룸 스튜디오">
      <p className="mb-5 text-center text-[12px] leading-[1.7] text-sz-n-600">
        인플루언서 전용 활동 공간입니다.
        <br />
        <b className="text-sz-n-900">소비자 계정</b>으로 로그인해 주세요.
      </p>

      {result?.kind === "error" && (
        <div
          role="alert"
          className="mb-5 rounded-[6px] bg-sz-warning-bg px-3.5 py-3 text-[12px] text-sz-n-700"
        >
          {result.message || SERVER_ERROR_MESSAGE}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-2.5">
        {SOCIAL_TYPES.map(socialType => (
          <SocialButton
            key={socialType}
            socialType={socialType}
            onPress={handlePressSocialButton}
            onError={handleSocialError}
            disabled={isPending}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-[12px] leading-[1.7] text-sz-n-500">
        쇼룸 스튜디오 신청 후{" "}
        <b className="text-sz-n-900">승인이 완료된 사용자</b>만 이용할 수
        있습니다.
      </p>

      {result?.kind === "pendingReview" && (
        <AlertModal
          tone="info"
          icon={<ClockIcon />}
          title="심사 중입니다"
          actions={
            <ModalButton variant="primary" onClick={closeModal} wide>
              확인
            </ModalButton>
          }
        >
          신청 내용을 검토하고 있습니다.
          <br />
          영업일 기준 3~7일 이내
          <br />
          이메일로 결과를 안내해 드립니다.
        </AlertModal>
      )}

      {result?.kind === "rejected" && (
        <AlertModal
          tone="danger"
          icon="!"
          title="신청이 반려되었습니다"
          actions={
            <ModalButton variant="primary" onClick={closeModal} wide>
              확인
            </ModalButton>
          }
        >
          <p>
            <b className="text-sz-n-900">사유:</b>{" "}
            {result.rejectReasonDetail ||
              result.rejectReasonType ||
              "관리자 확인 필요"}
            <br />
            이번 신청 건은 종료되었으며,{" "}
            <b className="text-sz-n-900">반려일로부터 14일 후</b>
            <br />
            새로운 신청서를 다시 제출할 수 있습니다.
          </p>
          {result.reapplyAvailableAt && (
            <p className="mt-2 text-sz-n-500">
              재신청 가능일: {result.reapplyAvailableAt.slice(0, 10)}
            </p>
          )}
        </AlertModal>
      )}

      {result?.kind === "noApplication" && (
        <AlertModal
          tone="neutral"
          icon={<EmptyInboxIcon />}
          title="신청 이력이 없습니다"
          actions={
            <>
              <ModalButton variant="line" onClick={closeModal}>
                닫기
              </ModalButton>
              <ModalButton
                variant="primary"
                onClick={() => navigate("/signup")}
              >
                신청하기
              </ModalButton>
            </>
          }
        >
          쇼룸 스튜디오는 승인된
          <br />
          인플루언서만 이용할 수 있습니다.
          <br />
          먼저 신청을 진행해 주세요.
        </AlertModal>
      )}
    </AuthShell>
  )
}
