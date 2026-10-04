interface ComingSoonPageProps {
  description?: string
}

/**
 * 아직 기능이 없는 GNB 항목의 자리표시 화면(파트너센터 `ComingSoonPage`와 같은 판단).
 *
 * 다른 화면이 이 메뉴로 보내는 버튼(공구 관리의 [정산 관리 열기 ↗] 등)이 있어서
 * 경로 없이 비워 둘 수 없다 — 눌렀을 때 홈으로 튕기지 않고 "준비중"임을 알려준다.
 * 제목(H1)은 셸이 메뉴 라벨로 그린다.
 */
export default function ComingSoonPage(props: ComingSoonPageProps) {
  const { description } = props

  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center">
      <p className="text-[13px] font-medium text-sz-n-700">
        준비 중인 기능입니다.
      </p>
      {description && (
        <p className="mt-1.5 text-[12px] text-sz-n-500">{description}</p>
      )}
    </div>
  )
}
