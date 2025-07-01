import psycopg2
import sys
import os
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER, EMBEDDING_MODEL, DATASET

from datasets import get_dataset_config_names
first_data_set_item = get_dataset_config_names(DATASET)[0]
print(f'First item: {first_data_set_item}')

# Load wiki_snippets (first 1000 for demo)
ds = load_dataset(DATASET, first_data_set_item, split="train[:1000]")

# Load embedding model
model = SentenceTransformer(EMBEDDING_MODEL)

# Connect to Postgres
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,  # or your DB host
    port=DB_PORT
)
cur = conn.cursor()

# Insert each snippet
for item in tqdm(ds):
    content = item["text"]
    embedding = model.encode(content).tolist()
    cur.execute(
        "INSERT INTO documents (content, embedding) VALUES (%s, %s)",
        (content, embedding)
    )
    print(f'Embedded {content} \n')

conn.commit()
cur.close()
conn.close()