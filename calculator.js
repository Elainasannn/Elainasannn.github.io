// js/calculator.js
import { PriceCalculator } from './priceCalculator.js';

class CalculatorUI {
    constructor() {
        this.initializeEventListeners();
        this.createDimensionInputs();
    }

    initializeEventListeners() {
        document.getElementById('shape').addEventListener('change', () => {
            this.createDimensionInputs();
            this.clearResults();
        });

        document.querySelector('.calculate-btn').addEventListener('click', () => {
            this.handleCalculation();
        });
    }

    createDimensionInputs() {
        const container = document.getElementById('dimensionInputs');
        const shape = document.getElementById('shape').value;
        
        const template = {
            square: () => `
                <div class="input-group">
                    <label for="length" class="input-label">長さ (cm)</label>
                    <input type="number" id="length" min="1" max="210" 
                           class="dimension-input" required>
                </div>
                <div class="input-group">
                    <label for="width" class="input-label">幅 (cm)</label>
                    <input type="number" id="width" min="1" max="210" 
                           class="dimension-input" required>
                </div>
            `,
            circle: () => `
                <div class="input-group">
                    <label for="diameter" class="input-label">直径 (cm)</label>
                    <input type="number" id="diameter" min="1" max="210" 
                           class="dimension-input" required>
                </div>
            `
        };

        container.innerHTML = template[shape]();
    }

    async handleCalculation() {
        this.toggleLoading(true);
        this.clearErrors();

        try {
            const params = this.getInputValues();
            const result = PriceCalculator.calculate(params);
            
            if (result.error) throw new Error(result.error);
            
            this.displayResult(result);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.toggleLoading(false);
        }
    }

    getInputValues() {
        const shape = document.getElementById('shape').value;
        const thickness = parseFloat(document.getElementById('thickness').value);
        
        const dimensions = Array.from(document.querySelectorAll('.dimension-input'))
            .reduce((acc, input) => {
                acc[input.id] = parseFloat(input.value);
                return acc;
            }, {});

        return { shape, thickness, ...dimensions };
    }

    displayResult({ price }) {
        document.getElementById('priceValue').textContent = 
            price.toLocaleString('ja-JP');
        document.getElementById('calculationDetails').textContent = 
            `（送料・人件費・利益率を含む総合計算）`;
    }

    toggleLoading(isLoading) {
        const btn = document.querySelector('.calculate-btn');
        btn.setAttribute('aria-busy', isLoading);
        btn.querySelector('.spinner').classList.toggle('hidden', !isLoading);
        btn.querySelector('.btn-text').textContent = 
            isLoading ? '計算中...' : '価格を計算';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = `エラー: ${message}`;
        errorDiv.style.display = 'block';
    }

    clearErrors() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    clearResults() {
        document.getElementById('priceValue').textContent = '---';
    }
}

// 初始化
new CalculatorUI();