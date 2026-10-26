import TaskRow from "@/features/home/components/TaskRow"
import type { HomeTodo, HomeUpcoming } from "@/features/home/types"
import {
  daysUntil,
  formatDDay,
  formatMonthDay,
} from "@/features/home/utils/date"
import { homeTargetPath } from "@/features/home/utils/navigation"
import { useNavigate } from "react-router-dom"

/**
 * 기한 칸 — 기한이 있으면 「D-n」 + 작은 줄, 없으면 서버 칩 문구를 두 줄로(「지급 대기」 → 지급 / 대기).
 * 작은 줄은 시안대로: 서명 「08.21」 · 연장 응답 「종료 전」 · 게시물 「오픈 08.24」(서버 dueLabel 그대로).
 */
function todoLead(todo: HomeTodo, todayKey: string) {
  if (todo.kind === "CONNECTION_REQUESTS") {
    const count = Number(todo.extra?.count ?? 0)
    return { lead: `${count}건`, sub: "선택", muted: true }
  }
  // 체결 보류 중이면 기한이 멈춰 있다 — D-n 대신 서버 칩 「보류 중」
  if (todo.dueAt && todo.dueLabel !== "보류 중") {
    const lead = formatDDay(daysUntil(todo.dueAt, todayKey))
    switch (todo.kind) {
      case "CONTRACT_SIGN":
        return { lead, sub: formatMonthDay(todo.dueAt), muted: false }
      case "EXTENSION_RESPOND":
        return { lead, sub: "종료 전", muted: false }
      default:
        return {
          lead,
          sub: todo.dueLabel ?? formatMonthDay(todo.dueAt),
          muted: false,
        }
    }
  }
  if (todo.dueLabel) {
    const [head, ...rest] = todo.dueLabel.split(" ")
    return { lead: head, sub: rest.join(" "), muted: false }
  }
  // 기한 없는 일(노출 중지 게시물 수정)
  return { lead: "—", sub: "", muted: true }
}

export function TodoList(props: { todos: Array<HomeTodo>; todayKey: string }) {
  const { todos, todayKey } = props
  const navigate = useNavigate()

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {todos.map((todo, index) => {
        const { lead, sub, muted } = todoLead(todo, todayKey)
        const path = homeTargetPath(todo.target)
        return (
          <TaskRow
            key={`${todo.kind}-${todo.target.id ?? index}`}
            lead={lead}
            leadSub={sub}
            muted={muted}
            title={todo.title}
            description={
              todo.blocked ? (
                <span className="text-[11px] text-sz-n-500">
                  {todo.blocked.message}
                </span>
              ) : (
                todo.description
              )
            }
            actionLabel={todo.actionLabel}
            // 기한 없는 연결 요청은 보조 버튼(시안 「해도 되고 안 해도 되는 일」)
            secondary={todo.kind === "CONNECTION_REQUESTS"}
            locked={todo.blocked != null}
            disabled={!path}
            onAction={() => path && navigate(path)}
          />
        )
      })}
    </div>
  )
}

/** H2 오픈 카드 문구 — 서버가 게시물 상태를 함께 내려 FE 가 고른다(1017 설계서 5-1 · 시안 H2) */
function upcomingDescription(item: HomeUpcoming) {
  if (item.kind === "GROUP_BUY_OPEN") {
    if (item.postStatus === "SCHEDULED") {
      return "게시물 승인 완료 · 오픈 대기"
    }
    if (item.postStatus === "PENDING_APPROVAL") {
      return "운영자가 게시물을 검토하고 있어요"
    }
  }
  return item.description
}

/** H2 다가오는 일정 — 버튼 없는 회색 카드(시안은 보조 버튼 「공구 보기」) */
export function UpcomingList(props: {
  items: Array<HomeUpcoming>
  todayKey: string
}) {
  const { items, todayKey } = props
  const navigate = useNavigate()

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {items.map(item => {
        const path = homeTargetPath(item.target)
        return (
          <TaskRow
            key={`${item.kind}-${item.target.id}-${item.date}`}
            lead={formatDDay(daysUntil(item.date, todayKey))}
            leadSub={formatMonthDay(item.date)}
            muted
            title={item.title}
            description={upcomingDescription(item)}
            actionLabel="공구 보기"
            secondary
            disabled={!path}
            onAction={() => path && navigate(path)}
          />
        )
      })}
    </div>
  )
}
