/**
 * Script to update group names from WAHA
 * Run: node update-group-names.js
 */

const { Contact } = require('./src/models');
const wahaService = require('./src/services/RealWAHAService');
const logger = require('./src/utils/logger');

async function updateGroupNames() {
    try {
        console.log('🔄 Updating group names from WAHA...\n');
        
        // Find all group contacts
        const groups = await Contact.findAll({
            where: { isGroup: true }
        });
        
        console.log(`Found ${groups.length} groups to update\n`);
        
        let updated = 0;
        
        for (const group of groups) {
            try {
                // Skip if already has a proper name
                if (group.name && !group.name.includes('-') && group.name !== group.phoneNumber) {
                    console.log(`✓ ${group.name} - Already has proper name`);
                    continue;
                }
                
                console.log(`Updating: ${group.phoneNumber} (${group.groupId})`);
                
                // Get group info from WAHA
                const groupInfo = await wahaService.getGroupInfo('default', group.groupId);
                
                if (groupInfo && (groupInfo.name || groupInfo.subject)) {
                    const newName = groupInfo.name || groupInfo.subject;
                    await group.update({
                        name: newName,
                        groupName: newName,
                        groupDescription: groupInfo.description || groupInfo.desc || group.groupDescription,
                        participantCount: groupInfo.participantCount || groupInfo.participants?.length || group.participantCount
                    });
                    
                    console.log(`✅ Updated to: ${newName}`);
                    updated++;
                } else {
                    console.log(`❌ Could not fetch group info`);
                }
                
            } catch (error) {
                console.error(`❌ Error updating group ${group.phoneNumber}:`, error.message);
            }
        }
        
        console.log(`\n✅ Updated ${updated} out of ${groups.length} groups`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

// Run the update
updateGroupNames();