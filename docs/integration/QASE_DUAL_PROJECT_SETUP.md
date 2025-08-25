# Qase Dual Project Setup Guide - AI-SDLC v2.8.1

## 🎯 Overview

The AI-SDLC framework now supports **dual Qase project configuration** to properly separate testing concerns between customer-facing and internal admin systems.

## 📋 Project Configuration

### **TCP Project - Client Frontend (Customer-Facing)**
- **Project Code**: `TCP` (TheCreditPros Client)
- **URL**: https://app.qase.io/project/TCP
- **Purpose**: Customer frontend portal testing, user experience validation
- **Test Types**: User journeys, credit dispute flows, customer onboarding, payment processing
- **Priority**: High (customer impact)

### **PCU Project - Admin Frontend (Internal)**
- **Project Code**: `PCU` (Portal Control Unit)
- **URL**: https://app.qase.io/project/PCU
- **Purpose**: Admin dashboard testing, internal workflow validation
- **Test Types**: Admin operations, reporting, user management, system configuration
- **Priority**: Medium (internal efficiency)

## ⚙️ Environment Configuration

### **Required Environment Variables**

```bash
# Qase API Token (shared across both projects)
QASE_API_KEY=your-qase-api-token-here

# Client Frontend Project (Customer Portal)
QASE_CLIENT_PROJECT_CODE=TCP

# Admin Frontend Project (Internal Dashboard)  
QASE_ADMIN_PROJECT_CODE=PCU

# Default project for backward compatibility
QASE_PROJECT_CODE=TCP

# Target project for AI test generation
QASE_TARGET_PROJECT=TCP

# Enable dual project mode (optional)
QASE_DUAL_PROJECT_MODE=false
```

### **Project-Specific Test Generation**

```bash
# Generate tests for client frontend (default)
./ai-sdlc generate-from-requirements "User login flow" --project=TCP

# Generate tests for admin frontend
./ai-sdlc generate-from-requirements "Admin user management" --project=PCU

# Generate tests for both projects
QASE_DUAL_PROJECT_MODE=true ./ai-sdlc test-gen all
```

## 🔄 Workflow Integration

### **Development Team Usage**

**Frontend Developers (Client):**
```bash
# Set default to client project
export QASE_TARGET_PROJECT=TCP

# Generate customer-facing tests
./ai-sdlc generate-from-requirements "Credit score display validation"
./ai-sdlc generate-from-requirements "Dispute submission form"
```

**Frontend Developers (Admin):**
```bash
# Set default to admin project
export QASE_TARGET_PROJECT=PCU

# Generate admin-specific tests
./ai-sdlc generate-from-requirements "User analytics dashboard"
./ai-sdlc generate-from-requirements "System configuration panel"
```

### **QA Team Usage**

**Client Frontend QA:**
```bash
# Focus on customer experience
QASE_TARGET_PROJECT=TCP npm run test:e2e
./ai-sdlc generate-from-requirements "Complete credit repair onboarding flow" --project=TCP
```

**Admin Frontend QA:**
```bash
# Focus on internal operations
QASE_TARGET_PROJECT=PCU npm run test:e2e
./ai-sdlc generate-from-requirements "Admin dispute resolution workflow" --project=PCU
```

## 📊 Test Organization Strategy

### **TCP Project (Client) Test Categories**

1. **User Authentication & Onboarding**
   - Registration flow
   - Login/logout functionality
   - Password recovery
   - Profile setup

2. **Credit Monitoring Features**
   - Credit score display
   - Credit report viewing
   - Alert notifications
   - Score tracking

3. **Dispute Management**
   - Dispute submission
   - Document upload
   - Progress tracking
   - Communication with support

4. **Payment & Billing**
   - Payment processing
   - Subscription management
   - Billing history
   - Plan upgrades

### **PCU Project (Admin) Test Categories**

1. **User Management**
   - Admin login/permissions
   - Customer account management
   - User role assignment
   - Account suspension/activation

2. **Analytics & Reporting**
   - Dashboard metrics
   - Customer analytics
   - Performance reports
   - Export functionality

3. **System Configuration**
   - Settings management
   - API configuration
   - Feature flags
   - System maintenance

4. **Content Management**
   - Content updates
   - Template management
   - Communication settings
   - Legal document updates

## 🛠️ Implementation Steps

### **Step 1: Update Environment Configuration**

1. Update `.env` file with dual project variables
2. Verify Qase API token has access to both projects
3. Test connection to both TCP and PCU projects

```bash
# Test TCP project connection
./ai-sdlc doctor --project=TCP

# Test PCU project connection  
./ai-sdlc doctor --project=PCU
```

### **Step 2: Configure Team Workflows**

1. **Development Teams**: Set `QASE_TARGET_PROJECT` based on focus area
2. **QA Teams**: Use project-specific test generation commands
3. **Implementation Manager**: Monitor both projects for completeness

### **Step 3: Generate Project-Specific Tests**

```bash
# Initialize both projects
./ai-sdlc test-init --project=TCP
./ai-sdlc test-init --project=PCU

# Generate baseline test suites
./ai-sdlc test-gen all --project=TCP
./ai-sdlc test-gen all --project=PCU
```

### **Step 4: Validate Dual Configuration**

```bash
# Check configuration
./ai-sdlc status --verbose

# Expected output:
# ✅ Qase TCP Project: Connected
# ✅ Qase PCU Project: Connected  
# ✅ Dual project mode: Ready
```

## 📋 Team Assignment Recommendations

### **TCP Project (Client) - Primary Owners**
- **Frontend Team Lead**: Overall client testing strategy
- **UX/UI Developer**: User experience test scenarios
- **Customer Success**: User journey validation
- **QA Engineer (Client)**: End-to-end customer flows

### **PCU Project (Admin) - Primary Owners**  
- **Backend Team Lead**: Admin functionality testing
- **Operations Manager**: Internal workflow validation
- **System Administrator**: Configuration and maintenance tests
- **QA Engineer (Admin)**: Internal operations testing

## 🔍 Monitoring & Analytics

### **Project-Specific Metrics**

**TCP Project Metrics:**
- Customer journey completion rates
- User experience test coverage
- Critical path validation
- Performance benchmarks

**PCU Project Metrics:**
- Admin operation success rates
- Internal workflow efficiency
- System configuration coverage
- Administrative task completion

### **Combined Reporting**

```bash
# Generate combined test report
./ai-sdlc report --projects=TCP,PCU

# Individual project reports
./ai-sdlc report --project=TCP --type=customer-facing
./ai-sdlc report --project=PCU --type=internal-operations
```

## 🚨 Important Considerations

### **Test Data Separation**

- **TCP Tests**: Use customer-like test data (anonymized)
- **PCU Tests**: Use admin/system test data (internal)
- **No Cross-Contamination**: Keep test data separate between projects

### **Access Control**

- **TCP Project**: Customer support, QA, frontend developers
- **PCU Project**: Admin developers, operations, system administrators
- **Manager Access**: Implementation managers have access to both

### **Cost Management**

- **API Usage**: Qase API calls distributed across both projects
- **Test Execution**: Monitor execution costs for each project separately
- **Resource Allocation**: Balance testing resources based on business priority

## ✅ Validation Checklist

- [ ] Both TCP and PCU projects accessible in Qase
- [ ] Environment variables configured correctly
- [ ] AI test generation working for both projects
- [ ] Team members assigned appropriate project access
- [ ] Project-specific test suites created
- [ ] Dual project workflows documented and trained

---

**🤖 Framework Integration**: Fully integrated with AI-SDLC v2.8.1  
**📊 Project Status**: TCP (Active), PCU (Active)  
**🔄 Update Frequency**: As needed based on testing requirements  
**👥 Responsible**: Implementation Manager + QA Team Leads

This dual project setup ensures proper separation of concerns while maintaining unified test management across both customer-facing and internal systems.