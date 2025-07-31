const axios = require('axios');
const { Contact, Conversation, sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
require('dotenv').config();

const WAHA_API_URL = process.env.WAHA_API_URL || 'http://localhost:3000';
const SESSION_ID = 'default';

async function getGroupInfoFromWAHA(groupId) {
    try {
        // Try to get group info from WAHA
        const response = await axios.get(`${WAHA_API_URL}/api/groups`, {
            params: {
                session: SESSION_ID,
                id: groupId
            }
        });

        if (response.data && response.data.data) {
            return response.data.data;
        }
    } catch (error) {
        // Try alternative endpoint
        try {
            const altResponse = await axios.get(`${WAHA_API_URL}/api/${SESSION_ID}/groups/${groupId}`);
            return altResponse.data;
        } catch (altError) {
            console.error(`Failed to get group info for ${groupId}:`, altError.message);
        }
    }
    return null;
}

async function fixGroupNames() {
    try {
        console.log('Starting to fix group names from WAHA...\n');

        // First, let's check if WAHA is accessible
        try {
            const sessionCheck = await axios.get(`${WAHA_API_URL}/api/sessions`);
            console.log('WAHA API is accessible');
            console.log(`Sessions found: ${JSON.stringify(sessionCheck.data, null, 2)}\n`);
        } catch (error) {
            console.error('Cannot connect to WAHA API. Make sure WAHA is running on port 3000');
            return;
        }

        // Get all groups from database
        const groups = await Contact.findAll({
            where: { isGroup: true }
        });

        console.log(`Found ${groups.length} groups in database\n`);

        // Get all groups from WAHA
        try {
            const wahaGroupsResponse = await axios.get(`${WAHA_API_URL}/api/${SESSION_ID}/groups`);
            const wahaGroups = wahaGroupsResponse.data;
            
            console.log(`Found ${wahaGroups.length} groups in WhatsApp\n`);

            // Create a map of group IDs to names
            const groupMap = {};
            wahaGroups.forEach(group => {
                const groupId = group.id._serialized || group.id;
                const groupName = group.name || group.subject || group.groupMetadata?.subject;
                groupMap[groupId] = groupName;
                console.log(`WhatsApp Group: ${groupId} => "${groupName}"`);
            });

            console.log('\n--- Updating Database ---\n');

            // Update each group in database
            for (const dbGroup of groups) {
                // Try different ways to get the group ID
                let groupId = dbGroup.metadata?.waGroupId || dbGroup.phoneNumber || dbGroup.groupId;
                
                // Clean up the group ID - extract just the numeric part if needed
                if (groupId && !groupId.includes('@')) {
                    // If it's just a number, add @g.us
                    groupId = `${groupId}@g.us`;
                }
                
                // Also try to match by the numeric part of the name
                if (!groupMap[groupId] && dbGroup.name) {
                    // If the name looks like a group ID, try to match it
                    const numericMatch = dbGroup.name.match(/(\d{15,})/);
                    if (numericMatch) {
                        const possibleId = `${numericMatch[1]}@g.us`;
                        if (groupMap[possibleId]) {
                            groupId = possibleId;
                        }
                    }
                }
                
                if (!groupId) {
                    console.log(`Skipping group ${dbGroup.id} - no group ID found`);
                    continue;
                }

                // Find matching group in WAHA data
                const wahaGroupName = groupMap[groupId];
                
                if (wahaGroupName && wahaGroupName !== dbGroup.name) {
                    console.log(`Updating: "${dbGroup.name}" => "${wahaGroupName}"`);
                    
                    await dbGroup.update({
                        name: wahaGroupName,
                        metadata: {
                            ...dbGroup.metadata,
                            groupName: wahaGroupName,
                            waGroupId: groupId,
                            lastUpdated: new Date()
                        }
                    });

                    // Also update conversations for this group
                    await Conversation.update(
                        {
                            metadata: sequelize.fn('json_set', 
                                sequelize.col('metadata'),
                                '$.groupName',
                                wahaGroupName
                            )
                        },
                        {
                            where: {
                                contactId: dbGroup.id,
                                isGroup: true
                            }
                        }
                    );
                } else if (wahaGroupName) {
                    console.log(`Group "${dbGroup.name}" already has correct name`);
                } else {
                    console.log(`No WhatsApp group found for ${groupId}`);
                }
            }

            console.log('\n--- Creating Missing Groups ---\n');

            // Create any missing groups
            const { Op } = require('sequelize');
            for (const [groupId, groupName] of Object.entries(groupMap)) {
                // Extract just the numeric part for searching
                const numericId = groupId.replace('@g.us', '');
                
                const existingGroup = await Contact.findOne({
                    where: {
                        [Op.or]: [
                            { phoneNumber: groupId },
                            { phoneNumber: numericId },
                            { groupId: groupId },
                            { groupId: numericId },
                            { name: { [Op.like]: `%${numericId}%` } }
                        ]
                    }
                });

                if (!existingGroup) {
                    console.log(`Creating new group: ${groupName} (${groupId})`);
                    
                    await Contact.create({
                        phoneNumber: numericId,
                        name: groupName,
                        isGroup: true,
                        groupId: numericId,
                        source: 'whatsapp',
                        metadata: {
                            groupName: groupName,
                            waGroupId: groupId,
                            createdFrom: 'fix-script',
                            createdAt: new Date()
                        }
                    });
                } else if (existingGroup.name !== groupName) {
                    console.log(`Found existing group with different name: "${existingGroup.name}" => "${groupName}"`);
                    await existingGroup.update({
                        name: groupName,
                        metadata: {
                            ...existingGroup.metadata,
                            groupName: groupName,
                            waGroupId: groupId,
                            lastUpdated: new Date()
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Error fetching groups from WAHA:', error.message);
            console.log('\nTrying alternative approach...\n');

            // Alternative: Update groups one by one
            for (const group of groups) {
                const groupId = group.metadata?.waGroupId || group.phoneNumber || group.groupId;
                
                if (groupId && groupId.includes('@g.us')) {
                    const groupInfo = await getGroupInfoFromWAHA(groupId);
                    
                    if (groupInfo && groupInfo.subject) {
                        console.log(`Updating ${groupId}: "${group.name}" => "${groupInfo.subject}"`);
                        
                        await group.update({
                            name: groupInfo.subject,
                            metadata: {
                                ...group.metadata,
                                groupName: groupInfo.subject,
                                waGroupId: groupId,
                                lastUpdated: new Date()
                            }
                        });
                    }
                }
            }
        }

        console.log('\nGroup name fix complete!');

    } catch (error) {
        console.error('Error fixing group names:', error);
    } finally {
        await sequelize.close();
    }
}

// Run the fix
fixGroupNames();