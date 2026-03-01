export class Logger {
  constructor(public scope: string) {}

  private format(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.scope}]: ${message}`;
  }

  info(message: string): void {
    console.log(this.format("INFO", message));
  }

  warn(message: string): void {
    console.warn(this.format("WARN", message));
  }

  error(message: string): void {
    console.error(this.format("ERROR", message));
  }
}