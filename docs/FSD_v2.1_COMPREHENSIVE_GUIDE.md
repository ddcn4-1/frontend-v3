# Feature-Sliced Design v2.1 종합 마이그레이션 가이드

## 목차

1. [FSD v2.1 개요](#fsd-v21-개요)
2. [핵심 개념](#핵심-개념)
3. [아키텍처 원칙](#아키텍처-원칙)
4. [디렉토리 구조 완전 가이드](#디렉토리-구조-완전-가이드)
5. [React Query 통합 전략](#react-query-통합-전략)
6. [마이그레이션 로드맵](#마이그레이션-로드맵)
7. [실전 예제](#실전-예제)
8. [Anti-patterns와 Best Practices](#anti-patterns와-best-practices)
9. [도구 및 생태계](#도구-및-생태계)
10. [FAQ 및 트러블슈팅](#faq-및-트러블슈팅)

---

## FSD v2.1 개요

### 철학과 동기

Feature-Sliced Design(FSD)은 **복잡하고 지속적으로 발전하는 프론트엔드 프로젝트**의 개발을 용이하게 하고 비용을 절감하기 위해 설계된 아키텍처 방법론입니다.

**핵심 철학:**

```
코드의 구조 = 비즈니스의 구조
명시성 > 암묵성
응집도↑ 결합도↓
```

### 해결하고자 하는 문제

#### 1. **버스 팩터 (Bus Factor) 문제**

```
문제: "이 프로젝트를 이해하는 사람이 2명뿐이다"
결과: 신규 인력 온보딩 3개월 소요
     → "이 거대한 모놀리스에서 무슨 일이 일어나는지 모르겠다"

FSD 해결책:
- 표준화된 구조로 학습 곡선 단축
- 비즈니스 도메인 중심 구조로 직관성 확보
- 명시적 의존성으로 코드 추적 용이
```

#### 2. **암묵적 부수 효과**

```
문제: "A 페이지 스토어 수정 → B 페이지 기능 중단"
원인: 모든 것이 모든 것에 의존

FSD 해결책:
- Layer별 엄격한 Import Rule
- Public API를 통한 캡슐화
- 슬라이스 간 독립성 보장
```

#### 3. **통제 불가능한 로직 재사용**

```
문제:
- 방식 1: 각 모듈마다 로직 중복 작성
- 방식 2: 모든 것을 shared/에 던지기 (Helper Dump)

FSD 해결책:
- Entities로 비즈니스 엔티티 분리
- Features로 재사용 가능한 기능 격리
- Shared는 순수 유틸리티만
```

#### 4. **분산된 비즈니스 로직**

```
문제:
components/UserCard.tsx
actions/user.js
reducers/user.js
helpers/userFormatter.js
→ 사용자 관련 로직이 4곳에 흩어짐

FSD 해결책:
entities/user/
  ├── ui/
  ├── model/
  └── lib/
→ 한 곳에서 모든 것 관리
```

### 이상적인 아키텍처의 요구사항

| 요구사항   | 설명                       | FSD 구현 방법                 |
| ---------- | -------------------------- | ----------------------------- |
| **명시성** | 팀이 쉽게 배우고 설명 가능 | 표준화된 Layer/Slice/Segment  |
|            | 구조가 비즈니스 가치 반영  | Needs-Driven Design           |
|            | 부수 효과가 명시적         | Public API + Import Rules     |
| **제어**   | 기능 추가 속도 향상        | Feature 단위 격리             |
|            | 코드 확장/수정/삭제 용이   | 높은 응집도, 낮은 결합도      |
|            | 구성요소 교체 가능         | 인터페이스 기반 설계          |
| **적응성** | 프레임워크 독립적          | React, Vue, Angular 모두 적용 |
|            | 점진적 마이그레이션 가능   | 단계별 전환 지원              |
|            | 병렬 개발 지원             | Feature/Entity 단위 분리      |

---

## 핵심 개념

### 3단계 계층 구조

FSD는 **Layers → Slices → Segments** 3단계 구조로 코드를 조직화합니다.

```
┌─────────────────────────────────────────────┐
│ Layer (계층): 책임의 크기                    │
│   └── Slice (슬라이스): 비즈니스 도메인      │
│         └── Segment (세그먼트): 기술적 목적  │
└─────────────────────────────────────────────┘
```

---

### 1. Layers (계층): 책임에 따른 코드 분리

총 7개의 계층이 있으며, **상위 → 하위 방향으로만 의존**할 수 있습니다.

```
┌─────────────────────────────────────────────┐
│ app          ← 앱 전체 설정                  │
├─────────────────────────────────────────────┤
│ processes    ← (사용 중단)                   │
├─────────────────────────────────────────────┤
│ pages        ← 페이지 조합                   │
├─────────────────────────────────────────────┤
│ widgets      ← 독립적 UI 블록                │
├─────────────────────────────────────────────┤
│ features     ← 사용자 시나리오               │
├─────────────────────────────────────────────┤
│ entities     ← 비즈니스 엔티티               │
├─────────────────────────────────────────────┤
│ shared       ← 재사용 가능한 인프라          │
└─────────────────────────────────────────────┘

의존성 방향: ↓ (아래로만 가능)
```

#### Layer별 상세

| Layer        | 역할            | 예시                               | 슬라이스 포함 |
| ------------ | --------------- | ---------------------------------- | ------------- |
| **app**      | 앱 전체 설정    | Router, Redux Store, Global Styles | ❌ 없음       |
| **pages**    | 페이지 조합     | `/home`, `/profile`, `/admin`      | ✅ 있음       |
| **widgets**  | 재사용 UI 블록  | Header, Sidebar, ChatWidget        | ✅ 있음       |
| **features** | 사용자 기능     | `add-comment`, `search`, `auth`    | ✅ 있음       |
| **entities** | 비즈니스 엔티티 | `user`, `post`, `product`          | ✅ 있음       |
| **shared**   | 공통 인프라     | UI Kit, API Client, Utils          | ❌ 없음       |

**계층 간 Import Rule:**

```typescript
// ✅ 허용: 상위 → 하위
import { Button } from '@/shared/ui/button'; // pages → shared
import { useUser } from '@/entities/user'; // features → entities
import { SearchForm } from '@/features/search'; // pages → features

// ❌ 금지: 하위 → 상위
import { HomePage } from '@/pages/home'; // features → pages (불가)
import { Header } from '@/widgets/header'; // entities → widgets (불가)

// ❌ 금지: 같은 레이어 간 (예외: entities)
import { CommentForm } from '@/features/add-comment'; // features → features (불가)
```

---

### 2. Slices (슬라이스): 비즈니스 도메인별 그룹화

슬라이스는 **비즈니스 의미**에 따라 코드를 그룹화합니다.

**명명 규칙:**

- **Entity**: 명사형 → `user`, `post`, `order`
- **Feature**: 동사-명사 → `add-comment`, `edit-profile`, `search-posts`
- **Page**: 라우트명 → `home`, `profile`, `admin-dashboard`
- **Widget**: UI 블록명 → `header`, `chat-widget`, `notification-panel`

**예시:**

```
entities/
  ├── user/           # 사용자 엔티티
  ├── post/           # 게시물 엔티티
  └── comment/        # 댓글 엔티티

features/
  ├── add-comment/    # 댓글 추가 기능
  ├── edit-post/      # 게시물 수정 기능
  └── search/         # 검색 기능

pages/
  ├── home/           # 홈 페이지
  ├── post-detail/    # 게시물 상세 페이지
  └── profile/        # 프로필 페이지
```

#### 높은 응집도 & 낮은 결합도

```typescript
// ✅ 좋은 예: 높은 응집도
entities/user/
  ├── ui/UserCard.tsx         // 사용자 관련 UI
  ├── model/userStore.ts      // 사용자 상태 관리
  ├── api/getUser.ts          // 사용자 API
  └── lib/formatUserName.ts   // 사용자 유틸리티
→ 사용자 관련 모든 것이 한 곳에

// ❌ 나쁜 예: 낮은 응집도
components/UserCard.tsx
stores/userStore.ts
api/getUser.ts
utils/formatUserName.ts
→ 사용자 관련 코드가 4곳에 분산
```

---

### 3. Segments (세그먼트): 기술적 목적에 따른 그룹화

슬라이스 내부를 **기술적 성격**에 따라 정리합니다.

**표준 세그먼트:**

| 세그먼트   | 역할          | 포함 내용               |
| ---------- | ------------- | ----------------------- |
| **ui**     | UI 표시       | 컴포넌트, 스타일        |
| **api**    | 백엔드 통신   | API 함수, DTO, 매퍼     |
| **model**  | 비즈니스 로직 | 상태 관리, 타입, 스키마 |
| **lib**    | 유틸리티      | 해당 슬라이스 전용 헬퍼 |
| **config** | 설정          | 상수, 기능 플래그       |

**중요: 목적 기반 명명**

```typescript
// ✅ 좋은 예: 목적 기반
api/          // "백엔드와 통신한다"
model/        // "비즈니스 로직을 처리한다"
ui/           // "UI를 표시한다"

// ❌ 나쁜 예: 본질 기반
components/   // "컴포넌트다" (목적 불명확)
hooks/        // "훅이다" (목적 불명확)
types/        // "타입이다" (목적 불명확)
```

---

## 아키텍처 원칙

### 1. Public API 원칙

모든 슬라이스는 **Public API**를 통해서만 외부와 통신합니다.

#### Public API란?

```typescript
// entities/user/index.ts (Public API)
export { UserCard } from './ui/UserCard';
export { useUser } from './model/useUser';
export { getUser } from './api/getUser';
export type { User } from './model/types';

// 외부에서 사용
import { UserCard, useUser, getUser, User } from '@/entities/user';

// ❌ 내부 구조 직접 접근 금지
import { UserCard } from '@/entities/user/ui/UserCard'; // 나쁨!
```

#### 좋은 Public API의 조건

1. **리팩토링 보호**: 내부 구조 변경이 외부에 영향 없음

```typescript
// entities/user/index.ts 변경 없음
export { UserCard } from './ui/UserCard';

// 내부 구조 자유롭게 변경 가능
// Before: ui/UserCard.tsx
// After:  ui/components/UserCard.tsx
```

2. **필요한 것만 노출**

```typescript
// ✅ 좋은 예
export { UserCard } from './ui/UserCard'; // 필요
export { useUser } from './model/useUser'; // 필요

// ❌ 나쁜 예
export { InternalHelper } from './lib/internal'; // 내부용인데 노출
export * from './ui'; // 너무 많이 노출
```

3. **중요한 변경은 API 변경으로 나타남**

```typescript
// Breaking Change 예시
// Before
export { useUser } from './model/useUser';

// After (Hook → Context로 변경)
export { UserProvider, useUserContext } from './model/userContext';
→ Public API 변경으로 Breaking Change가 명확히 드러남
```

---

### 2. Import Rules (가져오기 규칙)

#### Layer별 Import Rule

```typescript
// ✅ 허용: 하위 레이어만 import
// pages → widgets, features, entities, shared
import { Header } from '@/widgets/header';
import { SearchForm } from '@/features/search';
import { useUser } from '@/entities/user';
import { Button } from '@/shared/ui/button';

// ❌ 금지: 상위 레이어 import
// entities → features (불가)
import { SearchForm } from '@/features/search'; // ❌

// ❌ 금지: 같은 레이어 import
// features/search → features/add-comment (불가)
import { CommentForm } from '@/features/add-comment'; // ❌
```

#### 예외: Entities 간 Cross-Import

비즈니스 엔티티는 서로 관계가 있을 수 있습니다.

```typescript
// entities/post/model/types.ts
import type { User } from '@/entities/user'; // ❌ 일반적으로 금지

// 해결책: @x (cross-import) 표기법
// entities/user/@x/post.ts (특별한 Public API)
export type { User } from '../model/types';

// entities/post/model/types.ts
import type { User } from '@/entities/user/@x/post'; // ✅ 허용
```

---

### 3. 수요 중심 설계 (Needs-Driven Design)

코드의 구조와 명칭은 **사용자/비즈니스 과업**에 기반해야 합니다.

#### Feature 정의 방법

```typescript
// ❌ 잘못된 Feature 명명
features/map-office/          // "지도-사무실" (의미 불명)
features/button-click/        // "버튼-클릭" (기술적)
features/modal/               // "모달" (UI 요소)

// ✅ 올바른 Feature 명명
features/book-meeting-room/   // "회의실 예약하기" (사용자 과업)
features/search-products/     // "상품 검색하기" (비즈니스 가치)
features/add-to-cart/         // "장바구니 추가" (사용자 행동)
```

#### 과업 기반 구조화

```typescript
// ❌ 기술 기반 구조
components/
  ├── Button.tsx
  ├── Modal.tsx
  └── Form.tsx
hooks/
  ├── useForm.ts
  └── useModal.ts

// ✅ 과업 기반 구조
features/
└── book-meeting-room/
    ├── ui/
    │   ├── BookingButton.tsx      // "예약 버튼"
    │   ├── BookingModal.tsx       // "예약 모달"
    │   └── BookingForm.tsx        // "예약 폼"
    └── model/
        └── useBooking.ts          // "예약 로직"
→ "회의실 예약" 과업과 관련된 모든 것이 한 곳에
```

---

## 디렉토리 구조 완전 가이드

### 전체 구조 개요

```
src/
├── app/                          # Layer 1: 앱 전체 설정
│   ├── providers/
│   │   ├── RouterProvider.tsx
│   │   ├── StoreProvider.tsx
│   │   └── QueryProvider.tsx
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.css
│   └── index.tsx
│
├── pages/                        # Layer 2: 페이지 조합
│   ├── home/
│   ├── profile/
│   └── admin/
│
├── widgets/                      # Layer 3: 독립 UI 블록
│   ├── header/
│   ├── sidebar/
│   └── chat-widget/
│
├── features/                     # Layer 4: 사용자 기능
│   ├── auth/
│   ├── add-comment/
│   └── search/
│
├── entities/                     # Layer 5: 비즈니스 엔티티
│   ├── user/
│   ├── post/
│   └── comment/
│
└── shared/                       # Layer 6: 공통 인프라
    ├── ui/
    ├── api/
    ├── lib/
    └── config/
```

---

### App Layer 상세

**역할:** 앱 전체 초기화 및 설정

```
app/
├── providers/                    # Context Providers
│   ├── RouterProvider.tsx        # React Router 설정
│   ├── StoreProvider.tsx         # Redux/Zustand Provider
│   ├── QueryProvider.tsx         # React Query Provider
│   └── ThemeProvider.tsx         # Theme Provider
│
├── styles/                       # 전역 스타일
│   ├── globals.css               # Reset, 기본 스타일
│   ├── theme.css                 # CSS Variables
│   └── fonts.css                 # 폰트 정의
│
├── index.tsx                     # 앱 진입점
└── routes.tsx                    # 라우트 정의 (선택)
```

**예시:**

```typescript
// app/index.tsx
import { RouterProvider } from './providers/RouterProvider';
import { StoreProvider } from './providers/StoreProvider';
import { QueryProvider } from './providers/QueryProvider';
import './styles/globals.css';

export const App = () => {
  return (
    <StoreProvider>
      <QueryProvider>
        <RouterProvider />
      </QueryProvider>
    </StoreProvider>
  );
};

// app/providers/QueryProvider.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/api/query-client';

export const QueryProvider = ({ children }: Props) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

---

### Pages Layer 상세

**역할:** 라우트별 페이지 조합

```
pages/
├── home/
│   ├── ui/
│   │   └── HomePage.tsx          # 페이지 컴포넌트
│   └── index.ts                  # Public API
│
├── profile/
│   ├── ui/
│   │   ├── ProfilePage.tsx
│   │   └── EditProfileSection.tsx
│   ├── model/
│   │   └── useProfilePage.ts    # 페이지 전용 로직
│   └── index.ts
│
└── post-detail/
    ├── ui/
    │   ├── PostDetailPage.tsx
    │   └── PostComments.tsx
    ├── api/
    │   └── getPostWithComments.ts  # 페이지 전용 API
    └── index.ts
```

**예시:**

```typescript
// pages/home/ui/HomePage.tsx
import { PostList } from '@/widgets/post-list';
import { SearchForm } from '@/features/search';
import { Container } from '@/shared/ui/container';

export const HomePage = () => {
  return (
    <Container>
      <SearchForm />
      <PostList />
    </Container>
  );
};

// pages/home/index.ts
export { HomePage } from './ui/HomePage';
```

---

### Widgets Layer 상세

**역할:** 여러 페이지에서 재사용되는 독립적 UI 블록

```
widgets/
├── header/
│   ├── ui/
│   │   ├── Header.tsx
│   │   ├── NavMenu.tsx
│   │   └── UserMenu.tsx
│   ├── model/
│   │   └── useHeaderState.ts
│   └── index.ts
│
├── post-list/
│   ├── ui/
│   │   ├── PostList.tsx
│   │   └── PostItem.tsx
│   ├── model/
│   │   └── usePostList.ts        # 위젯 로직
│   └── index.ts
│
└── chat-widget/
    ├── ui/
    │   ├── ChatWidget.tsx
    │   └── MessageList.tsx
    ├── api/
    │   └── getChatMessages.ts     # 위젯 전용 API
    ├── model/
    │   └── useChatWidget.ts
    └── index.ts
```

**Widget vs Feature 구분:**

- **Widget**: UI 블록 (재사용 가능한 조합)
- **Feature**: 사용자 행동 (비즈니스 가치)

```typescript
// ✅ Widget 예시
widgets/header/              // UI 블록
widgets/sidebar/             // UI 블록
widgets/notification-panel/  // UI 블록

// ✅ Feature 예시
features/auth/               // 사용자 행동 (로그인)
features/add-comment/        // 사용자 행동 (댓글 작성)
features/search/             // 사용자 행동 (검색)
```

---

### Features Layer 상세

**역할:** 사용자의 주요 상호작용 (비즈니스 가치)

```
features/
├── auth/
│   ├── ui/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── api/
│   │   ├── login.ts
│   │   └── register.ts
│   ├── model/
│   │   ├── useAuth.ts
│   │   └── authSchema.ts        # Zod 스키마
│   └── index.ts
│
├── add-comment/
│   ├── ui/
│   │   └── CommentForm.tsx
│   ├── api/
│   │   └── createComment.ts
│   ├── model/
│   │   ├── useAddComment.ts
│   │   └── commentSchema.ts
│   └── index.ts
│
└── search/
    ├── ui/
    │   ├── SearchForm.tsx
    │   └── SearchResults.tsx
    ├── api/
    │   └── searchPosts.ts
    ├── model/
    │   ├── useSearch.ts
    │   └── searchFilters.ts
    └── index.ts
```

**예시:**

```typescript
// features/add-comment/ui/CommentForm.tsx
import { useAddComment } from '../model/useAddComment';
import { useUser } from '@/entities/user';
import { Button } from '@/shared/ui/button';

export const CommentForm = ({ postId }: Props) => {
  const { currentUser } = useUser();
  const { addComment, isPending } = useAddComment();

  const handleSubmit = (text: string) => {
    addComment({ postId, text, userId: currentUser.id });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
};

// features/add-comment/index.ts
export { CommentForm } from './ui/CommentForm';
```

---

### Entities Layer 상세

**역할:** 비즈니스 엔티티 (재사용 가능한 도메인 모델)

```
entities/
├── user/
│   ├── ui/
│   │   ├── UserCard.tsx
│   │   └── UserAvatar.tsx
│   ├── api/
│   │   ├── user.queries.ts      # React Query factory
│   │   ├── getUser.ts
│   │   └── updateUser.ts
│   ├── model/
│   │   ├── types.ts             # User 타입
│   │   ├── userStore.ts         # 상태 관리
│   │   └── userSchema.ts        # Zod 스키마
│   ├── lib/
│   │   └── formatUserName.ts    # 유틸리티
│   └── index.ts
│
├── post/
│   ├── ui/
│   │   └── PostCard.tsx
│   ├── api/
│   │   ├── post.queries.ts
│   │   ├── getPosts.ts
│   │   └── createPost.ts
│   ├── model/
│   │   └── types.ts
│   ├── @x/                       # Cross-import용
│   │   └── user.ts              # entities/user가 참조 가능
│   └── index.ts
│
└── comment/
    ├── ui/
    │   └── CommentCard.tsx
    ├── api/
    │   └── comment.queries.ts
    ├── model/
    │   └── types.ts
    └── index.ts
```

**Entity의 특징:**

- **재사용 가능**: 여러 Feature에서 사용
- **도메인 중심**: 비즈니스 개념 표현
- **독립적**: 다른 Entity에 의존하지 않음 (예외: @x)

---

### Shared Layer 상세

**역할:** 비즈니스 로직과 무관한 재사용 가능한 코드

```
shared/
├── ui/                           # UI Kit
│   ├── button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── index.ts
│   ├── input/
│   ├── card/
│   └── index.ts
│
├── api/                          # API 인프라
│   ├── base-client.ts            # Axios/Fetch instance
│   ├── query-client.ts           # QueryClient 설정
│   ├── config.ts                 # API config
│   └── index.ts
│
├── lib/                          # 유틸리티
│   ├── date/
│   │   ├── formatDate.ts
│   │   └── index.ts
│   ├── string/
│   │   └── capitalize.ts
│   ├── react-query/
│   │   └── query-keys.ts         # Query key factory
│   └── index.ts
│
└── config/                       # 앱 설정
    ├── routes.ts                 # 라우트 상수
    ├── env.ts                    # 환경 변수
    └── index.ts
```

**Shared 원칙:**

```typescript
// ✅ Shared에 넣을 것
- UI Kit (Button, Input, Modal)
- API Client (axios instance)
- 유틸리티 (formatDate, capitalize)
- 타입 라이브러리 (type-fest)
- 라우트 상수

// ❌ Shared에 넣지 말 것
- 비즈니스 로직
- 도메인 타입 (User, Post) → entities로
- Feature 전용 로직
```

---

## React Query 통합 전략

### Query Key Factory 패턴

**위치 결정:**

- **엔티티별 분리 가능**: `entities/{entity}/api/{entity}.queries.ts`
- **공통 관리 필요**: `shared/api/queries/`

#### 엔티티별 분리 (권장)

```typescript
// entities/post/api/post.queries.ts
import { queryOptions } from '@tanstack/react-query';
import { getPosts, getPost } from './get-posts';

export const postQueries = {
  all: ['posts'] as const,

  lists: () =>
    queryOptions({
      queryKey: [...postQueries.all, 'list'] as const,
      queryFn: getPosts,
    }),

  list: (filters: PostFilters) =>
    queryOptions({
      queryKey: [...postQueries.all, 'list', filters] as const,
      queryFn: () => getPosts(filters),
    }),

  details: () => [...postQueries.all, 'detail'] as const,

  detail: (id: number) =>
    queryOptions({
      queryKey: [...postQueries.details(), id] as const,
      queryFn: () => getPost(id),
    }),
};

// 사용
import { useQuery } from '@tanstack/react-query';
import { postQueries } from '@/entities/post/api/post.queries';

export const PostList = () => {
  const { data: posts } = useQuery(postQueries.lists());
  // ...
};

export const PostDetail = ({ id }: Props) => {
  const { data: post } = useQuery(postQueries.detail(id));
  // ...
};
```

#### Query Key 체계

```typescript
// 계층적 Query Key 구조
['posts'][('posts', 'list')][('posts', 'list', { status: 'draft' })][('posts', 'detail')][ // 모든 post 쿼리 // 목록 쿼리 // 필터링된 목록 // 상세 쿼리
  ('posts', 'detail', 1)
]; // 특정 post

// 무효화 예시
queryClient.invalidateQueries({ queryKey: ['posts'] }); // 모든 post 쿼리 무효화
queryClient.invalidateQueries({ queryKey: ['posts', 'list'] }); // 목록만 무효화
```

---

### Mutations 처리

#### 옵션 1: 커스텀 훅 (권장)

```typescript
// entities/post/api/useCreatePost.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from './create-post';
import { postQueries } from './post.queries';

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: postQueries.all });
    },
  });
};

// entities/post/index.ts
export { useCreatePost } from './api/useCreatePost';

// 사용
import { useCreatePost } from '@/entities/post';

const { mutate: createPost } = useCreatePost();
createPost({ title: 'New Post', content: '...' });
```

#### 옵션 2: Mutation 함수 직접 사용

```typescript
// entities/post/api/create-post.ts
export const createPost = async (data: CreatePostDto) => {
  const response = await apiClient.post('/posts', data);
  return response.data;
};

// entities/post/index.ts
export { createPost } from './api/create-post';

// 사용
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, postQueries } from '@/entities/post';

const { mutate } = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: postQueries.all });
  },
});
```

---

### Optimistic Updates

```typescript
// features/add-comment/model/useAddComment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment } from '@/entities/comment';
import { postQueries } from '@/entities/post/api/post.queries';

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,

    onMutate: async (newComment) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({
        queryKey: postQueries.detail(newComment.postId),
      });

      // 이전 데이터 백업
      const previous = queryClient.getQueryData(postQueries.detail(newComment.postId).queryKey);

      // Optimistic update
      queryClient.setQueryData(postQueries.detail(newComment.postId).queryKey, (old) => ({
        ...old,
        comments: [...old.comments, { ...newComment, id: 'temp' }],
      }));

      return { previous };
    },

    onError: (err, variables, context) => {
      // 롤백
      queryClient.setQueryData(postQueries.detail(variables.postId).queryKey, context.previous);
    },

    onSettled: (data, error, variables) => {
      // 서버와 동기화
      queryClient.invalidateQueries({
        queryKey: postQueries.detail(variables.postId),
      });
    },
  });
};
```

---

### Provider 설정

```typescript
// shared/api/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5분
      cacheTime: 10 * 60 * 1000,     // 10분
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

// app/providers/QueryProvider.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/shared/api/query-client';

export const QueryProvider = ({ children }: Props) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

// app/index.tsx
import { QueryProvider } from './providers/QueryProvider';

export const App = () => {
  return (
    <QueryProvider>
      <RouterProvider />
    </QueryProvider>
  );
};
```

---

## 마이그레이션 로드맵

### 사전 검토

#### 1. FSD 도입 필요성 판단

```
✅ FSD 도입을 고려해야 할 징후:
- 신규 개발자 온보딩 3개월 이상 소요
- "이 코드가 어디서 사용되는지 모르겠다"
- 기능 추가 시 영향 범위 파악 어려움
- 페이지/기능 간 코드 충돌 빈번
- 비즈니스 로직이 프로젝트 전체에 분산

❌ FSD가 오버킬인 경우:
- 프로젝트 규모 < 20개 컴포넌트
- 단일 개발자 프로젝트
- 프로토타입/POC
```

#### 2. 팀 동의 확보

**경영진 설득 포인트:**

- 문서화된 표준 아키텍처 (학습 자료 풍부)
- 점진적 마이그레이션 가능 (리스크 최소화)
- 온보딩 시간 단축 (비용 절감)
- 기술 부채 감소 (장기적 ROI)

**개발팀 설득 포인트:**

- 코드 찾기 쉬워짐
- 기능 추가 속도 향상
- 리팩토링 안전성 증가
- 표준 구조로 논쟁 감소

---

### 단계별 마이그레이션

#### Phase 1: Pages 분리 (1-2주)

**목표:** 페이지별로 코드 분리

```bash
# Before
src/
├── components/
│   ├── HomePage.tsx
│   ├── ProfilePage.tsx
│   └── AdminPage.tsx
└── ...

# After
src/
└── pages/
    ├── home/
    │   ├── ui/HomePage.tsx
    │   └── index.ts
    ├── profile/
    │   ├── ui/ProfilePage.tsx
    │   └── index.ts
    └── admin/
        ├── ui/AdminPage.tsx
        └── index.ts
```

**작업:**

1. `src/pages/` 폴더 생성
2. 각 페이지를 `pages/{page-name}/ui/` 로 이동
3. `pages/{page-name}/index.ts` 생성하여 export
4. 라우터에서 import 경로 수정

---

#### Phase 2: App & Shared 분리 (1주)

**목표:** 전역 설정과 공통 코드 분리

```bash
# Before
src/
├── App.tsx
├── index.tsx
├── utils/
└── components/

# After
src/
├── app/
│   ├── providers/
│   ├── styles/
│   └── index.tsx
└── shared/
    ├── ui/
    ├── lib/
    └── api/
```

**작업:**

1. 페이지를 import하는 코드 → `src/app/`
2. 페이지를 import하지 않는 코드 → `src/shared/`

**판단 기준:**

```typescript
// app으로
Router.tsx; // ← pages import
StoreProvider.tsx; // ← 전역 상태
globals.css; // ← 전역 스타일

// shared로
Button.tsx; // ← UI 컴포넌트
formatDate.ts; // ← 유틸리티
apiClient.ts; // ← API 클라이언트
```

---

#### Phase 3: 페이지 간 의존성 해결 (1-2주)

**목표:** 페이지 간 import 제거

```typescript
// ❌ Before: 페이지 간 의존성
// pages/profile/ui/ProfilePage.tsx
import { UserCard } from '@/pages/home/ui/UserCard'; // 금지!

// ✅ After: shared로 이동
// shared/ui/user-card/UserCard.tsx
export const UserCard = ({ user }: Props) => { ... };

// pages/home/ui/HomePage.tsx
import { UserCard } from '@/shared/ui/user-card';

// pages/profile/ui/ProfilePage.tsx
import { UserCard } from '@/shared/ui/user-card';
```

**해결 방법:**

1. **복사-붙여넣기**: 재사용 안 되면 복제 (초기에는 허용)
2. **Shared로 이동**: 여러 페이지에서 사용하면 shared/ui로

---

#### Phase 4: Shared 정리 (1주)

**목표:** Shared에서 페이지 전용 코드 추출

```typescript
// ❌ Before: shared에 페이지 전용 로직
shared/
└── store/
    ├── homePageSlice.ts        // 홈 페이지 전용
    └── profilePageSlice.ts     // 프로필 페이지 전용

// ✅ After: 각 페이지로 이동
pages/
├── home/
│   └── model/
│       └── homePageStore.ts
└── profile/
    └── model/
        └── profilePageStore.ts
```

---

#### Phase 5: 세그먼트 정리 (1-2주)

**목표:** 각 슬라이스 내부를 표준 세그먼트로 정리

```bash
# Before
pages/home/
├── HomePage.tsx
├── useHomePage.ts
├── homePageApi.ts
└── index.ts

# After
pages/home/
├── ui/
│   └── HomePage.tsx
├── model/
│   └── useHomePage.ts
├── api/
│   └── homePageApi.ts
└── index.ts
```

---

#### Phase 6: Entities & Features 형성 (2-3주)

**목표:** 재사용 로직을 Entities/Features로 분리

**Entities 추출:**

```typescript
// Before: Redux slice가 여러 페이지에서 사용됨
shared/store/userSlice.ts  // user 관련 상태

// After: Entity로 분리
entities/user/
├── ui/
│   └── UserCard.tsx
├── model/
│   └── userStore.ts      // ← Redux slice 이동
└── index.ts
```

**Features 추출:**

```typescript
// Before: 로그인 로직이 여러 곳에 분산
pages/login/LoginForm.tsx
widgets/header/LoginButton.tsx
pages/profile/LogoutButton.tsx

// After: Feature로 통합
features/auth/
├── ui/
│   ├── LoginForm.tsx
│   ├── LoginButton.tsx
│   └── LogoutButton.tsx
├── api/
│   └── auth.ts
├── model/
│   └── authStore.ts
└── index.ts
```

---

### 마이그레이션 체크리스트

```
Phase 1: Pages
□ pages/ 폴더 생성
□ 각 페이지를 pages/{name}/ui/ 로 이동
□ index.ts로 Public API 생성
□ 라우터 import 경로 수정

Phase 2: App & Shared
□ app/ 폴더 생성 (providers, styles)
□ shared/ 폴더 생성 (ui, lib, api)
□ 전역 설정 → app
□ 공통 코드 → shared

Phase 3: 의존성 해결
□ 페이지 간 import 제거
□ 공통 컴포넌트 shared/ui로 이동

Phase 4: Shared 정리
□ 페이지 전용 코드 → 해당 페이지로
□ 진짜 공통 코드만 shared에 유지

Phase 5: 세그먼트 정리
□ ui/ 세그먼트 생성
□ api/ 세그먼트 생성
□ model/ 세그먼트 생성

Phase 6: Entities & Features
□ 재사용 엔티티 → entities/
□ 사용자 기능 → features/
```

---

## 실전 예제

### 1. 인증 (Authentication) 구현

#### 로그인/회원가입 페이지

```typescript
// pages/login/ui/LoginPage.tsx
import { LoginForm } from '@/features/auth';
import { Container } from '@/shared/ui/container';

export const LoginPage = () => {
  return (
    <Container>
      <h1>로그인</h1>
      <LoginForm />
    </Container>
  );
};

// pages/login/index.ts
export { LoginPage } from './ui/LoginPage';
```

#### 로그인 기능

```typescript
// features/auth/ui/LoginForm.tsx
import { useAuth } from '../model/useAuth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export const LoginForm = () => {
  const { login, isPending } = useAuth();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    login({
      email: formData.get('email'),
      password: formData.get('password'),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input name="email" type="email" />
      <Input name="password" type="password" />
      <Button type="submit" disabled={isPending}>
        로그인
      </Button>
    </form>
  );
};

// features/auth/model/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/login';
import { userStore } from '@/entities/user';

export const useAuth = () => {
  const navigate = useNavigate();

  const { mutate: login, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (user) => {
      userStore.setUser(user);
      navigate('/');
    },
  });

  return { login, isPending };
};

// features/auth/api/login.ts
import { apiClient } from '@/shared/api/base-client';

export const login = async (credentials: LoginDto) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

// features/auth/index.ts
export { LoginForm } from './ui/LoginForm';
export { useAuth } from './model/useAuth';
```

#### 토큰 저장 (Entities)

```typescript
// entities/user/model/userStore.ts
import create from 'zustand';

interface UserState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const userStore = create<UserState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    set({ token });
    localStorage.setItem('token', token);
  },
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  },
}));

// entities/user/index.ts
export { userStore } from './model/userStore';
export { useUser } from './model/useUser';
```

---

### 2. API 처리

#### Shared API Client

```typescript
// shared/api/base-client.ts
import axios from 'axios';
import { API_CONFIG } from './config';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// shared/api/config.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
};

// shared/api/index.ts
export { apiClient } from './base-client';
export { queryClient } from './query-client';
```

#### Entity API

```typescript
// entities/post/api/get-posts.ts
import { apiClient } from '@/shared/api/base-client';
import type { Post, PostDto } from '../model/types';

export const getPosts = async (): Promise<Post[]> => {
  const response = await apiClient.get<PostDto[]>('/posts');
  return response.data.map(mapPostDto);
};

export const getPost = async (id: number): Promise<Post> => {
  const response = await apiClient.get<PostDto>(`/posts/${id}`);
  return mapPostDto(response.data);
};

// DTO → Domain 매퍼
const mapPostDto = (dto: PostDto): Post => ({
  id: dto.post_id,
  title: dto.title,
  content: dto.content,
  authorId: dto.author_id,
  createdAt: new Date(dto.created_at),
});

// entities/post/api/post.queries.ts
import { queryOptions } from '@tanstack/react-query';
import { getPosts, getPost } from './get-posts';

export const postQueries = {
  all: ['posts'] as const,

  lists: () =>
    queryOptions({
      queryKey: [...postQueries.all, 'list'],
      queryFn: getPosts,
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: [...postQueries.all, 'detail', id],
      queryFn: () => getPost(id),
    }),
};

// entities/post/index.ts
export { postQueries } from './api/post.queries';
export type { Post } from './model/types';
```

---

### 3. 타입 관리

#### Entity 타입

```typescript
// entities/user/model/types.ts
export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

// DTO (백엔드 응답)
export interface UserDto {
  user_id: number;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

// entities/user/index.ts
export type { User, UserDto } from './model/types';
```

#### 엔티티 간 참조 (@x)

```typescript
// entities/post/model/types.ts
import type { User } from '@/entities/user/@x/post';

export interface Post {
  id: number;
  title: string;
  content: string;
  author: User; // ← entities/user 참조
  createdAt: Date;
}

// entities/user/@x/post.ts (특별한 Public API)
export type { User } from '../model/types';

// entities/user/index.ts (일반 Public API)
export type { User } from './model/types'; // 다른 곳에서 사용
```

#### Shared 유틸리티 타입

```typescript
// shared/lib/types/utility.ts
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Loadable<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

// 또는 type-fest 사용
import type { Simplify, PartialDeep } from 'type-fest';

// shared/lib/types/index.ts
export type { Nullable, Optional, Loadable } from './utility';
```

---

## Anti-patterns와 Best Practices

### Anti-pattern 1: 기술 기반 폴더

```typescript
// ❌ 나쁜 예: 기술 기반
src/
├── components/
│   ├── UserCard.tsx
│   └── PostCard.tsx
├── hooks/
│   ├── useUser.ts
│   └── usePost.ts
└── types/
    ├── user.ts
    └── post.ts

// ✅ 좋은 예: 도메인 기반
src/
└── entities/
    ├── user/
    │   ├── ui/UserCard.tsx
    │   ├── model/useUser.ts
    │   └── model/types.ts
    └── post/
        ├── ui/PostCard.tsx
        ├── model/usePost.ts
        └── model/types.ts
```

---

### Anti-pattern 2: 거대한 Shared

```typescript
// ❌ 나쁜 예: 모든 것을 shared에
shared/
├── components/         # 100+ 컴포넌트
├── utils/              # 모든 유틸리티
├── hooks/              # 모든 훅
└── types/              # 모든 타입

// ✅ 좋은 예: 필요한 것만 shared
shared/
├── ui/                 # 순수 UI 컴포넌트만
│   ├── button/
│   ├── input/
│   └── modal/
├── lib/                # 범용 유틸리티만
│   ├── date/
│   └── string/
└── api/                # API 인프라만
    └── base-client.ts
```

---

### Anti-pattern 3: Feature와 Entity 혼동

```typescript
// ❌ 나쁜 예
features/user/          // "user"는 엔티티
features/post/          // "post"는 엔티티

// ✅ 좋은 예
entities/user/          // 비즈니스 엔티티
entities/post/

features/add-comment/   // 사용자 행동
features/edit-profile/  // 사용자 행동
```

**판단 기준:**

- **Entity**: "이게 실제 세계의 개념인가?" → Yes
- **Feature**: "이게 사용자가 하는 행동인가?" → Yes

---

### Anti-pattern 4: Public API 무시

```typescript
// ❌ 나쁜 예: 내부 구조 직접 접근
import { UserCard } from '@/entities/user/ui/UserCard';
import { useUser } from '@/entities/user/model/useUser';

// ✅ 좋은 예: Public API 사용
import { UserCard, useUser } from '@/entities/user';
```

---

### Anti-pattern 5: 순환 의존성

```typescript
// ❌ 나쁜 예: 순환 의존
// features/add-comment/index.ts
export { CommentForm } from './ui/CommentForm';

// features/edit-comment/ui/EditCommentForm.tsx
import { CommentForm } from '@/features/add-comment';  // features → features 금지!

// ✅ 좋은 예 1: 공통 부분 Entity로
entities/comment/
└── ui/
    └── CommentFormBase.tsx    // 공통 폼

features/add-comment/
└── ui/
    └── AddCommentForm.tsx     // CommentFormBase 사용

features/edit-comment/
└── ui/
    └── EditCommentForm.tsx    // CommentFormBase 사용

// ✅ 좋은 예 2: Widget으로
widgets/comment-form/
└── ui/
    └── CommentForm.tsx        // 재사용 가능한 위젯

features/add-comment/
└── ui/
    └── AddCommentButton.tsx   // Widget 조합

features/edit-comment/
└── ui/
    └── EditCommentButton.tsx  // Widget 조합
```

---

### Best Practice 1: 작게 시작하기

```typescript
// 초기에는 간단하게
entities/user/
├── model/
│   └── types.ts
└── index.ts

// 필요할 때 확장
entities/user/
├── ui/
│   └── UserCard.tsx
├── api/
│   └── user.queries.ts
├── model/
│   ├── types.ts
│   └── userStore.ts
└── index.ts
```

---

### Best Practice 2: Public API 엄격하게

```typescript
// entities/user/index.ts

// ✅ 명시적 export
export { UserCard } from './ui/UserCard';
export { useUser } from './model/useUser';
export type { User } from './model/types';

// ❌ 와일드카드 export (지양)
export * from './ui';
export * from './model';
```

---

### Best Practice 3: 슬라이스 이름 표준화

```typescript
// ✅ 좋은 이름
entities/user/              // 명사
entities/product/

features/add-to-cart/       // 동사-명사
features/search-products/
features/toggle-theme/      // 동사-명사

pages/home/                 // 라우트명
pages/product-detail/

// ❌ 나쁜 이름
entities/user-entity/       // 불필요한 접미사
features/shopping/          // 너무 추상적
features/click-button/      // 기술적 이름
pages/HomePage/             // PascalCase (kebab-case 권장)
```

---

## 도구 및 생태계

### ESLint Plugin

```bash
npm install -D @feature-sliced/eslint-config
```

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@feature-sliced'],
  rules: {
    // Import 규칙 강제
    '@feature-sliced/layers-slices': 'error',
    '@feature-sliced/public-api': 'error',
  },
};
```

**감지하는 규칙:**

- ✅ Layer 간 의존성 위반 감지
- ✅ Public API 우회 접근 감지
- ✅ 순환 의존성 감지

---

### Steiger (Architecture Linter)

```bash
npm install -D @steiger/eslint-plugin
```

**기능:**

- 슬라이스 간 의존성 그래프 생성
- 아키텍처 위반 자동 감지
- 복잡도 측정

---

### FSD CLI (개발 중)

```bash
npx @feature-sliced/cli create entity user
# entities/user/ 폴더 구조 자동 생성
```

---

## FAQ 및 트러블슈팅

### Q1: "Widgets와 Features 구분이 어렵습니다"

**A:**

- **Widget**: UI 블록 (재사용 가능한 UI 조합)
- **Feature**: 사용자 행동 (비즈니스 가치)

```typescript
// Widget 예시
widgets/header/          // 헤더 UI
widgets/sidebar/         // 사이드바 UI
widgets/post-list/       // 게시물 목록 UI

// Feature 예시
features/auth/           // 로그인/회원가입 (행동)
features/add-comment/    // 댓글 작성 (행동)
features/search/         // 검색 (행동)
```

**팁:** "이게 버튼을 누르는 행동과 관련이 있나?" → Feature

---

### Q2: "Entity와 Feature 구분이 어렵습니다"

**A:**

- **Entity**: 비즈니스 개념 (명사)
- **Feature**: 사용자 과업 (동사-명사)

```typescript
// Entity: "이게 실제 세계에 존재하는 개념인가?"
entities/user/           // 사용자 (존재함)
entities/product/        // 상품 (존재함)
entities/order/          // 주문 (존재함)

// Feature: "이게 사용자가 하는 행동인가?"
features/add-to-cart/    // 장바구니에 추가하기
features/place-order/    // 주문하기
features/leave-review/   // 리뷰 작성하기
```

---

### Q3: "Shared에 뭘 넣어야 할지 모르겠습니다"

**A:**

```typescript
// ✅ Shared에 넣을 것
- 순수 UI 컴포넌트 (Button, Input)
- 범용 유틸리티 (formatDate, capitalize)
- API 인프라 (axios instance)
- 타입 라이브러리 (type-fest)

// ❌ Shared에 넣지 말 것
- 비즈니스 로직
- 도메인 타입 (User, Post)
- Feature 전용 컴포넌트
```

**판단 기준:** "이게 다른 프로젝트에서도 쓸 수 있나?" → Yes면 Shared

---

### Q4: "Pages가 너무 간단한데 굳이 필요한가요?"

**A:** 네, 필요합니다.

```typescript
// Pages는 "조합"의 역할
pages/home/ui/HomePage.tsx

import { PostList } from '@/widgets/post-list';
import { SearchForm } from '@/features/search';
import { Container } from '@/shared/ui/container';

export const HomePage = () => {
  return (
    <Container>
      <SearchForm />
      <PostList />
    </Container>
  );
};
```

**이점:**

- 라우트와 UI 조합 분리
- Feature/Widget 재사용성 향상
- 페이지별 최적화 (Code Splitting) 용이

---

### Q5: "마이그레이션 중 기존 기능이 동작 안 합니다"

**A:** 단계별 롤백 계획을 수립하세요.

```bash
# 각 Phase마다 Git Commit
git commit -m "Phase 1: Pages 분리 완료"

# 문제 발생 시 롤백
git revert HEAD
```

**팁:**

- 각 Phase마다 충분한 테스트
- Feature Flag로 점진적 배포
- 한 번에 너무 많이 변경하지 않기

---

## 결론

### FSD의 핵심 가치

1. **명시성**: 구조가 비즈니스를 반영
2. **제어**: 기능 추가/수정/삭제 용이
3. **적응성**: 프레임워크 독립적, 점진적 마이그레이션

### 시작하기

```
1. 소규모로 시작: 1-2개 페이지만 먼저 전환
2. 팀과 공유: 문서 읽기 & 워크샵
3. 도구 활용: ESLint Plugin으로 규칙 강제
4. 점진적 확장: 한 번에 하나씩
```

### 추가 학습 자료

- 공식 문서: https://feature-sliced.design/
- GitHub: https://github.com/feature-sliced/documentation
- Discord: https://discord.gg/S8MzWTUsmp

---

**이 가이드가 FSD 도입에 도움이 되기를 바랍니다!** 🚀
