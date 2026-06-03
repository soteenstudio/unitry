/**
 * Copyright 2026 SoTeen Studio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { workerData, parentPort } from 'node:worker_threads';

interface TestContext {
  equal: (actual: any, expected: any) => void;
  fail: (message: string) => void;
  dock: {
    anchor: (key: string, data: any) => void;
    pull: <R = any>(key: string) => R | null;
  };
}

type TestFn = (ctx: TestContext) => void | Promise<void>;

interface TestDefinition {
  name: string;
  fn: TestFn;
  suiteName: string | null;
}

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

interface MockFunction {
  (...args: any[]): any;
  called: boolean;
  calls: any[][];
  mockReturnValue: (val: any) => void;
  mockImplementation: (implementation: (...args: any[]) => any) => void;
}

export const fn = (
  defaultImplementation?: (...args: any[]) => any,
): MockFunction => {
  let currentImplementation = defaultImplementation || (() => {});
  let returnValue: any = undefined;
  let hasCustomReturn = false;

  const mock = (...args: any[]) => {
    mock.called = true;
    mock.calls.push(args);

    if (hasCustomReturn) {
      return returnValue;
    }
    return currentImplementation(...args);
  };

  mock.called = false;
  mock.calls = [] as any[][];

  mock.mockReturnValue = (val: any) => {
    returnValue = val;
    hasCustomReturn = true;
  };

  mock.mockImplementation = (implementation: (...args: any[]) => any) => {
    currentImplementation = implementation;
    hasCustomReturn = false;
  };

  return mock;
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

  toHaveBeenCalled() {
    const mock = this.actual as any;
    this.assert(
      mock && mock.called === true,
      `Expected function ${this.isNot ? 'not ' : ''}to be called.`,
    );
  }

  toHaveBeenCalledTimes(times: number) {
    const mock = this.actual as any;
    const callCount = mock?.calls?.length || 0;
    this.assert(
      callCount === times,
      `Expected function ${this.isNot ? 'not ' : ''}to be called ${times} times, but was called ${callCount} times.`,
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

  toBeDefined() {
    this.assert(
      this.actual !== undefined,
      `Expected value ${this.isNot ? 'not ' : ''}to be defined, but got undefined`,
    );
  }

  toBeUndefined() {
    this.assert(
      this.actual === undefined,
      `Expected ${this.isNot ? 'not ' : ''}undefined, but got ${JSON.stringify(this.actual)}`,
    );
  }

  toBeNull() {
    this.assert(
      this.actual === null,
      `Expected value ${this.isNot ? 'not ' : ''}to be null, but got ${JSON.stringify(this.actual)}`,
    );
  }

  toBeTruthy() {
    this.assert(
      !!this.actual,
      `Expected value ${this.isNot ? 'not ' : ''}to be truthy, but got ${JSON.stringify(this.actual)}`,
    );
  }

  toBeFalsy() {
    this.assert(
      !this.actual,
      `Expected value ${this.isNot ? 'not ' : ''}to be falsy, but got ${JSON.stringify(this.actual)}`,
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
const GLOBAL_SUITE_KEY = Symbol.for('unitry.active_suite');

if (!(globalThis as any)[GLOBAL_TEST_KEY]) {
  (globalThis as any)[GLOBAL_TEST_KEY] = [];
}

const rawTests: TestDefinition[] = (globalThis as any)[GLOBAL_TEST_KEY];

(globalThis as any)[GLOBAL_SUITE_KEY] = null;

export const describe = (name: string, fn: () => void) => {
  const previousSuite = (globalThis as any)[GLOBAL_SUITE_KEY];

  (globalThis as any)[GLOBAL_SUITE_KEY] = previousSuite
    ? `${previousSuite} > ${name}`
    : name;

  fn();

  (globalThis as any)[GLOBAL_SUITE_KEY] = previousSuite;
};

export const test = (name: string, fn: TestFn) => {
  const currentSuite = (globalThis as any)[GLOBAL_SUITE_KEY];
  rawTests.push({
    name,
    fn,
    suiteName: currentSuite,
  });
};

export const getTests = () => {
  const clonedTests = [...rawTests];

  rawTests.length = 0;

  return clonedTests.map((t) => ({
    name: t.name,
    suiteName: t.suiteName,
    run: async () => {
      const initialDockStore = workerData?.dockStore || {};

      const context: TestContext = {
        equal: (actual: any, expected: any) => {
          if (!isDeepEqual(actual, expected)) {
            throw new Error(
              `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
            );
          }
        },
        fail: (message: string) => {
          throw new Error(message);
        },
        dock: {
          anchor: (key: string, data: any) => {
            parentPort?.postMessage({
              type: 'DOCK_ANCHOR',
              key,
              data,
            });
            initialDockStore[key] = data;
          },
          pull: <R = any>(key: string): R | null => {
            return (initialDockStore[key] as R) || null;
          },
        },
      };

      try {
        await t.fn(context);
        return { passed: true, error: null };
      } catch (err: any) {
        return { passed: false, error: err.message || String(err) };
      }
    },
  }));
};
