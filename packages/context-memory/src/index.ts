export class ContextManager {
  private memory: Map<string, any> = new Map();

  set(key: string, value: any): void {
    this.memory.set(key, value);
  }

  get(key: string): any {
    return this.memory.get(key);
  }

  clear(): void {
    this.memory.clear();
  }
}