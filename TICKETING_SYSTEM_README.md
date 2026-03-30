# DevOps Ticketing & Incident Management System

## 🎯 Overview

A comprehensive, real-world DevOps incident management system that auto-generates tickets from system events, provides actionable fixes, and teaches incident response workflows.

## ✨ Key Features

### 1. **Auto-Generated Tickets**
Tickets are automatically created when the system detects issues:

- **High CPU**: CPU usage > 80%
- **Memory Pressure**: Memory > 85%
- **Pod Crashes**: Any pod enters failed/crashed state
- **Cluster Capacity**: Pod capacity > 85%
- **Instance Failures**: Node crashes
- **Service Issues**: Services with no backends
- **Pipeline Failures**: CI/CD failures
- **Container Overload**: Container CPU > 90%

### 2. **Ticket Types & Priorities**

**Types:**
- 🔴 **Incident**: System failure requiring immediate action
- ⚠️ **Alert**: Warning that could become critical
- 📋 **Task**: Manual operational work
- 🔄 **Change Request**: Deployment or configuration change

**Priorities:**
- 🔴 **Critical**: System down, data loss risk
- 🟠 **High**: Performance degraded, service impacted
- 🟡 **Medium**: Minor issues, can wait
- ⚪ **Low**: Informational, no immediate action

### 3. **Actionable Quick Fixes**

Each ticket includes one-click fixes that interact with the system:

| Issue Category | Quick Fix Actions |
|---------------|------------------|
| High CPU | Enable HPA, Enable ASG, Add Instance |
| Memory | Enable HPA, Enable ASG, Add Instance |
| Scaling | Scale Pods, Enable ASG |
| Pod Crash | Restart Pods |
| Service | Fix Service Selector |
| Container | Enable Load Balancer, Reduce Traffic |

### 4. **Status Workflow**

```
Open → In Progress → Resolved → Closed
```

- **Open**: New ticket awaiting action
- **In Progress**: Actively being worked on
- **Resolved**: Issue fixed, solution applied
- **Closed**: Ticket archived

### 5. **AI DevOps Assistant**

Each ticket provides:
- **Get Hint**: Context-aware suggestions
- **Suggested Fix**: Step-by-step resolution
- **Learn More**: Educational content
- **Metrics Snapshot**: System state when ticket created

### 6. **Activity Timeline**

Every action is logged:
- Ticket created
- Status changed
- Quick fix applied
- Manual action taken
- Ticket resolved

## 📋 How to Use

### Getting Started

1. **Enable Auto-Generation**:
   - Click "Auto-Gen ON" button
   - System monitors every 5 seconds
   - Tickets auto-create when issues detected

2. **View Tickets**:
   - Click any ticket card
   - Detailed panel opens on right
   - See description, metrics, suggested fixes

3. **Take Action**:
   - **Quick Fix**: Click action button (e.g., "Enable HPA")
   - **Manual Fix**: Apply in system, describe action, mark resolved
   - **Get Hint**: Click for AI suggestions

4. **Track Progress**:
   - Filter by status/priority
   - View activity timeline
   - Monitor resolution metrics

### Example Workflow

#### Scenario: High CPU Alert

1. **Ticket Auto-Created**:
   ```
   🔴 Critical: High CPU Usage Detected
   Priority: Critical
   Affected: instance-1, instance-2
   CPU: 92% average
   ```

2. **Open Ticket**:
   - Click ticket card
   - Read description and metrics
   - See suggested fix

3. **Apply Quick Fix**:
   - Click "Enable HPA" button
   - System automatically enables autoscaler
   - Ticket marked in progress

4. **Verify Resolution**:
   - Watch CPU metrics drop
   - Ticket auto-resolves
   - Action logged in timeline

## 🔧 API Endpoints

### GET /api/tickets
Get all tickets for authenticated user

```json
{
  "tickets": [
    {
      "id": "uuid",
      "ticketNumber": "TK-0001",
      "title": "High CPU Usage",
      "description": "...",
      "type": "incident",
      "priority": "critical",
      "status": "open",
      "category": "cpu",
      "createdAt": "2024-03-23T10:30:00.000Z"
    }
  ]
}
```

### GET /api/tickets/:id
Get single ticket with activity log

### POST /api/tickets
Create manual ticket

```json
{
  "title": "Deploy new version",
  "description": "...",
  "type": "change_request",
  "priority": "medium",
  "category": "deployment"
}
```

### PATCH /api/tickets/:id
Update ticket status

```json
{
  "status": "in_progress",
  "actionTaken": "Enabled HPA and scaled to 5 replicas"
}
```

### DELETE /api/tickets/:id
Delete ticket

### POST /api/tickets/:id/activities
Add activity log entry

## 🏗️ Architecture

### Frontend Components

```
TicketsPage.tsx
├── TicketCard.tsx (List view)
└── TicketDetailPanel.tsx (Side panel)
    ├── Quick Fix Buttons
    ├── AI Hints
    ├── Suggested Fixes
    └── Activity Timeline
```

### State Management

**ticketStore.ts**:
- Manages tickets state
- Auto-generation triggers
- System integration
- Quick fix handlers

**Default Triggers**:
- High CPU (> 80%)
- High Memory (> 85%)
- Pod Crashes
- Cluster Capacity (> 85%)
- Instance Crashes
- Service No Endpoints
- Pipeline Failures
- Container Overload (> 90%)

### Database Schema

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ticket_number VARCHAR UNIQUE,
  title VARCHAR(200),
  description TEXT,
  type VARCHAR, -- incident, alert, task, change_request
  priority VARCHAR, -- critical, high, medium, low
  status VARCHAR DEFAULT 'open',
  category VARCHAR, -- cpu, memory, scaling, etc.
  affected_service VARCHAR,
  source_event TEXT,
  metrics_snapshot JSONB,
  suggested_fix TEXT,
  action_taken TEXT,
  assigned_to VARCHAR,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ticket_activities (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id),
  action VARCHAR, -- created, status_changed, resolved, etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎓 Learning Outcomes

Users learn:

1. **Incident Response**: How to handle production issues
2. **Root Cause Analysis**: Diagnosing system problems
3. **Fix Implementation**: Applying solutions
4. **Prevention**: Using auto-scaling, monitoring
5. **Documentation**: Recording actions taken
6. **Prioritization**: Critical vs. low-priority issues

## 🔄 Integration Points

### Game Store
- CPU/Memory metrics
- Instance status
- Pod states
- ASG/HPA configuration

### Network Store
- Service health
- Pod endpoints
- Load balancer status

### Container Store
- Container metrics
- Load balancer status
- Traffic levels

### CI/CD Store
- Pipeline status
- Build failures

## 📊 Monitoring Triggers

| Trigger | Condition | Cooldown | Priority |
|---------|-----------|----------|----------|
| High CPU | CPU > 80% | 5 min | High/Critical |
| Memory | Memory > 85% | 5 min | High |
| Pod Crash | Status === failed | 3 min | Critical |
| Capacity | Usage > 85% | 10 min | High |
| Instance Crash | Status === crashed | 2 min | Critical |
| No Endpoints | Endpoints === 0 | 5 min | High |
| Pipeline Fail | Status === failed | 3 min | Medium |
| Container | CPU > 90% | 4 min | High |

## 🎮 Game Scenarios

### Black Friday Traffic Spike
```
1. Traffic surges to 1000 RPS
2. Auto-ticket: "High CPU Usage"
3. User enables HPA
4. Pods scale 2 → 8
5. Ticket auto-resolves
```

### Database Migration
```
1. Manual ticket: "Migrate DB to new region"
2. Type: Change Request
3. Priority: High
4. User performs migration
5. Documents action taken
6. Marks resolved
```

### Pod Failure Recovery
```
1. Random pod crashes (simulation)
2. Auto-ticket: "Pod Failure Detected"
3. Quick fix: Restart Pods
4. System recovers automatically
5. Timeline shows recovery steps
```

## 🚀 Best Practices

### For Users

1. **Enable Auto-Generation**: Always keep monitoring on
2. **Respond Quickly**: Address critical tickets first
3. **Use Quick Fixes**: One-click solutions when available
4. **Document Actions**: Always describe what you did
5. **Learn from Hints**: Read AI suggestions
6. **Track Patterns**: Notice recurring issues

### For Developers

1. **Add Triggers**: Register custom triggers via `registerTrigger()`
2. **Custom Quick Fixes**: Extend quick fix handlers
3. **Integrate Systems**: Connect more monitoring sources
4. **Tune Cooldowns**: Adjust trigger frequencies
5. **Add Categories**: Define new ticket categories

## 🔍 Troubleshooting

### Tickets Not Generating

**Issue**: Auto-generation enabled but no tickets
**Causes**:
- System healthy (no issues detected)
- Triggers not checking (verify 5s interval)
- Store integration missing

**Solution**:
- Check browser console for errors
- Verify stores are properly imported
- Manually trigger issue (e.g., send high traffic)

### Quick Fixes Not Working

**Issue**: Click quick fix, nothing happens
**Causes**:
- Store method not available
- Incorrect category mapping
- Feature already enabled

**Solution**:
- Check browser console for errors
- Verify store integration
- Try manual resolution

### Activity Timeline Empty

**Issue**: No activities shown
**Causes**:
- Activities not being logged
- API not persisting activities

**Solution**:
- Check `addActivity()` calls
- Verify backend route working
- Check database logs

## 📈 Success Metrics

Track these to measure learning effectiveness:

- **Response Time**: How fast users address tickets
- **Resolution Rate**: % of tickets resolved vs. created
- **Quick Fix Usage**: % resolved via quick fixes
- **Repeat Issues**: Same ticket type occurrences
- **Manual Actions**: Quality of action documentation

## 🎯 Future Enhancements

- [ ] Multi-user assignment
- [ ] Ticket templates
- [ ] SLA timers
- [ ] Escalation rules
- [ ] Ticket cloning
- [ ] Email notifications
- [ ] Slack integration
- [ ] Custom triggers UI
- [ ] Metrics charts
- [ ] Export to CSV

## 📝 Example Tickets

### Critical: Pod Failure
```
Title: Pod Failure Detected
Description: 2 pods have crashed and are not responding
Priority: Critical
Category: pod
Affected: pod-1, pod-2
Suggested Fix:
  1. Check pod logs for errors
  2. Restart crashed pods
  3. Check resource limits
Quick Fixes: Restart Pods
```

### High: Memory Pressure
```
Title: High Memory Usage
Description: 3 instances at 89% memory
Priority: High
Category: memory
Affected: instance-1, instance-2, instance-3
Suggested Fix:
  1. Check for memory leaks
  2. Enable VPA
  3. Scale horizontally
Quick Fixes: Enable HPA, Enable ASG, Add Instance
```

### Medium: Pipeline Failure
```
Title: CI/CD Pipeline Failure
Description: Build pipeline failed during test phase
Priority: Medium
Category: deployment
Affected: cicd-system
Suggested Fix:
  1. Check pipeline logs
  2. Verify test dependencies
  3. Review recent code changes
Quick Fixes: (None - requires manual investigation)
```

## 🏁 Getting Started Commands

```bash
# Start backend (with ticket routes)
cd server
npm run dev

# Start frontend
npm run dev

# Access system
http://localhost:8080/tickets

# Generate test ticket
# Enable auto-generation and send high traffic to create CPU alert
```

---

**This system transforms static tickets into a living incident management platform!** 🚀
