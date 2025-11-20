# GoCD 파이프라인 설정 가이드

GitHub Actions → GoCD 파이프라인 설정 단계별 가이드

## 📋 현재 상태

- ✅ GoCD Server 실행 중 (http://localhost:8153)
- ✅ GoCD Agent 등록 완료
- ✅ 파이프라인 설정 파일 준비 완료

---

## 1. GoCD 웹 UI 접속

```bash
# 브라우저에서 접속
open http://localhost:8153
```

**초기 설정:**
1. 처음 접속 시 관리자 계정 생성
2. Username: `admin` (자유롭게 설정)
3. Password: 화면에 표시된 자동 생성 비밀번호 확인

---

## 2. 파이프라인 등록 (Config Repository 방식)

### 방법 A: Config Repository 사용 (권장)

**장점:** 파일 시스템 변경사항 자동 반영

1. **Admin** > **Config Repositories** 메뉴 이동

2. **Add** 버튼 클릭

3. 설정 입력:
   ```
   Plugin ID: YAML Configuration Plugin
   Repository Name: frontend-pipelines
   Repository Type: File System
   Repository URL: /workspace/gocd/pipelines
   Configuration File Pattern: *.gocd.yaml
   ```

4. **Check Connection** 클릭 → 성공 확인

5. **Save** 클릭

6. **Dashboard**로 이동하면 `frontend-deploy` 파이프라인 자동 등록

---

### 방법 B: 수동 등록

1. **Admin** > **Pipelines** 메뉴

2. **Upload Config** 버튼 클릭

3. `gocd/pipelines/frontend-deploy.gocd.yaml` 파일 업로드

---

## 3. 파이프라인 구조 확인

### GitHub Actions vs GoCD 매핑

| GitHub Actions | GoCD | 설명 |
|---------------|------|------|
| `on.push.branches: [main]` | `materials.git.branch: main` | main 브랜치 감지 |
| `env` | `environment_variables` | 환경변수 |
| `jobs.build` | `stages.build` | 빌드 Stage |
| `jobs.build.steps` | `stages.build.jobs` | 병렬 Job |
| `jobs.deploy.needs: build` | Stage 순서 (build → deploy) | 의존성 |
| `uses: actions/upload-artifact` | `artifacts` | Artifact 저장 |
| `uses: actions/download-artifact` | `fetch` | Artifact 다운로드 |

### 파이프라인 흐름

```
┌─────────────────────────────────────────────────────────┐
│ Stage 1: Build                                          │
│ ┌──────────┐  ┌──────────┐  ┌──────────────┐          │
│ │  setup   │  │  build   │  │    build     │          │
│ │          │  │  -client │  │    -admin    │          │
│ │ Node.js  │  │          │  │              │          │
│ │ + pnpm   │  │ pnpm run │  │  pnpm run    │          │
│ │ install  │  │  build   │  │   build      │          │
│ └──────────┘  └──────────┘  └──────────────┘          │
│                ↓ artifact     ↓ artifact                │
│                                                          │
│ ┌──────────────┐                                        │
│ │    build     │                                        │
│ │  -accounts   │                                        │
│ │              │                                        │
│ │  pnpm run    │                                        │
│ │   build      │                                        │
│ └──────────────┘                                        │
│   ↓ artifact                                            │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Stage 2: Deploy                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ deploy-s3                                           │ │
│ │                                                     │ │
│ │ 1. Fetch artifacts (client, admin, accounts)       │ │
│ │ 2. Install AWS CLI                                 │ │
│ │ 3. aws s3 sync to S3 buckets                       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 파이프라인 실행

### 첫 실행

1. **Dashboard** 메뉴로 이동

2. `frontend-deploy` 파이프라인 찾기

3. **Trigger Pipeline** (▶️) 버튼 클릭

4. 실행 상태 모니터링:
   - **Build Stage**: 4개 Job 병렬 실행
     - `setup` (환경 설정)
     - `build-client` (client 빌드)
     - `build-admin` (admin 빌드)
     - `build-accounts` (accounts 빌드)
   - **Deploy Stage**: S3 배포

### 진행 상황 확인

- 각 Stage 클릭 → Job 상세 로그 확인
- 실패 시 빨간색 표시 → 로그에서 오류 원인 파악

---

## 5. AWS 자격증명 설정 (실제 배포용)

### 옵션 A: 환경변수 (로컬 테스트)

GoCD Agent 컨테이너에 환경변수 추가:

```yaml
# docker-compose.gocd.yml
gocd-agent:
  environment:
    - AWS_ACCESS_KEY_ID=your-access-key
    - AWS_SECRET_ACCESS_KEY=your-secret-key
    - AWS_DEFAULT_REGION=ap-northeast-2
```

### 옵션 B: Secure Variables (권장)

1. **Admin** > **Pipelines** > `frontend-deploy` 편집

2. **Environment Variables** 탭

3. **Add** 클릭:
   ```
   Name: AWS_ACCESS_KEY_ID
   Value: your-access-key-id
   Secure: ✓ (체크)
   ```

4. 동일하게 `AWS_SECRET_ACCESS_KEY` 추가

### 옵션 C: IAM Role (프로덕션)

Agent가 EC2에서 실행되는 경우 IAM Role 사용

---

## 6. S3 배포 활성화

`gocd/pipelines/frontend-deploy.gocd.yaml` 파일 수정:

```yaml
# 주석 제거하여 실제 배포 활성화
- exec:
    command: /bin/sh
    arguments:
      - -c
      - |
        # 주석 제거 👇
        aws s3 sync ./build/client s3://${CLIENT_BUCKET_NAME} --delete --region ${AWS_REGION}
        aws s3 sync ./build/admin s3://${ADMIN_BUCKET_NAME} --delete --region ${AWS_REGION}
        aws s3 sync ./build/accounts s3://${ACCOUNTS_BUCKET_NAME} --delete --region ${AWS_REGION}
```

**Config Repository 사용 시:** 파일 저장하면 자동 반영

**수동 등록 시:** 파이프라인 재업로드 필요

---

## 7. GitHub Actions와 차이점

### 장점 (GoCD)

1. **시각적 파이프라인**
   - Value Stream Map으로 전체 흐름 한눈에 확인
   - 각 Stage/Job 상태 실시간 모니터링

2. **수동 승인 게이트**
   - Deploy Stage를 manual 승인으로 변경 가능
   ```yaml
   approval:
     type: manual
     authorization:
       users:
         - admin
   ```

3. **Artifact 관리**
   - 빌드 산출물 자동 보관
   - Stage 간 Artifact 전달 자동화

4. **파이프라인 재실행**
   - 특정 Stage만 재실행 가능
   - 전체 파이프라인 재실행 불필요

### 단점 (GoCD)

1. **GitHub 통합 부족**
   - PR 자동 트리거 없음 (플러그인 필요)
   - GitHub Status Check 없음

2. **설정 복잡도**
   - YAML 구조 학습 필요
   - Agent 리소스 관리 필요

3. **서버 관리**
   - 별도 서버 운영 필요
   - 업그레이드 및 유지보수

---

## 8. 트러블슈팅

### Agent가 Job을 실행하지 않음

**원인:** Agent 리소스 불일치

**해결:**
1. **Agents** 메뉴에서 Agent 클릭
2. **Resources** 탭에서 `nodejs`, `pnpm` 추가
3. Agent 재시작

### pnpm 명령어 실패

**원인:** pnpm이 설치되지 않음

**해결:**
```bash
# Agent 컨테이너 접속
docker exec -it gocd-agent /bin/bash

# pnpm 설치 확인
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm --version
```

### Artifact fetch 실패

**원인:** Artifact 경로 불일치

**확인:**
1. Build Stage 로그에서 artifact 생성 확인
2. Deploy Stage에서 fetch 경로 확인
3. `source`와 `destination` 경로 일치 여부 확인

### AWS S3 업로드 실패

**원인 1:** AWS CLI 미설치
```bash
# Agent에 AWS CLI 설치 확인
docker exec gocd-agent aws --version
```

**원인 2:** 자격증명 없음
```bash
# 환경변수 확인
docker exec gocd-agent env | grep AWS
```

---

## 9. 다음 단계

### Quality Gate 추가

GitHub Actions의 `pr-quality-gate.yml`을 GoCD로 변환:

```yaml
stages:
  - quality-gate:
      jobs:
        format-check:
          tasks:
            - exec:
                command: pnpm
                arguments: [format:check]

        lint:
          tasks:
            - exec:
                command: pnpm
                arguments: [lint]

        type-check:
          tasks:
            - exec:
                command: pnpm
                arguments: [type-check]
```

### 멀티 환경 배포

Staging/Production 환경 분리:

```yaml
pipelines:
  frontend-staging:
    environment_variables:
      ENV: staging
    # ... staging 설정

  frontend-production:
    environment_variables:
      ENV: production
    stages:
      - deploy:
          approval:
            type: manual  # Production은 수동 승인
```

---

## 10. 참고 자료

- [GoCD Pipeline as Code](https://docs.gocd.org/current/advanced_usage/pipelines_as_code.html)
- [GoCD YAML Config Plugin](https://github.com/tomzo/gocd-yaml-config-plugin)
- [GoCD Environment Variables](https://docs.gocd.org/current/faq/dev_use_current_revision_in_build.html)
- [GoCD Artifacts](https://docs.gocd.org/current/configuration/managing_artifacts_and_reports.html)
