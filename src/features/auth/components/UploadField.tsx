import { useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { authService } from "@/features/auth/services/authService"

// 시안 §3 — 10MB · jpg/png/pdf (파트너센터는 5MB·jpg/png로 더 엄격하다. 화면별 확정값이 다르다)
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_EXT = ["jpg", "jpeg", "png", "pdf"]
const ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"

type UploadFieldProps = {
  /** 미첨부 상태에서 보여줄 이름 (예: "통장 사본") */
  label: string
  /** 업로드된 이미지 URL (RHF 필드 값) */
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

/**
 * 시안 `.upload` — 점선 보더 → 성공 시 **실선 + 그린 배경 + 체크**, 실패 시 danger.
 *
 * ⚠️ 미첨부는 에러 문구를 띄우지 않는다(시안 §4-1). 필수 미입력은 다른 화면과 동일하게
 * **제출 버튼 비활성만으로** 표현하며, 여기서 실제로 뜨는 에러는 형식·용량 두 가지뿐이다.
 *
 * accept 속성으로 OS 파일 선택창에서 1차로 걸러지지만 드래그앤드롭·"모든 파일" 옵션으로
 * 우회될 수 있어 선택 즉시 JS로 2차 검증한다(시안 §4-2). 서버 검증은 별개로 필요하다.
 */
export function UploadField({
  label,
  value,
  onChange,
  disabled = false,
}: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  // 시안은 실패 사유에 따라 힌트 줄 문구가 다르다 — "지원하지 않는 형식" / "선택한 파일 14.8MB"
  const [errorHint, setErrorHint] = useState("")

  const fail = (name: string, hint: string, message: string) => {
    setFileName(name)
    setErrorHint(hint)
    setError(message)
    onChange("")
  }

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("")
    setErrorHint("")
    const file = e.target.files?.[0]
    e.target.value = "" // 같은 파일 재선택 허용
    if (!file) return

    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_EXT.includes(ext)) {
      fail(
        file.name,
        "지원하지 않는 형식",
        "jpg, png, pdf 파일만 업로드할 수 있습니다."
      )
      return
    }
    if (file.size > MAX_SIZE) {
      fail(
        file.name,
        `선택한 파일 ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        "파일 크기가 10MB를 초과했습니다. 10MB 이하의 파일을 선택해 주세요."
      )
      return
    }

    try {
      setUploading(true)
      const res = await authService.uploadCreatorDocument(file)
      setFileName(file.name)
      onChange(res.imageUrl)
    } catch {
      fail(
        file.name,
        "업로드 실패",
        "업로드에 실패했습니다. 다시 시도해 주세요."
      )
    } finally {
      setUploading(false)
    }
  }

  const uploaded = !!value

  return (
    <div className="mb-4">
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-[6px] border p-3.5",
          error
            ? "border-solid border-sz-danger-text bg-sz-danger-bg"
            : uploaded
              ? "border-solid border-sz-success-text bg-sz-success-bg"
              : "border-dashed border-sz-n-300 bg-sz-n-50"
        )}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="truncate text-[12px] font-medium text-sz-n-700">
            {uploaded && (
              <span className="mr-1 font-bold text-sz-success-text">✓</span>
            )}
            {fileName || `📎 ${label}`}
          </div>
          <div
            className={cn(
              "text-[11px]",
              uploaded && !error
                ? "font-medium text-sz-success-text"
                : "text-sz-n-500"
            )}
          >
            {uploading
              ? "업로드 중…"
              : uploaded
                ? "업로드 완료"
                : errorHint || "최대 10MB · jpg, png, pdf"}
          </div>
        </div>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="h-8 shrink-0 rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[11px] font-medium whitespace-nowrap text-sz-n-700 hover:enabled:bg-sz-n-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploaded ? "다시 선택" : "파일 선택"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleSelect}
        />
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-[12px] text-sz-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}
