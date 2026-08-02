import { useSocialLoginMutation } from "@/features/auth/hooks/useSocialLoginMutation"

// 앱(front-end)의 useAuth와 동일한 역할 — auth 관련 mutation 묶음.
// 앱은 registerMutation도 함께 반환하지만, 스튜디오의 신청(apply)은 별도 화면 흐름이라 여기 없다.
export function useAuth() {
  const socialLoginMutation = useSocialLoginMutation()

  return { socialLoginMutation }
}
