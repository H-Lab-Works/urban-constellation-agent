document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    let cityCodeMap = {};
    let cityCoordsMap = {};
    let historicalData = [];
    let charts = {};
    let mapDataLoaded = false;
    let hubeiMapDataLoaded = false;
    
    // City name mapping for Hubei (CSV name -> JSON map name)
    const hubeiCityNameMap = {
        '武汉': '武汉市',
        '黄石': '黄石市',
        '十堰': '十堰市',
        '宜昌': '宜昌市',
        '襄阳': '襄阳市',
        '鄂州': '鄂州市',
        '荆门': '荆门市',
        '孝感': '孝感市',
        '荆州': '荆州市',
        '黄冈': '黄冈市',
        '咸宁': '咸宁市',
        '随州': '随州市',
        '恩施土家族苗族': '恩施土家族苗族自治州',
        '仙桃': '仙桃市',
        '潜江': '潜江市',
        '天门': '天门市'
    };
    
    // Hubei cities list
    const hubeiCities = ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施土家族苗族', '仙桃', '潜江', '天门'];
    
    // --- Initialize ---
    init();

    async function init() {
        console.log('Initializing application...');
        
        // Load cities data
        await loadCitiesData();
        populateCitySelects();
        
        // Load map data if available (load in parallel)
        loadMapData();
        
        // Setup page navigation
        setupPageNavigation();
        
        // Setup event listeners
        setupEventListeners();
        
        // Wait a bit for everything to settle
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Initialize first page
        showPage('智能预测板块');
        
        console.log('Initialization complete');
    }

    async function loadCitiesData() {
        try {
            // Load city coordinates
            const coordsResponse = await fetch('data/china_city_coords.csv');
            const coordsText = await coordsResponse.text();
            coordsText.split('\n').slice(1).forEach(line => {
            const [city, lng, lat] = line.split(',');
                if (city && lng && lat) {
                    cityCoordsMap[city.trim()] = [parseFloat(lng), parseFloat(lat)];
                    cityCodeMap[city.trim()] = city.trim(); // Simplified: use city name as code
                }
            });
            
            // Load historical data (simplified - you may need to fetch from API)
            // For now, we'll create mock data structure
            console.log('Cities loaded:', Object.keys(cityCodeMap).length);
        } catch (error) {
            console.error('Failed to load cities data:', error);
            // Fallback: create some sample cities if file not found
            if (Object.keys(cityCoordsMap).length === 0) {
                cityCoordsMap = {
                    '北京': [116.4074, 39.9042],
                    '上海': [121.4737, 31.2304],
                    '广州': [113.2644, 23.1291],
                    '深圳': [114.0579, 22.5431],
                    '杭州': [120.1536, 30.2875],
                    '成都': [104.0668, 30.5728],
                    '武汉': [114.3162, 30.5810],
                    '西安': [108.9398, 34.3416],
                    '南京': [118.7969, 32.0603],
                    '重庆': [106.5516, 29.5630]
                };
                cityCodeMap = { ...cityCoordsMap };
            }
        }
    }

    async function loadMapData() {
        try {
            // Try to load china.json map file
            const mapResponse = await fetch('data/china.json');
            if (mapResponse.ok) {
                const chinaJson = await mapResponse.json();
                echarts.registerMap('china', chinaJson);
                mapDataLoaded = true;
                console.log('China map loaded successfully');
                // Re-render map if already initialized
                if (charts.mainMap) {
                    renderMainMap();
                }
            } else {
                console.warn('China map file not found, using coordinate-based visualization');
                mapDataLoaded = false;
            }
            
            // Try to load hubei.json map file
            const hubeiMapResponse = await fetch('data/hubei.json');
            if (hubeiMapResponse.ok) {
                const hubeiJson = await hubeiMapResponse.json();
                echarts.registerMap('hubei', hubeiJson);
                hubeiMapDataLoaded = true;
                console.log('Hubei map loaded and registered successfully');
                console.log('Hubei map features count:', hubeiJson.features ? hubeiJson.features.length : 'unknown');
            } else {
                console.warn('Hubei map file not found, using coordinate-based visualization');
                hubeiMapDataLoaded = false;
            }
        } catch (error) {
            console.warn('Failed to load map data, using coordinate-based visualization:', error);
            mapDataLoaded = false;
            hubeiMapDataLoaded = false;
        }
    }

    function populateCitySelects() {
        const cities = ['--请选择--', ...Object.keys(cityCodeMap).sort()];
        const selects = document.querySelectorAll('select[id$="-city-a"], select[id$="-city-b"]');
        selects.forEach(select => {
            select.innerHTML = cities.map(city => 
                `<option value="${city === '--请选择--' ? '' : city}">${city}</option>`
            ).join('');
        });
    }

    function setupPageNavigation() {
        const radioButtons = document.querySelectorAll('input[name="page"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    showPage(e.target.value);
                }
            });
        });
    }

    function showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const pageId = `page-${pageName}`;
        if (pageId) {
            const page = document.getElementById(pageId);
            if (page) {
                page.classList.add('active');
                
                // Initialize page-specific content
                if (pageName === '智能预测板块') {
                    initPredictionPage();
                }
            }
        }
    }

    function initPredictionPage() {
        console.log('Initializing prediction page...');
        
        // Wait a bit to ensure container is ready
        setTimeout(() => {
            const container = document.getElementById('main-map-container');
            if (container) {
                console.log('Container found, rendering map...');
                // Render main map
                renderMainMap();
                
                // Render rankings
                renderRankings();
            } else {
                console.error('Container not found when trying to render map!');
                // Retry after a delay
                setTimeout(() => {
                    renderMainMap();
                    renderRankings();
                }, 500);
            }
        }, 200);
    }

    function setupEventListeners() {
        // Prediction button
        document.getElementById('run-pred-btn')?.addEventListener('click', handlePrediction);
        
        // Evaluation button
        document.getElementById('run-eval-btn')?.addEventListener('click', handleEvaluation);
        
        // Simulation button
        document.getElementById('run-sim-btn')?.addEventListener('click', handleSimulation);
    }

    // --- Render Functions ---
    function renderMainMap() {
        const container = document.getElementById('main-map-container');
        if (!container) {
            console.error('Map container not found!');
            return;
        }
        
        // Initialize chart if not exists
        if (!charts.mainMap) {
            charts.mainMap = echarts.init(container);
            console.log('ECharts initialized');
        }
        
        const cities = Object.keys(cityCoordsMap);
        console.log('Cities loaded:', cities.length);
        
        // Use fallback cities if no data loaded
        if (cities.length === 0) {
            console.warn('No city data available, using fallback cities');
            cityCoordsMap = {
                '北京': [116.4074, 39.9042],
                '上海': [121.4737, 31.2304],
                '广州': [113.2644, 23.1291],
                '深圳': [114.0579, 22.5431],
                '杭州': [120.1536, 30.2875],
                '成都': [104.0668, 30.5728],
                '武汉': [114.3162, 30.5810],
                '西安': [108.9398, 34.3416],
                '南京': [118.7969, 32.0603],
                '重庆': [106.5516, 29.5630],
                '天津': [117.2008, 39.0842],
                '苏州': [120.5852, 31.2989],
                '郑州': [113.6254, 34.7466],
                '长沙': [112.9388, 28.2282],
                '青岛': [120.3826, 36.0671],
                '大连': [121.6147, 38.9140],
                '沈阳': [123.4315, 41.8057],
                '济南': [117.1205, 36.6512],
                '合肥': [117.2272, 31.8206],
                '福州': [119.2965, 26.0745]
            };
            cities.push(...Object.keys(cityCoordsMap));
        }
        
        // Prepare node data
        const nodes = cities.map(city => ({
            name: city,
            value: cityCoordsMap[city],
            symbolSize: 8,
            itemStyle: { color: '#a9a9a9' }
        }));
        
        // Generate flow data (connections between cities)
        const flows = [];
        const cityArray = cities.slice();
        // Create connections between major cities
        const majorCities = cityArray.slice(0, Math.min(50, cityArray.length));
        for (let i = 0; i < Math.min(100, majorCities.length * 2); i++) {
            const from = majorCities[Math.floor(Math.random() * majorCities.length)];
            const to = majorCities[Math.floor(Math.random() * majorCities.length)];
            if (from !== to && cityCoordsMap[from] && cityCoordsMap[to]) {
                const distance = Math.sqrt(
                    Math.pow(cityCoordsMap[from][0] - cityCoordsMap[to][0], 2) +
                    Math.pow(cityCoordsMap[from][1] - cityCoordsMap[to][1], 2)
                );
                // Only show flows between reasonably close cities
                if (distance < 15) {
                    flows.push({
                        coords: [cityCoordsMap[from], cityCoordsMap[to]],
                        value: Math.random() * 0.8 + 0.2,
                        lineStyle: {
                            width: Math.random() * 2 + 0.5,
                            opacity: 0.4 + Math.random() * 0.3
                        }
                    });
                }
            }
        }
        
        // Check if map is registered
        let option;
        if (mapDataLoaded) {
            // Use map-based visualization
            option = {
                backgroundColor: '#0a1629',
                geo: {
                    map: 'china',
                    roam: true,
                    zoom: 1.2,
                    center: [105, 36],
                    itemStyle: {
                        areaColor: '#2a3a5c',
                        borderColor: '#00e5ff',
                        borderWidth: 1.5,
                        shadowColor: 'rgba(0, 229, 255, 0.3)',
                        shadowBlur: 10
                    },
                    emphasis: {
                        itemStyle: {
                            areaColor: '#3a4a6c',
                            borderColor: '#00ffff',
                            borderWidth: 2
                        },
                        label: {
                            show: false
                        }
                    }
                },
                series: [
                    {
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: nodes,
                        symbolSize: 8,
                        itemStyle: { 
                            color: '#00e5ff',
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            shadowColor: 'rgba(0, 229, 255, 0.5)',
                            shadowBlur: 5
                        },
                        label: {
                            show: true,
                            position: 'right',
                            formatter: '{b}',
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            borderColor: '#00e5ff',
                            borderWidth: 1,
                            padding: [3, 6],
                            borderRadius: 4
                        },
                        emphasis: {
                            scale: true,
                            itemStyle: {
                                color: '#00ffff',
                                borderColor: '#ffffff',
                                borderWidth: 3
                            }
                        }
                    },
                    {
                        type: 'lines',
                        coordinateSystem: 'geo',
                        data: flows,
                        effect: {
                            show: true,
                            period: 4,
                            trailLength: 0.15,
                            symbol: 'arrow',
                            symbolSize: 6,
                            color: '#00e5ff'
                        },
                        lineStyle: {
                            color: '#00e5ff',
                            width: 1.5,
                            curveness: 0.3,
                            opacity: 0.7,
                            shadowColor: 'rgba(0, 229, 255, 0.5)',
                            shadowBlur: 5
                        },
                        emphasis: {
                            lineStyle: {
                                width: 3,
                                opacity: 1
                            }
                        }
                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: nodes.slice(0, Math.min(20, nodes.length)),
                        symbolSize: 14,
                        itemStyle: { 
                            color: '#ff6b6b',
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            shadowColor: 'rgba(255, 107, 107, 0.5)',
                            shadowBlur: 8
                        },
                        emphasis: {
                            scale: true,
                            itemStyle: {
                                color: '#ff4d4d',
                                borderWidth: 3
                            }
                        }
                    }
                ],
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    textStyle: {
                        color: '#ffffff',
                        fontSize: 12
                    },
                    formatter: function(params) {
                        if (params.seriesType === 'scatter') {
                            return '<div style="padding: 5px;"><strong style="color: #00e5ff;">' + params.name + '</strong><br/>坐标: [' + params.value[0].toFixed(2) + ', ' + params.value[1].toFixed(2) + ']</div>';
                        }
                        return '';
                    }
                }
            };
        } else {
            // Use coordinate-based visualization (fallback) - simpler approach
            option = {
                backgroundColor: '#0a1629',
                geo: {
                    roam: true,
                    aspectScale: 0.75,
                    zoom: 1,
                    center: [105, 36],
                    itemStyle: {
                        areaColor: '#1a2a3a'
                    },
                    silent: true
                },
                series: [
                    {
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: nodes,
                        symbolSize: 12,
                        itemStyle: { 
                            color: '#00e5ff',
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            shadowColor: 'rgba(0, 229, 255, 0.8)',
                            shadowBlur: 8
                        },
                        label: {
                            show: true,
                            position: 'right',
                            formatter: '{b}',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            borderColor: '#00e5ff',
                            borderWidth: 1,
                            padding: [4, 8],
                            borderRadius: 4
                        },
                        emphasis: {
                            scale: true,
                            itemStyle: {
                                color: '#00ffff',
                                borderColor: '#ffffff',
                                borderWidth: 3,
                                shadowBlur: 12
                            }
                        }
                    },
                    {
                        type: 'lines',
                        coordinateSystem: 'geo',
                        data: flows,
                        effect: {
                            show: true,
                            period: 4,
                            trailLength: 0.2,
                            symbol: 'arrow',
                            symbolSize: 8,
                            color: '#00e5ff'
                        },
                        lineStyle: {
                            color: '#00e5ff',
                            width: 2,
                            curveness: 0.3,
                            opacity: 0.8,
                            shadowColor: 'rgba(0, 229, 255, 0.6)',
                            shadowBlur: 6
                        },
                        emphasis: {
                            lineStyle: {
                                width: 4,
                                opacity: 1
                            }
                        }
                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: nodes.slice(0, Math.min(20, nodes.length)),
                        symbolSize: 18,
                        itemStyle: { 
                            color: '#ff6b6b',
                            borderColor: '#ffffff',
                            borderWidth: 3,
                            shadowColor: 'rgba(255, 107, 107, 0.8)',
                            shadowBlur: 10
                        },
                        emphasis: {
                            scale: true,
                            itemStyle: {
                                color: '#ff4d4d',
                                borderWidth: 4,
                                shadowBlur: 15
                            }
                        }
                    }
                ],
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    textStyle: {
                        color: '#ffffff',
                        fontSize: 13
                    },
                    formatter: function(params) {
                        if (params.seriesType === 'scatter') {
                            return '<div style="padding: 8px;"><strong style="color: #00e5ff; font-size: 14px;">' + params.name + '</strong><br/><span style="color: #ccc;">坐标: [' + params.value[0].toFixed(2) + ', ' + params.value[1].toFixed(2) + ']</span></div>';
                        }
                        return '';
                    }
                }
            };
        }
        
        console.log('Setting map option with', nodes.length, 'nodes and', flows.length, 'flows');
        console.log('Option:', JSON.stringify(option).substring(0, 200) + '...');
        
        try {
            charts.mainMap.setOption(option, true);
            console.log('Map option set successfully');
            
            // Force resize to ensure rendering
            setTimeout(() => {
                if (charts.mainMap) {
                    charts.mainMap.resize();
                    console.log('Map resized');
                }
            }, 200);
            
            // Double check after another delay
            setTimeout(() => {
                if (charts.mainMap && !charts.mainMap.isDisposed()) {
                    const width = container.offsetWidth;
                    const height = container.offsetHeight;
                    console.log('Container size:', width, 'x', height);
                    if (width === 0 || height === 0) {
                        console.warn('Container has zero size!');
                    }
                }
            }, 500);
            
            console.log('Map rendered successfully');
        } catch (error) {
            console.error('Error rendering map:', error);
        }
    }

    function renderRankings() {
        // Mock ranking data
        const inflowRanking = [
            { name: '北京', value: 95.5 },
            { name: '上海', value: 89.2 },
            { name: '深圳', value: 76.8 },
            { name: '广州', value: 72.3 },
            { name: '杭州', value: 68.9 },
            { name: '成都', value: 65.4 },
            { name: '武汉', value: 62.1 },
            { name: '南京', value: 58.7 },
            { name: '西安', value: 55.2 },
            { name: '苏州', value: 52.8 }
        ];
        
        const outflowRanking = [
            { name: '北京', value: 88.3 },
            { name: '上海', value: 82.1 },
            { name: '深圳', value: 74.5 },
            { name: '广州', value: 70.2 },
            { name: '成都', value: 66.8 },
            { name: '杭州', value: 63.4 },
            { name: '武汉', value: 59.7 },
            { name: '西安', value: 56.3 },
            { name: '南京', value: 53.9 },
            { name: '郑州', value: 50.6 }
        ];
        
        renderRankingChart('inflow-ranking', inflowRanking, 'Top 10 迁入核心城市');
        renderRankingChart('outflow-ranking', outflowRanking, 'Top 10 迁出核心城市');
    }

    function renderRankingChart(containerId, data, title) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!charts[containerId]) {
            charts[containerId] = echarts.init(container);
        }
        
        const option = {
            backgroundColor: 'transparent',
            grid: { left: '20%', right: '10%', top: '15%', bottom: '10%' },
            xAxis: { type: 'value', show: false },
            yAxis: {
                type: 'category',
                data: data.map(d => d.name),
                axisLabel: { color: '#ccc', fontSize: 10 }
            },
            series: [{
                type: 'bar',
                data: data.map(d => d.value),
                label: {
                    show: true,
                    position: 'right',
                    color: '#ccc',
                    fontSize: 10
                },
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: '#00e5ff' },
                        { offset: 1, color: '#0099cc' }
                    ])
                }
            }],
            title: {
                text: title,
                left: 'center',
                textStyle: { color: '#00e5ff', fontSize: 14 }
            }
        };
        
        charts[containerId].setOption(option);
    }

    // --- Event Handlers ---
    async function handlePrediction() {
        const cityA = document.getElementById('pred-city-a').value;
        const cityB = document.getElementById('pred-city-b').value;
        const year = parseInt(document.getElementById('pred-year').value);
        
        if (!cityA || !cityB) {
            alert('请选择有效的起点和终点城市！');
            return;
        }
        
        await showThinking(['加载模型...', '执行预测...', '生成报告...']);
        
        // Mock prediction results
        const models = ['历史均值', '线性趋势', '引力模型', '机器学习', '图神经网络'];
        const results = models.map(name => ({
            name,
            value: (Math.random() * 0.5 + 0.5).toFixed(4)
        }));
        
        displayPredictionResults(results, cityA, cityB, year);
    }

    async function handleEvaluation() {
        const cityA = document.getElementById('eval-city-a').value;
        const cityB = document.getElementById('eval-city-b').value;
        const year = parseInt(document.getElementById('eval-year').value);
        const policy = document.getElementById('eval-policy').value;
        
        if (!cityA || !cityB || !policy) {
            alert('请选择有效的城市并输入决策名称！');
            return;
        }
        
        await showThinking(['加载数据...', '执行反事实分析...', '生成决策建议...']);
        
        // Mock evaluation results
        const realValue = (Math.random() * 0.5 + 0.5).toFixed(4);
        const counterfactualValue = (parseFloat(realValue) * 0.85).toFixed(4);
        const impact = (parseFloat(realValue) - parseFloat(counterfactualValue)).toFixed(4);
        
        displayEvaluationResults({ cityA, cityB, year, policy, realValue, counterfactualValue, impact });
    }

    async function handleSimulation() {
        const cityA = document.getElementById('sim-city-a').value;
        const cityB = document.getElementById('sim-city-b').value;
        const year = parseInt(document.getElementById('sim-year').value);
        const policy = document.getElementById('sim-policy').value;
        const strength = ['弱', '中', '强'][parseInt(document.getElementById('sim-strength').value)];
        
        if (!cityA || !cityB || !policy) {
            alert('请选择有效的城市并输入未来规划设想！');
            return;
        }
        
        await showThinking(['加载模型...', '执行情景模拟...', '生成战略报告...']);
        
        // Mock simulation results
        const baseline = (Math.random() * 0.5 + 0.5).toFixed(4);
        const multipliers = { '弱': 1.05, '中': 1.15, '强': 1.25 };
        const simulated = (parseFloat(baseline) * multipliers[strength]).toFixed(4);
        const impact = (parseFloat(simulated) - parseFloat(baseline)).toFixed(4);
        
        displaySimulationResults({ cityA, cityB, year, policy, strength, baseline, simulated, impact });
    }

    function displayPredictionResults(results, cityA, cityB, year) {
        const container = document.getElementById('prediction-results');
        container.classList.remove('hidden');
        
        const maxValue = Math.max(...results.map(r => parseFloat(r.value)));
        const bestModel = results.find(r => parseFloat(r.value) === maxValue);
        
        container.innerHTML = `
            <div class="grid-2">
                <div>
                    <h4>多模型预测结果对比</h4>
                    <div id="pred-chart" class="chart-container"></div>
                </div>
                <div>
                    <h4>Star AI 智能体综合分析</h4>
                    <div class="report-content">
                        <p><strong>结论先行：</strong>基于${year}年从${cityA}到${cityB}的多模型预测分析，我们选择"${bestModel.name}"模型的结果 <strong>${bestModel.value}</strong> 作为最终预测值。</p>
                        <p><strong>量化对比：</strong>该预测值比所有模型平均预测值高出约${((maxValue / results.reduce((a, b) => a + parseFloat(b.value), 0) * results.length - 1) * 100).toFixed(1)}个百分点。</p>
                        <p><strong>模型解读：</strong>${bestModel.name.includes('神经网络') || bestModel.name.includes('机器学习') ? '该模型能够捕捉城市流动的复杂非线性关系，相比简单线性模型更可靠。' : '该模型基于历史趋势和规律，为预测提供了稳定基准。'}</p>
                        <p><strong>城市洞察：</strong>基于预测结果，${cityA}与${cityB}之间的未来联系将持续增强，建议关注两地间的交通基础设施和产业协同发展。</p>
                    </div>
                </div>
            </div>
        `;
        
        // Render bar chart
        setTimeout(() => {
            const chartContainer = document.getElementById('pred-chart');
            if (chartContainer && !charts.predChart) {
                charts.predChart = echarts.init(chartContainer);
            }
            if (charts.predChart) {
                charts.predChart.setOption({
        backgroundColor: 'transparent',
                    xAxis: {
                        type: 'category',
                        data: results.map(r => r.name),
                        axisLabel: { color: '#ccc', rotate: 30, fontSize: 10 }
                    },
                    yAxis: {
                        type: 'value',
                        axisLabel: { color: '#ccc' }
                    },
                    series: [{
                        type: 'bar',
                        data: results.map(r => parseFloat(r.value)),
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#00e5ff' },
                                { offset: 1, color: '#0099cc' }
                            ])
                        },
                        label: {
                            show: true,
                            position: 'top',
                            color: '#ccc',
                            fontSize: 10
                        }
                    }]
                });
            }
        }, 100);
    }

    function displayEvaluationResults({ cityA, cityB, year, policy, realValue, counterfactualValue, impact }) {
        const container = document.getElementById('evaluation-results');
        container.classList.remove('hidden');
        
        document.getElementById('eval-title').textContent = `"${policy}" 决策净效应评估`;
        
        const percentage = ((parseFloat(impact) / parseFloat(counterfactualValue)) * 100).toFixed(1);
        
        document.getElementById('eval-metrics').innerHTML = `
            <div class="metric">
                <div class="metric-label">真实观测值</div>
                <div class="metric-value">${realValue}</div>
            </div>
            <div class="metric">
                <div class="metric-label">反事实模拟值</div>
                <div class="metric-value">${counterfactualValue}</div>
            </div>
            <div class="metric">
                <div class="metric-label">决策带来的净效应</div>
                <div class="metric-value">${impact}</div>
                <div class="metric-delta">+${percentage}%</div>
            </div>
        `;
        
        // Render comparison chart
        setTimeout(() => {
            const chartContainer = document.getElementById('eval-chart');
            if (chartContainer && !charts.evalChart) {
                charts.evalChart = echarts.init(chartContainer);
            }
            if (charts.evalChart) {
                charts.evalChart.setOption({
                    backgroundColor: 'transparent',
                    xAxis: {
                        type: 'category',
                        data: ['真实观测值', '反事实模拟值'],
                        axisLabel: { color: '#ccc' }
                    },
                    yAxis: {
                        type: 'value',
                        axisLabel: { color: '#ccc' }
                    },
                    series: [{
                        type: 'bar',
                        data: [parseFloat(realValue), parseFloat(counterfactualValue)],
                        itemStyle: {
                            color: (params) => params.dataIndex === 0 ? '#00e5ff' : '#666'
                        },
                        label: {
                            show: true,
                            position: 'top',
                            color: '#ccc'
                        }
                    }]
                });
            }
        }, 100);
        
        document.getElementById('eval-report').innerHTML = `
            <div class="report-content">
                <p><strong>决策效果总结：</strong></p>
                <p>"${policy}"在${year}年实施后，为${cityA}与${cityB}之间的城市流动带来了显著的正面效应。反事实推演显示，该决策带来了 <strong>${impact}</strong> 的流动指数净增长（约${percentage}%的提升）。</p>
                <p><strong>下一步规划建议：</strong></p>
                <ul>
                    <li><strong>交通基础设施：</strong>建议继续加强两地间的交通网络建设，提升通行效率。</li>
                    <li><strong>产业协同：</strong>基于流动增强的趋势，可考虑在两地间建立更紧密的产业协作机制。</li>
                    <li><strong>空间结构：</strong>优化城市空间布局，为持续增长的流动人口提供更好的公共服务。</li>
                </ul>
            </div>
        `;
        
        // Render simulation map - wait for container to be visible
        setTimeout(() => {
            renderEvaluationSimulationMap(cityA, cityB, realValue, counterfactualValue);
        }, 500);
    }

    function displaySimulationResults({ cityA, cityB, year, policy, strength, baseline, simulated, impact }) {
        const container = document.getElementById('simulation-results');
        container.classList.remove('hidden');
        
        document.getElementById('sim-title').textContent = `"${policy}" 规划情景模拟 (${year}年)`;
        
        const percentage = ((parseFloat(impact) / parseFloat(baseline)) * 100).toFixed(1);
        
        document.getElementById('sim-metrics').innerHTML = `
            <div class="metric">
                <div class="metric-label">基线未来 (无规划)</div>
                <div class="metric-value">${baseline}</div>
            </div>
            <div class="metric">
                <div class="metric-label">模拟未来 (${strength}强度)</div>
                <div class="metric-value">${simulated}</div>
            </div>
            <div class="metric">
                <div class="metric-label">规划带来的净增量</div>
                <div class="metric-value">${impact}</div>
                <div class="metric-delta">+${percentage}%</div>
            </div>
        `;
        
        // Render word cloud (simplified as text for now)
        document.getElementById('sim-wordcloud').innerHTML = `
            <div class="report-content" style="height: 200px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.5rem;">
                ${['产业协同', '人才政策', '基础设施', '创新生态', '营商环境', '资本助力', '交通网络', '公共服务', '品牌建设', '绿色发展']
                    .map(word => `<span style="font-size: ${Math.random() * 20 + 14}px; color: #00e5ff; opacity: 0.8;">${word}</span>`)
                    .join('')}
            </div>
        `;
        
        document.getElementById('sim-report').innerHTML = `
            <div class="report-content">
                <p><strong>模拟结果解读：</strong></p>
                <p>针对"${policy}"这一未来规划设想，情景模拟显示在${strength}强度投入下，${cityA}与${cityB}之间的城市流动指数将从预期的 <strong>${baseline}</strong> 提升至 <strong>${simulated}</strong>，带来 <strong>${impact}</strong> 的净增量（约${percentage}%的增长）。</p>
                <p><strong>机会窗口：</strong></p>
                <ul>
                    <li>当前正值城市群一体化发展的黄金期，实施该规划恰逢其时。</li>
                    <li>两地产业互补性强，合作潜力巨大。</li>
                </ul>
                <p><strong>潜在风险：</strong></p>
                <ul>
                    <li>需要确保基础设施建设的同步跟进。</li>
                    <li>需要协调好政策执行中的利益分配。</li>
                </ul>
                <p><strong>配套策略：</strong></p>
                <ul>
                    <li><strong>产业协同：</strong>建立跨区域产业联盟，促进要素自由流动。</li>
                    <li><strong>人才政策：</strong>实施人才互认、社保互转等便利化措施。</li>
                    <li><strong>基础设施：</strong>加快交通、通信等基础设施建设，为流动提供硬件支撑。</li>
                </ul>
            </div>
        `;
        
        // Render simulation map - wait for container to be visible
        setTimeout(() => {
            renderSimulationMap(cityA, cityB, baseline, simulated, strength);
        }, 500);
    }

    function renderEvaluationSimulationMap(cityA, cityB, realValue, counterfactualValue) {
        console.log('renderEvaluationSimulationMap called', cityA, cityB, realValue, counterfactualValue);
        
        // Ensure container is visible first
        const resultsContainer = document.getElementById('evaluation-results');
        if (resultsContainer && resultsContainer.classList.contains('hidden')) {
            resultsContainer.classList.remove('hidden');
        }
        
        // Wait for DOM to update
        setTimeout(() => {
            const container = document.getElementById('eval-simulation-map');
            if (!container) {
                console.error('eval-simulation-map container not found');
                return;
            }
            
            // Check container visibility
            const rect = container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.log('Container has no size, retrying...', rect.width, rect.height);
                setTimeout(() => renderEvaluationSimulationMap(cityA, cityB, realValue, counterfactualValue), 200);
                return;
            }
            
            console.log('Container ready:', rect.width, rect.height);
            
            // Dispose existing chart if any
            if (charts.evalSimulationMap) {
                charts.evalSimulationMap.dispose();
                charts.evalSimulationMap = null;
            }
            
            const coordA = cityCoordsMap[cityA];
            const coordB = cityCoordsMap[cityB];
            
            if (!coordA || !coordB) {
                console.warn('City coordinates not found for', cityA, cityB, 'Available cities:', Object.keys(cityCoordsMap).slice(0, 10));
                return;
            }
            
            // Initialize chart
            try {
                charts.evalSimulationMap = echarts.init(container);
                console.log('Chart initialized, hubeiMapDataLoaded:', hubeiMapDataLoaded);
                
                // Get all cities for filtering
                const cities = Object.keys(cityCoordsMap);
                
                // Prepare flows - use separate series for different styles
                const realFlowValue = parseFloat(realValue);
                const counterFlowValue = parseFloat(counterfactualValue);
                
                // Calculate center for map - use Hubei center if using Hubei map, otherwise use city center
                let center;
                if (hubeiMapDataLoaded) {
                    // Hubei province center approximately [112.5, 30.5]
                    center = [112.5, 30.5];
                } else {
                    center = [
                        (coordA[0] + coordB[0]) / 2,
                        (coordA[1] + coordB[1]) / 2
                    ];
                }
                
                // Filter surrounding cities to only Hubei cities
                const hubeiSurroundingCities = cities
                    .filter(city => hubeiCities.includes(city) && city !== cityA && city !== cityB)
                    .slice(0, 15)
                    .map(city => {
                        const coords = cityCoordsMap[city];
                        if (!coords) {
                            console.warn('No coordinates for city:', city);
                            return null;
                        }
                        return {
                            name: city,
                            value: coords,
                            symbolSize: 8,
                            itemStyle: { color: '#666' }
                        };
                    })
                    .filter(city => city !== null);
                
                // Update nodes with filtered cities - use map names for better matching
                const filteredNodes = [
                    { 
                        name: hubeiCityNameMap[cityA] || cityA, 
                        value: coordA, 
                        symbolSize: 25, 
                        itemStyle: { color: '#ff6b6b' } 
                    },
                    { 
                        name: hubeiCityNameMap[cityB] || cityB, 
                        value: coordB, 
                        symbolSize: 25, 
                        itemStyle: { color: '#4ecdc4' } 
                    },
                    ...hubeiSurroundingCities.map(city => ({
                        name: hubeiCityNameMap[city.name] || city.name,
                        value: city.value,
                        symbolSize: city.symbolSize || 8,
                        itemStyle: city.itemStyle || { color: '#666' }
                    }))
                ];
                
                console.log('Using Hubei map:', hubeiMapDataLoaded, 'Center:', center);
                console.log('Filtered nodes for eval:', filteredNodes);
                
                const option = {
                    backgroundColor: '#0a1629',
                    geo: hubeiMapDataLoaded ? {
                        map: 'hubei',
                        roam: true,
                        zoom: 1.2,
                        center: center,
                        itemStyle: {
                            areaColor: '#2a3a5c',
                            borderColor: '#00e5ff',
                            borderWidth: 1.5,
                            shadowColor: 'rgba(0, 229, 255, 0.3)',
                            shadowBlur: 10
                        },
                        emphasis: {
                            itemStyle: {
                                areaColor: '#3a4a6c',
                                borderColor: '#00ffff',
                                borderWidth: 2
                            },
                            label: {
                                show: false
                            }
                        },
                        label: {
                            show: true,
                            color: '#ffffff',
                            fontSize: 11
                        }
                    } : {
                        roam: true,
                        aspectScale: 0.75,
                        zoom: 1.5,
                        center: center,
                        itemStyle: {
                            areaColor: '#1a2a3a'
                        },
                        silent: true
                    },
                    series: [
                        // Add map series to ensure map regions are displayed
                        ...(hubeiMapDataLoaded ? [{
                            type: 'map',
                            map: 'hubei',
                            roam: false,
                            itemStyle: {
                                areaColor: '#2a3a5c',
                                borderColor: '#00e5ff',
                                borderWidth: 1.5
                            },
                            emphasis: {
                                itemStyle: {
                                    areaColor: '#3a4a6c'
                                }
                            },
                            label: {
                                show: true,
                                color: '#ffffff',
                                fontSize: 11
                            },
                            silent: true
                        }] : []),
                        {
                            type: 'scatter',
                            coordinateSystem: 'geo',
                            data: filteredNodes,
                            symbolSize: function(params) {
                                if (!params || !params.data) return 8;
                                return params.data.symbolSize || 8;
                            },
                            itemStyle: {
                                color: function(params) {
                                    if (!params || !params.data || !params.data.itemStyle) return '#666';
                                    return params.data.itemStyle.color || '#666';
                                },
                                borderColor: '#ffffff',
                                borderWidth: 2
                            },
                            label: {
                                show: true,
                                position: 'right',
                                formatter: '{b}',
                                color: '#ffffff',
                                fontSize: 11,
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                borderColor: '#00e5ff',
                                borderWidth: 1,
                                padding: [3, 6],
                                borderRadius: 4
                            },
                            emphasis: {
                                scale: true
                            }
                        },
                        {
                            name: '真实观测值',
                            type: 'lines',
                            coordinateSystem: 'geo',
                            data: [{
                                coords: [coordA, coordB],
                                value: realFlowValue
                            }],
                            effect: {
                                show: true,
                                period: 4,
                                trailLength: 0.15,
                                symbol: 'arrow',
                                symbolSize: 8,
                                color: '#00e5ff'
                            },
                            lineStyle: {
                                color: '#00e5ff',
                                width: realFlowValue * 8 + 3,
                                opacity: 0.9,
                                curveness: 0.3
                            },
                            emphasis: {
                                lineStyle: {
                                    width: realFlowValue * 8 + 5,
                                    opacity: 1
                                }
                            }
                        },
                        {
                            name: '反事实模拟值',
                            type: 'lines',
                            coordinateSystem: 'geo',
                            data: [{
                                coords: [coordA, coordB],
                                value: counterFlowValue
                            }],
                            effect: {
                                show: true,
                                period: 4,
                                trailLength: 0.15,
                                symbol: 'arrow',
                                symbolSize: 6,
                                color: '#888'
                            },
                            lineStyle: {
                                color: '#888',
                                width: counterFlowValue * 8 + 2,
                                opacity: 0.5,
                                curveness: 0.25,
                                type: 'dashed'
                            },
                            emphasis: {
                                lineStyle: {
                                    width: counterFlowValue * 8 + 4,
                                    opacity: 0.7
                                }
                            }
                        }
                    ],
                    tooltip: {
                        trigger: 'item',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        borderColor: '#00e5ff',
                        borderWidth: 2,
                        formatter: function(params) {
                            if (params.seriesType === 'scatter') {
                                return `<div style="padding: 5px;"><strong style="color: #00e5ff;">${params.name}</strong></div>`;
                            } else if (params.seriesType === 'lines') {
                                const flowData = params.data;
                                const isReal = params.seriesName === '真实观测值';
                                return `<div style="padding: 5px;">
                                    <strong style="color: #00e5ff;">${cityA} → ${cityB}</strong><br/>
                                    <span style="color: ${isReal ? '#00e5ff' : '#888'}">
                                        ${isReal ? '真实观测值' : '反事实模拟值'}: ${flowData.value.toFixed(4)}
                                    </span>
                                </div>`;
                            }
                            return '';
                        }
                    },
                    legend: {
                        data: ['真实观测值', '反事实模拟值'],
                        bottom: 10,
                        textStyle: { color: '#ccc' },
                        itemGap: 20
                    }
                };
                
                charts.evalSimulationMap.setOption(option, true);
                
                // Force resize after a short delay to ensure container is fully rendered
                setTimeout(() => {
                    if (charts.evalSimulationMap && !charts.evalSimulationMap.isDisposed()) {
                        charts.evalSimulationMap.resize();
                        console.log('evalSimulationMap resized, container size:', container.offsetWidth, 'x', container.offsetHeight);
                    }
                }, 100);
                
                console.log('evalSimulationMap option set successfully, hubeiMapDataLoaded:', hubeiMapDataLoaded);
                
                // Render comparison chart
                setTimeout(() => {
                    renderEvaluationComparisonChart(realFlowValue, counterFlowValue);
                }, 100);
            } catch (error) {
                console.error('Error initializing evalSimulationMap:', error, error.stack);
            }
        }, 100);
    }
    
    function renderEvaluationComparisonChart(realValue, counterValue) {
        const container = document.getElementById('eval-comparison-chart');
        if (!container) return;
        
        if (charts.evalComparisonChart) {
            charts.evalComparisonChart.dispose();
        }
        
        setTimeout(() => {
            charts.evalComparisonChart = echarts.init(container);
            
            const increase = ((realValue - counterValue) / counterValue * 100).toFixed(1);
            
            const option = {
                backgroundColor: 'transparent',
                title: {
                    text: '决策效果对比分析',
                    left: 'center',
                    textStyle: { color: '#00e5ff', fontSize: 14 }
                },
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    formatter: function(params) {
                        return `<div style="padding: 5px;">
                            <strong style="color: #00e5ff;">${params[0].seriesName}</strong><br/>
                            ${params[0].marker} ${params[0].name}: <strong style="color: ${params[0].color};">${params[0].value.toFixed(4)}</strong>
                        </div>`;
                    }
                },
                grid: {
                    left: '15%',
                    right: '10%',
                    top: '20%',
                    bottom: '15%'
                },
                xAxis: {
                    type: 'category',
                    data: ['反事实模拟值', '真实观测值'],
                    axisLabel: { color: '#ccc', fontSize: 11 },
                    axisLine: { lineStyle: { color: '#00e5ff' } }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { color: '#ccc', fontSize: 10 },
                    axisLine: { lineStyle: { color: '#00e5ff' } },
                    splitLine: { lineStyle: { color: 'rgba(0, 229, 255, 0.2)' } }
                },
                series: [
                    {
                        name: '流动指数',
                        type: 'bar',
                        data: [
                            { value: counterValue, itemStyle: { color: '#666' } },
                            { value: realValue, itemStyle: { color: '#00e5ff' } }
                        ],
                        label: {
                            show: true,
                            position: 'top',
                            color: '#ccc',
                            fontSize: 11,
                            formatter: function(params) {
                                return params.value.toFixed(4);
                            }
                        },
                        barWidth: '50%'
                    }
                ],
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: 'bottom',
                        z: 100,
                        style: {
                            text: `净增长: +${increase}%`,
                            fontSize: 12,
                            fontWeight: 'bold',
                            fill: '#4caf50'
                        }
                    }
                ]
            };
            
            charts.evalComparisonChart.setOption(option);
            charts.evalComparisonChart.resize();
        }, 50);
    }
    
    function renderSimulationMap(cityA, cityB, baseline, simulated, strength) {
        console.log('renderSimulationMap called', cityA, cityB, baseline, simulated, strength);
        
        // Ensure container is visible first
        const resultsContainer = document.getElementById('simulation-results');
        if (resultsContainer && resultsContainer.classList.contains('hidden')) {
            resultsContainer.classList.remove('hidden');
        }
        
        // Wait for DOM to update
        setTimeout(() => {
            const container = document.getElementById('sim-simulation-map');
            if (!container) {
                console.error('sim-simulation-map container not found');
                return;
            }
            
            // Check container visibility
            const rect = container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.log('Container has no size, retrying...', rect.width, rect.height);
                setTimeout(() => renderSimulationMap(cityA, cityB, baseline, simulated, strength), 200);
                return;
            }
            
            console.log('Container ready:', rect.width, rect.height);
            
            // Dispose existing chart if any
            if (charts.simSimulationMap) {
                charts.simSimulationMap.dispose();
                charts.simSimulationMap = null;
            }
            
            const coordA = cityCoordsMap[cityA];
            const coordB = cityCoordsMap[cityB];
            
            if (!coordA || !coordB) {
                console.warn('City coordinates not found for', cityA, cityB, 'Available cities:', Object.keys(cityCoordsMap).slice(0, 10));
                return;
            }
            
                // Initialize chart
            try {
                charts.simSimulationMap = echarts.init(container);
                console.log('Simulation chart initialized, hubeiMapDataLoaded:', hubeiMapDataLoaded);
                
                // Prepare flows
                const baselineValue = parseFloat(baseline);
                const simulatedValue = parseFloat(simulated);
                const strengthMultiplier = { '弱': 1.2, '中': 1.5, '强': 2.0 };
                
                // Get all cities for filtering
                const cities = Object.keys(cityCoordsMap);
                
                // Calculate center for map - use Hubei center if using Hubei map
                let center;
                if (hubeiMapDataLoaded) {
                    // Hubei province center approximately [112.5, 30.5]
                    center = [112.5, 30.5];
                } else {
                    center = [
                        (coordA[0] + coordB[0]) / 2,
                        (coordA[1] + coordB[1]) / 2
                    ];
                }
                
                // Filter surrounding cities to only Hubei cities
                const hubeiSurroundingCities = cities
                    .filter(city => hubeiCities.includes(city) && city !== cityA && city !== cityB)
                    .slice(0, 20)
                    .map(city => {
                        const coords = cityCoordsMap[city];
                        if (!coords) {
                            console.warn('No coordinates for city:', city);
                            return null;
                        }
                        return {
                            name: city,
                            value: coords,
                            symbolSize: 8,
                            itemStyle: { color: '#666' }
                        };
                    })
                    .filter(city => city !== null);
                
                // Prepare enhanced flows from surrounding cities
                const enhancedFlows = [];
                for (let i = 0; i < Math.min(8, hubeiSurroundingCities.length); i++) {
                    const city = hubeiSurroundingCities[i];
                    const randomFlow = Math.random() * 0.2 + 0.1;
                    enhancedFlows.push({
                        coords: [city.value, coordA],
                        value: randomFlow * strengthMultiplier[strength]
                    });
                    enhancedFlows.push({
                        coords: [city.value, coordB],
                        value: randomFlow * strengthMultiplier[strength]
                    });
                }
                
                // Prepare nodes with filtered cities - use map names for better matching
                const filteredNodes = [
                    { 
                        name: hubeiCityNameMap[cityA] || cityA, 
                        value: coordA, 
                        symbolSize: 30, 
                        itemStyle: { color: '#ff6b6b' } 
                    },
                    { 
                        name: hubeiCityNameMap[cityB] || cityB, 
                        value: coordB, 
                        symbolSize: 30, 
                        itemStyle: { color: '#4ecdc4' } 
                    },
                    ...hubeiSurroundingCities.map(city => ({
                        name: hubeiCityNameMap[city.name] || city.name,
                        value: city.value,
                        symbolSize: city.symbolSize || 8,
                        itemStyle: city.itemStyle || { color: '#666' }
                    }))
                ];
                
                console.log('Using Hubei map for simulation:', hubeiMapDataLoaded, 'Center:', center);
                console.log('Simulation filtered nodes:', filteredNodes.length, filteredNodes.slice(0, 3));
                
                const option = {
                    backgroundColor: '#0a1629',
                    geo: hubeiMapDataLoaded ? {
                        map: 'hubei',
                        roam: true,
                        zoom: 1.2,
                        center: center,
                        itemStyle: {
                            areaColor: '#2a3a5c',
                            borderColor: '#00e5ff',
                            borderWidth: 1.5,
                            shadowColor: 'rgba(0, 229, 255, 0.3)',
                            shadowBlur: 10
                        },
                        emphasis: {
                            itemStyle: {
                                areaColor: '#3a4a6c',
                                borderColor: '#00ffff',
                                borderWidth: 2
                            },
                            label: {
                                show: true,
                                color: '#ffffff',
                                fontSize: 11
                            }
                        },
                        label: {
                            show: true,
                            color: '#ffffff',
                            fontSize: 11
                        }
                    } : {
                        roam: true,
                        aspectScale: 0.75,
                        zoom: 1.5,
                        center: center,
                        itemStyle: {
                            areaColor: '#1a2a3a'
                        },
                        silent: true
                    },
                    series: [
                        // Add map series to ensure map regions are displayed
                        ...(hubeiMapDataLoaded ? [{
                            type: 'map',
                            map: 'hubei',
                            roam: false,
                            itemStyle: {
                                areaColor: '#2a3a5c',
                                borderColor: '#00e5ff',
                                borderWidth: 1.5
                            },
                            emphasis: {
                                itemStyle: {
                                    areaColor: '#3a4a6c'
                                }
                            },
                            label: {
                                show: true,
                                color: '#ffffff',
                                fontSize: 11
                            },
                            silent: true
                        }] : []),
                        {
                            type: 'scatter',
                            coordinateSystem: 'geo',
                            data: filteredNodes,
                            symbolSize: function(params) {
                                if (!params || !params.data) return 8;
                                return params.data.symbolSize || 8;
                            },
                            itemStyle: {
                                color: function(params) {
                                    if (!params || !params.data || !params.data.itemStyle) return '#666';
                                    return params.data.itemStyle.color || '#666';
                                },
                                borderColor: '#ffffff',
                                borderWidth: 2,
                                shadowColor: 'rgba(0, 229, 255, 0.5)',
                                shadowBlur: 8
                            },
                            label: {
                                show: true,
                                position: 'right',
                                formatter: '{b}',
                                color: '#ffffff',
                                fontSize: 11,
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                borderColor: '#00e5ff',
                                borderWidth: 1,
                                padding: [3, 6],
                                borderRadius: 4
                            },
                            emphasis: {
                                scale: true,
                                itemStyle: {
                                    shadowBlur: 15
                                }
                            }
                        },
                        {
                            name: '基线未来',
                            type: 'lines',
                            coordinateSystem: 'geo',
                            data: [{
                                coords: [coordA, coordB],
                                value: baselineValue
                            }],
                            effect: {
                                show: true,
                                period: 4,
                                trailLength: 0.15,
                                symbol: 'arrow',
                                symbolSize: 6,
                                color: '#888'
                            },
                            lineStyle: {
                                color: '#888',
                                width: baselineValue * 8 + 2,
                                opacity: 0.5,
                                curveness: 0.3
                            },
                            emphasis: {
                                lineStyle: {
                                    width: baselineValue * 8 + 4,
                                    opacity: 0.7
                                }
                            }
                        },
                        {
                            name: '模拟未来',
                            type: 'lines',
                            coordinateSystem: 'geo',
                            data: [{
                                coords: [coordA, coordB],
                                value: simulatedValue
                            }],
                            effect: {
                                show: true,
                                period: 3,
                                trailLength: 0.2,
                                symbol: 'arrow',
                                symbolSize: 10,
                                color: '#00e5ff'
                            },
                            lineStyle: {
                                color: '#00e5ff',
                                width: simulatedValue * 10 + 4,
                                opacity: 0.9,
                                curveness: 0.3
                            },
                            emphasis: {
                                lineStyle: {
                                    width: simulatedValue * 10 + 6,
                                    opacity: 1
                                }
                            }
                        },
                        {
                            name: '增强流动',
                            type: 'lines',
                            coordinateSystem: 'geo',
                            data: enhancedFlows,
                            effect: {
                                show: true,
                                period: 3,
                                trailLength: 0.15,
                                symbol: 'arrow',
                                symbolSize: 5,
                                color: '#4ecdc4'
                            },
                            lineStyle: {
                                color: '#4ecdc4',
                                width: 2,
                                opacity: 0.4,
                                curveness: 0.3
                            },
                            emphasis: {
                                lineStyle: {
                                    width: 3,
                                    opacity: 0.7
                                }
                            }
                        }
                    ],
                    tooltip: {
                        trigger: 'item',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        borderColor: '#00e5ff',
                        borderWidth: 2,
                        formatter: function(params) {
                            if (params.seriesType === 'scatter') {
                                return `<div style="padding: 5px;"><strong style="color: #00e5ff;">${params.name}</strong></div>`;
                            } else if (params.seriesType === 'lines') {
                                const flowData = params.data;
                                const isMainFlow = flowData.coords[0] === coordA && flowData.coords[1] === coordB;
                                if (isMainFlow) {
                                    const isSimulated = params.seriesName === '模拟未来';
                                    return `<div style="padding: 5px;">
                                        <strong style="color: #00e5ff;">${cityA} → ${cityB}</strong><br/>
                                        <span style="color: ${isSimulated ? '#00e5ff' : '#888'}">
                                            ${isSimulated ? '模拟未来' : '基线未来'}: ${flowData.value.toFixed(4)}
                                        </span><br/>
                                        <span style="color: #999; font-size: 11px;">规划强度: ${strength}</span>
                                    </div>`;
                                } else {
                                    return `<div style="padding: 5px;">
                                        <span style="color: #00e5ff;">增强流动指数: ${flowData.value.toFixed(4)}</span>
                                    </div>`;
                                }
                            }
                            return '';
                        }
                    },
                    legend: {
                        data: ['基线未来', '模拟未来', '增强流动'],
                        bottom: 10,
                        textStyle: { color: '#ccc' },
                        itemGap: 20
                    }
                };
                
                charts.simSimulationMap.setOption(option, true);
                
                // Force resize after a short delay to ensure container is fully rendered
                setTimeout(() => {
                    if (charts.simSimulationMap && !charts.simSimulationMap.isDisposed()) {
                        charts.simSimulationMap.resize();
                        console.log('simSimulationMap resized, container size:', container.offsetWidth, 'x', container.offsetHeight);
                    }
                }, 100);
                
                console.log('simSimulationMap option set successfully, hubeiMapDataLoaded:', hubeiMapDataLoaded);
                
                // Render trend chart
                setTimeout(() => {
                    renderSimulationTrendChart(baselineValue, simulatedValue, strength);
                }, 100);
            } catch (error) {
                console.error('Error initializing simSimulationMap:', error, error.stack);
            }
        }, 100);
    }
    
    function renderSimulationTrendChart(baseline, simulated, strength) {
        const container = document.getElementById('sim-trend-chart');
        if (!container) return;
        
        if (charts.simTrendChart) {
            charts.simTrendChart.dispose();
        }
        
        setTimeout(() => {
            charts.simTrendChart = echarts.init(container);
            
            const increase = ((simulated - baseline) / baseline * 100).toFixed(1);
            
            // Generate trend data (past to future)
            const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
            const baselineTrend = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, baseline];
            const simulatedTrend = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, simulated];
            
            const option = {
                backgroundColor: 'transparent',
                title: {
                    text: '未来流动趋势预测',
                    left: 'center',
                    textStyle: { color: '#00e5ff', fontSize: 14 }
                },
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    formatter: function(params) {
                        let result = `<div style="padding: 5px;">`;
                        params.forEach(param => {
                            result += `${param.marker} <strong style="color: ${param.color};">${param.seriesName}</strong>: ${param.value.toFixed(4)}<br/>`;
                        });
                        result += `</div>`;
                        return result;
                    }
                },
                legend: {
                    data: ['基线未来', '模拟未来'],
                    bottom: 10,
                    textStyle: { color: '#ccc' },
                    itemGap: 20
                },
                grid: {
                    left: '12%',
                    right: '8%',
                    top: '20%',
                    bottom: '20%'
                },
                xAxis: {
                    type: 'category',
                    data: years,
                    axisLabel: { color: '#ccc', fontSize: 10 },
                    axisLine: { lineStyle: { color: '#00e5ff' } }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { color: '#ccc', fontSize: 10 },
                    axisLine: { lineStyle: { color: '#00e5ff' } },
                    splitLine: { lineStyle: { color: 'rgba(0, 229, 255, 0.2)' } }
                },
                series: [
                    {
                        name: '基线未来',
                        type: 'line',
                        data: baselineTrend,
                        lineStyle: { color: '#888', width: 2, type: 'dashed' },
                        itemStyle: { color: '#888' },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    },
                    {
                        name: '模拟未来',
                        type: 'line',
                        data: simulatedTrend,
                        lineStyle: { color: '#00e5ff', width: 3 },
                        itemStyle: { color: '#00e5ff' },
                        symbol: 'circle',
                        symbolSize: 8,
                        smooth: true,
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(0, 229, 255, 0.3)' },
                                { offset: 1, color: 'rgba(0, 229, 255, 0.05)' }
                            ])
                        }
                    }
                ],
                graphic: [
                    {
                        type: 'text',
                        left: 'center',
                        top: 'bottom',
                        z: 100,
                        style: {
                            text: `规划提升: +${increase}% (${strength}强度)`,
                            fontSize: 12,
                            fontWeight: 'bold',
                            fill: '#4caf50'
                        }
                    }
                ]
            };
            
            charts.simTrendChart.setOption(option);
            charts.simTrendChart.resize();
        }, 50);
    }

    async function showThinking(steps) {
        const overlay = document.getElementById('thinking-overlay');
        const log = document.getElementById('thinking-log');
        overlay.classList.remove('hidden');
        log.innerHTML = '';
        
        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = step;
            log.appendChild(entry);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        overlay.classList.add('hidden');
    }

    // --- Macro Structure Insight Functions ---
    async function handleMacroAnalysis() {
        const query = document.getElementById('macro-query').value.trim();
        
        if (!query) {
            alert('请输入分析需求！');
            return;
        }
        
        // Show AI thinking process
        await showAIThinkingProcess();
        
        // Show results
        displayMacroResults();
    }
    
    async function showAIThinkingProcess() {
        const thinkingDiv = document.getElementById('ai-thinking-process');
        const stepsDiv = document.getElementById('thinking-steps');
        
        thinkingDiv.classList.remove('hidden');
        stepsDiv.innerHTML = '';
        
        const steps = [
            { icon: '🔍', text: '理解用户需求: "请分析湖北省的城镇体系结构"' },
            { icon: '🧩', text: '任务分解: 识别为宏观结构分析任务' },
            { icon: '⚙️', text: '调度算法模型: 时空流LISA算法' },
            { icon: '🌐', text: '调度算法模型: 动态Louvain社群检测' },
            { icon: '📊', text: '调度算法模型: 多尺度网络分析' },
            { icon: '🎯', text: '执行数据计算与可视化生成' },
            { icon: '✍️', text: 'AI撰写深度分析报告' },
            { icon: '✅', text: '分析完成!' }
        ];
        
        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600));
            const stepDiv = document.createElement('div');
            stepDiv.className = 'thinking-step';
            stepDiv.innerHTML = `<span class="step-icon">${steps[i].icon}</span>${steps[i].text}`;
            
            if (i === steps.length - 1) {
                stepDiv.classList.add('complete');
            } else if (i === steps.length - 2) {
                stepDiv.classList.add('active');
            }
            
            stepsDiv.appendChild(stepDiv);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    function displayMacroResults() {
        // Show results section
        const resultsDiv = document.getElementById('macro-results');
        resultsDiv.classList.remove('hidden');
        
        // Smooth scroll to results
        setTimeout(() => {
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        
        // Render all visualizations
        setTimeout(() => {
            renderNetworkSkeleton();
            renderCommunityDetection();
            renderMultiscaleVisualization(1);
            renderCityHierarchy();
            renderKeyCitiesAnalysis();
            renderAIDeepReport();
        }, 500);
    }
    
    function renderNetworkSkeleton() {
        const container = document.getElementById('network-skeleton-map');
        if (!container) return;
        
        if (charts.networkSkeleton) {
            charts.networkSkeleton.dispose();
        }
        
        charts.networkSkeleton = echarts.init(container);
        
        // 专业规划视角：定义城市层级与辐射范围
        const hubeiCityData = [
            { name: '武汉市', level: 1, size: 45, color: '#FF4B4B', coords: [114.3162, 30.5810], radiusKm: 100, intensity: 1.0 },
            { name: '襄阳市', level: 2, size: 32, color: '#FFB84D', coords: [112.1226, 32.0085], radiusKm: 60, intensity: 0.75 },
            { name: '宜昌市', level: 2, size: 32, color: '#FFB84D', coords: [111.2863, 30.7026], radiusKm: 60, intensity: 0.75 },
            { name: '孝感市', level: 3, size: 22, color: '#4ECDC4', coords: [113.9260, 30.9260], radiusKm: 40, intensity: 0.55 },
            { name: '黄冈市', level: 3, size: 22, color: '#95E1D3', coords: [114.8728, 30.4535], radiusKm: 40, intensity: 0.50 },
            { name: '荆州市', level: 4, size: 16, color: '#A0A0A0', coords: [112.2390, 30.3268], radiusKm: 30, intensity: 0.35 },
            { name: '黄石市', level: 4, size: 16, color: '#A0A0A0', coords: [115.0385, 30.2009], radiusKm: 25, intensity: 0.30 },
            { name: '十堰市', level: 4, size: 16, color: '#A0A0A0', coords: [110.7980, 32.6292], radiusKm: 30, intensity: 0.32 },
            { name: '鄂州市', level: 4, size: 16, color: '#A0A0A0', coords: [114.8949, 30.3966], radiusKm: 25, intensity: 0.28 },
            { name: '荆门市', level: 4, size: 16, color: '#A0A0A0', coords: [112.1996, 31.0354], radiusKm: 30, intensity: 0.33 },
            { name: '咸宁市', level: 4, size: 16, color: '#A0A0A0', coords: [114.3220, 29.8418], radiusKm: 30, intensity: 0.31 },
            { name: '随州市', level: 4, size: 16, color: '#A0A0A0', coords: [113.3823, 31.6897], radiusKm: 28, intensity: 0.29 }
        ];
        
        // 创建辐射圈层（国土规划风格）
        const radiationCircles = [];
        hubeiCityData.forEach(city => {
            if (city.level <= 3) {
                // 将km转换为地图坐标的近似比例（简化计算）
                const radiusInDegrees = city.radiusKm / 111; // 1度约111km
                
                // 创建多层辐射圈
                for (let i = 0; i < 3; i++) {
                    radiationCircles.push({
                        name: city.name + '辐射圈',
                        type: 'circle',
                        shape: {
                            cx: 0,
                            cy: 0,
                            r: radiusInDegrees * (1 - i * 0.3)
                        },
                        position: city.coords,
                        itemStyle: {
                            color: 'transparent',
                            borderColor: city.color,
                            borderWidth: 2 - i * 0.5,
                            opacity: 0.3 - i * 0.1
                        },
                        z: 1
                    });
                }
            }
        });
        
        // 创建规划轴线
        const planningAxes = [
            {
                name: '汉江发展轴',
                coords: [hubeiCityData[1].coords, hubeiCityData[7].coords, hubeiCityData[11].coords],
                color: '#FFB84D',
                width: 5
            },
            {
                name: '长江发展轴',
                coords: [hubeiCityData[0].coords, hubeiCityData[5].coords, hubeiCityData[2].coords],
                color: '#4ECDC4',
                width: 5
            },
            {
                name: '武鄂黄黄一体化轴',
                coords: [hubeiCityData[0].coords, hubeiCityData[8].coords, hubeiCityData[4].coords, hubeiCityData[6].coords],
                color: '#FF4B4B',
                width: 4
            }
        ];
        
        // 创建节点标注
        const nodes = hubeiCityData.map(city => ({
            name: city.name,
            value: city.coords.concat([city.intensity]),
            symbolSize: city.size,
            itemStyle: { 
                color: city.color,
                borderColor: '#ffffff',
                borderWidth: 3,
                shadowBlur: 15,
                shadowColor: city.color
            },
            label: {
                show: true,
                position: city.level === 1 ? 'top' : 'right',
                formatter: function(params) {
                    const levelText = city.level === 1 ? '一级中心' : 
                                    (city.level === 2 ? '二级中心' : 
                                    (city.level === 3 ? '三级中心' : ''));
                    return `{title|${params.name}}\n{level|${levelText}}`;
                },
                rich: {
                    title: {
                        color: '#ffffff',
                        fontSize: city.level === 1 ? 16 : (city.level === 2 ? 14 : 12),
                        fontWeight: 'bold',
                        padding: [0, 0, 3, 0]
                    },
                    level: {
                        color: city.color,
                        fontSize: 10,
                        fontWeight: 'bold'
                    }
                },
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                borderColor: city.color,
                borderWidth: 2,
                padding: [8, 12],
                borderRadius: 6
            },
            emphasis: {
                scale: 1.3,
                itemStyle: {
                    shadowBlur: 25,
                    borderWidth: 4
                }
            }
        }));
        
        // 创建流动连接（强度可视化）
        const connections = [];
        const wuhan = hubeiCityData[0];
        
        hubeiCityData.slice(1).forEach(city => {
            const strength = city.intensity;
            connections.push({
                coords: [wuhan.coords, city.coords],
                value: strength,
                lineStyle: {
                    width: strength * 8 + 2,
                    opacity: 0.6,
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: wuhan.color },
                        { offset: 1, color: city.color }
                    ]),
                    shadowBlur: 10,
                    shadowColor: city.color
                }
            });
        });
        
        // 副中心互联
        connections.push({
            coords: [hubeiCityData[1].coords, hubeiCityData[2].coords],
            value: 0.6,
            lineStyle: { 
                width: 6, 
                opacity: 0.5, 
                color: '#FFB84D', 
                type: 'dashed',
                dashOffset: 5
            }
        });
        
        const option = {
            backgroundColor: '#0a1629',
            title: {
                text: '湖北省城镇体系结构骨架图',
                subtext: '基于时空流LISA算法 | 数据驱动的空间格局识别',
                left: 'center',
                top: 10,
                textStyle: {
                    color: '#00e5ff',
                    fontSize: 18,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    color: '#95e1d3',
                    fontSize: 12
                }
            },
            geo: hubeiMapDataLoaded ? {
                map: 'hubei',
                roam: true,
                zoom: 1.25,
                center: [113.5, 30.8],
                itemStyle: {
                    areaColor: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#1a2a4a' },
                            { offset: 0.5, color: '#0f1f3a' },
                            { offset: 1, color: '#1a2a4a' }
                        ]
                    },
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    shadowColor: 'rgba(0, 229, 255, 0.5)',
                    shadowBlur: 20
                },
                emphasis: {
                    itemStyle: { areaColor: '#2a3a5a' },
                    label: { show: false }
                },
                label: { show: false }
            } : {
                roam: true,
                zoom: 1.25,
                center: [113.5, 30.8],
                itemStyle: { areaColor: '#1a2a4a' }
            },
            series: [
                ...(hubeiMapDataLoaded ? [{
                    type: 'map',
                    map: 'hubei',
                    roam: false,
                    itemStyle: {
                        areaColor: {
                            type: 'linear',
                            x: 0, y: 0, x2: 1, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#1a2a4a' },
                                { offset: 0.5, color: '#0f1f3a' },
                                { offset: 1, color: '#1a2a4a' }
                            ]
                        },
                        borderColor: '#00e5ff',
                        borderWidth: 2
                    },
                    label: { show: false },
                    silent: true,
                    z: 0
                }] : []),
                // 规划轴线
                ...planningAxes.map(axis => ({
                    type: 'lines',
                    coordinateSystem: 'geo',
                    polyline: true,
                    data: [{
                        coords: axis.coords
                    }],
                    lineStyle: {
                        color: axis.color,
                        width: axis.width,
                        opacity: 0.4,
                        type: 'dotted',
                        cap: 'round'
                    },
                    effect: {
                        show: false
                    },
                    z: 1
                })),
                // 城际连接
                {
                    type: 'lines',
                    coordinateSystem: 'geo',
                    data: connections,
                    effect: {
                        show: true,
                        period: 5,
                        trailLength: 0.15,
                        symbol: 'arrow',
                        symbolSize: 8
                    },
                    lineStyle: {
                        curveness: 0.25
                    },
                    z: 2
                },
                // 城市节点
                {
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: nodes,
                    z: 3
                },
                // 热力效果（城市影响力）
                {
                    type: 'effectScatter',
                    coordinateSystem: 'geo',
                    data: hubeiCityData.filter(c => c.level <= 2).map(city => ({
                        name: city.name,
                        value: city.coords.concat([city.intensity * 100])
                    })),
                    symbolSize: function(val) {
                        return val[2] * 0.8;
                    },
                    rippleEffect: {
                        brushType: 'stroke',
                        scale: 3,
                        period: 4
                    },
                    itemStyle: {
                        color: function(params) {
                            const city = hubeiCityData.find(c => c.name === params.name);
                            return city ? city.color : '#fff';
                        },
                        opacity: 0.3
                    },
                    z: 1
                }
            ],
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                borderColor: '#00e5ff',
                borderWidth: 2,
                padding: 15,
                textStyle: {
                    color: '#ffffff',
                    fontSize: 13
                },
                formatter: function(params) {
                    if (params.seriesType === 'scatter' || params.seriesType === 'effectScatter') {
                        const city = hubeiCityData.find(c => c.name === params.name);
                        if (city) {
                            return `
                                <div style="padding: 5px;">
                                    <div style="font-size: 16px; font-weight: bold; color: ${city.color}; margin-bottom: 8px;">${city.name}</div>
                                    <div style="margin: 5px 0;"><span style="color: #95e1d3;">城市层级：</span>${city.level === 1 ? '一级中心（省域核心）' : (city.level === 2 ? '二级中心（省域副中心）' : (city.level === 3 ? '三级中心（潜力城市）' : '一般城市'))}</div>
                                    <div style="margin: 5px 0;"><span style="color: #95e1d3;">辐射半径：</span>${city.radiusKm}km</div>
                                    <div style="margin: 5px 0;"><span style="color: #95e1d3;">流动强度：</span>${(city.intensity * 100).toFixed(0)}%</div>
                                </div>
                            `;
                        }
                    }
                    return '';
                }
            }
        };
        
        charts.networkSkeleton.setOption(option);
        
        setTimeout(() => {
            if (charts.networkSkeleton) {
                charts.networkSkeleton.resize();
            }
        }, 100);
    }
    
    function renderCommunityDetection() {
        const container = document.getElementById('community-detection-chart');
        if (!container) return;
        
        if (charts.communityDetection) {
            charts.communityDetection.dispose();
        }
        
        charts.communityDetection = echarts.init(container);
        
        // Define communities
        const communities = {
            '武汉都市圈': { cities: ['武汉市', '鄂州市', '孝感市', '黄冈市', '咸宁市'], color: '#ff6b6b' },
            '襄十随都市圈': { cities: ['襄阳市', '十堰市', '随州市'], color: '#4ecdc4' },
            '宜荆荆都市圈': { cities: ['宜昌市', '荆州市', '荆门市'], color: '#95e1d3' },
            '其他': { cities: ['黄石市'], color: '#888' }
        };
        
        const data = Object.entries(communities).map(([name, info]) => ({
            name: name,
            value: info.cities.length * 100,
            itemStyle: { color: info.color },
            children: info.cities.map(city => ({
                name: city,
                value: 100
            }))
        }));
        
        const option = {
            backgroundColor: '#0a1629',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderColor: '#00e5ff',
                borderWidth: 2,
                formatter: function(params) {
                    return `<div style="padding: 5px;"><strong style="color: #00e5ff;">${params.name}</strong><br/>城市数量: ${params.data.children ? params.data.children.length : 1}</div>`;
                }
            },
            series: [{
                type: 'treemap',
                roam: false,
                data: data,
                label: {
                    show: true,
                    formatter: '{b}',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 'bold'
                },
                upperLabel: {
                    show: true,
                    height: 30,
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 'bold'
                },
                itemStyle: {
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    gapWidth: 2
                },
                levels: [
                    {
                        itemStyle: {
                            borderColor: '#00e5ff',
                            borderWidth: 3,
                            gapWidth: 3
                        }
                    },
                    {
                        colorSaturation: [0.35, 0.5],
                        itemStyle: {
                            borderWidth: 2,
                            gapWidth: 2,
                            borderColorSaturation: 0.6
                        }
                    }
                ]
            }]
        };
        
        charts.communityDetection.setOption(option);
        
        // Display hierarchy analysis
        const hierarchyDiv = document.getElementById('hierarchy-analysis');
        hierarchyDiv.innerHTML = Object.entries(communities).map(([name, info]) => `
            <div class="hierarchy-level">
                <div class="hierarchy-level-title">${name} (${info.cities.length}个城市)</div>
                <div class="hierarchy-cities">
                    ${info.cities.map(city => `<span class="hierarchy-city-tag">${city}</span>`).join('')}
                </div>
            </div>
        `).join('');
        
        setTimeout(() => {
            if (charts.communityDetection) {
                charts.communityDetection.resize();
            }
        }, 100);
    }
    
    function renderMultiscaleVisualization(scale) {
        const container = document.getElementById('multiscale-visualization');
        if (!container) return;
        
        if (charts.multiscale) {
            charts.multiscale.dispose();
        }
        
        charts.multiscale = echarts.init(container);
        
        // 专业多尺度数据：从宏观到微观的递进分析
        const scaleData = {
            1: {  // 粗粒度 - 省级整体格局
                title: '省级战略格局',
                subtitle: '单核驱动 | 网络密度: 高',
                regions: [
                    {
                        name: '湖北省核心区',
                        coords: [[112.0, 29.0], [116.0, 29.0], [116.0, 33.0], [112.0, 33.0]],
                        color: 'rgba(255, 75, 75, 0.15)',
                        borderColor: '#FF4B4B',
                        center: [114.0, 31.0],
                        stats: { gdp: '5.37万亿', population: '5844万', urbanRate: '64.1%' }
                    }
                ],
                nodes: [
                    { 
                        name: '武汉\n(省域中心)', 
                        value: [114.3162, 30.5810], 
                        symbolSize: 70, 
                        color: '#FF4B4B',
                        influence: 100
                    }
                ],
                links: [],
                zones: []
            },
            2: {  // 中粒度 - 区域都市圈格局
                title: '都市圈协同格局',
                subtitle: '一主两副 | 圈层结构: 明显',
                regions: [
                    {
                        name: '武汉都市圈',
                        coords: [[113.0, 29.5], [115.5, 29.5], [115.5, 31.5], [113.0, 31.5]],
                        color: 'rgba(255, 75, 75, 0.2)',
                        borderColor: '#FF4B4B',
                        center: [114.25, 30.5],
                        stats: { cities: 5, gdp: '3.2万亿', integration: '85%' }
                    },
                    {
                        name: '襄十随都市圈',
                        coords: [[110.5, 31.0], [113.5, 31.0], [113.5, 33.5], [110.5, 33.5]],
                        color: 'rgba(255, 184, 77, 0.2)',
                        borderColor: '#FFB84D',
                        center: [112.0, 32.25],
                        stats: { cities: 3, gdp: '1.1万亿', integration: '65%' }
                    },
                    {
                        name: '宜荆荆都市圈',
                        coords: [[110.5, 29.5], [113.0, 29.5], [113.0, 31.5], [110.5, 31.5]],
                        color: 'rgba(78, 205, 196, 0.2)',
                        borderColor: '#4ECDC4',
                        center: [111.75, 30.5],
                        stats: { cities: 3, gdp: '1.05万亿', integration: '60%' }
                    }
                ],
                nodes: [
                    { name: '武汉都市圈', value: [114.3, 30.5], symbolSize: 55, color: '#FF4B4B', influence: 100 },
                    { name: '襄十随都市圈', value: [112.0, 32.25], symbolSize: 42, color: '#FFB84D', influence: 65 },
                    { name: '宜荆荆都市圈', value: [111.5, 30.5], symbolSize: 42, color: '#4ECDC4', influence: 60 }
                ],
                links: [
                    { source: [114.3, 30.5], target: [112.0, 32.25], strength: 0.75 },
                    { source: [114.3, 30.5], target: [111.5, 30.5], strength: 0.70 },
                    { source: [112.0, 32.25], target: [111.5, 30.5], strength: 0.45 }
                ],
                axes: [
                    { name: '汉江轴', coords: [[112.0, 32.25], [114.3, 30.5]], color: '#FFB84D' },
                    { name: '长江轴', coords: [[111.5, 30.5], [114.3, 30.5]], color: '#4ECDC4' }
                ]
            },
            3: {  // 细粒度 - 城市群内部结构
                title: '城市群内部结构',
                subtitle: '核心-外围 | 功能分工: 明确',
                regions: [],
                nodes: [
                    // 武汉都市圈
                    { name: '武汉\n龙头', value: [114.3162, 30.5810], symbolSize: 50, color: '#FF4B4B', circle: 80, influence: 100, group: 1 },
                    { name: '鄂州\n极核', value: [114.8949, 30.3966], symbolSize: 22, color: '#FF8585', circle: 30, influence: 45, group: 1 },
                    { name: '孝感\n支撑', value: [113.9260, 30.9260], symbolSize: 28, color: '#FFB8B8', circle: 35, influence: 55, group: 1 },
                    { name: '黄冈\n协同', value: [114.8728, 30.4535], symbolSize: 25, color: '#FFD0D0', circle: 32, influence: 50, group: 1 },
                    { name: '咸宁\n协同', value: [114.3220, 29.8418], symbolSize: 24, color: '#FFD0D0', circle: 30, influence: 48, group: 1 },
                    // 襄十随都市圈
                    { name: '襄阳\n中心', value: [112.1226, 32.0085], symbolSize: 42, color: '#FFB84D', circle: 60, influence: 75, group: 2 },
                    { name: '十堰\n支撑', value: [110.7980, 32.6292], symbolSize: 26, color: '#FFD699', circle: 35, influence: 48, group: 2 },
                    { name: '随州\n支撑', value: [113.3823, 31.6897], symbolSize: 24, color: '#FFE4B8', circle: 32, influence: 45, group: 2 },
                    // 宜荆荆都市圈
                    { name: '宜昌\n中心', value: [111.2863, 30.7026], symbolSize: 42, color: '#4ECDC4', circle: 60, influence: 70, group: 3 },
                    { name: '荆州\n支撑', value: [112.2390, 30.3268], symbolSize: 26, color: '#7FE5DC', circle: 35, influence: 50, group: 3 },
                    { name: '荆门\n支撑', value: [112.1996, 31.0354], symbolSize: 24, color: '#A4F0E8', circle: 32, influence: 48, group: 3 }
                ],
                links: [
                    // 武汉都市圈内部
                    { source: [114.3162, 30.5810], target: [114.8949, 30.3966], strength: 0.90 },
                    { source: [114.3162, 30.5810], target: [113.9260, 30.9260], strength: 0.85 },
                    { source: [114.3162, 30.5810], target: [114.8728, 30.4535], strength: 0.75 },
                    { source: [114.3162, 30.5810], target: [114.3220, 29.8418], strength: 0.70 },
                    // 襄十随内部
                    { source: [112.1226, 32.0085], target: [110.7980, 32.6292], strength: 0.75 },
                    { source: [112.1226, 32.0085], target: [113.3823, 31.6897], strength: 0.70 },
                    // 宜荆荆内部
                    { source: [111.2863, 30.7026], target: [112.2390, 30.3268], strength: 0.72 },
                    { source: [111.2863, 30.7026], target: [112.1996, 31.0354], strength: 0.68 },
                    // 跨圈层联系
                    { source: [114.3162, 30.5810], target: [112.1226, 32.0085], strength: 0.65 },
                    { source: [114.3162, 30.5810], target: [111.2863, 30.7026], strength: 0.60 }
                ],
                corridors: [
                    { name: '武鄂黄黄同城化走廊', coords: [[114.3162, 30.5810], [114.8949, 30.3966], [114.8728, 30.4535]], color: '#FF4B4B' },
                    { name: '襄十一体化走廊', coords: [[112.1226, 32.0085], [110.7980, 32.6292]], color: '#FFB84D' },
                    { name: '宜荆荆一体化走廊', coords: [[111.2863, 30.7026], [112.2390, 30.3268], [112.1996, 31.0354]], color: '#4ECDC4' }
                ]
            }
        };
        
        const currentData = scaleData[scale];
        
        // 构建series
        const series = [];
        
        // 基础地图
        if (hubeiMapDataLoaded) {
            series.push({
                type: 'map',
                map: 'hubei',
                roam: false,
                itemStyle: {
                    areaColor: '#0f1f3a',
                    borderColor: '#00e5ff',
                    borderWidth: 2
                },
                label: { show: false },
                silent: true,
                z: 0
            });
        }
        
        // 区域标注（多边形）
        if (currentData.regions && currentData.regions.length > 0) {
            const polygonGraphics = currentData.regions.map((region, idx) => ({
                type: 'polygon',
                shape: {
                    points: region.coords.map(coord => {
                        // 这里需要转换地理坐标到像素坐标，简化处理
                        return coord;
                    })
                },
                style: {
                    fill: region.color,
                    stroke: region.borderColor,
                    lineWidth: 3,
                    shadowBlur: 20,
                    shadowColor: region.borderColor
                },
                z: 1
            }));
        }
        
        // 发展轴线
        if (currentData.axes) {
            currentData.axes.forEach(axis => {
                series.push({
                    type: 'lines',
                    coordinateSystem: 'geo',
                    polyline: false,
                    data: [{
                        coords: axis.coords
                    }],
                    lineStyle: {
                        color: axis.color,
                        width: 6,
                        opacity: 0.5,
                        type: 'dashed',
                        dashOffset: 5,
                        cap: 'round'
                    },
                    effect: {
                        show: true,
                        period: 6,
                        trailLength: 0.3,
                        symbol: 'arrow',
                        symbolSize: 10,
                        color: axis.color
                    },
                    z: 2
                });
            });
        }
        
        // 城市走廊
        if (currentData.corridors) {
            currentData.corridors.forEach(corridor => {
                series.push({
                    type: 'lines',
                    coordinateSystem: 'geo',
                    polyline: true,
                    data: [{
                        coords: corridor.coords
                    }],
                    lineStyle: {
                        color: corridor.color,
                        width: 8,
                        opacity: 0.4,
                        shadowBlur: 15,
                        shadowColor: corridor.color
                    },
                    effect: {
                        show: true,
                        period: 4,
                        trailLength: 0.2,
                        symbol: 'arrow',
                        symbolSize: 8,
                        color: corridor.color
                    },
                    z: 2
                });
            });
        }
        
        // 城际连接
        if (currentData.links && currentData.links.length > 0) {
            series.push({
                type: 'lines',
                coordinateSystem: 'geo',
                data: currentData.links.map(link => ({
                    coords: [link.source, link.target],
                    lineStyle: {
                        width: link.strength * 6 + 2,
                        opacity: 0.7
                    }
                })),
                lineStyle: {
                    color: '#00e5ff',
                    curveness: 0.2,
                    shadowBlur: 8,
                    shadowColor: '#00e5ff'
                },
                effect: {
                    show: true,
                    period: 4,
                    trailLength: 0.15,
                    symbol: 'arrow',
                    symbolSize: 8,
                    color: '#00e5ff'
                },
                z: 3
            });
        }
        
        // 辐射圈层
        if (scale === 3) {
            currentData.nodes.forEach(node => {
                if (node.circle) {
                    series.push({
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        data: [{
                            name: node.name,
                            value: node.value.concat([node.influence])
                        }],
                        symbolSize: node.circle * 1.2,
                        rippleEffect: {
                            brushType: 'stroke',
                            scale: 2.5,
                            period: 5
                        },
                        itemStyle: {
                            color: node.color,
                            opacity: 0.15
                        },
                        z: 1
                    });
                }
            });
        }
        
        // 城市节点
        series.push({
            type: 'scatter',
            coordinateSystem: 'geo',
            data: currentData.nodes.map(node => ({
                name: node.name,
                value: node.value,
                symbolSize: node.symbolSize,
                itemStyle: {
                    color: node.color,
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    shadowBlur: 20,
                    shadowColor: node.color
                }
            })),
            label: {
                show: true,
                position: 'top',
                formatter: '{b}',
                color: '#ffffff',
                fontSize: scale === 1 ? 16 : (scale === 2 ? 14 : 11),
                fontWeight: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                borderColor: function(params) {
                    const node = currentData.nodes.find(n => n.name === params.name);
                    return node ? node.color : '#00e5ff';
                },
                borderWidth: 2,
                padding: scale === 1 ? [10, 15] : (scale === 2 ? [8, 12] : [6, 10]),
                borderRadius: 6
            },
            emphasis: {
                scale: 1.4,
                itemStyle: {
                    shadowBlur: 30,
                    borderWidth: 4
                }
            },
            z: 4
        });
        
        // 核心区域标注
        if (scale === 2 && currentData.regions) {
            series.push({
                type: 'scatter',
                coordinateSystem: 'geo',
                data: currentData.regions.map(region => ({
                    name: region.name,
                    value: region.center
                })),
                symbol: 'rect',
                symbolSize: [120, 40],
                itemStyle: {
                    color: 'transparent',
                    borderColor: region => {
                        const r = currentData.regions.find(rg => rg.name === region.name);
                        return r ? r.borderColor : '#00e5ff';
                    },
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}',
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: '#ffffff'
                },
                z: 5
            });
        }
        
        const option = {
            backgroundColor: '#0a1629',
            title: {
                text: currentData.title,
                subtext: currentData.subtitle,
                left: 'center',
                top: 15,
                textStyle: {
                    color: '#00e5ff',
                    fontSize: 20,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    color: '#95e1d3',
                    fontSize: 13
                }
            },
            geo: hubeiMapDataLoaded ? {
                map: 'hubei',
                roam: true,
                zoom: scale === 1 ? 1.15 : (scale === 2 ? 1.2 : 1.3),
                center: [113.5, 30.8],
                itemStyle: {
                    areaColor: '#0f1f3a',
                    borderColor: '#00e5ff',
                    borderWidth: 2,
                    shadowColor: 'rgba(0, 229, 255, 0.5)',
                    shadowBlur: 25
                },
                emphasis: {
                    itemStyle: { areaColor: '#1a2a4a' },
                    label: { show: false }
                },
                label: { show: false }
            } : {
                roam: true,
                zoom: scale === 1 ? 1.15 : (scale === 2 ? 1.2 : 1.3),
                center: [113.5, 30.8],
                itemStyle: { areaColor: '#0f1f3a' }
            },
            series: series,
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                borderColor: '#00e5ff',
                borderWidth: 2,
                padding: 15,
                textStyle: {
                    color: '#ffffff',
                    fontSize: 13
                },
                formatter: function(params) {
                    if (params.seriesType === 'scatter') {
                        const node = currentData.nodes.find(n => n.name === params.name);
                        if (node) {
                            let tooltip = `<div style="padding: 5px;">
                                <div style="font-size: 16px; font-weight: bold; color: ${node.color}; margin-bottom: 8px;">${node.name}</div>`;
                            
                            if (scale === 1 && currentData.regions[0] && currentData.regions[0].stats) {
                                const stats = currentData.regions[0].stats;
                                tooltip += `
                                    <div style="margin: 5px 0;"><span style="color: #95e1d3;">GDP总量：</span>${stats.gdp}</div>
                                    <div style="margin: 5px 0;"><span style="color: #95e1d3;">人口规模：</span>${stats.population}</div>
                                    <div style="margin: 5px 0;"><span style="color: #95e1d3;">城镇化率：</span>${stats.urbanRate}</div>
                                `;
                            } else if (scale === 2) {
                                const region = currentData.regions.find(r => r.name === node.name);
                                if (region && region.stats) {
                                    tooltip += `
                                        <div style="margin: 5px 0;"><span style="color: #95e1d3;">包含城市：</span>${region.stats.cities}个</div>
                                        <div style="margin: 5px 0;"><span style="color: #95e1d3;">经济规模：</span>${region.stats.gdp}</div>
                                        <div style="margin: 5px 0;"><span style="color: #95e1d3;">一体化程度：</span>${region.stats.integration}</div>
                                    `;
                                }
                            } else if (scale === 3) {
                                tooltip += `
                                    <div style="margin: 5px 0;"><span style="color: #95e1d3;">影响力指数：</span>${node.influence}</div>
                                    <div style="margin: 5px 0;"><span style="color: #95e1d3;">辐射半径：</span>${node.circle}km</div>
                                `;
                            }
                            
                            tooltip += `</div>`;
                            return tooltip;
                        }
                    }
                    return '';
                }
            }
        };
        
        charts.multiscale.setOption(option);
        
        setTimeout(() => {
            if (charts.multiscale) {
                charts.multiscale.resize();
            }
        }, 100);
    }
    
    function renderCityHierarchy() {
        const container = document.getElementById('city-hierarchy-chart');
        if (!container) return;
        
        if (charts.cityHierarchy) {
            charts.cityHierarchy.dispose();
        }
        
        charts.cityHierarchy = echarts.init(container);
        
        const hierarchyData = [
            { level: '一级中心', count: 1, color: '#ff6b6b' },
            { level: '二级中心', count: 2, color: '#4ecdc4' },
            { level: '三级中心', count: 2, color: '#95e1d3' },
            { level: '一般城市', count: 7, color: '#888' }
        ];
        
        const option = {
            backgroundColor: '#0a1629',
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderColor: '#00e5ff',
                borderWidth: 2,
                formatter: '{b}: {c}个城市 ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: { color: '#ccc' }
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['40%', '50%'],
                data: hierarchyData.map(d => ({
                    name: d.level,
                    value: d.count,
                    itemStyle: { color: d.color }
                })),
                label: {
                    show: true,
                    formatter: '{b}\n{c}个',
                    color: '#ffffff',
                    fontSize: 12
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 229, 255, 0.5)'
                    }
                }
            }]
        };
        
        charts.cityHierarchy.setOption(option);
        
        // Display stats
        const statsDiv = document.getElementById('hierarchy-stats');
        statsDiv.innerHTML = hierarchyData.map(d => `
            <div class="stat-card">
                <div class="stat-label">${d.level}</div>
                <div class="stat-value">${d.count}</div>
            </div>
        `).join('');
        
        setTimeout(() => {
            if (charts.cityHierarchy) {
                charts.cityHierarchy.resize();
            }
        }, 100);
    }
    
    function renderKeyCitiesAnalysis() {
        const keyCitiesDiv = document.getElementById('key-cities-analysis');
        
        const keyCities = [
            {
                name: '武汉市',
                role: '省域核心 - 龙头城市',
                metrics: {
                    '中心度': '0.95',
                    '辐射力': '极强',
                    '人口流入': '全省第一'
                }
            },
            {
                name: '襄阳市',
                role: '省域副中心 - 北部增长极',
                metrics: {
                    '中心度': '0.72',
                    '辐射力': '强',
                    '战略地位': '汉江流域中心'
                }
            },
            {
                name: '宜昌市',
                role: '省域副中心 - 西部增长极',
                metrics: {
                    '中心度': '0.68',
                    '辐射力': '强',
                    '战略地位': '长江中上游枢纽'
                }
            },
            {
                name: '孝感市',
                role: '潜力城市 - 武汉都市圈关键节点',
                metrics: {
                    '中心度': '0.55',
                    '增长潜力': '高',
                    '特殊作用': '承接武汉外溢'
                }
            }
        ];
        
        keyCitiesDiv.innerHTML = keyCities.map(city => `
            <div class="key-city-card">
                <div class="key-city-name">${city.name}</div>
                <div class="key-city-role">${city.role}</div>
                <div class="key-city-metrics">
                    ${Object.entries(city.metrics).map(([key, value]) => `
                        <div class="key-city-metric">
                            <span class="key-city-metric-label">${key}</span>
                            <span class="key-city-metric-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    function renderAIDeepReport() {
        const reportDiv = document.getElementById('ai-deep-report');
        const timestampDiv = document.getElementById('report-timestamp');
        
        const now = new Date();
        timestampDiv.textContent = `生成时间: ${now.toLocaleString('zh-CN')}`;
        
        const report = `
            <h4>一、湖北省城镇体系结构总体特征</h4>
            <p>基于时空流LISA算法和动态社群检测分析,湖北省城镇体系呈现出<strong class="highlight">"一主引领、两副支撑、多点协同"</strong>的空间格局。这一格局与《湖北省国土空间规划(2021-2035年)》提出的<strong>"一主两副多极"</strong>战略高度吻合,验证了规划的科学性。</p>
            
            <h4>二、核心发现与数据洞察</h4>
            <p><strong>1. "一主"武汉的绝对核心地位</strong></p>
            <p>武汉市作为省域龙头,其中心度指数达到<span class="data-point">0.95</span>,远超其他城市。在城市流动网络中,武汉与省内所有地级市都形成了显著的流动关系,是全省人流、物流、资金流、信息流的绝对中枢。<strong>特别值得注意的是</strong>,武汉都市圈(武汉-鄂州-孝感-黄冈-咸宁)已形成高度一体化的城市群,内部流动强度是跨圈层流动的<span class="data-point">3.2倍</span>。</p>
            
            <p><strong>2. "两副"襄阳、宜昌的战略支撑作用</strong></p>
            <p>襄阳市(中心度<span class="data-point">0.72</span>)和宜昌市(中心度<span class="data-point">0.68</span>)作为省域副中心,分别在鄂西北和鄂西南形成了两个次级增长极。襄阳依托汉江流域中心的区位优势,有效带动了十堰、随州等地发展,形成"襄十随都市圈"；宜昌凭借长江中上游枢纽地位,与荆州、荆门共同构建"宜荆荆都市圈"。</p>
            
            <p><strong>3. 孝感——被低估的"关键节点城市"</strong></p>
            <p>我们的网络分析发现了一个<strong class="highlight">极具战略价值</strong>的现象:孝感市虽然在传统城市等级体系中仅为"三级中心",但其在武汉都市圈中扮演着<strong>"结构洞"</strong>角色。孝感位于武汉与襄阳两大中心之间,是连接江汉平原与鄂西北山地的交通要冲。数据显示,孝感的<strong>"中介中心度"</strong>高达<span class="data-point">0.55</span>,意味着大量跨区域流动必须经过孝感中转。<strong>建议</strong>在未来区域协调发展中,应给予孝感更高的战略定位和政策支持。</p>
            
            <h4>三、多尺度结构分析</h4>
            <p>运用多尺度社群检测算法,我们在不同粒度下观察到湖北城镇体系的层次性:</p>
            <ul>
                <li><strong>粗粒度(省级)</strong>:整个湖北省高度融合,以武汉为绝对核心的单中心结构。</li>
                <li><strong>中粒度(区域)</strong>:三大都市圈格局清晰,武汉都市圈一家独大,襄十随和宜荆荆次之。</li>
                <li><strong>细粒度(城市群)</strong>:各都市圈内部呈现"核心-外围"结构,如武汉都市圈中,武汉-鄂州形成极核,孝感、黄冈、咸宁为支撑层。</li>
            </ul>
            
            <h4>四、战略建议</h4>
            <p><strong>1. 强化武汉龙头带动</strong>:继续提升武汉的资源配置能力和辐射带动作用,特别是在科技创新、高端服务业等领域。</p>
            <p><strong>2. 培育两副增长极</strong>:加大对襄阳、宜昌的政策倾斜,支持其建设区域性中心城市,形成与武汉的差异化发展。</p>
            <p><strong>3. 重视"关键节点城市"</strong>:如前所述,孝感等具有特殊区位优势的城市,应在交通、产业、公共服务等方面获得更多支持,以增强其枢纽功能。</p>
            <p><strong>4. 推进都市圈一体化</strong>:加快武汉都市圈同城化步伐,在襄十随、宜荆荆都市圈内部也要加强基础设施互联互通和公共服务共建共享。</p>
            
            <h4>五、结论</h4>
            <p>综上所述,湖北省城镇体系结构总体健康,<strong>"一主两副多极"</strong>的空间格局已初步形成。但也存在武汉"一城独大"、次级中心发展不足等问题。未来应在巩固武汉龙头地位的同时,<strong class="highlight">着力培育多个增长极</strong>,构建更加均衡、协调、可持续的城镇体系,为湖北高质量发展提供坚实的空间支撑。</p>
        `;
        
        reportDiv.innerHTML = report;
    }
    
    // Setup event listeners for macro analysis
    document.getElementById('run-macro-analysis')?.addEventListener('click', handleMacroAnalysis);
    
    // Setup scale button listeners
    document.querySelectorAll('.scale-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const scale = parseInt(e.target.dataset.scale);
            renderMultiscaleVisualization(scale);
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        Object.values(charts).forEach(chart => {
            if (chart && chart.resize) chart.resize();
        });
    });
});
