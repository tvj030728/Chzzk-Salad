// DOM 요소 가져오기
const toggleSwitch = document.getElementById("toggle");
const statusText = document.getElementById("status");
const qualityToggle = document.getElementById("quality-toggle");
const qualityStatus = document.getElementById("quality-status");
const qualitySelect = document.getElementById("quality-select");
const adblockPopupToggle = document.getElementById("adblock-popup-toggle");
const adblockPopupStatus = document.getElementById("adblock-popup-status");
const currentVersionElement = document.getElementById("current-version");
const updateStatusElement = document.getElementById("update-status");

// 크로스 브라우저 지원
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// 현재 버전과 GitHub 저장소 정보
const CURRENT_VERSION = "1.0";
const GITHUB_REPO = "https://github.com/tvj030728/Chzzk-Salad";
const VERSION_CHECK_URL =
  "https://raw.githubusercontent.com/tvj030728/Chzzk-Salad/refs/heads/main/version.json";

// 현재 버전 표시
currentVersionElement.textContent = CURRENT_VERSION;

// 버전 정보 확인 및 업데이트 확인
async function checkForUpdates() {
  try {
    const response = await fetch(VERSION_CHECK_URL);
    if (!response.ok) {
      throw new Error("버전 정보를 가져오는데 실패했습니다.");
    }

    const data = await response.json();
    const latestVersion = data.version;

    // 버전 비교
    if (latestVersion && latestVersion !== CURRENT_VERSION) {
      updateStatusElement.innerHTML = `<span class="update-available">업데이트 가능 (v${latestVersion})</span>`;
      updateStatusElement.title = "GitHub에서 최신 버전을 다운로드하세요.";
      updateStatusElement.style.cursor = "pointer";

      // 클릭 시 GitHub 저장소로 이동
      updateStatusElement.addEventListener("click", () => {
        browserAPI.tabs.create({ url: GITHUB_REPO });
      });
    }
  } catch (error) {
    console.error("버전 확인 중 오류 발생:", error);
  }
}

// 버전 확인 실행
checkForUpdates();

// 현재 상태 불러오기
browserAPI.storage.local.get(
  ["enabled", "autoQualityEnabled", "preferredQuality", "hideAdblockPopup"],
  (result) => {
    // P2P 차단 토글 상태 설정
    toggleSwitch.checked = result.enabled !== undefined ? result.enabled : true;
    updateStatusText(toggleSwitch.checked);

    // 화질 설정 토글 상태 설정
    qualityToggle.checked =
      result.autoQualityEnabled !== undefined
        ? result.autoQualityEnabled
        : true;
    updateQualityStatusText(qualityToggle.checked);

    // 선호 화질 설정
    if (result.preferredQuality) {
      qualitySelect.value = result.preferredQuality;
    }

    // 광고 차단 팝업 숨김 토글 상태 설정
    adblockPopupToggle.checked =
      result.hideAdblockPopup !== undefined ? result.hideAdblockPopup : true;
    updateAdblockPopupStatusText(adblockPopupToggle.checked);

    // 화질 선택 요소 상태 업데이트
    updateQualitySelectState(qualityToggle.checked);
  }
);

// 토글 스위치 이벤트 리스너 (P2P 차단 기능)
toggleSwitch.addEventListener("change", () => {
  const isEnabled = toggleSwitch.checked;

  // 상태 업데이트
  browserAPI.storage.local.set({ enabled: isEnabled });
  updateStatusText(isEnabled);

  // 백그라운드에 메시지 전송
  browserAPI.runtime.sendMessage({
    action: "toggleEnabled",
    enabled: isEnabled,
  });

  // 현재 활성 탭이 치지직 사이트인 경우 메시지 전송
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].url && tabs[0].url.includes("chzzk.naver.com")) {
      browserAPI.tabs.sendMessage(tabs[0].id, {
        action: "toggleEnabled",
        enabled: isEnabled,
      });
    }
  });
});

// 화질 선택 토글 이벤트 리스너
qualityToggle.addEventListener("change", () => {
  const isEnabled = qualityToggle.checked;

  // 상태 업데이트
  browserAPI.storage.local.set({ autoQualityEnabled: isEnabled });
  updateQualityStatusText(isEnabled);
  updateQualitySelectState(isEnabled);

  // 현재 선택된 화질 가져오기
  const selectedQuality = qualitySelect.value;

  // 현재 활성 탭이 치지직 사이트인 경우 메시지 전송
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].url && tabs[0].url.includes("chzzk.naver.com")) {
      browserAPI.tabs.sendMessage(tabs[0].id, {
        action: "setQualityOptions",
        enabled: isEnabled,
        quality: selectedQuality,
      });
    }
  });
});

// 화질 선택 변경 이벤트 리스너
qualitySelect.addEventListener("change", () => {
  const selectedQuality = qualitySelect.value;

  // 설정 저장
  browserAPI.storage.local.set({ preferredQuality: selectedQuality });

  // 현재 활성 탭이 치지직 사이트인 경우 메시지 전송
  if (qualityToggle.checked) {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].url && tabs[0].url.includes("chzzk.naver.com")) {
        browserAPI.tabs.sendMessage(tabs[0].id, {
          action: "setQualityOptions",
          enabled: true,
          quality: selectedQuality,
        });
      }
    });
  }
});

// 광고 차단 팝업 숨김 토글 이벤트 리스너
adblockPopupToggle.addEventListener("change", () => {
  const isEnabled = adblockPopupToggle.checked;

  // 상태 업데이트
  browserAPI.storage.local.set({ hideAdblockPopup: isEnabled });
  updateAdblockPopupStatusText(isEnabled);

  // 현재 활성 탭이 치지직 사이트인 경우 메시지 전송
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].url && tabs[0].url.includes("chzzk.naver.com")) {
      browserAPI.tabs.sendMessage(tabs[0].id, {
        action: "toggleAdblockPopup",
        enabled: isEnabled,
      });
    }
  });
});

// 상태 텍스트 업데이트 함수 (P2P 차단 기능)
function updateStatusText(isEnabled) {
  statusText.textContent = isEnabled ? "활성화됨" : "비활성화됨";
  statusText.style.color = isEnabled ? "#2196F3" : "#888";
}

// 화질 상태 텍스트 업데이트 함수
function updateQualityStatusText(isEnabled) {
  qualityStatus.textContent = isEnabled ? "활성화됨" : "비활성화됨";
  qualityStatus.style.color = isEnabled ? "#2196F3" : "#888";
}

// 화질 선택 상태 업데이트 함수
function updateQualitySelectState(isEnabled) {
  if (isEnabled) {
    qualitySelect.classList.remove("disabled");
  } else {
    qualitySelect.classList.add("disabled");
  }
}

// 광고 차단 팝업 상태 텍스트 업데이트 함수
function updateAdblockPopupStatusText(isEnabled) {
  adblockPopupStatus.textContent = isEnabled ? "활성화됨" : "비활성화됨";
  adblockPopupStatus.style.color = isEnabled ? "#2196F3" : "#888";
}
