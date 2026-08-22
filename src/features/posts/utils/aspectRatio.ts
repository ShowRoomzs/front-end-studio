import {
  ASPECT_RATIO_MAX,
  ASPECT_RATIO_MIN,
} from "@/features/posts/constants/params"

/** 크롭 창의 위치·배율. 화면이 들고 다니는 유일한 크롭 상태다 */
export interface CropState {
  /** 1 = 대상 비율로 잘라낼 수 있는 **가장 큰** 창. 키울수록 확대(=창이 작아진다) */
  zoom: number
  /** -0.5 ~ 0.5 정규화 오프셋. 0이면 가운데 */
  offsetX: number
  offsetY: number
}

export const DEFAULT_CROP: CropState = { zoom: 1, offsetX: 0, offsetY: 0 }

export interface CropWindow {
  sx: number
  sy: number
  sw: number
  sh: number
}

/**
 * 허용 범위 안이면 원본 비율 그대로, 벗어나면 가장 가까운 경계값 (§24-2).
 *
 * 사용자가 비율을 고르지 않는다 — 인스타와 같은 연속 범위 클램프다.
 * 3:2 → 3:2 유지 / 16:9 → 1.91:1 / 9:16 → 4:5.
 */
export function clampAspectRatio(ratio: number) {
  return Math.min(ASPECT_RATIO_MAX, Math.max(ASPECT_RATIO_MIN, ratio))
}

export function isWithinAspectRange(ratio: number) {
  return ratio >= ASPECT_RATIO_MIN && ratio <= ASPECT_RATIO_MAX
}

/** 첫 사진이 게시물 비율을 정한다 — 나머지는 전부 이 값으로 잘린다 */
export function resolveTargetRatio(width: number, height: number) {
  return clampAspectRatio(width / height)
}

/**
 * 잘라낼 원본 영역.
 *
 * zoom=1일 때 창은 원본 안에 들어가는 대상 비율의 최대 사각형이고, zoom을 키우면 그만큼
 * 작아진다(확대). 오프셋은 남는 여백에 대한 비율이라 창이 원본 밖으로 나가지 않는다.
 */
export function computeCropWindow(params: {
  naturalWidth: number
  naturalHeight: number
  targetRatio: number
  crop: CropState
}): CropWindow {
  const { naturalWidth, naturalHeight, targetRatio, crop } = params
  const naturalRatio = naturalWidth / naturalHeight

  // 원본이 대상보다 납작하면 가로가, 홀쭉하면 세로가 먼저 닿는다
  const baseWidth =
    naturalRatio > targetRatio ? naturalHeight * targetRatio : naturalWidth
  const baseHeight =
    naturalRatio > targetRatio ? naturalHeight : naturalWidth / targetRatio

  const zoom = Math.max(1, crop.zoom)
  const sw = baseWidth / zoom
  const sh = baseHeight / zoom

  const slackX = naturalWidth - sw
  const slackY = naturalHeight - sh
  const clampOffset = (value: number) => Math.min(0.5, Math.max(-0.5, value))

  return {
    sx: slackX / 2 + clampOffset(crop.offsetX) * slackX,
    sy: slackY / 2 + clampOffset(crop.offsetY) * slackY,
    sw,
    sh,
  }
}

/** 크롭본이 이보다 커질 이유가 없다 — 쇼룸 피드·격자 어디서도 이 폭을 넘겨 그리지 않는다 */
const MAX_OUTPUT_EDGE = 1600

/**
 * 크롭본의 **정수** 픽셀 크기.
 *
 * 서버는 저장된 정수 크기로 비율을 다시 계산해 허용 범위를 검사한다. 목표 비율이 경계값
 * (0.8 · 1.91)일 때 반올림이 바깥으로 한 틱만 밀려도 게시가 통째로 거절되므로, 정수로
 * 만든 뒤 범위를 다시 확인하고 한 픽셀씩 당겨 넣는다.
 */
export function resolveOutputSize(params: {
  sw: number
  sh: number
  targetRatio: number
}) {
  const { sw, sh, targetRatio } = params

  const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(sw, sh))
  let width = Math.max(1, Math.round(sw * scale))
  let height = Math.max(1, Math.round(width / targetRatio))

  // 반올림이 범위 밖으로 밀어낸 경우 — 세로를 한 픽셀씩 조여 안으로 되돌린다
  for (let i = 0; i < 4 && !isWithinAspectRange(width / height); i += 1) {
    height += width / height < ASPECT_RATIO_MIN ? -1 : 1
    height = Math.max(1, height)
  }
  if (!isWithinAspectRange(width / height)) {
    // 여기까지 왔다면 정수 해상도가 너무 낮아 조정이 먹지 않는 경우다
    height = Math.max(1, Math.round(width / clampAspectRatio(width / height)))
    width = Math.max(1, Math.round(height * clampAspectRatio(targetRatio)))
  }

  return { width, height }
}

/**
 * 비율 칩 문구 — **표시만** 한다. 크롭 모달에도 비율 선택 컨트롤은 두지 않는다(§24-2).
 */
export function describeRatio(naturalWidth: number, naturalHeight: number) {
  const ratio = naturalWidth / naturalHeight
  if (isWithinAspectRange(ratio)) {
    return "원본 맞춤"
  }
  return ratio > ASPECT_RATIO_MAX ? "1.91:1로 조정" : "4:5로 조정"
}

/** 소비자 피드 미리보기의 높이를 정하는 값 — 고정 높이 카드로 그리면 안 된다(§24-2) */
export function toCssAspectRatio(ratio: number | null | undefined) {
  return ratio && Number.isFinite(ratio) ? `${ratio} / 1` : `${4 / 5} / 1`
}
