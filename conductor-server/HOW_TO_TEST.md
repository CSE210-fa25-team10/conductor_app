# How to Run Tests

## 🚀 Quick Start

### Step 1: Install Dependencies

First, make sure all test dependencies are installed:

```bash
cd conductor-server
npm install
```

This will install the following test-related dependencies:
- `vitest` - Test framework
- `@vitest/ui` - Test UI interface
- `@vitest/coverage-v8` - Code coverage tool
- `supertest` - HTTP testing tool

### Step 2: Run Tests

#### Method 1: Interactive Testing (Recommended for Development)

```bash
npm test
```

This starts Vitest in watch mode, which automatically re-runs tests when you modify code.

#### Method 2: Run Tests Once (For CI/CD)

```bash
npm run test:run
```

This runs all tests once and then exits.

#### Method 3: Use Test UI Interface (Visual)

```bash
npm run test:ui
```

This opens a browser interface where you can:
- View all tests
- View test results
- View details of failed tests
- Re-run specific tests

#### Method 4: Generate Code Coverage Report

```bash
npm run test:coverage
```

This will:
1. Run all tests
2. Generate coverage report
3. Display coverage summary in terminal
4. Generate HTML report in `coverage/` directory

To view the HTML report:
```bash
# Windows
start coverage/index.html

# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html
```

## 📋 Test File Structure

Test files are located in the `tests/` directory, organized to match the source code structure:

```
tests/
├── domain/entities/        # Domain entity tests
│   ├── User.test.js
│   ├── Course.test.js
│   └── Activity.test.js
├── app/
│   ├── dto/                # DTO converter tests
│   │   ├── userToDTO.test.js
│   │   ├── courseToDTO.test.js
│   │   └── activityToDTO.test.js
│   └── usecases/          # Use case tests
│       └── searchUsers.test.js
├── controllers/            # Controller tests
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

## 🎯 Running Specific Tests

### Run a Single Test File

```bash
# Use Vitest's filter feature
npm test -- User.test.js
```

### Run Tests Matching a Pattern

```bash
# Run all entity tests
npm test -- entities

# Run all DTO tests
npm test -- dto
```

### Run Specific Test Cases

In test files, you can use `.only` to run only specific tests:

```javascript
it.only('should create a User entity', () => {
  // Only this test will run
});
```

Or use `.skip` to skip tests:

```javascript
it.skip('should handle edge case', () => {
  // This test will be skipped
});
```

## 📊 Viewing Test Results

### Terminal Output Example

After running tests, you'll see output like this:

```
✓ tests/domain/entities/User.test.js (4)
  ✓ User Entity (4)
    ✓ should create a User entity with all properties
    ✓ should create a User entity with partial data
    ✓ should return a frozen object (immutable)
    ✓ should handle undefined values

Test Files  1 passed (1)
     Tests  4 passed (4)
      Time  234ms
```

### Failed Tests

If a test fails, you'll see detailed error information:

```
✗ tests/domain/entities/User.test.js (1)
  ✗ User Entity (1)
    ✗ should create a User entity with all properties

AssertionError: expected 1 to be 2
  at tests/domain/entities/User.test.js:15:20
```

## 🔧 Debugging Tests

### Using Debugger

1. Set breakpoints in test files
2. In VS Code, press `F5` to start debugging
3. Select "Node.js" debug configuration
4. Or use Chrome DevTools

### Using console.log

Add logging in tests:

```javascript
it('should test something', () => {
  console.log('Debug info:', someVariable);
  expect(something).toBe(expected);
});
```

### Using Vitest Debug Features

```bash
# Run tests with verbose output
npm test -- --reporter=verbose
```

## ⚙️ Configuration

Test configuration is in `vitest.config.js`:

```javascript
export default defineConfig({
  test: {
    globals: true,        // Globally available describe, it, expect
    environment: 'node',    // Node.js environment
    coverage: {
      provider: 'v8',      // Use V8 coverage
      reporter: ['text', 'json', 'html'],
      exclude: [           // Excluded files
        'node_modules/',
        'tests/',
        '*.config.js'
      ]
    }
  }
});
```

## 🐛 Common Issues

### 1. Module Import Errors

**Problem**: `Cannot find module` or `ERR_MODULE_NOT_FOUND`

**Solution**: 
- Ensure you use `.js` extension
- Check that file paths are correct
- Make sure `package.json` has `"type": "module"`

### 2. Mocks Not Working

**Problem**: Mock functions are not being called

**Solution**:
- Ensure `vi.mock()` is called before imports
- Check that module paths are correct
- Use `vi.clearAllMocks()` in `beforeEach` to clean up

### 3. Async Test Failures

**Problem**: Test timeout or unhandled Promise

**Solution**:
- Ensure you use `async/await`
- Check that Promise is returned
- Increase timeout: `it('test', async () => {...}, { timeout: 5000 })`

### 4. Slow Test Execution

**Problem**: Tests execute slowly

**Solution**:
- Use `vi.mock()` to mock external dependencies
- Avoid connecting to real databases in tests
- Use `test.concurrent` to run tests in parallel

## 📈 Code Coverage

### View Coverage

After running coverage tests, view the report:

```bash
npm run test:coverage
```

Coverage report includes:
- **Statement Coverage** (Statements)
- **Branch Coverage** (Branches)
- **Function Coverage** (Functions)
- **Line Coverage** (Lines)

### Coverage Goals

- Statement Coverage: ≥ 80%
- Branch Coverage: ≥ 75%
- Function Coverage: ≥ 80%
- Line Coverage: ≥ 80%

### Improving Coverage

1. Run coverage tests to find uncovered code
2. Add tests for uncovered code
3. Pay special attention to edge cases and error handling

## 🎓 Testing Best Practices

1. **Test Naming**: Use descriptive names
   ```javascript
   // ✅ Good
   it('should return user when email exists in database')
   
   // ❌ Bad
   it('test user')
   ```

2. **Test Organization**: Use `describe` blocks to organize related tests
   ```javascript
   describe('User Entity', () => {
     describe('creation', () => {
       it('should create with all properties', ...)
     })
   })
   ```

3. **Test Isolation**: Each test should be independent
   ```javascript
   beforeEach(() => {
     // Clean up state
     vi.clearAllMocks()
   })
   ```

4. **Mock External Dependencies**: Don't depend on real external services
   ```javascript
   vi.mock('../../services/authService.js')
   ```

5. **Test Edge Cases**: Include normal, error, and boundary values
   ```javascript
   it('should handle empty input')
   it('should handle null input')
   it('should handle invalid input')
   ```

## 📚 Additional Resources

- [Vitest Official Documentation](https://vitest.dev/)
- [Test Documentation](./tests/README.md)
- [Test Checklist](./TEST_CHECKLIST.md)

---

**Tip**: If you encounter issues, check the error messages in the test output, or refer to `tests/README.md` for more help.
