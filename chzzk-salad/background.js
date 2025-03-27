// 크로스 브라우저 지원
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// 기본 설정으로 활성화 상태 설정
browserAPI.runtime.onInstalled.addListener(() => {
  console.log("[Chzzk P2P Blocker] 확장 프로그램 설치됨");

  browserAPI.storage.local.set({
    enabled: true,
    autoQualityEnabled: true,
    preferredQuality: "1080p",
    hideAdblockPopup: true,
  });

  updateIcon(true);

  // 웹 요청 가로채기 설정
  setupWebRequestInterception(true);
});

// 웹 요청 가로채기 설정
function setupWebRequestInterception(enabled) {
  if (enabled) {
    // API 요청 응답 가로채기
    browserAPI.webRequest.onBeforeRequest.addListener(
      monitorRequests,
      {
        urls: [
          "*://*.chzzk.naver.com/*/live-detail*",
          "*://*.chzzk.naver.com/*/live/detail*",
        ],
      },
      ["blocking"]
    );

    console.log("[Chzzk P2P Blocker] 웹 요청 가로채기 활성화됨");
  } else {
    // 가로채기 리스너 제거 시도
    try {
      browserAPI.webRequest.onBeforeRequest.removeListener(monitorRequests);
      console.log("[Chzzk P2P Blocker] 웹 요청 가로채기 비활성화됨");
    } catch (error) {
      console.error("[Chzzk P2P Blocker] 리스너 제거 오류:", error);
    }
  }
}

// API 요청 모니터링
function monitorRequests(details) {
  console.log("[Chzzk P2P Blocker] API 요청 감지:", details.url);
  // 여기서는 요청을 차단하지 않고 모니터링만 함
  return { cancel: false };
}

// 확장 프로그램 아이콘 클릭 시 활성화/비활성화 토글
// Firefox는 browserAction, Chrome은 action 객체를 사용
const actionAPI = browserAPI.browserAction || browserAPI.action;

actionAPI.onClicked.addListener(() => {
  browserAPI.storage.local.get("enabled", (result) => {
    const newEnabledState = !result.enabled;
    browserAPI.storage.local.set({ enabled: newEnabledState });

    // 웹 요청 가로채기 설정 업데이트
    setupWebRequestInterception(newEnabledState);

    // 모든 치지직 탭에 메시지 전송
    browserAPI.tabs.query({ url: "*://*.chzzk.naver.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        browserAPI.tabs.sendMessage(tab.id, {
          action: "toggleEnabled",
          enabled: newEnabledState,
        });
      });
    });

    updateIcon(newEnabledState);
  });
});

// 메시지 수신 핸들러 - 팝업에서 설정이 변경될 때
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleEnabled") {
    setupWebRequestInterception(message.enabled);
    updateIcon(message.enabled);
  } else if (message.action === "setQualityOptions") {
    console.log("[Chzzk P2P Blocker] 화질 설정 변경:", message);
    // 화질 설정 변경은 content script에서 처리하므로 추가 작업 필요 없음
  } else if (message.action === "toggleAdblockPopup") {
    console.log("[Chzzk P2P Blocker] 광고 차단 팝업 숨김 설정 변경:", message);
    // 광고 차단 팝업 설정 변경은 content script에서 처리
  }
});

// 아이콘 업데이트 함수
function updateIcon(enabled) {
  const iconPath = enabled
    ? {
        19: "icons/icon-19.png",
        38: "icons/icon-38.png",
      }
    : {
        19: "icons/icon-disabled-19.png",
        38: "icons/icon-disabled-38.png",
      };

  // Firefox와 Chrome 모두 지원
  if (browserAPI.browserAction) {
    browserAPI.browserAction.setIcon({ path: iconPath });

    const title = enabled
      ? "Chzzk P2P Blocker (활성화됨)"
      : "Chzzk P2P Blocker (비활성화됨)";
    browserAPI.browserAction.setTitle({ title });
  } else if (browserAPI.action) {
    browserAPI.action.setIcon({ path: iconPath });

    const title = enabled
      ? "Chzzk P2P Blocker (활성화됨)"
      : "Chzzk P2P Blocker (비활성화됨)";
    browserAPI.action.setTitle({ title });
  }
}
