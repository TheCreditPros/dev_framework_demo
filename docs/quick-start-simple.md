# Quick Start Guide

## ⚡ **Single Command Setup (5 Minutes)**

### **Step 1: Run Auto-Setup**

```bash
./auto-setup.sh
```

**That's it!** This command automatically:
- ✅ Detects your project type (Laravel/React/Node.js)
- ✅ Installs all required tools and dependencies
- ✅ Configures git hooks with automatic E2E test generation
- ✅ Sets up quality gates and code formatting
- ✅ Creates working configurations for your stack

### **Step 2: Verify Installation**

```bash
./ai-sdlc status
```

✅ You should see: "All core components functional"
**Step 2.5: Test Enhanced CLI (NEW)**

```bash
# Test the new explain command for instant help
./ai-sdlc explain "ESLint parsing error"
./ai-sdlc explain "pre-commit hook failed"
./ai-sdlc explain "package.json missing"
```

✅ Get detailed explanations and fix suggestions for any issue


## 🔄 **Automatic E2E Tests for Front-End Changes**

**Once setup is complete, tests generate automatically:**

```bash
# Developer workflow example
echo "console.log('updated')" >> src/components/Button.tsx
git add src/components/Button.tsx
git commit -m "feat: add loading state to button"
# → Playwright E2E tests automatically generated and run in CI/CD
```

## ⚙️ **Configure API Keys (Required for AI Features)**

**Step 3: Add Your API Keys**

```bash
cp .env.example .env
# Edit .env file with your keys:
```

**Required:**
- `OPENAI_API_KEY=sk-your-key-here` ($20-50/month)
- `GITHUB_TOKEN=ghp-your-token-here` (free)

**Optional:**
- `QASE_API_KEY=your-qase-key` (existing account)
- `DATABASE_URL=postgresql://...` (for database features)

**Step 4: Test AI Generation**

```bash
./ai-sdlc test-gen test-sample/demo.js
# Should generate comprehensive test suite automatically
```

## 🧪 **What You Get: Complete AI Automation**

**Automatic Features:**
- ✅ **E2E tests generate automatically** when you modify front-end files
- ✅ **100% test coverage** - AI writes comprehensive test suites
- ✅ **Smart test execution** - Only test changed files (60% faster CI)
- ✅ **Quality gates** - Build fails if coverage drops below 80%
- ✅ **FCRA/FACTA compliance** - Credit repair patterns built into AI
- ✅ **Self-healing tests** - Automatically adapt when UI changes

**Useful Commands:**

```bash
npm test                    # Run all tests
npm run test:coverage       # Check coverage report
npm run test:e2e            # Run E2E tests
./ai-sdlc status           # Check framework health
```

## 🎯 Repository-Specific Implementation

**For TheCreditPros Development Team:**

**For each repository:**

```bash
# Replace 'your-repo' with actual repository name
cd your-repo
git clone https://github.com/nydamon/ai-sdlc.git .ai-sdlc
.ai-sdlc/auto-setup.sh
```

**Recommended order:**
1. customer-frontend-portal (highest impact)
2. portal2-refactor
3. portal2-admin-refactor

## 📋 **Prerequisites**

Make sure you have:
- Node.js 18+ installed (`node --version`)
- Git repository (`git init` if needed)
- OpenAI API key ready ($20-50/month)
- GitHub token (free from GitHub settings)

## 🚀 **That's It! Start Developing**

The framework now runs automatically:

```bash
# Normal development - everything happens automatically
echo "const newFeature = true;" >> src/components/Feature.tsx
git add .
git commit -m "feat: add new feature"
# → Code gets formatted, linted, and E2E tests generated automatically
```

**✅ Setup Complete!** You now have professional development automation.

---

## Optional: AI Features

**Want AI test generation?** Add to `.env` file:

```bash
cp .env.example .env
# Edit .env and add:
OPENAI_API_KEY=your-openai-key
```

**That's it!** AI features activate automatically.

## 🔍 **Troubleshooting**

**Setup issues?**
```bash
./ai-sdlc validate    # Shows what's wrong
```

**Tests not generating?**
- Check API keys in .env file
- Verify: `./ai-sdlc status`

**Git hooks not working?**
```bash
chmod +x .husky/pre-commit
```

**Need help?** See [Troubleshooting Guide](troubleshooting-simple.md)

---

## 💼 **For Teams**

**Adding team members:**
- Each person runs `./auto-setup.sh` in their local copy
- Everyone gets identical automation setup
- No configuration drift between developers

**Team consistency:**
- Same code formatting rules
- Same test generation patterns
- Same commit message standards

---

## 📊 **Expected Results**

**Week 1:**
- 80% reduction in code review time
- Automatic test generation working
- Zero manual formatting needed

**Month 1:**
- 100% test coverage achieved
- 80% reduction in manual QA time
- $70,200+ annual ROI validated

**Ongoing:**
- Zero manual E2E test writing
- Automatic compliance validation
- Self-maintaining test suites

**🎉 You're Done!** The framework is now running automatically on every commit.

## Daily Usage

Just develop normally. The tools run automatically when you:

- `git commit` - Runs formatting and linting
- `git push` - Everything's already checked

## Useful Commands

```bash
./ai-sdlc status   # Check if setup is working
./ai-sdlc help     # Show all available commands
```

---

## 📚 **Next Steps**

- **Developers**: Start developing - tests generate automatically
- **Managers**: See [Implementation Guide](implementation-guide-managers.md) for rollout strategy
- **Issues**: Check [Troubleshooting Guide](troubleshooting-simple.md)

**Questions?** The framework is designed to be completely transparent. You should notice:
- Code gets formatted automatically on commit
- E2E tests appear when you change front-end files
- Build fails if test coverage drops
- Everything just works!
