// Example Python strategy using momentum and mean reversion with realistic risk management
export const exampleStrategy = `
# Python strategy using momentum and mean reversion with realistic risk management
def strategy(prices, timestamps):
    import numpy as np
    
    # Convert prices to numpy array for faster computation
    prices_array = np.array(prices)
    
    # Calculate basic price statistics
    current_price = prices_array[-1]
    prev_price = prices_array[-2]
    
    # Calculate volatility
    returns = np.diff(prices_array) / prices_array[:-1]
    volatility = np.std(returns[-20:]) * np.sqrt(252)  # Annualized volatility
    
    # Calculate price levels
    high_20 = np.max(prices_array[-20:])
    low_20 = np.min(prices_array[-20:])
    mid_20 = (high_20 + low_20) / 2
    
    # Calculate price momentum
    price_change = (current_price - prev_price) / prev_price * 100
    
    # Calculate trend strength
    sma_20 = np.mean(prices_array[-20:])
    sma_50 = np.mean(prices_array[-50:])
    trend_strength = (sma_20 - sma_50) / sma_50 * 100
    
    # Calculate RSI
    delta = np.diff(prices_array)
    gain = np.where(delta > 0, delta, 0)
    loss = np.where(delta < 0, -delta, 0)
    
    avg_gain = np.mean(gain[-14:])
    avg_loss = np.mean(loss[-14:])
    
    if avg_loss == 0:
        rsi = 100
    else:
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
    
    # Skip if volatility is too high
    if volatility > 0.4:  # More conservative volatility threshold
        return None
    
    # Generate signals with realistic risk management
    # Trend following with clear confirmation
    if (current_price > sma_20 and 
        sma_20 > sma_50 and 
        price_change > 0 and
        rsi > 50 and rsi < 65 and  # Not overbought
        current_price < high_20 * 1.005 and  # Not too extended
        trend_strength > 0.1):  # Clear trend
        return 'buy'
    elif (current_price < sma_20 and 
          sma_20 < sma_50 and 
          price_change < 0 and
          rsi < 50 and rsi > 35 and  # Not oversold
          current_price > low_20 * 0.995 and  # Not too extended
          trend_strength < -0.1):  # Clear trend
        return 'sell'
    
    # Mean reversion with tight risk control
    elif (rsi > 70 and 
          price_change < 0 and
          current_price > high_20 * 1.005 and
          current_price < high_20 * 1.01 and  # Tight range
          volatility < 0.3):  # Low volatility
        return 'sell'
    elif (rsi < 30 and 
          price_change > 0 and
          current_price < low_20 * 0.995 and
          current_price > low_20 * 0.99 and  # Tight range
          volatility < 0.3):  # Low volatility
        return 'buy'
    
    # Volatility breakout with confirmation
    elif (abs(price_change) > volatility * 1.2 and 
          price_change > 0 and
          rsi > 55 and
          current_price > sma_20 and
          trend_strength > 0.05):  # Trend confirmation
        return 'buy'
    elif (abs(price_change) > volatility * 1.2 and 
          price_change < 0 and
          rsi < 45 and
          current_price < sma_20 and
          trend_strength < -0.05):  # Trend confirmation
        return 'sell'
    
    return None  # No signal
`; 