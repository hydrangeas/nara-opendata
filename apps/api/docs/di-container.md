# Dependency Injection Container

This document describes the dependency injection (DI) container implementation using TSyringe in the
API application.

## Overview

The DI container provides:

- Centralized dependency management
- Easy mocking for tests
- Type-safe dependency injection
- Clean separation of concerns

## Setup

### Installation

The following packages are already installed:

- `tsyringe`: Dependency injection container
- `reflect-metadata`: Required for decorator support

### Configuration

The container is configured in `src/container.ts`:

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';
import { TYPES } from './types/di';

// Initialize the container
initializeContainer();
```

## Usage

### 1. Registering Dependencies

Dependencies are registered during container initialization:

```typescript
// Infrastructure services
container.register<ILogger>(TYPES.ILogger, {
  useFactory: () => new ConsoleLogger(),
});

// Domain services
container.register(TYPES.AuthenticationService, {
  useClass: AuthenticationServiceClass,
});
```

### 2. Resolving Dependencies

Use the `resolve` helper function:

```typescript
import { resolve } from './container';
import { TYPES } from './types/di';

const authService = resolve<AuthenticationServiceClass>(TYPES.AuthenticationService);
```

### 3. Constructor Injection

Use `@injectable()` and `@inject()` decorators:

```typescript
@injectable()
export class AuthenticationServiceClass {
  constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {}
}
```

## Token Definitions

All DI tokens are defined in `src/types/di.ts`:

```typescript
export const TYPES = {
  // Infrastructure
  ILogger: Symbol.for('ILogger'),
  IEventBus: Symbol.for('IEventBus'),

  // Domain Services
  AuthenticationService: Symbol.for('AuthenticationService'),
  APIAccessControlService: Symbol.for('APIAccessControlService'),

  // Repositories
  IOpenDataRepository: Symbol.for('IOpenDataRepository'),
  IRateLimitRepository: Symbol.for('IRateLimitRepository'),
  // ... etc
} as const;
```

## Testing

### Test Setup

Use the test helpers in `src/test-utils/di-helpers.ts`:

```typescript
import { setupTestContainer, teardownTestContainer } from './test-utils/di-helpers';

beforeEach(() => {
  setupTestContainer();
});

afterEach(() => {
  teardownTestContainer();
});
```

### Mock Implementations

The test setup automatically provides mock implementations:

- `MockLogger`: Captures log calls for assertions
- `MockEventBus`: Records published events
- Mock repositories: Return sensible defaults

### Example Test

```typescript
it('should inject dependencies correctly', () => {
  const logger = resolve<ILogger>(TYPES.ILogger);
  const authService = resolve<AuthenticationServiceClass>(TYPES.AuthenticationService);

  // Use the service
  const result = authService.someMethod();

  // Assert on mock logger
  expect(logger).toHaveBeenCalledWith('Expected log message');
});
```

## Best Practices

1. **Use Symbols for Tokens**: Prevents naming collisions
2. **Register Early**: Initialize container at application startup
3. **Avoid Service Locator**: Prefer constructor injection
4. **Test Isolation**: Always reset container between tests
5. **Type Safety**: Use generic types with resolve function

## Migration Guide

### From Object Literal to Class

The domain services maintain backward compatibility:

```typescript
// Old usage (still works)
import { AuthenticationService } from './AuthenticationService';
AuthenticationService.createAuthenticatedUserFromJWT(payload);

// New usage (with DI)
const authService = resolve<AuthenticationServiceClass>(TYPES.AuthenticationService);
authService.createAuthenticatedUserFromJWT(payload);
```

### Adding New Services

1. Define the token in `src/types/di.ts`
2. Create the service class with `@injectable()`
3. Register in `container.ts`
4. Add mock if needed for tests

## Troubleshooting

### "Cannot inject dependency" Error

Ensure the dependency is registered before resolving:

- Check `initializeContainer()` is called
- Verify token is defined in TYPES
- Confirm service has `@injectable()` decorator

### "TypeInfo not known" Error

The class needs decorator metadata:

- Add `@injectable()` to the class
- Or use factory registration instead of `useClass`

### Test Failures

- Ensure `setupTestContainer()` is called in `beforeEach`
- Use `teardownTestContainer()` in `afterEach`
- Check mock implementations return expected values
