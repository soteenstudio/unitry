# Unitry

A lightweight, high-performance testing library for developers who are tired of bloated dependencies and heavy frameworks. Built to be fast, simple, and reliable—even on modest hardware.

## Why Unitry?
Modern testing tools have become bloated and complicated. **Unitry** is designed as a minimalist alternative that respects your resources. Whether you are building complex systems, compilers, or just experimenting, Unitry provides the essential tools you need without the unnecessary overhead.

*   **Zero Bloat:** Minimal core, maximum efficiency.
*   **Low-Level Friendly:** Built with system-level projects in mind.
*   **Intuitive Assertions:** Powerful matchers that actually make sense.
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
import { test, expect } from 'unitry';

test('should verify basic logic', () => {
  expect(1 + 1).toBe(2);
});

test('should handle asynchronous tasks', async () => {
  await expect(async () => {
    // perform your task
  }).toCompleteWithin(100);
});
```

## Features
Unitry comes with a comprehensive set of matchers tailored for precision:
| Matcher | Description |
|---------|-------------|
| toBe / toEqual | Basic equality checks. |
| toContain | Check array items or substring existence. |
| toThrow | Validate error handling. |
| toChange | Track state mutations efficiently. |
| toBeWithinRange | Perfect for memory offsets and system limits. |
| toBeCloseTo | Precision handling for floating-point math. |
| toCompleteWithin | Performance guard against slow execution. |
| toSatisfy | Custom logic predicates. |

## Philosophy
We prioritize effort and trying over making promises. This framework is built for those who prefer to understand their tools rather than fighting against them.

## License
This project is licensed under the [Apache-2.0 License](./LICENSE).