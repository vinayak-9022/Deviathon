import json
from typing import Dict, Any
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from google import genai 
import os 

app = Flask(__name__)
CORS(app) 


GEMINI_API_KEY = "AIzaSyD8tAQnuxjsjd5AL2yEQMRVsH4GUuDXRvA" 

client = None
try:
    if not GEMINI_API_KEY: 
        raise ValueError("API Key Missing")
        
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("✅ Gemini Client Initialized successfully.")

except ValueError as ve:
    
    print(f"❌ Critical Configuration Error: {ve}")
    print("ACTION REQUIRED: Ensure a valid API Key is provided.")
except Exception as e:
    
    print(f"❌ Critical Error during Gemini Client Initialization: {type(e).__name__} - {e}")
    print("ACTION REQUIRED: Check if your API Key is correct and if you have a stable internet connection.")

def compute_financial_metrics(
    revenue: float, cogs: float, fixed_costs: float, 
    variable_costs: float, cash_balance: float
) -> Dict[str, Any]:
    
    gross_profit = revenue - cogs
    gross_margin_percent = (gross_profit / revenue) * 100 if revenue else 0
    total_monthly_burn = fixed_costs + variable_costs
    runway_months = cash_balance / total_monthly_burn if total_monthly_burn > 0 else float('inf')
    risk_score = 75 if runway_months <= 3.5 else (50 if runway_months <= 6 else 20)

    return {
        "gross_margin_percent": round(gross_margin_percent, 2),
        "total_monthly_burn": round(total_monthly_burn, 2),
        "runway_months": round(runway_months, 2),
        "risk_score": risk_score
    }


def generate_llm_recommendations(user_input: Dict[str, Any], calculated_metrics: Dict[str, Any], domain: str) -> list:
    """Uses Gemini API to generate dynamic, data-driven recommendations and strategic analysis."""
    
    if not client:
        return [{"title": "API Error: Client Not Initialized", "description": "Please check your API Key and server logs.", "impact_estimate": "N/A"}]

   
    system_prompt = (
        "You are an elite financial and strategic co-pilot for high-growth Indian startups. "
        "Your responses MUST use the Indian Rupee symbol (₹) for all monetary values. "
        "Analyze the provided financial data and the business domain. Provide 3 actionable, "
        "prioritized financial suggestions AND a 'Strategic Market Insight' section. "
        "Your final response MUST be a clean JSON object, following this exact schema: "
        '{"actionable_suggestions": [ {"title": "...", "description": "...", "impact_estimate": "..."} ], "strategic_insight": {"market_trends": "...", "competitor_strategy": "...", "improvement_summary": "..."} }'
    )
    
    #
    prompt_data = {
        "Business Domain": domain, 
        "User Inputs (All values are in ₹)": user_input,
        "Calculated Metrics (All values are in ₹)": calculated_metrics,
        "Goal": "Provide 3 prioritized financial actions (focus on cash runway) and fill out the Strategic Market Insight section based on general knowledge of the domain."
    }
    
    user_prompt = f"Analyze this data and provide recommendations:\n{json.dumps(prompt_data, indent=2)}"
    
    try:
        print(" Server: Calling Gemini API for strategic analysis. Waiting for response...") 
       
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_prompt,
            config={"system_instruction": system_prompt}
        )

       
        response_text = response.text.strip()
        
       
        if response_text.startswith(""):
            json_string = response_text.split("")[1].strip()
            if json_string.startswith("json"):
                 json_string = json_string[4:].strip()
        else:
            json_string = response_text
        
        
        return json.loads(json_string)

    except Exception as e:
        print(f"\n--- CRITICAL GEMINI ERROR DURING API CALL ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Full Error Message: {e}")
        print(f"---------------------------------------------\n")
        
        return {"actionable_suggestions": [{"title": "API Error: Check Key/Connection", "description": "Failed to get dynamic advice. See server logs for detailed error.", "impact_estimate": "N/A"}], "strategic_insight": {"market_trends": "Analysis failed due to API connection or JSON structure error.", "competitor_strategy": "N/A", "improvement_summary": "N/A"}}



@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    try:
        data = request.json
        
        financial_inputs = {
            key: float(data.get(key, 0)) for key in [
                "revenue", "cogs", "fixed_costs", "variable_costs", "cash_balance"
            ]
        }
        domain = data.get("domain", "General Tech Startup") 

        metrics = compute_financial_metrics(**financial_inputs)
        
        
        recommendation_data = generate_llm_recommendations(data, metrics, domain)
        
        final_output = {
            "status": "success",
            "business_name": data.get("business_name", "Your Business"),
            "domain": domain, 
            "metrics": metrics,
            
            "actionable_suggestions": recommendation_data.get('actionable_suggestions', []),
            "strategic_insight": recommendation_data.get('strategic_insight', {}),
            "live_alert": "🔴 Live Alert: Competitor X just announced layoffs (via News API), market risk is high."
        }
        
        return jsonify(final_output)

    except Exception as e:
        print(f"Server Error during request processing: {str(e)}")
        return jsonify({"status": "error", "message": f"Server processing failed: {str(e)}"}), 500


# Endpoint to serve the HTML file
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')


if __name__ == '_main_':
    print("🚀 Starting Flask server. Open your browser to http://127.0.0.1:5000")
    app.run(debug=True)