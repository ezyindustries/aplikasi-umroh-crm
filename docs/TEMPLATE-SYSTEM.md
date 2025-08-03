# Template Management System Documentation

## Overview

The Template Management System is a powerful feature that enables the WhatsApp CRM to automatically respond to customer messages using pre-defined templates. This system is designed to handle 90% of customer interactions through templates while maintaining a personal touch.

## Key Features

### 1. Template-Based Auto-Reply
- **Smart Matching**: Automatically matches incoming messages with appropriate templates
- **Category Filtering**: Templates organized by categories (greeting, package, FAQ, etc.)
- **Keyword Detection**: Uses keywords to find the best matching template
- **Variable Substitution**: Dynamically replaces variables like {{nama}}, {{tanggal}}, etc.

### 2. Hybrid Approach (90% Template, 10% AI)
- **Template Priority**: System prioritizes template responses for consistency
- **AI Fallback**: Optional fallback to LLM when no template matches
- **Minimal AI Usage**: Reduces costs and ensures consistent responses

### 3. Template Management UI
- **Visual Editor**: Easy-to-use interface at `/template-manager.html`
- **Real-time Testing**: Test templates against sample messages
- **Performance Analytics**: Track usage and success rates
- **Import from History**: Extract templates from existing chat logs

## Architecture

### Database Schema

```sql
-- custom_templates table
CREATE TABLE custom_templates (
    id INTEGER PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    category ENUM('greeting', 'package', 'faq', 'followup', 'document'),
    template_content TEXT NOT NULL,
    variables JSON,
    keywords TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Components

1. **Backend**
   - `CustomTemplate` model: Core template functionality
   - `templateController`: API endpoints for CRUD operations
   - `AutomationEngine`: Integration with automation rules

2. **Frontend**
   - `template-manager.html`: Template management interface
   - `ai-automation.html`: Automation rules with template support

3. **Utilities**
   - `extract-templates.js`: Extract templates from chat history
   - `test-template-system.js`: Test suite for template functionality

## API Endpoints

### Template Management
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/test` - Test template with variables
- `POST /api/templates/match` - Find matching template for message
- `POST /api/templates/import` - Import templates from chat data

## Usage Guide

### 1. Creating Templates

Templates support dynamic variables using double curly braces:

```
Assalamualaikum {{nama}} 😊

Terima kasih telah menghubungi Vauza Tamma Abadi.
Hari ini {{hari}}, {{tanggal}} pukul {{waktu}}.

Ada yang bisa kami bantu?
```

Available variables:
- `{{nama}}` - Customer name
- `{{nomor}}` - Phone number
- `{{tanggal}}` - Current date
- `{{waktu}}` - Current time
- `{{hari}}` - Day of week
- `{{fase}}` - Customer phase
- `{{jumlah_orang}}` - Party size
- `{{kota_keberangkatan}}` - Departure city
- `{{budget}}` - Budget

### 2. Setting Up Automation Rules

1. Go to AI Automation page
2. Create new rule with type "Template Based"
3. Select template category (optional)
4. Enable "Fallback to AI" if desired
5. Save and activate the rule

### 3. Importing from Chat History

```bash
# Extract templates from existing chats
node extract-templates.js

# This will:
# 1. Analyze all chat files in /datasets
# 2. Extract frequently used CS responses
# 3. Categorize and normalize templates
# 4. Import to database
```

### 4. Testing Templates

```bash
# Run template system tests
node test-template-system.js
```

## Best Practices

### Template Design
1. **Keep it Personal**: Use customer name and appropriate greetings
2. **Be Concise**: Templates should be clear and to the point
3. **Use Emojis**: Match the CS team's communication style
4. **Include CTAs**: End with questions or next steps

### Keywords
1. **Be Specific**: Use exact keywords customers typically use
2. **Multiple Variations**: Include different ways to say the same thing
3. **Avoid Conflicts**: Ensure keywords don't overlap between templates

### Categories
- **greeting**: Welcome messages, initial contact
- **package**: Package information, pricing
- **faq**: Common questions and answers
- **followup**: Follow-up messages, closing
- **document**: Document requirements, procedures

## Performance Optimization

### Template Matching Algorithm
1. **Exact Keyword Match**: First priority to exact keyword matches
2. **Category Filter**: Narrow down by category if specified
3. **Priority Sorting**: Higher priority templates checked first
4. **Usage-Based**: Popular templates given preference

### Caching
- Templates are cached in memory for fast access
- Cache refreshes every 5 minutes
- Manual refresh available in UI

## Monitoring & Analytics

### Metrics Tracked
- **Usage Count**: How often each template is used
- **Success Rate**: Based on customer responses
- **Response Time**: Average time to match and send
- **Category Distribution**: Which categories are most used

### Dashboard Features
- Real-time usage statistics
- Template performance charts
- Category breakdown
- Conversion tracking

## Troubleshooting

### Common Issues

1. **No Template Match**
   - Check keywords are properly set
   - Verify template is active
   - Consider enabling AI fallback

2. **Wrong Template Selected**
   - Review keyword conflicts
   - Adjust template priorities
   - Refine category assignments

3. **Variables Not Replaced**
   - Ensure variable names match exactly
   - Check if data is available
   - Verify variable format {{variable}}

## Future Enhancements

1. **Multi-language Support**: Templates in multiple languages
2. **A/B Testing**: Test different template variations
3. **Smart Learning**: Learn from successful interactions
4. **Media Templates**: Support for images and documents
5. **Conditional Logic**: If-then logic within templates

## Security Considerations

1. **Data Privacy**: No sensitive data in templates
2. **Access Control**: Role-based template management
3. **Audit Trail**: Track all template changes
4. **Sanitization**: Prevent injection attacks

## Integration Examples

### With Automation Engine
```javascript
// AutomationEngine automatically uses templates
if (rule.ruleType === 'template') {
    const template = await CustomTemplate.findBestMatch(
        message.body, 
        rule.triggerConditions.templateCategory
    );
    
    if (template) {
        const response = template.fillTemplate(variables);
        await sendMessage(response);
    }
}
```

### Direct API Usage
```javascript
// Find and use template
const template = await fetch('/api/templates/match', {
    method: 'POST',
    body: JSON.stringify({ 
        message: 'Berapa harga paket umroh?',
        category: 'package' 
    })
});

const filled = await fetch('/api/templates/test', {
    method: 'POST',
    body: JSON.stringify({
        templateId: template.id,
        variables: { nama: 'Pak Ahmad' }
    })
});
```

## Conclusion

The Template Management System provides a robust, scalable solution for handling customer interactions while maintaining the personal touch that customers expect. By combining templates with optional AI fallback, the system achieves both efficiency and flexibility.