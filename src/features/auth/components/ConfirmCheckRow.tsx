import { Checkbox } from "@/components/ui/checkbox"

/**
 * 시안 `.confirm-row` — 클릭 가능한 단일 확인 체크박스.
 *
 * §7-1: 정적 이미지가 아니다. 체크하면 즉시 [다음] 버튼이 활성화돼야 한다.
 * 미체크 상태에서 에러 문구는 띄우지 않는다 — 버튼 비활성만으로 표현(§8-1).
 */
export function ConfirmCheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={e => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          onChange(!checked)
        }
      }}
      className="mb-5 flex cursor-pointer items-center gap-2.5 rounded-[6px] border border-sz-n-300 px-3.5 py-3"
    >
      <Checkbox checked={checked} tabIndex={-1} />
      <span className="text-[12px] font-medium text-sz-n-900">{label}</span>
    </div>
  )
}
