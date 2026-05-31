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
  constructor(private actual: any) {}
  toBe(expected: any) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${expected}, but got ${this.actual}`);
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
  tests.push({ name, fn });
};

export const getTests = () => tests;
