# Hospitalised Injuries from Road Crashes in Australia
### COS30045 Data Visualisation · Swinburne University of Technology · 2026

**Team:** Sanghun Shin (Sean) & Sebastian Haney  
**Dataset:** Bureau of Infrastructure and Transport Research Economics (BITRE)

---

## 📁 Folder Structure

```
project/
├── index.html                  ← Main webpage (single page)
├── css/
│   └── style.css               ← All styles
├── js/
│   ├── linechart.js
│   ├── barchart.js
│   ├── scatterplot.js
│   ├── histogram.js
│   └── shared.js
└── data/
    ├── national_annual.csv
    ├── state_annual.csv
    ├── road_user_annual.csv
    ├── demographics_age.csv
    └── first_nations_annual.csv
    
```

---

## 🚀 How to Run

> **⚠️ You must use Live Server — opening index.html directly won't work (CORS error when loading CSV files)**

1. Open the project folder in **VS Code**
2. Right-click `index.html` → **Open with Live Server**
3. The site will open at `http://127.0.0.1:5500`

---

## 📊 Sections

| # | Section | Chart Type | Research Question |
|---|---------|------------|-------------------|


---

## 📂 Data Sources

All data from:  
**Bureau of Infrastructure and Transport Research Economics (BITRE)**  
https://www.bitre.gov.au/publications/ongoing/hospitalised-injury

CSV files in `/data/` were processed from the raw BITRE Excel files using KNIME.

---

## ⚠️ Limitations

Raw counts are used throughout. Direct comparison across states or population groups should account for differences in population size. This limitation is noted in the visualisation narrative.
