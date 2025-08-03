const LLMService = require('./LLMService');
const logger = require('../utils/logger');

class EntityExtractionService {
    constructor() {
        // Define entity types to extract
        this.entityTypes = {
            nama: 'Customer name (Bapak/Ibu/Pak/Bu + name)',
            kota: 'Departure city',
            tanggal: 'Date or time period',
            jumlah_orang: 'Number of people/pilgrims',
            budget: 'Budget or price range',
            nomor_telepon: 'Phone number',
            tipe_paket: 'Package type preference (regular/VIP)',
            durasi: 'Duration preference (9 hari/12 hari)',
            masalah: 'Specific problem or complaint',
            pertanyaan_spesifik: 'Specific question asked'
        };
        
        // Common city names
        this.cities = [
            'jakarta', 'surabaya', 'bandung', 'medan', 'semarang',
            'yogyakarta', 'solo', 'malang', 'denpasar', 'makassar',
            'palembang', 'tangerang', 'bekasi', 'depok', 'bogor'
        ];
        
        // Cache for recent extractions
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    /**
     * Extract entities from message
     */
    async extractEntities(message, intent = null, useCache = true) {
        try {
            // Check cache first
            if (useCache) {
                const cached = this.getFromCache(message);
                if (cached) {
                    logger.info('Entity extraction cache hit');
                    return cached;
                }
            }
            
            // Try rule-based extraction first
            const ruleBasedEntities = this.extractWithRules(message);
            
            // If we got good results from rules, use them
            if (Object.keys(ruleBasedEntities).length >= 2) {
                logger.info('Using rule-based entity extraction');
                if (useCache) {
                    this.addToCache(message, ruleBasedEntities);
                }
                return ruleBasedEntities;
            }
            
            // Otherwise, use LLM for more complex extraction
            const entities = await this.extractWithLLM(message, intent);
            
            // Merge with rule-based results (rules take priority)
            const mergedEntities = { ...entities, ...ruleBasedEntities };
            
            // Add to cache
            if (useCache) {
                this.addToCache(message, mergedEntities);
            }
            
            logger.info('Entities extracted:', mergedEntities);
            
            return mergedEntities;
            
        } catch (error) {
            logger.error('Error extracting entities:', error);
            return {};
        }
    }
    
    /**
     * Rule-based entity extraction
     */
    extractWithRules(message) {
        const entities = {};
        const lowerMessage = message.toLowerCase();
        
        // Extract number of people
        const peopleMatch = lowerMessage.match(/(\d+)\s*(orang|pax|jamaah|jemaah|peserta)/i);
        if (peopleMatch) {
            entities.jumlah_orang = parseInt(peopleMatch[1]);
        }
        
        // Extract budget
        const budgetMatch = lowerMessage.match(/(?:rp\.?\s*)?(\d+(?:\.\d+)?)\s*(juta|jt|ribu|rb|m)/gi);
        if (budgetMatch) {
            const match = budgetMatch[0];
            let amount = parseFloat(match.match(/\d+(?:\.\d+)?/)[0]);
            if (match.includes('ribu') || match.includes('rb')) {
                amount = amount / 1000; // Convert to juta
            }
            entities.budget = `${amount}jt`;
        }
        
        // Extract dates
        const datePatterns = [
            /(\d{1,2})[\s\-\/](\w+)[\s\-\/]?(\d{2,4})?/i,
            /(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s*(\d{4})?/i,
            /(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\s*(\d{4})?/i
        ];
        
        for (const pattern of datePatterns) {
            const dateMatch = lowerMessage.match(pattern);
            if (dateMatch) {
                entities.tanggal = dateMatch[0];
                break;
            }
        }
        
        // Extract cities
        for (const city of this.cities) {
            if (lowerMessage.includes(city)) {
                entities.kota = city;
                break;
            }
        }
        
        // Extract duration
        const durationMatch = lowerMessage.match(/(\d+)\s*(hari|day|days)/i);
        if (durationMatch) {
            entities.durasi = `${durationMatch[1]} hari`;
        }
        
        // Extract package type
        if (lowerMessage.includes('vip') || lowerMessage.includes('eksekutif')) {
            entities.tipe_paket = 'VIP';
        } else if (lowerMessage.includes('reguler') || lowerMessage.includes('ekonomi')) {
            entities.tipe_paket = 'Regular';
        }
        
        // Extract phone number
        const phoneMatch = message.match(/(?:\+62|62|0)[\s-]?(?:\d{2,4})[\s-]?\d{3,4}[\s-]?\d{3,4}/);
        if (phoneMatch) {
            entities.nomor_telepon = phoneMatch[0].replace(/[\s-]/g, '');
        }
        
        // Extract names (Bapak/Ibu + name)
        const nameMatch = lowerMessage.match(/(?:bapak|ibu|pak|bu|bpk|sdr|sdri)\s+([a-z]+(?:\s+[a-z]+)?)/i);
        if (nameMatch) {
            entities.nama = nameMatch[0];
        }
        
        return entities;
    }
    
    /**
     * LLM-based entity extraction
     */
    async extractWithLLM(message, intent = null) {
        try {
            const entityList = Object.entries(this.entityTypes)
                .map(([key, desc]) => `- ${key}: ${desc}`)
                .join('\n');
            
            const prompt = `Extract entities from this Indonesian customer message about Umroh travel.
${intent ? `The message intent is: ${intent}` : ''}

Message: "${message}"

Entities to extract:
${entityList}

Rules:
1. Only extract entities that are explicitly mentioned
2. Use exact values from the message when possible
3. For names, include titles (Bapak/Ibu/Pak/Bu)
4. For cities, use lowercase
5. For dates, keep original format
6. Return empty object {} if no entities found

Respond in JSON format only:
{"entity_name": "value", ...}`;
            
            const llmResponse = await LLMService.generateResponse(message, null, prompt, {
                model: 'llama3.2:3b',
                temperature: 0.1,
                maxTokens: 300,
                stream: false
            });
            
            let entities;
            if (llmResponse.success && llmResponse.response) {
                try {
                    entities = JSON.parse(llmResponse.response);
                } catch (parseError) {
                    logger.error('Failed to parse entity extraction response:', llmResponse);
                    return {};
                }
            } else {
                logger.error('LLM failed to generate response:', llmResponse.error);
                return {};
            }
            
            // Validate and clean entities
            const validEntities = {};
            for (const [key, value] of Object.entries(entities)) {
                if (this.entityTypes[key] && value && value !== 'null' && value !== 'undefined') {
                    validEntities[key] = value;
                }
            }
            
            return validEntities;
            
        } catch (error) {
            logger.error('Error in LLM entity extraction:', error);
            return {};
        }
    }
    
    /**
     * Extract entities for specific intent
     */
    async extractForIntent(message, intent) {
        // Define required entities per intent
        const intentEntityMap = {
            inquiry_price: ['jumlah_orang', 'kota', 'budget', 'tipe_paket'],
            inquiry_schedule: ['tanggal', 'durasi', 'kota'],
            inquiry_document: ['nama', 'jumlah_orang'],
            booking_intent: ['nama', 'nomor_telepon', 'jumlah_orang', 'kota'],
            complaint: ['masalah', 'nama']
        };
        
        const requiredEntities = intentEntityMap[intent] || [];
        const entities = await this.extractEntities(message, intent);
        
        // Add missing indicator for required entities
        const result = { ...entities };
        for (const entity of requiredEntities) {
            if (!result[entity]) {
                result[`${entity}_missing`] = true;
            }
        }
        
        return result;
    }
    
    /**
     * Fill template variables from entities
     */
    prepareTemplateVariables(entities, additionalData = {}) {
        const now = new Date();
        
        const variables = {
            // From entities
            nama: entities.nama || additionalData.contactName || 'Bapak/Ibu',
            nomor: entities.nomor_telepon || additionalData.phoneNumber || '',
            kota: entities.kota || '',
            jumlah_orang: entities.jumlah_orang || '',
            budget: entities.budget || '',
            tanggal_request: entities.tanggal || '',
            
            // System generated
            tanggal: now.toLocaleDateString('id-ID'),
            waktu: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            hari: now.toLocaleDateString('id-ID', { weekday: 'long' }),
            
            // From additional data
            ...additionalData
        };
        
        // Clean empty values
        Object.keys(variables).forEach(key => {
            if (!variables[key]) {
                variables[key] = '';
            }
        });
        
        return variables;
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
        
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }
    
    addToCache(message, entities) {
        const key = this.normalizeMessage(message);
        this.cache.set(key, {
            data: entities,
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
        logger.info('Entity extraction cache cleared');
    }
}

module.exports = new EntityExtractionService();