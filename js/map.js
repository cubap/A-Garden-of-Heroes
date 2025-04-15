import { calculateCompletion } from './main.js'

// Calculate color based on canceled funds
const getColor = (percentage) => {
    const red = 255 - Math.round(255 * percentage)
    return `rgb(${red}, 50, 50)`
}

// Calculate stateFunds dynamically based on project data
const calculateStateFunds = (projects) => {
    const stateFunds = {}

    projects.forEach(project => {
        const state = project.organizationState
        const totalAward = parseFloat(project.awardedOutrightFunds) || 0
        const completionRate = parseFloat(calculateCompletion(project.awardPeriod).replace('%', '')) / 100
        const canceledFunds = totalAward - (totalAward * completionRate)

        if (!stateFunds[state]) stateFunds[state] = 0
        stateFunds[state] += canceledFunds
    })

    return stateFunds
}

// Show tooltip on hover, anchored to the mouse position
const showTooltip = (event, stateId, funds) => {
    let tooltip = document.getElementById('tooltip')
    if (!tooltip) {
        tooltip = document.createElement('div')
        tooltip.id = 'tooltip'
        tooltip.style.position = 'absolute'
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        tooltip.style.color = '#fff'
        tooltip.style.padding = '5px 10px'
        tooltip.style.borderRadius = '5px'
        tooltip.style.pointerEvents = 'none'
        tooltip.style.zIndex = '1000'
        document.body.appendChild(tooltip)
    }

    tooltip.textContent = `${stateId}: $${funds.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
    tooltip.style.display = 'block'
    updateTooltipPosition(event)
}

// Update tooltip position dynamically as the mouse moves
const moveTooltip = (event) => {
    const tooltip = document.getElementById('tooltip')
    if (tooltip && tooltip.style.display === 'block') {
        updateTooltipPosition(event)
    }
}

// Helper function to update tooltip position
const updateTooltipPosition = (event) => {
    const tooltip = document.getElementById('tooltip')
    const mapElement = document.getElementById('us-map')
    const offsetX = 15 + mapElement.offsetLeft // Offset to avoid overlapping the cursor
    const offsetY = 15 + mapElement.offsetTop // Adjust for SVG offset

    tooltip.style.left = `${event.clientX + offsetX}px`
    tooltip.style.top = `${event.clientY + offsetY}px`
}

// Hide tooltip
const hideTooltip = () => {
    const tooltip = document.getElementById('tooltip')
    if (tooltip) {
        tooltip.style.display = 'none'
    }
}

// Update the map with colors, tooltips, and click functionality based on canceled funds
const updateMapColors = (stateFunds) => {
    const maxFunds = Math.max(...Object.values(stateFunds))
    const svgObject = document.getElementById('us-map')

    if (!svgObject) {
        console.error('SVG object not found')
        return
    }

    const svgDoc = svgObject.contentDocument
    if (!svgDoc) {
        console.error('SVG content document not found')
        return
    }

    // Update the legend dynamically
    updateLegend(maxFunds)

    Object.keys(stateFunds).forEach(stateId => {
        const stateElement = svgDoc.getElementById(stateId)
        if (stateElement) {
            const funds = stateFunds[stateId]
            const percentage = funds / maxFunds
            stateElement.style.fill = getColor(percentage)

            // Add hover tooltip
            stateElement.addEventListener('mouseenter', (event) => {
                showTooltip(event, stateId, funds)
            })
            stateElement.addEventListener('mousemove', moveTooltip) // Update tooltip position on mouse move
            stateElement.addEventListener('mouseleave', hideTooltip)

            // Add click event to redirect to index.html with the state pre-selected
            stateElement.addEventListener('click', () => {
                const url = new URL('index.html', window.location.origin)
                url.searchParams.set('state', stateId)
                window.location.href = url.toString()
            })
        }
    })
}

// Update the legend with dynamic ranges
const updateLegend = (maxFunds) => {
    const legend = document.getElementById('legend')
    if (!legend) return

    const roundToNearest = (value, nearest) => Math.round(value / nearest) * nearest

    const highRange = roundToNearest(maxFunds, 25000)
    const mediumRange = roundToNearest(maxFunds * 0.5, 25000)
    const lowRange = roundToNearest(maxFunds * 0.1, 25000)

    legend.innerHTML = `
        <h3>Legend</h3>
        <div class="legend-item">
            <span class="color-box" style="background-color: rgb(0, 50, 50)"></span> High: $${mediumRange.toLocaleString()} - $${highRange.toLocaleString()}
        </div>
        <div class="legend-item">
            <span class="color-box" style="background-color: rgb(125, 50, 50)"></span> Medium: $${lowRange.toLocaleString()} - $${mediumRange.toLocaleString()}
        </div>
        <div class="legend-item">
            <span class="color-box" style="background-color: rgb(255, 50, 50)"></span> Low: $0 - $${lowRange.toLocaleString()}
        </div>
        <a href="https://www.temu.com/1pc-handcrafted-resin-statue-figurine--for-lincoln---portrait-decor-no-power-needed--home-decor-living-room-entryway-kitchen-balcony-made-by-artisan-ideal-for-holidays-special-occasions-g-601100231159339.html?_oak_mp_inf=EKvcgu6o1ogBGiA1OGJiNjFmNmM5YTQ0NjM0YmIxODMxNThkY2MzOTM0NyDDjvPT4zI%3D&top_gallery_url=https%3A%2F%2Fimg.kwcdn.com%2Fproduct%2Ffancy%2F4ac46588-1753-4c35-b67b-70f38ff07289.jpg&spec_gallery_id=4948868700&refer_page_sn=10009&refer_source=0&freesia_scene=2&_oak_freesia_scene=2&_oak_rec_ext_1=MzcyMg&_oak_gallery_order=2083526268%2C154050739%2C1873533886%2C1272256086%2C400104817&search_key=statues%20and%20sculptures%20of%20american%20heroes&refer_page_el_sn=200049&_x_sessn_id=ad6u56il23&refer_page_name=search_result&refer_page_id=10009_1744737978881_f1f5wd6iop" target="_blank" rel="noopener noreferrer">Buy ${Math.floor(maxFunds / 36.67).toLocaleString()} Heroes Now</a>
    `
}

// Initialize the map when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/DHAG-2025-cancelled.json')
        const projects = await response.json()

        const stateFunds = calculateStateFunds(projects)
        updateMapColors(stateFunds)
    } catch (error) {
        console.error('Error loading project data:', error)
    }
})
