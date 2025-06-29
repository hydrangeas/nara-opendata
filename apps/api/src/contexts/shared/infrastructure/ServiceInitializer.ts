import { container } from 'tsyringe';
import { TYPES } from '../../../types/di';
import { APIAccessControlService } from '../../api/domain/services/APIAccessControlService';
import { LogAnalysisService } from '../../log/domain/services/LogAnalysisService';
import type { APIAccessControlServiceClass } from '../../api/domain/services/APIAccessControlService.class';
import type { LogAnalysisServiceClass } from '../../log/domain/services/LogAnalysisService.class';

/**
 * 静的サービスクラスの初期化を行う
 *
 * @remarks
 * 後方互換性のために、静的サービスクラスにDIコンテナから
 * 取得したインスタンスを設定します
 */
export function initializeStaticServices(): void {
  // APIAccessControlServiceの初期化
  const apiAccessControlInstance = container.resolve<APIAccessControlServiceClass>(
    TYPES.APIAccessControlService,
  );
  APIAccessControlService.setInstance(apiAccessControlInstance);

  // LogAnalysisServiceの初期化
  const logAnalysisInstance = container.resolve<LogAnalysisServiceClass>(TYPES.LogAnalysisService);
  LogAnalysisService.setInstance(logAnalysisInstance);
}
