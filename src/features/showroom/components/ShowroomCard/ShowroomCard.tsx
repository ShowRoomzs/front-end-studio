import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * 시안 `.card` — 쇼룸 관리 두 탭이 공유하는 카드 껍데기.
 *
 * 스튜디오에는 아직 공용 카드가 없다. 연결·소통은 좌우 2패널이라 카드를 쓰지 않았고,
 * 이 화면이 처음이다. 게시물(#5)까지 만들고 나서 규격이 굳으면 그때 common으로 올린다 —
 * 지금 올리면 화면 하나만 보고 공용 API를 정하는 셈이다.
 */
export function ShowroomCard(props: {
  title: string
  /** 헤더 우측 보조 텍스트(시안 `.ch-s`) 또는 셀렉트 같은 컨트롤 */
  note?: ReactNode
  children: ReactNode
  className?: string
}) {
  const { title, note, children, className } = props

  return (
    <section
      className={cn("rounded-[8px] border border-sz-n-200 bg-white", className)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-sz-n-200 px-[18px] py-[13px]">
        <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
        {typeof note === "string" ? (
          <span className="text-[11px] font-normal text-sz-n-500">{note}</span>
        ) : (
          note
        )}
      </div>
      {children}
    </section>
  )
}

/** 시안 `.sec` — 카드 본문 한 덩어리. 여러 개면 사이에 구분선이 생긴다 */
export function CardSection(props: {
  children: ReactNode
  className?: string
}) {
  const { children, className } = props

  return (
    <div
      className={cn(
        "border-b border-sz-n-200 p-[18px] last:border-b-0",
        className
      )}
    >
      {children}
    </div>
  )
}

/** 시안 `.btn-row` — 카드 맨 아래 액션 줄(우측 정렬) */
export function CardActions(props: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 border-t border-sz-n-200 px-[18px] py-[14px]">
      {props.children}
    </div>
  )
}

/**
 * 시안 `.note-i` — 카드 안 회색 안내 상자.
 *
 * auth의 `NoticeBox`(파란 배경 + `i` 배지)와는 다른 컴포넌트다. 저쪽은 신청 흐름에서
 * 반드시 읽어야 할 고지이고, 이쪽은 필드 옆에 붙는 보조 설명이라 톤이 낮다.
 */
export function NoteBox(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600",
        props.className
      )}
    >
      {props.children}
    </div>
  )
}
