"""
Kabadiwala Connect AI - Pricing Regression Model Training
=========================================================
NOTE: This script generates and trains on DEMONSTRATION DATA.
Real-world scrap prices fluctuate based on LME spot prices, local transport,
and processing margins.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

CATEGORIES = [
    'laptop', 'mobile_phone', 'battery', 'keyboard', 'mouse',
    'pcb', 'monitor', 'printer', 'television', 'cables',
    'charger_adapter', 'other_ewaste'
]

# Illustrative base scrap/resale value in INR per kg
BASE_PRICES_INR_PER_KG = {
    'laptop': 800,
    'mobile_phone': 600,
    'battery': 150,
    'keyboard': 200,
    'mouse': 150,
    'pcb': 1200,
    'monitor': 400,
    'printer': 300,
    'television': 350,
    'cables': 100,
    'charger_adapter': 200,
    'other_ewaste': 80
}

def generate_synthetic_pricing_dataset(n_samples=2500, random_seed=42):
    np.random.seed(random_seed)
    data = []

    for _ in range(n_samples):
        cat = np.random.choice(CATEGORIES)
        base = BASE_PRICES_INR_PER_KG[cat]

        brand_tier = np.random.choice([0, 1, 2], p=[0.4, 0.4, 0.2])  # generic, mid, premium
        weight_kg = np.clip(np.random.exponential(scale=2.5), 0.1, 40.0)
        age_years = np.clip(np.random.gamma(shape=2, scale=2), 0.5, 15.0)
        condition_score = np.random.choice([1, 2, 3, 4, 5], p=[0.1, 0.2, 0.35, 0.25, 0.1])
        functionality_score = np.random.choice([0, 1, 2], p=[0.3, 0.4, 0.3]) # non_working, partial, working
        missing_components = np.random.choice([0, 1, 2, 3, 4], p=[0.6, 0.2, 0.1, 0.06, 0.04])
        region_tier = np.random.choice([0, 1, 2, 3], p=[0.4, 0.3, 0.2, 0.1]) # metro to rural

        # Price computation formula with realistic multipliers
        cond_mult = 0.4 + (condition_score / 5.0) * 0.6
        func_mult = 0.5 + (functionality_score / 2.0) * 0.7
        age_decay = np.exp(-0.08 * age_years)
        brand_mult = 0.85 + (brand_tier * 0.25)
        missing_decay = max(0.2, 1.0 - (missing_components * 0.15))
        region_mult = 1.05 - (region_tier * 0.05)

        estimated_price = (
            base * weight_kg * cond_mult * func_mult * age_decay * brand_mult * missing_decay * region_mult
        )
        noise = np.random.normal(loc=0.0, scale=0.08 * estimated_price)
        final_price = max(20.0, estimated_price + noise)

        data.append({
            'category': cat,
            'brand_tier': brand_tier,
            'weight_kg': round(weight_kg, 2),
            'age_years': round(age_years, 1),
            'condition_score': condition_score,
            'functionality_score': functionality_score,
            'missing_components': missing_components,
            'region_tier': region_tier,
            'price_inr': round(final_price, 2)
        })

    return pd.DataFrame(data)

def main():
    print("=" * 60)
    print("Training E-Waste Pricing Model (DEMONSTRATION DATA)")
    print("=" * 60)

    df = generate_synthetic_pricing_dataset()
    print(f"Generated {len(df)} synthetic valuation records.")

    le = LabelEncoder()
    df['category_encoded'] = le.fit_transform(df['category'])

    feature_cols = [
        'category_encoded', 'brand_tier', 'weight_kg', 'age_years',
        'condition_score', 'functionality_score', 'missing_components', 'region_tier'
    ]

    X = df[feature_cols]
    y = df['price_inr']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        'Linear Regression': LinearRegression(),
        'Decision Tree': DecisionTreeRegressor(max_depth=8, random_state=42),
        'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42),
        'XGBoost': xgb.XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.08, random_state=42)
    }

    results = {}
    best_model_name = None
    best_rmse = float('inf')
    best_estimator = None

    print("\nModel Benchmark Evaluation:")
    print("-" * 65)
    print(f"{'Model':<20} | {'MAE (INR)':<12} | {'RMSE (INR)':<12} | {'R2 Score':<10}")
    print("-" * 65)

    for name, estimator in models.items():
        if name in ['Linear Regression']:
            estimator.fit(X_train_scaled, y_train)
            preds = estimator.predict(X_test_scaled)
        else:
            estimator.fit(X_train, y_train)
            preds = estimator.predict(X_test)

        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)

        results[name] = {
            'MAE': round(float(mae), 2),
            'RMSE': round(float(rmse), 2),
            'R2': round(float(r2), 4)
        }

        print(f"{name:<20} | {mae:<12.2f} | {rmse:<12.2f} | {r2:<10.4f}")

        if rmse < best_rmse:
            best_rmse = rmse
            best_model_name = name
            best_estimator = estimator

    print("-" * 65)
    print(f"Best Performing Model: {best_model_name} (RMSE: {best_rmse:.2f})")

    # Save artifacts
    save_dir = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
    os.makedirs(save_dir, exist_ok=True)

    model_path = os.path.join(save_dir, 'pricing_model.pkl')
    preproc_path = os.path.join(save_dir, 'pricing_preprocessor.pkl')
    eval_path = os.path.join(save_dir, 'pricing_evaluation.json')

    joblib.dump(best_estimator, model_path)
    joblib.dump({'label_encoder': le, 'scaler': scaler, 'feature_cols': feature_cols}, preproc_path)

    evaluation_meta = {
        'best_model': best_model_name,
        'metrics': results,
        'dataset_size': len(df),
        'disclaimer': 'DEMONSTRATION DATA ONLY - Not guaranteed market appraisal.'
    }

    with open(eval_path, 'w') as f:
        json.dump(evaluation_meta, f, indent=2)

    print(f"\nArtifacts successfully saved:")
    print(f" -> Model: {model_path}")
    print(f" -> Preprocessor: {preproc_path}")
    print(f" -> Evaluation Report: {eval_path}")

if __name__ == '__main__':
    main()
