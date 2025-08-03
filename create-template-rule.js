// create-template-rule.js
const { AutomationRule } = require('./backend/whatsapp/src/models');
const logger = require('./backend/whatsapp/src/utils/logger');

async function createTemplateRule() {
    try {
        // First check if rule already exists
        const existing = await AutomationRule.findOne({
            where: { name: 'Smart Template Response' }
        });
        
        if (existing) {
            console.log('⚠️  Template automation rule already exists');
            // Update the existing rule
            await existing.update({
                ruleType: 'template',
                triggerConditions: {
                    messageTypes: ['chat'],
                    useIntentDetection: true,
                    fallbackToLLM: true,
                    excludeGroups: false
                },
                actionType: 'template_response',
                actionData: {
                    useAI: true,
                    maxSentences: 15,
                    temperature: 0.7
                },
                priority: 100,
                isActive: true
            });
            console.log('✅ Template automation rule updated:', existing.name);
        } else {
            // Create new rule
            const rule = await AutomationRule.create({
                name: 'Smart Template Response',
                description: 'Intelligent template-based responses with AI fallback',
                ruleType: 'template',
                triggerConditions: {
                    messageTypes: ['chat'],
                    useIntentDetection: true,
                    fallbackToLLM: true,
                    excludeGroups: false
                },
                actionType: 'template_response',
                actionData: {
                    useAI: true,
                    maxSentences: 15,
                    temperature: 0.7
                },
                priority: 100,
                isActive: true
            });
            
            console.log('✅ Template automation rule created:', rule.name);
        }
        
        // Show all active rules
        const allRules = await AutomationRule.findAll({
            where: { isActive: true },
            order: [['priority', 'DESC']]
        });
        
        console.log('\n📋 Active Automation Rules:');
        allRules.forEach(rule => {
            console.log(`   - ${rule.name} (priority: ${rule.priority})`);
        });
        
    } catch (error) {
        console.error('❌ Error creating template rule:', error);
        logger.error('Failed to create template rule:', error);
    }
}

// Run the function
createTemplateRule().then(() => process.exit(0));