# 🚀 Integration Guide

## Step-by-Step Integration

### Step 1: Add Framework to Your Project

```bash
# Clone the framework
git clone https://github.com/TheCreditPros/dev_framework_demo.git temp-framework

# Copy essential files
cp -r temp-framework/.github ./
cp -r temp-framework/scripts ./
cp temp-framework/package.json temp-framework/package-lock.json ./
cp temp-framework/.* ./  # Copy config files

# Clean up
rm -rf temp-framework
```

### Step 2: Install Dependencies

```bash
# Install with framework dependencies
npm install

# Or use the smart installer
./install-framework-smart.sh
```

### Step 3: Configure Secrets

Add these to your GitHub repository secrets:

```
SONAR_TOKEN=your-sonarcloud-token
OPENAI_API_KEY=your-openai-key  # Optional, for enhanced AI features
```

### Step 4: Customize Configuration

Edit these key files:

- `package.json` - Update name, version, scripts
- `.pr_agent.toml` - Configure AI review preferences
- `sonar-project.properties` - Set project key and settings
- `.github/CODEOWNERS` - Define code review assignments

### Step 5: Test Integration

```bash
# Run setup
./scripts/bootstrap.sh

# Test quality gates
npm run quality-gates

# Create test PR
git checkout -b test-integration
echo "console.log('Integration test');" > test.js
git add . && git commit -m "test: verify integration"
git push origin test-integration
```

### Step 6: Verify Automation

Check that these work automatically:

- ✅ ESLint + Prettier run on commits
- ✅ Tests run in CI
- ✅ AI review comments appear on PRs
- ✅ SonarCloud analysis completes
- ✅ Security scans pass

## Configuration Files Reference

| File                       | Purpose          | Required    |
| -------------------------- | ---------------- | ----------- |
| `.github/workflows/`       | CI/CD automation | Yes         |
| `eslint.config.mjs`        | Code linting     | Yes         |
| `vitest.config.js`         | Testing          | Yes         |
| `.pr_agent.toml`           | AI reviews       | Yes         |
| `sonar-project.properties` | Code analysis    | Yes         |
| `.husky/`                  | Git hooks        | Yes         |
| `.editorconfig`            | Code formatting  | Recommended |

## Troubleshooting

### Common Issues

**Git hooks not working:**

```bash
rm -rf .husky/_
npm run prepare
```

**CI failures:**

```bash
npm run lint:fix
npm run format:fix
npm run type-check
```

**SonarCloud not analyzing:**

- Check SONAR_TOKEN is set
- Verify sonar-project.properties has correct project key

### Getting Help

- 📖 [Full Documentation](README.md)
- 🐛 [GitHub Issues](https://github.com/TheCreditPros/dev_framework_demo/issues)
- 💬 [GitHub Discussions](https://github.com/TheCreditPros/dev_framework_demo/discussions)

---

_See [Main README](../README.md) for quick setup overview_
