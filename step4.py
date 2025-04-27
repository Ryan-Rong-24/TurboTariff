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

Ieepa_rate_prompt = f"""
Please confirm whether the HS code [{hs_code}] is subject to the additional tariffs imposed by the United States under the "International Emergency Economic Powers Act" (IEEPA), and what the current tariff rate is.

Detailed Instructions:
- Check the latest announcements from the U.S. Customs and Border Protection (CBP)
- Confirm whether the IEEPA tariffs apply (generally applicable to all imports from China)
- Record the current applicable tariff rate (20% as of April 2025)
- Check if there are any specific product exclusion clauses

Return the following JSON format:
{{
  "subject_to_ieepa": "<Y or N>",
  "ieepa_rate" "<rate if Y else 0>",
  "reason": "<reason>"
}}
"""


response = client.responses.create(
    model="gpt-4.1",
    tools=[{"type": "web_search_preview",
            "search_context_size": "high"}],
    input=Ieepa_rate_prompt
)

result_text = response.output_text


match = re.findall(r'```json\s*(\{.*?\})\s*```', result_text, re.DOTALL)
json_str = match[-1].strip()
data_dict = json.loads(json_str)
if data_dict['subject_to_ieepa'].lower() == 'y':
    print(int(data_dict['ieepa_rate'].strip('%')))
else:
    print(0)

