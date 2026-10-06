"""Inference pipeline. Mirrors the notebook's feature engineering EXACTLY - do not edit one without the other."""
import pickle

import numpy as np
import pandas as pd

SKEWED_COLS = ["AvgOccupancy", "TotalRooms", "TotalBedrooms", "NeighborhoodPop", "RoomsPerHousehold"]
SF_COORDS = (37.7749, -122.4194)
LA_COORDS = (34.0522, -118.2437)
PRICE_CAP = 5.00001


def load_bundle(path="model.pkl"):
    with open(path, "rb") as f:
        return pickle.load(f)


def build_features(df_raw, bundle):
    missing = [c for c in bundle["required_inputs"] if c not in df_raw.columns]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

    df = df_raw[bundle["required_inputs"]].copy()
    df = df.apply(pd.to_numeric, errors="coerce")
    if df[["Latitude", "Longitude"]].isna().any().any():
        raise ValueError("Latitude and Longitude must be valid numbers")

    # --- preprocess ---
    df["PropertyAge"] = df["PropertyAge"].fillna(bundle["age_median"])
    df["NeighborhoodPop"] = df["NeighborhoodPop"].clip(lower=0)
    for col in SKEWED_COLS:
        df[col + "_log"] = np.log1p(df[col])

    # --- engineered features ---
    df["PopPerRoom"] = df["NeighborhoodPop"] / (df["TotalRooms"] * df["AvgOccupancy"] + 1e-6)
    df["IncomePerRoom"] = df["IncomeLevel"] / (df["RoomsPerHousehold"] + 1e-6)
    df["DistToSF"] = np.sqrt((df["Latitude"] - SF_COORDS[0]) ** 2 + (df["Longitude"] - SF_COORDS[1]) ** 2)
    df["DistToLA"] = np.sqrt((df["Latitude"] - LA_COORDS[0]) ** 2 + (df["Longitude"] - LA_COORDS[1]) ** 2)
    df["LatLonInteraction"] = df["Latitude"] * df["Longitude"]
    df["RoomsPerBedroom"] = df["TotalRooms"] / (df["TotalBedrooms"] + 1e-6)

    # --- geo clusters + target encoding ---
    coords = df[["Latitude", "Longitude"]]
    df["GeoCluster"] = bundle["kmeans"].predict(coords)
    centers = bundle["kmeans"].cluster_centers_
    df["DistToClusterCenter"] = np.linalg.norm(coords.values - centers[df["GeoCluster"].values], axis=1)
    df["GeoCluster_TE"] = df["GeoCluster"].map(bundle["te_map"]).fillna(bundle["global_mean"]).values

    return df[bundle["feature_cols"]]


def predict_df(df_raw, bundle):
    X = build_features(df_raw, bundle)
    stack = np.column_stack([bundle["models"][n].predict(X) for n in bundle["model_names"]])
    pred = np.expm1(bundle["stacker"].predict(stack))
    return np.clip(pred, 0, PRICE_CAP)
