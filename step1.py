import re
import time
import argparse
import json
import numpy as np
from sentence_transformers import SentenceTransformer

parser = argparse.ArgumentParser()
parser.add_argument(
    "--top_n_code",
    type=int,
    default=10
)
parser.add_argument(
    "--prod_desc",
    type=str
)
args = parser.parse_args()

def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

# Load back the embeddings
def load_hts_embeddings_sbert(path="htsdata_embedding_sbert.jsonl"):
    with open(path, "r") as f:
        return [json.loads(line) for line in f if "embedding" in json.loads(line)]

def extract_rate(text):
    match = re.search(r'(\d+(\.\d+)?)\s*%', text)
    if match:
        return float(match.group(1))
    else:
        return 0

start = time.time()
hts_data = load_hts_embeddings_sbert()
print('loading time:', time.time() - start)

# product_des = "a creamy lipstick in a twist-up tube"
product_des = args.prod_desc
print(product_des)
# Load SBERT model
model = SentenceTransformer("all-mpnet-base-v2")
product_des_vec = model.encode(product_des)

# Rank by similarity

scored = [(cosine_similarity(product_des_vec, item["embedding"]), item) for item in hts_data]
top_matches = sorted(scored, key=lambda x: -x[0])[:args.top_n_code]

final_res = []
for _, match in top_matches:
    final_res.append((match['htsno'], match['description'], match['general']))



for r in final_res:
    hs_code, desc, gen_rate = r
    gen_rate = extract_rate(gen_rate)
    # if any(char.isdigit() for char in s):
    #     gen_rate = gen_rate.strip('%')
    print('hs code: {}, description: {}, general: {}%'.format(hs_code, desc, gen_rate))
