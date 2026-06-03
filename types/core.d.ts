/**
 * Copyright 2026 SoTeen Studio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
interface TestContext {
    equal: (actual: any, expected: any) => void;
    fail: (message: string) => void;
    dock: {
        anchor: (key: string, data: any) => void;
        pull: <R = any>(key: string) => R | null;
    };
}
type TestFn = (ctx: TestContext) => void | Promise<void>;
interface MockFunction {
    (...args: any[]): any;
    called: boolean;
    calls: any[][];
    mockReturnValue: (val: any) => void;
    mockImplementation: (implementation: (...args: any[]) => any) => void;
}
export declare const fn: (defaultImplementation?: (...args: any[]) => any) => MockFunction;
declare class Expectation<T = any> {
    private actual;
    isNot: boolean;
    constructor(actual: T, isNot?: boolean);
    get not(): Expectation<T>;
    private assert;
    toBe(expected: T): void;
    toEqual(expected: any): void;
    toContain(item: any): void;
    toThrow(message?: string): void;
    toBeInstanceOf(constructor: new (...args: any[]) => any): void;
    toChange(fn: () => void, { from, to }?: {
        from?: any;
        to?: any;
    }): void;
    toMatchSnapshot(expected: string): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledTimes(times: number): void;
    toBeWithinRange(min: number, max: number): void;
    toBeCloseTo(expected: number, precision?: number): void;
    toSatisfy(predicate: (val: T) => boolean): void;
    toCompleteWithin(ms: number): Promise<void>;
}
export declare const expect: <T>(actual: T) => Expectation<T>;
export declare const suppressConsole: <R>(fn: () => R) => R extends Promise<any> ? Promise<any> : R;
export declare const describe: (name: string, fn: () => void) => void;
export declare const test: (name: string, fn: TestFn) => void;
export declare const getTests: () => {
    name: string;
    suiteName: string | null;
    run: () => Promise<{
        passed: boolean;
        error: any;
    }>;
}[];
export {};
