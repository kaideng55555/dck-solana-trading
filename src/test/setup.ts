import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers)

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

function connections ( QuickNode: any )
{
  if (!QuickNode) {
    throw new Error('QuickNode parameter is required')
  }
  
  // Mock or initialize WebSocket connections for testing
  return {
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    isConnected: () => false,
    send: (data: any) => Promise.resolve(),
    on: (event: string, handler: Function) => {},
    off: (event: string, handler: Function) => {}
  }
}
