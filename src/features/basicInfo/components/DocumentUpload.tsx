import axios from "axios"
import { useRef, useState } from "react"

import { FileBox } from "@/features/basicInfo/components/parts"
import { buttonClass } from "@/features/basicInfo/components/styles"
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_ALLOWED_EXT,
  DOCUMENT_MAX_BYTES,
} from "@/features/basicInfo/constants/params"
import { basicInfoService } from "@/features/basicInfo/services/basicInfoService"
import type { UploadedDocument } from "@/features/basicInfo/types"
import { fileBadge, formatFileSize } from "@/features/basicInfo/utils/format"

/** 시안 T3 — 이 탭의 유일한 에러 문구(형식 · 용량). 업로드 박스 바로 밑에 붙는다 */
const FILE_RULE_ERROR = "jpg · png · pdf 파일만 올릴 수 있고 최대 10MB입니다."
const UPLOAD_FAILED = "업로드에 실패했습니다. 다시 시도해 주세요."

/**
 * 서류 파일 상자(통장 사본 · 사업자등록증 · 폐업사실증명원) — 고르는 즉시 형식 · 용량을 보고 올린다.
 *
 * 미첨부는 문구 없이 제출 버튼 비활성만(시안 T2 · T7). 실패하면 고른 파일 이름 · 크기를 남긴 채
 * 테두리를 위험색으로 바꾼다(T3) — 무엇이 거절됐는지 보여야 다른 파일을 고를 수 있다.
 */
export default function DocumentUpload(props: {
  /** 비어 있을 때 문구 — 「사업자등록증 사본을 올려주세요」 */
  emptyLabel: string
  value: UploadedDocument | null
  onChange: (value: UploadedDocument | null) => void
  disabled?: boolean
}) {
  const { emptyLabel, value, onChange, disabled = false } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [rejected, setRejected] = useState<{
    name: string
    size: number
    message: string
  } | null>(null)

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // 같은 파일을 다시 골라도 change가 나도록
    event.target.value = ""
    if (!file) return

    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!DOCUMENT_ALLOWED_EXT.includes(ext) || file.size > DOCUMENT_MAX_BYTES) {
      setRejected({
        name: file.name,
        size: file.size,
        message: FILE_RULE_ERROR,
      })
      onChange(null)
      return
    }

    setRejected(null)
    setUploading(true)
    try {
      const { imageUrl } = await basicInfoService.uploadDocument(file)
      onChange({ url: imageUrl, name: file.name, size: file.size })
    } catch (error) {
      const serverMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined
      setRejected({
        name: file.name,
        size: file.size,
        message: serverMessage || UPLOAD_FAILED,
      })
      onChange(null)
    } finally {
      setUploading(false)
    }
  }

  const pick = (
    <button
      type="button"
      disabled={disabled || uploading}
      onClick={() => inputRef.current?.click()}
      className={buttonClass("secondary", "sm")}
    >
      {value || rejected ? "다시 선택" : "파일 선택"}
    </button>
  )

  return (
    <div>
      {rejected ? (
        <FileBox
          badge={fileBadge(rejected.name)}
          name={rejected.name}
          meta={formatFileSize(rejected.size)}
          action={pick}
          hasError
        />
      ) : value ? (
        <FileBox
          badge={fileBadge(value.name)}
          name={value.name}
          meta={`${formatFileSize(value.size)} · 업로드 완료`}
          action={pick}
        />
      ) : (
        <FileBox
          badge="FILE"
          name={emptyLabel}
          meta={uploading ? "업로드 중…" : "최대 10MB · jpg, png, pdf"}
          action={pick}
          empty
        />
      )}
      {rejected && (
        <p
          role="alert"
          className="mt-[5px] text-[11px] font-medium text-sz-danger-text"
        >
          {rejected.message}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        onChange={event => void handleSelect(event)}
      />
    </div>
  )
}
