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

class Expectation {
  constructor(
    private actual: any,
    public isNot = false,
  ) {}

  get not() {
    return new Expectation(this.actual, !this.isNot);
  }

  toBe(expected: any) {
    const isMatch = this.actual === expected;
    if (this.isNot ? isMatch : !isMatch) {
      throw new Error(
        `Expected ${this.isNot ? 'not ' : ''}${expected}, but got ${this.actual}`,
      );
    }
  }

  toEqual(expected: any) {
    const isMatch = JSON.stringify(this.actual) === JSON.stringify(expected);
    if (this.isNot ? isMatch : !isMatch) {
      throw new Error(
        `Expected ${this.isNot ? 'not ' : ''}${JSON.stringify(expected)}, but got ${JSON.stringify(this.actual)}`,
      );
    }
  }

  toContain(item: any) {
    const isMatch = this.actual.includes(item);
    if (this.isNot ? isMatch : !isMatch) {
      throw new Error(
        `Expected ${this.actual} ${this.isNot ? 'not ' : ''}to contain ${item}`,
      );
    }
  }

  toThrow(message?: string) {
    let errorThrown = false;
    try {
      this.actual();
    } catch (e: any) {
      errorThrown = true;
      if (message && !e.message.includes(message)) {
        throw new Error(
          `Expected error message to contain "${message}", but got "${e.message}"`,
        );
      }
    }

    if (this.isNot ? errorThrown : !errorThrown) {
      throw new Error(
        `Expected function ${this.isNot ? 'not ' : ''}to throw an error`,
      );
    }
  }

  toBeInstanceOf(constructor: any) {
    const isMatch = this.actual instanceof constructor;
    if (this.isNot ? isMatch : !isMatch) {
      throw new Error(
        `Expected value ${this.isNot ? 'not ' : ''}to be instance of ${constructor.name}`,
      );
    }
  }

  toChange(fn: () => void, { from, to }: { from?: any; to?: any } = {}) {
    const initial = this.actual();
    fn();
    const final = this.actual();

    if (from !== undefined && initial !== from) {
      throw new Error(`Expected state to start at ${from}, but got ${initial}`);
    }

    if (to !== undefined && final !== to) {
      throw new Error(`Expected state to change to ${to}, but got ${final}`);
    }

    if (initial === final) {
      throw new Error(`Expected state to change, but it remained ${initial}`);
    }
  }

  toMatchSnapshot(expected: string) {
    const actualStr = JSON.stringify(this.actual, null, 2);
    if (actualStr !== expected) {
      throw new Error(
        `Snapshot mismatch!\nExpected:\n${expected}\nGot:\n${actualStr}`,
      );
    }
  }

  toHaveBeenCalled(mockFn: any) {
    if (!mockFn.called) {
      throw new Error(`Expected function to be called, but it was not.`);
    }
  }

  toBeWithinRange(min: number, max: number) {
    if (this.actual < min || this.actual > max) {
      throw new Error(
        `Expected ${this.actual} to be between ${min} and ${max}`,
      );
    }
  }

  toBeCloseTo(expected: number, precision = 2) {
    const diff = Math.abs(this.actual - expected);
    const limit = Math.pow(10, -precision) / 2;
    if (this.isNot ? diff <= limit : diff > limit) {
      throw new Error(
        `Expected ${this.actual} to be close to ${expected} (precision: ${precision})`,
      );
    }
  }

  toSatisfy(predicate: (val: any) => boolean) {
    const result = predicate(this.actual);
    if (this.isNot ? result : !result) {
      throw new Error(
        `Expected value ${this.actual} to satisfy custom predicate`,
      );
    }
  }

  async toCompleteWithin(ms: number) {
    const start = Date.now();
    await this.actual();
    const duration = Date.now() - start;

    if (duration > ms) {
      throw new Error(
        `Expected execution to finish within ${ms}ms, but it took ${duration}ms`,
      );
    }
  }
}

export const expect = (actual: any) => new Expectation(actual);

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
