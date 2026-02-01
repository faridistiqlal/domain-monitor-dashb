# 📊 GitHub Actions Usage Monitoring

**Version:** 3.9.9  
**Last Updated:** 1 Februari 2026

---

## 🎯 Quick Check

**Cek Usage GitHub Actions:**
1. Buka: https://github.com/settings/billing
2. Scroll ke "Actions & Packages"
3. Lihat: "X min used / 2,000 min included"

**Current Usage (v3.9.9 - 1 Hour Interval):**
```
Schedule: Every 1 hour (0 * * * *)
Per Run: ~2.4 minutes (actual measured)
Per Day: ~58 minutes (24 runs)
Per Week: ~406 minutes
Per Month: ~1,728 minutes (86% quota)
Buffer: ~272 minutes (14%)
```

---

## ⚠️ Problem History & Solutions

### **v3.9.9 (1 Feb 2026): Schedule Adjustment**

**Problem Found:**
- ✅ Syntax error fixed in monitor-cron.js
- ❌ Actual duration: **2.4 minutes per run** (not 40 seconds as expected)
- ❌ With 20-min interval: 72 runs/day × 2.4 min = 173 min/day = **5,190 min/month** (259% over!)

**Solution:**
```yaml
# Changed schedule interval:
cron: '0 * * * *'  # Every 1 hour (was */20)

# New calculation:
24 runs/day × 2.4 minutes = 57.6 min/day
30 days = 1,728 minutes/month ✅ (86% quota)
```

### **v3.9.8 (24 Jan 2026): Dependency Optimization**

**BEFORE Optimization:**
- ❌ 2,000 minutes used in <1 month
- ❌ Each run: 2-3 minutes
- ❌ npm install (80+ packages): ~2 minutes
- ❌ Domain check: ~30-60 seconds
- ❌ Total: 7,560 min/month (378% of quota)

**Root Cause:**
```bash
# Every 20 minutes, GitHub Actions ran:
npm install  # <-- THIS WAS THE KILLER (2-3 minutes)
npm run monitor  # Domain checking (~30-60s)

# Result:
72 runs/day × 3.5 minutes = 252 min/day
30 days = 7,560 minutes ❌
```

---

## ✅ Solution Implemented (v3.9.8)

### **1. Minimal Dependencies**

**BEFORE:**
```yaml
- name: Install dependencies
  run: npm install  # 80+ packages, 2-3 minutes
```

**AFTER:**
```yaml
- name: Install only monitoring dependencies
  run: npm install --no-save firebase node-fetch  # 2 packages, ~15 seconds
```

**Savings:** 90% reduction in install time

---

### **2. Optimized Timeouts**

**BEFORE:**
```javascript
// DNS: No timeout (could hang forever)
// HTTP: 10 seconds timeout per try
// Total per domain: Up to 30+ seconds if slow
```

**AFTER:**
```javascript
// DNS: 5 seconds timeout
// HTTPS: 5 seconds timeout
// HTTP: 5 seconds timeout
// Total per domain: Max 15 seconds
```

**Savings:** 50% faster domain checking

---

### **3. Concurrency Control**

**BEFORE:**
```javascript
// Check ALL domains in batch at once
// 100 domains = 100 parallel requests
// Can overwhelm Firebase
```

**AFTER:**
```javascript
// Check 10 domains at a time
// Prevents timeout and rate limiting
// More stable execution
```

---

### **4. Job-Level Timeout**

**ADDED:**
```yaml
jobs:
  monitor:
    timeout-minutes: 5  # Kill job if exceeds 5 minutes
```

**Benefit:** Prevents runaway processes

---

## 📈 Current Performance (v3.9.9)

### **Actual Measured Performance:**

**Per Run:**
```
Setup Node.js: ~10 seconds
Install deps: ~15 seconds (firebase + node-fetch)
Check domains: ~2 minutes (313 domains with concurrency limit)
Total: ~2.4 minutes (143 seconds)

Note: Longer than expected due to large domain count
```

**Per Day (1 Hour Interval):**
```
24 runs × 2.4 minutes = 57.6 minutes/day
```

**Per Month:**
```
30 days × 57.6 minutes = 1,728 minutes
Usage: 86% of 2,000 minute quota ✅
Buffer: 272 minutes (14%)
```

---

## 🔍 How to Monitor

### **1. GitHub Actions Dashboard**

**URL:** https://github.com/[username]/[repo]/actions

**What to Check:**
- ✅ Recent runs status (should be green)
- ✅ Duration per run (~40-45 seconds)
- ✅ Success rate (should be >95%)
- ❌ Red runs = failed (check logs)

**Healthy Metrics:**
- Duration: 30-60 seconds ✅
- Success rate: >95% ✅
- No frequent failures ✅

---

### **2. Billing Dashboard**

**URL:** https://github.com/settings/billing

**What to Check:**
- Minutes used vs. included
- Usage chart (should be linear)
- Expected: ~48 min/day

**Calculation:**
```
Current month minutes / Days passed = Daily average

Example:
1,200 minutes used / 25 days = 48 min/day ✅
2,000 minutes used / 10 days = 200 min/day ❌ (Too high!)
```

---

### **3. App Health Dashboard**

**In-App Tab:** Statistics → GitHub Actions

**Metrics:**
- Last Run Time
- Duration (should be ~40-45s)
- Success Rate (30 days)
- Next Run Countdown

---

## 🚨 Troubleshooting

### **Problem: Still Exceeding Quota**

**Possible Causes:**

1. **Multiple Workflows Running:**
   ```bash
   # Check if other workflows exist:
   ls .github/workflows/
   
   # Should only have:
   # - monitor-domains.yml
   ```

2. **Manual Triggers:**
   ```
   Check Actions tab for manual triggers
   Each manual trigger counts against quota
   ```

3. **Failed Runs with Retry:**
   ```
   Check for red (failed) runs
   Failed runs still count against quota
   Failed + retry = 2x usage
   ```

4. **Multiple Branches:**
   ```yaml
   # Workflow might run on multiple branches
   # Check workflow file:
   on:
     push:
       branches: [main]  # Make sure limited to main only
   ```

---

### **Problem: Runs Taking Too Long**

**Check Logs for Bottlenecks:**

1. **Slow npm install:**
   ```
   Should see: "added 2 packages" (~15s)
   If more: Check if npm cache working
   ```

2. **Slow domain checks:**
   ```
   Each domain: <5 seconds
   If longer: Domains might be timing out
   Solution: Already has 5s timeout ✅
   ```

3. **Firebase writes slow:**
   ```
   Check Firebase Console for latency
   Consider reducing write frequency if needed
   ```

---

### **Quick Fixes:**

**1. Increase Check Interval (Last Resort):**
```yaml
# Change from 20 minutes to 30 minutes:
schedule:
  - cron: '*/30 * * * *'  # Was: '*/20 * * * *'

# Result:
48 runs/day instead of 72
32 min/day instead of 48 min/day
960 min/month instead of 1,440 min/month ✅
```

**2. Reduce Batch Size:**
```javascript
// If checking too many domains per batch
// Split into more batches (B1-B8 instead of B1-B4)
// Each batch smaller = faster execution
```

**3. Disable Monitoring Temporarily:**
```yaml
# Comment out schedule:
on:
  # schedule:
  #   - cron: '*/20 * * * *'
  workflow_dispatch:  # Keep manual trigger
```

---

## 📊 Cost Analysis

### **Free Tier Limits:**
- **2,000 minutes/month** for private repos
- **Unlimited** for public repos
- Additional: $0.008 per minute

### **Current Usage (Optimized):**
```
1,440 min/month (private repo)
Cost if public: $0 ✅
Cost if exceeded: $4.48 for extra 560 minutes
```

### **Alternative: Make Repo Public**
```
Pros:
✅ Unlimited GitHub Actions minutes
✅ No cost concerns

Cons:
❌ Code visible to everyone
❌ Secrets still safe (not exposed)
```

**To Make Public:**
1. Settings → General
2. Danger Zone → Change visibility
3. Type repo name to confirm

---

## ✅ Best Practices

1. **Monitor Weekly:**
   - Check billing dashboard every Monday
   - Expected: ~336 minutes per week

2. **Review Failed Runs:**
   - Fix issues causing failures
   - Each failure = wasted minutes

3. **Optimize When Needed:**
   - If approaching 1,800 min, increase interval
   - If under 1,000 min, could decrease interval

4. **Test Changes Carefully:**
   - Manual trigger to test before deploying
   - Don't spam manual triggers (costs minutes)

---

## 📝 Summary

**v3.9.8 Optimizations:**
- ✅ 80% reduction in execution time
- ✅ 1,440 min/month (was 7,560)
- ✅ 28% buffer remaining
- ✅ Sustainable 24/7 monitoring

**Next Steps:**
1. Monitor usage for 1 week
2. Verify ~48 min/day average
3. Adjust interval if needed
4. Profit! 🎉

---

**Last Updated:** 24 Januari 2026  
**Status:** ✅ Optimized & Sustainable
