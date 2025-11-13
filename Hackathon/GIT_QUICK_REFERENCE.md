# Git Quick Reference - DID Vault Project

Quick commands for working with this repository safely.

## ✅ Before First Commit

```bash
# Verify .gitignore is working
git status

# Should NOT see:
# - .env files
# - node_modules/
# - dist/ or build/
# - *.log files
```

## 🔍 Check What's Ignored

```bash
# Check if specific file is ignored
git check-ignore client/.env
git check-ignore issuer/.env
git check-ignore blockchain/.env

# List all ignored files
git status --ignored
```

## 📤 Safe Commit Process

```bash
# 1. Check status
git status

# 2. Add files (be selective!)
git add client/src/
git add issuer/index.js
git add blockchain/contracts/

# 3. Review what will be committed
git diff --cached

# 4. Commit
git commit -m "Your commit message"

# 5. Push
git push origin main
```

## ⚠️ If You Accidentally Committed Sensitive Files

### Remove .env file from Git

```bash
# Remove from Git but keep local file
git rm --cached client/.env
git rm --cached issuer/.env
git rm --cached blockchain/.env

# Commit the removal
git commit -m "Remove .env files from Git"

# Push
git push origin main
```

### Remove node_modules from Git

```bash
# Remove from Git
git rm -r --cached client/node_modules
git rm -r --cached issuer/node_modules
git rm -r --cached blockchain/node_modules

# Commit
git commit -m "Remove node_modules from Git"

# Push
git push origin main
```

### ⚠️ IMPORTANT: Rotate Exposed Credentials

If you committed credentials, they're in Git history. You MUST:

1. **Firebase**: Regenerate API keys in Firebase Console
2. **R2**: Regenerate access keys in Cloudflare
3. **Private Keys**: Generate new blockchain accounts
4. **Update** all `.env` files with new credentials

## 🚫 Files That Should NEVER Be Committed

```
❌ client/.env
❌ issuer/.env
❌ blockchain/.env
❌ */node_modules/
❌ client/dist/
❌ blockchain/artifacts/
❌ blockchain/cache/
❌ *.log
❌ deployed-address.json
```

## ✅ Files That SHOULD Be Committed

```
✅ client/src/**/*.jsx
✅ client/src/**/*.js
✅ client/src/**/*.css
✅ client/package.json
✅ client/.env.example
✅ issuer/**/*.js
✅ issuer/package.json
✅ issuer/.env.example
✅ blockchain/contracts/**/*.sol
✅ blockchain/scripts/**/*.js
✅ blockchain/package.json
✅ blockchain/.env.example
✅ *.md (documentation)
✅ .gitignore files
```

## 🔧 Useful Git Commands

### Check Repository Status
```bash
# See what's changed
git status

# See what's staged
git diff --cached

# See commit history
git log --oneline
```

### Undo Changes
```bash
# Undo unstaged changes to a file
git checkout -- <file>

# Unstage a file (keep changes)
git reset HEAD <file>

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - DANGEROUS!
git reset --hard HEAD~1
```

### Branch Management
```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# List branches
git branch -a

# Delete branch
git branch -d feature/old-feature
```

## 📋 Pre-Push Checklist

Before pushing to GitHub:

- [ ] Run `git status` - no .env files listed
- [ ] Run `git diff --cached` - review all changes
- [ ] No node_modules in commit
- [ ] No build artifacts (dist/, artifacts/)
- [ ] No log files
- [ ] Commit message is descriptive
- [ ] Code is tested locally

## 🆘 Emergency: Exposed Credentials

If you pushed credentials to GitHub:

### 1. Immediately Rotate All Credentials
```bash
# Firebase
- Go to Firebase Console
- Regenerate API keys
- Update client/.env

# Cloudflare R2
- Go to Cloudflare Dashboard
- Regenerate access keys
- Update issuer/.env

# Blockchain
- Generate new private keys
- Update blockchain/.env
```

### 2. Remove from Git History (Advanced)
```bash
# Use BFG Repo-Cleaner or git-filter-branch
# This rewrites history - coordinate with team!

# Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env files from history
java -jar bfg.jar --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (DANGEROUS - coordinate with team!)
git push --force
```

### 3. Notify Team
- Inform all team members
- Ensure everyone updates their credentials
- Review access logs for unauthorized access

## 📚 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [Oh Shit, Git!?!](https://ohshitgit.com/) - Fix common mistakes

## 🎯 Quick Tips

1. **Commit often** - Small, focused commits are better
2. **Write good messages** - Explain what and why
3. **Review before pushing** - Always check `git diff --cached`
4. **Use branches** - Keep main branch stable
5. **Pull before push** - Avoid merge conflicts
6. **Never commit secrets** - Use .env.example instead

---

**Remember**: Once something is pushed to GitHub, assume it's public forever. Always review before pushing!
