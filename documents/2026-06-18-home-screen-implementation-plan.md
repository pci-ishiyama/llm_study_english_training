# Home Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the home screen so authenticated users can see their greeting, learning status, recommended scenario, progress summary, and navigation shortcuts defined in the requirements and screen design.

**Architecture:** Keep the existing route structure and replace the `HomePage` placeholder with a data-driven page composed from small presentational components and a focused page hook. Use existing frontend API modules (`users.ts`, `history.ts`, `scenarios.ts`) plus a new dashboard API adapter if the backend supports it; otherwise compose the dashboard view from existing user, history, and scenario APIs without changing the user-facing contract. Protect the route with the existing `PrivateRoute` and reuse the current `Header`.

**Tech Stack:** React 18, TypeScript, React Router, existing API client helpers, Vitest, Testing Library

---

## この計画書の説明（初心者向け）

このドキュメントは、「ホーム画面をどういう順番で実装するか」を細かい作業単位に分けた実装計画書です。

### この計画書でわかること
- どのファイルを新しく作るのか
- どのファイルを修正するのか
- それぞれの作業が何のために必要なのか
- 作業後に何を確認すれば「できた」と判断できるのか

### この計画書の読み方
- `Task 1`, `Task 2` のように、作業を大きなまとまりごとに分けています。
- 各 Task の中の `Step 1`, `Step 2` は、実際の作業手順です。
- `Write the failing test` は「まず失敗するテストを書く」という意味です。いきなり本番コードを書くのではなく、先に期待する動きをテストで決めることで、実装漏れを防ぎます。
- `Run test to verify it fails` は「そのテストが今はまだ失敗することを確認する」という意味です。
- `Implement minimal ...` は「テストを通すための最小限の実装を入れる」という意味です。
- `Run test to verify it passes` は「実装後にテストが成功することを確認する」という意味です。

### この計画書の実装方針を簡単に言うと
今回のホーム画面は、1つの大きなファイルに全部を書くのではなく、役割ごとに小さく分けて作ります。
たとえば、次のように分担します。
- データ取得を担当する部分
- 挨拶を表示する部分
- 学習ステータスを表示する部分
- 推奨シナリオを表示する部分
- 進捗を表示する部分

この分け方にする理由は、初心者でも「どこに何が書いてあるか」を追いやすくなり、レビューもしやすくなるためです。

### この計画書で使う主な用語
- **Hook（フック）**: React で、データ取得や状態管理の処理をまとめる仕組みです。今回の `useHomePage` は、ホーム画面で必要なデータをまとめて取得・整理する役目です。
- **Presentational Component**: 見た目の表示を担当する部品です。複雑な処理はなるべく持たせず、受け取ったデータを画面に表示することに集中します。
- **API**: バックエンドからデータを取得するための窓口です。今回でいえば、ユーザー情報・履歴・シナリオなどを取得する処理です。
- **View Model**: 画面で表示しやすい形に整理したデータです。APIの生データをそのまま使わず、画面向けに整えたものを指します。
- **Retry（再読み込み）**: データ取得に失敗したときに、もう一度取得を試すことです。

### この計画書で実現したいホーム画面
ホーム画面では、画面設計書と機能要件定義書に基づいて、少なくとも次を表示できるようにする想定です。
- ユーザーへの挨拶
- 学習状況（今週の回数、連続日数、平均スコア）
- 今日おすすめのシナリオ
- すぐに次の操作へ進めるボタンやリンク
- 最近の学習の進み具合

### レビューするときの見方
レビュー担当者は、次の点を見ると計画の良し悪しを判断しやすいです。
- ホーム画面に必要な要素が抜けていないか
- 1つの Task が大きすぎないか
- テスト手順が含まれているか
- 変更対象ファイルが具体的に書かれているか
- 「成功したと判断する条件」が明確か

---

## File Structure

### この章の説明
ここでは、「どのファイルを触る予定か」を先に整理しています。
実装に入る前にファイル単位で見通しを立てることで、作業中に迷いにくくなります。
「Create」は新しく作るファイル、「Modify」は既存ファイルを修正する場所です。

**Modify**
- `src/frontend/src/pages/HomePage.tsx` — replace placeholder with the full home screen container
- `src/frontend/src/pages/HomePage.test.tsx` — add page-level tests for loading, success, error, and navigation behavior
- `src/frontend/src/types/index.ts` — extend types only if required by the actual API response used for dashboard data
- `src/frontend/src/api/users.ts` — reuse `getUser`; only modify if a `getCurrentUserProfile` helper is needed to match existing auth state
- `src/frontend/src/api/history.ts` — reuse `getHistory`; only modify if query parameters for dashboard summary are already supported by backend
- `src/frontend/src/api/scenarios.ts` — reuse `getScenarios` for recommendation fallback if needed

**Create**
- `src/frontend/src/api/dashboard.ts` — dashboard fetcher if backend already exposes dashboard data
- `src/frontend/src/hooks/useHomePage.ts` — orchestrates page data fetch and derived display state
- `src/frontend/src/hooks/useHomePage.test.ts` — hook tests for data composition and error handling
- `src/frontend/src/components/home/GreetingCard.tsx` — greeting and user summary
- `src/frontend/src/components/home/LearningStatusCard.tsx` — weekly count, streak, average score
- `src/frontend/src/components/home/RecommendedScenarioCard.tsx` — recommended scenario and CTA
- `src/frontend/src/components/home/QuickStartActions.tsx` — primary navigation actions
- `src/frontend/src/components/home/ProgressChart.tsx` — simple recent score trend display using plain HTML/CSS
- `src/frontend/src/components/home/HomeSection.tsx` — lightweight shared section wrapper for consistent spacing

**Test**
- `src/frontend/src/hooks/useHomePage.test.ts`
- `src/frontend/src/pages/HomePage.test.tsx`

## Implementation Notes

- Source basis:
  - `documents/画面設計書.md` defines the home screen as SCR-001 with greeting text, learning status card, recommended scenario, quick start button, scenario/history links, and progress graph.
  - `documents/機能要件定義書.md` requires profile display, progress dashboard, and recommended scenario behavior.
- Current implementation gap:
  - `src/frontend/src/pages/HomePage.tsx` is only a placeholder with `Step4 で実装予定`.
- Data assumptions to verify during implementation:
  - If backend already returns `DashboardData`, use it directly.
  - If not, compose the UI from `User`, `HistoryResponse`, and `Scenario[]` using deterministic frontend derivation.
- Keep implementation YAGNI:
  - No chart library unless already present.
  - No new global state unless multiple existing screens already need the same dashboard data.

---

### Task 1: Verify home screen data contract and choose API strategy

**このタスクの目的（日本語説明）**
最初に、ホーム画面に必要なデータを「どこから取るのか」をはっきりさせるタスクです。
ここが曖昧なまま画面だけ作り始めると、後で API と合わずに作り直しになる可能性があります。
このタスクでは、既存 API だけで足りるのか、新しい `dashboard.ts` が必要なのかを判断します。

**Files:**
- Read: `documents/画面設計書.md`
- Read: `documents/機能要件定義書.md`
- Read: `src/frontend/src/api/users.ts`
- Read: `src/frontend/src/api/history.ts`
- Read: `src/frontend/src/api/scenarios.ts`
- Read: `src/frontend/src/types/index.ts`
- Optional Create: `src/frontend/src/api/dashboard.ts`

- [ ] **Step 1: Write the failing hook contract test for the chosen data source**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useHomePage } from '@hooks/useHomePage';

vi.mock('@api/users', () => ({
  getUser: vi.fn(),
}));
vi.mock('@api/history', () => ({
  getHistory: vi.fn(),
}));
vi.mock('@api/scenarios', () => ({
  getScenarios: vi.fn(),
}));

describe('useHomePage', () => {
  it('builds the home screen view model from existing APIs', async () => {
    const { result } = renderHook(() => useHomePage('user-123'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(
      expect.objectContaining({
        greetingName: expect.any(String),
        weeklyCount: expect.any(Number),
        streakDays: expect.any(Number),
        averageScore: expect.any(Number),
        recommendedScenario: expect.objectContaining({
          scenarioId: expect.any(String),
        }),
        recentScores: expect.any(Array),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd src/frontend
npm test -- src/hooks/useHomePage.test.ts
```

Expected: FAIL because `useHomePage` does not exist yet.

- [ ] **Step 3: Implement the minimal hook and dashboard adapter**

```typescript
import { useEffect, useMemo, useState } from 'react';
import { getUser } from '@api/users';
import { getHistory } from '@api/history';
import { getScenarios } from '@api/scenarios';
import type { DashboardData, HistoryItem, Scenario, User } from '@appTypes/index';

interface HomePageViewData extends DashboardData {
  greetingName: string;
  englishLevel: User['englishLevel'];
  learningGoal?: string;
}

export const useHomePage = (userId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HomePageViewData | null>(null);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const [userRes, historyRes, scenariosRes] = await Promise.all([
          getUser(userId),
          getHistory({ limit: 10 }),
          getScenarios(),
        ]);

        if (!active) return;
        if (!userRes.success || userRes.data === null) throw new Error('ユーザー情報の取得に失敗しました');
        if (!historyRes.success || historyRes.data === null) throw new Error('学習履歴の取得に失敗しました');
        if (!scenariosRes.success || scenariosRes.data === null) throw new Error('シナリオ一覧の取得に失敗しました');

        const items = historyRes.data.items;
        const weeklyCount = items.filter((item) => isWithinLastDays(item.createdAt, 7)).length;
        const averageScore = items.length === 0 ? 0 : Math.round(items.reduce((sum, item) => sum + item.overallScore, 0) / items.length);
        const recentScores = items
          .slice(0, 7)
          .reverse()
          .map((item) => ({ date: item.createdAt.slice(5, 10), score: item.overallScore }));
        const recommendedScenario = pickRecommendedScenario(scenariosRes.data, items);

        setData({
          greetingName: userRes.data.name,
          englishLevel: userRes.data.englishLevel,
          learningGoal: userRes.data.learningGoal,
          weeklyCount,
          streakDays: calculateStreakDays(items),
          averageScore,
          recentScores,
          recommendedScenario,
        });
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'ホーム画面の読み込みに失敗しました');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [userId]);

  return useMemo(() => ({ isLoading, error, data }), [isLoading, error, data]);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd src/frontend
npm test -- src/hooks/useHomePage.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/hooks/useHomePage.ts src/frontend/src/hooks/useHomePage.test.ts src/frontend/src/api/dashboard.ts src/frontend/src/types/index.ts
git commit -m "feat: add home screen data hook"
```

---

### Task 2: Build reusable home screen UI sections

**このタスクの目的（日本語説明）**
次に、ホーム画面を構成する見た目の部品を作ります。
いきなりページ全体を1つのファイルで作るのではなく、挨拶カード、学習ステータス、推奨シナリオ、進捗表示などを小さな部品に分けて作ることで、あとで修正しやすくなります。
このタスクでは「画面に何を表示するか」を形にするのが目的です。

**Files:**
- Create: `src/frontend/src/components/home/HomeSection.tsx`
- Create: `src/frontend/src/components/home/GreetingCard.tsx`
- Create: `src/frontend/src/components/home/LearningStatusCard.tsx`
- Create: `src/frontend/src/components/home/RecommendedScenarioCard.tsx`
- Create: `src/frontend/src/components/home/QuickStartActions.tsx`
- Create: `src/frontend/src/components/home/ProgressChart.tsx`
- Test: `src/frontend/src/pages/HomePage.test.tsx`

- [ ] **Step 1: Write the failing page rendering test for the documented home sections**

```typescript
it('renders all documented home sections after data loads', async () => {
  render(<HomePage />);

  expect(await screen.findByText('学習ステータス')).toBeInTheDocument();
  expect(screen.getByText('今日の推奨シナリオ')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'トレーニングを開始' })).toBeInTheDocument();
  expect(screen.getByText('学習の進捗')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'シナリオ一覧を見る' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '学習履歴を見る' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd src/frontend
npm test -- src/pages/HomePage.test.tsx
```

Expected: FAIL because `HomePage` still shows the placeholder only.

- [ ] **Step 3: Implement minimal presentational components**

```typescript
// GreetingCard.tsx
import React from 'react';

interface GreetingCardProps {
  name: string;
  englishLevel: string;
  learningGoal?: string;
}

const GreetingCard: React.FC<GreetingCardProps> = ({ name, englishLevel, learningGoal }) => (
  <section aria-label="挨拶テキスト">
    <h2>{`こんにちは、${name}さん`}</h2>
    <p>{`現在の英語レベル: ${englishLevel}`}</p>
    {learningGoal ? <p>{`学習目標: ${learningGoal}`}</p> : null}
  </section>
);

export default GreetingCard;
```

```typescript
// LearningStatusCard.tsx
import React from 'react';

interface LearningStatusCardProps {
  weeklyCount: number;
  streakDays: number;
  averageScore: number;
}

const LearningStatusCard: React.FC<LearningStatusCardProps> = ({ weeklyCount, streakDays, averageScore }) => (
  <section aria-labelledby="learning-status-title">
    <h3 id="learning-status-title">学習ステータス</h3>
    <dl>
      <div><dt>今週の実施回数</dt><dd>{weeklyCount}回</dd></div>
      <div><dt>連続学習日数</dt><dd>{streakDays}日</dd></div>
      <div><dt>平均スコア</dt><dd>{averageScore}点</dd></div>
    </dl>
  </section>
);

export default LearningStatusCard;
```

```typescript
// RecommendedScenarioCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { Scenario } from '@appTypes/index';

interface RecommendedScenarioCardProps {
  scenario: Scenario;
}

const RecommendedScenarioCard: React.FC<RecommendedScenarioCardProps> = ({ scenario }) => (
  <section aria-labelledby="recommended-scenario-title">
    <h3 id="recommended-scenario-title">今日の推奨シナリオ</h3>
    <h4>{scenario.title}</h4>
    <p>{scenario.description}</p>
    <p>{`難易度: ${scenario.difficulty}`}</p>
    <Link to="/session/new">トレーニングを開始</Link>
  </section>
);

export default RecommendedScenarioCard;
```

```typescript
// QuickStartActions.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const QuickStartActions: React.FC = () => (
  <nav aria-label="クイックスタート">
    <Link to="/session/new">シナリオ一覧を見る</Link>
    <Link to="/history">学習履歴を見る</Link>
  </nav>
);

export default QuickStartActions;
```

```typescript
// ProgressChart.tsx
import React from 'react';

interface ProgressChartProps {
  scores: { date: string; score: number }[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ scores }) => (
  <section aria-labelledby="progress-chart-title">
    <h3 id="progress-chart-title">学習の進捗</h3>
    <ul>
      {scores.map((point) => (
        <li key={`${point.date}-${point.score}`}>{`${point.date}: ${point.score}点`}</li>
      ))}
    </ul>
  </section>
);

export default ProgressChart;
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd src/frontend
npm test -- src/pages/HomePage.test.tsx
```

Expected: PASS for section rendering test.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/home src/frontend/src/pages/HomePage.test.tsx
git commit -m "feat: add home screen presentational components"
```

---

### Task 3: Replace the placeholder HomePage with the actual screen

**このタスクの目的（日本語説明）**
ここで初めて、今のプレースホルダーの `HomePage` を本物のホーム画面に差し替えます。
Task 1 で作ったデータ取得処理と、Task 2 で作った表示部品を組み合わせて、実際にユーザーが使う画面を完成させます。
また、読み込み中やエラー時の表示もこの段階で実装します。

**Files:**
- Modify: `src/frontend/src/pages/HomePage.tsx`
- Modify: `src/frontend/src/pages/HomePage.test.tsx`
- Read: `src/frontend/src/components/common/Header.tsx`
- Read: `src/frontend/src/components/common/ErrorMessage.tsx`
- Read: `src/frontend/src/components/common/LoadingSpinner.tsx`

- [ ] **Step 1: Write the failing integration test for loading, success, and retry behavior**

```typescript
it('shows a loading state first and then renders the home dashboard', async () => {
  render(<HomePage />);

  expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  expect(await screen.findByText('今日の推奨シナリオ')).toBeInTheDocument();
});

it('shows an error message and retry button when loading fails', async () => {
  mockUseHomePage.mockReturnValue({
    isLoading: false,
    error: 'ホーム画面の読み込みに失敗しました',
    data: null,
    reload: mockReload,
  });

  render(<HomePage />);

  expect(screen.getByText('ホーム画面の読み込みに失敗しました')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '再読み込み' }));
  expect(mockReload).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd src/frontend
npm test -- src/pages/HomePage.test.tsx
```

Expected: FAIL because `HomePage` has no loading or error states yet.

- [ ] **Step 3: Implement the page container**

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import GreetingCard from '@components/home/GreetingCard';
import LearningStatusCard from '@components/home/LearningStatusCard';
import RecommendedScenarioCard from '@components/home/RecommendedScenarioCard';
import QuickStartActions from '@components/home/QuickStartActions';
import ProgressChart from '@components/home/ProgressChart';
import { useAuth } from '@hooks/useAuth';
import { useHomePage } from '@hooks/useHomePage';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.userId ?? '';
  const { isLoading, error, data, reload } = useHomePage(userId);

  if (isLoading) {
    return <main><p>読み込み中...</p></main>;
  }

  if (error || data === null) {
    return (
      <main>
        <h2>🏠 ホーム</h2>
        <p>{error ?? 'ホーム画面の読み込みに失敗しました'}</p>
        <button type="button" onClick={reload}>再読み込み</button>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px 24px', maxWidth: '960px', margin: '0 auto' }}>
      <GreetingCard
        name={data.greetingName}
        englishLevel={data.englishLevel}
        learningGoal={data.learningGoal}
      />
      <LearningStatusCard
        weeklyCount={data.weeklyCount}
        streakDays={data.streakDays}
        averageScore={data.averageScore}
      />
      <RecommendedScenarioCard scenario={data.recommendedScenario} />
      <QuickStartActions />
      <ProgressChart scores={data.recentScores} />
      <Link to="/settings">プロフィールを編集</Link>
    </main>
  );
};

export default HomePage;
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd src/frontend
npm test -- src/pages/HomePage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/HomePage.tsx src/frontend/src/pages/HomePage.test.tsx
git commit -m "feat: implement home page dashboard"
```

---

### Task 4: Add navigation and recommendation behavior required by the design

**このタスクの目的（日本語説明）**
このタスクでは、ホーム画面を「見えるだけの画面」で終わらせず、実際に次の画面へ移動できるようにします。
たとえば、シナリオ一覧へ進む、履歴を見る、推奨シナリオを決める、といった動きの部分を実装します。
画面設計書で求められている導線を満たすためのタスクです。

**Files:**
- Modify: `src/frontend/src/pages/HomePage.test.tsx`
- Modify: `src/frontend/src/components/home/RecommendedScenarioCard.tsx`
- Modify: `src/frontend/src/components/home/QuickStartActions.tsx`
- Modify: `src/frontend/src/hooks/useHomePage.ts`

- [ ] **Step 1: Write the failing interaction tests for the required navigation paths**

```typescript
it('navigates to scenario selection from the quick link', async () => {
  render(<HomePage />);

  await userEvent.click(await screen.findByRole('link', { name: 'シナリオ一覧を見る' }));
  expect(mockNavigate).toHaveBeenCalledWith('/session/new');
});

it('navigates to history from the quick link', async () => {
  render(<HomePage />);

  await userEvent.click(await screen.findByRole('link', { name: '学習履歴を見る' }));
  expect(mockNavigate).toHaveBeenCalledWith('/history');
});

it('shows a recommended scenario that matches the learner profile when history exists', async () => {
  render(<HomePage />);

  expect(await screen.findByText('今日の推奨シナリオ')).toBeInTheDocument();
  expect(screen.getByText('障害報告ミーティング')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd src/frontend
npm test -- src/pages/HomePage.test.tsx
```

Expected: FAIL if the current implementation only renders links without verifying the documented recommendation and navigation behavior.

- [ ] **Step 3: Implement minimal recommendation and navigation logic**

```typescript
const pickRecommendedScenario = (scenarios: Scenario[], historyItems: HistoryItem[]): Scenario => {
  const practicedIds = new Set(historyItems.map((item) => item.scenarioId));
  const unpracticed = scenarios.find((scenario) => !practicedIds.has(scenario.scenarioId));
  return unpracticed ?? scenarios[0];
};
```

```typescript
interface QuickStartActionsProps {
  onOpenScenarios: () => void;
  onOpenHistory: () => void;
}

const QuickStartActions: React.FC<QuickStartActionsProps> = ({ onOpenScenarios, onOpenHistory }) => (
  <nav aria-label="クイックスタート">
    <button type="button" onClick={onOpenScenarios}>シナリオ一覧を見る</button>
    <button type="button" onClick={onOpenHistory}>学習履歴を見る</button>
  </nav>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd src/frontend
npm test -- src/pages/HomePage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/hooks/useHomePage.ts src/frontend/src/components/home/RecommendedScenarioCard.tsx src/frontend/src/components/home/QuickStartActions.tsx src/frontend/src/pages/HomePage.test.tsx
git commit -m "feat: add home page recommendation and navigation behavior"
```

---

### Task 5: Run full frontend verification and prepare deployment handoff

**このタスクの目的（日本語説明）**
最後に、追加したコードが他の画面や既存機能を壊していないかをまとめて確認します。
個別テストだけでなく、フロントエンド全体のテスト、Lint、Build を実行し、デプロイ後に何を確認すればよいかまで整理します。
ここまで終わってはじめて、「ホーム画面実装が完了した」と言いやすくなります。

**Files:**
- Verify: `src/frontend/src/pages/HomePage.tsx`
- Verify: `src/frontend/src/hooks/useHomePage.ts`
- Verify: `src/frontend/src/components/home/*`
- Verify: `src/frontend/src/pages/HomePage.test.tsx`

- [ ] **Step 1: Run the focused home screen tests**

Run:
```bash
cd src/frontend
npm test -- src/hooks/useHomePage.test.ts src/pages/HomePage.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

Run:
```bash
cd src/frontend
npm test
```

Expected: PASS with global branch coverage at or above 80%.

- [ ] **Step 3: Run lint and build**

Run:
```bash
cd src/frontend
npm run lint
npm run build
```

Expected: both commands PASS.

- [ ] **Step 4: Smoke check the deployed home screen manually**

Run after frontend deployment:
```bash
# deploy using the existing CodeBuild / S3 / CloudFront flow
```

Expected manual result:
- Login succeeds
- Home screen no longer shows `Step4 で実装予定`
- Greeting, learning status, recommended scenario, quick links, and progress section are visible
- Scenario and history shortcuts navigate correctly

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/HomePage.tsx src/frontend/src/pages/HomePage.test.tsx src/frontend/src/hooks/useHomePage.ts src/frontend/src/hooks/useHomePage.test.ts src/frontend/src/components/home
git commit -m "feat: implement home screen"
```

---

## Self-Review

### この章の説明
この章は、「この計画書に抜け漏れがないか」を確認するための自己点検です。
実装前の段階で、要件漏れ・あいまいな表現・型や名前の不一致がないかを見直すために入れています。

### Spec coverage
- SCR-001 home screen greeting text → covered in Tasks 2 and 3
- SCR-001 learning status card → covered in Tasks 2 and 3
- SCR-001 recommended scenario → covered in Tasks 1, 2, and 4
- SCR-001 quick start / links → covered in Tasks 2, 3, and 4
- SCR-001 progress graph → covered in Tasks 1, 2, and 3
- F-002 profile summary visibility on home → covered in Tasks 1 and 3
- F-010 progress dashboard → covered in Tasks 1 and 3
- F-011 recommended scenario presentation → covered in Tasks 1 and 4

### Placeholder scan
- No `TODO`, `TBD`, or “implement later” placeholders remain in tasks.
- Each code-changing step includes concrete code.
- Each validation step includes explicit commands and expected outcomes.

### Type consistency
- `DashboardData`, `User`, `HistoryItem`, and `Scenario` are used consistently.
- `useHomePage` is the single source for the page view model.
- `HomePage` consumes the same data shape the hook defines.

Plan complete and saved to `documents/2026-06-18-home-screen-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?