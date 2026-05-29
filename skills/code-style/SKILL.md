---
name: code-style
description: Standard Java code style guidelines for Spring Boot projects using Lombok, ensuring consistency between AI Agents and Developers.
---

# Java Code Style Guidelines — Spring Boot Projects

This document is the mandatory reference for all Java code written in Spring Boot projects. These standards ensure consistency and readability across the codebase, and are aligned with common automated formatters (`spring-javaformat`, `spotless`).

## When to use this skill

Activate this skill whenever you:
- Create a new Java class or file.
- Modify existing code.
- Perform a code review to ensure consistency.
- Write instructions to an AI Agent to generate new code.

---

## How to use this skill

When writing or generating Java code, follow these steps in order:

1. **Apply file structure** according to section 1 (header, class declaration).
2. **Use Lombok** to reduce boilerplate according to section 2.
3. **Declare fields** in the correct order according to section 3.
4. **Apply block formatting** (try-catch, if-else) according to section 4.
5. **Apply method chaining indentation** according to section 5.
6. **Apply Builder style** according to section 6.
7. **Check logging** according to section 7.

---

## 1. File Structure & Header

Every Java file must have a simple Javadoc header stating the author and creation date, placed directly above the class declaration (after all `import` statements).

**Format:**
- Use `/** ... **/` (double asterisk at the end) placed above annotations, not above the `package` declaration.
- `@author` : the developer's name.
- `@created` : date in `DD/MM/YYYY, Day` format.

```java
/**
 * @author : <developer-name>
 * @created : 14/04/2026, Tuesday
 **/
@Slf4j
@Service
@RequiredArgsConstructor
public class MyServiceImpl implements MyService {
```

---

## 2. Lombok Usage

Use Lombok to eliminate boilerplate. The annotation order on a class must follow this sequence:

**For Service/Component:**
```java
@Slf4j
@Service
@RequiredArgsConstructor
public class MyServiceImpl implements MyService {
```

**For DTO:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyDto {
```

**For Properties (`@ConfigurationProperties`):**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Component
@ConfigurationProperties(prefix = "my.prefix")
public class MyProperties {
```

**Rules:**
- **Must** use `@RequiredArgsConstructor` for dependency injection (not `@Autowired`).
- **Forbidden** to use `@Autowired` on fields.
- Use `@Slf4j` on all classes that require logging.

---

## 3. Field Declaration Order

The order of fields inside a class must be as follows:

1. `private static final` constants
2. `private final` dependencies (injected by `@RequiredArgsConstructor`)
3. `@Value` fields (non-final)

```java
public class MyServiceImpl implements MyService {

    private static final String REDIS_SUBKEY = "api-key";

    private static final String ENDPOINT_PATH = "/api/v1/resource";

    private final RestClient restClient; // injected by @RequiredArgsConstructor

    private final MyRepository myRepository;

    @Value("${service.base-url}")
    private String baseUrl;

    @Value("${service.cache-ttl}")
    private Duration cacheTtl;
```

**Rules:**
- Each field is separated by one blank line.
- Hardcoded Strings must be extracted into `private static final String` constants.

---

## 4. Block Control Structures (K&R Style)

Use **K&R style**: the closing brace `}` and the next block keyword (`catch`, `else`, `finally`) must be on the **same line**.

### ✅ Correct:
```java
try {
    // code
} catch (RestClientException ex) {
    log.error("failed with message {}", ex.getMessage(), ex);
    return null;
}

if (StringUtils.isNotBlank(cachedKey)) {
    return cachedKey;
} else {
    // fallback
}
```

### ❌ Incorrect:
```java
try {
    // code
}
catch (Exception ex) {  // ← WRONG: catch on a new line
    // ...
}

if (condition) {
    // ...
}
else {  // ← WRONG: else on a new line
}
```

---

## 5. Method Chaining & Fluent API

When performing *method chaining* (`RestClient`, `Stream API`, Builder Pattern, etc.) that continues onto a new line, use **one additional level of indentation** relative to the opening call.

### ✅ Correct:
```java
String response = restClient.get()
    .uri(uriBuilder -> uriBuilder
        .path(baseUrl + ENDPOINT_PATH)
        .queryParam("value", credential)
        .build())
    .retrieve()
    .body(String.class);
```

**For Stream API:**
```java
List<String> errors = ex.getBindingResult()
    .getFieldErrors()
    .stream()
    .map(DefaultMessageSourceResolvable::getDefaultMessage)
    .toList();
```

### ❌ Incorrect:
```java
// All on one line — too long and hard to read
String response = restClient.get().uri(baseUrl + ENDPOINT_PATH).retrieve().body(String.class);
```

---

## 6. Builder Pattern

When using Lombok `@Builder`, each builder field must be written on a separate line with one level of indentation:

### ✅ Correct:
```java
var entity = MyEntity.builder()
    .name(request.getName())
    .status(EntityStatus.ACTIVE)
    .createdAt(LocalDateTime.now())
    .createdBy("system")
    .build();
```

### ❌ Incorrect:
```java
// Everything on one line
var entity = MyEntity.builder().name(request.getName()).status(EntityStatus.ACTIVE).build();
```

---

## 7. Logging

Use SLF4J (`@Slf4j`) with `{}` placeholders for parameterization. **String concatenation is forbidden.**

**Rules:**
- `log.info` — for normal flow (start/end of execution, cache hit).
- `log.error` — for failures requiring investigation; always include the exception object as the last argument.
- `log.warn` — for non-ideal but recoverable conditions (e.g., cache miss, Redis timeout).
- `log.debug` — for detailed data only needed during debugging.

```java
// ✅ Correct
log.info("start execute {}", serviceClass.getSimpleName());
log.error("failed get resource with message {}", ex.getMessage(), ex);
log.warn("Failed to access Redis cache: {}", ex.getMessage());

// ❌ Incorrect
log.error("failed: " + ex.getMessage()); // String concatenation
log.error("failed", ex.getMessage());    // Missing exception object as last argument
```

---

## 8. Usage of `var`

Use `var` for local variable type inference, especially when the type is already clear from the right-hand side.

```java
// ✅ Correct
var entity = repository.findById(id)
    .orElseThrow(() -> new DataNotFoundException(ErrorMessages.ENTITY_NOT_FOUND));

var result = MyDto.builder()
    ...
    .build();

// ❌ Avoid for primitives or unclear types
var x = 5; // Use int x = 5; for clarity
```
