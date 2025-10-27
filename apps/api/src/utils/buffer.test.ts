import { describe, it, expect, beforeEach } from "vitest";

// Simples buffer/cache FIFO para testes
class SimpleBuffer<T> {
  private size: number;
  private buffer: T[];
  constructor(size = 5) {
    this.size = size;
    this.buffer = [];
  }
  add(item: T): void {
    if (this.buffer.length >= this.size) {
      this.buffer.shift();
    }
    this.buffer.push(item);
  }
  getAll(): T[] {
    return [...this.buffer];
  }
  clear(): void {
    this.buffer = [];
  }
}

describe("SimpleBuffer (FIFO cache)", () => {
  let buffer: SimpleBuffer<number | string>;
  beforeEach(() => {
    buffer = new SimpleBuffer<number | string>(3);
  });

  it("adiciona itens até o limite", () => {
    buffer.add(1);
    buffer.add(2);
    expect(buffer.getAll()).toEqual([1, 2]);
  });

  it("remove o mais antigo ao exceder o limite", () => {
    buffer.add(1);
    buffer.add(2);
    buffer.add(3);
    buffer.add(4);
    expect(buffer.getAll()).toEqual([2, 3, 4]);
  });

  it("limpa corretamente", () => {
    buffer.add("a");
    buffer.add("b");
    buffer.clear();
    expect(buffer.getAll()).toEqual([]);
  });
});
