# Polymarket MCP Development Workflow

## 🚀 Quick Start

**Local development:**
```bash
npm run dev
# or
./dev.sh
```

Then open: **http://localhost:3000/inspector**

**Test in Claude:**
- Use production URL: `https://yj6o6e8aejso.deploy.mcp-use.com/mcp`
- Add to Claude web → Settings → Integrations → Add MCP server

---

## 📝 Development Workflow

### **1. Local Testing (Fast Iteration)**

```bash
# Start dev server with hot reload
npm run dev
```

**Features:**
- ✅ Auto-reload on file changes
- ✅ Inspector UI for testing tools/widgets
- ✅ No deployment wait time
- ✅ Instant feedback

**Test your tools:**
1. Open http://localhost:3000/inspector
2. Click on any tool (search_markets, trending_markets, view_market)
3. Fill in parameters and execute
4. See results and widgets instantly

### **2. Deploy to Production**

When you're confident with your changes:

```bash
# Commit your changes
git add .
git commit -m "Add new feature"
git push

# This automatically triggers deployment to:
# https://yj6o6e8aejso.deploy.mcp-use.com
```

**Or manually deploy:**
```bash
npm run deploy
```

---

## 🎯 Current Tools

1. **search_markets** - Search Polymarket markets by keyword
2. **trending_markets** - Get top trending markets
3. **view_market** - Interactive widget with YES/NO probabilities

---

## 🛠️ Making Changes

### Edit Server Code
```bash
# Add/modify tools
vim index.ts

# Changes auto-reload - refresh inspector to test
```

### Edit Widget
```bash
# Update widget UI
vim resources/market-view/widget.tsx

# Update widget props
vim resources/market-view/types.ts

# Hot reload applies automatically
```

### Add New Tool
```typescript
// In index.ts
server.tool(
  {
    name: "my_new_tool",
    description: "What this tool does",
    schema: z.object({
      param: z.string().describe("Parameter description"),
    }),
  },
  async ({ param }) => {
    // Your logic here
    return text(`Result: ${param}`);
  }
);
```

---

## 📦 Deployment Status

### **Production (Manufact Cloud)**
- **URL:** https://yj6o6e8aejso.deploy.mcp-use.com/mcp
- **Inspector:** https://yj6o6e8aejso.deploy.mcp-use.com/inspector
- **Auto-deploys:** On git push to main branch
- **Build time:** ~2-5 minutes (first time was longer)

### **Local (Development)**
- **URL:** http://localhost:3000/mcp
- **Inspector:** http://localhost:3000/inspector
- **Hot reload:** Instant

---

## 🐛 Troubleshooting

**Port 3000 in use?**
```bash
# Find and kill process
lsof -ti :3000 | xargs kill -9

# Then restart
npm run dev
```

**Widget not loading in inspector?**
- Check browser console for errors
- Try: `npm run build` to verify it compiles
- Restart dev server

**Changes not showing?**
- Hard refresh browser (Cmd+Shift+R)
- Check terminal for build errors
- Restart dev server

**Deployment taking too long?**
- First deployment: 5-10 minutes (installs dependencies)
- Subsequent deploys: 2-5 minutes (cached)
- Just use local dev for testing!

---

## 💡 Pro Tips

1. **Develop locally** - Use inspector for 99% of testing
2. **Deploy once confident** - Only push when features are ready
3. **Use production URL in Claude** - No need for tunnels
4. **Git commit often** - Auto-deploys keep production updated
5. **Check logs** - `npx @mcp-use/cli deployments get yj6o6e8aejso`

---

## 🎓 Resources

- **MCP Use Docs:** https://mcp-use.com/docs
- **Polymarket API:** https://gamma-api.polymarket.com
- **Local Inspector:** http://localhost:3000/inspector
- **Production Inspector:** https://yj6o6e8aejso.deploy.mcp-use.com/inspector
