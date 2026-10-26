import { HOME_PATHS } from "@/features/home/constants/params"
import {
  useGetBusinessHolidays,
  useGetHomeCalendar,
} from "@/features/home/hooks/useHomeQueries"
import {
  buildCalendarCells,
  gridRange,
  shiftMonth,
  shortGroupBuyName,
  type CalendarCell,
  type CalendarChip,
} from "@/features/home/utils/calendar"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
/** 한 칸에 칩을 이만큼까지 — 넘치면 「+N」 */
const MAX_CHIPS = 3

const CHIP_CLASS: Record<CalendarChip["kind"], string> = {
  deadline: "bg-sz-warning-bg text-sz-warning-text",
  open: "bg-sz-success-bg text-sz-success-text",
  end: "bg-sz-n-100 text-sz-n-600",
}

function chipText(chip: CalendarChip) {
  switch (chip.kind) {
    case "deadline":
      return chip.deadline.kind === "SIGN_DUE"
        ? "계약 서명 마감"
        : "연장 응답 마감"
    case "open":
      return `${shortGroupBuyName(chip.groupBuy.name)} 오픈`
    case "end":
      return `${shortGroupBuyName(chip.groupBuy.name)} 종료`
  }
}

function chipTitle(chip: CalendarChip) {
  if (chip.kind === "deadline") {
    return chip.deadline.label
  }
  const hold = chip.groupBuy.hold?.label
  return hold ? `${chip.groupBuy.name} · ${hold}` : chip.groupBuy.name
}

function chipPath(chip: CalendarChip) {
  if (chip.kind === "deadline") {
    return chip.deadline.targetType === "CONTRACT"
      ? HOME_PATHS.contract(chip.deadline.targetId)
      : HOME_PATHS.groupBuy(chip.deadline.targetId)
  }
  return HOME_PATHS.groupBuy(chip.groupBuy.groupBuyId)
}

function Legend() {
  const items = [
    {
      label: "진행 중 공구",
      className: "border-sz-accent-100 bg-sz-accent-50",
    },
    { label: "내 기한", className: "border-sz-warning-text bg-sz-warning-bg" },
    { label: "오픈", className: "border-sz-success-text bg-sz-success-bg" },
    { label: "종료", className: "border-sz-n-400 bg-sz-n-100" },
  ]
  return (
    <span className="flex gap-3 text-[11px] text-sz-n-500">
      {items.map(item => (
        <span key={item.label} className="flex items-center">
          <i
            className={cn(
              "mr-1 inline-block size-2 rounded-[2px] border",
              item.className
            )}
          />
          {item.label}
        </span>
      ))}
    </span>
  )
}

function Cell(props: {
  cell: CalendarCell
  todayKey: string
  isLastColumn: boolean
}) {
  const { cell, todayKey, isLastColumn } = props
  const navigate = useNavigate()
  const isToday = cell.key === todayKey
  const isPast = cell.key < todayKey
  // 주말 · 공휴일(대체공휴일 포함)은 회색 칸 — 영업일 계산을 눈으로 보이게(파트너 16 · 시안 `.hc-c.out`과 같은 색)
  const isOff = !cell.inMonth || cell.isWeekend || cell.holidayName != null
  const chips = cell.chips.slice(0, MAX_CHIPS)
  const hidden = cell.chips.length - chips.length
  const dayLabel =
    !cell.inMonth && cell.day === 1
      ? dayjs(cell.key).format("M.D")
      : String(cell.day)

  return (
    <div
      className={cn(
        "flex min-h-[92px] min-w-0 flex-col gap-[3px] border-b border-sz-n-100 p-1.5",
        !isLastColumn && "border-r",
        isOff && "bg-sz-n-50"
      )}
      title={cell.holidayName ?? undefined}
    >
      <div
        className={cn(
          "flex size-[22px] items-center justify-center text-[12px] tabular-nums",
          isToday
            ? "rounded-full bg-sz-accent-500 font-semibold text-white"
            : !cell.inMonth || isPast
              ? "text-sz-n-400"
              : "text-sz-n-700"
        )}
      >
        {dayLabel}
      </div>
      {cell.bands.map(band => (
        <button
          key={band.groupBuy.groupBuyId}
          type="button"
          onClick={() =>
            navigate(HOME_PATHS.groupBuy(band.groupBuy.groupBuyId))
          }
          title={band.groupBuy.name}
          className={cn(
            "relative -mx-[7px] h-5 cursor-pointer whitespace-nowrap bg-sz-accent-50 px-1.5 text-left text-[10px] font-semibold leading-5 text-sz-accent-600",
            band.showLabel ? "z-[2]" : "z-[1]",
            band.isStart && "ml-0 rounded-l-[4px]",
            band.isEnd && "mr-0 rounded-r-[4px]"
          )}
        >
          {band.showLabel
            ? `${shortGroupBuyName(band.groupBuy.name)} · 판매 중`
            : " "}
        </button>
      ))}
      {chips.map((chip, index) => (
        <button
          key={`${chip.kind}-${index}`}
          type="button"
          onClick={() => navigate(chipPath(chip))}
          title={chipTitle(chip)}
          className={cn(
            "cursor-pointer truncate rounded-[4px] px-1.5 py-[3px] text-left text-[10px] font-medium",
            CHIP_CLASS[chip.kind]
          )}
        >
          {chipText(chip)}
        </button>
      ))}
      {hidden > 0 && (
        <div className="px-1.5 text-[10px] text-sz-n-500">+{hidden}</div>
      )}
    </div>
  )
}

/**
 * 월 달력(할 일 아래 전폭) — 시안 `.hc`. 진행 중 공구 기간 = 연한 인디고 띠(공구명) · 내 기한 = 노랑 ·
 * 오픈 = 초록 · 종료 = 회색 칩 · 오늘 = 인디고 원 · 주말 · 공휴일 = 회색 칸. 게시물 작성 · 재등록은 넣지 않는다(서버가 뺀다).
 */
export default function HomeCalendar(props: {
  month: string
  onChangeMonth: (month: string) => void
  todayKey: string
  /** H3 — 일정이 없을 때 범례 대신 안내 한 줄 */
  isNewMember: boolean
}) {
  const { month, onChangeMonth, todayKey, isNewMember } = props
  const { from, to } = gridRange(month)
  const { data: calendar, isError } = useGetHomeCalendar(month)
  const { data: holidayList } = useGetBusinessHolidays(from, to)

  const cells = useMemo(() => {
    const holidays = new Map<string, string>()
    // 달력 응답에도 공휴일이 실린다 — 공용 API가 실패해도 칠할 수 있게 합친다
    ;[...(calendar?.holidays ?? []), ...(holidayList ?? [])].forEach(h =>
      holidays.set(h.date, h.name)
    )
    return buildCalendarCells(month, calendar, holidays)
  }, [month, calendar, holidayList])

  const prev = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)
  const monthLabel = (value: string) => `${Number(value.slice(5, 7))}월`
  const isEmpty =
    calendar != null &&
    calendar.groupBuys.length === 0 &&
    calendar.deadlines.length === 0

  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center gap-3 border-b border-sz-n-100 px-4 py-3">
        <span className="text-[13px] font-semibold text-sz-n-900">
          {monthLabel(month)} 일정
        </span>
        {isNewMember && isEmpty ? (
          <span className="text-[11px] text-sz-n-500">
            아직 일정이 없어요 · 계약이 체결되면 공구 일정이 표시돼요
          </span>
        ) : isError ? (
          <span className="text-[11px] text-sz-n-500">
            일정을 불러오지 못했어요
          </span>
        ) : (
          <Legend />
        )}
        <span className="ml-auto text-[11px] font-medium text-sz-accent-600">
          <button
            type="button"
            className="cursor-pointer hover:underline"
            onClick={() => onChangeMonth(prev)}
          >
            ‹ {monthLabel(prev)}
          </button>
          {" · "}
          <button
            type="button"
            className="cursor-pointer hover:underline"
            onClick={() => onChangeMonth(next)}
          >
            {monthLabel(next)} ›
          </button>
        </span>
      </div>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map(weekday => (
          <div
            key={weekday}
            className="border-b border-sz-n-100 bg-sz-n-50 py-[7px] text-center text-[11px] text-sz-n-500"
          >
            {weekday}
          </div>
        ))}
        {cells.map((cell, index) => (
          <Cell
            key={cell.key}
            cell={cell}
            todayKey={todayKey}
            isLastColumn={index % 7 === 6}
          />
        ))}
      </div>
    </div>
  )
}
