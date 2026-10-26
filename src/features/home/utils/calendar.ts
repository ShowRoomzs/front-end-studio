import dayjs from "dayjs"
import { dateKey } from "@/features/home/utils/date"
import type {
  CalendarDeadline,
  CalendarGroupBuy,
  HomeCalendar,
} from "@/features/home/types"

/** 진행 중 공구 띠 한 칸 — 첫날(st) · 마지막 날(en) · 주 첫 칸이면 이름을 다시 적는다(시안 `.hc-band`) */
export interface CalendarBand {
  groupBuy: CalendarGroupBuy
  isStart: boolean
  isEnd: boolean
  showLabel: boolean
}

/** 칩 — 내 기한(노랑) · 오픈(초록) · 종료(회색) */
export type CalendarChip =
  | { kind: "deadline"; deadline: CalendarDeadline }
  | { kind: "open"; groupBuy: CalendarGroupBuy }
  | { kind: "end"; groupBuy: CalendarGroupBuy }

export interface CalendarCell {
  key: string
  day: number
  inMonth: boolean
  isWeekend: boolean
  holidayName: string | null
  bands: Array<CalendarBand>
  chips: Array<CalendarChip>
}

/** "2026-10" ± n달 */
export function shiftMonth(month: string, delta: number): string {
  return dayjs(`${month}-01`).add(delta, "month").format("YYYY-MM")
}

/** 달력 칸 — 그 달 1일이 있는 주의 일요일부터 말일이 있는 주의 토요일까지(시안 `.hc-cal`) */
export function gridRange(month: string): { from: string; to: string } {
  const first = dayjs(`${month}-01`)
  const start = first.subtract(first.day(), "day")
  const last = first.endOf("month")
  const end = last.add(6 - last.day(), "day")
  return { from: start.format("YYYY-MM-DD"), to: end.format("YYYY-MM-DD") }
}

/** 공구 이름 끝의 「공구」는 칸이 좁아 뺀다(시안 「글로우 크림 앵콜 · 판매 중」) */
export function shortGroupBuyName(name: string): string {
  return name.replace(/\s*공구$/, "")
}

export function buildCalendarCells(
  month: string,
  calendar: HomeCalendar | undefined,
  holidays: Map<string, string>
): Array<CalendarCell> {
  const { from, to } = gridRange(month)
  const cells: Array<CalendarCell> = []
  const groupBuys = calendar?.groupBuys ?? []
  const deadlines = calendar?.deadlines ?? []

  for (
    let cursor = dayjs(from);
    !cursor.isAfter(dayjs(to), "day");
    cursor = cursor.add(1, "day")
  ) {
    const key = cursor.format("YYYY-MM-DD")
    const bands: Array<CalendarBand> = []
    const chips: Array<CalendarChip> = []

    // 내 기한이 먼저 — 시안 21일 칸 「계약 서명 마감 · 연장 응답 마감 · … 종료」
    deadlines
      .filter(deadline => deadline.date === key)
      .forEach(deadline => chips.push({ kind: "deadline", deadline }))

    groupBuys.forEach(groupBuy => {
      const start = dateKey(groupBuy.startAt)
      const end = dateKey(groupBuy.endAt)
      // 진행 중 공구만 띠(범례 「진행 중 공구」) — 오픈 예정 · 종료는 그날 칩으로만
      if (groupBuy.status === "IN_PROGRESS" && key >= start && key <= end) {
        bands.push({
          groupBuy,
          isStart: key === start,
          isEnd: key === end,
          showLabel: key === start || cursor.day() === 0 || key === from,
        })
      }
      if (groupBuy.status === "UPCOMING" && key === start) {
        chips.push({ kind: "open", groupBuy })
      }
      if (key === end) {
        chips.push({ kind: "end", groupBuy })
      }
    })

    cells.push({
      key,
      day: cursor.date(),
      inMonth: cursor.format("YYYY-MM") === month,
      isWeekend: cursor.day() === 0 || cursor.day() === 6,
      holidayName: holidays.get(key) ?? null,
      bands,
      chips,
    })
  }
  return cells
}
