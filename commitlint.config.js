export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新機能
        'fix',      // バグ修正
        'docs',     // ドキュメントのみの変更
        'style',    // コードの意味に影響を与えない変更（スペース、フォーマット、セミコロンなど）
        'refactor', // バグ修正も機能追加も行わないコード変更
        'perf',     // パフォーマンスを向上させるコード変更
        'test',     // 不足しているテストの追加や既存のテストの修正
        'build',    // ビルドシステムや外部依存関係に影響を与える変更
        'ci',       // CI設定ファイルとスクリプトへの変更
        'chore',    // その他の変更（ソースやテストファイルの変更を含まない）
        'revert',   // 以前のコミットを元に戻す
      ],
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
  },
};