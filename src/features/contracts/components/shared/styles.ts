import { DS_FIELD_CLASS, DS_SELECT_CLASS } from "@/common/styles/formControls"

/*
  시안 ui-studio-08-contracts(파트너센터와 문자 단위 동일 마크업)의 원자 클래스.
  버튼 · 입력은 웹 디자인 시스템 v1.2 값이다 — 버튼 12px/500 · 32px · 좌우 14px · 모서리 6px,
  위험 = 채운 빨강, 비활성 = n-100 바탕 · n-400 글자 · n-200 테두리. 입력은 common/styles/formControls.
*/

export const BTN_BASE =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-3.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"

export const BTN_PRIMARY = `${BTN_BASE} bg-sz-accent-500 text-white hover:bg-sz-accent-600`
export const BTN_SECONDARY = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100`
export const BTN_GHOST = `${BTN_BASE} bg-transparent text-sz-n-600 hover:bg-sz-n-100`
/** 디자인 시스템 `.btn-danger` — 채운 위험색. 종결 · 거절 · 삭제 모두 이 한 모양이다 */
export const BTN_DANGER = `${BTN_BASE} bg-sz-danger-text text-white hover:bg-[#8f2828]`
export const BTN_DELETE = BTN_DANGER
export const BTN_DANGER_SOLID = BTN_DANGER
/** 폼 하단 액션바 — 디자인 시스템에 큰 버튼이 없어 높이 · 글자는 같고 좌우만 넓다 */
export const BTN_LG = "px-5"

/** 디자인 시스템 폼 요소 — 13px · 32px · 패딩 6/10 */
export const INPUT_CLASS = DS_FIELD_CLASS
export const INPUT_ERROR_CLASS = "border-sz-danger-text"
/** 시안 `.sel` — `.inp`에 갈매기표를 얹은 셀렉트 */
export const SELECT_CLASS = DS_SELECT_CLASS
/** 시안 `.ta` */
export const TEXTAREA_CLASS =
  "min-h-[76px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] leading-[1.65] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"

/** 시안 `.hint` · `.err` · `.fsub` */
export const HINT_CLASS = "mt-[5px] text-[11px] leading-[1.55] text-sz-n-500"
export const ERR_CLASS = "mt-[5px] text-[11px] text-sz-danger-text"
export const FSUB_CLASS = "mt-[2px] text-[11px] text-sz-n-500"
/** 시안 `.flink` — 값 옆의 밑줄 링크 */
export const FLINK_CLASS =
  "cursor-pointer text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"

/** 시안 `.terms`/`.trow`/`.tk`/`.tv` — 읽기 전용 표 */
export const TERMS_CLASS =
  "rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[14px] py-[2px]"
export const TROW_CLASS =
  "flex gap-[14px] border-b border-sz-n-200 py-[9px] text-[12px] last:border-b-0"
export const TK_CLASS = "w-[118px] shrink-0 text-sz-n-500"
export const TV_CLASS = "flex-1 leading-[1.6] text-sz-n-700"
/** 시안 `.wtag` — 자문대기 같은 점선 태그 */
export const WTAG_CLASS =
  "ml-1 inline-block whitespace-nowrap rounded-[4px] border border-dashed border-sz-n-400 px-[5px] text-[10px] text-sz-n-500"
