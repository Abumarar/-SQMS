# Database Entity-Relationship Diagram (ERD)

This document maps the core database schema for the Smart Queue Management System (SQMS).

```mermaid
erDiagram
    Users {
        uuid id PK
        string email
        string full_name
        string phone
        string role "admin, user, agent"
        timestamp created_at
    }

    Queues {
        uuid id PK
        string name
        string location
        boolean is_active
        integer max_capacity "optional"
        uuid admin_id FK
        timestamp created_at
    }

    Counters {
        uuid id PK
        uuid queue_id FK
        string name "e.g., Counter A"
        uuid agent_id FK "Currently assigned agent"
        boolean is_open
    }

    Tickets {
        uuid id PK
        uuid queue_id FK
        uuid user_id FK
        integer position_number
        string status "waiting, serving, completed, cancelled"
        timestamp created_at
        timestamp served_at
    }

    %% Relationships
    Users ||--o{ Queues : "manages (admin)"
    Queues ||--o{ Tickets : "has"
    Users ||--o{ Tickets : "owns"
    Queues ||--o{ Counters : "contains"
    Users ||--o{ Counters : "assigned to (agent)"
```

## Schema Details
1.  **Users:** Stores identity data. `role` dictates whether they access the Admin Dashboard or User Portal.
2.  **Queues:** Represents a specific line (e.g., "Main Branch - Tellers"). Managed by an admin.
3.  **Counters:** Represents a service desk. Links to a queue and a specific user (agent) currently servicing it.
4.  **Tickets:** The core entity. Tracks a user's position in a queue. Position determines order; status dictates current state.
