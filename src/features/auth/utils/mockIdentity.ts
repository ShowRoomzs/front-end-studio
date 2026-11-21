import { getKoreanAge } from "@/features/auth/utils/studioValidation"

/**
 * Step1 본인인증 — **목 구현**.
 *
 * PASS 실명인증은 PG사와 함께 도입하기로 확정돼 아직 연동 대상이 아니다.
 * 백엔드 CreatorApplicationRequest에도 이름/생년월일/휴대폰 필드가 없어서
 * 이 단계의 값은 **서버로 전송되지 않는다** — 화면 흐름(연령 제한·확인 체크)만 담당한다.
 *
 * 실제 연동 시에는 verifyIdentity()만 PASS 결과를 반환하도록 교체하면 되고,
 * 백엔드 DTO에 필드가 추가되는 시점에 SignupPage의 제출 페이로드도 함께 넓히면 된다.
 */

export type VerifiedIdentity = {
  /** 마스킹된 표시용 값 (원본은 보관하지 않는다) */
  maskedName: string
  birthDate: string
  maskedPhone: string
  age: number
}

export const MIN_AGE = 19

/**
 * 목업 인증은 개발 서버에서만 쓴다. 배포본에서 시안 예시 값(실제 사람과 무관한 고정 이름 · 번호)을
 * 「인증 결과」처럼 보여 주면 안 된다 — 서버는 신청할 때 소비자 가입(C0-1) 본인인증 값을
 * users에서 그대로 복사하므로, 배포본 Step1은 그 사실을 안내하고 확인만 받는다.
 * 이 값을 조회하는 API는 없다(11-21 back-end main 확인).
 */
export const IDENTITY_MOCK_ENABLED = import.meta.env.DEV

/**
 * 시안에 적힌 예시 값을 그대로 쓴다.
 *
 * 연령 미충족 모달(state C)을 확인하려면 URL에 `?mockAge=under19`를 붙인다 —
 * 목이 사라지면 이 스위치도 함께 사라진다.
 */
export async function verifyIdentity(): Promise<VerifiedIdentity> {
  const underage =
    new URLSearchParams(window.location.search).get("mockAge") === "under19"

  const birth = underage ? new Date(2010, 6, 19) : new Date(2003, 6, 19)
  const yyyy = birth.getFullYear()
  const mm = String(birth.getMonth() + 1).padStart(2, "0")
  const dd = String(birth.getDate()).padStart(2, "0")

  return {
    maskedName: "소*서",
    birthDate: `${yyyy}.${mm}.${dd}`,
    maskedPhone: "010-****-6416",
    age: getKoreanAge(birth),
  }
}
