/**
 * AI Model Router - Intelligent model selection for cost optimization
 * Implements 2025 best practices for multi-model AI strategy
 */

const fs = require('fs');
const path = require('path');

class AIModelRouter {
  constructor(configPath = './multi-model-strategy.json') {
    this.config = this.loadConfig(configPath);
    this.metrics = {
      totalRequests: 0,
      modelUsage: {},
      costs: {},
      successRates: {},
    };
  }

  loadConfig(configPath) {
    try {
      const configData = fs.readFileSync(path.resolve(configPath), 'utf8');
      return JSON.parse(configData).aiModelStrategy;
    } catch (error) {
      console.error('Failed to load AI model configuration:', error);
      throw error;
    }
  }

  /**
   * Select the optimal AI model for a given task
   * @param {string} task - The task description
   * @param {Object} context - Additional context for routing decision
   * @returns {Object} Selected model configuration
   */
  selectModel(task, context = {}) {
    const taskAnalysis = this.analyzeTask(task, context);
    const selectedModel = this.routeToModel(taskAnalysis);

    this.trackUsage(selectedModel.name, task);

    return {
      model: selectedModel,
      reasoning: taskAnalysis.reasoning,
      confidence: taskAnalysis.confidence,
    };
  }

  analyzeTask(task, context) {
    const analysis = {
      complexityScore: this.calculateComplexity(task, context),
      taskType: this.classifyTaskType(task),
      domainFactors: this.analyzeDomain(task, context),
      contextFactors: this.analyzeContext(context),
      reasoning: [],
      confidence: 0,
    };

    // Determine task classification
    if (this.isPlanningTask(task)) {
      analysis.classification = 'planning';
      analysis.reasoning.push('Task involves strategic planning or analysis');
      analysis.confidence = 0.9;
    } else if (
      analysis.complexityScore >= 7 ||
      this.isComplexTask(task, context)
    ) {
      analysis.classification = 'complex';
      analysis.reasoning.push(
        `High complexity score: ${analysis.complexityScore}`
      );
      analysis.confidence = 0.8;
    } else {
      analysis.classification = 'simple';
      analysis.reasoning.push('Standard task with established patterns');
      analysis.confidence = 0.85;
    }

    return analysis;
  }

  calculateComplexity(task, context) {
    let score = 0;

    // File count factor
    const fileCount = context.fileCount || 1;
    if (fileCount > 5) score += 3;
    else if (fileCount > 2) score += 1;

    // Task type complexity
    const complexKeywords = [
      'architecture',
      'refactor',
      'optimize',
      'security',
      'compliance',
      'performance',
      'integration',
      'migration',
    ];

    const taskLower = task.toLowerCase();
    complexKeywords.forEach((keyword) => {
      if (taskLower.includes(keyword)) score += 2;
    });

    // Domain complexity
    const domainKeywords = [
      'credit',
      'fcra',
      'facta',
      'compliance',
      'audit',
      'dispute',
      'financial',
      'pii',
      'encryption',
    ];

    domainKeywords.forEach((keyword) => {
      if (taskLower.includes(keyword)) score += 1;
    });

    // Context factors
    if (context.requiresComplianceReview) score += 3;
    if (context.affectsMultipleServices) score += 2;
    if (context.hasSecurityImplications) score += 2;

    return Math.min(score, 10); // Cap at 10
  }

  classifyTaskType(task) {
    const taskLower = task.toLowerCase();

    const taskTypes = {
      code_generation: ['create', 'implement', 'build', 'develop', 'generate'],
      test_creation: ['test', 'spec', 'coverage', 'unittest', 'e2e'],
      documentation: ['document', 'readme', 'guide', 'explain', 'comment'],
      debugging: ['debug', 'fix', 'error', 'bug', 'issue', 'troubleshoot'],
      refactoring: ['refactor', 'restructure', 'reorganize', 'optimize'],
      analysis: ['analyze', 'review', 'assess', 'evaluate', 'examine'],
    };

    for (const [type, keywords] of Object.entries(taskTypes)) {
      if (keywords.some((keyword) => taskLower.includes(keyword))) {
        return type;
      }
    }

    return 'general';
  }

  isPlanningTask(task) {
    const planningKeywords = [
      'plan',
      'strategy',
      'roadmap',
      'assessment',
      'analysis',
      'design',
      'architecture',
      'approach',
      'requirements',
      'specification',
      'breakdown',
      'estimate',
    ];

    const taskLower = task.toLowerCase();
    return planningKeywords.some((keyword) => taskLower.includes(keyword));
  }

  isComplexTask(task, context) {
    // Multi-file operations
    if (context.fileCount > 3) return true;

    // Compliance-related tasks
    if (context.requiresComplianceReview) return true;

    // Security-sensitive operations
    if (context.hasSecurityImplications) return true;

    // Complex domain logic
    const complexPatterns = [
      /credit\s+(score|report|analysis)/i,
      /dispute\s+(resolution|processing)/i,
      /compliance\s+(validation|review)/i,
      /security\s+(audit|review)/i,
      /performance\s+(optimization|analysis)/i,
    ];

    return complexPatterns.some((pattern) => pattern.test(task));
  }

  analyzeDomain(task, _context) {
    const domains = {
      financial: ['credit', 'score', 'report', 'financial', 'loan'],
      compliance: ['fcra', 'facta', 'compliance', 'audit', 'regulation'],
      security: ['security', 'encryption', 'pii', 'auth', 'privacy'],
      performance: ['performance', 'optimize', 'cache', 'memory', 'speed'],
    };

    const taskLower = task.toLowerCase();
    const detectedDomains = [];

    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some((keyword) => taskLower.includes(keyword))) {
        detectedDomains.push(domain);
      }
    }

    return detectedDomains;
  }

  analyzeContext(context) {
    const factors = {
      urgency: context.urgency || 'normal',
      userExperience: context.userExperience || 'intermediate',
      budget: context.budgetConstraint || false,
      quality: context.qualityRequirement || 'standard',
    };

    return factors;
  }

  routeToModel(analysis) {
    const { classification } = analysis;
    const models = this.config.models;

    // Route based on classification
    switch (classification) {
      case 'planning':
        return models.planning;
      case 'complex':
        return models.complex;
      case 'simple':
      default:
        return models.primary;
    }
  }

  /**
   * Get model configuration for API calls
   */
  getModelConfig(modelName) {
    return this.config.models[modelName] || this.config.models.primary;
  }

  /**
   * Check if model is available and within rate limits
   */
  async checkModelAvailability(modelName) {
    const model = this.config.models[modelName];
    if (!model) return false;

    // Check rate limits (simplified implementation)
    const currentUsage = this.metrics.modelUsage[modelName] || 0;
    const rateLimitPerMinute = model.rateLimits?.requestsPerMinute || Infinity;

    return currentUsage < rateLimitPerMinute;
  }

  /**
   * Track model usage for metrics and cost calculation
   */
  trackUsage(modelName, task, tokens = 0, success = true) {
    this.metrics.totalRequests++;

    if (!this.metrics.modelUsage[modelName]) {
      this.metrics.modelUsage[modelName] = 0;
      this.metrics.costs[modelName] = 0;
      this.metrics.successRates[modelName] = { total: 0, success: 0 };
    }

    this.metrics.modelUsage[modelName]++;

    // Calculate cost
    const model = this.config.models[modelName];
    if (model && model.costPerToken && tokens > 0) {
      this.metrics.costs[modelName] += tokens * model.costPerToken;
    }

    // Track success rate
    this.metrics.successRates[modelName].total++;
    if (success) {
      this.metrics.successRates[modelName].success++;
    }
  }

  /**
   * Get usage statistics and cost analysis
   */
  getMetrics() {
    const totalCost = Object.values(this.metrics.costs).reduce(
      (sum, cost) => sum + cost,
      0
    );

    const modelStats = {};
    for (const [modelName, usage] of Object.entries(this.metrics.modelUsage)) {
      const successRate = this.metrics.successRates[modelName];
      modelStats[modelName] = {
        usage,
        usagePercentage: ((usage / this.metrics.totalRequests) * 100).toFixed(
          2
        ),
        cost: this.metrics.costs[modelName] || 0,
        costPercentage: (
          ((this.metrics.costs[modelName] || 0) / totalCost) *
          100
        ).toFixed(2),
        successRate: ((successRate.success / successRate.total) * 100).toFixed(
          2
        ),
      };
    }

    return {
      totalRequests: this.metrics.totalRequests,
      totalCost: totalCost.toFixed(4),
      modelStats,
      estimatedMonthlyCost: (totalCost * 30).toFixed(2), // Rough monthly estimate
    };
  }

  /**
   * Optimize model selection based on historical performance
   */
  optimizeSelection() {
    const metrics = this.getMetrics();
    const recommendations = [];

    // Analyze cost efficiency
    for (const [modelName, stats] of Object.entries(metrics.modelStats)) {
      if (parseFloat(stats.successRate) < 80) {
        recommendations.push({
          type: 'performance',
          model: modelName,
          issue: 'Low success rate',
          suggestion: 'Consider routing more tasks to higher-accuracy model',
        });
      }

      if (parseFloat(stats.costPercentage) > 50 && modelName === 'complex') {
        recommendations.push({
          type: 'cost',
          model: modelName,
          issue: 'High cost contribution',
          suggestion:
            'Review task routing to ensure only complex tasks use this model',
        });
      }
    }

    return recommendations;
  }

  /**
   * Export configuration for Cline integration
   */
  exportClineConfig() {
    return {
      models: this.config.models,
      routing: this.config.routingStrategy,
      optimization: this.config.costOptimization,
      integration: this.config.integrationSettings.clineConfiguration,
    };
  }
}

// Factory function for easy instantiation
function createModelRouter(configPath) {
  return new AIModelRouter(configPath);
}

// Example usage and testing
if (require.main === module) {
  const router = createModelRouter();

  // Test different task types
  const testTasks = [
    'Create a React component for displaying credit scores',
    'Design the architecture for the new dispute resolution system',
    'Plan the implementation roadmap for FCRA compliance features',
    'Fix the bug in the credit report parsing logic',
    'Optimize the database queries for consumer search',
  ];

  console.log('AI Model Router Testing\n');

  testTasks.forEach((task, index) => {
    const result = router.selectModel(task, { fileCount: index + 1 });
    console.log(`Task ${index + 1}: ${task}`);
    console.log(`Selected Model: ${result.model.name}`);
    console.log(`Reasoning: ${result.reasoning.join(', ')}`);
    console.log(`Confidence: ${result.confidence}\n`);
  });

  // Display metrics
  console.log('Usage Metrics:');
  console.log(JSON.stringify(router.getMetrics(), null, 2));
}

module.exports = {
  AIModelRouter,
  createModelRouter,
};
