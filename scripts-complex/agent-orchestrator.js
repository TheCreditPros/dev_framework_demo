#!/usr/bin/env node

/**
 * AI Agent Orchestration System
 * Intelligently routes tasks between MCP servers and Claude Code sub-agents
 * Optimizes for cost, performance, and domain expertise
 */

const { AIModelRouter } = require('../cline_config/model-router.js');
const fs = require('fs');

class AgentOrchestrator {
  constructor() {
    this.mcpServers = this.loadMCPConfig();
    this.subAgents = this.loadSubAgentsConfig();
    this.modelRouter = new AIModelRouter('./multi-model-strategy.json');

    this.agentCapabilities = this.mapAgentCapabilities();
    this.performanceMetrics = this.initializeMetrics();

    console.log(
      '🎭 Agent Orchestrator initialized with',
      Object.keys(this.mcpServers.servers).length,
      'MCP servers and',
      Object.keys(this.subAgents).length,
      'sub-agents'
    );
  }

  loadMCPConfig() {
    try {
      return JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
    } catch (error) {
      console.error('Failed to load MCP configuration:', error);
      return { servers: {} };
    }
  }

  loadSubAgentsConfig() {
    // Load Claude Code sub-agents configuration (to be created)
    const defaultConfig = {
      'code-reviewer': {
        domain: 'code_quality',
        complexity: 'medium',
        cost_tier: 'standard',
        specializations: ['security', 'fcra_compliance'],
      },
      'test-generator': {
        domain: 'testing',
        complexity: 'high',
        cost_tier: 'premium',
        specializations: ['credit_repair', 'e2e_automation'],
      },
      'documentation-writer': {
        domain: 'documentation',
        complexity: 'low',
        cost_tier: 'budget',
        specializations: ['technical_writing', 'api_docs'],
      },
      'architecture-planner': {
        domain: 'planning',
        complexity: 'high',
        cost_tier: 'premium',
        specializations: ['system_design', 'compliance_architecture'],
      },
      'security-auditor': {
        domain: 'security',
        complexity: 'high',
        cost_tier: 'premium',
        specializations: ['pii_protection', 'fcra_audit'],
      },
    };

    try {
      const configPath = './claude-code-sub-agents-config.json';
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Using default sub-agents configuration:', error.message);
    }

    return defaultConfig;
  }

  mapAgentCapabilities() {
    const capabilities = {
      mcp_servers: {},
      sub_agents: {},
      unified_routing: {},
    };

    // Map MCP server capabilities
    for (const [serverName, config] of Object.entries(
      this.mcpServers.servers
    )) {
      capabilities.mcp_servers[serverName] = {
        type: 'mcp_server',
        description: config.description,
        capabilities: config.capabilities || [],
        domain_expertise: this.extractDomainExpertise(config),
        performance_tier: this.assessPerformanceTier(config),
        cost_tier: 'infrastructure', // MCP servers are infrastructure cost
      };
    }

    // Map sub-agent capabilities
    for (const [agentName, config] of Object.entries(this.subAgents)) {
      capabilities.sub_agents[agentName] = {
        type: 'sub_agent',
        domain: config.domain,
        complexity: config.complexity,
        cost_tier: config.cost_tier,
        specializations: config.specializations || [],
        performance_tier: this.assessAgentPerformance(config),
      };
    }

    return capabilities;
  }

  extractDomainExpertise(mcpConfig) {
    const expertise = [];
    const description = mcpConfig.description.toLowerCase();

    if (description.includes('credit') || description.includes('fcra')) {
      expertise.push('credit_repair');
    }
    if (description.includes('test') || description.includes('playwright')) {
      expertise.push('testing');
    }
    if (description.includes('security') || description.includes('pii')) {
      expertise.push('security');
    }
    if (description.includes('database') || description.includes('postgres')) {
      expertise.push('database');
    }

    return expertise;
  }

  assessPerformanceTier(mcpConfig) {
    // Assess based on command complexity and resource requirements
    if (mcpConfig.command === 'npx') return 'standard';
    if (mcpConfig.command === 'node') return 'high';
    if (mcpConfig.command === 'bash') return 'medium';
    return 'standard';
  }

  assessAgentPerformance(agentConfig) {
    const complexityMap = {
      low: 'fast',
      medium: 'balanced',
      high: 'thorough',
    };
    return complexityMap[agentConfig.complexity] || 'balanced';
  }

  initializeMetrics() {
    return {
      total_requests: 0,
      mcp_usage: {},
      sub_agent_usage: {},
      cost_tracking: { mcp: 0, sub_agents: 0 },
      performance_tracking: { avg_response_time: 0, success_rate: 0 },
      routing_decisions: [],
    };
  }

  /**
   * Intelligent agent selection based on task analysis
   */
  async selectOptimalAgent(task, context = {}) {
    const taskAnalysis = await this.analyzeTask(task, context);
    const availableAgents = this.getAvailableAgents(taskAnalysis);
    const routingDecision = this.makeRoutingDecision(
      taskAnalysis,
      availableAgents
    );

    this.trackRoutingDecision(task, routingDecision);

    return {
      selected_agent: routingDecision.agent,
      agent_type: routingDecision.type,
      reasoning: routingDecision.reasoning,
      estimated_cost: routingDecision.estimated_cost,
      expected_performance: routingDecision.performance_prediction,
      fallback_options: routingDecision.fallbacks,
    };
  }

  async analyzeTask(task, context) {
    // Leverage existing model router for task analysis
    const modelAnalysis = this.modelRouter.selectModel(task, context);

    return {
      task_complexity: this.assessTaskComplexity(task, context),
      domain_requirements: this.identifyDomainRequirements(task),
      performance_requirements: this.assessPerformanceNeeds(task, context),
      cost_constraints: context.budget_constraint || 'standard',
      compliance_requirements: this.identifyComplianceNeeds(task),
      model_recommendation: modelAnalysis,
    };
  }

  assessTaskComplexity(task, context) {
    let complexity = 1;

    // File count impact
    if (context.fileCount > 5) complexity += 2;
    else if (context.fileCount > 2) complexity += 1;

    // Task type complexity
    const complexKeywords = [
      'architecture',
      'design',
      'refactor',
      'migrate',
      'security',
      'compliance',
      'optimization',
      'integration',
    ];

    const taskLower = task.toLowerCase();
    complexKeywords.forEach((keyword) => {
      if (taskLower.includes(keyword)) complexity += 1;
    });

    // Credit repair domain complexity
    if (taskLower.includes('credit') || taskLower.includes('fcra')) {
      complexity += 1;
    }

    return Math.min(complexity, 5); // Cap at 5
  }

  identifyDomainRequirements(task) {
    const domains = [];
    const taskLower = task.toLowerCase();

    const domainMap = {
      credit_repair: ['credit', 'score', 'report', 'dispute', 'fcra', 'facta'],
      testing: ['test', 'spec', 'coverage', 'e2e', 'unit', 'integration'],
      security: ['security', 'audit', 'pii', 'encrypt', 'compliance'],
      documentation: ['document', 'readme', 'guide', 'explain'],
      database: ['database', 'sql', 'postgres', 'schema', 'migration'],
      frontend: ['react', 'component', 'ui', 'interface', 'user'],
      backend: ['api', 'server', 'service', 'endpoint', 'backend'],
      devops: ['deploy', 'ci/cd', 'docker', 'build', 'pipeline'],
    };

    for (const [domain, keywords] of Object.entries(domainMap)) {
      if (keywords.some((keyword) => taskLower.includes(keyword))) {
        domains.push(domain);
      }
    }

    return domains;
  }

  assessPerformanceNeeds(task, context) {
    const urgency = context.urgency || 'normal';
    const quality = context.quality_requirement || 'standard';

    if (urgency === 'high' || quality === 'production') {
      return 'high_performance';
    } else if (urgency === 'low' || quality === 'draft') {
      return 'cost_optimized';
    }

    return 'balanced';
  }

  identifyComplianceNeeds(task) {
    const taskLower = task.toLowerCase();
    const compliance = [];

    if (taskLower.includes('fcra') || taskLower.includes('credit')) {
      compliance.push('fcra_compliance');
    }
    if (taskLower.includes('pii') || taskLower.includes('privacy')) {
      compliance.push('privacy_compliance');
    }
    if (taskLower.includes('security') || taskLower.includes('audit')) {
      compliance.push('security_compliance');
    }

    return compliance;
  }

  getAvailableAgents(taskAnalysis) {
    const available = {
      mcp_servers: [],
      sub_agents: [],
      hybrid_options: [],
    };

    // Filter MCP servers by domain expertise
    for (const [serverName, capabilities] of Object.entries(
      this.agentCapabilities.mcp_servers
    )) {
      const domainMatch = taskAnalysis.domain_requirements.some((domain) =>
        capabilities.domain_expertise.includes(domain)
      );

      if (domainMatch || capabilities.domain_expertise.length === 0) {
        available.mcp_servers.push({ name: serverName, ...capabilities });
      }
    }

    // Filter sub-agents by specialization
    for (const [agentName, capabilities] of Object.entries(
      this.agentCapabilities.sub_agents
    )) {
      const domainMatch = taskAnalysis.domain_requirements.includes(
        capabilities.domain
      );
      const specializationMatch = taskAnalysis.compliance_requirements.some(
        (req) => capabilities.specializations.includes(req)
      );

      if (domainMatch || specializationMatch) {
        available.sub_agents.push({ name: agentName, ...capabilities });
      }
    }

    // Identify hybrid opportunities
    if (available.mcp_servers.length > 0 && available.sub_agents.length > 0) {
      available.hybrid_options = this.identifyHybridOpportunities(
        available.mcp_servers,
        available.sub_agents,
        taskAnalysis
      );
    }

    return available;
  }

  identifyHybridOpportunities(mcpServers, subAgents, taskAnalysis) {
    const hybrid = [];

    // Example: Use MCP for infrastructure + Sub-agent for specialized logic
    if (taskAnalysis.task_complexity >= 3) {
      const infrastructureAgents = mcpServers.filter((s) =>
        [
          'postgresql_enhanced',
          'secure_filesystem',
          'github_integration',
        ].includes(s.name)
      );
      const logicAgents = subAgents.filter((a) =>
        ['code-reviewer', 'architecture-planner', 'security-auditor'].includes(
          a.name
        )
      );

      if (infrastructureAgents.length > 0 && logicAgents.length > 0) {
        hybrid.push({
          strategy: 'infrastructure_plus_logic',
          mcp_agent: infrastructureAgents[0],
          sub_agent: logicAgents[0],
          estimated_benefit:
            'Enhanced domain expertise with infrastructure integration',
        });
      }
    }

    return hybrid;
  }

  makeRoutingDecision(taskAnalysis, availableAgents) {
    const decisions = [];

    // Evaluate MCP server options
    availableAgents.mcp_servers.forEach((agent) => {
      decisions.push({
        agent: agent.name,
        type: 'mcp_server',
        score: this.scoreAgent(agent, taskAnalysis, 'mcp'),
        estimated_cost: this.estimateCost(agent, taskAnalysis, 'mcp'),
        performance_prediction: this.predictPerformance(agent, taskAnalysis),
        reasoning: [
          `MCP server with ${agent.domain_expertise.join(', ')} expertise`,
        ],
      });
    });

    // Evaluate sub-agent options
    availableAgents.sub_agents.forEach((agent) => {
      decisions.push({
        agent: agent.name,
        type: 'sub_agent',
        score: this.scoreAgent(agent, taskAnalysis, 'sub_agent'),
        estimated_cost: this.estimateCost(agent, taskAnalysis, 'sub_agent'),
        performance_prediction: this.predictPerformance(agent, taskAnalysis),
        reasoning: [
          `Sub-agent specialized in ${agent.domain} with ${agent.specializations.join(', ')} capabilities`,
        ],
      });
    });

    // Evaluate hybrid options
    availableAgents.hybrid_options.forEach((hybrid) => {
      decisions.push({
        agent: `${hybrid.mcp_agent.name} + ${hybrid.sub_agent.name}`,
        type: 'hybrid',
        score: this.scoreHybrid(hybrid, taskAnalysis),
        estimated_cost: this.estimateHybridCost(hybrid, taskAnalysis),
        performance_prediction: 'high',
        reasoning: [hybrid.estimated_benefit],
      });
    });

    // Sort by score and select best option
    decisions.sort((a, b) => b.score - a.score);
    const selected = decisions[0];

    // Add fallback options
    selected.fallbacks = decisions.slice(1, 3).map((d) => ({
      agent: d.agent,
      type: d.type,
      reason: 'Fallback option if primary agent fails',
    }));

    return selected;
  }

  scoreAgent(agent, taskAnalysis, type) {
    let score = 0;

    // Domain expertise match
    if (type === 'mcp_server') {
      const domainMatch = taskAnalysis.domain_requirements.filter((domain) =>
        agent.domain_expertise.includes(domain)
      ).length;
      score += domainMatch * 20;
    } else {
      if (taskAnalysis.domain_requirements.includes(agent.domain)) {
        score += 25;
      }
    }

    // Compliance requirements match
    if (agent.specializations) {
      const complianceMatch = taskAnalysis.compliance_requirements.filter(
        (req) => agent.specializations.includes(req)
      ).length;
      score += complianceMatch * 15;
    }

    // Performance requirements alignment
    const performanceAlignment = this.assessPerformanceAlignment(
      agent,
      taskAnalysis.performance_requirements
    );
    score += performanceAlignment * 10;

    // Cost efficiency
    const costEfficiency = this.assessCostEfficiency(agent, taskAnalysis);
    score += costEfficiency * 10;

    // Historical performance
    const historicalBonus = this.getHistoricalPerformanceBonus(agent.name);
    score += historicalBonus;

    return score;
  }

  scoreHybrid(hybrid, taskAnalysis) {
    const mcpScore = this.scoreAgent(
      hybrid.mcp_agent,
      taskAnalysis,
      'mcp_server'
    );
    const subScore = this.scoreAgent(
      hybrid.sub_agent,
      taskAnalysis,
      'sub_agent'
    );

    // Hybrid bonus for complex tasks
    const hybridBonus = taskAnalysis.task_complexity >= 3 ? 25 : 0;

    return (mcpScore + subScore) * 0.8 + hybridBonus; // 20% penalty for coordination overhead
  }

  assessPerformanceAlignment(agent, requirements) {
    const agentPerformance = agent.performance_tier;

    const alignmentMap = {
      high_performance: { high: 10, balanced: 7, fast: 8 },
      balanced: { high: 8, balanced: 10, fast: 8 },
      cost_optimized: { high: 5, balanced: 8, fast: 10 },
    };

    return alignmentMap[requirements]?.[agentPerformance] || 5;
  }

  assessCostEfficiency(agent, taskAnalysis) {
    const costTier = agent.cost_tier;
    const budgetConstraint = taskAnalysis.cost_constraints;

    const efficiencyMap = {
      standard: { budget: 7, standard: 10, premium: 8 },
      budget: { budget: 10, standard: 8, premium: 5 },
      premium: { budget: 3, standard: 7, premium: 10 },
      infrastructure: { budget: 8, standard: 9, premium: 9 },
    };

    return efficiencyMap[costTier]?.[budgetConstraint] || 5;
  }

  getHistoricalPerformanceBonus(agentName) {
    // Based on tracked metrics
    const usage =
      this.performanceMetrics.mcp_usage[agentName] ||
      this.performanceMetrics.sub_agent_usage[agentName];

    if (!usage) return 0;

    // Bonus for proven performers
    if (usage.success_rate > 0.9) return 10;
    if (usage.success_rate > 0.8) return 5;
    if (usage.success_rate < 0.6) return -5;

    return 0;
  }

  estimateCost(agent, taskAnalysis, _type) {
    const baseCosts = {
      infrastructure: 0.01, // MCP servers are mostly infrastructure
      budget: 0.05,
      standard: 0.1,
      premium: 0.25,
    };

    const baseCost = baseCosts[agent.cost_tier] || 0.1;
    const complexityMultiplier = 1 + taskAnalysis.task_complexity * 0.2;

    return (baseCost * complexityMultiplier).toFixed(4);
  }

  estimateHybridCost(hybrid, taskAnalysis) {
    const mcpCost = this.estimateCost(hybrid.mcp_agent, taskAnalysis, 'mcp');
    const subCost = this.estimateCost(
      hybrid.sub_agent,
      taskAnalysis,
      'sub_agent'
    );

    return (parseFloat(mcpCost) + parseFloat(subCost) + 0.02).toFixed(4); // +$0.02 coordination cost
  }

  predictPerformance(agent, taskAnalysis) {
    const performanceTier = agent.performance_tier;
    const taskComplexity = taskAnalysis.task_complexity;

    if (performanceTier === 'high' && taskComplexity <= 3) return 'excellent';
    if (performanceTier === 'balanced') return 'good';
    if (performanceTier === 'fast' && taskComplexity >= 4) return 'moderate';

    return 'good';
  }

  trackRoutingDecision(task, decision) {
    this.performanceMetrics.routing_decisions.push({
      timestamp: new Date().toISOString(),
      task_summary: task.substring(0, 100),
      selected_agent: decision.agent,
      agent_type: decision.type,
      score: decision.score,
      estimated_cost: decision.estimated_cost,
      reasoning: decision.reasoning[0],
    });

    // Keep only last 100 decisions
    if (this.performanceMetrics.routing_decisions.length > 100) {
      this.performanceMetrics.routing_decisions.shift();
    }
  }

  /**
   * Get orchestration metrics and optimization recommendations
   */
  getOrchestrationMetrics() {
    const recentDecisions =
      this.performanceMetrics.routing_decisions.slice(-20);

    return {
      total_orchestrated_requests: this.performanceMetrics.total_requests,
      agent_distribution: this.calculateAgentDistribution(recentDecisions),
      cost_analysis: this.calculateCostAnalysis(recentDecisions),
      performance_trends: this.calculatePerformanceTrends(recentDecisions),
      optimization_recommendations:
        this.generateOptimizationRecommendations(recentDecisions),
    };
  }

  calculateAgentDistribution(decisions) {
    const distribution = { mcp_servers: 0, sub_agents: 0, hybrid: 0 };

    decisions.forEach((decision) => {
      distribution[
        decision.agent_type === 'mcp_server'
          ? 'mcp_servers'
          : decision.agent_type === 'sub_agent'
            ? 'sub_agents'
            : 'hybrid'
      ]++;
    });

    return distribution;
  }

  calculateCostAnalysis(decisions) {
    const costs = decisions.map((d) => parseFloat(d.estimated_cost));
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);

    return {
      total_estimated_cost: totalCost.toFixed(4),
      average_cost_per_task: (totalCost / costs.length).toFixed(4),
      cost_trend:
        costs.length > 1
          ? costs[costs.length - 1] > costs[0]
            ? 'increasing'
            : 'decreasing'
          : 'stable',
    };
  }

  calculatePerformanceTrends(decisions) {
    return {
      routing_accuracy: decisions.length > 0 ? '95%' : 'No data', // Placeholder
      avg_decision_time: '150ms', // Placeholder
      fallback_usage_rate: '2%', // Placeholder
    };
  }

  generateOptimizationRecommendations(decisions) {
    const recommendations = [];

    // Analyze agent usage patterns
    const agentUsage = {};
    decisions.forEach((decision) => {
      agentUsage[decision.selected_agent] =
        (agentUsage[decision.selected_agent] || 0) + 1;
    });

    // Find underutilized agents
    const totalDecisions = decisions.length;
    for (const [agentName, usage] of Object.entries(agentUsage)) {
      const usagePercent = (usage / totalDecisions) * 100;

      if (usagePercent < 5 && totalDecisions > 10) {
        recommendations.push({
          type: 'underutilization',
          agent: agentName,
          suggestion: 'Consider reviewing agent capabilities or routing logic',
        });
      }

      if (usagePercent > 60) {
        recommendations.push({
          type: 'overutilization',
          agent: agentName,
          suggestion: 'Consider load balancing or adding similar agents',
        });
      }
    }

    return recommendations;
  }
}

// CLI usage
if (require.main === module) {
  const orchestrator = new AgentOrchestrator();

  const testTasks = [
    'Generate comprehensive tests for credit score calculation with FCRA compliance',
    'Review code for security vulnerabilities in PII handling',
    'Create documentation for the dispute resolution API',
    'Design the architecture for the new customer portal',
    'Debug the credit report parsing issue',
  ];

  console.log('\n🎭 Agent Orchestration Testing\n');

  testTasks.forEach(async (task, index) => {
    console.log(`\n--- Task ${index + 1} ---`);
    console.log(`Task: ${task}`);

    try {
      const result = await orchestrator.selectOptimalAgent(task, {
        fileCount: Math.floor(Math.random() * 6) + 1,
        urgency: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],
        budget_constraint: ['budget', 'standard', 'premium'][
          Math.floor(Math.random() * 3)
        ],
      });

      console.log(`Selected: ${result.selected_agent} (${result.agent_type})`);
      console.log(`Reasoning: ${result.reasoning.join(', ')}`);
      console.log(`Estimated Cost: $${result.estimated_cost}`);
      console.log(`Expected Performance: ${result.expected_performance}`);

      if (result.fallback_options.length > 0) {
        console.log(
          `Fallbacks: ${result.fallback_options.map((f) => f.agent).join(', ')}`
        );
      }
    } catch (error) {
      console.error(`Error processing task: ${error.message}`);
    }
  });

  // Display orchestration metrics after a delay
  global.setTimeout(() => {
    console.log('\n📊 Orchestration Metrics:');
    console.log(
      JSON.stringify(orchestrator.getOrchestrationMetrics(), null, 2)
    );
  }, 1000);
}

module.exports = AgentOrchestrator;
