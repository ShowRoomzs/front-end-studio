import type { MenuConfig } from "@/common/types/menu"

/**
 * 쇼룸 스튜디오 GNB — 9항목 확정(§14-1, 시안 `ui-studio-04-connections.html`).
 *
 * 파트너센터와 항목 수는 같고 내용이 다르다 — 스튜디오엔 상품 관리·문의 관리가
 * 없고 대신 게시물·쇼룸 관리가 있다. `path`가 없는 항목은 아직 화면이 없는
 * 자리이며, 해당 화면을 만들 때 경로를 채운다.
 */
export const CREATOR_MENU: MenuConfig = {
  groups: [
    { id: "home", label: "홈", path: "/" },
    { id: "connections", label: "연결·소통", path: "/connections" },
    { id: "contracts", label: "계약 관리" },
    { id: "groupbuy", label: "공구 관리" },
    { id: "posts", label: "게시물" },
    { id: "sales", label: "판매 현황" },
    { id: "settlement", label: "정산 관리" },
    { id: "showroom", label: "쇼룸 관리" },
    { id: "basic-info", label: "기본정보 관리" },
  ],
}
