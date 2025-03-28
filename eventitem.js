// app.js
document.addEventListener('DOMContentLoaded', async () => {
    const customValueInput = document.getElementById('customValue');
    const tableContainer = document.getElementById('tableContainer');
    
    // ローカルストレージから値を読み込み
    const savedValue = localStorage.getItem('customValue');
    if (savedValue) customValueInput.value = savedValue;

    // CSVデータの読み込みと処理
    try {
        const [gemData, itemData] = await Promise.all([
            loadCSV('gem.csv'),
            loadCSV('event.csv')
        ]);

        const mergedData = mergeData(gemData, itemData);
        const calculatedData = calculateValue(mergedData, customValueInput.value);
        renderTable(calculatedData);

        // 入力値の変更監視
        customValueInput.addEventListener('input', () => {
            localStorage.setItem('customValue', customValueInput.value);
            const recalculated = calculateValue(mergedData, customValueInput.value);
            renderTable(recalculated);
        });

    } catch (error) {
        tableContainer.innerHTML = `<div class="error">データの読み込みに失敗しました: ${error.message}</div>`;
    }
});

async function loadCSV(filename) {
    const response = await fetch(filename);
    const text = await response.text();
    return parseCSV(text);
}

function parseCSV(csvText) {
    const data = {};
    const rows = csvText.split('\n').filter(row => row.trim());
    
    rows.forEach(row => {
        const [name, ...values] = row.split('\t');
        data[name.trim()] = values.map(Number);
    });
    
    return data;
}

function mergeData(gemData, itemData) {
    const merged = {};
    
    Object.keys(gemData).forEach(name => {
        if (eventData[name]) {
            merged[name] = {
                gemValues: gemData[name],
                eventValue: eventData[name][0]
            };
        }
    });
    
    return merged;
}

function calculateValue(data, customValue) {
    customValue = Number(customValue) || 1000;
    
    return Object.entries(data).map(([name, values]) => {
        const worth = (values.gemValues[1] / customValue) / (values.itemValue / 1000);
        return {
            name,
            gemCount: values.gemValues[0],
            gemValue: values.gemValues[1],
            itemValue: values.itemValue,
            customValue: customValue,
            worth
        };
    }).sort((a, b) => b.worth - a.worth);
}

function renderTable(data) {
    const table = document.createElement('table');
    const header = `<tr>
        <th>アイテム名</th>
        <th>イベントアイテム数</th>
        <th>価値（US）</th>
        <th>価値（自分）</th>
        <th>お得度</th>
        <th>順位</th>
    </tr>`;

    let tbody = '';
    data.forEach((item, index) => {
        tbody += `<tr class="${index < 3 ? `rank-${index + 1}` : ''}">
            <td>${item.name}</td>
            <td class="value-cell">${item.gemCount}</td>
            <td class="value-cell">${item.gemValue}</td>
            <td class="value-cell">${item.customValue}</td>
            <td class="value-cell">${item.worth.toFixed(2)}</td>
            <td class="value-cell">${index + 1}</td>
        </tr>`;
    });

    table.innerHTML = `${header}<tbody>${tbody}</tbody>`;
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}
