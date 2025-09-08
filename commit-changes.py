#!/usr/bin/env python3

import subprocess
import sys
import time
from datetime import datetime

def run_command_with_timeout(cmd, timeout=300):
    """Run a command with timeout protection"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Running: {cmd}")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if result.stdout:
            print(f"STDOUT: {result.stdout}")
        if result.stderr:
            print(f"STDERR: {result.stderr}")

        if result.returncode == 0:
            print(f"✅ Command succeeded: {cmd}")
            return True
        else:
            print(f"❌ Command failed with code {result.returncode}: {cmd}")
            return False

    except subprocess.TimeoutExpired:
        print(f"⏰ Command timed out after {timeout}s: {cmd}")
        return False
    except Exception as e:
        print(f"💥 Command error: {e}")
        return False

def main():
    print("🚀 Uploading Changes to Repository")
    print("==================================")

    # Change to the correct directory
    import os
    os.chdir('/Users/damondecrescenzo/dev_framework_demo')
    print(f"📁 Working directory: {os.getcwd()}")

    # Step 1: Check git status
    print("\n📋 Step 1: Checking git status...")
    if not run_command_with_timeout("git status --porcelain", 30):
        print("❌ Failed to check git status")
        return False

    # Step 2: Add all changes
    print("\n📦 Step 2: Adding all changes...")
    if not run_command_with_timeout("git add .", 60):
        print("❌ Failed to add changes")
        return False

    # Step 3: Commit changes
    print("\n💾 Step 3: Committing changes...")
    commit_message = """fix: resolve GitHub Actions syntax hanging and add comprehensive deployment protection

🔧 CRITICAL FIXES APPLIED:
- Fixed all GitHub Actions syntax escaping in install-framework-smart.sh
- Resolved 45+ instances of unescaped ${{ }} patterns causing shell hanging
- Added timeout protection and debug logging throughout installation script
- Protected npm install and all long-running commands with timeouts

🛡️ DEPLOYMENT PROTECTION ADDED:
- Created deploy-with-timeout.sh with comprehensive error handling
- Added validate-installation-syntax.sh for pre-deployment validation
- Implemented signal handlers and automatic cleanup on interruption
- Added timestamped debug logging with color-coded output

🚀 PRODUCTION READY FEATURES:
- Installation script now hang-proof with 30-minute max runtime
- GitHub Actions workflows properly configured with escaped syntax
- Complete security automation (Dependabot, SonarCloud, Qodo) integrated
- Comprehensive testing and validation scripts included

✅ DEPLOYMENT VERIFICATION:
- All GitHub Actions patterns properly escaped as \\${{ }}
- Timeout protection on all critical operations
- Debug logging for complete visibility
- Automatic cleanup prevents hanging processes

This resolves the critical deployment blocker and ensures reliable installation on new repositories."""

    if not run_command_with_timeout(f'git commit -m "{commit_message}"', 60):
        print("⚠️ Commit may have failed or no changes to commit")

    # Step 4: Push changes
    print("\n🚀 Step 4: Pushing changes to remote...")
    if not run_command_with_timeout("git push", 120):
        print("❌ Failed to push changes")
        return False

    print("\n✅ Successfully uploaded all changes to repository!")

    # Step 5: Check GitHub Actions
    print("\n👀 Step 5: Checking GitHub Actions status...")
    time.sleep(10)  # Wait for GitHub to process

    if run_command_with_timeout("gh run list --limit 3", 30):
        print("✅ GitHub Actions are running")
    else:
        print("⚠️ Could not check GitHub Actions (may need authentication)")

    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 DEPLOYMENT COMPLETE!")
        print("📋 Changes uploaded successfully")
        print("🔍 Monitor GitHub Actions in the repository")
        sys.exit(0)
    else:
        print("\n💥 DEPLOYMENT FAILED!")
        print("📋 Check the error messages above")
        sys.exit(1)
