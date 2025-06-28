/**
 * Vitest セットアップファイル
 *
 * テスト実行前に必要な初期化処理を行います。
 * このファイルはvitest.config.tsのsetupFilesで指定されています。
 */

// TSyringeを使用するために必要
import 'reflect-metadata';

// 環境変数の設定
process.env['NODE_ENV'] = 'test';

// グローバルなモックの設定
// 必要に応じて追加
