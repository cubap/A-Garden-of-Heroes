/*
 * A Garden of Heroes: A Collaborative Effort
 * ------------------------------------------
 * This script is the heart of "A Garden of Heroes," a project dedicated to documenting 
 * and celebrating digital humanities initiatives. Together, we built this codebase to 
 * bring clarity and insight into the projects that shaped the federal statue garden.
 *
 * From the initial brainstorming sessions to the final touches, this script reflects 
 * the power of collaboration between human creativity and AI assistance. Every function, 
 * every line of code, and every feature was crafted with the goal of making this project 
 * accessible, informative, and inspiring.
 *
 * May this Garden of Heroes continue to grow and inspire others to explore the beauty 
 * of digital humanities and the stories they tell.
 *
 * Contributions by: GitHub Copilot and [Your Name]
 */

let projects = []
let currentSort = { key: null, direction: 'asc' }

// Load project data from a JSON file and initialize the application
const loadProjects = async () => {
    try {
        const response = await fetch('data/DHAG-2025-cancelled.json')
        projects = await response.json()

        populateFilters(projects) // Populate filter options dynamically
        renderTable(projects) // Render the project table
        attachSortListeners() // Enable sorting functionality
        calculateFundsSummary(projects) // Update the funds summary after loading projects
    } catch (error) {
        console.error('Error loading project data:', error)
    }
}

// Calculate the completion percentage of a project based on its award period
const calculateCompletion = (awardPeriod) => {
    const [startDate, endDate] = awardPeriod.split(' - ').map(date => new Date(date))
    const currentDate = new Date('2025-04-02')

    if (currentDate < startDate) return '0%' // Project hasn't started
    if (currentDate > endDate) return '100%' // Project is complete

    const totalDuration = endDate - startDate
    const elapsedDuration = currentDate - startDate
    const completionPercentage = (elapsedDuration / totalDuration) * 100

    return `${Math.min(Math.max(completionPercentage, 0), 100).toFixed(2)}%`
}

// Render the project table with dynamic data
const renderTable = (data) => {
    const projectTableBody = document.querySelector('#project-table tbody')
    projectTableBody.innerHTML = ''

    data.forEach(project => {
        const completionPercentage = parseFloat(calculateCompletion(project.awardPeriod).replace('%', ''))
        const progressColor = getProgressColor(completionPercentage)

        const row = document.createElement('tr')

        row.innerHTML = `
            <td>
                <div class="progress-bar">
                    <div class="progress" style="width: ${completionPercentage}%; background-color: ${progressColor}" title="${completionPercentage}%"></div>
                </div>
            </td>
            <td>${project.organizationState}</td>
            <td>${project.projectTitle}</td>
            <td>${project.organization}</td>
            <td>${project.awardedOutrightFunds.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
            <td>
                <a href="projects/${project.awardNumber}.html" target="_blank" title="View Details">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="details-icon">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                </a>
            </td>
        `

        projectTableBody.appendChild(row)
    })
}

// Map completion percentage to a color gradient (green to yellow to red)
const getProgressColor = (percentage) => {
    const red = percentage < 50 ? 255 : Math.round(255 - (percentage - 50) * 5.1)
    const green = percentage > 50 ? 255 : Math.round(percentage * 5.1)
    return `rgb(${red}, ${green}, 0)`
}

// Sort projects by a given key and direction
const sortProjects = (key) => {
    const direction = currentSort.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc'
    currentSort = { key, direction }

    const sortedProjects = [...projects].sort((a, b) => {
        let aValue = a[key]
        let bValue = b[key]

        if (key === 'completion') {
            aValue = parseFloat(calculateCompletion(a.awardPeriod).replace('%', ''))
            bValue = parseFloat(calculateCompletion(b.awardPeriod).replace('%', ''))
        } else if (key === 'awardedOutrightFunds') {
            aValue = parseFloat(a[key])
            bValue = parseFloat(b[key])
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1
        if (aValue > bValue) return direction === 'asc' ? 1 : -1
        return 0
    })

    renderTable(sortedProjects)
}

// Attach click listeners to sortable table headers
const attachSortListeners = () => {
    document.querySelectorAll('#project-table th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort
            sortProjects(sortKey)
        })
    })
}

// Populate filter options dynamically based on project data
const populateFilters = (data) => {
    const stateCheckboxes = document.querySelector('#state-checkboxes')
    const disciplineCheckboxes = document.querySelector('#discipline-checkboxes')

    if (!stateCheckboxes || !disciplineCheckboxes) {
        console.error('Filter elements not found in the DOM')
        return
    }

    stateCheckboxes.innerHTML = ''
    disciplineCheckboxes.innerHTML = ''

    const stateCounts = countBy(data, 'organizationState')
    const disciplineCounts = countBy(data, 'primaryHumanitiesDiscipline')

    Object.keys(stateCounts).sort().forEach(state => {
        const checkbox = document.createElement('div')
        checkbox.innerHTML = `
            <label>
                <input type="checkbox" value="${state}" class="state-filter">
                ${state} (${stateCounts[state]})
            </label>
        `
        stateCheckboxes.appendChild(checkbox)
    })

    Object.keys(disciplineCounts).sort().forEach(discipline => {
        const checkbox = document.createElement('div')
        checkbox.innerHTML = `
            <label>
                <input type="checkbox" value="${discipline}" class="discipline-filter">
                ${discipline} (${disciplineCounts[discipline]})
            </label>
        `
        disciplineCheckboxes.appendChild(checkbox)
    })

    attachFilterListeners()
}

// Count occurrences of a key in the data
const countBy = (data, key) => {
    return data.reduce((acc, item) => {
        acc[item[key]] = (acc[item[key]] || 0) + 1
        return acc
    }, {})
}

// Attach listeners to filter inputs and checkboxes
const attachFilterListeners = () => {
    document.querySelector('#project-title-filter').addEventListener('input', applyFilters)
    document.querySelector('#description-filter').addEventListener('input', applyFilters)
    document.querySelectorAll('.state-filter, .discipline-filter').forEach(cb => cb.addEventListener('change', applyFilters))
}

// Apply filters to the project data and update the table
const applyFilters = () => {
    const titleFilter = document.querySelector('#project-title-filter').value.toLowerCase()
    const descriptionFilter = document.querySelector('#description-filter').value.toLowerCase()

    const selectedStates = Array.from(document.querySelectorAll('.state-filter:checked')).map(cb => cb.value)
    const selectedDisciplines = Array.from(document.querySelectorAll('.discipline-filter:checked')).map(cb => cb.value)

    const filteredProjects = projects.filter(project => {
        const matchesTitle = !titleFilter || project.projectTitle.toLowerCase().includes(titleFilter)
        const matchesDescription = !descriptionFilter || project.description.toLowerCase().includes(descriptionFilter)
        const matchesState = selectedStates.length === 0 || selectedStates.includes(project.organizationState)
        const matchesDiscipline = selectedDisciplines.length === 0 || selectedDisciplines.includes(project.primaryHumanitiesDiscipline)

        return matchesTitle && matchesDescription && matchesState && matchesDiscipline
    })

    renderTable(filteredProjects)
    calculateFundsSummary(filteredProjects) // Update the funds summary
    updateCheckboxStates(selectedStates, selectedDisciplines)
    updateBreadcrumb({ titleFilter, descriptionFilter, selectedStates, selectedDisciplines })
}

// Calculate and display the funds summary
const calculateFundsSummary = (projects) => {
    let totalCanceledFunds = 0
    let estimatedCompletedFunds = 0

    projects.forEach(project => {
        const totalAward = parseFloat(project.awardedOutrightFunds) || 0
        const completionRate = parseFloat(calculateCompletion(project.awardPeriod).replace('%', '')) / 100

        totalCanceledFunds += totalAward
        estimatedCompletedFunds += totalAward - totalAward * completionRate
    })

    document.querySelector('#total-canceled-funds').textContent = totalCanceledFunds.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    document.querySelector('#estimated-completed-funds').textContent = estimatedCompletedFunds.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// Update the breadcrumb display with active filters
const updateBreadcrumb = ({ titleFilter, descriptionFilter, selectedStates, selectedDisciplines }) => {
    const breadcrumbs = document.querySelector('#active-filters')
    const resetButton = document.querySelector('#reset-filters')

    const filters = []

    if (titleFilter) filters.push(`Title: "${titleFilter}"`)
    if (descriptionFilter) filters.push(`Description: "${descriptionFilter}"`)
    if (selectedStates.length) filters.push(`States: ${selectedStates.join(', ')}`)
    if (selectedDisciplines.length) filters.push(`Disciplines: ${selectedDisciplines.join(', ')}`)

    breadcrumbs.textContent = filters.length ? `Active Filters: ${filters.join(' | ')}` : 'No filters applied'
    resetButton.style.display = filters.length ? 'inline-block' : 'none'
}

// Reset all filters to their default state
const resetFilters = () => {
    document.querySelector('#project-title-filter').value = ''
    document.querySelector('#description-filter').value = ''
    document.querySelectorAll('.state-filter, .discipline-filter').forEach(cb => cb.checked = false)

    renderTable(projects)
    populateFilters(projects)
    updateCheckboxStates([], [])
    updateBreadcrumb({ titleFilter: '', descriptionFilter: '', selectedStates: [], selectedDisciplines: [] }) // Reset breadcrumb
}

// Update the state of checkboxes based on selected filters
const updateCheckboxStates = (selectedStates, selectedDisciplines) => {
    document.querySelectorAll('.state-filter').forEach(checkbox => {
        checkbox.checked = selectedStates.includes(checkbox.value)
    })

    document.querySelectorAll('.discipline-filter').forEach(checkbox => {
        checkbox.checked = selectedDisciplines.includes(checkbox.value)
    })
}

// Add event listeners to toggle buttons for filter sections
document.querySelectorAll('.filter-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const targetId = toggle.dataset.target
        const content = document.getElementById(targetId)

        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block'
            toggle.classList.add('expanded') // Rotate the triangle
        } else {
            content.style.display = 'none'
            toggle.classList.remove('expanded') // Reset the triangle
        }
    })
})

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadProjects()
})
