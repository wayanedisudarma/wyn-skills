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
8. **Apply Return Early pattern** to reduce nesting according to section 9.
9. **Extract complex conditions** into private methods according to section 10.
10. **Apply refactoring techniques** (sections 11–17) during code reviews and modifications.

---

## 1. File Structure & Header

Every Java file must have a simple Javadoc header stating the author and creation date, placed directly above the class declaration (after all `import` statements).

**Format:**
- Use `/** ... */` placed above annotations, not above the `package` declaration.
- `@author` : the developer's name.
- `@created` : date in `DD/MM/YYYY, Day` format.

```java
/**
 * @author : <developer-name>
 * @created : 14/04/2026, Tuesday
 */
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

Use `var` for local variable type inference, especially when the type is already clear from the right-hand side. If the type is not clear from the right-hand side, use the real class instead of `var`.

```java
// ✅ Correct (type is explicitly clear from the builder)
var result = MyDto.builder()
    ...
    .build();

// ✅ Correct (type is not fully clear from the right-hand side alone, so use the explicit class)
User user = userRepository.findById(id)
    .orElseThrow(() -> new DataNotFoundException(ErrorMessages.USER_NOT_FOUND));

// ❌ Avoid for primitives or unclear types
var x = 5; // Use int x = 5; for clarity
```

---

## 9. Return Early (Guard Clauses)

Use **return early** (guard clauses) to handle edge cases and invalid states at the top of the method. This eliminates deep nesting and `if-else` chains, making the happy path clearly readable at the bottom of the method.

**Rules:**
- Check preconditions (null, empty, invalid state) at the top and return immediately.
- Avoid `else` blocks when the `if` branch already exits the method (via `return`, `throw`, etc.).
- Inline single-use variables that only serve as an argument to the next call.

### ✅ Correct:
```java
public void processRequest(RequestDto request) {
    Entity entity = converter.convert(request, Entity.class);
    if (entity == null) {
        log.warn("Failed to convert request to entity");
        return;  // ← guard clause: exit early
    }

    Optional<Entity> existing = repository.findById(entity.getId());
    if (existing.isEmpty()) {
        repository.save(entity);
        return;  // ← guard clause: exit early, no else needed
    }

    // happy path — no nesting
    Entity existingEntity = existing.get();
    applyFallbackValues(entity, existingEntity);
    BeanUtils.copyProperties(entity, existingEntity, IGNORE_FIELDS);
    repository.save(existingEntity);
}
```

### ❌ Incorrect:
```java
public void processRequest(RequestDto request) {
    Entity entity = converter.convert(request, Entity.class);
    if (entity != null) {
        Optional<Entity> existing = repository.findById(entity.getId());
        if (existing.isEmpty()) {
            repository.save(entity);
        } else {
            // deeply nested happy path ← hard to read
            Entity existingEntity = existing.get();
            BeanUtils.copyProperties(entity, existingEntity, IGNORE_FIELDS);
            repository.save(existingEntity);
        }
    }
}
```

---

## 10. Extract Private Method

Extract complex boolean expressions or multi-step logic blocks into **private methods** with intention-revealing names. This keeps the public method readable as a high-level narrative.

**Rules:**
- Extract when a condition involves more than one `&&` / `||` operator.
- Extract when a block of logic inside a public method is not its primary responsibility.
- Name the method to describe **what** it does, not **how** it does it.
- Prefer extracting intermediate `boolean` variables into a private method instead.

### ✅ Correct:
```java
// Public method reads like a narrative
public void updateEntity(RequestDto request) {
    ...
    applyFallbackValues(incoming, existing);  // ← intention-revealing name
    BeanUtils.copyProperties(incoming, existing, IGNORE_FIELDS);
    repository.save(existing);
}

// Complex condition is hidden inside a focused private method
private void applyFallbackValues(Entity incoming, Entity existing) {
    if (!StringUtils.hasText(incoming.getCode()) && StringUtils.hasText(existing.getCode())) {
        incoming.setCode(existing.getCode());
    }
}
```

### ❌ Incorrect:
```java
// Intermediate boolean variable clutters the public method
public void updateEntity(RequestDto request) {
    ...
    boolean useExistingCode = !StringUtils.hasText(incoming.getCode())
            && StringUtils.hasText(existing.getCode());
    if (useExistingCode) {
        incoming.setCode(existing.getCode());
    }
    ...
}
```

---

## 11. Inline Method

Inline a method when its body is as clear as its name. Needless indirection through trivial one-line methods adds complexity without improving readability. This is the reverse of **Extract Private Method** (section 10).

**When to inline:**
- The method body is a single expression that is self-explanatory.
- The method name does not add any additional clarity over the expression itself.
- The method is only called from one place and is not part of a public API.

### ✅ Correct (after inlining):
```java
public int getRating() {
    return numberOfLateReturns > 3 ? 0 : 1;
}
```

### ❌ Incorrect (before — unnecessary indirection):
```java
public int getRating() {
    return moreThanThreeLateReturns() ? 0 : 1;
}

private boolean moreThanThreeLateReturns() {
    return numberOfLateReturns > 3; // ← body is as clear as the name
}
```

---

## 12. Inline Variable

Remove a local variable when it does not add any clarity beyond the expression it holds. If the variable name simply restates what the right-hand side already says, inline it.

**Rules:**
- Inline when the variable is used only once and the expression is self-explanatory.
- Do **not** inline when the variable name explains a complex expression (use **Introduce Explaining Variable** instead — section 13).

### ✅ Correct (inlined):
```java
return order.getBasePrice() > 1000.0;
```

### ❌ Incorrect (unnecessary variable):
```java
double basePrice = order.getBasePrice();
return basePrice > 1000.0; // ← variable adds no clarity
```

---

## 13. Introduce Explaining Variable

When an expression is complex or difficult to read, store its result in a local variable with a name that explains the expression's purpose. This is the opposite of **Inline Variable** (section 12).

**When to use:**
- A condition involves multiple `&&` / `||` operators or long method chains.
- The expression's intent is not immediately obvious.
- You want to make an `if` statement read like plain English.

**Note:** For reusable logic, prefer **Extract Private Method** (section 10) over a local variable.

### ✅ Correct:
```java
boolean isEligibleForDiscount = customer.isActive()
    && order.getTotal().compareTo(DISCOUNT_THRESHOLD) > 0;
boolean hasValidCoupon = StringUtils.hasText(order.getCouponCode())
    && couponService.isValid(order.getCouponCode());

if (isEligibleForDiscount && hasValidCoupon) {
    applyDiscount(order);
}
```

### ❌ Incorrect:
```java
// Dense, hard-to-read condition
if (customer.isActive()
        && order.getTotal().compareTo(DISCOUNT_THRESHOLD) > 0
        && StringUtils.hasText(order.getCouponCode())
        && couponService.isValid(order.getCouponCode())) {
    applyDiscount(order);
}
```

---

## 14. Introduce Parameter Object

When multiple methods share the same group of parameters, create a dedicated class (DTO/record) to bundle them. This reduces parameter count, reveals domain concepts, and makes method signatures easier to evolve.

**When to use:**
- Two or more parameters always appear together across multiple methods.
- A method has more than 3 parameters that logically form a group.
- You find yourself passing `startDate` + `endDate`, `minPrice` + `maxPrice`, etc.

**Rules:**
- Use Lombok `@Data` / `@Builder` or a Java `record` for the parameter object.
- Name the parameter object after the domain concept it represents (e.g., `DateRange`, `PriceFilter`).

### ✅ Correct:
```java
@Data
@Builder
public class DateRange {
    private LocalDate startDate;
    private LocalDate endDate;
}

// Methods use the parameter object
private BigDecimal amountInvoiced(DateRange dateRange) { ... }
private BigDecimal amountReceived(DateRange dateRange) { ... }
```

### ❌ Incorrect:
```java
// Same pair of parameters repeated across methods
private BigDecimal amountInvoiced(LocalDate startDate, LocalDate endDate) { ... }
private BigDecimal amountReceived(LocalDate startDate, LocalDate endDate) { ... }
```

---

## 15. Remove Dead Code

Delete code that is no longer executed. Dead code confuses readers and adds zero value. Source control preserves history — there is no reason to keep commented-out code.

**Forms of dead code:**
- **Commented-out code** — the most common form. Delete it; Git has the history.
- **Unreachable branches** — `if (false)`, conditions that can never be true given prior logic, empty `catch` blocks that swallow exceptions silently.
- **Unused methods, fields, imports** — remove them.

**Rules:**
- **Forbidden** to commit commented-out code. Use version control instead.
- Remove unused `import` statements.
- Remove unused private methods and fields.
- Remove `if` branches whose condition is always `false` due to preceding logic.

### ✅ Correct:
```java
var entity = MyEntity.builder()
    .name(request.getName())
    .status(EntityStatus.ACTIVE)
    .createdAt(LocalDateTime.now())
    .build();
```

### ❌ Incorrect:
```java
var entity = MyEntity.builder()
    .name(request.getName())
    // .description(request.getDescription()) // TODO: add later
    .status(EntityStatus.ACTIVE)
    // .priority(Priority.NORMAL)
    .createdAt(LocalDateTime.now())
    .build();
```

---

## 16. Rename Variable

Rename variables, methods, and parameters so their names clearly express their purpose. A good name eliminates the need for a comment.

**Rules:**
- Variable names must describe **what** the value represents, not its type.
- **Forbidden** to use Hungarian notation (e.g., `strName`, `lstItems`). Modern IDEs make type prefixes redundant.
- **Forbidden** to use single-letter names (except `i`, `j`, `k` for simple loop indices).
- Use `camelCase` for local variables and parameters.
- Use `UPPER_SNAKE_CASE` for `static final` constants.
- In Stream/lambda expressions, use meaningful names instead of `x`, `e`, `u`, etc.

### ✅ Correct:
```java
var activeUsers = userRepository.findAll().stream()
    .filter(user -> user.getStatus() == UserStatus.ACTIVE)
    .toList();

double area = Math.PI * radius * radius;
```

### ❌ Incorrect:
```java
var list = userRepository.findAll().stream()
    .filter(u -> u.getStatus() == UserStatus.ACTIVE) // ← 'u' is unclear
    .toList();

double a = Math.PI * radius * radius; // ← 'a' doesn't explain the value
```

---

## 17. Split Temporary Variable

Do not reuse a local variable for multiple, unrelated purposes. Each assignment to a temp variable should use a fresh variable with a descriptive name. Reusing variables violates the single responsibility principle and makes code harder to follow.

**Exceptions:** Loop indices (`i`, `j`, `k`) and collecting/accumulating variables (e.g., `sum`, `result`) are naturally reassigned and do not need splitting.

### ✅ Correct:
```java
double area = Math.PI * radius * radius;
log.info("Area: {}", area);

double circumference = 2 * Math.PI * radius;
log.info("Circumference: {}", circumference);
```

### ❌ Incorrect:
```java
double temp = Math.PI * radius * radius;
log.info("Area: {}", temp);

temp = 2 * Math.PI * radius;  // ← reusing 'temp' for a different purpose
log.info("Circumference: {}", temp);
```
