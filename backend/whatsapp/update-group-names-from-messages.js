const { Contact, Message, sequelize } = require('./src/models');
const { Op } = require('sequelize');
const logger = require('./src/utils/logger');

async function updateGroupNamesFromMessages() {
    try {
        // Find all groups
        const groups = await Contact.findAll({
            where: {
                isGroup: true
            }
        });
        
        // Filter groups with numeric names
        const groupsToUpdate = groups.filter(g => /^\d+$/.test(g.name));

        console.log(`Found ${groupsToUpdate.length} groups with numeric names out of ${groups.length} total groups`);

        for (const group of groupsToUpdate) {
            // Try to find a recent message from this group that might have the group name
            const recentMessage = await Message.findOne({
                where: {
                    [Op.or]: [
                        { fromNumber: group.groupId },
                        { toNumber: group.groupId }
                    ]
                },
                order: [['createdAt', 'DESC']],
                attributes: ['metadata', 'fromNumber', 'toNumber', 'createdAt']
            });

            if (recentMessage && recentMessage.metadata) {
                let groupName = null;
                
                // Try to extract group name from metadata
                if (recentMessage.metadata.chatName) {
                    groupName = recentMessage.metadata.chatName;
                } else if (recentMessage.metadata._data?.notifyName) {
                    groupName = recentMessage.metadata._data.notifyName;
                } else if (recentMessage.metadata.chat?.name) {
                    groupName = recentMessage.metadata.chat.name;
                } else if (recentMessage.metadata.chat?.subject) {
                    groupName = recentMessage.metadata.chat.subject;
                }

                if (groupName && groupName !== group.name) {
                    console.log(`Updating group ${group.groupId}: "${group.name}" -> "${groupName}"`);
                    await group.update({
                        name: groupName,
                        groupName: groupName
                    });
                } else {
                    console.log(`No name found for group ${group.groupId} in message metadata`);
                }
            } else {
                console.log(`No messages found for group ${group.groupId}`);
            }
        }

        console.log('Group name update complete!');
    } catch (error) {
        console.error('Error updating group names:', error);
    } finally {
        await sequelize.close();
    }
}

// Run the update
updateGroupNamesFromMessages();