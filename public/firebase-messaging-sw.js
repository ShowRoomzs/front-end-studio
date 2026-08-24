/*
  FCM 웹 푸시 서비스 워커.
  
  웹 푸시는 브라우저가 앱을 닫은 뒤에도 알림을 받아야 해서, 페이지 번들이 아니라 별도
  워커 파일이 필요하다. 이 파일은 Vite가 처리하지 않고 그대로 배포되므로 import.meta.env를
  쓸 수 없다 — 설정값은 등록할 때 쿼리스트링으로 넘겨받는다(src/common/lib/firebase.ts).
  하드코딩하지 않는 이유는 개발·운영이 다른 프로젝트를 쓰게 될 때 파일이 갈라지기 때문이다.
  
  여기 실리는 값은 전부 공개값이다. 서비스 계정 키는 서버 쪽에만 있고 여기 오지 않는다.
*/
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
)
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
)

const params = new URL(self.location.href).searchParams
const config = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
}

// 설정이 비어 있으면 조용히 아무것도 하지 않는다 — 워커가 죽으면 앱 자체가 영향을 받는다
if (config.apiKey && config.messagingSenderId) {
  firebase.initializeApp(config)
  const messaging = firebase.messaging()

  /*
    백그라운드 수신 — 탭이 없거나 다른 탭을 보고 있을 때.
    
    서버는 data 페이로드로만 보낸다(PostPushMessageFactory). notification 필드를 함께 보내면
    브라우저가 알림을 한 번 자동으로 띄우고 이 핸들러가 또 띄워 같은 알림이 두 개 뜬다.
  */
  messaging.onBackgroundMessage(payload => {
    const data = payload.data || {}
    self.registration.showNotification(data.title || "SHOWROOMZ", {
      body: data.body || "",
      icon: "/favicon.ico",
      // 같은 게시물의 알림이 여러 번 오면 마지막 것만 남긴다
      tag: data.postId ? `post-${data.postId}` : undefined,
      data,
    })
  })
}

/*
  알림 클릭 — 이미 열린 스튜디오 탭이 있으면 그 탭을 쓰고, 없으면 새로 연다.
  
  노출 중지·이의 신청 결과 통지는 "그래서 지금 무엇을 할 수 있는가"로 데려가는 것이 전부다.
  매번 새 탭을 열면 작성 중이던 게시물이 있는 탭을 두고 빈 탭이 하나 더 생긴다.
*/
self.addEventListener("notificationclick", event => {
  event.notification.close()

  const postId = event.notification.data && event.notification.data.postId
  const target = postId ? `/posts/${postId}` : "/posts"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(target)
            return client.focus()
          }
        }
        return self.clients.openWindow(target)
      })
  )
})
