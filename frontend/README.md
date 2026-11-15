# TrendEarth AI dashboard

From repository root run `npm --prefix frontend ci`, then
`npm --prefix frontend run dev`.

`npm --prefix frontend test` checks the scientific JSON contract.
`npm --prefix frontend run build` validates and copies the two canonical datasets
from `data/processed/` before Vite builds `frontend/dist/`.

See the root README for deployment settings and demo script. No live NASA API
or backend is required at runtime. No deployment is authorized by this branch.
