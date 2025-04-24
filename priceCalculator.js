// js/priceCalculator.js
const CONFIG = {
    MAX_DIMENSION: 210,
    EXCHANGE_RATE: 0.045,
    MATERIAL_COSTS: {
        1: { price: 32.5, weight: 1.3 },
        1.5: { price: 44.9, weight: 2 },
        2: { price: 59.8, weight: 2.65 },
        3: { price: 89.7, weight: 3.92 }
    },
    SHIPPING_RATES: {
        standard: { base: 33, perHalfKg: 4 },
        oversized: { base: 36, perHalfKg: 6 }
    }
};

export class PriceCalculator {
    static calculate(params) {
        try {
            const dimensions = this.validateInputs(params);
            const { area, costArea } = this.calculateAreas(params.shape, dimensions);
            const materialCost = this.calculateMaterialCost(costArea, params.thickness);
            const shippingCost = this.calculateShippingCost(area, params.thickness, dimensions);
            return this.formatPrice(materialCost + shippingCost);
        } catch (error) {
            return { error: error.message };
        }
    }

    static validateInputs({ shape, ...dimensions }) {
        const validator = {
            square: () => {
                if (dimensions.width > CONFIG.MAX_DIMENSION || 
                    dimensions.length > CONFIG.MAX_DIMENSION) {
                    throw new Error(`尺寸不得超过${CONFIG.MAX_DIMENSION}cm`);
                }
                return dimensions;
            },
            circle: () => {
                if (dimensions.diameter > CONFIG.MAX_DIMENSION) {
                    throw new Error(`直径不得超过${CONFIG.MAX_DIMENSION}cm`);
                }
                return dimensions;
            }
        };
        return validator[shape]();
    }

    static calculateAreas(shape, dimensions) {
        const calculators = {
            square: () => ({
                area: (dimensions.length * dimensions.width) / 10000,
                costArea: (dimensions.length * dimensions.width) / 10000
            }),
            circle: () => ({
                area: (Math.PI * Math.pow(dimensions.diameter/2, 2)) / 10000,
                costArea: Math.pow(dimensions.diameter, 2) / 10000
            })
        };
        return calculators[shape]();
    }

    static calculateMaterialCost(area, thickness) {
        const baseCost = area * CONFIG.MATERIAL_COSTS[thickness].price;
        return Math.max(Math.ceil(baseCost + 1), 10);
    }

    static calculateShippingCost(area, thickness, dimensions) {
        const weight = area * CONFIG.MATERIAL_COSTS[thickness].weight + 1;
        const shippingType = this.determineShippingType(dimensions);
        
        const rate = CONFIG.SHIPPING_RATES[shippingType];
        const additional = Math.ceil((weight - 0.5) / 0.5);
        return rate.base + additional * rate.perHalfKg;
    }

    static determineShippingType({ length, width, diameter }) {
        const maxDimension = Math.max(length || 0, width || 0, diameter || 0);
        return maxDimension > 140 ? 'oversized' : 'standard';
    }

    static formatPrice(cnyAmount) {
        const jpy = cnyAmount / CONFIG.EXCHANGE_RATE;
        return Math.round(jpy / 100) * 100 + 80;
    }
}