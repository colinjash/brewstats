class PlayerPage {
    constructor() {
        this.playerId = new URLSearchParams(window.location.search).get('id');
        this.player = null;
        this.mlbData = [];
        this.milbData = [];
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.findPlayer();
            this.renderPlayer();
        } catch (error) {
            this.showError(`Error loading data: ${error.message}`);
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    async loadData() {
        // Load both CSV files (same as main page)
        const [mlbResponse, milbResponse] = await Promise.all([
            fetch('fg.csv'),
            fetch('fg2.csv')
        ]);

        if (mlbResponse.ok) {
            const mlbText = await mlbResponse.text();
            this.mlbData = Papa.parse(mlbText, { header: true }).data;
        }

        if (milbResponse.ok) {
            const milbText = await milbResponse.text();
            this.milbData = Papa.parse(milbText, { header: true }).data;
        }
    }

    findPlayer() {
        // Find player in both datasets
        const mlbPlayer = this.mlbData.find(p =>
            p.Name && this.createId(this.cleanName(p.Name)) === this.playerId
        );

        const milbPlayer = this.milbData.find(p =>
            p.Name && this.createId(this.cleanName(p.Name)) === this.playerId
        );

        if (!mlbPlayer && !milbPlayer) {
            this.showError('Player not found');
            return;
        }

        this.player = {
            mlb: mlbPlayer,
            milb: milbPlayer,
            name: this.cleanName((mlbPlayer?.Name || milbPlayer?.Name)),
            id: this.playerId
        };
    }

    renderPlayer() {
        if (!this.player) return;

        document.getElementById('player-name').textContent = this.player.name;
        
        if (this.player.mlb) {
            document.getElementById('player-level').textContent = 'MLB';
            document.getElementById('player-level').className = 'level-tag level-mlb';
            document.getElementById('player-type').textContent = 'Major League';
        } else if (this.player.milb) {
            const level = this.player.milb.Level;
            document.getElementById('player-level').textContent = level;
            document.getElementById('player-level').className = `level-tag level-${level.toLowerCase().replace('+', '-plus')}`;
            document.getElementById('player-age').textContent = `Age ${this.player.milb.Age}`;
            document.getElementById('player-type').textContent = 'Minor League';
        }

        // Render stats sections
        const container = document.getElementById('stats-container');
        let html = '';

        if (this.player.mlb) {
            html += this.renderMLBStats();
        }

        if (this.player.milb) {
            html += this.renderMILBStats();
        }

        container.innerHTML = html;
        document.getElementById('player-content').style.display = 'block';
    }

    renderMLBStats() {
        const player = this.player.mlb;
        
        return `
            <div class="stat-section">
                <h3>2025 MLB Statistics</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>G</th><th>PA</th><th>HR</th><th>R</th><th>RBI</th><th>SB</th>
                                <th>AVG</th><th>OBP</th><th>SLG</th><th>wOBA</th><th>wRC+</th><th>WAR</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="stat-number">${player.G}</td>
                                <td class="stat-number">${player.PA}</td>
                                <td class="stat-number">${player.HR}</td>
                                <td class="stat-number">${player.R}</td>
                                <td class="stat-number">${player.RBI}</td>
                                <td class="stat-number">${player.SB}</td>
                                <td class="stat-number stat-avg">${parseFloat(player.AVG).toFixed(3)}</td>
                                <td class="stat-number stat-avg">${parseFloat(player.OBP).toFixed(3)}</td>
                                <td class="stat-number stat-avg">${parseFloat(player.SLG).toFixed(3)}</td>
                                <td class="stat-number stat-avg">${parseFloat(player.wOBA).toFixed(3)}</td>
                                <td class="stat-number">${parseInt(player['wRC+']) || '-'}</td>
                                <td class="stat-number">${parseFloat(player.WAR).toFixed(1)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="stat-section">
                <h3>Advanced Metrics</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>BB%</th><th>K%</th><th>ISO</th><th>BABIP</th><th>BsR</th><th>Off</th><th>Def</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="stat-number">${(parseFloat(player['BB%']) * 100).toFixed(1)}%</td>
                                <td class="stat-number">${(parseFloat(player['K%']) * 100).toFixed(1)}%</td>
                                <td class="stat-number stat-avg">${parseFloat(player.ISO).toFixed(3)}</td>
                                <td class="stat-number stat-avg">${parseFloat(player.BABIP).toFixed(3)}</td>
                                <td class="stat-number">${parseFloat(player.BsR).toFixed(1)}</td>
                                <td class="stat-number">${parseFloat(player.Off).toFixed(1)}</td>
                                <td class="stat-number">${parseFloat(player.Def).toFixed(1)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderMILBStats() {
        const player = this.player.milb;
        
        return `
            <div class="stat-section">
                <h3>2025 Minor League Statistics (${player.Level})</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Level</th><th>Age</th><th>G</th><th>AB</th><th>PA</th><th>H</th><th>1B</th><th>2B</th><th>3B</th><th>HR</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="level-tag level-${player.Level.toLowerCase().replace('+', '-plus')}">${player.Level}</span></td>
                                <td class="stat-number">${player.Age}</td>
                                <td class="stat-number">${player.G}</td>
                                <td class="stat-number">${player.AB}</td>
                                <td class="stat-number">${player.PA}</td>
                                <td class="stat-number">${player.H}</td>
                                <td class="stat-number">${player['1B']}</td>
                                <td class="stat-number">${player['2B']}</td>
                                <td class="stat-number">${player['3B']}</td>
                                <td class="stat-number">${player.HR}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="stat-section">
                <h3>Runs, RBIs & Walks</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>R</th><th>RBI</th><th>BB</th><th>IBB</th><th>SO</th><th>HBP</th><th>SF</th><th>SH</th><th>GDP</th><th>SB</th><th>CS</th><th>AVG</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="stat-number">${player.R}</td>
                                <td class="stat-number">${player.RBI}</td>
                                <td class="stat-number">${player.BB}</td>
                                <td class="stat-number">${player.IBB}</td>
                                <td class="stat-number">${player.SO}</td>
                                <td class="stat-number">${player.HBP}</td>
                                <td class="stat-number">${player.SF}</td>
                                <td class="stat-number">${player.SH}</td>
                                <td class="stat-number">${player.GDP}</td>
                                <td class="stat-number">${player.SB}</td>
                                <td class="stat-number">${player.CS}</td>
                                <td class="stat-number stat-avg">${parseFloat(player.AVG).toFixed(3)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    cleanName(name) {
        return name ? name.replace(/['"]/g, '').trim() : '';
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

document.addEventListener('DOMContentLoaded', () => {
    new PlayerPage();
});
