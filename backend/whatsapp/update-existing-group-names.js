require('dotenv').config();
const { Contact } = require('./src/models');
const logger = require('./src/utils/logger');

async function updateExistingGroupNames() {
  try {
    console.log('=== UPDATING EXISTING GROUP NAMES ===\n');
    
    // Find all groups that have default names
    const groups = await Contact.findAll({
      where: {
        isGroup: true
      }
    });
    
    console.log(`Found ${groups.length} groups in database\n`);
    
    let needsUpdate = 0;
    
    for (const group of groups) {
      // Check if group has default name pattern
      const groupIdClean = group.phoneNumber;
      
      if (group.name === groupIdClean || 
          group.name === `Group ${groupIdClean}` ||
          group.name.match(/^\d+-\d+$/) || // matches pattern like 120363400489422761
          !group.groupName) {
        
        needsUpdate++;
        console.log(`Group needs update:`);
        console.log(`  ID: ${group.id}`);
        console.log(`  Current Name: ${group.name}`);
        console.log(`  Group ID: ${group.groupId}`);
        console.log(`  Phone Number: ${group.phoneNumber}`);
        console.log('');
        
        // For now, we'll mark these for manual update
        // The names will be updated automatically when the next message arrives from each group
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`Total groups: ${groups.length}`);
    console.log(`Groups needing name update: ${needsUpdate}`);
    console.log(`\nGroup names will be updated automatically when messages arrive from each group.`);
    console.log(`The webhook handler will extract the actual group name from the message data.`);
    
    // Optional: You can manually update specific groups here if you know their names
    // Example:
    // await Contact.update(
    //   { 
    //     name: 'My Awesome Group',
    //     groupName: 'My Awesome Group'
    //   },
    //   { 
    //     where: { 
    //       groupId: '120363400489422761@g.us' 
    //     } 
    //   }
    // );
    
  } catch (error) {
    console.error('Error updating group names:', error);
  } finally {
    process.exit(0);
  }
}

// Run the update
updateExistingGroupNames();