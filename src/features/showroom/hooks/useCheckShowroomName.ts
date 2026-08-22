import { showroomService } from "@/features/showroom/services/showroomService"
import { useMutation } from "@tanstack/react-query"

/**
 * 쇼룸명 중복 확인.
 *
 * 입력할 때마다 부르지 않는다 — blur 시점에 한 번만 확인한다. 타이핑 도중에는
 * 아직 완성되지 않은 이름이라 "이미 사용 중"이 계속 떴다 사라지고, 서버도 그만큼
 * 더 맞는다.
 *
 * 응답이 200이면서 `isAvailable: false`로 온다(에러가 아니다). 그래서 전역 에러
 * 토스트가 끼어들지 않고, 화면은 필드 아래 문구 한 줄로만 알린다.
 */
export function useCheckShowroomName() {
  return useMutation({
    mutationFn: (showroomName: string) =>
      showroomService.checkShowroomName(showroomName),
  })
}
