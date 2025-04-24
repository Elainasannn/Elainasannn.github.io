const fs = require('fs');

// 配置参数
const CONFIG = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 800,
  MIN_WIDTH: 10,
  MAX_WIDTH: 130,
  THICKNESS_OPTIONS: [1, 1.5, 2, 3],
  AREA_STEP: 0.01,
  PRICE_INTERVAL: 100,
  CURRENCY_SUFFIX: 80
};

// 计算参数
const CALC_PARAMS = {
  costRate: { 1: 26, 1.5: 36.1, 2: 48.1, 3: 72.2 },
  weightRate: { 1: 1.3, 1.5: 2, 2: 2.65, 3: 3.92 },
  rates: { staff: 0.03, commission: 0.32, profit: 0.23 },
  exchangeRate: 0.045
};

function generatePriceData() {
  const priceData = {};

  CONFIG.THICKNESS_OPTIONS.forEach(thickness => {
    let currentPriceKey = null;
    let currentMin = 0;
    const intervals = [];
    
    for (let area = CONFIG.AREA_STEP; area <= 10.4; area += CONFIG.AREA_STEP) {
      const price = calculatePrice(area, thickness);
      const priceKey = Math.floor(price / CONFIG.PRICE_INTERVAL) * CONFIG.PRICE_INTERVAL;

      if (priceKey !== currentPriceKey) {
        if (currentPriceKey !== null) {
          intervals.push({
            min: parseFloat(currentMin.toFixed(2)),
            max: parseFloat((area - CONFIG.AREA_STEP).toFixed(2)),
            price: currentPriceKey
          });
        }
        currentPriceKey = priceKey;
        currentMin = area;
      }
    }

    // 添加最后一个区间
    intervals.push({
      min: parseFloat(currentMin.toFixed(2)),
      max: 10.4,
      price: currentPriceKey
    });

    priceData[thickness] = optimizeIntervals(intervals);
  });

  fs.writeFileSync('price-data.json', JSON.stringify(priceData));
}

function calculatePrice(area, thickness) {
  // 材料成本
  const materialCost = area * CALC_PARAMS.costRate[thickness];
  const productCost = Math.max(Math.ceil(materialCost + 1), 10);

  // 重量计算
  const weight = area * CALC_PARAMS.weightRate[thickness];
  const totalWeight = parseFloat((Math.ceil(weight * 10) / 10 + 1).toFixed(1));

  // 运费计算
  let shippingFee = 0;
  if (totalWeight <= 2) {
    shippingFee = 33 + Math.ceil((totalWeight - 0.5) / 0.5) * 4;
  } else if (totalWeight <= 5) {
    shippingFee = 33 + Math.ceil((totalWeight - 0.5) / 0.5) * 5;
  } else if (totalWeight <= 20) {
    shippingFee = 35 + Math.ceil((totalWeight - 0.5) / 0.5) * 5;
  }

  // 最终价格
  const totalCost = productCost + shippingFee;
  const rateSum = CALC_PARAMS.rates.staff + CALC_PARAMS.rates.commission + CALC_PARAMS.rates.profit;
  const finalPriceCNY = totalCost / (1 - rateSum);
  let finalPriceJPY = finalPriceCNY / CALC_PARAMS.exchangeRate;

  // 价格格式调整
  const base = Math.floor(finalPriceJPY / 100) * 100;
  return base + CONFIG.CURRENCY_SUFFIX;
}

function optimizeIntervals(intervals) {
  return intervals.reduce((acc, curr) => {
    const last = acc[acc.length - 1];
    if (last && last.price === curr.price && last.max + 0.01 === curr.min) {
      last.max = curr.max;
    } else {
      acc.push({...curr});
    }
    return acc;
  }, []);
}

generatePriceData();