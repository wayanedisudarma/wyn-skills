---
name: java-spring-boot-unit-testing
description: Guidelines and patterns for writing unit tests in Spring Boot applications using JUnit 5 and Mockito, following Detroit Style TDD.
---

# Unit Testing Skill (Detroit Style TDD)

This skill provides the standard approach for writing unit tests in Spring Boot applications. We follow **Detroit Style TDD**, which prioritizes using real objects over mocks to ensure business logic is tested in a "sociable" way while maintaining isolation from external systems.

## Core Principle: Detroit Style TDD

Unlike "London Style" TDD, which mocks every collaborator, Detroit Style TDD encourages:
- **Sociable Tests**: Use real instances of internal services, helpers, and domain objects.
- **Mock Boundaries**: Mock *only* external dependencies that are out of our direct control or slow down the build (Databases, Kafka, Remote HTTP APIs).
- **Manual Instantiation**: Manually construct classes in your test setup to explicitly define dependencies and ensure real logic is being executed.

## When to use this skill

- Creating a new unit test for a Controller, Service, or Consumer.
- Refactoring existing tests to align with project standards.
- Ensuring that internal collaboration between layers is verified by real code, not just mock expectations.

## How to use this skill

### 1. Test Class Configuration

Every unit test class should use JUnit 5 and Mockito. Instead of relying solely on `@InjectMocks`, manually instantiate your components in `@BeforeEach` to use real collaborators.

```java
@ExtendWith(SpringExtension.class)
class MyControllerUnitTest {

    private MockMvc mockMvc;

    @Mock
    private ExternalRepository externalRepository; // Mock (Boundary)

    @Mock
    private RestTemplate restTemplate; // Mock (Boundary)

    private MyServiceImpl myService; // Real Object

    private MyController myController; // Real Object (SUT)

    @BeforeEach
    void setUp() {
        // 1. Manually instantiate dependencies with real logic + mocked boundaries
        myService = new MyServiceImpl(externalRepository, restTemplate);
        
        // 2. Instantiate the system under test (SUT)
        myController = new MyController(myService);

        // 3. Setup MockMvc if testing controllers
        mockMvc = MockMvcBuilders.standaloneSetup(myController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }
}
```

### 2. Mocking Boundaries

Only mock components that cross the system boundary.

| Component Type | Action | Strategy |
| :--- | :--- | :--- |
| **Repos / JPA** | Mock | Use `@Mock` for `Repository` interfaces. Avoid H2 for unit tests. |
| **REST Clients** | Mock | Mock the `RestTemplate` or the specific `Client` interface. |
| **Kafka** | Mock | Mock the `Producer` or serialization helpers used for publishing. |
| **Internal Services** | **Use Real** | Do not mock services that belong to the same microservice. |

### 3. Test Structure (Given-When-Then)

Tests MUST follow the Gherkin-style structure with explicit comments and descriptive method names:

```java
@Test
void process_shouldReturnSuccess_whenBalanceIsSufficient() {
    // given
    var request = createValidRequest();
    when(externalRepository.findBalance(any())).thenReturn(BigDecimal.valueOf(1000));

    // when
    var result = myController.processPayment(request);

    // then
    assertNotNull(result);
    verify(externalRepository, times(1)).save(any());
}
```

### 4. Exception & Branch Testing

Test both success and failure paths. Since we use real objects, testing a failure in a service from a controller test is a valid and encouraged "sociable" test.

```java
@Test
void process_insufficientBalance_throwException() {
    // given
    when(externalRepository.findBalance(any())).thenReturn(BigDecimal.ZERO);

    // when / then
    assertThrows(InsufficientBalanceException.class, () -> myController.processPayment(req));
    verify(externalRepository, times(0)).save(any());
}
```

### 5. Best Practices

- **Naming**: Use descriptive names: `method_scenario_expectedResult` or `method_shouldExpectedResult_whenScenario`. Do not use `@DisplayName`.
- **Validation**: Use JUnit 5 `Assertions` for all validations (`assertEquals`, `assertNotNull`, `assertThrows`).
- **No Over-Mocking**: If you find yourself mocking 10 different internal methods to test one feature, you are probably not following Detroit Style TDD. Use the real objects!
- **Data Setup**: Use helper methods or Builders to create test data, keeping the `// given` block clean.

---

## 💡 Advanced Practices & Lessons Learned

These guidelines are compiled from real microservice test implementation experiences to ensure high codebase quality:

### A. Legacy Unit Tests Compatibility
- **Preserve Existing Patterns**: If an existing unit test is written using the fully-mocked approach (London Style), **do not refactor it** to Detroit Style TDD unless explicitly requested by the developer. Maintain the existing mock pattern to keep the diff clean.

### B. Serialization & Logic Helper Classes (Non-Mocking Rule)
- **Use Real Instances**: For crucial utility/logic classes like `ObjectMapper` and custom serialization helpers, **do not mock them**. Always use real instances to ensure real parsing and serialization/deserialization logic is tested.
- **Mockito Spy for Exceptions**: To test failure cases (e.g. `JsonProcessingException`) without mocking the entire success flow, use a `Mockito.spy()` on the real instance. This permits normal behavior in success paths, while allowing stubbed exceptions in failure paths:
  ```java
  private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
  private final MyJsonHelper jsonHelper = Mockito.spy(new MyJsonHelper(objectMapper));
  // Under test:
  Mockito.doThrow(new JsonProcessingException("error"){}).when(jsonHelper).toString(any());
  ```

### C. Robust JSON & Metadata Assertions
- **Avoid Fragile String Matching**: When asserting saved metadata JSON string properties, **never** compare the raw string directly. Raw comparisons are extremely fragile to null exclusions, spacing, and key order.
- **Use Deserialization Verification**: Deserialize the saved JSON string back to the domain object and verify the fields individually:
  ```java
  MyMetadata meta = objectMapper.readValue(saved.getMetadata(), MyMetadata.class);
  assertEquals("EXPECTED_TYPE", meta.getType());
  assertNull(meta.getOptionalField());
  ```

### D. Helper Method Consolidation
- **Single Method Rule**: Do not create overloaded variations of test data generation methods. Instead, **update the existing method signature** to accept the new arguments and refactor all existing test callers to maintain exactly one source of truth.

### E. Clean Structure & Gherkin Comments Only
- **BDD-Only Comments**: Keep the test bodies exceptionally clean. Do not write inline explanatory comments inside the test case. Rely on standard Gherkin comments only:
  - `// given`
  - `// when`
  - `// then`

### F. Mockito Mutable Reference Capturing Gotcha
- **Ref-Mutable Capture Issue**: When capturing mutable object arguments passed to mocked methods (e.g., `orderService.save(mOrder)`), Mockito `ArgumentCaptor` captures the reference to the object. If the object undergoes state modifications after the method is called, all captured instances in `captor.getAllValues()` will reflect the final modified state.
- **Answer Stubbing Solution**: To verify intermediate states during method calls (such as status transitions), stub the mocked method using `.thenAnswer(...)` to extract and record snapshots (e.g. enum values or states) into a temporary list at the exact moment of invocation:
  ```java
  List<OrderStatus> savedStatuses = new ArrayList<>();
  when(orderService.save(any(MOrder.class))).thenAnswer(invocation -> {
      MOrder mOrder = invocation.getArgument(0);
      savedStatuses.add(mOrder.getOrderStatus());
      return mOrder;
  });
  ```

### G. Sonar Lint Assertion Count Refactoring
- **Reduce Test-Method Assertions**: SonarQube/SonarLint rules flag test methods containing more than 25 direct assertions as code smells.
- **Assertion Delegation**: For large and complex data mappings (e.g., asserting 30+ fields of a database model and Kafka payload), delegate the assertions into dedicated private assertion helper methods (e.g., `assertSavedOrder(savedOrder)`). This keeps the main test method compliant, clean, and focused.

