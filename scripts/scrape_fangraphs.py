from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import json
import re
import time

# URL for Milwaukee Brewers 2025 batting stats
url = "https://www.fangraphs.com/leaders/major-league?pos=all&stats=bat&lg=all&qual=0&type=8&season=2025&month=0&season1=2025&ind=0&rost=&age=&filter=&players=0&team=23"

# Set up Chrome options for better stealth and performance
options = Options()
# Comment out headless for debugging if needed
options.add_argument('--headless=new')  # Updated headless flag
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)
options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
options.add_argument('--disable-gpu')
options.add_argument('--window-size=1920,1080')

# Initialize the driver
driver = webdriver.Chrome(options=options)
driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

try:
    print("Loading page...")
    driver.get(url)

    # Wait for Cloudflare challenge to resolve (check for absence of "Just a moment..." title)
    print("Waiting for Cloudflare challenge to resolve...")
    WebDriverWait(driver, 20).until_not(
        EC.title_contains("Just a moment")
    )

    # Wait for the stats table to load
    print("Waiting for stats table...")
    table = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "table.rgMasterTable"))
    )
    print("Table loaded successfully.")

    # Additional wait for full content stability
    time.sleep(3)

    # Parse the page source
    soup = BeautifulSoup(driver.page_source, 'html.parser')

    # Re-find the table
    table = soup.find('table', {'class': 'rgMasterTable'})
    if not table:
        print("Error: Could not find the stats table after loading.")
        print("Page title:", driver.title)
        print("Page URL after load:", driver.current_url)
        print("Page source snippet:", driver.page_source[:1000])
        exit()

    # Extract headers
    headers = []
    thead = table.find('thead')
    if thead:
        for th in thead.find_all('th'):
            headers.append(th.text.strip())

    if not headers:
        print("Error: No headers found.")
        print("Page title:", driver.title)
        exit()

    print(f"Found {len(headers)} headers: {headers}")

    # Extract player data
    players_data = []
    tbody = table.find('tbody')
    if tbody:
        for row in tbody.find_all('tr'):
            cols = row.find_all('td')
            if len(cols) < len(headers):
                continue
            player = {}

            for i, col in enumerate(cols):
                text = col.text.strip()

                # Handle player name (remove trailing numbers/IDs)
                if i == 1:
                    text = re.sub(r'\s*\d+\s*$', '', text)
                # Convert integers
                elif headers[i] in ['G', 'PA', 'HR', 'R', 'RBI', 'SB', 'CS', 'wRC+']:
                    text = int(text) if text and text != '-' else 0
                # Convert floats
                elif headers[i] in ['AVG', 'OBP', 'SLG', 'OPS', 'wOBA', 'BsR', 'Off', 'Def', 'WAR']:
                    text = float(text) if text and text != '-' else 0.0
                # Clean positions
                elif headers[i] == 'Pos':
                    text = text.replace('\xa0', ' ').strip()

                player[headers[i]] = text

            if player:
                players_data.append(player)

    if not players_data:
        print("Error: No player data found.")
        print("Page title:", driver.title)
        exit()

    # Save to JSON file
    filename = 'brewers_stats_2025.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(players_data, f, indent=2)

    print(f"Scraped {len(players_data)} players and saved to {filename}")

except Exception as e:
    print(f"Error during scraping: {e}")
    print("Page title:", driver.title if 'driver' in locals() else "N/A")
    print("Page URL:", driver.current_url if 'driver' in locals() else "N/A")
    print("Page source snippet:", driver.page_source[:1000] if 'driver' in locals() else "N/A")

finally:
    driver.quit()