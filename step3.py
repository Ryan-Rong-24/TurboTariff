import re
import time
from selenium import webdriver
import argparse

options = webdriver.ChromeOptions()
options.add_argument('--headless=new')
driver = webdriver.Chrome(options=options)

parser = argparse.ArgumentParser()
parser.add_argument(
    "--query",
    type=str
)
args = parser.parse_args()

driver.get("https://ustr.gov/issue-areas/enforcement/section-301-investigations/search")

search_box = driver.find_element('xpath', "//input[@id='searchbox']")

query = args.query

search_box.clear()
search_box.send_keys(query)
assert search_box.get_attribute('value') == query

search_button = driver.find_element('xpath', "//button[@class='bsearch']")
search_button.click()
time.sleep(3)

documents_container = driver.find_element('xpath', '//*[@id="documents"]')

text = documents_container.text

match = re.search(r'(\d+(?:\.\d+)?%)', text)

if match:
    percentage = match.group(1)
    # print(f"Found percentage: {percentage}")
    print(int(percentage.strip('%')))
else:
    # print("No percentage found.")
    print(0)
