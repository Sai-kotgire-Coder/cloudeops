# 🎫 Ticketing System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migrations ✅ (Already Done!)

```bash
cd server
npm run db:generate  # ✅ Done
npm run db:push      # ✅ Done - Tables created
```

### Step 2: Start Backend

```bash
cd server
npm run dev
```

Backend will start on `http://localhost:3002`

### Step 3: Start Frontend

```bash
npm run dev
```

Frontend will start on `http://localhost:8080`

### Step 4: Navigate to Tickets

Click **"Tickets"** in the sidebar or visit: `http://localhost:8080/tickets`

## 🎮 Create Your First Ticket

### Automatic Way (Recommended)

1. **Enable Auto-Generation**: Click "Auto-Gen ON" button
2. **Create Traffic**: Go to Live Instances or Networking
3. **Send High Traffic**: Slider to 800-1000 RPS
4. **Wait 5 Seconds**: Ticket auto-generates when CPU > 80%
5. **View Ticket**: Click the new red ticket card
6. **Apply Quick Fix**: Click "Enable HPA" button
7. **Watch Resolution**: Ticket auto-resolves!

### Manual Way

1. Click "+ Create Ticket" (coming soon - use auto-gen for now)
2. Or trigger from scenarios

## 📊 Test Each Ticket Type

### Test 1: High CPU Alert 🔴

```
1. Go to Live Instances
2. Set traffic to 900 RPS
3. Wait 5 seconds
4. 🎫 Auto-ticket: "High CPU Usage Detected"
5. Priority: Critical
6. Quick Fix: Enable HPA
```

### Test 2: Pod Crash 🔴

```
1. Go to Networking page
2. Create 2 pods
3. Start traffic
4. Click "Simulate Crash" on a pod
5. 🎫 Auto-ticket: "Pod Failure Detected"
6. Quick Fix: Restart Pods
```

### Test 3: Cluster Capacity ⚠️

```
1. Go to Live Instances
2. Create max pods
3. 🎫 Auto-ticket: "Cluster Capacity Exhausted"
4. Quick Fix: Enable ASG
```

### Test 4: Service No Backend ⚠️

```
1. Go to Networking
2. Create service without pods
3. 🎫 Auto-ticket: "Service Has No Backend"
4. Quick Fix: Fix Service Selector
```

### Test 5: Pipeline Failure 🟡

```
1. Go to CI/CD page
2. Create pipeline that fails
3. 🎫 Auto-ticket: "Pipeline Failure"
4. Manual investigation required
```

## 🎯 Interactive Tutorial

### Scenario: Black Friday Traffic Spike

**Goal**: Handle 1000 RPS without crashes

```
┌─────────────────────────────────────────┐
│ 1. Start with 2 instances, 4 pods      │
│ 2. Enable auto-gen ticketing           │
│ 3. Gradually increase traffic           │
│ 4. Wait for CPU alert ticket            │
│ 5. Apply quick fix: Enable HPA         │
│ 6. Watch pods scale 4 → 8              │
│ 7. CPU drops < 70%                      │
│ 8. Ticket auto-resolves ✓              │
│ 9. Score +100 points!                   │
└─────────────────────────────────────────┘
```

**Steps**:

1. Navigate to `/live`
2. Set initial traffic: 200 RPS
3. Toggle auto-generation ON in `/tickets`
4. Increase traffic to 800 RPS
5. Watch ticket appear in 5 seconds
6. Click ticket → "Enable HPA"
7. Return to `/live` and watch pods scale
8. Check `/tickets` - ticket resolves automatically!

## 🔍 Explore Features

### 1. Ticket Detail Panel

- Click any ticket to open detail view
- See description, metrics, timeline
- Access quick fixes and AI hints

### 2. Filters

- Filter by status: Open, In Progress, Resolved, Closed
- Filter by priority: Critical, High, Medium, Low
- Combine filters for precise views

### 3. Quick Fixes (One-Click Solutions)

| Category | Available Fixes |
|----------|----------------|
| CPU | Enable HPA, Enable ASG, Add Instance |
| Memory | Enable HPA, Enable ASG, Add Instance |
| Scaling | Scale Pods, Enable ASG |
| Pod | Restart Pods |
| Service | Fix Service Selector |
| Container | Enable Load Balancer, Reduce Traffic |

### 4. AI Hints

Click "Get Hint" in any ticket for:
- Context-aware suggestions
- Best practices
- Step-by-step guidance

### 5. Activity Timeline

Every action is logged:
- Ticket created (timestamp)
- Status changed
- Quick fix applied
- Manual action recorded
- Ticket resolved

## 📈 Dashboard Stats

Monitor these metrics:

- **Total Tickets**: All tickets created
- **Critical**: Require immediate action (red)
- **Open**: Awaiting response (orange)
- **In Progress**: Actively working (blue)
- **Resolved**: Successfully fixed (green)

## 🎓 Learning Path

### Beginner: Understanding Tickets

1. Enable auto-generation
2. Create traffic to trigger alerts
3. Read ticket descriptions
4. Use "Get Hint" for guidance
5. Apply quick fixes

### Intermediate: Manual Resolution

1. Work on complex issues
2. Investigate root causes
3. Apply manual fixes in system
4. Document actions taken
5. Mark tickets resolved

### Advanced: Prevention & Optimization

1. Enable auto-scaling before issues
2. Monitor capacity proactively
3. Prevent tickets from generating
4. Optimize resource allocation
5. Maintain zero critical tickets

## 🔧 Troubleshooting

### No Tickets Appearing

**Check:**
- Auto-generation enabled? (Button says "Auto-Gen ON")
- Traffic high enough? (Try 800+ RPS)
- System actually stressed? (Check CPU metrics)
- 5 seconds passed? (Cooldown period)

**Fix:**
- Refresh page
- Check console for errors
- Verify stores connected

### Quick Fixes Not Working

**Check:**
- Feature already enabled?
- Correct store imported?
- Permission errors?

**Fix:**
- Check browser console
- Verify gameStore methods available
- Try manual resolution

### Ticket Won't Resolve

**Check:**
- Action actually taken?
- Description provided?
- Status updated?

**Fix:**
- Manually mark resolved
- Add activity log entry
- Check backend logs

## 🎨 UI Guide

### Ticket Card Colors

- **Red Border**: Critical priority
- **Orange Border**: High priority
- **Yellow**: Medium priority
- **Blue**: Low priority

### Status Icons

- 🕐 **Clock**: Open
- ⚡ **Lightning**: In Progress (animated)
- ✓ **Check**: Resolved/Closed

### Priority Icons

- 🔥 **Flame**: Critical
- ⚠️ **Triangle**: High
- ⚪ **Circle**: Medium
- ℹ️ **Info**: Low

## 📱 Mobile Experience

Tickets page is fully responsive:
- Swipe cards to view
- Touch to open details
- Tap quick fixes
- Scroll timeline

## 🎯 Success Criteria

You've mastered the system when you can:

✅ Generate tickets automatically  
✅ Diagnose issues from descriptions  
✅ Apply quick fixes confidently  
✅ Write clear action documentation  
✅ Maintain system health (low ticket count)  
✅ Resolve 90%+ of tickets  
✅ Prevent recurring issues  

## 🏆 Challenge Mode

### Challenge 1: Zero Critical
**Goal**: Operate for 10 minutes with no critical tickets  
**Difficulty**: Medium  
**Reward**: 500 points

### Challenge 2: Quick Response
**Goal**: Resolve all tickets within 30 seconds  
**Difficulty**: Hard  
**Reward**: 1000 points

### Challenge 3: Prevention Master
**Goal**: Enable auto-scaling before any tickets generate  
**Difficulty**: Easy  
**Reward**: 200 points

## 💡 Pro Tips

1. **Enable HPA Early**: Prevent CPU tickets before they happen
2. **Monitor Trends**: Notice patterns in ticket creation
3. **Use Quick Fixes**: Faster than manual resolution
4. **Document Well**: Future you will thank you
5. **Check Timeline**: Learn from past actions
6. **Filter Smart**: Focus on critical first
7. **Auto-Gen Always On**: Catch issues immediately
8. **Read Hints**: AI knows best practices

## 🔗 Related Docs

- [Full Documentation](./TICKETING_SYSTEM_README.md)
- [API Reference](./TICKETING_SYSTEM_README.md#-api-endpoints)
- [Architecture](./TICKETING_SYSTEM_README.md#-architecture)
- [Database Schema](./TICKETING_SYSTEM_README.md#-database-schema)

## 🆘 Need Help?

Check:
1. Browser console for errors
2. Network tab for API failures
3. Backend logs for server issues
4. Database for data persistence

## 🎉 You're Ready!

Start with the "Black Friday Traffic Spike" scenario above. You'll have your first ticket resolved in under 2 minutes!

---

**Happy Incident Managing! 🚀**
