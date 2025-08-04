@echo off
echo ========================================
echo CHECKING AUTOMATION DATA
echo ========================================
echo.

cd backend\whatsapp

echo Creating check script...
(
echo const { AutomationLog, AutomationRule, Contact, Message } = require('./src/models'^);
echo.
echo async function checkData(^) {
echo   try {
echo     // Check if there are any automation logs
echo     const logCount = await AutomationLog.count(^);
echo     console.log('\n1. Total Automation Logs:', logCount^);
echo.
echo     if (logCount === 0^) {
echo       console.log('   No automation logs found! This is why the page is empty.'^);
echo       console.log('   Try sending a message to trigger an automation rule.'^);
echo     } else {
echo       // Get recent logs
echo       const recentLogs = await AutomationLog.findAll({
echo         limit: 5,
echo         order: [['createdAt', 'DESC']],
echo         include: [
echo           { model: AutomationRule, as: 'rule' },
echo           { model: Contact, as: 'contact' }
echo         ]
echo       }^);
echo.
echo       console.log('\n2. Recent Automation Logs:'^);
echo       recentLogs.forEach(log =^> {
echo         console.log(`\n   - Rule: ${log.rule?.name ^|^| log.metadata?.ruleName ^|^| 'Unknown'}'^);
echo         console.log(`     Status: ${log.status}'^);
echo         console.log(`     Contact: ${log.contact?.phoneNumber ^|^| 'Unknown'}'^);
echo         console.log(`     Created: ${log.createdAt}'^);
echo       }^);
echo     }
echo.
echo     // Check active rules
echo     const activeRules = await AutomationRule.findAll({
echo       where: { isActive: true }
echo     }^);
echo.
echo     console.log('\n3. Active Automation Rules:', activeRules.length^);
echo     activeRules.forEach(rule =^> {
echo       console.log(`   - ${rule.name} (${rule.ruleType}^)'^);
echo     }^);
echo.
echo     // Check metadata structure
echo     if (logCount ^> 0^) {
echo       const sampleLog = await AutomationLog.findOne({
echo         order: [['createdAt', 'DESC']]
echo       }^);
echo       console.log('\n4. Sample Log Metadata:'^);
echo       console.log(JSON.stringify(sampleLog.metadata, null, 2^)^);
echo     }
echo.
echo   } catch (error^) {
echo     console.error('Error:', error^);
echo   }
echo   process.exit(0^);
echo }
echo.
echo checkData(^);
) > check-automation-data.js

echo.
echo Running check...
node check-automation-data.js

echo.
echo ========================================
echo If no logs found, send a test message to trigger automation!
echo ========================================
pause