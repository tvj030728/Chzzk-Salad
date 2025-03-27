// DOM 요소 가져오기
const enabledCheckbox = document.getElementById("enabled");
const saveButton = document.getElementById("save");

// 크로스 브라우저 지원
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// 현재 설정 불러오기
function loadOptions() {
  browserAPI.storage.local.get("enabled", (result) => {
    enabledCheckbox.checked =
      result.enabled !== undefined ? result.enabled : true;
  });
}

// 설정 저장
function saveOptions() {
  browserAPI.storage.local
    .set({
      enabled: enabledCheckbox.checked,
    })
    .then(() => {
      // 저장 버튼 상태 변경으로 저장 완료 표시
      saveButton.textContent = "저장됨!";
      saveButton.style.backgroundColor = "#4caf50";

      // 백그라운드 스크립트에 메시지 전송
      browserAPI.runtime.sendMessage({
        action: "toggleEnabled",
        enabled: enabledCheckbox.checked,
      });

      // 모든 치지직 탭에 메시지 전송
      browserAPI.tabs.query({ url: "*://*.chzzk.naver.com/*" }, (tabs) => {
        tabs.forEach((tab) => {
          browserAPI.tabs.sendMessage(tab.id, {
            action: "toggleEnabled",
            enabled: enabledCheckbox.checked,
          });
        });
      });

      // 1초 후 버튼 상태 원래대로 복구
      setTimeout(() => {
        saveButton.textContent = "저장";
        saveButton.style.backgroundColor = "#2196F3";
      }, 1000);
    });
}

// 이벤트 리스너 설정
document.addEventListener("DOMContentLoaded", loadOptions);
saveButton.addEventListener("click", saveOptions);
