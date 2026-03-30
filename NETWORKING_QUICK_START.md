# Networking Simulator - Quick Start Guide

## 🚀 Access the Simulator

1. Start your development server (if not already running):
   ```bash
   npm run dev
   ```

2. Navigate to the Networking page:
   - Click "Networking" in the sidebar
   - Or visit: `http://localhost:8080/networking`

## 💡 5-Minute Tutorial

### Step 1: Create Pods (30 seconds)
1. Click **"Pods"** tab
2. Click **"Create Pod"** button
3. Fill in:
   - Name: `web-pod-1`
   - App Label: `nginx`
   - Version: `v1`
   - Max RPS: `100`
4. Click **"Create Pod"**
5. Repeat 2 more times for `web-pod-2` and `web-pod-3`

✅ **You now have 3 pods ready to handle traffic!**

---

### Step 2: Create Service (30 seconds)
1. Click **"Services"** tab
2. Click **"Create Service"**
3. Fill in:
   - Service Name: `web-service`
   - Service Type: `LoadBalancer`
   - Selector: `app` = `nginx`
   - Port: `80`
   - Target Port: `8080`
4. Click **"Create Service"**

✅ **Your service is now connected to all 3 pods!**

---

### Step 3: Add Load Balancer (20 seconds)
- A load balancer is automatically created for LoadBalancer-type services
- Go to **Services** tab to see it
- Or manually create one by clicking **"+ Load Balancer"**

✅ **Traffic will now distribute evenly across pods!**

---

### Step 4: Create Ingress (30 seconds)
1. Click **"Ingress"** tab
2. Click **"Create Ingress"**
3. Fill in:
   - Domain: `myapp.cloudops.dev`
   - Target Service: `web-service`
4. Click **"Create Ingress"**

✅ **Your app is now accessible from the internet!**

---

### Step 5: Send Traffic (1 minute)
1. Click **"Visualization"** tab
2. Drag the **Traffic Control** slider to `200 RPS`
3. Click **"Start"** button
4. Watch the magic happen! 🎉

**Observe:**
- Traffic flows from Ingress → Service → Pods
- Each pod receives ~67 RPS (200 / 3)
- CPU and memory metrics update in real-time
- Animated traffic lines show flow

---

## 🎮 Try These Experiments

### Experiment 1: Simulate Pod Crash
1. In **Pods** tab, click **"Simulate Crash"** on one pod
2. Watch traffic redistribute to remaining 2 pods
3. Each now handles ~100 RPS instead of ~67 RPS

**Learning:** System stays alive even when pods fail!

---

### Experiment 2: Overload Test
1. Set traffic to `500 RPS`
2. Watch pods hit 100% CPU
3. Add 2 more pods
4. Watch load drop as traffic spreads across 5 pods

**Learning:** Horizontal scaling prevents overload!

---

### Experiment 3: Blue-Green Deployment
1. Create 3 new pods with `version=v2`
2. In Services tab, change selector to `version=v2`
3. Traffic instantly switches from v1 to v2 pods

**Learning:** Zero-downtime deployments in action!

---

## 📊 Key Metrics to Watch

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **CPU** | < 60% | 60-85% | > 85% |
| **Memory** | < 70% | 70-90% | > 90% |
| **RPS per Pod** | < Max RPS | 80-100% of Max | > Max RPS |
| **Error Rate** | 0% | < 1% | > 1% |

## 🆘 Common Issues

### "No backend available"
**Fix:** Create pods with labels matching service selector

### "Ingress misconfigured"
**Fix:** Connect ingress to a valid service

### Pods keep crashing
**Fix:** Reduce traffic OR add more pods

### Uneven load distribution
**Fix:** Enable load balancer OR check pod capacities

## 📚 Learn More

### In-App Tutorial
Click the **"Tutorial"** tab for comprehensive learning content covering:
- Networking fundamentals
- Ingress routing
- Service discovery
- Load balancing strategies
- Pod orchestration

### Real-World Concepts
This simulator teaches the same concepts used by:
- **Kubernetes** (pods, services, ingress)
- **AWS** (ELB, ALB, Target Groups)
- **Google Cloud** (Google Kubernetes Engine)
- **Azure** (AKS, Application Gateway)

## 🎯 Learning Goals

By the end of this tutorial, you will understand:

✓ How external traffic enters a cloud system  
✓ How Ingress maps domains to services  
✓ How Services use labels to find pods  
✓ How Load Balancers distribute traffic  
✓ Why redundancy prevents downtime  
✓ How to troubleshoot networking issues  

## 🏆 Challenge Yourself

### Challenge 1: High Availability Setup
**Goal:** Handle 1000 RPS with < 75% CPU per pod  
**Solution:** Create 10+ pods with load balancer

### Challenge 2: Multi-Version Deployment
**Goal:** Run v1 and v2 simultaneously, switch traffic on demand  
**Solution:** Create 2 services, 1 ingress, use selector switching

### Challenge 3: Failure Resilience
**Goal:** Survive 3 pod crashes with no downtime  
**Solution:** Start with 6+ pods, crash 3, verify traffic continues

## 💪 Next Steps

1. **Experiment freely** - Nothing breaks permanently, just click Reset
2. **Read alerts** - They teach you what went wrong
3. **Try different algorithms** - Round Robin vs Least Connections
4. **Scale up and down** - Add/remove pods dynamically
5. **Monitor metrics** - Watch CPU, memory, traffic in real-time

---

## 🎓 Pro Tips

- Always have **at least 2-3 pods** for redundancy
- **Test failures** by simulating crashes  
- **Start with low traffic**, gradually increase  
- **Read the Tutorial tab** for deep technical knowledge  
- **Watch the Visualization** to understand flow  

---

**Happy Learning! 🚀**

Need help? Check the Tutorial tab or hover over ℹ️ icons for inline help.
