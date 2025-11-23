import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

## Testing Strategy
- **Vitest**: Used for unit and component testing.
- **Real-time**: `useRealWS.ts` handles live WebSocket connections (QuickNode).
- **Setup**: `src/test/setup.ts` configures the test environment.