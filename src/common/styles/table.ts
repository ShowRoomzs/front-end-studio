/*
  웹 디자인 시스템 v1.2 §표(compact).
  머리 칸: n-100 바탕 · n-600 · 11px/500 · 패딩 6/12
  몸 칸: 12px · 패딩 6/12 · 행 사이 n-200 선 · 행 hover n-50
*/

export const DS_TH_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-3 py-1.5 text-left text-[11px] font-medium text-sz-n-600"

export const DS_TD_CLASS = "px-3 py-1.5 text-[12px] align-middle"

/** 몸 행 — 첫 행은 머리 칸 아래 선이 있어 위 선을 지운다 */
export const DS_TR_CLASS =
  "border-t border-sz-n-200 first:border-t-0 hover:bg-sz-n-50"
