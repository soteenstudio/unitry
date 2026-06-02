/**
 * Copyright 2026
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
type TestFn = () => void | Promise<void>;
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
    toHaveBeenCalled(mockFn: {
        called: boolean;
    }): void;
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
        name: string;
        suiteName: string | null;
        passed: boolean;
        error?: undefined;
    } | {
        name: string;
        suiteName: string | null;
        passed: boolean;
        error: any;
    }>;
}[];
export {};
