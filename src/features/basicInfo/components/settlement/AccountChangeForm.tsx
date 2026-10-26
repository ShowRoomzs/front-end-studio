import { useState } from "react"

import { useGetBanks } from "@/common/hooks/useGetBanks"
import DocumentUpload from "@/features/basicInfo/components/DocumentUpload"
import {
  Field,
  InfoCard,
  ReadonlyInput,
} from "@/features/basicInfo/components/parts"
import {
  buttonClass,
  inputClass,
  SELECT_CHEVRON_STYLE,
} from "@/features/basicInfo/components/styles"
import {
  ACCOUNT_NUMBER_MAX_LENGTH,
  ACCOUNT_NUMBER_MIN_LENGTH,
} from "@/features/basicInfo/constants/params"
import type { AccountInfo, UploadedDocument } from "@/features/basicInfo/types"
import { digitsOnly } from "@/features/basicInfo/utils/format"

export interface AccountChangeDraft {
  bankCode: string
  bankName: string
  accountNumber: string
  bankbook: UploadedDocument
}

/**
 * 「정산 계좌 변경」 입력 카드(T2 · T3) — 온보딩과 같은 4필드(은행 · 계좌번호 · 예금주 · 통장 사본).
 *
 * - 계좌번호는 숫자만 들어간다(하이픈 · 문자는 타이핑돼도 버린다) → 형식 오류 문구가 없다.
 * - 미입력 · 자리수 미달은 문구 없이 [변경 요청] 비활성만.
 * - 예금주는 본인 인증값 고정 — 명의가 다르면 입력으로 고칠 문제가 아니다.
 * - 에러 문구는 파일 형식 · 용량 하나(T3) — 파일 상자 바로 밑.
 * [변경 요청]은 바로 보내지 않고 확인 모달(T6)을 연다.
 */
export default function AccountChangeForm(props: {
  account: AccountInfo
  onCancel: () => void
  onSubmit: (draft: AccountChangeDraft) => void
}) {
  const { account, onCancel, onSubmit } = props
  const { data: banks, isLoading: isBanksLoading } = useGetBanks()

  const [selectedBankCode, setSelectedBankCode] = useState<string | null>(null)
  const [accountNumber, setAccountNumber] = useState("")
  const [bankbook, setBankbook] = useState<UploadedDocument | null>(null)

  // 처음에는 지금 은행을 골라 둔다(시안 T2) — 목록이 늦게 와도 따라 채워지도록 파생값으로 둔다
  const bankCode =
    selectedBankCode ??
    banks?.find(bank => bank.name === account.bankName)?.code ??
    ""
  const bankName = banks?.find(bank => bank.code === bankCode)?.name ?? ""

  const canSubmit =
    !!bankCode &&
    accountNumber.length >= ACCOUNT_NUMBER_MIN_LENGTH &&
    accountNumber.length <= ACCOUNT_NUMBER_MAX_LENGTH &&
    !!bankbook

  return (
    <InfoCard title="정산 계좌 변경">
      <Field label="은행" required htmlFor="basic-info-bank">
        <select
          id="basic-info-bank"
          value={bankCode}
          disabled={isBanksLoading}
          onChange={event => setSelectedBankCode(event.target.value)}
          style={SELECT_CHEVRON_STYLE}
          className={inputClass(false, "cursor-pointer appearance-none pr-8")}
        >
          <option value="" disabled>
            {isBanksLoading ? "은행 목록 불러오는 중…" : "은행 선택"}
          </option>
          {banks?.map(bank => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="계좌번호"
        required
        htmlFor="basic-info-account-number"
        hint={
          <>
            <b>숫자만 입력</b>됩니다 — 하이픈(-)과 문자는 입력되지 않습니다 ·{" "}
            <b>10~16자리</b> · 현재 등록: {account.accountNumber}
          </>
        }
      >
        <input
          id="basic-info-account-number"
          // type="number"는 앞자리 0이 사라진다
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={ACCOUNT_NUMBER_MAX_LENGTH}
          value={accountNumber}
          onChange={event =>
            setAccountNumber(
              digitsOnly(event.target.value, ACCOUNT_NUMBER_MAX_LENGTH)
            )
          }
          className={inputClass(false, "tabular-nums tracking-[0.2px]")}
        />
      </Field>

      <Field
        label="예금주"
        required
        hint={
          <>
            <b>본인 명의 계좌만</b> 등록할 수 있습니다.
          </>
        }
      >
        <ReadonlyInput value={account.holderName} lock="🔒 본인 인증값" />
      </Field>

      <Field label="통장 사본" required>
        <DocumentUpload
          emptyLabel="통장 사본을 올려주세요"
          value={bankbook}
          onChange={setBankbook}
        />
      </Field>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={buttonClass("ghost")}
        >
          취소
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            bankbook &&
            onSubmit({ bankCode, bankName, accountNumber, bankbook })
          }
          className={buttonClass("primary")}
        >
          변경 요청
        </button>
      </div>
    </InfoCard>
  )
}
