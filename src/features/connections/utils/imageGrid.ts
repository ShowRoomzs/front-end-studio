export interface ImageGridLayout {
  /** 시안 `.mgrid.n2` ~ `.n6plus` — 칸 수에 따라 그리드 모양이 통째로 바뀐다 */
  variant: "n2" | "n3" | "n4" | "n5" | "n6plus"
  /** 실제로 그릴 칸 수 */
  visibleCount: number
  /** 마지막 칸 `+N` 오버레이 숫자 — 0이면 오버레이 없음 */
  overlayCount: number
}

/**
 * 이미지 첨부 개수 → 그리드 배치(§13-8).
 *
 * 2~4장은 전부 노출, 5장 이상은 3×2(6칸) 고정, 7장 이상이면 마지막 칸을
 * `+N` 오버레이로 덮어 나머지 개수를 표시한다. 1장은 그리드가 아니라
 * 단일 `.media` 박스라 호출부에서 따로 처리한다.
 */
export function computeImageGridLayout(count: number): ImageGridLayout {
  if (count <= 2) {
    return { variant: "n2", visibleCount: count, overlayCount: 0 }
  }
  if (count === 3) {
    return { variant: "n3", visibleCount: 3, overlayCount: 0 }
  }
  if (count === 4) {
    return { variant: "n4", visibleCount: 4, overlayCount: 0 }
  }
  if (count === 5) {
    return { variant: "n5", visibleCount: 5, overlayCount: 0 }
  }
  return {
    variant: "n6plus",
    visibleCount: 6,
    overlayCount: count > 6 ? count - 6 : 0,
  }
}
