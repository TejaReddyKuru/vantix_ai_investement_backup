# Friday Database Design

**Version**: v0.01  
**Status**: Production-Ready Foundation  
**Last Updated**: Phase 2 Complete

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Design Principles](#design-principles)
3. [Entity Relationships](#entity-relationships)
4. [Domain Details](#domain-details)
5. [Data Ownership & Isolation](#data-ownership--isolation)
6. [Financial Data Integrity](#financial-data-integrity)
7. [Indexes](#indexes)
8. [Constraints](#constraints)
9. [Migration Strategy](#migration-strategy)
10. [Security Considerations](#security-considerations)

---

## Architecture Overview

Friday uses a **relational database** with PostgreSQL in production and SQLite in development. The schema supports:

- **Multi-tenant data isolation** via user_id foreign keys
- **Immutable transaction history** for financial records
- **Soft deletion** for community content preservation
- **Time-series data** for portfolio tracking and analytics
- **Audit logging** for compliance and security
- **UUID primary keys** for reliability and portability

### Database Environments

| Environment | Database | Connection URL |
|-------------|----------|-----------------|
| Development | SQLite   | `sqlite+aiosqlite:///./data/dev.db` |
| Production  | PostgreSQL | `postgresql+asyncpg://...` |

Both databases are abstracted through SQLAlchemy ORM for seamless switching.

---

## Design Principles

### 1. **UUID Primary Keys**
- All tables use UUID (PostgreSQL native, Python uuid4)
- Prevents ID collisions across distributed systems
- Eliminates autoincrement dependencies

### 2. **UTC Timestamps**
- All datetime fields use UTC (`datetime.utcnow()`)
- Timezone handling deferred to application layer
- Enables consistent global analytics

### 3. **User Scoping**
- All multi-tenant data includes `user_id` foreign key
- Indexes on `user_id` for rapid user-specific queries
- Application layer enforces access control
- Database enforces referential integrity

### 4. **Immutable Financial Records**
- PaperTransaction table provides audit trail
- Account balances reconcilable from transaction history
- Prevents data integrity issues from mutable balance fields

### 5. **Soft Deletion**
- Community posts/comments use `deleted_at` nullable timestamp
- Preserves referential integrity
- Enables audit trail and content recovery

### 6. **Decimal Precision**
- Financial amounts use `Numeric(20, 8)` for crypto precision
- Prevents floating-point rounding errors
- Supports 8-decimal crypto precision

### 7. **Structured Metadata**
- Important fields use dedicated columns
- JSON used only for extensible, non-critical metadata
- Improves queryability and indexing

---

## Entity Relationships

### Domain 1: Users & Authentication

```
User (PK: id, UK: email)
├── UserProfile (1:1 relationship)
├── UserSession (1:N relationship)
├── UserPreferences (1:1 relationship)
└── [all other user-scoped records via user_id FK]
```

**Key Constraints:**
- Email must be unique
- Password stored as hash only
- Only one profile per user
- Only one preferences per user

### Domain 2: Subscriptions

```
SubscriptionPlan (PK: id, UK: code)
├── PlanEntitlement (N:M relationship to entitlement codes)
└── Subscription (1:N relationship to users)
    └── User (N:1 relationship)
```

**Key Constraints:**
- Plan code must be unique (FREE, PRO, ELITE)
- Plan and entitlement unique together
- Subscription references plan and user

### Domain 3: Assets & Watchlists

```
Asset (PK: id, UK: symbol)
├── WatchlistItem (N:M relationship to watchlists)
└── [referenced by paper trades, orders, positions, alerts]

Watchlist (PK: id)
├── User (N:1 relationship)
└── WatchlistItem (1:N relationship, UK: watchlist_id + asset_id)
    └── Asset (N:1 relationship)
```

**Key Constraints:**
- Symbol must be unique across all assets
- Watchlist items prevent duplicate assets per watchlist

### Domain 4: Paper Trading (Critical)

```
PaperAccount (PK: id)
├── User (N:1 relationship)
├── PaperOrder (1:N relationship)
├── PaperPosition (1:N, UK: account + asset)
├── PaperTrade (1:N relationship, immutable execution records)
└── PaperTransaction (1:N relationship, audit trail)
```

**Key Constraints:**
- `current_cash >= 0` (check constraint)
- Positions unique per asset per account
- Transactions provide immutable audit trail

### Domain 5: AI & Conversations

```
AIConversation (PK: id)
├── User (N:1 relationship)
├── Asset (N:1 relationship, nullable)
└── AIMessage (1:N relationship)

AIAgentRun (PK: id, UK: request_id)
├── User (N:1, nullable for system runs)
└── [tracks execution of 6 future agents]

AIInsight (PK: id)
├── User (N:1, nullable)
└── Asset (N:1, nullable)
```

**Key Constraints:**
- Request IDs must be unique for agent tracing
- Conversations can be asset-specific or general

### Domain 6: Alerts & Notifications

```
AlertRule (PK: id)
├── User (N:1 relationship)
└── Asset (N:1 relationship)
    └── AlertEvent (1:N relationship)

Notification (PK: id)
├── User (N:1 relationship)
└── [references any entity via reference_type + reference_id]
```

**Key Constraints:**
- Alert conditions stored as JSON for flexibility
- Notifications track unread status via `read_at`

### Domain 7: Community (Social)

```
CommunityPost (PK: id, soft-deletes via deleted_at)
├── User (N:1 relationship)
├── CommunityComment (1:N, soft-deletes)
├── CommunityLike (N:M, UK: user + target)
└── CommunityBookmark (N:M, UK: user + post)

CommunityFollow (N:M, UK: follower + following)
└── User (bilateral relationship)

CommunityReport (PK: id)
└── Reporter → Target (flexible via type + ID)
```

**Key Constraints:**
- Soft deletion preserves content history
- Likes/follows/bookmarks prevent duplicates
- Reports enable moderation workflow

### Domain 8: Tutor (Learning)

```
TutorCourse (PK: id)
├── TutorLesson (1:N relationship)
│   └── TutorQuestion (1:N relationship)
├── TutorQuiz (1:N relationship)
│   └── TutorQuizAttempt (1:N, tracks user attempts)
└── TutorProgress (1:1 per user, UK: user + course)
```

**Key Constraints:**
- One progress record per user per course
- Lessons ordered by position
- Quiz attempts capture answers for replay

### Domain 9: Audit & Security

```
AuditLog (PK: id)
├── User (N:1, nullable for system actions)
└── [flexible resource references via type + ID]
```

**Key Constraints:**
- Never stores passwords, tokens, or secrets
- Request IDs enable correlation across logs
- Indexes on action and timestamp for compliance queries

---

## Domain Details

### 1. Users (Authentication Foundation)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, email, password_hash, is_active, email_verified, last_login_at |
| `user_profiles` | User metadata | user_id, display_name, avatar_url, bio, timezone, country |
| `user_sessions` | Session management | user_id, session_hash, device_info, ip_address, expires_at, revoked_at |
| `user_preferences` | User settings | user_id, trading_experience, preferred_assets, risk_preference, theme_preference, notification_preferences |

**Future Enhancements:**
- 2FA/MFA tokens
- OAuth integrations
- Email verification tokens

### 2. Subscriptions (Feature Gating)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `subscription_plans` | Tier definitions | id, name, code (FREE/PRO/ELITE), price, billing_interval |
| `subscriptions` | User subscriptions | user_id, plan_id, status, start_at, end_at |
| `plan_entitlements` | Feature access control | plan_id, entitlement_code (AI_CHAT, PAPER_TRADING, etc.) |

**Entitlement Codes:**
- `MARKET_ANALYSIS`: Core market data access
- `PAPER_TRADING`: Simulated trading
- `AI_CHAT`: AI assistant access
- `PORTFOLIO`: Portfolio tracking
- `AI_TUTOR`: Educational content
- `COMMUNITY`: Social features
- `ALERTS`: Price/event alerts

### 3. Assets (Exchange-Agnostic)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `assets` | Tradeable instruments | symbol (UK), base_asset, quote_asset, name, exchange, status, metadata |
| `watchlists` | User asset collections | user_id, name |
| `watchlist_items` | Watch items | watchlist_id, asset_id, position (UK: watchlist + asset) |

**Design Note:** Decoupled from Binance to support future exchanges.

### 4. Paper Trading (Critical Domain)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `paper_accounts` | Trading simulation accounts | user_id, initial_balance, current_cash, currency, status |
| `paper_orders` | Order placement | paper_account_id, asset_id, side (BUY/SELL), order_type, quantity, price, stop_loss, take_profit |
| `paper_positions` | Current holdings | paper_account_id, asset_id (UK), quantity, average_entry_price, realized_pnl, unrealized_pnl |
| `paper_trades` | Executed trades (immutable) | paper_account_id, order_id, asset_id, side, quantity, execution_price, fee, slippage, realized_pnl, executed_at |
| `paper_transactions` | Balance audit trail | paper_account_id, transaction_type, amount, reference_type, reference_id |

**Financial Integrity:**
- All amounts in `Numeric(20, 8)` for precision
- Transactions form immutable record of all balance changes
- Account cash balance can be reconciled from transactions
- Trades store execution details for analysis

### 5. Journal (Trade Logging)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `trade_journal_entries` | Manual trade notes | user_id, paper_trade_id, title, notes, strategy, setup, lessons, tags |

**Future Use:**
- Trade performance analysis
- Strategy backtesting
- Learning from wins/losses

### 6. Portfolio (Analytics)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `portfolio_snapshots` | Time-series equity tracking | user_id, paper_account_id, total_equity, cash, invested_value, realized_pnl, unrealized_pnl, drawdown, recorded_at |

**Design Note:**
- Snapshots recorded at application request time
- Enables performance charting and historical analysis
- Indexed on (user_id, recorded_at) for efficient queries

### 7. AI (Conversations & Intelligence)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `ai_conversations` | Chat threads | user_id, title, context_type (market/general), context_asset_id |
| `ai_messages` | Conversation history | conversation_id, role (user/assistant), content, model, provider, tokens_used |
| `ai_agent_runs` | Agent execution tracking | user_id, agent_name, request_id (UK), status, confidence, duration_ms, error_code, started_at, completed_at |
| `ai_insights` | Generated insights | user_id, asset_id, insight_type, title, summary, confidence, generated_at, expires_at, source_metadata |

**Future Agents:**
- Market Analysis Agent
- News Agent
- Sentiment Agent
- Risk Management Agent
- Trade Alert Agent
- AI Chat Agent

### 8. Alerts & Notifications

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `alert_rules` | Alert definitions | user_id, asset_id, alert_type, condition (JSON), threshold, is_enabled, cooldown_seconds |
| `alert_events` | Alert triggers | alert_rule_id, triggered_at, value, status, notification_sent |
| `notifications` | User notifications | user_id, notification_type, title, message, reference_type, reference_id, read_at |

**Workflow:**
1. Alert rule created by user
2. Market data triggers alert_event
3. Alert system creates notification
4. User marks notification as read

### 9. Community (Social Features)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `community_posts` | Public/private posts | user_id, content, visibility, deleted_at (soft delete) |
| `community_comments` | Post comments | post_id, user_id, content, deleted_at |
| `community_likes` | Like tracking | user_id, target_type (post/comment), target_id (UK: unique per target) |
| `community_follows` | User followers | follower_id, following_id (UK: prevents duplicates) |
| `community_bookmarks` | Saved posts | user_id, post_id (UK: prevents duplicate bookmarks) |
| `community_reports` | Moderation reports | reporter_id, target_type, target_id, reason, status |

**Moderation:**
- Soft deletion preserves integrity
- Reports enable community management
- Application layer enforces ownership rules

### 10. Tutor (Learning Platform)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `tutor_courses` | Course definitions | title, description, level (beginner/intermediate/advanced), duration_minutes |
| `tutor_lessons` | Lesson content | course_id, title, content, position, duration_minutes |
| `tutor_questions` | Quiz questions | lesson_id, question_text, question_type, options (JSON), correct_answer, explanation |
| `tutor_quizzes` | Formal assessments | course_id, title, passing_score |
| `tutor_quiz_attempts` | Student attempts | user_id, quiz_id, score, passed, answers (JSON), started_at, completed_at |
| `tutor_progress` | Course progress | user_id, course_id (UK), completed_lessons, total_lessons, progress_percentage, quiz_score, completed_at |

**Future Personalization:**
- Adaptive lesson difficulty
- Spaced repetition scheduling
- Performance analytics

### 11. Audit (Compliance & Security)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `audit_logs` | Security events | user_id, action (login/logout/password_change), resource_type, resource_id, request_id, ip_address, user_agent, metadata, created_at |

**Never Stores:**
- Raw passwords
- API keys
- Access tokens
- Encryption keys
- Private user data

---

## Data Ownership & Isolation

### User Scoping Strategy

All multi-tenant records include a `user_id` foreign key:

```
SELECT * FROM paper_accounts WHERE user_id = $1
```

**Application Responsibility:**
- Always filter by authenticated user's ID
- Never return records for other users
- Enforce at every query level

**Database Responsibility:**
- Foreign key constraints prevent orphaned data
- Cascade deletes clean up user's records
- Indexes enable fast filtering

### Example: Paper Trading Account Access

```python
# Correct: Scoped to authenticated user
async def get_user_accounts(user_id: UUID):
    return await db.execute(
        select(PaperAccount)
        .where(PaperAccount.user_id == user_id)
    )

# WRONG: Exposes all accounts
async def get_account(account_id: UUID):
    return await db.execute(
        select(PaperAccount)
        .where(PaperAccount.id == account_id)
    )
```

---

## Financial Data Integrity

### Immutable Transaction History

Paper trading uses a **transaction-based model** for auditability:

```
PaperAccount(current_cash=10000)
  ├── PaperTransaction(type=DEPOSIT, amount=+10000, created=T0)
  ├── PaperTransaction(type=ORDER_FEE, amount=-2.50, created=T1)
  ├── PaperTransaction(type=TRADE_EXECUTION, amount=-5000, created=T2)
  └── [current_cash always derived from transaction sum]
```

**Reconciliation:**
```sql
SELECT SUM(amount) FROM paper_transactions 
WHERE paper_account_id = $1
```

Should equal `current_cash` (or signal data corruption).

### PnL Calculation

- **Realized PnL**: Locked in when position closed (stored in PaperTrade)
- **Unrealized PnL**: Current market value - entry cost (calculated per position)
- **Total Equity**: current_cash + sum(unrealized_pnl across positions)

### Constraints

- Account cash cannot go below zero: `CHECK (current_cash >= 0)`
- All amounts are Numeric(20, 8) for precision
- Trades are immutable once created

---

## Indexes

### Performance-Critical Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `users` | `(email)` | User lookup, registration |
| `user_sessions` | `(user_id)` | User's active sessions |
| `user_sessions` | `(expires_at)` | Session expiration cleanup |
| `subscriptions` | `(user_id)` | User's subscription status |
| `paper_accounts` | `(user_id)` | User's accounts |
| `paper_orders` | `(paper_account_id, status)` | Query orders by account/status |
| `paper_positions` | `(paper_account_id)` | Account's current positions |
| `paper_trades` | `(paper_account_id, executed_at)` | Trade history query |
| `portfolio_snapshots` | `(user_id, recorded_at)` | Performance charting |
| `ai_conversations` | `(user_id)` | User's conversations |
| `ai_agent_runs` | `(user_id, agent_name)` | Agent tracking |
| `ai_insights` | `(user_id, asset_id)` | Insight discovery |
| `alert_rules` | `(user_id, asset_id)` | User's alerts per asset |
| `notifications` | `(user_id, read_at)` | Unread notifications |
| `community_posts` | `(user_id, created_at)` | User's post timeline |
| `community_comments` | `(post_id)` | Comment thread |
| `community_follows` | `(follower_id, following_id)` | Follow graph queries |
| `tutor_progress` | `(user_id, course_id)` | Course progress lookup |
| `audit_logs` | `(user_id, created_at)` | Compliance queries |

### Composite Indexes

Multi-column indexes optimize common query patterns:

```
portfolio_snapshots(user_id, recorded_at)  # GET equity history for user
paper_trades(paper_account_id, executed_at)  # GET trade history by account
notifications(user_id, read_at)  # GET unread notifications
audit_logs(resource_type, resource_id)  # GET all changes to a resource
```

---

## Constraints

### Uniqueness Constraints

| Table | Constraint | Purpose |
|-------|-----------|---------|
| `users` | `email` | User email registration |
| `assets` | `symbol` | Asset symbol lookup |
| `subscription_plans` | `code` | Plan code (FREE/PRO/ELITE) |
| `watchlist_items` | `(watchlist_id, asset_id)` | No duplicate watches |
| `paper_positions` | `(paper_account_id, asset_id)` | One position per asset per account |
| `plan_entitlements` | `(plan_id, entitlement_code)` | No duplicate entitlements |
| `community_likes` | `(user_id, target_type, target_id)` | One like per target |
| `community_follows` | `(follower_id, following_id)` | No duplicate follows |
| `community_bookmarks` | `(user_id, post_id)` | One bookmark per post |
| `user_profiles` | `user_id` | One profile per user |
| `user_preferences` | `user_id` | One preference per user |
| `tutor_progress` | `(user_id, course_id)` | One progress per user per course |
| `ai_agent_runs` | `request_id` | Unique request tracing |

### Check Constraints

| Table | Constraint | Purpose |
|-------|-----------|---------|
| `paper_accounts` | `current_cash >= 0` | Prevent negative balance |

### Foreign Key Constraints

All multi-tenant records include `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.

Examples:
- `paper_accounts` → `users` (cascade)
- `subscriptions` → `users` (cascade) and `subscription_plans` (restrict)
- `paper_orders` → `paper_accounts` (cascade) and `assets` (restrict)

---

## Migration Strategy

### Alembic Workflow

Migrations are managed with Alembic in logical phases:

#### Phase 1 (Completed)
- Market model (legacy support)
- Core configuration

#### Phase 2 (Current - 11 Migrations)
1. `0002_phase2_users_and_auth` - Users, profiles, sessions, preferences
2. `0003_phase2_subscriptions` - Plans, subscriptions, entitlements
3. `0004_phase2_assets_and_watchlists` - Assets and watchlists
4. `0005_phase2_paper_trading` - Paper trading system
5. `0006_phase2_journal_portfolio_ai` - Journal, portfolio, AI conversations
6. `0007_phase2_agents_alerts_notifications` - AI agents, alerts, notifications
7. `0008_phase2_community` - Community tables
8. `0009_phase2_tutor` - Tutor/learning system
9. `0010_phase2_audit` - Audit logging
10. `0011_phase2_seed_subscription_data` - Seed data (plans and entitlements)

### Running Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade to specific revision
alembic upgrade 0005_phase2_paper_trading

# Downgrade to previous
alembic downgrade -1

# Show current version
alembic current
```

### Development Workflow

```bash
# Make model changes
# Models automatically imported into base.metadata

# Generate migration
python -m alembic revision --autogenerate -m "description"

# Review migration file
# Ensure correctness (autogenerate is a starting point)

# Test locally
alembic upgrade head
pytest tests/test_database_models.py

# Commit migration to git
git add alembic/versions/
git commit -m "Add migration"
```

### Production Deployment

```bash
# On staging/production:
1. Backup database
2. Run: alembic upgrade head
3. Verify: SELECT VERSION() (or alembic current)
4. Run health checks
5. Monitor error logs
```

---

## Security Considerations

### Sensitive Data Protection

**NEVER store:**
- Plaintext passwords (use password_hash only)
- API keys (Binance, LLM, etc.)
- Authentication tokens
- Encryption keys
- User PII beyond what's necessary

**Password Hashing:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
user.password_hash = pwd_context.hash(plain_password)
```

### Audit Logging

AuditLog captures security events WITHOUT exposing secrets:

```python
# ✓ CORRECT
AuditLog(
    user_id=user.id,
    action="login",
    ip_address=request.client.host,
    request_id=request_id,
)

# ✗ WRONG - Never log credentials
AuditLog(
    user_id=user.id,
    action="login",
    metadata={"password": user_input_password},  # SECURITY VIOLATION
)
```

### Access Control

Application must enforce:

1. **Row-Level Security**: Users see only their own records
2. **Entitlement Checks**: Before granting feature access
3. **Resource Ownership**: Verify user owns resource before modification
4. **Request Signing**: Sign API requests with JWT/API keys

Example:
```python
async def get_paper_account(user_id: UUID, account_id: UUID):
    account = await db.get(PaperAccount, account_id)
    if account.user_id != user_id:
        raise ForbiddenError("Unauthorized")
    return account
```

### Database Connection Security

- Use encrypted connections (SSL/TLS) in production
- Store DATABASE_URL in environment variables
- Use IAM authentication (AWS RDS, Heroku, etc.) where available
- Rotate credentials regularly

---

## Future Enhancements

### Phase 3+
- Multi-signature trades for risk management
- Webhook system for real-time alerts
- Data warehouse for analytics
- Blockchain/smart contract integration
- Advanced encryption for sensitive fields
- GraphQL API for complex queries
- Event sourcing for audit trail
- CQRS for read/write separation

---

## Appendix: SQL Cheat Sheet

### Common Queries

```sql
-- Get user's paper accounts with performance metrics
SELECT 
  pa.id, pa.name, pa.current_cash,
  SUM(pp.unrealized_pnl) as total_unrealized,
  COUNT(pp.id) as position_count
FROM paper_accounts pa
LEFT JOIN paper_positions pp ON pa.id = pp.paper_account_id
WHERE pa.user_id = $1
GROUP BY pa.id;

-- Get recent trades for account
SELECT * FROM paper_trades 
WHERE paper_account_id = $1 
ORDER BY executed_at DESC 
LIMIT 50;

-- Check user's subscription status
SELECT sp.code, sp.name, s.status, s.end_at
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.user_id = $1 
AND s.status = 'active'
AND s.end_at > NOW();

-- Get unread notifications
SELECT COUNT(*) as unread_count FROM notifications
WHERE user_id = $1 AND read_at IS NULL;

-- Audit trail for resource
SELECT * FROM audit_logs
WHERE resource_type = 'paper_account' 
AND resource_id = $1
ORDER BY created_at DESC;
```

### Data Validation

```sql
-- Verify paper account cash from transactions
SELECT 
  pa.id,
  pa.current_cash as db_balance,
  SUM(pt.amount) as calculated_balance,
  (pa.current_cash - SUM(pt.amount)) as discrepancy
FROM paper_accounts pa
LEFT JOIN paper_transactions pt ON pa.id = pt.paper_account_id
GROUP BY pa.id
HAVING (pa.current_cash - SUM(pt.amount)) != 0;
```

---

**Document End**  
Contact: Vish Capitals Engineering Team
