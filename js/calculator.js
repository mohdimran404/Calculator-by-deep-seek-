// ============================================
// CALCULATOR VAULT - CALCULATOR LOGIC ONLY
// Pure calculator functionality - no vault code here
// ============================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // ====================
    // 1. CALCULATOR STATE
    // ====================
    let currentDisplay = '0';
    let previousValue = null;
    let currentOperator = null;
    let shouldResetDisplay = false;
    let memoryValue = null;

    // ====================
    // 2. DOM ELEMENTS
    // ====================
    const displayElement = document.getElementById('display');
    const memoryElement = document.getElementById('memory');
    const calculatorButtons = document.querySelector('.calculator-buttons');

    // ====================
    // 3. DISPLAY FUNCTIONS
    // ====================
    function updateDisplay() {
        // Format number with commas for thousands
        const formattedNumber = formatNumber(currentDisplay);
        displayElement.textContent = formattedNumber;
        
        // Update memory display if there's a previous operation
        if (previousValue !== null && currentOperator !== null) {
            memoryElement.textContent = `${formatNumber(previousValue)} ${getOperatorSymbol(currentOperator)}`;
        } else {
            memoryElement.textContent = '';
        }
    }

    function formatNumber(numStr) {
        // Remove any existing commas
        const numWithoutCommas = numStr.replace(/,/g, '');
        
        // Handle decimal numbers
        if (numWithoutCommas.includes('.')) {
            const [integerPart, decimalPart] = numWithoutCommas.split('.');
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${formattedInteger}.${decimalPart}`;
        }
        
        // Format integer with commas
        return numWithoutCommas.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function getOperatorSymbol(operator) {
        const symbols = {
            'add': '+',
            'subtract': '−',
            'multiply': '×',
            'divide': '÷',
            'percentage': '%'
        };
        return symbols[operator] || operator;
    }

    // ====================
    // 4. CALCULATION FUNCTIONS
    // ====================
    function calculate() {
        if (previousValue === null || currentOperator === null) return;
        
        const prev = parseFloat(previousValue);
        const current = parseFloat(currentDisplay);
        let result = 0;

        switch (currentOperator) {
            case 'add':
                result = prev + current;
                break;
            case 'subtract':
                result = prev - current;
                break;
            case 'multiply':
                result = prev * current;
                break;
            case 'divide':
                if (current === 0) {
                    alert('Cannot divide by zero');
                    clearCalculator();
                    return;
                }
                result = prev / current;
                break;
            case 'percentage':
                result = prev * (current / 100);
                break;
        }

        // Round to avoid floating point precision issues
        result = Math.round(result * 100000000) / 100000000;
        
        // Update display with result
        currentDisplay = result.toString();
        previousValue = null;
        currentOperator = null;
        shouldResetDisplay = true;
    }

    // ====================
    // 5. INPUT HANDLING
    // ====================
    function inputNumber(number) {
        if (currentDisplay === '0' || shouldResetDisplay) {
            currentDisplay = number;
            shouldResetDisplay = false;
        } else {
            currentDisplay += number;
        }
        updateDisplay();
    }

    function inputDecimal() {
        if (shouldResetDisplay) {
            currentDisplay = '0.';
            shouldResetDisplay = false;
        } else if (!currentDisplay.includes('.')) {
            currentDisplay += '.';
        }
        updateDisplay();
    }

    function inputOperator(operator) {
        if (currentOperator !== null) {
            calculate();
        }
        
        previousValue = currentDisplay;
        currentOperator = operator;
        shouldResetDisplay = true;
        updateDisplay();
    }

    function inputPercentage() {
        const current = parseFloat(currentDisplay);
        currentDisplay = (current / 100).toString();
        updateDisplay();
    }

    function inputBackspace() {
        if (currentDisplay.length === 1) {
            currentDisplay = '0';
        } else {
            currentDisplay = currentDisplay.slice(0, -1);
        }
        updateDisplay();
    }

    function clearCalculator() {
        currentDisplay = '0';
        previousValue = null;
        currentOperator = null;
        shouldResetDisplay = false;
        updateDisplay();
    }

    // ====================
    // 6. BUTTON CLICK HANDLER
    // ====================
    calculatorButtons.addEventListener('click', function(event) {
        // Find the clicked button
        const button = event.target.closest('.btn');
        if (!button) return;

        // Get button type and value
        const number = button.getAttribute('data-number');
        const action = button.getAttribute('data-action');

        // Add button press animation
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 150);

        // Handle different button types
        if (number !== null) {
            inputNumber(number);
        } else if (action) {
            switch (action) {
                case 'add':
                case 'subtract':
                case 'multiply':
                case 'divide':
                    inputOperator(action);
                    break;
                case 'equals':
                    calculate();
                    break;
                case 'decimal':
                    inputDecimal();
                    break;
                case 'percentage':
                    inputPercentage();
                    break;
                case 'backspace':
                    inputBackspace();
                    break;
                case 'clear':
                    clearCalculator();
                    break;
            }
        }
    });

    // ====================
    // 7. KEYBOARD SUPPORT
    // ====================
    document.addEventListener('keydown', function(event) {
        // Only process keys if calculator is visible
        const calculatorSection = document.getElementById('calculatorSection');
        if (!calculatorSection || calculatorSection.style.display === 'none') {
            return;
        }

        const key = event.key;

        // Number keys (0-9)
        if (key >= '0' && key <= '9') {
            inputNumber(key);
        }
        // Decimal point
        else if (key === '.' || key === ',') {
            inputDecimal();
        }
        // Operators
        else if (key === '+') {
            inputOperator('add');
        }
        else if (key === '-') {
            inputOperator('subtract');
        }
        else if (key === '*') {
            inputOperator('multiply');
        }
        else if (key === '/') {
            event.preventDefault(); // Prevent browser find function
            inputOperator('divide');
        }
        // Equals or Enter
        else if (key === '=' || key === 'Enter') {
            event.preventDefault();
            calculate();
        }
        // Escape or Delete for clear
        else if (key === 'Escape' || key === 'Delete') {
            clearCalculator();
        }
        // Backspace
        else if (key === 'Backspace') {
            inputBackspace();
        }
        // Percentage
        else if (key === '%') {
            inputPercentage();
        }
    });

    // ====================
    // 8. INITIALIZATION
    // ====================
    function initializeCalculator() {
        // Set initial display
        updateDisplay();
        
        // Add pressed class animation style
        const style = document.createElement('style');
        style.textContent = `
            .btn.pressed {
                transform: scale(0.95) !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('Calculator initialized - Ready for calculations');
    }

    // Start the calculator
    initializeCalculator();
});

// ====================
// 9. PERFORMANCE NOTES
// ====================
// - Uses event delegation for button clicks (better performance)
// - Prevents multiple decimal points
// - Handles keyboard input for better UX
// - Formats numbers with commas for readability
// - Avoids floating point precision issues with rounding

// Note: This file contains ONLY calculator logic.
// Vault functionality is in separate files to maintain security.
