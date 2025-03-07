# 모먹조

Stageus Backend Server 과정 중에 진행한 협업 프로젝트, 백엔드 파트에 대한 로직을 담고 있습니다.

## 주요 개발 내용

1. API 설계 및 구현
2. 데이터베이스 설계
3. 사용자 인증 및 권한 관리
4. 팀 협업

## 기본 폴더 구조

```
/momeokjo-backend           # 루트 폴더
├── node_modules/           # 의존성 파일들이 설치되는 폴더
├── domains/                # 도메인 폴더
│   ├── auth/               # 인증 관련 도메인
│   ├── restaurants/        # 음식점 관련 도메인
│   └── users/              # 사용자 관련 도메인
├── middlewares/            # 미들웨어 폴더
├── utils/                  # 유틸리티 폴더
├── config/                 # 설정 폴더
├── .env                    # 환경 설정 파일
├── .gitignore              # Git에 포함되지 않을 파일들
├── package.json            # 프로젝트 메타데이터 및 의존성 파일
└── index.js                # 서버 엔트리 포인트
```
