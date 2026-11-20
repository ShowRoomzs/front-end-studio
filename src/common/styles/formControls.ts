/*
  웹 디자인 시스템 v1.2 §폼 요소 — `input[type=text]` · `select` 한 규격.
  13px · 높이 32px · 패딩 6/10 · 모서리 6px · 테두리 n-300 · 흰 바탕 · 글자 n-900 ·
  포커스 = 액센트 테두리 + 3px 액센트-50 링. 셀렉트는 기본 화살표를 지우고 오른쪽 10px에 선 갈매기표.
  플레이스홀더 색은 디자인 시스템에 없어 화면 시안 값(n-400)을 쓴다.
  로그인 · 신청 · 온보딩(Auth)은 시안이 정한 별도 규격(40 · 44px)이라 `authStyles`를 쓴다.
*/

export const DS_FIELD_CLASS =
  "h-8 rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-500"

export const DS_SELECT_CLASS = `${DS_FIELD_CLASS} cursor-pointer appearance-none pr-8`

export const DS_SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
}
