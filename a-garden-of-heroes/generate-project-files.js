const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const inputFilePath = 'b:\\Downloads\\NEHAwardSearchResults.csv'
const outputFolderPath = 'b:\\Repositories\\AGOH\\a-garden-of-heroes\\projects'

// Ensure the output folder exists
if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath, { recursive: true })
}

// Normalize keys to trim whitespace and ensure consistency
const normalizeKeys = (row) => {
    const normalizedRow = {}
    for (const key in row) {
        const normalizedKey = key.trim()
        normalizedRow[normalizedKey] = row[key]
    }
    return normalizedRow
}

// Function to generate Markdown content for a project
const generateMarkdown = (project) => `
# ${project['Project Title']}

**Award Number:** ${project['"Award Number"']}  
**Award Period:** ${project['Award Period']}  
**Project Director:** ${project['Project Director First Name']} ${project['Project Director Middle Name']} ${project['Project Director Last Name']}  
**Organization:** ${project['Organization']}  
**Location:** ${project['Organization City']}, ${project['Organization State']}  
**Year Awarded:** ${project['Year Awarded']}  
**Primary Humanities Discipline:** ${project['Primary Humanities Discipline']}  
**Grant Program Name:** ${project['Grant Program Name']}  
**Approved Outright Funds:** $${parseFloat(project['Approved Outright Funds']).toLocaleString()}  
**Awarded Outright Funds:** $${parseFloat(project['Awarded Outright Funds']).toLocaleString()}  

---

## Description

${project['Description']}
`

// Read the CSV file and generate Markdown files
fs.createReadStream(inputFilePath)
    .pipe(csv())
    .on('data', (row) => {
        const normalizedRow = normalizeKeys(row)
        console.log(normalizedRow) // Log to verify the parsed data

        const fileName = `${normalizedRow['"Award Number"']}.md`
        const filePath = path.join(outputFolderPath, fileName)
        const markdownContent = generateMarkdown(normalizedRow)

        fs.writeFileSync(filePath, markdownContent, 'utf8')
        console.log(`Generated: ${fileName}`)
    })
    .on('end', () => {
        console.log('All project files have been generated as Markdown.')
    })
