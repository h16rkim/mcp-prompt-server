/**
 * 간단한 로거 유틸리티
 * DEBUG 환경변수가 'true'일 때만 로그를 출력합니다.
 */
export class Logger {
  private static readonly isDebugEnabled = process.env.DEBUG === 'true';

  private static formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * stderr로 로그를 출력하여 MCP의 stdio 통신을 방해하지 않도록 합니다.
   */
  private static writeLog(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, error?: unknown): void {
    if (!this.isDebugEnabled) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message);
    
    // stderr로 출력하여 stdout의 JSON-RPC 메시지와 분리
    process.stderr.write(formattedMessage + '\n');
    
    if (error) {
      process.stderr.write(String(error) + '\n');
    }
  }

  static info(message: string): void {
    this.writeLog('INFO', message);
  }

  static warn(message: string): void {
    this.writeLog('WARN', message);
  }

  static error(message: string, error?: unknown): void {
    this.writeLog('ERROR', message, error);
  }

  static debug(message: string): void {
    this.writeLog('DEBUG', message);
  }
}
