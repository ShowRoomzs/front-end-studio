import TaskRow from "@/features/home/components/TaskRow"
import {
  CHECKLIST_COPY,
  GUIDE_STEPS,
  HOME_PATHS,
  SHOWROOM_LINK_COPIED_STORAGE_KEY,
} from "@/features/home/constants/params"
import type { HomeChecklistItem, HomeGuide } from "@/features/home/types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

/** 시안 `.tag-tbd` */
function PolicyPendingTag() {
  return (
    <span className="whitespace-nowrap rounded-[4px] bg-sz-n-100 px-1.5 py-px text-[10px] font-medium text-sz-n-500">
      [정책값 미정]
    </span>
  )
}

/** 시안 `.ck` — 체크 표시 */
function Check(props: { on: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto flex size-[22px] items-center justify-center rounded-full text-[12px] font-bold",
        props.on
          ? "bg-sz-success-bg text-sz-success-text"
          : "border-[1.5px] border-sz-n-300"
      )}
    >
      {props.on ? "✓" : null}
    </div>
  )
}

function readLinkCopied() {
  try {
    return localStorage.getItem(SHOWROOM_LINK_COPIED_STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

/** 공구 진행 5단계 + 단계별 담당(H3 위) — 시안 `.hm-guide` */
function GuideSteps() {
  return (
    <div className="mt-4 rounded-[8px] border border-sz-n-200 bg-white px-[18px] py-4">
      <div className="text-[12px] font-semibold text-sz-n-900">
        공구는 이렇게 진행돼요
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2.5">
        {GUIDE_STEPS.map((step, index) => (
          <div
            key={step.title}
            className="flex flex-col gap-1 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[11px]"
          >
            <div className="flex size-5 items-center justify-center rounded-full bg-sz-accent-500 text-[10px] font-bold text-white">
              {index + 1}
            </div>
            <div className="mt-0.5 text-[12px] font-semibold text-sz-n-900">
              {step.title}
            </div>
            <div className="flex-1 text-[11px] leading-[1.55] text-sz-n-600">
              {step.description}
              {step.policyPending && (
                <>
                  {" "}
                  <PolicyPendingTag />
                </>
              )}
            </div>
            <div className="border-t border-sz-n-200 pt-1.5 text-[10px] font-semibold text-sz-n-500">
              {step.who}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[11px] text-sz-n-500">
        내가 먼저 브랜드에 요청하거나 계약을 만들 수는 없어요 · 쇼룸을 채워 두면
        브랜드가 보고 연결을 요청해요
      </div>
    </div>
  )
}

/**
 * 가입 직후 시작 가이드(H3) — 5단계 + 「지금 할 수 있는 것」 체크리스트 4개.
 * 첫 연결 요청이 오면 서버가 `guide.visible = false`로 내려 사라진다(숨기기 버튼 없음).
 * 링크 복사는 서버가 판정할 수 없어(기기 동작) 이 브라우저에 남긴다.
 */
export default function StartGuide(props: { guide: HomeGuide }) {
  const { guide } = props
  const navigate = useNavigate()
  const [linkCopied, setLinkCopied] = useState(readLinkCopied)

  const isDone = (item: HomeChecklistItem) =>
    item.key === "SHOWROOM_LINK" ? linkCopied : item.done === true

  const completed =
    guide.completed +
    (linkCopied && guide.checklist.some(i => i.key === "SHOWROOM_LINK") ? 1 : 0)

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("쇼룸 링크를 복사했어요.")
      setLinkCopied(true)
      try {
        localStorage.setItem(SHOWROOM_LINK_COPIED_STORAGE_KEY, "true")
      } catch {
        // 저장이 막혀도 이번 화면에서는 완료로 보인다
      }
    } catch {
      toast.error("복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.")
    }
  }

  const action = (item: HomeChecklistItem, done: boolean) => {
    switch (item.key) {
      case "SETTLEMENT_INFO":
        return {
          label: "보기",
          onAction: () => navigate(HOME_PATHS.basicInfo("settlement")),
        }
      case "PROFILE":
        return { label: "보기", onAction: () => navigate(HOME_PATHS.SHOWROOM) }
      case "FIRST_POST":
        return done
          ? { label: "보기", onAction: () => navigate(HOME_PATHS.POST_LIST) }
          : {
              label: "작성하기",
              onAction: () => navigate(HOME_PATHS.POST_NEW),
            }
      case "SHOWROOM_LINK":
        return {
          label: "링크 복사",
          onAction: () => item.showroomUrl && copyLink(item.showroomUrl),
          disabled: !item.showroomUrl,
        }
    }
  }

  return (
    <>
      <GuideSteps />
      <div className="mt-5 flex items-baseline gap-2 text-[13px] font-semibold text-sz-n-900">
        지금 할 수 있는 것
        <span className="text-[12px] font-normal text-sz-n-500">
          {completed} / {guide.total} 완료
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-2.5">
        {guide.checklist.map(item => {
          const done = isDone(item)
          const { label, onAction, disabled } = {
            disabled: false,
            ...action(item, done),
          }
          return (
            <TaskRow
              key={item.key}
              lead={<Check on={done} />}
              leadSub={done ? "완료" : ""}
              muted
              title={CHECKLIST_COPY[item.key].title}
              description={CHECKLIST_COPY[item.key].description}
              actionLabel={label}
              secondary={done}
              done={done}
              disabled={disabled}
              onAction={onAction}
            />
          )
        })}
      </div>
    </>
  )
}
