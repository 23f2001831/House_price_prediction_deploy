# House Price API - Render deployment

Files: `app.py` (FastAPI), `pipeline.py` (feature engineering), `model.pkl` (trained bundle),
`requirements.txt` (pinned), `render.yaml` (optional Blueprint), `sample_request.json`.

## Deploy
1. Put all files from this folder at the ROOT of a GitHub repo (`model.pkl` is a few MB to tens of MB - fine for GitHub, well under the 100 MB limit).
2. Render dashboard -> New -> Web Service -> connect the repo.
   - Runtime: Python 3
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Environment variable: `PYTHON_VERSION` = see render.yaml
   (Or choose New -> Blueprint and Render reads `render.yaml` for you.)
3. When it's live, open `https://<your-service>.onrender.com/docs` to try it, or:

```
curl -X POST https://<your-service>.onrender.com/predict -H "Content-Type: application/json" -d @sample_request.json
```

Free-tier note: the service sleeps after inactivity, so the first request can take ~30-60 s.
Do NOT change library versions in requirements.txt - the pickle was created with exactly those versions.
