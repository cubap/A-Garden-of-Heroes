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
export const loadProjects = async () => {
    try {
        const response = await fetch('data/DHAG-2025-cancelled.json')
        projects = await response.json()

        populateFilters(projects) // Populate filter options dynamically
        renderTable(projects) // Render the project table
        attachSortListeners() // Enable sorting functionality
        calculateFundsSummary(projects) // Update the funds summary after loading projects
        if (window.selectedState) {
            const selectedStateCheckbox = document.querySelector(`.state-filter[value="${window.selectedState}"]`)
            if (!selectedStateCheckbox) return // Ensure the checkbox exists
            selectedStateCheckbox.checked = true // Check the checkbox if the state is pre-selected
            selectedStateCheckbox.dispatchEvent(new Event('change')) // Trigger the change event to apply filters
        }
    
    } catch (error) {
        console.error('Error loading project data:', error)
    }
}

// Calculate the completion percentage of a project based on its award period
export const calculateCompletion = (awardPeriod) => {
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
export const renderTable = (data) => {
    const projectTableBody = document.querySelector('#project-table tbody')
    if (!projectTableBody) return // Ensure the table body exists
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

    // Call this function after the table is rendered
    attachSortListeners()
}

// Map completion percentage to a color gradient (green to yellow to red)
export const getProgressColor = (percentage) => {
    const red = percentage < 50 ? 255 : Math.round(255 - (percentage - 50) * 5.1)
    const green = percentage > 50 ? 255 : Math.round(percentage * 5.1)
    return `rgb(${red}, ${green}, 0)`
}

// Sort projects by a given key and direction
const sortProjects = (key) => {
    const direction = currentSort.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc'
    currentSort = { key, direction }

    // Get the currently filtered projects
    const filteredProjects = applyFilters(false) // Pass `false` to avoid re-rendering immediately

    const sortedProjects = [...filteredProjects].sort((a, b) => {
        let aValue = a[key] ?? '' // Handle null or undefined values
        let bValue = b[key] ?? ''

        if (key === 'completion') {
            aValue = parseFloat(calculateCompletion(a.awardPeriod).replace('%', ''))
            bValue = parseFloat(calculateCompletion(b.awardPeriod).replace('%', ''))
        } else if (key === 'awardedOutrightFunds') {
            aValue = parseFloat(a[key]) || 0
            bValue = parseFloat(b[key]) || 0
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1
        if (aValue > bValue) return direction === 'asc' ? 1 : -1
        return 0
    })

    renderTable(sortedProjects)

    // Update sort carets
    document.querySelectorAll('#project-table th[data-sort]').forEach(header => {
        header.classList.remove('asc', 'desc')
        if (header.dataset.sort === key) header.classList.add(direction)
    })
}

// Attach click listeners to sortable table headers
const attachSortListeners = () => {
    document.querySelectorAll('#project-table th[data-sort]').forEach(header => {
        const newHeader = header.cloneNode(true) // Clone the header to remove existing listeners
        header.parentNode.replaceChild(newHeader, header) // Replace the header with the clone

        newHeader.addEventListener('click', () => {
            const sortKey = newHeader.dataset.sort
            sortProjects(sortKey)
        })
    })
}

// Populate filter options dynamically based on project data
const populateFilters = (data) => {
    const stateCheckboxes = document.querySelector('#state-checkboxes')
    const disciplineCheckboxes = document.querySelector('#discipline-checkboxes')

    if (!stateCheckboxes || !disciplineCheckboxes) return

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
    const titleFilterInput = document.querySelector('#project-title-filter')
    const descriptionFilterInput = document.querySelector('#description-filter')
    const stateFilters = document.querySelectorAll('.state-filter')
    const disciplineFilters = document.querySelectorAll('.discipline-filter')

    if (!titleFilterInput || !descriptionFilterInput || !stateFilters.length || !disciplineFilters.length) return

    titleFilterInput.addEventListener('input', applyFilters)
    descriptionFilterInput.addEventListener('input', applyFilters)
    stateFilters.forEach(cb => cb.addEventListener('change', applyFilters))
    disciplineFilters.forEach(cb => cb.addEventListener('change', applyFilters))
}

// Apply filters to the project data and update the table
const applyFilters = (shouldRender = true) => {
    const titleFilterInput = document.querySelector('#project-title-filter')
    const descriptionFilterInput = document.querySelector('#description-filter')
    const stateFilterCheckboxes = document.querySelectorAll('.state-filter:checked')
    const disciplineFilterCheckboxes = document.querySelectorAll('.discipline-filter:checked')

    if (!titleFilterInput || !descriptionFilterInput) return

    const titleFilter = titleFilterInput.value.toLowerCase()
    const descriptionFilter = descriptionFilterInput.value.toLowerCase()
    const selectedStates = Array.from(stateFilterCheckboxes).map(cb => cb.value)
    const selectedDisciplines = Array.from(disciplineFilterCheckboxes).map(cb => cb.value)

    const filteredProjects = projects.filter(project => {
        const matchesTitle = !titleFilter || project.projectTitle.toLowerCase().includes(titleFilter)
        const matchesDescription = !descriptionFilter || project.description.toLowerCase().includes(descriptionFilter)
        const matchesState = selectedStates.length === 0 || selectedStates.includes(project.organizationState)
        const matchesDiscipline = selectedDisciplines.length === 0 || selectedDisciplines.includes(project.primaryHumanitiesDiscipline)

        return matchesTitle && matchesDescription && matchesState && matchesDiscipline
    })

    if (shouldRender) {
        renderTable(filteredProjects)
        calculateFundsSummary(filteredProjects) // Update the funds summary
        updateBreadcrumb({ titleFilter, descriptionFilter, selectedStates, selectedDisciplines })
    }

    return filteredProjects
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

    const totalCanceledFundsElement = document.querySelector('#total-canceled-funds')
    const estimatedCompletedFundsElement = document.querySelector('#estimated-completed-funds')

    if (totalCanceledFundsElement && estimatedCompletedFundsElement) {
        totalCanceledFundsElement.textContent = totalCanceledFunds.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        estimatedCompletedFundsElement.textContent = estimatedCompletedFunds.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    }
    return { totalCanceledFunds, estimatedCompletedFunds }
}

// Update the breadcrumb display with active filters
const updateBreadcrumb = ({ titleFilter, descriptionFilter, selectedStates, selectedDisciplines }) => {
    const breadcrumbs = document.querySelector('#active-filters')
    const resetButton = document.querySelector('#reset-filters')

    if (!breadcrumbs || !resetButton) return

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
    const titleFilterInput = document.querySelector('#project-title-filter')
    const descriptionFilterInput = document.querySelector('#description-filter')
    const stateFilterCheckboxes = document.querySelectorAll('.state-filter')
    const disciplineFilterCheckboxes = document.querySelectorAll('.discipline-filter')

    if (!titleFilterInput || !descriptionFilterInput || !stateFilterCheckboxes.length || !disciplineFilterCheckboxes.length) return

    titleFilterInput.value = ''
    descriptionFilterInput.value = ''
    stateFilterCheckboxes.forEach(cb => cb.checked = false)
    disciplineFilterCheckboxes.forEach(cb => cb.checked = false)

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

loadProjects()

const urlParams = new URLSearchParams(window.location.search)
const selectedState = urlParams.get('state')
window.selectedState = selectedState // Make it globally accessible
