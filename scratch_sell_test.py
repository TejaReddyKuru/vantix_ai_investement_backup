import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def main():
    email = "test_user_paper_v1@example.com"
    password = "Password123!"
    
    client = httpx.Client(timeout=10.0)
    
    # Login
    login_resp = client.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    if login_resp.status_code != 200:
        print("Login failed")
        sys.exit(1)
        
    access_token = login_resp.json()["tokens"]["access_token"]
    client.headers["Authorization"] = f"Bearer {access_token}"

    # Reset first
    client.post(f"{BASE_URL}/paper-trading/reset")

    # Get markets
    markets = client.get(f"{BASE_URL}/markets").json()
    btc_asset = next(m for m in markets if m["base_asset"] == "BTC")
    
    # Get price
    ticker = client.get(f"{BASE_URL}/markets/{btc_asset['symbol']}/ticker").json()
    price = ticker["price"]

    print(f"Current BTC price: {price}")

    # BUY 0.5 BTC
    print("Placing BUY order...")
    buy_resp = client.post(
        f"{BASE_URL}/paper-trading/orders",
        json={
            "asset_id": btc_asset["id"],
            "side": "BUY",
            "order_type": "MARKET",
            "quantity": 0.5,
            "requested_price": price
        }
    )
    print(f"BUY Response status: {buy_resp.status_code}, content: {buy_resp.text}")
    
    # SELL 0.5 BTC
    print("Placing SELL order...")
    sell_resp = client.post(
        f"{BASE_URL}/paper-trading/orders",
        json={
            "asset_id": btc_asset["id"],
            "side": "SELL",
            "order_type": "MARKET",
            "quantity": 0.5,
            "requested_price": price
        }
    )
    print(f"SELL Response status: {sell_resp.status_code}, content: {sell_resp.text}")

    # Get order history
    orders_resp = client.get(f"{BASE_URL}/paper-trading/orders")
    print(f"Orders Status: {orders_resp.status_code}")
    orders = orders_resp.json()
    print("Orders:")
    for o in orders["items"]:
        print(f" - ID: {o['id']}, Symbol: {o['asset_symbol']}, Side: {o['side']}, Status: {o['status']}")

if __name__ == "__main__":
    main()
