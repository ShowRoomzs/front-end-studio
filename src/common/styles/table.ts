/*
  목록 표 — 화면 시안(ui-studio-08 · 09 · 10 · 12) 값.
  사용자 결정(11-21): 표 행 간격은 디자인 시스템 compact(6/12)가 아니라 시안을 따른다.
  머리 칸: n-100 바탕 · n-600 · 11px/600 · 패딩 11/16
  몸 칸: 12px · 패딩 13/16 · 행 사이 n-100 선 · 행 hover accent-50
*/

export const LIST_TH_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[11px] text-left text-[11px] font-semibold tracking-[.2px] text-sz-n-600"

export const LIST_TD_CLASS = "px-4 py-[13px] text-[12px] align-middle"

/** 몸 행 — 첫 행은 머리 칸 아래 선이 있어 위 선을 지운다 */
export const LIST_TR_CLASS =
  "border-t border-sz-n-100 first:border-t-0 hover:bg-sz-accent-50"
