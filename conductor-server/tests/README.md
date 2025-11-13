# Test Documentation

This directory contains all test files for the Conductor backend server.

## Quick Reference

For detailed information on how to run tests, see [HOW_TO_TEST.md](../HOW_TO_TEST.md) in the root directory.

### Quick Commands

```bash
# Run all tests (watch mode)
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Open test UI
npm run test:ui
```

## Test Structure

Test files are organized to match the source code structure:

```
tests/
├── domain/
│   └── entities/          # Domain entity tests
│       ├── User.test.js
│       ├── Course.test.js
│       └── Activity.test.js
├── app/
│   ├── dto/               # DTO converter tests
│   │   ├── userToDTO.test.js
│   │   ├── courseToDTO.test.js
│   │   └── activityToDTO.test.js
│   └── usecases/          # Use case tests
│       └── searchUsers.test.js
├── controllers/           # Controller tests
│   └── authController.test.js
├── services/              # Service tests
│   └── authService.test.js
├── adapters/
│   ├── in/routes/         # Route tests
│   │   └── authRoutes.test.js
│   └── out/db/            # Database adapter tests
│       └── PgClassRepository.test.js
├── db.test.js             # Database module tests
└── helpers/               # Test helper utilities
    └── testHelpers.js
```

## Test Coverage

### Implemented Tests

- **Domain Entities**: User, Course, Activity
- **DTO Converters**: userToDTO, courseToDTO, activityToDTO
- **Use Cases**: searchUsers
- **Controllers**: authController
- **Services**: authService
- **Database Adapters**: PgClassRepository
- **Database Module**: db (health checks)
- **Routes**: authRoutes

## Adding New Tests

When adding new functionality:

1. Create a test file in the corresponding directory (matching source structure)
2. Follow existing test patterns
3. Ensure tests cover main functionality and edge cases
4. Run tests to ensure they pass: `npm test`
5. Check code coverage: `npm run test:coverage`

## Test Framework

This project uses **Vitest** for testing. See [HOW_TO_TEST.md](../HOW_TO_TEST.md) for:
- Detailed setup instructions
- Running specific tests
- Debugging tips
- Configuration options
- Common issues and solutions
- Best practices

## Coverage Goals

- Statement Coverage: ≥ 80%
- Branch Coverage: ≥ 75%
- Function Coverage: ≥ 80%
- Line Coverage: ≥ 80%

---

For more information, see [HOW_TO_TEST.md](../HOW_TO_TEST.md) in the root directory.
