const LLMService = require('./LLMService');
const logger = require('../utils/logger');

class IntentDetectionService {
    constructor() {
        // Define available intents
        this.intents = {
            greeting: 'Customer greeting or initial contact',
            inquiry_package: 'Asking about umroh packages or options',
            inquiry_price: 'Asking about pricing or costs',
            inquiry_schedule: 'Asking about departure dates or schedules',
            inquiry_document: 'Asking about required documents or requirements',
            inquiry_payment: 'Asking about payment methods or installments',
            inquiry_facility: 'Asking about hotel, flight, or other facilities',
            complaint: 'Expressing dissatisfaction or problems',
            booking_intent: 'Showing interest to book or register',
            general_question: 'General questions about umroh',
            thanks: 'Expressing gratitude or closing conversation',
            other: 'Other intents not categorized above'
        };
        
        // Cache for recent detections
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    /**
     * Detect intent from message
     */
    async detectIntent(message, useCache = true) {
        try {
            // Check cache first
            if (useCache) {
                const cached = this.getFromCache(message);
                if (cached) {
                    logger.info('Intent detection cache hit');
                    return cached;
                }
            }
            
            // Prepare intent list for prompt
            const intentList = Object.entries(this.intents)
                .map(([key, desc]) => `- ${key}: ${desc}`)
                .join('\n');
            
            const prompt = `You are an intent classifier for an Umroh travel agency WhatsApp bot.
Analyze this customer message and classify the intent.

Message: "${message}"

Available intents:
${intentList}

Rules:
1. Choose the MOST SPECIFIC intent that matches
2. If multiple intents apply, choose the primary one
3. Use "other" only if no intent matches well
4. Consider Indonesian language and Islamic greetings

Respond in JSON format only:
{"intent": "intent_name", "confidence": 0.0-1.0, "reason": "brief explanation"}`;
            
            logger.info('Detecting intent for message:', message.substring(0, 50) + '...');
            
            const llmResponse = await LLMService.generateResponse(message, null, prompt, {
                model: 'llama3.2:3b', // Use more stable model
                temperature: 0.1, // Low temperature for consistency
                maxTokens: 200,
                stream: false
            });
            
            let result;
            if (llmResponse.success && llmResponse.response) {
                try {
                    result = JSON.parse(llmResponse.response);
                } catch (parseError) {
                    logger.error('Failed to parse intent detection response:', llmResponse);
                    result = {
                        intent: 'other',
                        confidence: 0.5,
                        reason: 'Failed to parse AI response'
                    };
                }
            } else {
                logger.error('LLM failed to generate response:', llmResponse.error);
                result = {
                    intent: 'other',
                    confidence: 0.5,
                    reason: 'LLM error'
                };
            }
            
            // Validate result
            if (!result.intent || !this.intents[result.intent]) {
                result.intent = 'other';
            }
            
            if (!result.confidence || result.confidence < 0 || result.confidence > 1) {
                result.confidence = 0.7;
            }
            
            // Add to cache
            if (useCache) {
                this.addToCache(message, result);
            }
            
            logger.info(`Intent detected: ${result.intent} (confidence: ${result.confidence})`);
            
            return result;
            
        } catch (error) {
            logger.error('Error detecting intent:', error);
            return {
                intent: 'other',
                confidence: 0.5,
                reason: 'Error during detection',
                error: error.message
            };
        }
    }
    
    /**
     * Detect multiple possible intents
     */
    async detectMultipleIntents(message) {
        try {
            const intentList = Object.entries(this.intents)
                .map(([key, desc]) => `- ${key}: ${desc}`)
                .join('\n');
            
            const prompt = `Analyze this message and identify ALL relevant intents (can be multiple).

Message: "${message}"

Available intents:
${intentList}

Return all applicable intents with confidence scores.
Respond in JSON format only:
{"intents": [{"intent": "name", "confidence": 0.0-1.0}, ...], "primary": "main_intent"}`;
            
            const response = await LLMService.generateResponse(prompt, {
                model: 'llama3.2:1b',
                temperature: 0.1,
                format: 'json',
                stream: false
            });
            
            let result;
            try {
                result = JSON.parse(response);
            } catch (parseError) {
                logger.error('Failed to parse multi-intent response:', response);
                return {
                    intents: [{intent: 'other', confidence: 0.5}],
                    primary: 'other'
                };
            }
            
            return result;
            
        } catch (error) {
            logger.error('Error detecting multiple intents:', error);
            return {
                intents: [{intent: 'other', confidence: 0.5}],
                primary: 'other'
            };
        }
    }
    
    /**
     * Map intent to template category
     */
    mapIntentToCategory(intent) {
        const mapping = {
            greeting: 'greeting',
            inquiry_package: 'package',
            inquiry_price: 'package',
            inquiry_schedule: 'package',
            inquiry_document: 'document',
            inquiry_payment: 'faq',
            inquiry_facility: 'package',
            complaint: 'faq',
            booking_intent: 'followup',
            general_question: 'faq',
            thanks: 'followup',
            other: null
        };
        
        return mapping[intent] || null;
    }
    
    /**
     * Get suggested keywords based on intent
     */
    getSuggestedKeywords(intent) {
        const keywordMap = {
            greeting: ['assalamualaikum', 'selamat', 'halo', 'hi'],
            inquiry_package: ['paket', 'umroh', 'program', 'pilihan'],
            inquiry_price: ['harga', 'biaya', 'berapa', 'tarif'],
            inquiry_schedule: ['jadwal', 'keberangkatan', 'tanggal', 'bulan'],
            inquiry_document: ['dokumen', 'syarat', 'persyaratan', 'paspor'],
            inquiry_payment: ['bayar', 'cicil', 'transfer', 'dp'],
            inquiry_facility: ['hotel', 'pesawat', 'fasilitas', 'makan'],
            complaint: ['complain', 'keluhan', 'masalah', 'kecewa'],
            booking_intent: ['daftar', 'booking', 'pesan', 'ikut'],
            general_question: ['tanya', 'info', 'bagaimana', 'apakah'],
            thanks: ['terima kasih', 'makasih', 'jazakallah'],
            other: []
        };
        
        return keywordMap[intent] || [];
    }
    
    /**
     * Cache management
     */
    getFromCache(message) {
        const key = this.normalizeMessage(message);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        // Remove expired entry
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }
    
    addToCache(message, result) {
        const key = this.normalizeMessage(message);
        this.cache.set(key, {
            data: result,
            timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.cache.size > 1000) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    
    normalizeMessage(message) {
        return message.toLowerCase().trim().replace(/\s+/g, ' ');
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        logger.info('Intent detection cache cleared');
    }
    
    /**
     * Get intent statistics
     */
    getIntentStats() {
        return {
            availableIntents: Object.keys(this.intents).length,
            cacheSize: this.cache.size,
            intents: this.intents
        };
    }
}

module.exports = new IntentDetectionService();