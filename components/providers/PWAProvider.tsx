"use client";

import { useEffect, useState } from "react";

export default function PWAProvider() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        reg = registration;
        setSwReg(registration);

        // 새 SW 대기 중인지 체크
        if (registration.waiting) {
          setUpdateAvailable(true);
        }

        // SW 업데이트 감지
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[SW] 등록 실패:", err);
      });

    // 페이지 새로고침 시 SW 컨트롤러 교체 감지
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    return () => {
      // cleanup: 컴포넌트 언마운트 시 아무것도 안함 (SW는 계속 실행)
    };
  }, []);

  const handleUpdate = () => {
    if (!swReg?.waiting) return;
    swReg.waiting.postMessage("SKIP_WAITING");
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-blue-700 text-white rounded-xl shadow-lg p-4 flex items-center gap-3">
        <span className="text-xl shrink-0">🔄</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">앱 업데이트 완료</p>
          <p className="text-xs text-blue-200">새 버전이 준비되었습니다</p>
        </div>
        <button
          onClick={handleUpdate}
          className="shrink-0 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          새로고침
        </button>
      </div>
    </div>
  );
}
