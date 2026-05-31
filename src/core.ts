// Copyright 2026 Clay
// Licensed under the Apache License, Version 2.0

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

const tests: { name: string; fn: TestFn }[] = [];

export const test = (name: string, fn: TestFn) => {
  tests.push({ name, fn });
};

export const getTests = () => tests;
