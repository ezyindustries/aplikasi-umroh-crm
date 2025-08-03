const axios = require('axios');
const logger = require('../utils/logger');

class AIController {
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    }

    // Check Ollama connection and get available models
    async checkConnection(req, res) {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`);
            res.json({
                success: true,
                connected: true,
                models: response.data.models || []
            });
        } catch (error) {
            logger.error('Ollama connection error:', error);
            res.json({
                success: false,
                connected: false,
                error: 'Failed to connect to Ollama'
            });
        }
    }

    // Stream chat response from Ollama
    async chat(req, res) {
        try {
            const { model, messages, options } = req.body;

            // Set headers for SSE (Server-Sent Events)
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Make request to Ollama
            const response = await axios({
                method: 'POST',
                url: `${this.ollamaUrl}/api/chat`,
                data: {
                    model: model || 'llama3.2',
                    messages: messages,
                    stream: true,
                    options: options || {}
                },
                responseType: 'stream'
            });

            // Forward the stream to client
            response.data.on('data', (chunk) => {
                res.write(`data: ${chunk}\n\n`);
            });

            response.data.on('end', () => {
                res.write('data: [DONE]\n\n');
                res.end();
            });

            response.data.on('error', (error) => {
                logger.error('Stream error:', error);
                res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
                res.end();
            });

        } catch (error) {
            logger.error('Chat error:', error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }

    // Generate completion (non-streaming)
    async generate(req, res) {
        try {
            const { model, prompt, options } = req.body;

            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: model || 'llama3.2',
                prompt: prompt,
                stream: false,
                options: options || {}
            });

            res.json({
                success: true,
                response: response.data.response,
                context: response.data.context,
                total_duration: response.data.total_duration,
                load_duration: response.data.load_duration,
                prompt_eval_duration: response.data.prompt_eval_duration,
                eval_duration: response.data.eval_duration,
                eval_count: response.data.eval_count
            });

        } catch (error) {
            logger.error('Generate error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get model information
    async getModelInfo(req, res) {
        try {
            const { model } = req.params;
            
            const response = await axios.post(`${this.ollamaUrl}/api/show`, {
                name: model
            });

            res.json({
                success: true,
                modelInfo: response.data
            });

        } catch (error) {
            logger.error('Model info error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Pull a new model
    async pullModel(req, res) {
        try {
            const { model } = req.body;

            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const response = await axios({
                method: 'POST',
                url: `${this.ollamaUrl}/api/pull`,
                data: {
                    name: model,
                    stream: true
                },
                responseType: 'stream'
            });

            // Forward the stream to client
            response.data.on('data', (chunk) => {
                res.write(`data: ${chunk}\n\n`);
            });

            response.data.on('end', () => {
                res.write('data: [DONE]\n\n');
                res.end();
            });

            response.data.on('error', (error) => {
                logger.error('Pull error:', error);
                res.write(`data: ${JSON.stringify({ error: 'Pull error' })}\n\n`);
                res.end();
            });

        } catch (error) {
            logger.error('Pull model error:', error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }

    // List running models
    async listRunningModels(req, res) {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/ps`);
            
            res.json({
                success: true,
                models: response.data.models || []
            });

        } catch (error) {
            logger.error('List running models error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new AIController();