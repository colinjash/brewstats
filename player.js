class PlayerStats {
    constructor() {
        this.playerId = new URLSearchParams(window.location.search).get('id');
        this.player = null;
        this.init();
    }

    async init() {
        await this.loadPlayerStats();
        this.renderPlayerStats();
        document.getElementById('loading').style.display = 'none';
    }

    async loadPlayerStats() {
        try {
            // Try to load real player data
            const response = await fetch(`data/player_${this.playerId}.json`);
            if (response.ok) {
                this.player = await response.json();
            } else {
                // Fallback to sample data
                this.player = this.getSamplePlayer();
            }
        } catch (error) {
            console.error('Error loading player stats:', error);
            this.player = this.getSamplePlayer();
        }
    }

    getSamplePlayer() {
        // Sample detailed player data
        const samplePlayers = {
            'jackson-chourio': {
                name: 'Jackson Chourio',
                position: 'OF',
                age: 20,
                currentLevel: 'Milwaukee Brewers',
                careerStats: [
                    { year: 2025, level: 'MLB', g: 142, pa: 586, ab: 532, h: 142, hr: 18, rbi: 65, avg: .267, obp: .320, slg: .527, ops: .847, wrcPlus: 115 },
                    { year: 2024, level: 'AA/AAA', g: 98, pa: 432, ab: 389, h: 95, hr: 21, rbi: 79, avg: .244, obp: .301, slg: .477, ops: .778, wrcPlus: 98 },
                    { year: 2023, level: 'High-A', g: 89, pa: 395, ab: 356, h: 101, hr: 22, rbi: 88, avg: .284, obp: .358, slg: .527, ops: .885, wrcPlus: 145 }
                ]
            },
            'tyler-black': {
                name: 'Tyler Black',
                position: 'SS',
                age: 24,
                currentLevel: 'Nashville Sounds',
                careerStats: [
                    { year: 2025, level: 'AAA', g: 125, pa: 542, ab: 485, h: 138, hr: 16, rbi: 71, avg: .285, obp: .356, slg: .467, ops: .823, wrcPlus: 125 },
                    { year: 2024, level: 'AA', g: 112, pa: 489, ab: 441, h: 111, hr: 11, rbi: 58, avg: .252, obp: .318, slg: .438, ops: .756, wrcPlus: 105 },
                    { year: 2023, level: 'High-A', g: 89, pa: 378, ab: 342, h: 81, hr: 9, rbi: 45, avg: .237, obp: .297, slg: .424, ops: .721, wrcPlus: 95 }
                ]
            }
        };

        return samplePlayers[this.playerId] || {
            name: 'Player Not Found',
            position: '',
            age: 0,
            currentLevel: '',
            careerStats: []
        };
    }

    renderPlayerStats() {
        if (!this.player || !this.player.name) {
            document.getElementById('player-stats').innerHTML = '<h2>Player not found</h2>';
            return;
        }

        const html = `
            <div class="player-header">
                <h1 class="player-title">${this.player.name}</h1>
                <div class="player-meta">
                    <span class="position-tag">${this.player.position}</span>
                    <span class="age-tag">Age ${this.player.age}</span>
                    <span class="level-tag">${this.player.currentLevel}</span>
                </div>
            </div>

            <div class="stats-section">
                <h2 class="section-title">Career Statistics</h2>
                ${this.createStatsTable()}
            </div>
        `;

        document.getElementById('player-stats').innerHTML = html;
    }

    createStatsTable() {
        if (!this.player.careerStats || this.player.careerStats.length === 0) {
            return '<p>No statistics available</p>';
        }

        let tableHtml = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Level</th>
                        <th>G</th>
                        <th>PA</th>
                        <th>AB</th>
                        <th>H</th>
                        <th>HR</th>
                        <th>RBI</th>
                        <th>AVG</th>
                        <th>OBP</th>
                        <th>SLG</th>
                        <th>OPS</th>
                        <th>wRC+</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.player.careerStats.forEach(season => {
            tableHtml += `
                <tr>
                    <td class="year-cell">${season.year}</td>
                    <td>${season.level}</td>
                    <td>${season.g}</td>
                    <td>${season.pa}</td>
                    <td>${season.ab}</td>
                    <td>${season.h}</td>
                    <td>${season.hr}</td>
                    <td>${season.rbi}</td>
                    <td>${season.avg.toFixed(3)}</td>
                    <td>${season.obp.toFixed(3)}</td>
                    <td>${season.slg.toFixed(3)}</td>
                    <td>${season.ops.toFixed(3)}</td>
                    <td>${season.wrcPlus}</td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        return tableHtml;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new PlayerStats();
});
