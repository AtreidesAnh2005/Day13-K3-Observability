import json
with open("config/challenge.json") as f:
    data = json.load(f)

with open("data/challenge_queries.jsonl", 'w') as f:
    for query in data["queries"]:
        f.write(json.dumps(query) + '\n')