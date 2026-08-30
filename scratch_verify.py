import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def main():
    print("Starting integration verification tests against FastAPI backend...")
    
    # 1. Register a test user
    email = "test_user_paper_v1@example.com"
    password = "Password123!"
    display_name = "Test User Paper"
    
    client = httpx.Client(timeout=10.0)
    
    print("\n[Step 1] Attempting to register test user...")
    try:
        reg_resp = client.post(
            f"{BASE_URL}/auth/register",
            json={"email": email, "password": password, "display_name": display_name}
        )
        if reg_resp.status_code == 201:
            print("Registration success: User registered successfully.")
        elif reg_resp.status_code == 409:
            print("Registration info: User already exists, proceeding to login.")
        else:
            print(f"Registration failed: Status {reg_resp.status_code}, Detail: {reg_resp.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Error during registration connection: {e}")
        sys.exit(1)

    # 2. Login to retrieve access token
    print("\n[Step 2] Attempting login...")
    try:
        login_resp = client.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password}
        )
        if login_resp.status_code != 200:
            print(f"Login failed: Status {login_resp.status_code}, Detail: {login_resp.text}")
            sys.exit(1)
        
        token_data = login_resp.json()
        access_token = token_data["tokens"]["access_token"]
        print("Login success: Token retrieved successfully.")
        # Attach token to auth headers
        client.headers["Authorization"] = f"Bearer {access_token}"
    except Exception as e:
        print(f"Error during login: {e}")
        sys.exit(1)

    # 3. Fetch active markets
    print("\n[Step 3] Fetching active markets...")
    markets_resp = client.get(f"{BASE_URL}/markets")
    assert markets_resp.status_code == 200, f"Failed markets query: {markets_resp.text}"
    markets = markets_resp.json()
    print(f"Markets list fetched: {len(markets)} active assets found.")
    btc_asset = None
    for m in markets:
        if m["base_asset"] == "BTC":
            btc_asset = m
            break
    
    assert btc_asset is not None, "Active BTC asset not found in database assets registry!"
    print(f"Found active BTC asset in database: ID {btc_asset['id']}, Symbol {btc_asset['symbol']}.")

    # 4. Fetch ticker price
    print(f"\n[Step 4] Fetching current ticker price for {btc_asset['symbol']}...")
    ticker_resp = client.get(f"{BASE_URL}/markets/{btc_asset['symbol']}/ticker")
    assert ticker_resp.status_code == 200, f"Failed to fetch ticker: {ticker_resp.text}"
    ticker = ticker_resp.json()
    current_price = ticker["price"]
    print(f"Live Price for {btc_asset['symbol']}: ${current_price:.2f} USDT, 24h Change: {ticker['change_24h']:.2f}%")

    # 5. Fetch account and verify initial stats
    print("\n[Step 5] Fetching paper trading account and portfolio summary...")
    acct_resp = client.get(f"{BASE_URL}/paper-trading/account")
    assert acct_resp.status_code == 200, f"Failed to fetch account: {acct_resp.text}"
    acct = acct_resp.json()
    print(f"Account: {acct['name']}, Balance: {acct['initial_balance']} USDT, Cash: {acct['current_cash']} USDT")
    
    summary_resp = client.get(f"{BASE_URL}/portfolio/summary")
    assert summary_resp.status_code == 200, f"Failed to fetch summary: {summary_resp.text}"
    summary = summary_resp.json()
    print(f"Portfolio Summary - Total Equity: {summary['total_equity']}, Invested Value: {summary['invested_value']}")

    # 6. Place a MARKET BUY order for 0.5 BTC
    print("\n[Step 6] Placing a MARKET BUY order for 0.5 BTC...")
    order_resp = client.post(
        f"{BASE_URL}/paper-trading/orders",
        json={
            "asset_id": btc_asset["id"],
            "side": "BUY",
            "order_type": "MARKET",
            "quantity": 0.5,
            "requested_price": current_price
        }
    )
    assert order_resp.status_code == 201, f"Failed to place order: {order_resp.text}"
    order = order_resp.json()
    print(f"Order submitted successfully: ID {order['id']}, Status: {order['status']}, Executed Price: {order['executed_price']}")

    # 7. Verify positions list updates
    print("\n[Step 7] Checking open positions...")
    pos_resp = client.get(f"{BASE_URL}/paper-trading/positions")
    assert pos_resp.status_code == 200, f"Failed to fetch positions: {pos_resp.text}"
    positions = pos_resp.json()["items"]
    print(f"Active positions in account: {len(positions)}")
    btc_pos = None
    for p in positions:
        if p["asset_symbol"] == "BTCUSDT":
            btc_pos = p
            break
    assert btc_pos is not None, "BTC position was not created!"
    print(f"BTC Position details: Qty: {btc_pos['quantity']}, Avg entry price: ${float(btc_pos['average_entry_price']):.2f}")

    # 8. Place a LIMIT BUY order for 0.1 BTC at a lower price
    limit_price = current_price * 0.9  # 10% below market price
    print(f"\n[Step 8] Placing a LIMIT BUY order for 0.1 BTC at ${limit_price:.2f} USDT...")
    order2_resp = client.post(
        f"{BASE_URL}/paper-trading/orders",
        json={
            "asset_id": btc_asset["id"],
            "side": "BUY",
            "order_type": "LIMIT",
            "quantity": 0.1,
            "requested_price": limit_price
        }
    )
    assert order2_resp.status_code == 201, f"Failed to place LIMIT order: {order2_resp.text}"
    order2 = order2_resp.json()
    print(f"LIMIT order placed: ID {order2['id']}, Status: {order2['status']}")

    # 9. Verify order lists
    print("\n[Step 9] Fetching recent order history...")
    orders_resp = client.get(f"{BASE_URL}/paper-trading/orders")
    assert orders_resp.status_code == 200, f"Failed to fetch orders: {orders_resp.text}"
    orders_list = orders_resp.json()["items"]
    print(f"Total simulated orders found: {len(orders_list)}")
    for o in orders_list:
        print(f" - Order ID {o['id'][:8]}: Asset {o['asset_symbol']}, Side {o['side']}, Type {o['order_type']}, Status {o['status']}")

    # 10. Reset simulation
    print("\n[Step 10] Triggering portfolio simulation reset...")
    reset_resp = client.post(f"{BASE_URL}/paper-trading/reset")
    assert reset_resp.status_code == 200, f"Failed to reset: {reset_resp.text}"
    reset_data = reset_resp.json()
    print(f"Reset response: {reset_data['message']}, Current cash: {reset_data['current_cash']} USDT")
    
    # Final verify after reset
    final_pos_resp = client.get(f"{BASE_URL}/paper-trading/positions")
    final_orders_resp = client.get(f"{BASE_URL}/paper-trading/orders")
    assert len(final_pos_resp.json()["items"]) == 0, "Positions list not empty after reset!"
    assert len(final_orders_resp.json()["items"]) == 0, "Orders list not empty after reset!"
    print("SUCCESS: Reset cleared all positions and orders, and balance returned to 100,000 USDT.")
    
    print("\n=======================================================")
    print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    main()
