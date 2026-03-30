# Networking Simulation Module

## Overview

The Networking Simulation Module is a comprehensive, interactive learning platform that teaches cloud networking concepts through hands-on visualization and simulation.

## Architecture Flow

```
User → Ingress → Service → Load Balancer → Pods → Containers
```

## Features

### 1. **Ingress Management**
- Create domain-based entry points (e.g., myapp.cloudops.dev)
- Configure routing rules to services
- Visual status indicators (Active, Inactive, Misconfigured)
- Real-time traffic monitoring

### 2. **Service Discovery**
- Label-based pod selection
- Multiple service types (ClusterIP, NodePort, LoadBalancer)
- Automatic endpoint discovery
- Port mapping configuration

### 3. **Load Balancing**
- **Algorithms:**
  - Round Robin: Equal distribution across all pods
  - Least Connections: Intelligent routing to least-loaded pods
- Real-time traffic distribution visualization
- Per-pod load metrics
- Automatic health-based routing

### 4. **Pod Management**
- Create pods with custom labels
- Monitor CPU, memory, and traffic metrics
- Simulate pod crashes and recovery
- Auto-scaling integration

### 5. **Traffic Simulation**
- Adjustable RPS (Requests Per Second) slider
- Real-time traffic flow visualization
- Animated canvas showing traffic paths
- Traffic distribution charts

### 6. **Learning Integration**
- Comprehensive tutorial system
- Topic-based learning (Ingress, Service, Load Balancer, Pods)
- Real-time troubleshooting guides
- AI-powered insights and hints

### 7. **Failure Scenarios**
- Pod crash simulation
- Service misconfiguration detection
- Missing backend alerts
- Overload warnings

## How to Use

### Getting Started

1. **Navigate to Networking Module**
   - Click "Networking" in the sidebar
   - You'll see the main dashboard with stats

2. **Create Your First Pod**
   - Go to "Pods" tab
   - Click "Create Pod"
   - Set name, labels (e.g., app=nginx, version=v1), and max RPS
   - Pod will transition from Pending → Running

3. **Create a Service**
   - Go to "Services" tab
   - Click "Create Service"
   - Set selector to match pod labels (e.g., app=nginx)
   - Service will automatically discover matching pods

4. **Add Load Balancer**
   - In Services tab, click "+ Load Balancer" for a service
   - Choose algorithm (Round Robin or Least Connections)
   - Load balancer will distribute traffic intelligently

5. **Create Ingress**
   - Go to "Ingress" tab
   - Click "Create Ingress"
   - Enter domain name (e.g., myapp.cloudops.dev)
   - Connect to your service

6. **Start Traffic Simulation**
   - Adjust traffic slider (0-1000 RPS)
   - Click "Start" button
   - Watch traffic flow in real-time

### Visualization Tab

The Visualization tab shows:
- **Flow Diagram**: Ingress → Service → Pods
- **Animated Canvas**: Traffic flows with RPS indicators
- **Stats Cards**: Traffic, flows, load, and system status
- **Real-time Alerts**: Issues and warnings

### Tutorial Tab

Comprehensive learning content covering:
- **Overview**: Complete architecture explanation
- **Ingress**: Domain routing and entry points
- **Service**: Stable endpoints and label selectors
- **Load Balancer**: Algorithms and distribution strategies
- **Pods**: Container orchestration and scaling

## Common Scenarios

### Scenario 1: Basic Setup
```
1. Create 3 pods (app=web, version=v1, max 100 RPS each)
2. Create service (selector: app=web)
3. Create load balancer (Round Robin)
4. Create ingress (domain: myapp.cloudops.dev)
5. Start traffic at 200 RPS
6. Watch even distribution: ~67 RPS per pod
```

### Scenario 2: Blue-Green Deployment
```
1. Create 2 pods (app=web, version=v1)
2. Create 2 pods (app=web, version=v2)
3. Create service for v1 (selector: app=web, version=v1)
4. Test v1 with traffic
5. Update service selector to version=v2
6. Traffic instantly switches to v2 pods
```

### Scenario 3: Failure Handling
```
1. Create 5 pods with service and load balancer
2. Start high traffic (500 RPS)
3. Simulate crash on 2 pods
4. Watch load balancer redistribute traffic to healthy pods
5. System stays operational despite failures
```

### Scenario 4: Overload Testing
```
1. Create 2 pods (max 100 RPS each)
2. Send 500 RPS traffic
3. Observe pods hitting capacity
4. CPU spikes to 100%
5. Add more pods to handle load
6. Watch distribution balance out
```

## Key Concepts

### Label Selectors
Services find pods using labels. A pod with labels `{app: nginx, version: v1}` will be selected by a service with selector `{app: nginx}` or `{app: nginx, version: v1}`.

### Load Balancing Algorithms

**Round Robin:**
- Request 1 → Pod A
- Request 2 → Pod B
- Request 3 → Pod C
- Request 4 → Pod A (repeat)

**Least Connections:**
- Tracks current RPS per pod
- Routes new requests to least-loaded pod
- Better for variable request durations

### Traffic Flow

1. **Ingress** receives external request
2. **Ingress** routes to **Service** based on domain/path
3. **Service** selects matching pods via labels
4. **Load Balancer** distributes request to a pod
5. **Pod** processes request (CPU/memory increase)
6. Response flows back through same path

## Troubleshooting

### "No backend available" Error
**Cause:** Service has no healthy pods
**Solution:** 
- Create pods with matching labels
- Ensure pods are in "Running" state
- Check service selector matches pod labels

### "Ingress misconfigured" Warning
**Cause:** Ingress not connected to any service
**Solution:**
- In Ingress tab, select a service from dropdown
- Ensure service exists and has endpoints

### Pods Crashing Under Load
**Cause:** Traffic exceeds pod capacity
**Solution:**
- Reduce traffic with slider
- Create more pods to distribute load
- Increase pod max RPS capacity

### Uneven Load Distribution
**Cause:** Wrong load balancer algorithm
**Solution:**
- Switch from Round Robin to Least Connections
- Check if some pods have lower capacity
- Verify all pods are healthy

## API Integration

The networking store can be imported and used:

```typescript
import { useNetworkStore } from '@/store/networkStore';

// In your component
const { 
  pods, 
  services, 
  createPod, 
  createService,
  startSimulation 
} = useNetworkStore();

// Create a pod
createPod('my-pod', { app: 'nginx', version: 'v1' }, 100);

// Create a service
createService('my-service', { app: 'nginx' }, 'ClusterIP', 80, 8080);

// Start simulation
startSimulation();
```

## Advanced Features

### Auto-Scaling (Future)
- Horizontal Pod Autoscaler (HPA) integration
- CPU-based scaling triggers
- Automatic pod creation/deletion

### Metrics & Monitoring (Future)
- Prometheus-style metrics
- Historical traffic graphs
- Performance analytics

### Game Mode Scenarios (Future)
- "Fix Broken Routing" challenge
- "Handle Traffic Spike" scenario
- "Zero-Downtime Deployment" mission

## Best Practices

1. **Always have redundancy**: Minimum 2-3 pods per service
2. **Match labels carefully**: Wrong selectors = no traffic
3. **Monitor pod health**: Watch CPU/memory metrics
4. **Use appropriate algorithm**: Round Robin for simple, Least Connections for complex
5. **Test failures**: Simulate crashes to verify resilience
6. **Start small**: Begin with low traffic, gradually increase
7. **Learn from alerts**: Read and understand all warnings

## Technical Details

### Data Models

**NetworkPod:**
```typescript
{
  id: string;
  name: string;
  labels: Record<string, string>;
  status: 'pending' | 'running' | 'failed' | 'terminating';
  currentRps: number;
  maxRps: number;
  cpu: number;
  memory: number;
}
```

**Service:**
```typescript
{
  id: string;
  name: string;
  selector: Record<string, string>;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  port: number;
  targetPort: number;
  endpoints: string[]; // Pod IDs
}
```

**LoadBalancer:**
```typescript
{
  id: string;
  serviceId: string;
  algorithm: 'round-robin' | 'least-connections';
  enabled: boolean;
  distributedRps: Record<string, number>; // podId -> RPS
}
```

**Ingress:**
```typescript
{
  id: string;
  domain: string;
  serviceId: string | null;
  status: 'active' | 'inactive' | 'misconfigured';
  totalTraffic: number;
}
```

### Simulation Logic

The simulation runs every second when active:

1. **Traffic Distribution**: Ingress → Service → Load Balancer → Pods
2. **Load Calculation**: Each pod calculates CPU/memory based on RPS
3. **Health Checks**: Failed pods removed from load balancer rotation
4. **Metrics Update**: Real-time stats updated for visualization
5. **Alert Generation**: Issues detected and alerts created

## Contributing

To add new features:

1. **New Components**: Add to `/src/components/networking/`
2. **Store Logic**: Update `/src/store/networkStore.ts`
3. **Learning Content**: Add topics to `/src/data/learningContent.ts`
4. **Routes**: Register in `/src/App.tsx`

## License

Part of CloudOps Simulator - Educational Cloud Infrastructure Training Platform
