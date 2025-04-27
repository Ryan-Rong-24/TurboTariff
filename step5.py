import argparse
import json
import os
import pandas as pd
import re
from dotenv import load_dotenv
from openai import OpenAI
from tqdm import tqdm

load_dotenv()
client = OpenAI(api_key = os.getenv('OPENAI_API_KEY'))

parser = argparse.ArgumentParser()
parser.add_argument(
    "--hs_code",
    type=str
)
args = parser.parse_args()
hs_code = args.hs_code

reciprocal_rate_prompt = f"""
Please confirm whether the HS code [{hs_code}] is subject to the reciprocal tariffs (Reciprocal Tariff) imposed by the United States on imports from China, and what the current tariff rate is.

Detailed Instructions:
- Check the latest announcements from the Office of the United States Trade Representative (USTR) or executive orders from the White House
- Confirm whether the reciprocal tariff applies (generally applicable to all imports from China)
- Record the current applicable tariff rate (125% as of April 2025)
- Check if there are any specific product exclusion clauses
- General Scenario: This applies to all products imported from China to the United States and requires confirmation whether they are affected by the reciprocal tariff.

Return the following JSON format:
{{
  "subject_to_reciprocal_tariff": "<Y or N>",
  "reciprocal_rate" "<rate if Y else 0>",
  "reason": "<reason>"
}}

Please search online and tell us step by step on what you've done as the intermediate output.
"""


response = client.responses.create(
    model="gpt-4.1",
    tools=[{"type": "web_search_preview",
           "search_context_size": "high"}],
    input=reciprocal_rate_prompt
)

result_text = response.output_text


match = re.findall(r'```json\s*(\{.*?\})\s*```', result_text, re.DOTALL)
json_str = match[-1].strip()
data_dict = json.loads(json_str)
print(result_text)
if data_dict['subject_to_reciprocal_tariff'].lower() == 'y':
    print(int(data_dict['reciprocal_rate'].strip('%')))
else:
    print(0)
