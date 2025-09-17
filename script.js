class BrewStatsCSV {
    constructor() {
        this.mlbPlayers = [];
        this.milbPlayers = [];
        this.allPlayers = [];
        this.filteredPlayers = [];
        this.init();
    }

    async init() {
        try {
            await this.loadCSVFiles();
            this.combinePlayerData();
            this.setupControls();
            this.renderPlayers();
            this.updateSummary();
        } catch (error) {
            this.showError(`Error loading data: ${error.message}`);
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    async loadCSVFiles() {
        console.log('Loading CSV files...');
        
        // Load MLB data
        try {
            const mlbResponse = await fetch('fg.csv');
            if (!mlbResponse.ok) throw new Error('Could not load fg.csv (MLB data)');
            const mlbText = await mlbResponse.text();
            this.mlbPlayers = Papa.parse(mlbText, { header: true, skipEmptyLines: true }).data;
            console.log(`Loaded ${this.mlbPlayers.length} MLB players`);
        } catch (error) {
            console.error('Error loading MLB data:', error);
            this.showError('Could not load MLB data (fg.csv)');
        }

        // Load MILB data
        try {
            const milbResponse = await fetch('fg2.csv');
            if (!milbResponse.ok) throw new Error('Could not load fg2.csv (MILB data)');
            const milbText = await milbResponse.text();
            this.milbPlayers = Papa.parse(milbText, { header: true, skipEmptyLines: true }).data;
            console.log(`Loaded ${this.milbPlayers.length} MILB player records`);
        } catch (error) {
            console.error('Error loading MILB data:', error);
            this.showError('Could not load MILB data (fg2.csv)');
        }
    }

    combinePlayerData() {
        console.log('Combining player data...');
        
        const combinedPlayers = new Map();

        // Process MLB players
        this.mlbPlayers.forEach(player => {
            if (player.Name && player.Name.trim()) {
                const cleanName = this.cleanName(player.Name);
                const playerId = this.createPlayerId(cleanName);
                
                combinedPlayers.set(playerId, {
                    id: playerId,
                    name: cleanName,
                    level: 'MLB',
                    team: player.Team || 'MIL',
                    age: this.calculateAge(player),
                    position: this.guessPosition(player),
                    mlbStats: {
                        G: parseInt(player.G) || 0,
                        PA: parseInt(player.PA) || 0,
                        HR: parseInt(player.HR) || 0,
                        R: parseInt(player.R) || 0,
                        RBI: parseInt(player.RBI) || 0,
                        SB: parseInt(player.SB) || 0,
                        AVG: parseFloat(player.AVG) || 0,
                        OBP: parseFloat(player.OBP) || 0,
                        SLG: parseFloat(player.SLG) || 0,
                        wRC: parseInt(player['wRC+']) || 0,
                        WAR: parseFloat(player.WAR) || 0
                    },
                    milbStats: null
                });
            }
        });

        // Process MILB players
        this.milbPlayers.forEach(player => {
            if (player.Name && player.Name.trim()) {
                const cleanName = this.cleanName(player.Name);
                const playerId = this.createPlayerId(cleanName);
                
                const milbStats = {
                    level: player.Level || 'A',
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
                    AVG: parseFloat(player.AVG) || 0
                };

                if (combinedPlayers.has(playerId)) {
                    // Player exists, add MILB stats
                    combinedPlayers.get(playerId).milbStats = milbStats;
                } else {
                    // New MILB-only player
                    combinedPlayers.set(playerId, {
                        id: playerId,
                        name: cleanName,
                        level: player.Level || 'A',
                        team: player.Team || 'MIL',
                        age: parseInt(player.Age) || 22,
                        position: this.guessPositionFromMilb(player),
                        mlbStats: null,
                        milbStats: milbStats
                    });
                }
            }
        });

        this.allPlayers = Array.from(combinedPlayers.values());
        this.filteredPlayers = [...this.allPlayers];
        
        console.log(`Combined data: ${this.allPlayers.length} total players`);
    }

    cleanName(name) {
        return name.replace(/['"]/g, '').trim();
    }

    createPlayerId(name) {
        return name.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '')
                  .replace(/\s+/g, '-');
    }

    calculateAge(player) {
        // Try to extract age from MLB data or estimate
        return 27; // Default age for MLB players
    }

    guessPosition(player) {
        // Simple position guessing based on defensive stats
        const def = parseFloat(player.Def) || 0;
        if (def > 5) return 'SS';
        if (def > 0) return 'IF';
        return 'OF';
    }

    guessPositionFromMilb(player) {
        // Could be enhanced with more logic
        return 'OF';
    }

    setupControls() {
        const searchInput = document.getElementById('player-search');
        const levelFilter = document.getElementById('level-filter');

        searchInput.addEventListener('input', () => this.filterPlayers());
        levelFilter.addEventListener('change', () => this.filterPlayers());
    }

    filterPlayers() {
        const searchTerm = document.getElementById('player-search').value.toLowerCase();
        const levelFilter = document.getElementById('level-filter').value;

        this.filteredPlayers = this.allPlayers.filter(player => {
            const matchesSearch = player.name.toLowerCase().includes(searchTerm);
            const matchesLevel = !levelFilter || player.level === levelFilter;
            
            return matchesSearch && matchesLevel;
        });

        this.renderPlayers();
        this.updateSummary();
    }

    renderPlayers() {
        const container = document.getElementById('players-list');
        
        if (this.filteredPlayers.length === 0) {
            container.innerHTML = '<div class="no-results">No players found</div>';
            return;
        }

        // Sort players: MLB first, then by level, then by name
        const sortedPlayers = [...this.filteredPlayers].sort((a, b) => {
            if (a.level === 'MLB' && b.level !== 'MLB') return -1;
            if (b.level === 'MLB' && a.level !== 'MLB') return 1;
            if (a.level !== b.level) return a.level.localeCompare(b.level);
            return a.name.localeCompare(b.name);
        });

        const html = sortedPlayers.map(player => this.renderPlayerCard(player)).join('');
        container.innerHTML = html;
    }

    renderPlayerCard(player) {
        const stats = player.mlbStats || player.milbStats || {};
        const isMLB = player.level === 'MLB';
        
        return `
            <div class="player-card" onclick="viewPlayer('${player.id}')">
                <div class="player-name">${player.name}</div>
                <div class="player-details">
                    <span class="position-tag">${player.position}</span>
                    <span class="level-tag">${player.level}</span>
                    <span class="age-tag">Age ${player.age}</span>
                </div>
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-label">G</span>
                        <span class="stat-value">${stats.G || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">AVG</span>
                        <span class="stat-value">${(stats.AVG || 0).toFixed(3)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">HR</span>
                        <span class="stat-value">${stats.HR || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">RBI</span>
                        <span class="stat-value">${stats.RBI || 0}</span>
                    </div>
                    ${isMLB ? `
                    <div class="stat-item">
                        <span class="stat-label">WAR</span>
                        <span class="stat-value">${(stats.WAR || 0).toFixed(1)}</span>
                    </div>
                    ` : `
                    <div class="stat-item">
                        <span class="stat-label">SB</span>
                        <span class="stat-value">${stats.SB || 0}</span>
                    </div>
                    `}
                </div>
            </div>
        `;
    }

    updateSummary() {
        const mlbCount = this.filteredPlayers.filter(p => p.level === 'MLB').length;
        const milbCount = this.filteredPlayers.filter(p => p.level !== 'MLB').length;
        
        document.getElementById('total-players').textContent =
            `${this.filteredPlayers.length} players (${mlbCount} MLB, ${milbCount} MILB)`;
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    getPlayerById(id) {
        return this.allPlayers.find(player => player.id === id);
    }
}

function viewPlayer(playerId) {
    window.location.href = `player.html?id=${playerId}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.brewStats = new BrewStatsCSV();
});
