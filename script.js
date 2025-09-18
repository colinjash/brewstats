class BrewStatsTable {
    constructor() {
        this.mlbData = [];
        this.milbData = [];
        this.combinedData = [];
        this.filteredData = [];
        this.sortColumn = null;
        this.sortDirection = 'desc';
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.processData();
            this.setupControls();
            this.renderTable();
            this.updateSummary();
        } catch (error) {
            this.showError(`Error loading data: ${error.message}`);
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    async loadData() {
        console.log('Loading CSV files...');
        
        // Load MLB data
        try {
            const mlbResponse = await fetch('fg.csv');
            if (!mlbResponse.ok) throw new Error('Could not load fg.csv');
            const mlbText = await mlbResponse.text();
            this.mlbData = Papa.parse(mlbText, { header: true, skipEmptyLines: true }).data;
            console.log(`Loaded ${this.mlbData.length} MLB records`);
        } catch (error) {
            console.error('Error loading MLB data:', error);
        }

        // Load MILB data
        try {
            const milbResponse = await fetch('fg2.csv');
            if (!milbResponse.ok) throw new Error('Could not load fg2.csv');
            const milbText = await milbResponse.text();
            this.milbData = Papa.parse(milbText, { header: true, skipEmptyLines: true }).data;
            console.log(`Loaded ${this.milbData.length} MILB records`);
        } catch (error) {
            console.error('Error loading MILB data:', error);
        }
    }

    processData() {
        this.combinedData = [];

        // Process MLB players
        this.mlbData.forEach(player => {
            if (player.Name && player.Name.trim() && player.Name !== 'Name') {
                const cleanName = this.cleanName(player.Name);
                this.combinedData.push({
                    id: this.createId(cleanName),
                    name: cleanName,
                    level: 'MLB',
                    type: 'MLB',
                    // Basic stats
                    G: parseInt(player.G) || 0,
                    PA: parseInt(player.PA) || 0,
                    HR: parseInt(player.HR) || 0,
                    R: parseInt(player.R) || 0,
                    RBI: parseInt(player.RBI) || 0,
                    SB: parseInt(player.SB) || 0,
                    AVG: parseFloat(player.AVG) || 0,
                    OBP: parseFloat(player.OBP) || 0,
                    SLG: parseFloat(player.SLG) || 0,
                    // Advanced stats
                    wOBA: parseFloat(player.wOBA) || 0,
                    'wRC+': parseInt(player['wRC+']) || 0,
                    WAR: parseFloat(player.WAR) || 0,
                    'BB%': parseFloat(player['BB%']) || 0,
                    'K%': parseFloat(player['K%']) || 0,
                    ISO: parseFloat(player.ISO) || 0,
                    BABIP: parseFloat(player.BABIP) || 0,
                    // Raw data for player page
                    rawData: player
                });
            }
        });

        // Process MILB players
        this.milbData.forEach(player => {
            if (player.Name && player.Name.trim() && player.Age && player.Level) {
                const cleanName = this.cleanName(player.Name);
                this.combinedData.push({
                    id: this.createId(cleanName),
                    name: cleanName,
                    level: player.Level,
                    type: 'MILB',
                    age: parseInt(player.Age) || 0,
                    // Basic stats
                    G: parseInt(player.G) || 0,
                    AB: parseInt(player.AB) || 0,
                    PA: parseInt(player.PA) || 0,
                    H: parseInt(player.H) || 0,
                    HR: parseInt(player.HR) || 0,
                    R: parseInt(player.R) || 0,
                    RBI: parseInt(player.RBI) || 0,
                    BB: parseInt(player.BB) || 0,
                    SO: parseInt(player.SO) || 0,
                    SB: parseInt(player.SB) || 0,
                    AVG: parseFloat(player.AVG) || 0,
                    // Calculated stats
                    OBP: this.calculateOBP(player),
                    SLG: this.calculateSLG(player),
                    OPS: this.calculateOPS(player),
                    // Raw data for player page
                    rawData: player
                });
            }
        });

        this.filteredData = [...this.combinedData];
        console.log(`Combined ${this.combinedData.length} total player records`);
    }

    calculateOBP(player) {
        const h = parseInt(player.H) || 0;
        const bb = parseInt(player.BB) || 0;
        const hbp = parseInt(player.HBP) || 0;
        const ab = parseInt(player.AB) || 0;
        const sf = parseInt(player.SF) || 0;
        const pa = parseInt(player.PA) || 0;
        
        if (pa === 0) return 0;
        return (h + bb + hbp) / (ab + bb + hbp + sf);
    }

    calculateSLG(player) {
        const singles = parseInt(player['1B']) || 0;
        const doubles = parseInt(player['2B']) || 0;
        const triples = parseInt(player['3B']) || 0;
        const hrs = parseInt(player.HR) || 0;
        const ab = parseInt(player.AB) || 0;
        
        if (ab === 0) return 0;
        return (singles + (2 * doubles) + (3 * triples) + (4 * hrs)) / ab;
    }

    calculateOPS(player) {
        return this.calculateOBP(player) + this.calculateSLG(player);
    }

    setupControls() {
        const searchInput = document.getElementById('player-search');
        const levelFilter = document.getElementById('level-filter');

        searchInput.addEventListener('input', () => this.filterData());
        levelFilter.addEventListener('change', () => this.filterData());
    }

    filterData() {
        const searchTerm = document.getElementById('player-search').value.toLowerCase();
        const levelFilter = document.getElementById('level-filter').value;

        this.filteredData = this.combinedData.filter(player => {
            const matchesSearch = player.name.toLowerCase().includes(searchTerm);
            const matchesLevel = !levelFilter || player.level === levelFilter;
            return matchesSearch && matchesLevel;
        });

        this.renderTable();
        this.updateSummary();
    }

    renderTable() {
        const table = document.getElementById('players-table');
        const headers = document.getElementById('table-headers');
        const tbody = document.getElementById('table-body');

        // Show table
        table.style.display = 'table';

        // Create headers based on data type
        const hasMLB = this.filteredData.some(p => p.type === 'MLB');
        const hasMILB = this.filteredData.some(p => p.type === 'MILB');

        let headerHTML = '<th class="sortable" data-column="name">Name</th>';
        headerHTML += '<th class="sortable" data-column="level">Level</th>';

        if (hasMILB) {
            headerHTML += '<th class="sortable" data-column="age">Age</th>';
        }

        // Common stats
        headerHTML += '<th class="sortable" data-column="G">G</th>';
        
        if (hasMLB) {
            headerHTML += '<th class="sortable" data-column="PA">PA</th>';
        } else {
            headerHTML += '<th class="sortable" data-column="AB">AB</th>';
        }

        headerHTML += '<th class="sortable" data-column="HR">HR</th>';
        headerHTML += '<th class="sortable" data-column="R">R</th>';
        headerHTML += '<th class="sortable" data-column="RBI">RBI</th>';
        headerHTML += '<th class="sortable" data-column="SB">SB</th>';
        headerHTML += '<th class="sortable" data-column="AVG">AVG</th>';

        if (hasMLB) {
            headerHTML += '<th class="sortable" data-column="OBP">OBP</th>';
            headerHTML += '<th class="sortable" data-column="SLG">SLG</th>';
            headerHTML += '<th class="sortable" data-column="wOBA">wOBA</th>';
            headerHTML += '<th class="sortable" data-column="wRC+">wRC+</th>';
            headerHTML += '<th class="sortable" data-column="WAR">WAR</th>';
        } else if (hasMILB) {
            headerHTML += '<th class="sortable" data-column="OBP">OBP</th>';
            headerHTML += '<th class="sortable" data-column="SLG">SLG</th>';
            headerHTML += '<th class="sortable" data-column="OPS">OPS</th>';
        }

        headers.innerHTML = headerHTML;

        // Add click handlers for sorting
        headers.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                this.sortData(column);
            });
        });

        // Render data
        this.renderTableBody(tbody, hasMLB, hasMILB);
    }

    renderTableBody(tbody, hasMLB, hasMILB) {
        let html = '';

        this.filteredData.forEach(player => {
            html += '<tr>';
            html += `<td><a href="player.html?id=${player.id}" class="player-name">${player.name}</a></td>`;
            html += `<td><span class="level-tag level-${player.level.toLowerCase().replace('+', '-plus')}">${player.level}</span></td>`;
            
            if (hasMILB) {
                html += `<td class="stat-number">${player.age || '-'}</td>`;
            }

            html += `<td class="stat-number">${player.G}</td>`;
            
            if (hasMLB) {
                html += `<td class="stat-number">${player.PA || '-'}</td>`;
            } else {
                html += `<td class="stat-number">${player.AB || '-'}</td>`;
            }

            html += `<td class="stat-number">${player.HR}</td>`;
            html += `<td class="stat-number">${player.R}</td>`;
            html += `<td class="stat-number">${player.RBI}</td>`;
            html += `<td class="stat-number">${player.SB}</td>`;
            html += `<td class="stat-number stat-avg">${player.AVG.toFixed(3)}</td>`;

            if (hasMLB && player.type === 'MLB') {
                html += `<td class="stat-number stat-avg">${(player.OBP || 0).toFixed(3)}</td>`;
                html += `<td class="stat-number stat-avg">${(player.SLG || 0).toFixed(3)}</td>`;
                html += `<td class="stat-number stat-avg">${(player.wOBA || 0).toFixed(3)}</td>`;
                html += `<td class="stat-number">${player['wRC+'] || '-'}</td>`;
                html += `<td class="stat-number">${(player.WAR || 0).toFixed(1)}</td>`;
            } else if (hasMILB) {
                html += `<td class="stat-number stat-avg">${(player.OBP || 0).toFixed(3)}</td>`;
                html += `<td class="stat-number stat-avg">${(player.SLG || 0).toFixed(3)}</td>`;
                html += `<td class="stat-number stat-avg">${(player.OPS || 0).toFixed(3)}</td>`;
            }

            html += '</tr>';
        });

        tbody.innerHTML = html;
    }

    sortData(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = column === 'name' ? 'asc' : 'desc';
        }

        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            // Handle different data types
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal === null || aVal === undefined) aVal = -Infinity;
            if (bVal === null || bVal === undefined) bVal = -Infinity;

            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // Update header styling
        document.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        
        const activeHeader = document.querySelector(`[data-column="${column}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sorted-${this.sortDirection}`);
        }

        // Re-render table body
        const tbody = document.getElementById('table-body');
        const hasMLB = this.filteredData.some(p => p.type === 'MLB');
        const hasMILB = this.filteredData.some(p => p.type === 'MILB');
        this.renderTableBody(tbody, hasMLB, hasMILB);
    }

    updateSummary() {
        const mlbCount = this.filteredData.filter(p => p.type === 'MLB').length;
        const milbCount = this.filteredData.filter(p => p.type === 'MILB').length;
        
        document.getElementById('total-players').textContent =
            `${this.filteredData.length} players • ${mlbCount} MLB • ${milbCount} MILB`;
    }

    cleanName(name) {
        return name.replace(/['"]/g, '').trim();
    }

    createId(name) {
        return name.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '')
                  .replace(/\s+/g, '-');
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.brewStats = new BrewStatsTable();
});
