---
name: integration-testing
description: Patterns for integration testing Spring Boot applications using Testcontainers, WireMock, MockMvc, and Awaitility.
---

# Integration Testing Skill

This skill provides the standard approach and best practices for writing integration tests in Spring Boot applications, covering both Kafka-based event processing and REST API controllers. Following these patterns ensures consistency, reliability, and proper isolation of tests.

## When to use this skill

- Creating a new integration test for a Kafka consumer or producer.
- Creating a new integration test for a REST API Controller.
- Modifying existing integration tests to support new business logic.
- Troubleshooting failures in the integration test suite.
- Setting up mocks for external REST dependencies.

## How to use this skill

### 1. Test Environment Setup

> [!WARNING]
> **Conditional Component Testing**
> If you are testing a component (e.g., Kafka Consumer) that is guarded by a `@ConditionalOnProperty` annotation, you **MUST** ensure the required property and its expected value are defined in `src/test/resources/application.properties`. If omitted, the bean will not be loaded into the test context, resulting in an `UnsatisfiedDependencyException`.

Every integration test class should use the following annotations and configurations to ensure a consistent environment:

```java
@SpringBootTest(classes = YourApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext
@ContextConfiguration(classes = KafkaTestContainersConfiguration.class)
@Testcontainers
@AutoConfigureWireMock(port = 8081)
@AutoConfigureMockMvc
class MyIntegrationTest {
    // ...
}
```

- **@SpringBootTest**: Starts the full application context. Replace `YourApplication.class` with your main application class.
- **@DirtiesContext**: Ensures the context is cleaned after the test class, which is important for isolating side effects between test suites.
- **@ContextConfiguration**: Uses your Kafka Testcontainers configuration class to spin up a Kafka instance in a Docker container.
- **@Testcontainers**: Enables JUnit 5 extension for Testcontainers.
- **@AutoConfigureWireMock**: Starts a WireMock server on the specified port.
- **@AutoConfigureMockMvc**: Enables and configures MockMvc for testing REST controllers without starting a full HTTP server.

### 2. Mocking External Services (WireMock)

External REST APIs should be mocked using WireMock.

- **Mocking Strategy**: Use standard WireMock stubs in the `given` section of your test or utility mock methods.
- **Mocking JSON**: Store large JSON responses in `src/test/resources/` (e.g., `external-service/success-response.json`) and load them using a JSON helper utility.

```java
WireMock.stubFor(WireMock.post(WireMock.urlEqualTo("/external-api/v1/resource"))
    .willReturn(WireMock.okJson(jsonContent)));
```

### 3. Data Preparation & Cleanup

Testing starts with a clean slate. Data preparation and cleanup are critical — mistakes here are the most common source of flaky tests.

#### 3a. Cleanup in @BeforeEach

Always delete in **child-first order** to avoid foreign key constraint violations. Also reset WireMock stubs.

```java
@BeforeEach
void setUp() {
    WireMock.reset();
    // Delete children first, then parents
    childRepository.deleteAll();
    parentRepository.deleteAll();
}
```

#### 3b. Master Data Preparation

When your test requires pre-existing data (e.g., configuration entities, reference data), build and save them in a helper method or directly in the test setup. Always sync dynamically generated IDs (e.g., auto-generated primary keys) into your test payloads after saving.

```java
// Save parent entity
var parent = ParentEntity.builder()
    .code("MY_CONFIG")
    .name("My Configuration")
    .status("ACTIVE")
    .createdAt(LocalDateTime.now())
    .createdBy("system")
    .build();
var savedParent = parentRepository.save(parent);

// Sync generated ID into test payload
testPayload.setConfigId(savedParent.getId());
```

> [!TIP]
> After saving master data, always sync the generated ID into your test event payload or request object. Mismatched IDs are the #1 cause of "entity not found" failures in integration tests.

#### 3c. Test Payload Preparation

> [!IMPORTANT]
> **Explicit Routing Variables**
> When setting up entities or event payloads, do NOT blindly rely on default boilerplate builders. You must explicitly set properties that control routing logic (e.g., `channel`, `sourceType`) based on the specific scenario being tested.

Load event payloads from JSON fixtures in `src/test/resources/` and update dynamic IDs after master data is saved:

```java
InputStream inputStream = this.getClass().getClassLoader().getResourceAsStream("events/my-event.json");
EventSchema<MyEvent> eventSchema = jsonHelper.toClass(inputStream, new TypeReference<>() {});

// Sync the dynamic config ID into the payload
eventSchema.getData().setConfigId(savedConfig.getId());
```

### 4. Testing REST Controllers (MockMvc)

For testing API endpoints, use `MockMvc` to perform requests and verify responses.

```java
@Autowired
private MockMvc mockMvc;

@Autowired
private JsonHelper jsonHelper;

@Test
void myControllerTest() throws Exception {
    // 1. Prepare request
    MyRequest request = new MyRequest("payload");

    // 2. Perform request
    MvcResult result = mockMvc.perform(post("/api/v1/endpoint")
            .contentType(MediaType.APPLICATION_JSON)
            .header("sub", "user123")
            .content(jsonHelper.toString(request)))
        .andExpect(status().isOk())
        .andReturn();

    // 3. Parse and verify response
    Response<MyData> response = jsonHelper.toClass(
        result.getResponse().getContentAsString(), 
        new TypeReference<>() {}
    );
    Assertions.assertNotNull(response.getData());
}
```

### 5. Async Flow Validation (Awaitility)

Since Kafka processing is asynchronous, use `Awaitility` to poll for results.

```java
Awaitility.await()
    .atMost(Duration.ofSeconds(5))
    .untilAsserted(() -> {
        // Assert database state or log entry
    });
```

### 6. Verifying Kafka Events (Logback Appender)

To verify if an event was published to a Kafka topic without consuming it directly:

1. Create a `ListAppender<ILoggingEvent>` for the producer service class.
2. Filter the recorded logs for the specific topic and event content.

```java
ListAppender<ILoggingEvent> logRecorder = LogHelper.newLogListAppender(ProducerService.class);
logRecorder.start();
// ... execute action ...
Assertions.assertTrue(logRecorder.list.stream()
    .map(ILoggingEvent::getFormattedMessage)
    .anyMatch(message -> message.contains("[Event Message] Sent. Topic: " + YOUR_TOPIC_CONSTANT)));
logRecorder.stop();
```

> [!TIP]
> Always use exact namespace constants when validating dynamic topic routing to ensure robust and regression-proof test assertions, rather than hardcoding string names.

### 7. Advanced Resiliency, Timeouts & Coverage Testing

When testing backend services that integrate with upstream wrappers (e.g. external APIs), you must fully cover edge cases including network timeouts, HTTP error responses, and configuration faults:

#### 7a. Simulating Direct Connection/Network Timeouts

To trigger a genuine `ResourceAccessException` (network connection reset/socket timeout) without relying on fragile network configurations:
1. Inject the client service bean in the integration test class.
2. Use `ReflectionTestUtils` to temporarily change its `baseUrl` field to an inactive port (e.g., `http://localhost:1`).
3. Execute the consumer to verify it catches the network exception and transitions the status accordingly.
4. **CRITICAL**: Restore the original `baseUrl` in a `finally` block to keep the application context clean for subsequent tests.

```java
String originalBaseUrl = (String) ReflectionTestUtils.getField(myRestClient, "baseUrl");
try {
    ReflectionTestUtils.setField(myRestClient, "baseUrl", "http://localhost:1");
    // Trigger action that makes outbound call...
} finally {
    ReflectionTestUtils.setField(myRestClient, "baseUrl", originalBaseUrl);
}
```

#### 7b. Simulating REST Client/Wrapper API Timeouts

Upstream services typically wrap internal timeouts into a specific response body (e.g., HTTP 500 containing `responseCode: "TO"`):
- Mock this using WireMock by returning an HTTP 500 status with the expected error body structure. This triggers standard rest exception handlers cleanly.

#### 7c. Maximizing Coverage on Resiliency Code Paths

To cover both the successful parse branch and the custom client exception blocks:
- **Response 200 OK with Error**: Stub some tests with HTTP 200 OK but containing a failed `responseCode`. This covers client parsing validations on non-empty, non-null responses.
- **HTTP 4xx/5xx with Error**: Stub other tests with HTTP 400/500 client errors to fully exercise `RestClientResponseException` catch blocks.
- **Blank / Empty API Keys**: Stub credential endpoints to return HTTP 500, flush cached credentials, and assert that the process aborts cleanly without throwing null pointer exceptions.

#### 7d. Rich Database & Metadata Assertions

Always perform deep assertions on database records and their JSON metadata structures:
- Deserialize metadata fields and assert that key parameters match expectations precisely.

### 8. Controlling Background Async Processing & Precise Assertions

To ensure integration tests for intermediate stages are robust, stable, and deterministic:

#### 8a. Isolating Background Consumer Execution

If your test asserts an intermediate state that triggers downstream asynchronous messages to background listeners, you **MUST** prevent these downstream listeners from executing their strategy logic which can asynchronously modify your test state.

- **DO NOT** globally disable background consumers via `@SpringBootTest(properties = { "some-property=false" })` if that property is shared with the primary consumer you are testing. Doing so will prevent your target bean from loading into the context.
- **DO** inject a **`@MockitoBean`** for the downstream event processor inside your test class. Since Mockito mocks default to no-op, the background listener will consume the event but complete instantly without mutating the database:

```java
@MockitoBean
private DownstreamEventProcessor downstreamEventProcessor;
```

#### 8b. Strict Single-Status Database Assertions

- **DO NOT** write logical OR assertions (e.g., `Assertions.assertTrue(status == A || status == B)`). This hides flakiness and race conditions.
- **DO** write exact, deterministic assertions for a single expected status.

#### 8c. Absolute Separation of Consumer Test Suites

Keep your consumer integration tests highly cohesive and logically isolated:
- Separate tests strictly by the consumer class they target.
- Do not mix different event models and schemas in a single class, as it introduces brittle setup paths and potential payload collision.

#### 8d. SonarQube Assertion Count Optimization (Refactoring Long Assertions)

When a test requires verifying a large number of properties, SonarQube may flag the test method for containing too many assertions (typically exceeding 20-25 assertions). 

To satisfy SonarQube rules while preserving 100% test coverage and validation rigor:
- **DO NOT** delete assertions or decrease testing rigor.
- **DO** consolidate related properties into a single multi-condition logical assertion using the `&&` operator.
- **ALWAYS** provide a descriptive failure message string as the last argument in `Assertions.assertTrue` to pinpoint exactly what component failed if any condition is not met.

*Example Comparison:*
```java
// INEFFECTIVE: Exceeds SonarQube's assertion threshold (5 assertions)
Assertions.assertEquals(MyStatus.SUCCESS, activity.getStatus());
Assertions.assertEquals("CREDIT", activity.getDebitCredit());
Assertions.assertEquals("00", activity.getResponseCode());
Assertions.assertNull(activity.getFailedReason());
Assertions.assertNotNull(activity.getMetadata());

// PREFERRED: Consolidates properties under a single assertion (1 assertion)
Assertions.assertTrue(
    MyStatus.SUCCESS.equals(activity.getStatus())
        && "CREDIT".equals(activity.getDebitCredit())
        && "00".equals(activity.getResponseCode())
        && activity.getFailedReason() == null
        && activity.getMetadata() != null,
    "Activity should be successful as CREDIT with code 00"
);
```

## Best Practices

- **Avoid Thread.sleep()**: Always use `Awaitility` for timing-dependent assertions.
- **Isolate Tests**: Ensure each test method starts with a clean database and WireMock state.
- **Use Descriptive Names**: Test method names should clearly state the scenario (e.g., `testProcess_withSuccessfulInquiry_shouldTransitionToSuccess`).
- **Parameterized Tests**: Use `@ParameterizedTest` and `@ValueSource` when testing multiple similar payloads.
