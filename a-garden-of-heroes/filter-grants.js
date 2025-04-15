const fs = require('fs')
const csv = require('csv-parser')

const inputFilePath = './NEHAwardSearchResults.csv'
const outputFilePath = './data/DHAG-2025-cancelled.json'

const filteredGrants = []
const cutoffDate = new Date('2025-03-31') // End of March 2025

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (row) => {
    const awardPeriod = row['Award Period']
    const endDate = new Date(awardPeriod.split(' - ')[1]) // Extract end date

    if (endDate <= cutoffDate) return // Skip if the grant term has expired

    filteredGrants.push({
      awardNumber: row['Award Number'], // Ensure Award Number is included
      projectTitle: row['Project Title'],
      awardPeriod: row['Award Period'],
      projectDirector: `${row['Project Director First Name']} ${row['Project Director Last Name']}`.trim(),
      organization: row['Organization'],
      organizationState: row['Organization State'],
      primaryHumanitiesDiscipline: row['Primary Humanities Discipline'],
      awardedOutrightFunds: parseFloat(row['Awarded Outright Funds']),
      description: row['Description'].replace(/<[^>]*>/g, '') // Remove HTML tags
    })
  })
  .on('end', () => {
    fs.writeFile(outputFilePath, JSON.stringify(filteredGrants, null, 2), (err) => {
      if (err) {
        console.error('Error writing JSON file:', err)
        return
      }
      console.log('Filtered grants saved to:', outputFilePath)
    })
  })
