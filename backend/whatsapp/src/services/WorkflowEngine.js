const { 
  WorkflowTemplate, 
  WorkflowStep, 
  WorkflowSession, 
  WorkflowVariable,
  Message,
  Contact
} = require('../models');
const logger = require('../utils/logger');
const LLMService = require('./LLMService');
const RealWAHAService = require('./RealWAHAService');
const SimpleMessageQueue = require('./SimpleMessageQueue');
const { Op } = require('sequelize');

class WorkflowEngine {
  constructor() {
    this.activeSessions = new Map(); // In-memory cache for active sessions
  }

  /**
   * Start a new workflow session
   */
  async startWorkflow(workflowId, customerPhone, triggerMessage = null) {
    try {
      // Check if customer already has an active session for this workflow
      const existingSession = await WorkflowSession.findOne({
        where: {
          workflowId,
          customerPhone,
          status: 'active'
        }
      });

      if (existingSession) {
        logger.info(`Resuming existing workflow session ${existingSession.id}`);
        return this.resumeSession(existingSession, triggerMessage);
      }

      // Load workflow with steps
      const workflow = await WorkflowTemplate.findByPk(workflowId, {
        include: [{
          model: WorkflowStep,
          as: 'steps',
          where: { isActive: true },
          order: [['stepOrder', 'ASC']]
        }]
      });

      if (!workflow || !workflow.isActive) {
        throw new Error('Workflow not found or inactive');
      }

      // Create new session
      const session = await WorkflowSession.create({
        workflowId,
        customerPhone,
        status: 'active',
        sessionData: {
          workflowName: workflow.name,
          triggerMessage: triggerMessage?.body
        }
      });

      // Cache session
      this.activeSessions.set(customerPhone, session);

      // Execute first step
      const firstStep = workflow.steps[0];
      if (firstStep) {
        await this.executeStep(session, firstStep);
      }

      return session;
    } catch (error) {
      logger.error('Error starting workflow:', error);
      throw error;
    }
  }

  /**
   * Process incoming message for workflow
   */
  async processMessage(customerPhone, message) {
    try {
      // Check for active session
      let session = this.activeSessions.get(customerPhone);
      
      if (!session) {
        session = await WorkflowSession.findOne({
          where: {
            customerPhone,
            status: 'active'
          },
          order: [['lastActivityAt', 'DESC']]
        });

        if (!session) {
          return null; // No active workflow
        }

        // Cache it
        this.activeSessions.set(customerPhone, session);
      }

      // Update last activity
      await session.update({ lastActivityAt: new Date() });

      // Get current step
      const currentStep = await WorkflowStep.findByPk(session.currentStepId);
      if (!currentStep) {
        logger.error('Current step not found for session:', session.id);
        return null;
      }

      // Process response based on step type
      const response = await this.processStepResponse(session, currentStep, message);
      
      // Determine next step
      const nextStepId = await this.determineNextStep(session, currentStep, response);
      
      if (nextStepId) {
        const nextStep = await WorkflowStep.findByPk(nextStepId);
        if (nextStep) {
          await this.executeStep(session, nextStep);
        }
      } else {
        // Workflow completed
        await this.completeWorkflow(session);
      }

      return session;
    } catch (error) {
      logger.error('Error processing workflow message:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow step
   */
  async executeStep(session, step) {
    try {
      logger.info(`Executing step ${step.id} (${step.stepType}) for session ${session.id}`);

      // Update current step
      await session.update({ currentStepId: step.id });

      // Add to step history
      const stepHistory = session.stepHistory || [];
      stepHistory.push({
        stepId: step.id,
        stepName: step.name,
        executedAt: new Date()
      });
      await session.update({ stepHistory });

      // Apply delay if configured
      if (step.delayBefore > 0) {
        await new Promise(resolve => setTimeout(resolve, step.delayBefore * 1000));
      }

      // Execute based on step type
      switch (step.stepType) {
        case 'template':
          await this.executeTemplateStep(session, step);
          break;
        case 'keyword':
          await this.executeKeywordStep(session, step);
          break;
        case 'ai_agent':
          await this.executeAIStep(session, step);
          break;
        case 'input':
          await this.executeInputStep(session, step);
          break;
        case 'conditional':
          await this.executeConditionalStep(session, step);
          break;
        case 'action':
          await this.executeActionStep(session, step);
          break;
        default:
          logger.warn(`Unknown step type: ${step.stepType}`);
      }

      // Check if step expects a response
      if (!this.stepExpectsResponse(step)) {
        // Auto-proceed to next step
        const nextStepId = step.defaultNextStep;
        if (nextStepId) {
          const nextStep = await WorkflowStep.findByPk(nextStepId);
          if (nextStep) {
            await this.executeStep(session, nextStep);
          }
        } else {
          await this.completeWorkflow(session);
        }
      }
    } catch (error) {
      logger.error('Error executing step:', error);
      await this.handleStepError(session, step, error);
    }
  }

  /**
   * Execute template step
   */
  async executeTemplateStep(session, step) {
    try {
      let message = step.templateText || step.config.text || '';
      
      // Replace variables
      message = await this.replaceVariables(message, session);

      // Send message
      await this.sendMessage(session.customerPhone, message, step.config.media);

      // If step has quick replies
      if (step.config.quickReplies) {
        // Format and send quick replies
        const buttons = step.config.quickReplies.map((reply, index) => ({
          id: `qr_${index}`,
          text: reply
        }));
        
        // Send as buttons message
        await this.sendButtonMessage(session.customerPhone, message, buttons);
      }
    } catch (error) {
      logger.error('Error executing template step:', error);
      throw error;
    }
  }

  /**
   * Execute keyword step
   */
  async executeKeywordStep(session, step) {
    try {
      const promptMessage = step.config.promptMessage || 'Please provide your response:';
      const processedMessage = await this.replaceVariables(promptMessage, session);
      
      await this.sendMessage(session.customerPhone, processedMessage);
      
      // Wait for response (handled by processMessage)
    } catch (error) {
      logger.error('Error executing keyword step:', error);
      throw error;
    }
  }

  /**
   * Execute AI step
   */
  async executeAIStep(session, step) {
    try {
      // Build context
      const context = await this.buildAIContext(session);
      
      // Get system prompt
      let systemPrompt = step.aiPrompt || step.config.systemPrompt || '';
      systemPrompt = await this.replaceVariables(systemPrompt, session);

      // Generate AI response
      const aiConfig = {
        ...step.aiConfig,
        ...step.config.aiConfig
      };

      const result = await LLMService.generateResponse(
        context.lastUserMessage || 'Start conversation',
        context,
        systemPrompt,
        aiConfig
      );

      if (result.success && result.response) {
        await this.sendMessage(session.customerPhone, result.response);
        
        // Save AI response as variable if configured
        if (step.saveToVariable) {
          await this.saveVariable(session, step.saveToVariable, result.response, 'string', step.id);
        }
      } else {
        throw new Error('AI generation failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('Error executing AI step:', error);
      throw error;
    }
  }

  /**
   * Execute input step
   */
  async executeInputStep(session, step) {
    try {
      const prompt = step.config.prompt || 'Please provide your input:';
      const processedPrompt = await this.replaceVariables(prompt, session);
      
      await this.sendMessage(session.customerPhone, processedPrompt);
      
      // Wait for response (handled by processMessage)
    } catch (error) {
      logger.error('Error executing input step:', error);
      throw error;
    }
  }

  /**
   * Execute conditional step
   */
  async executeConditionalStep(session, step) {
    try {
      // Evaluate conditions
      const nextStepId = await this.evaluateConditions(session, step.nextStepConditions);
      
      if (nextStepId) {
        const nextStep = await WorkflowStep.findByPk(nextStepId);
        if (nextStep) {
          await this.executeStep(session, nextStep);
        }
      } else if (step.defaultNextStep) {
        const defaultStep = await WorkflowStep.findByPk(step.defaultNextStep);
        if (defaultStep) {
          await this.executeStep(session, defaultStep);
        }
      } else {
        await this.completeWorkflow(session);
      }
    } catch (error) {
      logger.error('Error executing conditional step:', error);
      throw error;
    }
  }

  /**
   * Execute action step
   */
  async executeActionStep(session, step) {
    try {
      const action = step.config.action;
      
      switch (action) {
        case 'update_phase':
          await this.updateCustomerPhase(session, step.config.phase);
          break;
        case 'add_tag':
          await this.addCustomerTag(session, step.config.tag);
          break;
        case 'send_notification':
          await this.sendInternalNotification(session, step.config.notification);
          break;
        case 'create_task':
          await this.createTask(session, step.config.task);
          break;
        default:
          logger.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      logger.error('Error executing action step:', error);
      throw error;
    }
  }

  /**
   * Process step response
   */
  async processStepResponse(session, step, message) {
    try {
      const response = {
        raw: message.body,
        processed: message.body,
        matched: false,
        extractedValue: null
      };

      switch (step.stepType) {
        case 'keyword':
          // Check keyword match
          const keywords = step.keywords || step.config.keywords || [];
          const lowerMessage = message.body.toLowerCase();
          
          for (const keyword of keywords) {
            if (lowerMessage.includes(keyword.toLowerCase())) {
              response.matched = true;
              response.matchedKeyword = keyword;
              break;
            }
          }
          break;

        case 'input':
          // Validate input
          const validation = step.inputValidation || step.config.validation || {};
          response.isValid = await this.validateInput(message.body, step.inputType, validation);
          response.extractedValue = this.extractValue(message.body, step.inputType);
          break;
      }

      // Save to variable if configured
      if (step.saveToVariable && response.extractedValue !== null) {
        await this.saveVariable(session, step.saveToVariable, response.extractedValue, step.inputType || 'string', step.id);
      }

      return response;
    } catch (error) {
      logger.error('Error processing step response:', error);
      throw error;
    }
  }

  /**
   * Determine next step based on conditions
   */
  async determineNextStep(session, currentStep, response) {
    try {
      // Check conditions
      if (currentStep.nextStepConditions && currentStep.nextStepConditions.length > 0) {
        for (const condition of currentStep.nextStepConditions) {
          if (await this.evaluateCondition(session, condition, response)) {
            return condition.nextStepId;
          }
        }
      }

      // Return default next step
      return currentStep.defaultNextStep;
    } catch (error) {
      logger.error('Error determining next step:', error);
      return currentStep.defaultNextStep;
    }
  }

  /**
   * Evaluate condition
   */
  async evaluateCondition(session, condition, response) {
    try {
      switch (condition.type) {
        case 'keyword_match':
          return condition.keywords.some(k => 
            response.raw.toLowerCase().includes(k.toLowerCase())
          );
          
        case 'variable_equals':
          const varValue = await this.getVariable(session, condition.variable);
          return varValue == condition.value;
          
        case 'variable_contains':
          const varVal = await this.getVariable(session, condition.variable);
          return varVal && varVal.toString().toLowerCase().includes(condition.value.toLowerCase());
          
        case 'response_length':
          return this.evaluateNumericCondition(response.raw.length, condition.operator, condition.value);
          
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Helper methods
   */
  
  async replaceVariables(text, session) {
    try {
      const variables = await this.getAllVariables(session);
      let processed = text;

      // Replace {{variable}} patterns
      for (const [name, value] of Object.entries(variables)) {
        const pattern = new RegExp(`{{${name}}}`, 'g');
        processed = processed.replace(pattern, value);
      }

      // Add system variables
      processed = processed.replace(/{{customerPhone}}/g, session.customerPhone);
      processed = processed.replace(/{{sessionId}}/g, session.id);
      processed = processed.replace(/{{date}}/g, new Date().toLocaleDateString('id-ID'));
      processed = processed.replace(/{{time}}/g, new Date().toLocaleTimeString('id-ID'));

      return processed;
    } catch (error) {
      logger.error('Error replacing variables:', error);
      return text;
    }
  }

  async saveVariable(session, name, value, dataType = 'string', stepId = null) {
    try {
      await WorkflowVariable.upsert({
        sessionId: session.id,
        name,
        value: value.toString(),
        dataType,
        stepId
      });

      // Update session's collected variables cache
      const collectedVariables = session.collectedVariables || {};
      collectedVariables[name] = value;
      await session.update({ collectedVariables });
    } catch (error) {
      logger.error('Error saving variable:', error);
    }
  }

  async getVariable(session, name) {
    try {
      const variable = await WorkflowVariable.findOne({
        where: {
          sessionId: session.id,
          name
        }
      });

      return variable ? variable.value : null;
    } catch (error) {
      logger.error('Error getting variable:', error);
      return null;
    }
  }

  async getAllVariables(session) {
    try {
      const variables = await WorkflowVariable.findAll({
        where: { sessionId: session.id }
      });

      const varMap = {};
      variables.forEach(v => {
        varMap[v.name] = v.value;
      });

      return varMap;
    } catch (error) {
      logger.error('Error getting all variables:', error);
      return {};
    }
  }

  async sendMessage(phone, message, media = null) {
    try {
      await SimpleMessageQueue.addToQueue({
        to: phone,
        message,
        media,
        priority: 'high'
      });
    } catch (error) {
      logger.error('Error sending workflow message:', error);
    }
  }

  async sendButtonMessage(phone, message, buttons) {
    try {
      // This would need WAHA button message implementation
      await RealWAHAService.sendButtonMessage(phone, message, buttons);
    } catch (error) {
      logger.error('Error sending button message:', error);
      // Fallback to text with options
      const optionsText = buttons.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
      await this.sendMessage(phone, `${message}\n\n${optionsText}`);
    }
  }

  async completeWorkflow(session) {
    try {
      await session.update({
        status: 'completed',
        completedAt: new Date()
      });

      // Remove from cache
      this.activeSessions.delete(session.customerPhone);

      // Send completion message if configured
      const workflow = await WorkflowTemplate.findByPk(session.workflowId);
      if (workflow.settings.completionMessage) {
        const message = await this.replaceVariables(workflow.settings.completionMessage, session);
        await this.sendMessage(session.customerPhone, message);
      }
    } catch (error) {
      logger.error('Error completing workflow:', error);
    }
  }

  async handleStepError(session, step, error) {
    try {
      // Log error
      const errorLog = session.errorLog || [];
      errorLog.push({
        stepId: step.id,
        error: error.message,
        timestamp: new Date()
      });
      
      await session.update({
        errorLog,
        status: 'error'
      });

      // Send error message to user
      const errorMessage = step.config.errorMessage || 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.';
      await this.sendMessage(session.customerPhone, errorMessage);

      // Remove from cache
      this.activeSessions.delete(session.customerPhone);
    } catch (err) {
      logger.error('Error handling step error:', err);
    }
  }

  stepExpectsResponse(step) {
    return ['keyword', 'input', 'ai_agent'].includes(step.stepType);
  }

  evaluateNumericCondition(value, operator, target) {
    switch (operator) {
      case 'equals': return value == target;
      case 'greater': return value > target;
      case 'less': return value < target;
      case 'greaterOrEqual': return value >= target;
      case 'lessOrEqual': return value <= target;
      default: return false;
    }
  }

  validateInput(value, type, validation) {
    try {
      switch (type) {
        case 'number':
          const num = parseFloat(value);
          if (isNaN(num)) return false;
          if (validation.min && num < validation.min) return false;
          if (validation.max && num > validation.max) return false;
          return true;
          
        case 'text':
          if (validation.minLength && value.length < validation.minLength) return false;
          if (validation.maxLength && value.length > validation.maxLength) return false;
          if (validation.pattern && !new RegExp(validation.pattern).test(value)) return false;
          return true;
          
        case 'choice':
          return validation.choices && validation.choices.includes(value);
          
        case 'date':
          return !isNaN(Date.parse(value));
          
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }

  extractValue(value, type) {
    try {
      switch (type) {
        case 'number':
          return parseFloat(value);
        case 'date':
          return new Date(value).toISOString();
        default:
          return value;
      }
    } catch (error) {
      return value;
    }
  }

  async buildAIContext(session) {
    try {
      const variables = await this.getAllVariables(session);
      const stepHistory = session.stepHistory || [];
      
      // Get recent messages
      const recentMessages = await Message.findAll({
        where: {
          phoneNumber: session.customerPhone,
          createdAt: {
            [Op.gte]: session.startedAt
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      return {
        sessionId: session.id,
        variables,
        stepHistory,
        conversationHistory: recentMessages.reverse().map(m => ({
          fromMe: m.fromMe,
          body: m.body,
          timestamp: m.createdAt
        })),
        lastUserMessage: recentMessages.find(m => !m.fromMe)?.body
      };
    } catch (error) {
      logger.error('Error building AI context:', error);
      return {};
    }
  }

  // Placeholder methods for actions
  async updateCustomerPhase(session, phase) {
    logger.info(`Update customer ${session.customerPhone} to phase: ${phase}`);
  }

  async addCustomerTag(session, tag) {
    logger.info(`Add tag ${tag} to customer ${session.customerPhone}`);
  }

  async sendInternalNotification(session, notification) {
    logger.info(`Send notification: ${notification}`);
  }

  async createTask(session, task) {
    logger.info(`Create task: ${task}`);
  }
}

module.exports = new WorkflowEngine();