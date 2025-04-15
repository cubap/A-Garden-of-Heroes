let projects = []
let currentSort = { key: null, direction: 'asc' }

const loadProjects = async () => {
    try {
        const response = await fetch('data/DHAG-2025-cancelled.json')
        projects = await response.json()

        populateFilters(projects)
        renderTable(projects)
        attachSortListeners()
    } catch (error) {
        console.error('Error loading project data:', error)
    }
}

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
            <td>${project.projectDirector}</td>
            <td>${project.organization}</td>
            <td>${project.primaryHumanitiesDiscipline}</td>
            <td>${project.awardedOutrightFunds.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
        `

        projectTableBody.appendChild(row)
    })
}

const getProgressColor = (percentage) => {
    // Map percentage to a color gradient (green to yellow to red)
    const red = percentage < 50 ? 255 : Math.round(255 - (percentage - 50) * 5.1) // Decrease red after 50%
    const green = percentage > 50 ? 255 : Math.round(percentage * 5.1) // Decrease green before 50%
    return `rgb(${red}, ${green}, 0)` // Blue is always 0 for a green-yellow-red gradient
}

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

const attachSortListeners = () => {
    document.querySelectorAll('#project-table th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort
            sortProjects(sortKey)
        })
    })
}

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

const countBy = (data, key) => {
    return data.reduce((acc, item) => {
        acc[item[key]] = (acc[item[key]] || 0) + 1
        return acc
    }, {})
}

const attachFilterListeners = () => {
    document.querySelector('#project-title-filter').addEventListener('input', applyFilters)
    document.querySelector('#description-filter').addEventListener('input', applyFilters)
    document.querySelectorAll('.state-filter, .discipline-filter, .director-filter').forEach(cb => cb.addEventListener('change', applyFilters))
}

const applyFilters = () => {
    const titleFilter = document.querySelector('#project-title-filter').value.toLowerCase()
    const descriptionFilter = document.querySelector('#description-filter').value.toLowerCase()

    const selectedStates = Array.from(document.querySelectorAll('.state-filter:checked')).map(cb => cb.value)
    const selectedDisciplines = Array.from(document.querySelectorAll('.discipline-filter:checked')).map(cb => cb.value)
    const selectedDirectors = Array.from(document.querySelectorAll('.director-filter:checked')).map(cb => cb.value)

    const filteredProjects = projects.filter(project => {
        const matchesTitle = !titleFilter || project.projectTitle.toLowerCase().includes(titleFilter)
        const matchesDescription = !descriptionFilter || project.description.toLowerCase().includes(descriptionFilter)
        const matchesState = selectedStates.length === 0 || selectedStates.includes(project.organizationState)
        const matchesDiscipline = selectedDisciplines.length === 0 || selectedDisciplines.includes(project.primaryHumanitiesDiscipline)
        const matchesDirector = selectedDirectors.length === 0 || selectedDirectors.includes(project.projectDirector)

        return matchesTitle && matchesDescription && matchesState && matchesDiscipline && matchesDirector
    })

    renderTable(filteredProjects)
    populateFilters(filteredProjects)
}

document.querySelector('#reset-filters').addEventListener('click', () => {
    document.querySelector('#project-title-filter').value = ''
    document.querySelector('#description-filter').value = ''
    document.querySelectorAll('.state-filter, .discipline-filter, .director-filter').forEach(cb => cb.checked = false)

    renderTable(projects)
    populateFilters(projects)
})

loadProjects()
