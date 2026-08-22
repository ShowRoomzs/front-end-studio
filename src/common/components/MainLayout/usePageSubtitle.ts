import { useEffect } from "react"
import { useOutletContext } from "react-router-dom"

/**
 * 셸이 자식 화면에 내려주는 것 — 탑바 crumb와 H1을 바꿀 수 있는 손잡이 하나뿐이다.
 */
export interface ShellOutletContext {
  setSubtitle: (subtitle: string | null) => void
}

/**
 * 한 메뉴가 여러 화면을 갖는 경우에만 쓰는 훅 (게시물의 `새 게시물` · `수정`).
 *
 * 셸은 원래 GNB 라벨 하나로 탑바 crumb와 H1을 모두 그린다 — 메뉴 = 화면이었기
 * 때문이다. 게시물은 목록 아래에 작성·수정·조치 화면이 붙어서 처음으로 그 가정이
 * 깨진다. 라우트별 제목표를 셸에 두지 않고 화면이 자기 이름을 올리게 한 이유는,
 * 제목이 상태에 따라 갈리기 때문이다(같은 `/posts/:id`가 수정이기도 하고
 * 노출 중지 조치 화면이기도 하다).
 *
 * `null`을 넘기면 메뉴 라벨로 되돌아간다.
 */
export function usePageSubtitle(subtitle: string | null) {
  const { setSubtitle } = useOutletContext<ShellOutletContext>()

  useEffect(() => {
    setSubtitle(subtitle)
    // 화면을 떠날 때 되돌리지 않으면 목록으로 돌아가서도 `수정`이 남는다
    return () => setSubtitle(null)
  }, [setSubtitle, subtitle])
}
