import { useState } from "react"

import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import DocumentUpload from "@/features/basicInfo/components/DocumentUpload"
import { CheckList, Field } from "@/features/basicInfo/components/parts"
import { buttonClass, inputClass } from "@/features/basicInfo/components/styles"
import {
  BUSINESS_REGISTRATION_NUMBER_PATTERN,
  BUSINESS_TYPE_REVIEW_TEXT,
} from "@/features/basicInfo/constants/params"
import type {
  BusinessTypeChangeRequest,
  CreatorBusinessType,
  UploadedDocument,
} from "@/features/basicInfo/types"
import {
  digitsOnly,
  formatBusinessRegistrationNumber,
} from "@/features/basicInfo/utils/format"

interface BusinessTypeChangeModalProps {
  /** 바꿀 구분 — BUSINESS(T7) · INDIVIDUAL(T8). null이면 닫힘 */
  target: CreatorBusinessType | null
  onClose: () => void
  onSubmit: (body: BusinessTypeChangeRequest) => void
  isSubmitting: boolean
}

/**
 * T7 개인사업자로 · T8 비사업자로 변경 요청 — 같은 규격, 받는 값만 다르다.
 * T7: 사업자등록번호(하이픈 포함) · 사업자등록증 / T8: 주민등록번호 · 폐업사실증명원.
 * 미입력은 문구 없이 [변경 요청] 비활성만. 상호 · 대표자 · 업태는 등록증으로 확인해 받지 않는다.
 * 폼은 열 때마다 새로 그린다(닫았다 열면 빈 값).
 */
export default function BusinessTypeChangeModal(
  props: BusinessTypeChangeModalProps
) {
  if (!props.target) return null

  return props.target === "BUSINESS" ? (
    <ToBusinessForm {...props} />
  ) : (
    <ToIndividualForm {...props} />
  )
}

function Footer(props: {
  onClose: () => void
  canSubmit: boolean
  isSubmitting: boolean
  onSubmit: () => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={props.onClose}
        className={buttonClass("ghost")}
      >
        취소
      </button>
      <button
        type="button"
        disabled={!props.canSubmit || props.isSubmitting}
        onClick={props.onSubmit}
        className={buttonClass("primary")}
      >
        변경 요청
      </button>
    </>
  )
}

const BODY_CLASS = "max-h-[70vh] overflow-y-auto p-5"

function ToBusinessForm(props: BusinessTypeChangeModalProps) {
  const { onClose, onSubmit, isSubmitting } = props
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [license, setLicense] = useState<UploadedDocument | null>(null)

  const canSubmit =
    BUSINESS_REGISTRATION_NUMBER_PATTERN.test(registrationNumber) && !!license

  const submit = () => {
    if (!license) return
    onSubmit({
      targetType: "BUSINESS",
      businessRegistrationNumber: registrationNumber,
      evidenceFileUrl: license.url,
      evidenceFileName: license.name,
      evidenceFileSize: license.size,
    })
  }

  return (
    <ModalShell
      isOpen
      title="개인사업자로 변경할까요?"
      width={440}
      onClose={onClose}
      bodyClassName={BODY_CLASS}
      footer={
        <Footer
          onClose={onClose}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={submit}
        />
      }
    >
      <Field
        label="사업자등록번호"
        required
        htmlFor="basic-info-brn"
        hint="하이픈(-)을 포함해 입력합니다."
      >
        <input
          id="basic-info-brn"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000-00-00000"
          value={registrationNumber}
          onChange={event =>
            setRegistrationNumber(
              formatBusinessRegistrationNumber(event.target.value)
            )
          }
          className={inputClass(false, "tabular-nums")}
        />
      </Field>
      <Field label="사업자등록증" required>
        <DocumentUpload
          emptyLabel="사업자등록증 사본을 올려주세요"
          value={license}
          onChange={setLicense}
        />
      </Field>
      <CheckList>
        <li>
          바로 반영되지 않습니다 —{" "}
          <b>운영자 확인({BUSINESS_TYPE_REVIEW_TEXT})</b> 후 적용됩니다
        </li>
        <li>
          <b>확인 중에는 비사업자(3.3% 원천징수)로 정산이 계속</b>됩니다
        </li>
        <li>
          승인되면 <b>다음 정산부터</b> 원천징수 없이 <b>리워드 + 부가세 10%</b>
          를 지급받고, <b>SHOWROOMZ 앞으로 세금계산서를 발행</b>합니다
        </li>
        <li>
          예금주가 <b>대표자명 또는 상호</b> 명의여야 해{" "}
          <b>계좌를 바꿔야 할 수 있습니다</b>
        </li>
      </CheckList>
      <p className="mt-3.5 text-[12px] leading-[1.7] text-sz-n-600 [&_b]:font-semibold [&_b]:text-sz-n-900">
        상호 · 대표자 · 업태는 <b>등록증으로 확인</b>하므로 따로 입력하지
        않습니다.
      </p>
    </ModalShell>
  )
}

function ToIndividualForm(props: BusinessTypeChangeModalProps) {
  const { onClose, onSubmit, isSubmitting } = props
  const [front, setFront] = useState("")
  const [back, setBack] = useState("")
  const [closure, setClosure] = useState<UploadedDocument | null>(null)

  const canSubmit = front.length === 6 && back.length === 7 && !!closure

  const submit = () => {
    if (!closure) return
    onSubmit({
      targetType: "INDIVIDUAL",
      residentRegistrationNumber: `${front}-${back}`,
      evidenceFileUrl: closure.url,
      evidenceFileName: closure.name,
      evidenceFileSize: closure.size,
    })
  }

  return (
    <ModalShell
      isOpen
      title="비사업자로 변경할까요?"
      width={440}
      onClose={onClose}
      bodyClassName={BODY_CLASS}
      footer={
        <Footer
          onClose={onClose}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={submit}
        />
      }
    >
      <Field
        label="주민등록번호"
        required
        htmlFor="basic-info-rrn-front"
        hint="원천징수 신고(지급명세서 제출)를 위해 소득세법에 따라 수집하며 암호화해 보관합니다."
      >
        <div className="flex items-center gap-2">
          <input
            id="basic-info-rrn-front"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="앞 6자리"
            maxLength={6}
            value={front}
            onChange={event => setFront(digitsOnly(event.target.value, 6))}
            className={inputClass(false, "flex-1 tabular-nums")}
          />
          <span className="text-sz-n-400">–</span>
          {/* 뒤 7자리는 화면에 남기지 않는다(성별 자리 포함 전부 마스킹 — 시안 rule 10.14 ②) */}
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            aria-label="주민등록번호 뒤 7자리"
            placeholder="뒤 7자리"
            maxLength={7}
            value={back}
            onChange={event => setBack(digitsOnly(event.target.value, 7))}
            className={inputClass(false, "flex-1 tabular-nums")}
          />
        </div>
      </Field>
      <Field label="폐업사실증명원" required>
        <DocumentUpload
          emptyLabel="홈택스에서 발급한 폐업사실증명원을 올려주세요"
          value={closure}
          onChange={setClosure}
        />
      </Field>
      <CheckList>
        <li>
          바로 반영되지 않습니다 —{" "}
          <b>운영자 확인({BUSINESS_TYPE_REVIEW_TEXT})</b> 후 적용됩니다
        </li>
        <li>
          <b>확인 중에는 개인사업자로 정산이 계속</b>됩니다 — 그 사이 확정된
          정산은 <b>세금계산서를 발행</b>해야 지급됩니다
        </li>
        <li>
          승인되면 <b>다음 정산부터</b> SHOWROOMZ가 <b>3.3%를 원천징수</b>한 뒤
          입금합니다
        </li>
        {/*
          시안 4번째 줄 「지금 계좌(상호)는 상호 명의라 … 실명 계좌로 변경해야 지급됩니다」는 뺐다 —
          서버는 상호 명의 계좌를 받지 않아(50 설계서 1-4) 지금 계좌의 예금주가 늘 본인 실명이다.
        */}
      </CheckList>
    </ModalShell>
  )
}
