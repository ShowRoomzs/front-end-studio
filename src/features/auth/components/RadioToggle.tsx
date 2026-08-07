import { cn } from "@/lib/utils"

export type RadioToggleOption<T extends string> = {
  value: T
  label: string
}

type RadioToggleProps<T extends string> = {
  options: [RadioToggleOption<T>, RadioToggleOption<T>]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  name: string
}

/**
 * 시안 `.radio-row` / `.rad` — 2지선다 선택 카드(사업자 여부).
 * 스튜디오 신규 컴포넌트지만 톤(높이 40px·보더·라운드)은 기존 컨트롤과 통일했다.
 *
 * 접근성: 시안은 div였지만 실제 라디오 시맨틱을 준다 — 키보드 좌우 이동과
 * 스크린리더 그룹 읽기가 공짜로 따라온다.
 */
export function RadioToggle<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  name,
}: RadioToggleProps<T>) {
  return (
    <div role="radiogroup" className="mb-1.5 flex gap-2">
      {options.map(option => {
        const selected = option.value === value
        return (
          <label
            key={option.value}
            className={cn(
              "flex h-10 flex-1 cursor-pointer items-center gap-2 rounded-[6px] border px-3.5 text-[13px]",
              selected
                ? "border-sz-n-900 bg-sz-n-50 font-medium text-sz-n-900"
                : "border-sz-n-300 text-sz-n-700",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "relative h-[15px] w-[15px] shrink-0 rounded-full border-[1.5px]",
                selected ? "border-sz-n-900" : "border-sz-n-300"
              )}
            >
              {selected && (
                <span className="absolute inset-[3px] rounded-full bg-sz-n-900" />
              )}
            </span>
            {option.label}
          </label>
        )
      })}
    </div>
  )
}
