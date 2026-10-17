import type { ReactNode } from "react"

/**
 * 백엔드 API가 아직 없는 화면의 배포본 표시(`common/utils/devMock.ts`).
 * 화면 골격은 그대로 두고 데이터 자리만 이 안내로 바꾼다 — 가짜 값을 보여주지 않는다.
 */
export default function NotReady(props: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const { title, children, action } = props
  return (
    <div className="px-6 py-[72px] text-center">
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {title}
      </div>
      {children && (
        <div className="text-[12px] leading-[1.6] text-sz-n-500">
          {children}
        </div>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
