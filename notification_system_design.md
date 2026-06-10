# Campus Notification System

---

## Stage 1 REST API Design

### Base URL
```
http://localhost:3000/api
```
### For logs 

```
http://4.224.186.213/evaluation-service/logs
```

### Authentication
```
Authorization: Bearer <access_token>
```

### Endpoints

#### 1. List All Notifications
```
GET /api/notifications
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number(def-1) |
| limit | integer | No | Items per page (def-20) |
| notification_type | string | No | Filter: Placement, Result, Event |

**Response:**
```json
{
  "notifications": [
    {
      "ID": "uuid-string",
      "Type": "Placement",
      "Message": "AffordMed Hiering",
      "Timestamp": "2026-07-10 12:11",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

#### 2. Get Notification by ID
```
GET /api/notifications/:id
```

**Response:**
```json
{
  "notification": {
    "ID": "uuid-string",
    "Type": "Result",
    "Message": "mid-sem Results",
    "Timestamp": "2026-04-22 17:51:30",
    "isRead": true
  }
}
```

**Response(failure):**
```json
{
  "error": "Notification not found"
}
```

#### 3. Mark Notification as Read
```
PATCH /api/notifications/:id/read
```

**Response :**
```json
{
  "message": "Notification marked as read",
  "ID": "uuid-string"
}
```

#### 4. Mark All as Read
```
PATCH /api/notifications/read-all
```

**Response:**
```json
{
  "message": "All notifications marked as read",
  "count": 42
}
```

#### 5. Get Priority Inbox
```
GET /api/notifications/priority
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| top_n | integer | No | Number of top notifications (default: 10) |
| notification_type | string | No | Filter by type |

**Response (200):**
```json
{
  "priorityNotifications": [
    {
      "ID": "uuid-string",
      "Type": "Placement",
      "Message": "Amazon hiring",
      "Timestamp": "2026-04-22 17:51:30",
      "priorityScore": 3
    }
  ],
  "count": 10
}
```

#### 6. Get Unread Count
```
GET /api/notifications/unread-count
```

**Response (200):**
```json
{
  "unreadCount": 15,
  "byType": {
    "Placement": 5,
    "Result": 3,
    "Event": 7
  }
}
```

### Real-Time Notification Mechanism  Server-Sent Events (SSE)

**Endpoint:**
```
GET /api/notifications/stream
```

**Why SSE over WebSockets:**
### SSE

* Sends data only from **Server to Client**.
* Uses a normal **HTTP connection**.
* **Automatically reconnects** if disconnected.
* Best for **notifications, live scores, and news feeds**.

### WebSocket

* Sends data in **both directions** (Client ↔ Server).
* Uses a dedicated **WebSocket protocol**.
* **Manual reconnection** is needed if disconnected.
* Best for **chat apps, multiplayer games, and real-time collaboration**.



**Choice: SSE**  SSE is ideal because notifications are one-way (server→client)
 It is simple, supports auto-reconnect, work on HTTP, and students only receive notifications, making WebSockets unnecessary thats why i use SSE


**Event Format:**
```
event: notification
data: {"ID": "uuid","Type":"Placement","Message":"New hiring","Timestamp":"2026-04-22 17:51:30"}

event: heartbeat
data: {"status":"alive"}
```

---

## Stage 2 Database Design

### Database Choice: <u>PostgreSQL</u>

**Why SQL over NoSQL:**
- We used to built Notifications so we have a fixed schema relational model
- Need complex queries with filterig and sorting 
- ACID transactions ensure data consistency
- Strong indexing support for query optimization
- Differnt tables and connect by simple Joins

### Full Schema

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('Placement', 'Result', 'Event')),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    delivered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, notification_id)
);

CREATE INDEX idx_student_notifications_student_read
    ON student_notifications(student_id, is_read);

CREATE INDEX idx_student_notifications_student_delivered
    ON student_notifications(student_id, delivered_at DESC);

CREATE INDEX idx_notifications_type
    ON notifications(type);

CREATE INDEX idx_notifications_created
    ON notifications(created_at DESC);
```

### Scaling Problems at 50K Students × 5M Notifications

### 1. Notification Table Growth

* **Problem:** Notification records can grow to millions of rows.
* **Impact:** Slower queries and higher database load.
* **Solution:** Use composite indexes and date-based partitioning.

**Code Solution**

```sql
CREATE INDEX idx_student_read
ON student_notifications(student_id, is_read);

CREATE INDEX idx_student_date
ON student_notifications(student_id, delivered_at);
```

```sql
CREATE TABLE student_notifications (
    ...
) PARTITION BY RANGE (delivered_at);

CREATE TABLE student_notifications_2026_q1
PARTITION OF student_notifications
FOR VALUES FROM ('2026-01-01') TO ('2026-04-08');
```

---

### 2. Frequent Unread Count Queries

* **Problem:** Dashboard frequently requests unread counts.
* **Impact:** Repeated aggregation queries increase response time.
* **Solution:** Use Materialized Views or Redis caching.

**Code Solution**

```sql
CREATE MATERIALIZED VIEW unread_counts AS
SELECT student_id, COUNT(*) AS unread_count
FROM student_notifications
WHERE is_read = FALSE
GROUP BY student_id;
```

---

### 3. Retrieving Notifications

* **Problem:** Students may have thousands of notifications.
* **Impact:** Fetching all records increases latency.
* **Solution:** Use pagination and indexed sorting.

**Code Solution**

```sql
SELECT n.id, n.type, n.message, n.created_at, sn.is_read
FROM notifications n
JOIN student_notifications sn
ON n.id = sn.notification_id
WHERE sn.student_id = $1
ORDER BY n.created_at DESC
LIMIT $2 OFFSET $3;
```

---

### 4. Filtering Notifications by Type

* **Problem:** Searching all notifications for a specific category.
* **Impact:** Large scans reduce performance.
* **Solution:** Filter directly at the database level.

**Code Solution**

```sql
SELECT n.id, n.type, n.message, n.created_at, sn.is_read
FROM notifications n
JOIN student_notifications sn
ON n.id = sn.notification_id
WHERE sn.student_id = $1
AND n.type = $2
ORDER BY n.created_at DESC
LIMIT $3 OFFSET $4;
```

---

### 5. Updating Read Status

* **Problem:** Users frequently mark notifications as read.
* **Impact:** High write operations can affect performance.
* **Solution:** Update only the required record using indexed keys.

**Code Solution**

```sql
UPDATE student_notifications
SET is_read = TRUE,
    read_at = NOW()
WHERE student_id = $1
AND notification_id = $2;
```


---

## Stage 3 — Query Optimization

### The Slow Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```
### Problem here are: 

1. **No Composite Index**
   Database scans millions of rows instead of directly finding matching records.

2. **Using `SELECT *`**
   Fetches unnecessary columns, increasing memory and I/O usage.

3. **Sorting Without Index**
   `ORDER BY createdAt` requires extra sorting, which is slow on large datasets.

4. **Poor Index on `isRead`**
   Since many rows have the same value, an index on only `isRead` is not very effective.

5. **Large Notification Table**
   Storing a separate notification record for every student causes rapid table growth and slower queries.

### Solution: Use Proper Indexing

**1. Composite Index**

* Helps filter by `studentID` and `isRead`.
* Also keeps records sorted by `createdAt`.
* Avoids full table scans and extra sorting.

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(studentID, isRead, createdAt ASC);
```

**2. Partial Index**

* Stores only unread notifications in the index.
* Smaller index size and faster unread queries.

```sql
CREATE INDEX idx_notifications_unread
ON notifications(studentID, createdAt ASC)
WHERE isRead = false;
```

**Benefit:** Faster notification retrieval, reduced database load, and better scalability for millions of records.


### Schema Changes

1. Replace `SELECT *` with specific columns:
```sql
SELECT id, type, message, createdAt
FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

2. If the table uses the normalized schema from Stage 2, the query becomes:
```sql
SELECT n.id, n.type, n.message, n.created_at
FROM notifications n
JOIN student_notifications sn ON n.id = sn.notification_id
WHERE sn.student_id = 1042 AND sn.is_read = FALSE
ORDER BY n.created_at ASC;
```

With the index `idx_student_notifications_student_read` from Stage 2, the join is fast.

### Optimized Query

```sql
SELECT id, type, message, createdAt
FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC
LIMIT 50 OFFSET 0;
```

Adding `LIMIT` ensures we never return unbounded result sets. Combined with the composite index, this query uses an index range scan instead of a full table scan — going from seconds to milliseconds.

---

## Stage 4 — Caching Strategy
### Chosen Approach: Redis Cache

#### Why Redis?

* Very fast read operations (milliseconds).
* Shared across multiple server instances.
* Supports TTL (automatic expiry of cached data).
* Reduces database load significantly.

---

### Architecture

```text
Client → API Server → Redis Cache ->  Client

if (Cache Miss) ->PostgreSQL -> Redis -> Client
                   
```

---

### Cache Keys

```text
notifications:student:{studentID}:page:{page}

notifications:student:{studentID}:unread_count

notifications:student:{studentID}:priority:{topN}
```

---

### Cache Expiry (TTL)

* Notification List → 60 seconds
* Unread Count → 30 seconds

---

### Read Flow

1. Check Redis for data.
2. If found (Cache Hit), return data immediately.
3. If not found (Cache Miss), fetch from PostgreSQL.
4. Store result in Redis with TTL.
5. Return response to the client.

---

### Write Flow

When a notification is created or marked as read:

1. Update PostgreSQL first.
2. Remove related Redis cache keys.
3. Next request automatically fetches fresh data and updates cache.

---

### Cache Invalidation Strategy

* **TTL-Based:** Cache expires automatically after 30–60 seconds.
* **Event-Based:** Delete cache immediately after notification updates.
* **Recommended:** Use both for better consistency and reliability.

---

### Memory Management

```conf
maxmemory-policy allkeys-lru
```

* Removes least recently used cache entries when memory is full.
* Helps Redis handle large traffic efficiently.
* Monitor cache hit rate and increase TTL if needed.

---

### Why Not Other Approaches?

* **In-Memory Cache:** Lost on server restart and not shared across multiple servers.
* **CDN Cache:** Notifications are personalized, so CDN caching is not effective.

---

### Benefits

* Faster dashboard loading.
* Reduced PostgreSQL queries.
* Better scalability for thousands of students.
* Lower database and server load.


## Stage 5 — Reliable Bulk Notification
### Problem 1: Sequential Processing

* Notifications are sent one by one.
* Sending notifications to 50,000 students can take hours.

**Solution:** Use batch processing and worker queues for parallel execution.

**Code Solution**

```text
BATCH_SIZE = 500

function notify_all(student_ids, message):
    chunks = split_into_batches(student_ids, BATCH_SIZE)

    for chunk in chunks:
        enqueue_job("process_batch", {
            student_ids: chunk,
            message: message
        })
```

---

### Problem 2: No Failure Tracking

* Failed notifications cannot be identified easily.
* Some students may miss notifications without anyone knowing.

**Solution:** Maintain status for every student notification.

**Code Solution**

```sql
CREATE TABLE notification_jobs (
    student_id BIGINT,
    notification_id BIGINT,
    status VARCHAR(30),
    error_message TEXT
);
```

```text
update_status(student_id, notification_id, "SENT")

update_status(student_id, notification_id, "FAILED")
```

---

### Problem 3: No Retry Mechanism

* Failed emails are lost permanently.
* Temporary failures are never retried.

**Solution:** Use exponential backoff retries.

**Code Solution**
- (MAX_RETRIES = 3)
```text


function send_email_job(job):
    try:
        send_email(job.student_id, job.message)
    catch error:
        if job.retry_count < MAX_RETRIES:
            delay = 2 ^ job.retry_count

            enqueue_job(
                "send_email_job",
                {
                    student_id: job.student_id,
                    retry_count: job.retry_count + 1
                },
                delay
            )
```

---

### Problem 4: Tight Coupling

* Email, push notification, and database save depend on each other.
* Slow email service slows down the entire flow.

**Solution:** Separate database, push, and email operations.

**Code Solution**

```text
save_student_notification(student_id)

push_to_app(student_id)

enqueue_email(student_id)
```

---

### Problem 5: No Crash Recovery

* Server crash can stop processing midway.
* Restarting may create duplicate notifications.

**Solution:** Store jobs in a durable queue.

**Code Solution**

```text
enqueue_job(
    "process_notification",
    {
        notification_id: 101,
        student_id: 5001
    }
)
```

Workers continue from pending jobs after restart.

---

### Problem 6: Database Depends on Email

* If email fails first, notification may never be stored.
* Student misses the notification completely.

**Solution:** Save notification before delivery.

**Code Solution**

```text
save_notification_to_db()

push_to_app()

enqueue_email()
```

---

### Architecture

```text
Admin
  ↓
Notification Service
  ↓
Redis / RabbitMQ Queue
  ↓
Worker 1   Worker 2   Worker 3
  ↓          ↓          ↓
Database   Push App   Email
```

---

### Find Failed Students

**Code Solution**

```sql
SELECT student_id
FROM notification_jobs
WHERE status IN ('FAILED', 'PENDING');
```

---

### Retry Failed Students

**Code Solution**

```text
function retry_failed(notification_id):
    failed_students = get_failed_students(notification_id)

    notify_all(
        failed_students,
        get_message(notification_id)
    )
```

---

### Benefits

* Parallel processing instead of sequential.
* Faster notification delivery.
* Automatic retry support.
* Failure tracking for every student.
* Better scalability using queues.
* Recovery after crashes without losing progress.
