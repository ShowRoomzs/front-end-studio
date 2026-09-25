import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import { CREATOR_CONTRACT_QUERY_KEYS } from "@/features/contracts/constants/queryKeys"
import { creatorContractService } from "@/features/contracts/services/creatorContractService"
import type {
  ContractDocumentType,
  CreatorContractDocument,
} from "@/features/contracts/types"
import { formatFileSize } from "@/features/contracts/utils/format"
import { useQuery } from "@tanstack/react-query"

interface DocumentsCardProps {
  contractId: number
  contractNumber: string
  concludedAt: string | null
  documents: Array<CreatorContractDocument>
}

/**
 * 시안 S6 「계약 문서」 — 서명 PDF · 감사추적인증서 카드 2장. 체결완료 화면에서 인플루언서가
 * 실제로 하는 유일한 행동이 이 두 파일을 받아 두는 것이라 본문 카드로 올린다(§27-6).
 * 운영자가 모두싸인에서 내려받아 업로드한 파일이며 등록 시각이 곧 체결 처리 시각이다.
 */
export default function DocumentsCard(props: DocumentsCardProps) {
  const { contractId, contractNumber, concludedAt, documents } = props

  return (
    <DetailCard
      title="계약 문서"
      note={`운영자가 체결 완료 처리 시 등록 · ${formatDateTimeShort(concludedAt)}`}
    >
      <div className="grid grid-cols-2 gap-3">
        <DocumentTile
          contractId={contractId}
          type="SIGNED_PDF"
          name="서명 완료 계약서"
          description={contractNumber}
          document={documents.find(doc => doc.documentType === "SIGNED_PDF")}
        />
        <DocumentTile
          contractId={contractId}
          type="AUDIT_TRAIL"
          name="감사추적인증서"
          description="서명 이력"
          document={documents.find(doc => doc.documentType === "AUDIT_TRAIL")}
        />
      </div>
      <Notice tone="neutral" className="mt-3">
        두 문서는 <b className="font-semibold">계약의 원본</b>입니다 — 이
        화면에서 언제든 다시 내려받을 수 있고, 계약 조건에 이견이 생기면 이
        파일이 판단 근거가 됩니다.{" "}
        <b className="font-semibold">감사추적인증서</b>에는 누가 언제 어떤
        환경에서 서명했는지가 기록되어 있습니다.
        {documents.length < 2 &&
          " 파일이 보이지 않으면 운영자가 아직 등록하기 전입니다."}
      </Notice>
    </DetailCard>
  )
}

function DocumentTile(props: {
  contractId: number
  type: ContractDocumentType
  name: string
  description: string
  document: CreatorContractDocument | undefined
}) {
  const { contractId, type, name, description, document } = props

  const { data: meta } = useQuery({
    queryKey: [
      CREATOR_CONTRACT_QUERY_KEYS.DETAIL,
      contractId,
      "document",
      type,
    ],
    queryFn: () => creatorContractService.getDocument(contractId, type),
    enabled: document !== undefined,
    retry: false,
    staleTime: 60_000,
  })

  return (
    <div className="flex items-center gap-[11px] rounded-[6px] border border-sz-n-200 px-[13px] py-3">
      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[6px] bg-sz-n-100 text-[9px] font-bold text-sz-n-600">
        PDF
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-sz-n-900">{name}</div>
        <div className="mt-[2px] truncate text-[11px] tabular-nums text-sz-n-500">
          {description}
          {meta ? ` · ${formatFileSize(meta.sizeBytes)}` : ""}
          {!document && " · 등록 전"}
        </div>
      </div>
      <Btn
        variant="secondary"
        disabled={!document}
        onClick={() =>
          document &&
          window.open(meta?.downloadUrl ?? document.downloadUrl, "_blank")
        }
      >
        다운로드
      </Btn>
    </div>
  )
}
