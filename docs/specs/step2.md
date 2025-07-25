# ステップ2：イベントとシステム間のギャップを埋める

## タイムライン

### 複雑なフローの例（すべての要素を含む）

```mermaid
graph LR
    %% Social Login認証フロー
    subgraph "Social Login認証フロー"
        %% アクターとコマンド
        User1[ユーザー⬜] -->|invokes| Cmd1[ログイン/サインアップする🟦]
        
        %% コマンドと集約/外部システム
        Cmd1 -->|invoked on| UISystem1[UIシステム🟫]
        
        %% イベント生成とリダイレクト
        UISystem1 -->|generates| A1[ログイン/サインアップボタンがクリックされた🟧]
        
        %% Supabase Authへのリダイレクト
        A1 -->|triggers| Policy1[Supabase Auth リダイレクト方針🟩]
        Policy1 -->|invokes| Cmd2[Supabase Authへリダイレクトする🟦]
        Cmd2 -->|invoked on| UISystem1
        UISystem1 -->|generates| A2[Supabase Authへリダイレクトされた🟧]
        
        %% Supabase Auth UIコンポーネントが自動的に処理
        A2 -->|triggers| Policy2[認証開始方針🟩]
        Policy2 -->|invokes| Cmd3[Supabase Authで認証を開始する🟦]
        Cmd3 -->|invoked on| SupaAuth[Supabase Auth🟫]
        SupaAuth -->|generates| A4[Social Provider認証ページにリダイレクトされた🟧]
        
        %% 外部認証へのリダイレクト
        A4 -->|triggers| Policy3[Social Provider認証方針🟩]
        Policy3 -->|invokes| Cmd4[Social Providerで認証する🟦]
        Cmd4 -->|invoked on| SocialProvider[Social Provider🟫]
        
        %% 認証成功時
        SocialProvider -->|generates| A6[認証成功コールバックが受信された🟧]
        
        %% 認証失敗時
        SocialProvider -->|generates| A7[認証失敗コールバックが受信された🟧]
        A7 -->|triggers| Policy25[認証失敗リダイレクト方針🟩]
        Policy25 -->|invokes| Cmd30[トップページにリダイレクトする🟦]
        Cmd30 -->|invoked on| UISystem1
        UISystem1 -->|generates| A16[トップページにリダイレクトされた🟧]
        
        %% ダッシュボード表示
        A6 -->|triggers| Policy9[ダッシュボード表示方針🟩]
        Policy9 -->|invokes| Cmd10[ダッシュボードを表示する🟦]
        Cmd10 -->|invoked on| UISystem2[UIシステム🟫]
        UISystem2 -->|generates| A14[ダッシュボードが表示された🟧]
        
        %% 読み取りモデル
        A6 -->|translated into| ReadModel1[認証情報⬛]
        A14 -->|translated into| ReadModel2[ダッシュボード情報⬛]
    end
    
    %% APIアクセスフロー（正常系）
    subgraph "APIアクセスフロー - 正常系"
        %% アクターとコマンド
        APIClient[APIクライアント⬜] -->|invokes| Cmd11[APIを呼び出す🟦]
        
        %% コマンドと集約/外部システム
        Cmd11 -->|invoked on| APIAgg[API集約🟨]
        
        %% イベント生成
        APIAgg -->|generates| C2[JWTトークンが検証された🟧]
        APIAgg -->|generates| C3[ユーザーティアが確認された🟧]
        
        %% レート制限チェック
        C3 -->|triggers| Policy10[レート制限チェック方針🟩]
        Policy10 -->|invokes| Cmd12[レート制限をチェックする🟦]
        Cmd12 -->|invoked on| RateLimitAgg[レート制限集約🟨]
        
        %% チェック結果により分岐
        RateLimitAgg -->|generates| C4a[レート制限内であることが確認された🟧]
        RateLimitAgg -->|generates| C4b[レート制限を超過した🟧]
        
        %% 制限内の場合：カウント更新して処理継続
        C4a -->|triggers| Policy11[レート制限更新方針🟩]
        Policy11 -->|invokes| Cmd13[レート制限カウントを更新する🟦]
        Cmd13 -->|invoked on| RateLimitAgg
        RateLimitAgg -->|generates| C5[レート制限カウントが更新された🟧]
        
        %% データ取得
        C5 -->|triggers| Policy12[データ取得方針🟩]
        Policy12 -->|invokes| Cmd14[JSONファイルを読み込む🟦]
        Cmd14 -->|invoked on| DataAgg[データ集約🟨]
        
        %% データ集約から正常系/エラー系に分岐
        DataAgg -->|generates| C6[JSONファイルが読み込まれた🟧]
        DataAgg -->|generates| D5[ファイルが見つからなかった🟧]
        
        %% 正常系：レスポンス返却
        C6 -->|triggers| Policy13[レスポンス返却方針🟩]
        Policy13 -->|invokes| Cmd15[レスポンスを返却する🟦]
        Cmd15 -->|invoked on| APIAgg
        APIAgg -->|generates| C7[レスポンスが返却された🟧]
        
        %% エラー系：404エラー処理
        D5 -->|triggers| Policy16[404エラー処理方針🟩]
        Policy16 -->|invokes| Cmd16[404エラーを返却する🟦]
        Cmd16 -->|invoked on| APIAgg
        
        %% 読み取りモデル
        C3 -->|translated into| ReadModel4[ユーザーティア情報⬛]
        C4a -->|translated into| ReadModel5[レート制限状態⬛]
        C6 -->|translated into| ReadModel6[JSONデータ⬛]
    end
    
    %% APIアクセスフロー（エラー系）
    subgraph "APIアクセスフロー - エラー系"
        %% 認証エラー（API集約から直接生成）
        APIAgg -->|generates| D2[認証エラーが返却された🟧]
        
        %% レート制限エラー（レート制限集約から直接生成）
        RateLimitAgg -->|generates| D4[レート制限エラーが返却された🟧]
        
        %% ファイルエラー（API集約から生成）
        APIAgg -->|generates| D6[404エラーが返却された🟧]
        
        %% エラー読み取りモデル
        D2 -->|translated into| ReadModel7[認証エラー情報⬛]
        D4 -->|translated into| ReadModel8[レート制限エラー情報⬛]
        D6 -->|translated into| ReadModel9[404エラー情報⬛]
    end
    
    %% ログアウトフロー
    subgraph "ログアウトフロー"
        %% アクターとコマンド
        User3[ログインユーザー⬜] -->|invokes| Cmd19[ログアウトする🟦]
        
        %% コマンドと集約/外部システム
        Cmd19 -->|invoked on| AuthAgg2[認証集約🟨]
        
        %% イベント生成
        AuthAgg2 -->|generates| E2[セッションが無効化された🟧]
        
        %% 方針
        E2 -->|triggers| Policy17[リダイレクト方針🟩]
        Policy17 -->|invokes| Cmd20[トップページにリダイレクトする🟦]
        Cmd20 -->|invoked on| UISystem2[UIシステム🟫]
        UISystem2 -->|generates| E3[トップページにリダイレクトされた🟧]
    end
    
    %% トークンリフレッシュフロー
    subgraph "トークンリフレッシュフロー"
        %% アクターとコマンド（システム自動実行）
        System1[システム⬜] -->|invokes| Cmd21[トークンをリフレッシュする🟦]
        
        %% コマンドと集約
        Cmd21 -->|invoked on| AuthAgg3[認証集約🟨]
        
        %% イベント生成（トークンチェック）
        AuthAgg3 -->|generates| F1[アクセストークンの有効期限が近い（5分以内）🟧]
        AuthAgg3 -->|generates| F2[リフレッシュトークンが有効である🟧]
        
        %% 正常系：両条件を満たす場合のみリフレッシュ実行
        F1 -->|triggers| Policy18[トークンリフレッシュ実行方針🟩]
        F2 -->|triggers| Policy18
        Policy18 -->|invokes| Cmd22[Supabaseでトークンをリフレッシュする🟦]
        Cmd22 -->|invoked on| SupaAuth3[Supabase Auth🟫]
        
        %% 新しいアクセストークン発行
        SupaAuth3 -->|generates| F4[新しいアクセストークンが発行された🟧]
        
        %% 読み取りモデル（正常系）
        F4 -->|translated into| ReadModel10[更新された認証情報⬛]
        
        %% エラー系：リフレッシュトークンが期限切れ
        F2 -.-> F5[リフレッシュトークンが期限切れだった🟧]
        
        %% リクエスト元による分岐
        F5 -->|triggers| Policy19[再認証要求方針（Web）🟩]
        F5 -->|triggers| Policy20[API認証エラー方針🟩]
        
        %% Webブラウザからの場合
        Policy19 -->|invokes| Cmd23[再ログインを要求する🟦]
        Cmd23 -->|invoked on| UISystem3[UIシステム🟫]
        UISystem3 -->|generates| F6[Supabase Authへリダイレクトされた🟧]
        
        %% APIクライアントからの場合
        Policy20 -->|invokes| Cmd24[認証エラーを返却する🟦]
        Cmd24 -->|invoked on| APIAgg2[API集約🟨]
        APIAgg2 -->|generates| F7[認証エラー（トークン期限切れ）が返却された🟧]
        
        %% エラー読み取りモデル
        F7 -->|translated into| ReadModel13[トークン期限切れエラー情報⬛]
    end
    
    %% ログ記録フロー（並行処理）
    subgraph "ログ記録フロー - 並行処理"
        %% 認証ログフロー
        %% 認証イベントからの方針トリガー
        A6 -.->|triggers| Policy21[認証ログ方針🟩]
        A7 -.->|triggers| Policy21
        E2 -.->|triggers| Policy21
        
        %% 認証ログコマンド実行
        Policy21 -->|invokes| Cmd25[認証結果をログに記録する🟦]
        
        %% 認証ログ集約への実行
        Cmd25 -->|invoked on| AuthLogAgg[認証ログ集約🟨]
        
        %% 認証ログイベント生成
        AuthLogAgg -->|generates| G1[認証結果がログに記録された🟧]
        
        %% APIアクセスログフロー
        %% APIアクセスイベントからの方針トリガー
        C7 -.->|triggers| Policy24[APIアクセスログ方針🟩]
        D2 -.->|triggers| Policy24
        D4 -.->|triggers| Policy24
        D6 -.->|triggers| Policy24
        
        %% APIアクセスログコマンド実行
        Policy24 -->|invokes| Cmd28[APIアクセスをログに記録する🟦]
        
        %% APIログ集約への実行
        Cmd28 -->|invoked on| APILogAgg[APIログ集約🟨]
        
        %% APIアクセスログイベント生成
        APILogAgg -->|generates| G4[APIアクセスがログに記録された🟧]
        
        %% 読み取りモデル
        G1 -->|translated into| ReadModel11[監査ログ⬛]
        G4 -->|translated into| ReadModel14[APIアクセスログ⬛]
    end
    
    
    %% スタイル定義
    classDef event fill:#ff6723,stroke:#333,stroke-width:2px;
    classDef command fill:#00a6ed,stroke:#333,stroke-width:2px;
    classDef user fill:#ffffff,stroke:#333,stroke-width:2px;
    classDef externalSystem fill:#a56953,stroke:#333,stroke-width:2px;
    classDef aggregate fill:#ffb02e,stroke:#333,stroke-width:2px;
    classDef policy fill:#00d26a,stroke:#333,stroke-width:2px;
    classDef readModel fill:#000000,color:#fff,stroke:#333,stroke-width:2px;
    
    class A1,A2,A4,A6,A7,A14,A16,C2,C3,C4a,C4b,C5,C6,C7,D2,D4,D5,D6,E2,E3,F1,F2,F4,F5,F6,F7,G1,G4 event;
    class Cmd1,Cmd2,Cmd3,Cmd4,Cmd10,Cmd11,Cmd12,Cmd13,Cmd14,Cmd15,Cmd16,Cmd19,Cmd20,Cmd21,Cmd22,Cmd23,Cmd24,Cmd25,Cmd28,Cmd30 command;
    class User1,User3,APIClient,System1 user;
    class SocialProvider,SupaAuth,SupaAuth3,UISystem1,UISystem2,UISystem3 externalSystem;
    class AuthAgg,AuthAgg2,AuthAgg3,APIAgg,APIAgg2,RateLimitAgg,DataAgg,AuthLogAgg,APILogAgg aggregate;
    class Policy1,Policy2,Policy3,Policy9,Policy10,Policy11,Policy12,Policy13,Policy16,Policy17,Policy18,Policy19,Policy20,Policy21,Policy24,Policy25 policy;
    class ReadModel1,ReadModel2,ReadModel4,ReadModel5,ReadModel6,ReadModel7,ReadModel8,ReadModel9,ReadModel10,ReadModel11,ReadModel13,ReadModel14 readModel;
```

## フローの説明

### アクター（ユーザーの役割 ⬜）
- ユーザー
  Social Loginで認証を行うユーザー（新規・既存問わず）
- APIクライアント
  認証されたクライアントアプリケーション
- ログインユーザー
  ダッシュボードにアクセス中のユーザー
- システム
  自動的にトークンリフレッシュを実行するシステム

### コマンド 🟦
- ログイン/サインアップする
  トップページからSupabase Authでの認証プロセスを開始する
- Supabase Authへリダイレクトする
  Supabase Authの認証ページへ遷移する
- Supabase Authで認証を開始する
  Supabase Auth UIコンポーネントが自動的にプロバイダー選択と認証ページへのリダイレクトを処理する
- Social Providerで認証する
  選択された外部認証プロバイダー（Google、GitHub等）でユーザー認証を実行する
- ダッシュボードを表示する
  認証済みユーザーの画面を表示する
- APIを呼び出す
  オープンデータAPIへのリクエストを実行する
- レート制限をチェックする
  現在のアクセス回数を確認する
- レート制限カウントを更新する
  Supabaseデータベースでカウントを増加させる
- JSONファイルを読み込む
  要求されたデータファイルを取得する
- レスポンスを返却する
  クライアントにデータを送信する
- レート制限エラーを返却する
  HTTP 429 Too Many Requestsエラーと次回アクセス可能時刻を返却する
- 404エラーを返却する
  RFC 7807形式のエラーレスポンスを生成する
- ログアウトする
  セッションを終了する
- トップページにリダイレクトする
  ブラウザをトップページに遷移させる
- トークンをリフレッシュする
  認証集約がアクセストークンの残り有効期限（5分以内）とリフレッシュトークンの有効性を確認する
- Supabaseでトークンをリフレッシュする
  Supabase Authに対してリフレッシュトークンを使用して新しいアクセストークンを要求する
- 再ログインを要求する
  Webブラウザからのリクエストで、リフレッシュトークンが期限切れの場合、Supabase Authへリダイレクトする
- 認証エラーを返却する
  APIクライアントからのリクエストで、リフレッシュトークンが期限切れの場合、HTTP 401 Unauthorized（トークン期限切れ）を返却する
- 認証結果をログに記録する
  認証成功・失敗・ログアウトをセキュリティ監査用に保存する
- APIアクセスをログに記録する
  すべてのAPIアクセス（正常・エラー含む）の履歴を保存する

### 集約と外部システム 🟨🟫
- 認証集約 🟨
  トークンリフレッシュの必要性判断を担当
- API集約 🟨
  APIリクエスト処理とレスポンス生成を担当
- レート制限集約 🟨
  アクセス回数管理とティア別制限を担当
- データ集約 🟨
  JSONファイルの読み込みとデータ提供を担当
- 認証ログ集約 🟨
  認証イベント（成功・失敗・ログアウト）のログ記録を担当
- APIログ集約 🟨
  APIアクセスのログ記録を担当
- Social Provider 🟫
  外部認証プロバイダー（Google、GitHub等）
- Supabase Auth 🟫
  外部認証サービス（プロバイダー統合、ユーザー作成、JWT発行、Custom Access Token Hook実行）
- UIシステム 🟫
  ブラウザUIの表示とリダイレクトを担当

### ドメインイベント 🟧
（ステップ1から引き継ぎ）

#### ステップ2で追加されたイベント
なし（ステップ1で定義されたイベントはそのまま利用）

### 方針 🟩
- Supabase Auth リダイレクト方針: ログイン/サインアップボタンクリック時はSupabase Authへリダイレクトする
- 認証開始方針: Supabase Authへのリダイレクト後は認証プロセスを開始する
- Social Provider認証方針: Social Provider認証ページにリダイレクトされた後はSocial Providerで認証する
- 認証失敗リダイレクト方針: 認証失敗コールバック受信時はトップページにリダイレクトする
- ダッシュボード表示方針: 認証成功コールバック受信時はダッシュボードを表示する
- レート制限チェック方針: ユーザーティア確認後はレート制限をチェックする
- レート制限更新方針: レート制限内であることが確認された後はカウントを更新する
- データ取得方針: レート制限カウント更新後はJSONファイルを読み込む
- レスポンス返却方針: JSONファイル読み込み後はレスポンスを返却する
- 認証エラー処理方針: 無効なトークン検出時は認証エラーを返却する
- レート制限エラー処理方針: レート制限超過時はレート制限エラーを返却する
- 404エラー処理方針: ファイルが見つからない時は404エラーを返却する
- リダイレクト方針: セッション無効化後はトップページにリダイレクトする
- トークンリフレッシュ実行方針: リフレッシュトークンが有効な場合はSupabaseでトークンをリフレッシュする
- 再認証要求方針（Web）: リフレッシュトークンが期限切れの場合は再ログインを要求する
- API認証エラー方針: APIクライアントからのリクエストで期限切れの場合は認証エラーを返却する
- 認証ログ方針: 認証成功・失敗・ログアウトイベント発生時はログに記録する
- APIアクセスログ方針: APIレスポンス（正常・エラー）返却時はログに記録する

### 読み取りモデル ⬛
- 認証情報
  JWTトークン（tier情報を含む）とユーザーIDを保持
- ダッシュボード情報
  ログアウトボタンのみを表示
- ユーザーティア情報
  JWTのクレームから取得したtier1/tier2/tier3の区分を表示
- レート制限状態
  現在のアクセス回数と残り回数を表示
- JSONデータ
  要求されたオープンデータの内容
- 認証エラー情報
  HTTP 401エラーの詳細
- レート制限エラー情報
  HTTP 429エラーと次回アクセス可能時刻
- 404エラー情報
  RFC 7807形式のエラー詳細
- 更新された認証情報
  新しいアクセストークン
- 監査ログ
  認証イベントのセキュリティ監視用の記録データ
- APIアクセスログ
  APIアクセスの履歴データ（ステータスコード、レスポンスタイム等を含む）
- トークン期限切れエラー情報
  HTTP 401 Unauthorized（リフレッシュトークン期限切れ）の詳細

## 保留事項 (Future Placement Board)
|タイプ|内容|検討ステップ|
|-|-|-|
|懸念事項🟪|Supabase Authでの初回ユーザー判定とCustom Access Token Hookでのtier設定方法|ステップ3|
|懸念事項🟪|複数のSocial Provider間でのアカウント統合方法|ステップ3|
|懸念事項🟪|Social Provider認証失敗時のエラーハンドリング|ステップ3|
|懸念事項🟪|ティアのアップグレード/ダウングレードのフローが未定義|ステップ3|
|懸念事項🟪|Custom Access Token Hookの実装詳細（PostgreSQL関数）|ステップ3|
|懸念事項🟪|CORS設定の具体的な実装方法|ステップ3|
|懸念事項🟪|セキュリティヘッダーの設定タイミング|ステップ3|

## ユビキタス言語辞書

ステップ1とステップ2の追加差分のみ記載する。

|項番|日本語|英語|コード変数|意味|使用コンテキスト|最終更新|
|-|-|-|-|-|-|-|
|16|コマンド|Command|command|システムに対する操作要求|全体|2025-01-06|
|17|方針|Policy|policy|イベント発生時の自動処理ルール|全体|2025-01-06|
|18|集約|Aggregate|aggregate|関連するデータと振る舞いのまとまり|全体|2025-01-06|
|19|読み取りモデル|Read Model|readModel|ユーザーに表示する情報|全体|2025-01-06|
|20|プロバイダー統合|Provider Integration|providerIntegration|複数の認証プロバイダーをSupabaseで統一管理|認証|2025-01-06|
|21|カスタムアクセストークンフック|Custom Access Token Hook|customAccessTokenHook|JWT発行時にカスタムクレームを追加するSupabase機能|認証|2025-01-11|
|22|アプリケーションメタデータ|App Metadata|appMetadata|サーバー側のみで管理されるユーザー情報（ティア情報等）|認証|2025-01-11|

## チェックリスト

完了基準の確認結果

### コマンドの質と量
- [x] すべてのドメインイベントに対して、それを引き起こすコマンドが特定されている
- [x] コマンドが命令形の動詞で明確に表現されている
- [x] コマンドが青色の付箋に一つずつ記載されている
- [x] 複合的なコマンドが適切に分解されている

### アクターの識別
- [x] すべてのコマンドに対して、それを実行するアクターが特定されている
- [x] アクターが白色の付箋に記載されている
- [x] アクターの権限や役割が明確に定義されている
- [x] システムによる自動アクションも明示されている

### 方針の定義
- [x] イベント間の自動的な連鎖が方針として特定されている
- [x] 方針が緑色の付箋に条件付きルールとして記載されている
- [x] 方針からトリガーされる新たなコマンドが明確になっている
- [x] 複雑なビジネスルールが適切に方針として表現されている

### 読み取りモデルの特定
- [x] ユーザーの意思決定に必要な情報が読み取りモデルとして特定されている
- [x] 読み取りモデルが黒色の付箋に記載されている
- [x] 情報の表示タイミングと目的が明確になっている
- [x] UIとの関連性が考慮されている

### リレーションの明確さ
- [x] 要素間の関係が矢印などで明確に表現されている
- [x] フローの流れが視覚的に理解できる
- [x] 複雑な条件分岐が適切に表現されている
- [x] フィードバックループが識別されている

### フローの一貫性
- [x] 開始から終了までの一連のフローが完成している
- [x] 時系列が論理的に矛盾なく表現されている
- [x] 例外ケースやエラー処理も考慮されている
- [x] 並行して進むプロセスが適切に表現されている

### 懸念事項の管理
- [x] 議論の過程で浮かび上がった疑問点や課題が紫色の付箋に記録されている
- [x] 懸念事項に対するフォローアップの方法が決まっている
- [x] 解決できない懸念事項が次のステップへの課題として明確になっている

### 進化的アプローチの確認
- [x] このステップで追加した要素は、ステップ1と整合性が取れているか？
- [x] ステップ1に戻って修正が必要な箇所はないか？
- [x] 次のステップ（集約の抽出）で問題になりそうな曖昧な点はないか？

## 補足

**認証エラーコマンドの削除について**

「認証エラーを返却する」コマンドを削除しました。これは、JWTトークン検証が失敗した場合、API集約が直接「認証エラーが返却された」イベントを生成するためです。これにより、不要な中間ステップが削除され、フローがシンプルになりました。

ログインページを廃止し、トップページから直接Supabase Authへリダイレクトする方式を採用しました。これにより、UIフローがシンプルになり、ユーザー体験が向上します。

Supabase Auth UIコンポーネントを使用することで、プロバイダー選択画面、サインイン/サインアップフォーム、パスワードリセット機能などがすべて統合された形で提供されます。これにより、認証UIの実装コストが大幅に削減されます。

Social Loginの採用により、認証フローが大幅に簡素化されました。ユーザー登録とログインが統一され、Supabase Authがユーザー管理とJWT発行を完全に担当します。

UIシステムを外部システムとして扱うことで、ボタンクリック、ダッシュボード表示、リダイレクトなどのUI操作を、モデリングの表記法に準拠した形で表現しています。これにより、コマンドが直接イベントを生成する違反を回避し、自然なイベント駆動のフローを実現しています。

Supabase AuthとSocial Providerも外部システムとして明確に定義し、OAuth認証フローの外部依存性を適切に表現しています。

また、ログ記録フローは完全に非同期の並行処理として設計され、各種イベントからの方針トリガーによって独立して実行されます。

トークンリフレッシュフローでは、認証集約が中心的な役割を果たし、トークンの有効期限チェックからSupabase Authへの呼び出しまでを責任を持って管理します。これにより、アーキテクチャの一貫性が保たれ、リフレッシュトークン期限切れ時の再認証フローも明確に定義されています。

Supabase Authがユーザー作成とJWT発行を完全に管理します。初回ログイン時、Supabase Authは自動的にユーザーを作成します。

**ログ設計について**

ログ記録を「認証ログ」と「APIアクセスログ」の2つに分離しました。これにより、認証イベント（Social Login成功/失敗/ログアウト）とAPIアクセス（データ取得、エラーレスポンス）が明確に区別され、それぞれ異なる目的での分析が可能になります。APIアクセスログには、正常なレスポンス（C7）だけでなく、すべてのエラーレスポンス（D2認証エラー、D4レート制限エラー、D6 404エラー）も含まれます。

**レート制限フローについて**

レート制限チェックは、制限内/制限超過の2つの結果イベントに分岐するよう設計しました。制限内の場合のみカウントが更新され、制限超過の場合は即座にエラー処理へ進みます。これにより、制限に達している場合の無駄なカウント更新を防ぎます。

レート制限の実装方式としては、スライディングウィンドウ方式を想定しています。これは、現在時刻から遡って指定期間内のリクエスト数をカウントする方式で、Supabaseのデータベースにタイムスタンプ付きでリクエスト履歴を保存し、古いレコードは自動的に削除される仕組みです。具体的な時間窓や制限回数は設定可能とし、設計では固定値を持たせません。

**Custom Access Token Hookについて**

Custom Access Token Hookは、JWT発行時にSupabase Auth内部で実行されるPostgreSQL関数です。このフックはアプリケーションからは直接観測できませんが、以下の処理を自動的に行います：

1. 初回ユーザーかどうかを判定（app_metadataにtier情報が存在しない場合）
2. 初回ユーザーの場合、tier1をapp_metadataに設定
3. tier情報をJWTのクレームに追加

この処理はSupabase Authの内部プロセスであり、アプリケーション側からはその実行を直接確認することはできません。アプリケーションは、発行されたJWTにtier情報が含まれていることを前提として処理を行います。

ティア情報の更新はSupabaseのapp_metadataを更新することで行い、次回のJWT発行時（ログインまたはトークンリフレッシュ時）に自動的に反映されます。

## 変更履歴

|更新日時|変更点|
|-|-|
|2025-01-12T18:00:00+09:00|レート制限エラーフローを修正。C4b→Policy26（レート制限エラー方針）→Cmd17→API集約→D4の流れに変更。「認証エラーを返却する」コマンドを削除し、JWT検証失敗時はAPI集約から直接D2イベントを生成するよう修正|
|2025-01-12T17:00:00+09:00|ログアウト時の認証ログ記録を追加。E2（セッションが無効化された）から認証ログ方針へのトリガーを追加。セキュリティ監査の完全性を確保|
|2025-01-12T16:00:00+09:00|404エラーフローを修正。D5→Policy16（404エラー処理方針）→Cmd16→API集約→D6の流れに変更。DDDの責務分離原則に準拠|
|2025-01-12T15:00:00+09:00|ログ設計を2つに分離。「認証ログ」（A6,A7）と「APIアクセスログ」（C7,D2,D4,D6）で責務を明確化。集約も認証ログ集約とAPIログ集約に分離|
|2025-01-12T11:00:00+09:00|認証エラーフローを修正。D1「無効なトークンが検出された」を削除し、D2「認証エラーが返却された」のみに統合。ログ方針へのトリガーも修正|
|2025-01-12T10:15:00+09:00|ファイルエラーフローを修正。データ集約から正常系（ファイル読み込み成功）とエラー系（ファイル未発見）の分岐を明確化|
|2025-01-12T10:00:00+09:00|レート制限フローを修正。チェック結果による分岐（制限内/制限超過）を明確化し、制限内の場合のみカウント更新する正しいフローに変更|
|2025-01-11T18:45:00+09:00|認証失敗コールバック（A7）のログ記録を追加。セキュリティ監視の観点から必要|
|2025-01-11T18:30:00+09:00|JWT発行フローを削除。認証成功コールバックで既にJWTを受信する形に修正|
|2025-01-11T18:00:00+09:00|認証コールバックを成功/失敗で分割。認証情報検証フローを削除し、コールバックから直接JWT発行または失敗処理へ|
|2025-01-11T17:30:00+09:00|A9「ユーザー作成とJWT発行が開始された」を削除、Social Providerへの正しいフロー（方針→コマンド）を追加|
|2025-01-11T17:00:00+09:00|Custom Access Token Hook関連のイベント、コマンド、方針を削除。アプリケーションから観測できない内部処理のため|
|2025-01-11T16:00:00+09:00|Supabase Authによるユーザー自動作成とtier設定を反映。認証フロー全体を再構成|
|2025-01-11T15:00:00+09:00|Custom Access Token Hookの採用を反映（補足事項に説明追加）|
|2025-01-11T13:30:00+09:00|「ユーザーアカウントを作成する」コマンドの詳細を補足事項に追加（レート制限カウンター初期化の説明）|
|2025-01-11T13:00:00+09:00|「Supabase Authがユーザー情報を処理した」イベントを削除し、認証情報検証から直接結果イベントを生成|
|2025-01-11T12:30:00+09:00|認証失敗・キャンセルのパターンを追加（A15, A16イベント、Policy25、Cmd30）|
|2025-01-11T12:00:00+09:00|Supabase Auth UIコンポーネントの内部処理（プロバイダー選択、リダイレクト）を簡略化|
|2025-01-11T11:00:00+09:00|ログインページを廃止し、トップページから直接Supabase Authへリダイレクトする方式に変更。認証フロー全体を修正|
|2025-01-11T10:00:00+09:00|ログアウトフローを修正（UIイベント「ログアウトボタンがクリックされた」を削除し、ビジネスイベント「セッションが無効化された」のみに整理）|
|2025-01-06T19:30:00+09:00|リフレッシュトークン期限切れ時のエラー名称を修正（HTTP 401 Unauthorized（トークン期限切れ）が業界標準）|
|2025-01-06T18:00:00+09:00|トークンリフレッシュフローを修正（認証集約の責務明確化、エラーパス追加、リフレッシュトークン期限切れ処理を実装）|
|2025-01-06T14:30:00+09:00|Social Login対応により認証フローを統合、ユーザー登録・ログインフローを一本化|
|2025-01-06T12:00:00+09:00|ステップ1の内容を基に、コマンド、アクター、方針、読み取りモデル、集約を追加|

（更新日時の降順で記載する）