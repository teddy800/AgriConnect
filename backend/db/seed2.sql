DELETE FROM market_prices;

INSERT INTO market_prices(crop_id, market_id, price, recorded_on)
SELECT c.id, m.id,
       1200 + c.id*380 + m.id*55 + (13-d)*12 + ((c.id*7 + m.id*3 + d*5) % 45),
       CURRENT_DATE - d
FROM crops c, markets m, generate_series(0,13) d;