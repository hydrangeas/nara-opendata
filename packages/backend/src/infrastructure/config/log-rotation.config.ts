import { injectable, inject } from 'tsyringe';
import { DI_TOKENS } from '../di/tokens';
import { Logger } from 'pino';
import { IAPILogRepository } from '@/domain/log/interfaces/api-log-repository.interface';
import { IAuthLogRepository } from '@/domain/log/interfaces/auth-log-repository.interface';
import { IRateLimitLogRepository } from '@/domain/log/interfaces/rate-limit-log-repository.interface';

/**
 * ��������-�
 */
export interface LogRotationConfig {
  // ����p	
  retentionDays: {
    apiLogs: number;
    authLogs: number;
    rateLimitLogs: number;
  };
  // �������L��	
  rotationIntervalMinutes: number;
  // ������
  batchSize: number;
}

/**
 * �թ��n��������-�
 */
export const defaultLogRotationConfig: LogRotationConfig = {
  retentionDays: {
    apiLogs: 30,      // API�o30��
    authLogs: 90,     // �<�o90������ƣ��(	
    rateLimitLogs: 7, // ���6P�o7��
  },
  rotationIntervalMinutes: 60 * 24, // 1�Thk�L
  batchSize: 1000,
};

/**
 * ���������ӹ
 */
@injectable()
export class LogRotationService {
  private rotationTimer?: NodeJS.Timeout;

  constructor(
    @inject(DI_TOKENS.APILogRepository)
    private readonly apiLogRepository: IAPILogRepository,
    @inject(DI_TOKENS.AuthLogRepository)
    private readonly authLogRepository: IAuthLogRepository,
    @inject(DI_TOKENS.RateLimitLogRepository)
    private readonly rateLimitLogRepository: IRateLimitLogRepository,
    @inject(DI_TOKENS.Logger)
    private readonly logger: Logger,
    private readonly config: LogRotationConfig = defaultLogRotationConfig
  ) {}

  /**
   * ���������
   */
  start(): void {
    if (this.rotationTimer) {
      return; // Ygk��U�fD�
    }

    // ޟL
    this.rotate().catch(error => {
      this.logger.error({ error }, 'Initial log rotation failed');
    });

    // ��L�-�
    this.rotationTimer = setInterval(() => {
      this.rotate().catch(error => {
        this.logger.error({ error }, 'Scheduled log rotation failed');
      });
    }, this.config.rotationIntervalMinutes * 60 * 1000);

    this.logger.info({
      config: this.config,
    }, 'Log rotation service started');
  }

  /**
   * ��������\b
   */
  stop(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
      this.logger.info('Log rotation service stopped');
    }
  }

  /**
   * ��������L
   */
  async rotate(): Promise<void> {
    this.logger.info('Starting log rotation');

    try {
      // API�n�������
      const apiLogCutoffDate = new Date();
      apiLogCutoffDate.setDate(apiLogCutoffDate.getDate() - this.config.retentionDays.apiLogs);
      
      const apiLogResult = await this.apiLogRepository.deleteOldLogs(apiLogCutoffDate);
      if (apiLogResult.isSuccess) {
        this.logger.info({
          deletedCount: apiLogResult.getValue(),
          cutoffDate: apiLogCutoffDate.toISOString(),
        }, 'API logs rotated');
      } else {
        this.logger.error({
          error: apiLogResult.getError(),
        }, 'Failed to rotate API logs');
      }

      // �<�n�������
      const authLogCutoffDate = new Date();
      authLogCutoffDate.setDate(authLogCutoffDate.getDate() - this.config.retentionDays.authLogs);
      
      const authLogResult = await this.authLogRepository.deleteOldLogs(authLogCutoffDate);
      if (authLogResult.isSuccess) {
        this.logger.info({
          deletedCount: authLogResult.getValue(),
          cutoffDate: authLogCutoffDate.toISOString(),
        }, 'Auth logs rotated');
      } else {
        this.logger.error({
          error: authLogResult.getError(),
        }, 'Failed to rotate auth logs');
      }

      // ���6P�n�������
      const rateLimitLogCutoffDate = new Date();
      rateLimitLogCutoffDate.setDate(
        rateLimitLogCutoffDate.getDate() - this.config.retentionDays.rateLimitLogs
      );
      
      const rateLimitLogResult = await this.rateLimitLogRepository.deleteOlderThan(
        rateLimitLogCutoffDate
      );
      if (rateLimitLogResult.isSuccess) {
        this.logger.info({
          cutoffDate: rateLimitLogCutoffDate.toISOString(),
        }, 'Rate limit logs rotated');
      } else {
        this.logger.error({
          error: rateLimitLogResult.getError(),
        }, 'Failed to rotate rate limit logs');
      }

      this.logger.info('Log rotation completed');
    } catch (error) {
      this.logger.error({ error }, 'Unexpected error during log rotation');
      throw error;
    }
  }
}

/**
 * PM2(n��������-�
 * PM2�(Y�4oecosystem.config.jsg�n-��(
 */
export const pm2LogRotateConfig = {
  max_size: '100M',          // ա�뵤�n
P
  retain: '30',              // �Y�ա��p
  compress: true,            // �D�'.
  dateFormat: 'YYYY-MM-DD', // ա��n��թ����
  workerInterval: '30',      // ����L��ïY����	
  rotateInterval: '0 0 * * *', // ��0Bk�������
  rotateModule: true,        // PM2n������������
};