/**
 * Copyright 2026 SoTeen Studio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

type TestFn = () => void | Promise<void>;

const isDeepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  )
    return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !isDeepEqual(a[key], b[key])) return false;
  }
  return true;
};

class Expectation<T = any> {
  constructor(
    private actual: T,
    public isNot = false,
  ) {}

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.isNot);
  }

  private assert(condition: boolean, message: string) {
    const finalCondition = this.isNot ? condition : !condition;
    if (finalCondition) {
      throw new Error(message);
    }
  }

  toBe(expected: T) {
    this.assert(
      this.actual === expected,
      `Expected ${this.isNot ? 'not ' : ''}${expected}, but got ${this.actual}`,
    );
  }

  toEqual(expected: any) {
    this.assert(
      isDeepEqual(this.actual, expected),
      `Expected ${this.isNot ? 'not ' : ''}${JSON.stringify(expected)}, but got ${JSON.stringify(this.actual)}`,
    );
  }

  toContain(item: any) {
    const hasItem =
      Array.isArray(this.actual) || typeof this.actual === 'string'
        ? (this.actual as any).includes(item)
        : false;

    this.assert(
      hasItem,
      `Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to contain ${JSON.stringify(item)}`,
    );
  }

  toThrow(message?: string) {
    if (typeof this.actual !== 'function') {
      throw new Error('actual value must be a function to test exceptions');
    }

    let errorThrown = false;
    let caughtError: any = null;

    try {
      this.actual();
    } catch (e: any) {
      errorThrown = true;
      caughtError = e;
    }

    if (errorThrown && message && !caughtError?.message?.includes(message)) {
      throw new Error(
        `Expected error message to contain "${message}", but got "${caughtError.message}"`,
      );
    }

    this.assert(
      errorThrown,
      `Expected function ${this.isNot ? 'not ' : ''}to throw an error`,
    );
  }

  toBeInstanceOf(constructor: new (...args: any[]) => any) {
    this.assert(
      this.actual instanceof constructor,
      `Expected value ${this.isNot ? 'not ' : ''}to be instance of ${constructor.name}`,
    );
  }

  toChange(fn: () => void, { from, to }: { from?: any; to?: any } = {}) {
    if (typeof this.actual !== 'function') {
      throw new Error(
        'actual value must be a getter function to observe state change',
      );
    }

    const initial = this.actual();
    fn();
    const final = this.actual();

    if (from !== undefined && initial !== from) {
      throw new Error(`Expected state to start at ${from}, but got ${initial}`);
    }

    if (to !== undefined && final !== to) {
      throw new Error(`Expected state to change to ${to}, but got ${final}`);
    }

    this.assert(
      initial !== final,
      `Expected state to change, but it remained ${initial}`,
    );
  }

  toMatchSnapshot(expected: string) {
    const actualStr = JSON.stringify(this.actual, null, 2);
    this.assert(
      actualStr === expected,
      `Snapshot mismatch!\nExpected:\n${expected}\nGot:\n${actualStr}`,
    );
  }

  toHaveBeenCalled(mockFn: { called: boolean }) {
    this.assert(
      mockFn.called,
      `Expected function ${this.isNot ? 'not ' : ''}to be called.`,
    );
  }

  toBeWithinRange(min: number, max: number) {
    const val = this.actual as unknown as number;
    this.assert(
      val >= min && val <= max,
      `Expected ${val} ${this.isNot ? 'not ' : ''}to be between ${min} and ${max}`,
    );
  }

  toBeCloseTo(expected: number, precision = 2) {
    const val = this.actual as unknown as number;
    const diff = Math.abs(val - expected);
    const limit = Math.pow(10, -precision) / 2;

    this.assert(
      diff <= limit,
      `Expected ${val} ${this.isNot ? 'not ' : ''}to be close to ${expected} (precision: ${precision})`,
    );
  }

  toSatisfy(predicate: (val: T) => boolean) {
    this.assert(
      predicate(this.actual),
      `Expected value ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to satisfy custom predicate`,
    );
  }

  async toCompleteWithin(ms: number) {
    if (typeof this.actual !== 'function') {
      throw new Error(
        'actual value must be a function to measure execution time',
      );
    }

    const start = performance.now();
    await (this.actual as Function)();
    const duration = performance.now() - start;

    this.assert(
      duration <= ms,
      `Expected execution to finish within ${ms}ms, but it took ${duration.toFixed(2)}ms`,
    );
  }
}

export const expect = <T>(actual: T) => new Expectation<T>(actual);

export const suppressConsole = <R>(
  fn: () => R,
): R extends Promise<any> ? Promise<any> : R => {
  const originalLog = console.log;
  const originalError = console.error;

  console.log = () => {};
  console.error = () => {};

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(() => {
        console.log = originalLog;
        console.error = originalError;
      }) as any;
    }
    console.log = originalLog;
    console.error = originalError;
    return result as any;
  } catch (error) {
    console.log = originalLog;
    console.error = originalError;
    throw error;
  }
};

const GLOBAL_TEST_KEY = Symbol.for('unitry.tests');

if (!(globalThis as any)[GLOBAL_TEST_KEY]) {
  (globalThis as any)[GLOBAL_TEST_KEY] = [];
}

const tests = (globalThis as any)[GLOBAL_TEST_KEY];

export const test = (name: string, fn: TestFn) => {
  tests.push({
    name,
    fn,
    run: async () => {
      try {
        await fn();
        return { name, passed: true };
      } catch (err: any) {
        return { name, passed: false, error: err.message };
      }
    },
  });
};

export const getTests = () => tests;
