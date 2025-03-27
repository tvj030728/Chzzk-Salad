![image](https://github.com/user-attachments/assets/4c8f6edd-035b-40a2-9d58-d07e4a8d9c54)

# ⚠️ 주의사항

본 확장프로그램은 학습 목적으로만 사용되어야합니다. 실제 서비스 이용 시 서비스 제공자의 이용약관을 위반할 수 있으며, 이로 인한 모든 책임은 사용자에게 있습니다.

# Chzzk Salad

Chrome 및 Firefox 브라우저용 확장 프로그램으로, 네이버 치지직(Chzzk) 사이트에서 P2P 품질 설정을 비활성화하고 자동 화질 선택 기능을 제공합니다. 또한 광고 차단 프로그램 알림 팝업을 자동으로 숨겨줍니다.

## 기능

- 치지직 사이트에서 P2P 품질 설정을 차단하여 더 안정적인 시청 환경 제공
- 자동 화질 선택 기능으로 원하는 화질로 자동 설정
- 방송 입장 시 선호하는 화질(1080p, 720p 등)로 자동 전환
- "광고 차단 프로그램을 사용 중이신가요?" 알림 팝업 자동 숨김 및 차단
- 확장 프로그램 활성화/비활성화 기능 제공
- 사용자 친화적인 인터페이스
- Chrome 및 Firefox 브라우저 모두 지원

## 설치 방법

### Firefox 설치 방법

1. 이 저장소를 다운로드 또는 클론합니다.
2. Firefox 브라우저에서 `about:debugging` 페이지로 이동합니다.
3. "이 Firefox" 탭을 클릭합니다.
4. "임시 부가 기능 로드" 버튼을 클릭합니다.
5. 다운로드한 폴더(chzzk-salad)에서 `manifest.json` 파일을 선택합니다.

### Chrome 설치 방법

1. 이 저장소를 다운로드 또는 클론합니다.
2. Chrome 브라우저에서 `chrome://extensions` 페이지로 이동합니다.
3. 우측 상단의 "개발자 모드"를 켭니다.
4. "압축해제된 확장 프로그램을 로드합니다" 버튼을 클릭합니다.
5. 다운로드한 폴더를 선택합니다. (chzzk-salad 폴더)

## 사용 방법

1. 확장 프로그램을 설치하면 자동으로 활성화됩니다.
2. 브라우저 툴바의 확장 프로그램 아이콘을 클릭하여 설정을 변경할 수 있습니다.
3. 설정 페이지에서 P2P 차단, 자동 화질 선택, 광고 차단 팝업 숨김 기능을 활성화/비활성화할 수 있습니다.
4. 원하는 선호 화질을 선택하여 방송 입장 시 자동으로 적용되도록 설정할 수 있습니다.

## 작동 원리

이 확장 프로그램은 치지직 사이트에서 XHook 라이브러리를 사용하여 API 응답을 가로채고 p2pQuality 관련 설정을 비활성화합니다. 또한 자동 화질 선택 기능은 방송 입장 시 플레이어의 설정 버튼을 자동으로 클릭하고 사용자가 선택한 화질로 설정합니다. 광고 차단 프로그램 알림 팝업은 CSS와 JavaScript를 통해 숨기거나 자동으로 닫힙니다.

## 크로스 브라우저 호환성

이 확장 프로그램은 Chrome과 Firefox 브라우저 모두에서 작동하도록 설계되었습니다. 확장 프로그램 API 간의 차이를 자동으로 감지하고 적절한 API를 사용합니다.
