import { initializeApp, type FirebaseApp } from "firebase/app"
import { getMessaging, getToken, isSupported } from "firebase/messaging"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

/** 백엔드 `DevicePlatform`과 같은 문자열 — 스튜디오는 브라우저 콘솔이라 항상 WEB이다 */
export const DEVICE_PLATFORM = "WEB"

let app: FirebaseApp | null = null

function getApp() {
  if (!app) {
    app = initializeApp(firebaseConfig)
  }
  return app
}

/**
 * 서비스 워커를 등록한다.
 *
 * 설정값을 쿼리스트링으로 넘기는 이유 — `public/`의 파일은 Vite가 건드리지 않고 그대로
 * 배포돼서 `import.meta.env`를 읽을 수 없다. 워커 안에 값을 박아 두면 개발·운영이 다른
 * 프로젝트를 쓰게 될 때 파일이 갈라진다.
 */
function registerServiceWorker() {
  const params = new URLSearchParams(
    Object.entries(firebaseConfig).filter(([, value]) =>
      Boolean(value)
    ) as Array<[string, string]>
  )
  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`
  )
}

/**
 * FCM 등록 토큰을 받아 온다. **실패는 전부 `null`로 흘린다.**
 *
 * 이 값은 로그인 요청에 곁들여 보내는 부가 정보일 뿐이라, 여기서 던지면 알림을 못 받는 것을
 * 넘어 **로그인 자체가 막힌다.** 권한 거부·미지원 브라우저·시크릿 창·VAPID 키 미설정 어느
 * 쪽이든 결과는 같다 — 알림만 없고 로그인은 된다.
 *
 * 권한 요청 시점을 로그인 직전으로 둔 이유는, 화면을 열자마자 브라우저 권한 팝업이 뜨면
 * 무슨 알림인지 모르는 상태에서 거부당하고 그 뒤로는 다시 물을 수 없기 때문이다.
 */
export async function requestFcmToken(): Promise<string | null> {
  try {
    if (!firebaseConfig.apiKey || !vapidKey) {
      // 설정이 아직 안 들어왔다 — 조용히 넘어간다
      return null
    }
    if (!(await isSupported())) {
      return null
    }
    if (Notification.permission === "denied") {
      // 한 번 거부한 브라우저는 다시 물어도 팝업이 뜨지 않는다
      return null
    }
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        return null
      }
    }

    const serviceWorkerRegistration = await registerServiceWorker()
    return await getToken(getMessaging(getApp()), {
      vapidKey,
      serviceWorkerRegistration,
    })
  } catch (error) {
    console.warn("FCM 토큰 발급을 건너뜁니다", error)
    return null
  }
}
