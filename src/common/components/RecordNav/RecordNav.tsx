interface RecordNavProps {
  onList: () => void
  /** 이전 건이 없으면 넘기지 않는다 → 버튼 자체가 렌더링되지 않음(비활성 아님) */
  onPrev?: () => void
  /** 다음 건이 없으면 넘기지 않는다 → 버튼 자체가 렌더링되지 않음(비활성 아님) */
  onNext?: () => void
}

const BTN_CLASS =
  "inline-flex h-8 items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900"

/** 목록 / ‹ 이전 / 다음 › — 상세 화면 간 이동. 경계 건은 해당 버튼을 렌더링 생략한다. */
export default function RecordNav(props: RecordNavProps) {
  const { onList, onPrev, onNext } = props

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={BTN_CLASS} onClick={onList}>
        목록
      </button>
      {(onPrev || onNext) && (
        <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
      )}
      {onPrev && (
        <button type="button" className={BTN_CLASS} onClick={onPrev}>
          <span className="-mt-px text-[14px] leading-none">‹</span>이전
        </button>
      )}
      {onNext && (
        <button type="button" className={BTN_CLASS} onClick={onNext}>
          다음<span className="-mt-px text-[14px] leading-none">›</span>
        </button>
      )}
    </div>
  )
}
