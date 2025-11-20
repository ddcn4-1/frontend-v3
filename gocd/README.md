# GoCD 실습 가이드

GoCD를 Docker Compose와 Kubernetes 두 가지 방법으로 실행하는 가이드입니다.

## 📋 목차

1. [방법 1: Docker Compose (빠른 시작)](#방법-1-docker-compose)
2. [방법 2: Kubernetes (프로덕션급)](#방법-2-kubernetes)
3. [파이프라인 설정](#파이프라인-설정)
4. [GitHub Actions 비교](#github-actions-비교)

---

## 방법 1: Docker Compose

### 사전 요구사항

- Docker Desktop 설치
- 최소 4GB RAM 할당

### 1.1 GoCD 실행

```bash
# GoCD 서버 & 에이전트 시작
docker-compose -f docker-compose.gocd.yml up -d

# 로그 확인
docker-compose -f docker-compose.gocd.yml logs -f

# 상태 확인
docker-compose -f docker-compose.gocd.yml ps
```

### 1.2 초기 설정 대기

```bash
# GoCD 서버가 완전히 시작될 때까지 대기 (약 2-3분)
# Health check 통과 확인
docker-compose -f docker-compose.gocd.yml ps
```

### 1.3 웹 UI 접속

- URL: http://localhost:8153
- 초기 관리자 계정:
  - Username: `admin`
  - Password: 웹 UI에서 자동 생성된 비밀번호 확인

### 1.4 에이전트 등록 확인

1. **Agents** 메뉴로 이동
2. `gocd-agent` 에이전트가 자동 등록되었는지 확인
3. 상태가 **Idle**이면 정상

### 1.5 정리

```bash
# GoCD 중지
docker-compose -f docker-compose.gocd.yml down

# 볼륨까지 완전 삭제
docker-compose -f docker-compose.gocd.yml down -v
```

---

## 방법 2: Kubernetes

### 사전 요구사항

로컬 Kubernetes 클러스터 중 하나 선택:

#### 옵션 A: Minikube (권장)

```bash
# Minikube 설치 (macOS)
brew install minikube

# 클러스터 시작 (4GB RAM, 2 CPU)
minikube start --memory=4096 --cpus=2 --driver=docker

# 클러스터 상태 확인
minikube status
```

#### 옵션 B: kind (Kubernetes in Docker)

```bash
# kind 설치
brew install kind

# 클러스터 생성
kind create cluster --name gocd-local

# 클러스터 확인
kubectl cluster-info --context kind-gocd-local
```

#### 옵션 C: Docker Desktop Kubernetes

```bash
# Docker Desktop > Settings > Kubernetes > Enable Kubernetes 체크
# Apply & Restart

# 컨텍스트 전환
kubectl config use-context docker-desktop
```

### 2.1 GoCD 배포

```bash
# Namespace 및 리소스 생성
kubectl apply -k gocd/k8s/

# 배포 상태 확인
kubectl get all -n gocd

# Pod 로그 확인
kubectl logs -n gocd -l app=gocd-server -f
```

### 2.2 서비스 접속

#### Minikube 사용 시:

```bash
# NodePort 서비스 접속
minikube service gocd-server -n gocd

# 또는 포트 포워딩
kubectl port-forward -n gocd svc/gocd-server 8153:8153
```

#### kind/Docker Desktop 사용 시:

```bash
# 포트 포워딩
kubectl port-forward -n gocd svc/gocd-server 8153:8153 8154:8154
```

- URL: http://localhost:8153

### 2.3 에이전트 확인

```bash
# Agent Pod 상태 확인
kubectl get pods -n gocd -l app=gocd-agent

# Agent 로그 확인
kubectl logs -n gocd -l app=gocd-agent -f

# GoCD 웹 UI에서도 확인 가능
```

### 2.4 스케일링 (옵션)

```bash
# Agent 개수 조정 (병렬 빌드 향상)
kubectl scale deployment gocd-agent -n gocd --replicas=3

# 확인
kubectl get pods -n gocd -l app=gocd-agent
```

### 2.5 정리

```bash
# GoCD 리소스 삭제
kubectl delete -k gocd/k8s/

# 클러스터 삭제 (선택)
minikube delete          # Minikube
kind delete cluster --name gocd-local  # kind
```

---

## 파이프라인 설정

### 3.1 파이프라인 구성 파일

파이프라인 설정: `gocd/pipelines/frontend-pipeline.gocd.yaml`

**4단계 파이프라인:**

1. **Install**: 의존성 설치
2. **Quality Gate**: Format, Lint, Type Check (병렬)
3. **Build**: 3개 앱 빌드 (병렬)
4. **Deploy**: S3 배포 (수동 승인)

### 3.2 웹 UI에서 파이프라인 추가

#### 방법 A: Config Repository 사용 (권장)

1. **Admin** > **Config Repositories** 이동
2. **Add** 클릭
3. 설정:
   ```
   Repository Type: File System
   Repository URL: /workspace/gocd/pipelines
   Configuration File Pattern: *.gocd.yaml
   ```
4. **Check Connection** → **Save**

#### 방법 B: 수동 업로드

1. **Admin** > **Pipelines** 이동
2. **Upload Config** 클릭
3. `gocd/pipelines/frontend-pipeline.gocd.yaml` 파일 업로드

### 3.3 파이프라인 실행

1. **Dashboard**로 이동
2. `frontend-build-deploy` 파이프라인 찾기
3. **Play** 버튼 클릭
4. 각 Stage 진행 상황 모니터링:
   - ✅ Install → ✅ Quality Gate → ✅ Build → ⏸️ Deploy (수동 승인 대기)

### 3.4 수동 승인 및 배포

1. **Deploy** Stage에서 **Trigger** 버튼 클릭
2. 승인 후 배포 진행
3. 결과 확인

---

## GitHub Actions 비교

### 구조 비교

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
on: push
jobs:
  build:
    steps:
      - checkout
      - install
      - build (3개 병렬)
  deploy:
    needs: build
    steps:
      - download artifacts
      - deploy to S3
```

**특징:**
- ✅ YAML 기반 단순 설정
- ✅ GitHub 통합 (PR, Issues)
- ✅ 무료 (public repo)
- ❌ 시각화 제한적
- ❌ 복잡한 승인 플로우 어려움

#### GoCD

```yaml
# gocd/pipelines/frontend-pipeline.gocd.yaml
stages:
  - install
  - quality-gate (3개 병렬 job)
  - build (3개 병렬 job)
  - deploy (수동 승인)
```

**특징:**
- ✅ 시각적 파이프라인 모니터링
- ✅ 복잡한 승인 플로우
- ✅ 세밀한 Stage/Job 제어
- ❌ 설정 복잡
- ❌ 별도 서버 관리 필요

---

## 주요 차이점 요약

| 항목 | GitHub Actions | GoCD |
|------|---------------|------|
| **설정 난이도** | ⭐ 쉬움 | ⭐⭐⭐ 어려움 |
| **시각화** | 기본 로그 | 상세 파이프라인 시각화 |
| **수동 승인** | Environment 기능 | 내장 Approval Gate |
| **병렬 실행** | Matrix 전략 | Job 레벨 병렬화 |
| **비용** | 무료 (public) | 서버 비용 |
| **GitHub 통합** | 완벽 | API 연동 필요 |
| **학습 곡선** | 낮음 | 높음 |

---

## 트러블슈팅

### Docker Compose 이슈

**에이전트가 등록되지 않음:**

```bash
# 에이전트 로그 확인
docker logs gocd-agent

# 서버 연결 확인
docker exec gocd-agent ping gocd-server

# 재시작
docker-compose -f docker-compose.gocd.yml restart gocd-agent
```

**포트 충돌:**

```bash
# 8153 포트가 이미 사용 중이면
# docker-compose.gocd.yml에서 포트 변경:
ports:
  - "8160:8153"  # 8153 → 8160으로 변경
```

### Kubernetes 이슈

**Pod가 Pending 상태:**

```bash
# 이벤트 확인
kubectl describe pod -n gocd -l app=gocd-server

# 리소스 부족이면 요청량 줄이기
kubectl edit deployment gocd-server -n gocd
```

**PVC가 Bound 안됨:**

```bash
# PVC 상태 확인
kubectl get pvc -n gocd

# StorageClass 확인
kubectl get storageclass

# 수동 PV 생성 필요하면:
kubectl apply -f gocd/k8s/pv.yaml  # 별도 생성 필요
```

**NodePort 접속 안됨 (Minikube):**

```bash
# Minikube 서비스 URL 확인
minikube service gocd-server -n gocd --url

# 터널 생성
minikube tunnel
```

---

## 다음 단계

1. **파이프라인 커스터마이징**
   - `gocd/pipelines/frontend-pipeline.gocd.yaml` 수정
   - Stage/Job 추가
   - 환경변수 설정

2. **AWS 배포 통합**
   - Agent에 AWS CLI 설치
   - IAM 자격증명 설정
   - S3 sync 명령어 활성화

3. **알림 설정**
   - Slack/Discord 플러그인 설치
   - 빌드 실패 시 알림

4. **멀티 환경 구성**
   - Staging/Production 환경 분리
   - 환경별 승인 플로우

---

## 참고 자료

- [GoCD 공식 문서](https://docs.gocd.org/)
- [GoCD Pipeline as Code](https://docs.gocd.org/current/advanced_usage/pipelines_as_code.html)
- [GoCD Kubernetes 헬름 차트](https://github.com/gocd/helm-chart)
- [GitHub Actions vs GoCD 비교](https://www.gocd.org/compare.html)
