import cdsapi
import os

# Create directory if it doesn't exist
output_dir = "_python/temp_downloads/seaice"
os.makedirs(output_dir, exist_ok=True)

dataset = "ecv-for-climate-change"
request = {
    "variable": ["sea_ice_cover"],
    "origin": ["era5"],
    "product_type": ["monthly_mean"],
    "time_aggregation": ["1_month_mean"],
    "year": ["2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
    "month": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
}

# Create filename based on parameters
years = "-".join(request["year"])
filename = f"seaice_monthly_{years}.zip"
output_path = os.path.join(output_dir, filename)

# Download the data
client = cdsapi.Client()
client.retrieve(dataset, request, output_path)

print(f"Downloaded sea ice data to: {output_path}")
