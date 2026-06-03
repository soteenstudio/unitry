# Unitry

A lightweight, high-performance testing library for developers who are tired of bloated dependencies and heavy frameworks. Built to be fast, simple, and reliable—even on modest hardware.

## Why Unitry?
Modern testing tools have become bloated and complicated. **Unitry** is designed as a minimalist alternative that respects your resources. Whether you are building complex systems, compilers, or just experimenting, Unitry provides the essential tools you need without the unnecessary overhead.

*   **Zero Bloat:** Minimal core, maximum efficiency.
*   **Low-Level Friendly:** Built with system-level projects in mind.
*   **Intuitive Assertions:** Powerful matchers that actually make sense.
*   **Thread-Safe Docking:** Seamless state sharing and enterprise-grade mocking built-in.
*   **Developer-First:** Designed to reduce frustration and improve feedback loops.

## Installation
```bash
npm install --save-dev unitry

# or nightly version
npm install --save-dev unitry@next
```

## Quick Start
Unitry follows a familiar syntax but keeps things lightweight:

```typescript
import { test, it, expect } from 'unitry';

test('should verify basic logic', () => {
  expect(1 + 1).toBe(2);
});

test('should handle asynchronous tasks', async () => {
  await expect(async () => {
    // perform your task
  }).toCompleteWithin(100);
});

it('should verify defined or truthy values with style', () => {
  const data = { role: 'developer' };
  expect(data.role).toBeDefined();
  expect(data.role).toBeTruthy();
});
```

## Global Utilities
Beyond basic test declarations, Unitry provides built-in utilities to organize your suites and manage console outputs cleanly:

| Function | Parameter | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `describe` | name, fn | `string`, `() => void` | Groups related tests into a named test suite block. |
| `suppressConsole` | fn | `() => R` | Automatically suppresses `console.log` and `console.error` logs during execution, supporting both synchronous and asynchronous functions. |

## Test Context (`ctx`)
When a test block is executed, Unitry injects a `TestContext` object as the first argument of your test function. This provides direct assertions and contextual control over thread state:

| Property / Method | Parameter | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `equal` | actual, expected | `any`, `any` | Perform a direct deep equality check without wrapping the value in `expect()`. |
| `fail` | message | `string` | Forcefully fail the current test immediately with a custom error message. |
| `dock.anchor` | key, data | `string`, `any` | Anchor data into the global dock store to share it with other worker threads. |
| `dock.pull` | key | `string` | Retrieve previously anchored data from the global dock store (returns `R \ | null`). |

## Features
Unitry comes with a comprehensive set of matchers tailored for precision:

| Matcher | Parameter | Data Type | Description |
| :--- | :--- | :--- | :--- |
| toBe | expected | `T` | Basic strict equality check (`===`). |
| toEqual | expected | `any` | Deep equality check for objects and arrays. |
| toContain | item | `any` | Check array items or substring existence. |
| toThrow | message | `string` (Optional) | Validate error handling and optional error message substring. |
| toChange | fn, options | `() => void`, `{ from?: any; to?: any }` | Track state mutations efficiently before and after a function runs. |
| toBeInstanceOf | constructor | `new (...args: any[]) => any` | Verify if a value is an instance of a specific class/constructor. |
| toMatchSnapshot | expected | `string` | Compare structural stringified data against a baseline snapshot. |
| toHaveBeenCalled | None | `None` | Assert that a mock function (`fn()`) was invoked at least once. |
| toHaveBeenCalledTimes | times | `number` | Assert the exact number of times a mock function was called. |
| toBeWithinRange | min, max | `number`, `number` | Perfect for checking boundaries like memory offsets and system limits. |
| toBeCloseTo | expected, precision | `number`, `number` (Optional, default: 2) | Precision handling for floating-point math comparisons. |
| toSatisfy | predicate | `(val: T) => boolean` | Run assertions against custom logic predicates. |
| toCompleteWithin | ms | `number` | Performance guard against slow asynchronous or synchronous execution. |
| toBeDefined | None | `None` | Check if a value is strictly defined (`!== undefined`). |
| toBeUndefined | None | `None` | Check if a value is strictly undefined (`=== undefined`). |
| toBeNull | None | `None` | Verify strict `null` values. |
| toBeTruthy | None | `None` | Evaluate if a value is truthy in a boolean context. |
| toBeFalsy | None | `None` | Evaluate if a value is falsy (like `0`, `""`, `null`, `undefined`). |
| toBeGreaterThan | expected | `number` | Assert if the actual number is strictly greater than the threshold. |
| toBeLessThan | expected | `number` | Assert if the actual number is strictly less than the threshold. |

## Mocking and State Docking
Unitry provides built-in utilities for isolated mock functions and crossing worker thread boundaries easily:

### Mock Functions
Track calls, arguments, and control return values effortlessly:

```typescript
import { test, expect, fn } from 'unitry';

test('should track function invocations', () => {
  const mockApi = fn((name: string) => `Hello ${name}`);

  mockApi('Clay');

  expect(mockApi).toHaveBeenCalled();
  expect(mockApi).toHaveBeenCalledTimes(1);
});
```

## State Docking
Pass safely encapsulated data between test suites running on different worker threads via ctx.dock:

```typescript
import { test } from 'unitry';

test('suite alpha: anchor global state', (ctx) => {
  ctx.dock.anchor('shared_token', { token: 'secret-xyz' });
});

test('suite beta: pull anchored state', (ctx) => {
  const session = ctx.dock.pull<{ token: string }>('shared_token');
  // session now holds { token: 'secret-xyz' }
});
```

## Philosophy
We prioritize effort and trying over making promises. This framework is built for those who prefer to understand their tools rather than fighting against them.

## License
This project is licensed under the [Apache-2.0 License](./LICENSE).