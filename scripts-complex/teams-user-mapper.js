#!/usr/bin/env node

/**
 * MS Teams User Mapper for AI-SDLC Framework v3.3.0
 * Maps GitHub handles to MS Teams user mentions for proper notifications
 * The Credit Pros - Development Team
 */

const fs = require("fs");
const path = require("path");

class TeamsUserMapper {
  constructor() {
    this.mappingFile = path.join(process.cwd(), ".teams-user-mapping.json");
    this.userMapping = this.loadUserMapping();
  }

  /**
   * Load user mapping from configuration file
   */
  loadUserMapping() {
    try {
      if (fs.existsSync(this.mappingFile)) {
        const mapping = JSON.parse(fs.readFileSync(this.mappingFile, "utf8"));
        console.log(
          `✅ Loaded user mapping for ${Object.keys(mapping.users || {}).length} users`
        );
        return mapping;
      }
    } catch (error) {
      console.warn("⚠️ Error loading user mapping:", error.message);
    }

    // Return default mapping structure
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      users: {},
      teams: {},
      aliases: {},
    };
  }

  /**
   * Save user mapping to configuration file
   */
  saveUserMapping() {
    try {
      this.userMapping.lastUpdated = new Date().toISOString();
      fs.writeFileSync(
        this.mappingFile,
        JSON.stringify(this.userMapping, null, 2)
      );
      console.log("✅ User mapping saved successfully");
      return true;
    } catch (error) {
      console.error("❌ Error saving user mapping:", error.message);
      return false;
    }
  }

  /**
   * Add or update user mapping
   */
  addUser(githubHandle, teamsInfo) {
    const {
      email, // user@thecreditpros.com
      displayName, // "John Doe"
      teamsId, // Optional: Teams user ID
      department, // "Engineering", "Security", "Compliance"
      role, // "Senior Developer", "Security Engineer"
      timezone = "America/New_York",
    } = teamsInfo;

    this.userMapping.users[githubHandle] = {
      email,
      displayName,
      teamsId,
      department,
      role,
      timezone,
      addedDate: new Date().toISOString(),
      lastNotified: null,
      notificationCount: 0,
    };

    console.log(
      `✅ Added mapping: ${githubHandle} → ${displayName} (${email})`
    );
    return this.saveUserMapping();
  }

  /**
   * Add team mapping for group notifications
   */
  addTeam(teamName, members, teamsChannelId = null) {
    this.userMapping.teams[teamName] = {
      members,
      teamsChannelId,
      description: `${teamName} team members`,
      addedDate: new Date().toISOString(),
    };

    console.log(
      `✅ Added team mapping: ${teamName} with ${members.length} members`
    );
    return this.saveUserMapping();
  }

  /**
   * Get MS Teams mention for GitHub user
   */
  getTeamsMention(githubHandle) {
    const user = this.userMapping.users[githubHandle];

    if (!user) {
      console.warn(
        `⚠️ No Teams mapping found for GitHub user: ${githubHandle}`
      );
      return `@${githubHandle}`; // Fallback to GitHub handle
    }

    // Update notification tracking
    user.lastNotified = new Date().toISOString();
    user.notificationCount = (user.notificationCount || 0) + 1;

    // Return Teams mention format
    if (user.teamsId) {
      return `<at>${user.displayName}</at>`;
    } else if (user.email) {
      return `@${user.email}`;
    } else {
      return `@${user.displayName}`;
    }
  }

  /**
   * Get team mentions for multiple users
   */
  getTeamMentions(githubHandles) {
    return githubHandles
      .map((handle) => this.getTeamsMention(handle))
      .join(", ");
  }

  /**
   * Get team members by department or role
   */
  getTeamByDepartment(department) {
    const teamMembers = Object.entries(this.userMapping.users)
      .filter(([_, user]) => user.department === department)
      .map(([githubHandle, user]) => ({
        githubHandle,
        teamsHandle: this.getTeamsMention(githubHandle),
        ...user,
      }));

    return teamMembers;
  }

  /**
   * Get appropriate team for failure type
   */
  getNotificationTeam(failureType, priority = "P1") {
    const teamMappings = {
      security: this.getTeamByDepartment("Security"),
      compliance: this.getTeamByDepartment("Compliance"),
      performance: this.getTeamByDepartment("Engineering").filter((u) =>
        u.role.includes("Frontend")
      ),
      testing: this.getTeamByDepartment("QA"),
      infrastructure: this.getTeamByDepartment("DevOps"),
    };

    const team =
      teamMappings[failureType] || this.getTeamByDepartment("Engineering");

    // For critical issues, include senior developers
    if (priority === "P0") {
      const seniors = this.getTeamByDepartment("Engineering").filter(
        (u) => u.role.includes("Senior") || u.role.includes("Lead")
      );
      return [...team, ...seniors];
    }

    return team;
  }

  /**
   * Generate user mapping template
   */
  generateMappingTemplate() {
    const template = {
      version: "1.0.0",
      description: "GitHub to MS Teams user mapping for AI-SDLC notifications",
      lastUpdated: new Date().toISOString(),
      users: {
        "nydamon": {
          email: "damon@thecreditpros.com",
          displayName: "Damon DeCrescenzo",
          teamsId: null,
          department: "Engineering",
          role: "CTO / Senior Developer",
          timezone: "America/New_York",
        },
        "john.doe": {
          email: "john.doe@thecreditpros.com",
          displayName: "John Doe",
          teamsId: null,
          department: "Engineering",
          role: "Senior Developer",
          timezone: "America/New_York",
        },
        "jane.smith": {
          email: "jane.smith@thecreditpros.com",
          displayName: "Jane Smith",
          teamsId: null,
          department: "Security",
          role: "Security Engineer",
          timezone: "America/New_York",
        },
      },
      teams: {
        "security-team": {
          members: ["jane.smith", "security.lead"],
          teamsChannelId: null,
          description: "Security and compliance team",
        },
        "frontend-team": {
          members: ["john.doe", "frontend.dev"],
          teamsChannelId: null,
          description: "Frontend development team",
        },
        "senior-devs": {
          members: ["nydamon", "senior.dev1", "senior.dev2"],
          teamsChannelId: null,
          description: "Senior developers for escalation",
        },
      },
      aliases: {
        damon: "nydamon",
        admin: "nydamon",
        security: "security-team",
        frontend: "frontend-team",
      },
    };

    fs.writeFileSync(this.mappingFile, JSON.stringify(template, null, 2));
    console.log(`✅ Generated user mapping template: ${this.mappingFile}`);
    console.log("📝 Please update with your actual team information");

    return template;
  }

  /**
   * Import users from CODEOWNERS file
   */
  importFromCodeowners() {
    const codeownersPath = path.join(process.cwd(), ".github", "CODEOWNERS");

    if (!fs.existsSync(codeownersPath)) {
      console.warn("⚠️ CODEOWNERS file not found");
      return false;
    }

    try {
      const codeowners = fs.readFileSync(codeownersPath, "utf8");
      const githubHandles = new Set();

      // Extract GitHub handles from CODEOWNERS
      const handleMatches = codeowners.match(/@[\w-]+/g);
      if (handleMatches) {
        handleMatches.forEach((handle) => {
          const cleanHandle = handle.replace("@", "");
          githubHandles.add(cleanHandle);
        });
      }

      // Add discovered users to mapping (with placeholder data)
      githubHandles.forEach((handle) => {
        if (!this.userMapping.users[handle]) {
          this.userMapping.users[handle] = {
            email: `${handle}@thecreditpros.com`,
            displayName: handle
              .replace(/[.-]/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            teamsId: null,
            department: "Engineering",
            role: "Developer",
            timezone: "America/New_York",
            importedFrom: "CODEOWNERS",
            needsUpdate: true,
          };
        }
      });

      console.log(`✅ Imported ${githubHandles.size} users from CODEOWNERS`);
      return this.saveUserMapping();
    } catch (error) {
      console.error("❌ Error importing from CODEOWNERS:", error.message);
      return false;
    }
  }

  /**
   * Validate user mapping completeness
   */
  validateMapping() {
    const users = Object.keys(this.userMapping.users);
    const issues = [];

    users.forEach((githubHandle) => {
      const user = this.userMapping.users[githubHandle];

      if (!user.email) {
        issues.push(`Missing email for ${githubHandle}`);
      }

      if (!user.displayName) {
        issues.push(`Missing display name for ${githubHandle}`);
      }

      if (user.needsUpdate) {
        issues.push(
          `User ${githubHandle} needs manual update (imported from CODEOWNERS)`
        );
      }
    });

    if (issues.length === 0) {
      console.log("✅ User mapping validation passed");
      return true;
    } else {
      console.log("⚠️ User mapping validation issues:");
      issues.forEach((issue) => console.log(`  - ${issue}`));
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const users = Object.values(this.userMapping.users);
    const stats = {
      totalUsers: users.length,
      totalNotifications: users.reduce(
        (sum, user) => sum + (user.notificationCount || 0),
        0
      ),
      mostNotified: users.sort(
        (a, b) => (b.notificationCount || 0) - (a.notificationCount || 0)
      )[0],
      departments: {},
    };

    // Group by department
    users.forEach((user) => {
      if (!stats.departments[user.department]) {
        stats.departments[user.department] = 0;
      }
      stats.departments[user.department]++;
    });

    return stats;
  }
}

// CLI Interface
async function main() {
  const mapper = new TeamsUserMapper();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case "init":
      mapper.generateMappingTemplate();
      break;

    case "add-user": {
      const [githubHandle, email, displayName, department, role] = args;
      if (!githubHandle || !email || !displayName) {
        console.error(
          "Usage: teams-user-mapper.js add-user <github-handle> <email> <display-name> [department] [role]"
        );
        process.exit(1);
      }
      mapper.addUser(githubHandle, {
        email,
        displayName,
        department: department || "Engineering",
        role: role || "Developer",
      });
      break;
    }

    case "add-team": {
      const [teamName, ...members] = args;
      if (!teamName || members.length === 0) {
        console.error(
          "Usage: teams-user-mapper.js add-team <team-name> <member1> <member2> ..."
        );
        process.exit(1);
      }
      mapper.addTeam(teamName, members);
      break;
    }

    case "import-codeowners":
      mapper.importFromCodeowners();
      break;

    case "validate":
      mapper.validateMapping();
      break;

    case "get-mention": {
      const [githubHandle] = args;
      if (!githubHandle) {
        console.error(
          "Usage: teams-user-mapper.js get-mention <github-handle>"
        );
        process.exit(1);
      }
      const mention = mapper.getTeamsMention(githubHandle);
      console.log(`GitHub: ${githubHandle} → Teams: ${mention}`);
      break;
    }

    case "get-team": {
      const [department] = args;
      if (!department) {
        console.error("Usage: teams-user-mapper.js get-team <department>");
        process.exit(1);
      }
      const team = mapper.getTeamByDepartment(department);
      console.log(`${department} team:`, team);
      break;
    }

    case "stats": {
      const stats = mapper.getNotificationStats();
      console.log("📊 Notification Statistics:");
      console.log(`  Total Users: ${stats.totalUsers}`);
      console.log(`  Total Notifications: ${stats.totalNotifications}`);
      console.log(
        `  Most Notified: ${stats.mostNotified?.displayName || "None"} (${stats.mostNotified?.notificationCount || 0})`
      );
      console.log("  Departments:", stats.departments);
      break;
    }

    case "list":
      console.log("👥 Current User Mappings:");
      Object.entries(mapper.userMapping.users).forEach(([github, user]) => {
        console.log(
          `  ${github} → ${user.displayName} (${user.email}) [${user.department}]`
        );
      });
      break;

    default:
      console.log("MS Teams User Mapper for AI-SDLC Framework");
      console.log("");
      console.log("Usage:");
      console.log(
        "  teams-user-mapper.js init                           - Generate mapping template"
      );
      console.log(
        "  teams-user-mapper.js add-user <github> <email> <name> [dept] [role] - Add user mapping"
      );
      console.log(
        "  teams-user-mapper.js add-team <team> <member1> <member2> ...       - Add team mapping"
      );
      console.log(
        "  teams-user-mapper.js import-codeowners              - Import from CODEOWNERS file"
      );
      console.log(
        "  teams-user-mapper.js validate                       - Validate mapping completeness"
      );
      console.log(
        "  teams-user-mapper.js get-mention <github-handle>    - Get Teams mention for user"
      );
      console.log(
        "  teams-user-mapper.js get-team <department>          - Get team members by department"
      );
      console.log(
        "  teams-user-mapper.js stats                          - Show notification statistics"
      );
      console.log(
        "  teams-user-mapper.js list                           - List all user mappings"
      );
      console.log("");
      console.log("Examples:");
      console.log(
        '  teams-user-mapper.js add-user nydamon damon@thecreditpros.com "Damon DeCrescenzo" Engineering CTO'
      );
      console.log(
        "  teams-user-mapper.js add-team security-team jane.smith security.lead"
      );
      console.log("  teams-user-mapper.js get-mention nydamon");
      console.log("");
      console.log("Configuration File: .teams-user-mapping.json");
      break;
  }
}

// Export for use as module
module.exports = TeamsUserMapper;

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
}
