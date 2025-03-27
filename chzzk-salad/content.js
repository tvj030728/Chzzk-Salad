// 확장 프로그램 활성화 상태 확인
let isEnabled = true;
const DEBUG = true; // 디버깅 로그 활성화

// 크로스 브라우저 지원
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// 화질 선택 설정 (기본값: 1080p)
let autoQualityEnabled = true;
let preferredQuality = "1080p";
let firstRun = true;

// 광고 차단 알림 팝업 숨김 설정
let hideAdblockPopup = true;

// 디버깅 로그 함수
function debugLog(message) {
  if (DEBUG) {
    console.log(`[Chzzk P2P Blocker] ${message}`);
  }
}

// 디버깅 오류 로그 함수
function debugError(message, error) {
  if (DEBUG) {
    console.error(`[Chzzk P2P Blocker] ${message}`, error);
  }
}

debugLog("확장 프로그램 초기화 중...");

// 스토리지에서 설정 불러오기
try {
  browserAPI.storage.local.get(
    ["enabled", "autoQualityEnabled", "preferredQuality", "hideAdblockPopup"],
    function (result) {
      debugLog("스토리지 결과: " + JSON.stringify(result));

      if (result.enabled !== undefined) {
        isEnabled = result.enabled;
      }

      if (result.autoQualityEnabled !== undefined) {
        autoQualityEnabled = result.autoQualityEnabled;
      }

      if (result.preferredQuality !== undefined) {
        preferredQuality = result.preferredQuality;
      }

      if (result.hideAdblockPopup !== undefined) {
        hideAdblockPopup = result.hideAdblockPopup;
      }

      debugLog("확장 프로그램 활성화 상태: " + isEnabled);
      debugLog("자동 화질 선택 활성화 상태: " + autoQualityEnabled);
      debugLog("선호 화질: " + preferredQuality);
      debugLog("광고 차단 팝업 숨김 상태: " + hideAdblockPopup);

      // 확장 프로그램이 활성화된 경우에만 XHook 적용
      if (isEnabled) {
        injectXHook();
      }

      // 자동 화질 선택이 활성화된 경우에만 화질 선택 기능 적용
      if (autoQualityEnabled && location.href.includes("/live/")) {
        injectQualitySelector();
      }

      // 광고 차단 팝업 숨김 기능 활성화
      if (hideAdblockPopup) {
        injectAdblockPopupHider();
      }

      // URL 변경 감시
      const currentUrl = location.href;
      if (autoQualityEnabled && currentUrl.includes("/live/")) {
        // 현재 URL이 라이브 페이지인 경우 URL 변경 감시 시작
        observeUrlChange();
      }
    }
  );
} catch (error) {
  debugError("스토리지 로드 오류:", error);
  // 오류 발생해도 기본값으로 진행
  injectXHook();

  if (autoQualityEnabled && location.href.includes("/live/")) {
    injectQualitySelector();
  }

  if (hideAdblockPopup) {
    injectAdblockPopupHider();
  }
}

// XHook 라이브러리와 커스텀 코드 삽입
function injectXHook() {
  debugLog("XHook 라이브러리 로드 시도...");

  // 이미 로드된 경우 중복 실행 방지
  if (window.__chzzkP2PBlockerInjected) {
    debugLog("XHook이 이미 로드되어 있습니다.");
    return;
  }

  // 로드 상태 표시
  window.__chzzkP2PBlockerInjected = true;

  // 다른 CDN 소스들 (순서대로 시도)
  const xhookSources = [
    "https://unpkg.com/xhook@latest/dist/xhook.min.js",
    "https://cdn.jsdelivr.net/npm/xhook@latest/dist/xhook.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/xhook/1.4.9/xhook.min.js",
  ];

  // 순차적으로 로드 시도
  loadXHookFromSources(xhookSources, 0);
}

// 여러 소스에서 순차적으로 XHook 로드 시도
function loadXHookFromSources(sources, index) {
  if (index >= sources.length) {
    debugError("모든 XHook 로드 시도 실패!");
    return;
  }

  const source = sources[index];
  debugLog(`XHook 로드 시도 (${index + 1}/${sources.length}): ${source}`);

  const xhookScript = document.createElement("script");
  xhookScript.src = source;

  xhookScript.onload = function () {
    debugLog(`XHook 라이브러리 로드 성공! (${source})`);
    injectCustomCode();
  };

  xhookScript.onerror = function () {
    debugError(`XHook 라이브러리 로드 실패: ${source}`);
    loadXHookFromSources(sources, index + 1);
  };

  document.head.appendChild(xhookScript);
}

// XHook 커스텀 코드 삽입
function injectCustomCode() {
  debugLog("커스텀 코드 삽입 중...");

  const customScript = document.createElement("script");
  customScript.textContent = `
    try {
      console.log("[Chzzk P2P Blocker] XHook 핸들러 등록 중...");
      
      // 확인을 위한 변수 설정
      window.__chzzkP2PBlockerActive = true;
      
      xhook.after(function(request, response) {
        // API 패턴 정의 (여러 가능한 패턴)
        const p2pPatterns = [
          "live-detail", 
          "live/detail", 
          "service/v1/live", 
          "service/v2/channels", 
          "live-stations"
        ];
        
        // 패턴 확인
        const hasP2PPattern = p2pPatterns.some(pattern => request.url.indexOf(pattern) !== -1);
        
        if (hasP2PPattern) {
          console.log("[Chzzk P2P Blocker] 대상 API 응답 가로챔:", request.url);
          
          try {
            // 응답이 있는지 확인
            if (!response || !response.text) {
              console.log("[Chzzk P2P Blocker] 응답 없음");
              return;
            }
            
            let data = JSON.parse(response.text);
            let modified = false;
            
            // P2P 품질 설정이 있는지 확인 - 구조 1
            if (data.content && data.content.p2pQuality) {
              console.log("[Chzzk P2P Blocker] P2P 품질 설정 발견 (구조 1), 제거 중...");
              
              // 원본 데이터 저장 (디버깅용)
              window.__originalP2PQuality = JSON.parse(JSON.stringify(data.content.p2pQuality));
              
              // P2P 품질 설정 비우기
              data.content.p2pQuality = [];
              
              // 재정의 불가능하게 설정
              Object.defineProperty(data.content, "p2pQuality", {
                configurable: false,
                writable: false,
                value: []
              });
              
              modified = true;
            }
            
            // P2P 품질 설정이 있는지 확인 - 구조 2
            if (data.p2pQuality) {
              console.log("[Chzzk P2P Blocker] P2P 품질 설정 발견 (구조 2), 제거 중...");
              
              // P2P 품질 설정 비우기
              data.p2pQuality = [];
              
              // 재정의 불가능하게 설정
              Object.defineProperty(data, "p2pQuality", {
                configurable: false,
                writable: false,
                value: []
              });
              
              modified = true;
            }
            
            // P2P 관련 다른 속성 검사 및 비활성화
            const p2pProps = ['p2pEnabled', 'forceP2pDisabled', 'isPeerDisabled'];
            
            // 최상위 객체 확인
            p2pProps.forEach(prop => {
              if (data[prop] !== undefined) {
                console.log(\`[Chzzk P2P Blocker] P2P 속성 발견: \${prop}, 비활성화 중...\`);
                data[prop] = prop.includes('Disabled') ? true : false;
                modified = true;
              }
            });
            
            // content 객체 확인
            if (data.content) {
              p2pProps.forEach(prop => {
                if (data.content[prop] !== undefined) {
                  console.log(\`[Chzzk P2P Blocker] content 내 P2P 속성 발견: \${prop}, 비활성화 중...\`);
                  data.content[prop] = prop.includes('Disabled') ? true : false;
                  modified = true;
                }
              });
            }
            
            if (modified) {
              console.log("[Chzzk P2P Blocker] P2P 설정 제거 완료!");
              // 수정된 응답으로 대체
              response.text = JSON.stringify(data);
            } else {
              console.log("[Chzzk P2P Blocker] 이 응답에서 P2P 설정을 찾을 수 없음");
            }
          } catch(error) {
            console.error("[Chzzk P2P Blocker] 응답 처리 중 오류 발생:", error);
          }
        }
      });
      
      console.log("[Chzzk P2P Blocker] 적용 완료! 상태 확인: 활성화됨");
    } catch(error) {
      console.error("[Chzzk P2P Blocker] 초기화 중 오류 발생:", error);
    }
  `;

  document.head.appendChild(customScript);
  debugLog("커스텀 코드 삽입 완료!");

  // 실행 확인을 위한 검증 스크립트
  setTimeout(() => {
    const verificationScript = document.createElement("script");
    verificationScript.textContent = `
      if (window.__chzzkP2PBlockerActive) {
        console.log("[Chzzk P2P Blocker] 상태 확인: 정상 작동 중");
      } else {
        console.error("[Chzzk P2P Blocker] 상태 확인: 스크립트가 실행되지 않음!");
      }
    `;
    document.head.appendChild(verificationScript);
  }, 1000);
}

// 확장 프로그램 상태 변경 메시지 수신
browserAPI.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleEnabled") {
    debugLog("상태 변경 메시지 수신: " + message.enabled);
    isEnabled = message.enabled;

    // 확장 프로그램 상태 변경 시 페이지 새로고침
    if (isEnabled) {
      debugLog("확장 프로그램 활성화됨, 페이지 새로고침...");
      location.reload();
    } else {
      debugLog("확장 프로그램 비활성화됨");
    }
  } else if (message.action === "setQualityOptions") {
    debugLog(
      `화질 설정 변경: 활성화=${message.enabled}, 화질=${message.quality}`
    );
    autoQualityEnabled = message.enabled;
    preferredQuality = message.quality;

    // 현재 치지직 페이지인 경우 화질 설정 적용
    if (location.href.includes("/live/") && autoQualityEnabled) {
      injectQualitySelector();
    }
  } else if (message.action === "toggleAdblockPopup") {
    debugLog("광고 차단 팝업 숨김 설정 변경: " + message.enabled);
    hideAdblockPopup = message.enabled;

    if (hideAdblockPopup) {
      injectAdblockPopupHider();
    } else {
      // 스타일 제거
      const styleElement = document.getElementById("chzzk-adblock-popup-hider");
      if (styleElement) {
        styleElement.remove();
      }
    }
  }
});

// 화질 선택 기능 스크립트 삽입
function injectQualitySelector() {
  debugLog("화질 선택 기능 스크립트 삽입 중...");

  const qualityScript = document.createElement("script");
  qualityScript.textContent = `
    (function () {
      'use strict';
      
      let firstRun = ${firstRun};
      let preferredQuality = "${preferredQuality}";
      
      console.log("[Chzzk Extension] 화질 선택 기능 초기화 중... 선호 화질: " + preferredQuality);
  
      function triggerClick(element) {
        if (element) {
          element.click();
      
          let event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          element.dispatchEvent(event);
      
          let enterEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter'
          });
          element.dispatchEvent(enterEvent);
        }
      }
  
      function selectBestAvailableQuality() {
        let settingButton = document.querySelector('.pzp-setting-button');
        if (!settingButton) return;
      
        triggerClick(settingButton);
      
        setTimeout(() => {
          let qualityButton = document.querySelector('.pzp-setting-intro-quality');
          if (!qualityButton) return;
      
          triggerClick(qualityButton);
      
          setTimeout(() => {
            let qualityItems = document.querySelectorAll('.pzp-ui-setting-quality-item.pzp-ui-setting-pane-item');
            if (qualityItems.length === 0) return;
      
            let targetQuality;
            
            // 선호하는 품질 찾기
            if (preferredQuality === "최고화질") {
              // 최고 화질 선택 (첫 번째 항목)
              targetQuality = qualityItems[0];
            } else {
              // 특정 화질 찾기
              targetQuality = Array.from(qualityItems).find(item =>
                item.textContent.trim().startsWith(preferredQuality)
              );
              
              // 선호 화질이 없으면 대체 화질 선택
              if (!targetQuality) {
                if (preferredQuality === "1080p") {
                  targetQuality = Array.from(qualityItems).find(item =>
                    item.textContent.trim().startsWith("720p")
                  );
                } else if (preferredQuality === "720p") {
                  targetQuality = Array.from(qualityItems).find(item =>
                    item.textContent.trim().startsWith("480p")
                  );
                } else {
                  // 기본적으로 가장 높은 화질 선택
                  targetQuality = qualityItems[0];
                }
              }
            }
      
            if (targetQuality) {
              console.log("[Chzzk Extension] 화질 선택: " + targetQuality.textContent.trim());
              triggerClick(targetQuality);
              let innerButton = targetQuality.querySelector("div") || targetQuality.querySelector("span");
              if (innerButton) triggerClick(innerButton);
            }
          }, 0);
        }, 0);
      }
  
      function initAutoQualitySelection() {
        let delay = firstRun ? 3000 : 700; // 첫방송입장 3000ms : 다음방송입장 700ms
        firstRun = false;
      
        setTimeout(() => {
          let settingButton = document.querySelector('.pzp-setting-button');
          if (settingButton) {
            selectBestAvailableQuality();
          } else {
            let observer = new MutationObserver((mutations, obs) => {
              let settingButton = document.querySelector('.pzp-setting-button');
              if (settingButton) {
                selectBestAvailableQuality();
                obs.disconnect();
              }
            });
      
            observer.observe(document.body, { childList: true, subtree: true });
          }
        }, delay);
      
        // 1초 동안 메뉴 숨기기
        const style = document.createElement('style');
        style.innerHTML = \`
          .pzp-setting-pane,
          .pzp-setting-quality-pane,
          .pzp-settings { display: none !important; }
        \`;
        document.head.appendChild(style);
      
        setTimeout(() => {
          document.head.removeChild(style);
        }, 1000);
      }
      
      function observeUrlChange(callback) {
        let lastUrl = location.href;
        new MutationObserver(() => {
          const currentUrl = location.href;
          if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            if (currentUrl.includes('/live/')) {
              callback();
            }
          }
        }).observe(document, { childList: true, subtree: true });
      
        window.addEventListener('popstate', () => {
          const currentUrl = location.href;
          if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            if (currentUrl.includes('/live/')) {
              callback();
            }
          }
        });
      }
      
      // 현재 페이지가 라이브 페이지인 경우 초기화
      if (location.href.includes('/live/')) {
        initAutoQualitySelection();
        observeUrlChange(initAutoQualitySelection);
      }
    })();
  `;

  document.head.appendChild(qualityScript);
  debugLog("화질 선택 기능 스크립트 삽입 완료!");

  // 첫 실행 상태 업데이트
  firstRun = false;
}

// URL 변경 감시 함수
function observeUrlChange() {
  debugLog("URL 변경 감시 시작");

  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      debugLog("URL 변경 감지: " + currentUrl);

      if (currentUrl.includes("/live/") && autoQualityEnabled) {
        debugLog("라이브 페이지 진입, 화질 선택 기능 적용");
        injectQualitySelector();
      }
    }
  });

  observer.observe(document, { subtree: true, childList: true });

  // popstate 이벤트도 감시
  window.addEventListener("popstate", () => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      debugLog("popstate URL 변경 감지: " + currentUrl);

      if (currentUrl.includes("/live/") && autoQualityEnabled) {
        debugLog("라이브 페이지 진입, 화질 선택 기능 적용");
        injectQualitySelector();
      }
    }
  });
}

// 광고 차단 프로그램 팝업 숨김 기능 스크립트 삽입
function injectAdblockPopupHider() {
  debugLog("광고 차단 팝업 숨김 기능 삽입 중...");

  // 이미 삽입된 스타일이 있으면 추가하지 않음
  if (document.getElementById("chzzk-adblock-popup-hider")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "chzzk-adblock-popup-hider";
  style.textContent = `
    /* 광고 차단 프로그램 알림 팝업 숨김 */
    .popup_dimmed__zs78t,
    .popup_dimmed_transparent__uMy0d,
    div[class*="popup_dimmed"],
    div[class*="popup_container"][role="alertdialog"],
    div[role="alertdialog"][aria-modal="true"] {
      display: none !important;
    }
    
    /* 부가 요소 숨김 (백그라운드 오버레이 등) */
    body.popup_active {
      overflow: auto !important;
    }
  `;

  document.head.appendChild(style);
  debugLog("광고 차단 팝업 숨김 스타일 삽입 완료!");

  // 이미 존재하는 팝업 즉시 제거를 위한 스크립트
  const removeScript = document.createElement("script");
  removeScript.textContent = `
    (function() {
      // 광고 차단 팝업 확인 및 제거 함수
      function closeAdblockPopups() {
        // 모든 얼럿다이얼로그 팝업 찾기
        const popups = document.querySelectorAll('div[role="alertdialog"][aria-modal="true"], div[class*="popup_container"][role="alertdialog"]');
        let found = false;
        
        popups.forEach(popup => {
          // 광고 차단 프로그램 텍스트 포함 여부 확인
          const titleElement = popup.querySelector('strong');
          const paragraphs = popup.querySelectorAll('p');
          
          let hasAdblockText = false;
          
          // 제목에서 확인
          if (titleElement && titleElement.textContent.includes('광고 차단 프로그램')) {
            hasAdblockText = true;
          }
          
          // 내용에서 확인
          paragraphs.forEach(p => {
            if (p.textContent.includes('광고 차단 프로그램')) {
              hasAdblockText = true;
            }
          });
          
          if (hasAdblockText || popup.innerHTML.includes('광고 차단 프로그램')) {
            console.log('[Chzzk Extension] 광고 차단 프로그램 팝업 발견, 제거 처리...');
            
            // 직접 display:none 적용
            popup.style.display = 'none';
            
            // 배경 오버레이 찾기 (부모 요소)
            if (popup.parentElement && popup.parentElement.className.includes('popup_dimmed')) {
              popup.parentElement.style.display = 'none';
            }
            
            // 확인 버튼 클릭
            const confirmButton = popup.querySelector('button');
            if (confirmButton) {
              confirmButton.click();
              console.log('[Chzzk Extension] 광고 차단 팝업 확인 버튼 클릭 완료');
            }
            
            found = true;
          }
        });
        
        return found;
      }
      
      // 페이지 로드 시 즉시 실행
      closeAdblockPopups();
      
      // DOM 변경 감시로 새로운 팝업 탐지
      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            closeAdblockPopups();
          }
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      // 주기적으로 팝업 확인 및 제거 (30초 동안 3초마다 확인)
      let checkCount = 0;
      const maxChecks = 10;
      const checkInterval = 3000; // 3초
      
      function periodicCheck() {
        if (checkCount < maxChecks) {
          const found = closeAdblockPopups();
          checkCount++;
          
          if (found) {
            console.log(\`[Chzzk Extension] 광고 차단 팝업 발견 및 제거 완료 (체크: \${checkCount}/\${maxChecks})\`);
          }
          
          setTimeout(periodicCheck, checkInterval);
        }
      }
      
      // 2초 후 주기적 확인 시작
      setTimeout(periodicCheck, 2000);
    })();
  `;

  document.head.appendChild(removeScript);
  debugLog("광고 차단 팝업 자동 감지 및 제거 스크립트 삽입 완료!");
}
