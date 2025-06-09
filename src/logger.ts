/**
 * Centralized logging utility for UIFlow
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private debugMode: boolean | 'verbose';

  constructor(debugMode: boolean | 'verbose' = false) {
    this.debugMode = debugMode;
  }

  setDebugMode(debugMode: boolean | 'verbose'): void {
    this.debugMode = debugMode;
  }

  debug(message: string, ...args: any[]): void {
    if (this.debugMode === 'verbose') {
      console.log(`🐛 [UIFlow Debug] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.debugMode) {
      console.log(`ℹ️ [UIFlow] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.debugMode) {
      console.warn(`⚠️ [UIFlow] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    // Always log errors regardless of debug mode
    console.error(`❌ [UIFlow] ${message}`, ...args);
  }

  // Specific logging methods for UIFlow features
  interaction(elementId: string, count: number): void {
    this.debug(`Interaction recorded: ${elementId} (total: ${count})`);
  }

  elementRegistered(elementId: string, interactions: number): void {
    this.debug(`Element ${elementId} registered with interactions: ${interactions}`);
  }

  configLoaded(name: string, version: string): void {
    this.info(`Configuration loaded: ${name} v${version}`);
  }

  ruleExecuted(ruleName: string): void {
    this.info(`Rule executed: ${ruleName}`);
  }

  categoryUnlocked(category: string, area: string, count: number): void {
    this.info(`Unlocked ${count} elements in category ${category}/${area}`);
  }

  simulation(type: string, areas: string[]): void {
    this.info(`Simulated ${type} user for areas: ${areas.join(', ')}`);
  }

  areaReset(area: string): void {
    this.info(`Reset ${area} to initial state`);
  }

  storage(action: string, details?: any): void {
    this.debug(`Storage ${action}`, details);
  }
}

// Default logger instance
export const logger = new Logger();
