/*
  시안 ui-studio-08-contracts(파트너센터와 문자 단위 동일 마크업)의 원자 클래스 — 이 화면 안에서만 쓴다.

  공용 `Button`(shadcn)은 14px 베이스라 12px 라벨·13px 입력으로 짜인 이 화면과 어긋난다
  (파트너센터 계약 관리와 같은 판단). 시안 `.btn`(12px/500 · 32px · 좌우 14px)을
  그대로 옮기고, `.btn-lg`(38px · 13px · 좌우 20px)는 폼 하단 액션바 전용이다.
*/

export const BTN_BASE =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-3.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed"

export const BTN_PRIMARY = `${BTN_BASE} bg-sz-accent-500 text-white hover:bg-sz-accent-600 disabled:bg-sz-n-200 disabled:text-sz-n-400`
export const BTN_SECONDARY = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100 disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`
export const BTN_GHOST = `${BTN_BASE} bg-transparent text-sz-n-600 hover:bg-sz-n-100`
/** 시안 `.btn-danger` — 흰 배경 + 위험색 글자(테두리 #E9C9C9). 종결·거절처럼 되돌릴 수 없는 액션 */
export const BTN_DANGER = `${BTN_BASE} border border-[#E9C9C9] bg-white text-sz-danger-text hover:bg-sz-danger-bg disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`
/** 시안 `.btn-del` — 작성 내용 삭제(회색 테두리 · 위험색 글자) */
export const BTN_DELETE = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-danger-text hover:border-[#E9C9C9] hover:bg-sz-danger-bg`
/** 채운 위험색 — 확인 모달의 [삭제]·[거절] 확정 버튼(디자인시스템 `.btn-danger`) */
export const BTN_DANGER_SOLID = `${BTN_BASE} bg-sz-danger-text text-white hover:bg-[#8f2828] disabled:bg-sz-n-200 disabled:text-sz-n-400`
export const BTN_LG = "h-[38px] px-5 text-[13px]"

/** 시안 `.inp` — 36px · 13px · 패딩 8/12 · 포커스 링 */
export const INPUT_CLASS =
  "h-9 rounded-[6px] border border-sz-n-300 bg-white px-3 py-2 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-500"
export const INPUT_ERROR_CLASS = "border-sz-danger-text"
/** 시안 `.sel` — `.inp`에 갈매기표를 얹은 셀렉트 */
export const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer appearance-none pr-[30px]`
/** 시안 `.ta` */
export const TEXTAREA_CLASS =
  "min-h-[76px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-3 pt-[9px] pb-2 text-[13px] leading-[1.65] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"

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
