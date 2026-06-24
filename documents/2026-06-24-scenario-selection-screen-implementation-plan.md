# SCR-002 シナリオ選択画面 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SCR-002（シナリオ選択画面）を実装し、認証済みユーザーが難易度フィルターでシナリオを絞り込み、選択したシナリオで対話トレーニングを開始できるようにする。

**Architecture:** 既存の `SessionNewPage.tsx`（プレースホルダー）を本実装に差し替える。データ取得は `useScenarioSelection` カスタムフックで担い、UI は `src/components/scenario/` 配下に新規コンポーネントとして切り出す。

---

## 1. コンテキストと前提条件

### 1.1 画面概要（画面設計書 SCR-002 より）

| 項目 | 内容 |
|------|------|
| 画面ID | SCR-002 |
| 画面名 | シナリオ選択画面 |
| 遷移元 | SCR-001（ホーム画面）「シナリオを選ぶ」ボタン |
| 遷移先 | SCR-003（対話画面）セッション開始後 |
| 認証要否 | 必須（未認証時は SCR-000 ログイン画面へリダイレクト） |

### 1.2 表示要素

- **ページタイトル**：「シナリオを選択」
- **難易度フィルター**：`beginner` / `intermediate` / `advanced` / `all`（デフォルト: `all`）
- **シナリオカード一覧**：フィルター結果を表示
  - カード内容：タイトル、説明、難易度バッジ、推定時間
- **「開始する」ボタン**：カード選択後に活性化 → セッション作成 API を呼び出し SCR-003 へ遷移
- **ローディング表示**：API 取得中
- **エラー表示**：API 失敗時

### 1.3 既存コードの状態

| ファイル | 状態 |
|----------|------|
| `src/frontend/src/pages/SessionNewPage.tsx` | プレースホルダー（`<div>New Session</div>` のみ） |
| `src/frontend/src/api/scenarios.ts` | `getScenarios()` 実装済み（クエリパラメータ未対応） |
| `src/frontend/src/api/sessions.ts` | `createSession(scenarioId)` 実装済み |
| `src/frontend/src/types/index.ts` | `Scenario` / `Session` 型定義済み |
| `src/frontend/src/App.tsx` | `/sessions/new` ルート登録済み |

### 1.4 関連 API（API設計書より）

**GET /api/scenarios**
```
Query: difficulty?: 'beginner' | 'intermediate' | 'advanced'
Response: { scenarios: Scenario[] }
```

**POST /api/sessions**
```
Body:    { scenarioId: string }
Response: { session: { id: string, scenarioId: string, status: string, ... } }
```

### 1.5 型定義（既存 `types/index.ts` より）

```typescript
interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  category: string;
}
```

---

## 2. ファイル構成と依存関係

### 2.1 作成・修正ファイル一覧

```
src/frontend/src/
├── api/
│   └── scenarios.ts              ← 修正: difficulty クエリパラメータ対応を追加
├── components/
│   └── scenario/                 ← 新規ディレクトリ
│       ├── DifficultyFilter.tsx      ← 新規: 難易度フィルター UI
│       ├── ScenarioCard.tsx          ← 新規: シナリオカード
│       └── ScenarioList.tsx          ← 新規: カード一覧コンテナ
├── hooks/
│   └── useScenarioSelection.ts   ← 新規: データ取得・状態管理
└── pages/
    └── SessionNewPage.tsx        ← 修正: プレースホルダーを本実装に差し替え
```

### 2.2 データフロー図

```
SessionNewPage
  │
  ├── useScenarioSelection (Hook)
  │     ├── scenarios.ts → GET /api/scenarios?difficulty=...
  │     └── sessions.ts  → POST /api/sessions
  │
  ├── DifficultyFilter
  │     └── フィルター変更 → Hookの setDifficulty を呼び出し
  │
  └── ScenarioList
        └── ScenarioCard × N
              └── カード選択 → Hookの setSelectedId を呼び出し
```

---

## 3. 実装タスク一覧

> タスクは依存順に並んでいます。Task 1 → 2 → 3 → 4 の順に実装してください。

---

### Task 1: `scenarios.ts` の拡張（API クエリパラメータ対応）

**目的:** `getScenarios()` に `difficulty` フィルターを渡せるようにする。

**対象ファイル:** `src/frontend/src/api/scenarios.ts`

**実装内容:**

- [ ] `DifficultyFilter` 型（`'all' | 'beginner' | 'intermediate' | 'advanced'`）を定義する
- [ ] `getScenarios(difficulty?: DifficultyFilter)` のシグネチャに引数を追加する
- [ ] `difficulty` が `'all'` または `undefined` の場合はクエリパラメータを付与しない
- [ ] `difficulty` が指定されている場合は `?difficulty=<value>` をURLに付与する

**実装イメージ:**
```typescript
export type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export const getScenarios = async (difficulty?: DifficultyFilter): Promise<Scenario[]> => {
  const query = difficulty && difficulty !== 'all' ? `?difficulty=${difficulty}` : '';
  const response = await apiClient.get(`/api/scenarios${query}`);
  return response.data.scenarios;
};
```

**完了条件:**
- [ ] TypeScript エラーなし
- [ ] `difficulty` 未指定時は `/api/scenarios` を呼ぶ
- [ ] `difficulty='beginner'` 指定時は `/api/scenarios?difficulty=beginner` を呼ぶ

---

### Task 2: `useScenarioSelection` フックの作成

**目的:** シナリオ選択画面の状態管理とAPIコールをカプセル化する。

**対象ファイル:** `src/frontend/src/hooks/useScenarioSelection.ts`（新規作成）

**管理する状態:**

| 状態 | 型 | 初期値 | 説明 |
|------|----|--------|------|
| `scenarios` | `Scenario[]` | `[]` | 取得したシナリオ一覧 |
| `selectedId` | `string \| null` | `null` | 選択中のシナリオID |
| `difficulty` | `DifficultyFilter` | `'all'` | 現在のフィルター値 |
| `isLoading` | `boolean` | `false` | シナリオ取得中フラグ |
| `isStarting` | `boolean` | `false` | セッション作成中フラグ |
| `error` | `string \| null` | `null` | エラーメッセージ |

**公開する関数:**

| 関数 | 説明 |
|------|------|
| `setDifficulty(d: DifficultyFilter)` | フィルター変更（`selectedId` もリセット） |
| `setSelectedId(id: string)` | カード選択 |
| `handleStart()` | セッション作成 → `/sessions/:id` へ遷移 |

**実装イメージ:**
```typescript
export const useScenarioSelection = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [difficulty, setDifficultyState] = useState<DifficultyFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // difficulty 変更時にシナリオを再取得
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getScenarios(difficulty)
      .then(setScenarios)
      .catch(() => setError('シナリオの取得に失敗しました'))
      .finally(() => setIsLoading(false));
  }, [difficulty]);

  const setDifficulty = (d: DifficultyFilter) => {
    setDifficultyState(d);
    setSelectedId(null); // フィルター変更時は選択をリセット
  };

  const handleStart = async () => {
    if (!selectedId) return;
    setIsStarting(true);
    try {
      const session = await createSession(selectedId);
      navigate(`/sessions/${session.id}`);
    } catch {
      setError('セッションの開始に失敗しました');
    } finally {
      setIsStarting(false);
    }
  };

  return { scenarios, selectedId, difficulty, isLoading, isStarting, error,
           setDifficulty, setSelectedId, handleStart };
};
```

**完了条件:**
- [ ] TypeScript エラーなし
- [ ] マウント時・`difficulty` 変更時にシナリオ一覧を取得する
- [ ] `setDifficulty` 呼び出し時に `selectedId` がリセットされる
- [ ] `handleStart` 成功時に `/sessions/:id` へ遷移する
- [ ] エラー時に `error` に日本語メッセージがセットされる

---

### Task 3: UIコンポーネントの作成

**目的:** フィルター・カード・一覧の3コンポーネントを作成する。

#### 3-A: `DifficultyFilter.tsx`

**対象ファイル:** `src/frontend/src/components/scenario/DifficultyFilter.tsx`（新規作成）

**Props:**
```typescript
interface Props {
  value: DifficultyFilter;
  onChange: (value: DifficultyFilter) => void;
}
```

**実装内容:**
- [ ] `all` / `beginner` / `intermediate` / `advanced` の4ボタンを横並びで表示
- [ ] 選択中のボタンをハイライト（`bg-blue-600 text-white` など）
- [ ] 非選択ボタンは `bg-gray-100 text-gray-700` など
- [ ] ラベルは日本語表記（`all`→「すべて」、`beginner`→「初級」、`intermediate`→「中級」、`advanced`→「上級」）

#### 3-B: `ScenarioCard.tsx`

**対象ファイル:** `src/frontend/src/components/scenario/ScenarioCard.tsx`（新規作成）

**Props:**
```typescript
interface Props {
  scenario: Scenario;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
```

**実装内容:**
- [ ] カードクリックで `onSelect(scenario.id)` を呼ぶ
- [ ] `isSelected` が `true` の場合は枠線をハイライト（`border-blue-500 ring-2` など）
- [ ] 難易度バッジを色分けして表示
  - `beginner`: 緑系 / `intermediate`: 黄系 / `advanced`: 赤系
- [ ] 推定時間を「約 N 分」形式で表示

#### 3-C: `ScenarioList.tsx`

**対象ファイル:** `src/frontend/src/components/scenario/ScenarioList.tsx`（新規作成）

**Props:**
```typescript
interface Props {
  scenarios: Scenario[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}
```

**実装内容:**
- [ ] `scenarios` をグリッドレイアウト（`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`）で表示
- [ ] `scenarios` が空の場合は「該当するシナリオがありません」を表示
- [ ] 各 `ScenarioCard` に `isSelected` と `onSelect` を渡す

**完了条件（Task 3 共通）:**
- [ ] TypeScript エラーなし
- [ ] 各コンポーネントが Props の型定義を持つ
- [ ] 既存コンポーネント（`RecommendedScenarioCard.tsx` など）のスタイル規約に準拠

---

### Task 4: `SessionNewPage.tsx` の本実装への差し替え

**目的:** プレースホルダーを削除し、Task 1–3 で作成したコンポーネントを組み合わせる。

**対象ファイル:** `src/frontend/src/pages/SessionNewPage.tsx`

**実装内容:**

- [ ] `useScenarioSelection` フックを呼び出す
- [ ] 未認証ガード：`useAuth` で認証チェックし、未認証時は `/login` へリダイレクト
- [ ] ローディング中はスピナーまたはスケルトンを表示
- [ ] エラー時はエラーメッセージを表示
- [ ] `DifficultyFilter` ・ `ScenarioList` ・「開始する」ボタンを配置
- [ ] 「開始する」ボタンは `selectedId === null` または `isStarting === true` の場合は `disabled`

**実装イメージ:**
```tsx
const SessionNewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    scenarios, selectedId, difficulty, isLoading, isStarting, error,
    setDifficulty, setSelectedId, handleStart,
  } = useScenarioSelection();

  // 未認証ガード
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">シナリオを選択</h1>

      <DifficultyFilter value={difficulty} onChange={setDifficulty} />

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
      )}

      {isLoading ? (
        <div className="mt-8 text-center">読み込み中...</div>
      ) : (
        <ScenarioList
          scenarios={scenarios}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleStart}
          disabled={!selectedId || isStarting}
          className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isStarting ? '開始中...' : '開始する'}
        </button>
      </div>
    </div>
  );
};
```

**完了条件:**
- [ ] TypeScript エラーなし
- [ ] 未認証時は `/login` へリダイレクトされる
- [ ] ローディング中はシナリオ一覧の代わりにローディング表示が出る
- [ ] シナリオ未選択時は「開始する」ボタンが `disabled`
- [ ] セッション作成成功後に `/sessions/:id` へ遷移する

---

## 4. 検証手順

### 4.1 型チェック

```powershell
cd src/frontend
npx tsc --noEmit
```

> エラーが0件であることを確認する。

### 4.2 テスト実行

```powershell
cd src/frontend
npm test
```

### 4.3 動作確認チェックリスト

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | 未ログイン状態で `/sessions/new` にアクセス | `/login` へリダイレクト |
| 2 | ログイン後にホームから「シナリオを選ぶ」をクリック | シナリオ選択画面に遷移、シナリオ一覧が表示される |
| 3 | 「初級」フィルターをクリック | beginner のシナリオのみ表示される |
| 4 | シナリオカードをクリック | カードがハイライトされ、「開始する」ボタンが有効化 |
| 5 | 「開始する」をクリック | セッション作成後に対話画面へ遷移 |
| 6 | フィルター変更後に別のカードを選択 | 前の選択がリセットされ、新たなカードを選択できる |
| 7 | APIエラー発生時 | エラーメッセージが画面に表示される |

---

## 5. 注意事項・制約

- **`any` 型禁止:** 開発フロールール11に従い、TypeScript の `any` 型は使用しない。
- **スタイル規約:** Tailwind CSS を使用する。インラインスタイルは使用しない。
- **コンポーネント分割:** ページコンポーネント（`SessionNewPage`）はロジックを持たず、フックと子コンポーネントに委譲する。
- **エラーメッセージ:** ユーザー向けのエラーメッセージは日本語で表示する。
- **ルーティング:** `/sessions/new` は既に `App.tsx` に登録済みのため、変更不要。
- **セッション遷移先:** `POST /api/sessions` のレスポンスに含まれる `session.id` を使って `/sessions/:id` へ遷移する。
