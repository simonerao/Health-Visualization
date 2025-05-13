// // VISUALIZATION 4

// d3.csv('data/all_subjects_timed.csv').then((data) => {
//     drawGraphFour(data);
// });

// function drawGraphFour(data) {
//     const panelWidth = 400;
//     const panelHeight = 200;
//     const svgWidth = panelWidth * 2;
//     const svgHeight = panelHeight;
    
//     const svg = d3.select("#viz").append("svg")
//         .attr("width", svgWidth)
//         .attr("height", svgHeight);

//     const keyboardRows = [
//         { keys: "ABCDEFGHI".split(""), y: 0 },
//         { keys: "JKLMNOPQR".split(""), y: 1 },
//         { keys: "STUVWXYZ".split(""), y: 2 }
//     ];
//     const keySize = 30;
//     const padding = 5;

//     const tooltip = d3.select("body")
//         .append("div")
//         .attr("class", "tooltip")
//         .style("opacity", 0);

//     const slider = d3.select(".taskToggle")
//         .html(`
//             <div id="label_one">One Back Task</div>
//             <label class="toggle-switch">
//                 <input type="checkbox" id="one_back"/>
//                 <span class="slider"></span>
//             </label>
//             <div id="label_three">Three Back Task</div>`);

//     function renderVisualization(taskType) {
//         const categories = [`Calming - ${taskType}`, `Vexing - ${taskType}`];
//         svg.html('');
//         let color = null;

//         categories.forEach((category, idx) => {
//             const row = Math.floor(idx / 2);
//             const col = idx % 2;
            
//             const panel = svg.append("g")
//                 .attr("transform", `translate(${col * panelWidth + 50}, ${row * panelHeight + 40})`);
            
//             const filtered_mistakes = data.filter(d => d.Response !== d.Correct_Response && d.n_back === category)

//             // Filter and aggregate for this category
//             const mistakes = d3.rollup(
//                 filtered_mistakes,
//                 v => v.length,
//                 d => d.Stimulus_Letter.toUpperCase()
//             );
            
//             const allKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
//             const heatData = allKeys.map(key => {
//                 const count = mistakes.get(key) || 0
//                 return {
//                     key, 
//                     percent: (filtered_mistakes.length > 0 ? (count / filtered_mistakes.length) * 100 : 0).toFixed(2),
//                     count
//                 };
//             });
            
//             color = d3.scaleThreshold()
//                 .domain([3, 6, 9, 12])
//                 .range(d3.schemeReds[5]);
            
//             keyboardRows.forEach((rowData, rowIndex) => {
//                 rowData.keys.forEach((key, i) => {
//                 const d = heatData.find(k => k.key === key);
//                 panel.append("rect")
//                     .attr("x", i * (keySize + padding) + rowIndex * (keySize / 2))
//                     .attr("y", rowIndex * (keySize + padding))
//                     .attr("width", keySize)
//                     .attr("height", keySize)
//                     .attr("rx", 4)
//                     .attr("ry", 4)
//                     .attr("fill", color(d.percent))
//                     .style("pointer-events", "all") // Ensure pointer events are on this element
//                     .on("mouseover", function (event) {
//                         d3.select(this).attr("stroke", "#222").attr("stroke-width", 2);
//                         tooltip.transition().duration(100).style("opacity", 1);
//                         tooltip.html(`<strong>${d.key}</strong>: ${d.percent}% of mistakes`)
//                         .style("left", (event.pageX + 10) + "px")
//                         .style("top", (event.pageY - 30) + "px");
//                     })
//                     .on("mousemove", function (event) {
//                         tooltip
//                         .style("left", (event.pageX + 10) + "px")
//                         .style("top", (event.pageY - 30) + "px");
//                     })
//                     .on("mouseout", function () {
//                         d3.select(this).attr("stroke", null);
//                         tooltip.transition().duration(200).style("opacity", 0);
//                     });
            
//                 panel.append("text")
//                     .attr("x", i * (keySize + padding) + rowIndex * (keySize / 2) + keySize / 2)
//                     .attr("y", rowIndex * (keySize + padding) + keySize / 2 + 5)
//                     .attr("text-anchor", "middle")
//                     .attr("font-size", "14px")
//                     .attr("fill", "black")
//                     .style("pointer-events", "none")
//                     .text(key);
//                 });
//             });

//             const legendWidth = 300;
//             const legendHeight = 50;
//             const legend = svg.append("g")
//                 .attr("transform", `translate(${svgWidth / 2 - legendWidth / 2}, ${svgHeight - legendHeight + 10})`);
//             const legendThresholds = [0, ...color.domain(), 15];

//             // Width of each box
//             const boxWidth = legendWidth / color.range().length;

//             legend.selectAll("rect")
//                 .data(color.range())
//                 .enter()
//                 .append("rect")
//                 .attr("x", (d, i) => i * boxWidth)
//                 .attr("y", 0)
//                 .attr("width", boxWidth)
//                 .attr("height", 15)
//                 .attr("fill", d => d);

//             // Add threshold labels
//             legend.selectAll("text")
//                 .data(legendThresholds)
//                 .enter()
//                 .append("text")
//                 .attr("x", (d, i) => i * boxWidth)
//                 .attr("y", 30)
//                 .attr("text-anchor", "middle")
//                 .attr("font-size", "11px")
//                 .text(d => `${d.toFixed(2)}%`);            
            
//             // Add title
//             panel.append("text")
//                 .attr("x", 0)
//                 .attr("y", -15)
//                 .text(category.toUpperCase())
//                 .attr("font-size", "16px")
//                 .attr("font-weight", "bold");
//         });
//     }

//     slider.select('input')
//         .on("change", (event) => {
//             let taskType = null;
//             if (event.target.id === 'one_back') {
//                 event.target.id = 'three_back';
//                 taskType = 'Three Back Task';
//             }
//             else {
//                 event.target.id = 'one_back';
//                 taskType = 'One Back Task';
//             }
//             renderVisualization(taskType);
//         });

//     renderVisualization('One Back Task');
// };

// global.js

let allRawData = []; 
let currentFilteredData = []; 
let currentTaskType = 'One Back Task'; 

d3.csv('data/all_subjects_timed.csv', d => {
    d.TrialNumber = +d.TrialNumber;
    return d;
}).then((loadedData) => {
    allRawData = loadedData;
    currentFilteredData = allRawData; 
    drawGraphFour(allRawData); 
});

function drawGraphFour(initialFullData) { 
    const panelWidth = 400;
    const panelHeight = 200;
    const svgWidth = panelWidth * 2; 
    const svgHeight = panelHeight;
    
    const vizSvg = d3.select("#viz").append("svg") 
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // const vizSvg = d3.select("#viz").append("svg")
    //    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    //    .attr("preserveAspectRatio", "xMidYMid meet");

    const keyboardRows = [
        { keys: "ABCDEFGHI".split(""), y: 0 },
        { keys: "JKLMNOPQR".split(""), y: 1 },
        { keys: "STUVWXYZ".split(""), y: 2 }
    ];
    const keySize = 30;
    const padding = 5;

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const sliderContainer = d3.select(".taskToggle") 
        .html(`
            <div id="label_one">One Back Task</div>
            <label class="toggle-switch">
                <input type="checkbox" id="n_back_toggle"/> <!-- Changed ID for clarity -->
                <span class="slider"></span>
            </label>
            <div id="label_three">Three Back Task</div>`);


    function renderVisualization(taskType, dataToRender) {
        currentTaskType = taskType; 

        const categories = [`Calming - ${taskType}`, `Vexing - ${taskType}`];
        vizSvg.html(''); 
        let color = null;

        categories.forEach((category, idx) => {
            const row = Math.floor(idx / 2);
            const col = idx % 2;
            
            const panel = vizSvg.append("g")
                .attr("transform", `translate(${col * panelWidth + 50}, ${row * panelHeight + 40})`);
            
            const filtered_mistakes = dataToRender.filter(d => d.Response !== d.Correct_Response && d.n_back === category);

            const mistakes = d3.rollup(
                filtered_mistakes,
                v => v.length,
                d => d.Stimulus_Letter.toUpperCase()
            );
            
            const allKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            const heatData = allKeys.map(key => {
                const count = mistakes.get(key) || 0;
                return {
                    key, 
                    percent: (filtered_mistakes.length > 0 ? (count / filtered_mistakes.length) * 100 : 0), 
                    count
                };
            });
            
            
            const maxPercent = d3.max(heatData, d => d.percent);
            color = d3.scaleThreshold()
                
                .domain([3, 6, 9, 12]) 
                .range(d3.schemeReds[5]);
            
            keyboardRows.forEach((rowData, rowIndex) => {
                rowData.keys.forEach((key, i) => {
                    const d = heatData.find(k => k.key === key);
                    panel.append("rect")
                        .attr("x", i * (keySize + padding) + rowIndex * (keySize / 2))
                        .attr("y", rowIndex * (keySize + padding))
                        .attr("width", keySize)
                        .attr("height", keySize)
                        .attr("rx", 4)
                        .attr("ry", 4)
                        .attr("fill", d ? color(d.percent) : color(0)) 
                        .style("pointer-events", "all")
                        .on("mouseover", function (event) {
                            if (!d) return;
                            d3.select(this).attr("stroke", "#222").attr("stroke-width", 2);
                            tooltip.transition().duration(100).style("opacity", 1);
                            tooltip.html(`<strong>${d.key}</strong>: ${d.percent.toFixed(2)}% of mistakes`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 30) + "px");
                        })
                        .on("mousemove", function (event) {
                            tooltip
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 30) + "px");
                        })
                        .on("mouseout", function () {
                            d3.select(this).attr("stroke", null);
                            tooltip.transition().duration(200).style("opacity", 0);
                        });
                
                    panel.append("text")
                        .attr("x", i * (keySize + padding) + rowIndex * (keySize / 2) + keySize / 2)
                        .attr("y", rowIndex * (keySize + padding) + keySize / 2 + 5)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "14px")
                        .attr("fill", "black")
                        .style("pointer-events", "none")
                        .text(key);
                });
            });

            
            if (idx === 0) { 
                const legendWidth = 300;
                const legendHeight = 50; 
                const legend = vizSvg.append("g") 
                    .attr("transform", `translate(${svgWidth / 2 - legendWidth / 2}, ${svgHeight - 30})`); 
                const legendThresholds = [0, ...color.domain(), d3.max(color.domain()) * 1.25 ]; 

                const boxWidth = legendWidth / color.range().length;

                legend.append("text")
                    .attr("class", "legend-caption")
                    .attr("x", legendWidth - 27)      
                    .attr("y", -4)                   
                    .attr("text-anchor", "middle")   
                    .attr("font-size", "12px")
                    .attr("font-style", "italic")
                    .text("Error rate");

                legend.selectAll("rect.legend-box")
                    .data(color.range())
                    .enter()
                    .append("rect")
                    .attr("class", "legend-box")
                    .attr("x", (d, i) => i * boxWidth)
                    .attr("y", 0)
                    .attr("width", boxWidth)
                    .attr("height", 15)
                    .attr("fill", d => d);

                legend.selectAll("text.legend-label")
                    .data(legendThresholds)
                    .enter()
                    .append("text")
                    .attr("class", "legend-label")
                    .attr("x", (d, i) => i * boxWidth)
                    .attr("y", 30) 
                    .attr("text-anchor", (d,i) => i === 0 ? "start" : i === legendThresholds.length -1 ? "end" : "middle")
                    .attr("font-size", "11px")
                    .text(d_text => `${d_text.toFixed(0)}%`); 
            }       
            
            panel.append("text")
                .attr("x", panelWidth / 2 - 25) 
                .attr("text-anchor", "middle")
                .attr("y", -15)
                .text(category.toUpperCase())
                .attr("font-size", "16px")
                .attr("font-weight", "bold");
        });
    }

    currentTaskType = d3.select('#n_back_toggle').property('checked') ? 'Three Back Task' : 'One Back Task';
    
    sliderContainer.select('#n_back_toggle')
        .on("change", function(event) { 
            if (event.target.checked) {
                currentTaskType = 'Three Back Task';
            } else {
                currentTaskType = 'One Back Task';
            }
            renderVisualization(currentTaskType, currentFilteredData); 
        });

    const timelineMargin = { top: 10, right: 30, bottom: 40, left: 50 }; 
    const timelineHeight = 80; 
    const timelineInnerWidth = svgWidth - timelineMargin.left - timelineMargin.right;
    const timelineInnerHeight = timelineHeight - timelineMargin.top - timelineMargin.bottom;

    const timelineSvg = d3.select("#timeline").append("svg")
        .attr("width", svgWidth)
        .attr("height", timelineHeight)
      .append("g")
        .attr("transform", `translate(${timelineMargin.left},${timelineMargin.top})`);
    
    // const timelineSvg = d3.select("#timeline").append("svg")
    //    .attr("viewBox", `0 0 ${svgWidth} ${timelineHeight}`)
    //    .attr("preserveAspectRatio", "xMidYMid meet")
    //  .append("g")
    //    .attr("transform", `translate(${timelineMargin.left},${timelineMargin.top})`);

    const [minTN, maxTN] = d3.extent(initialFullData, d => d.TrialNumber);
    const xTrial = d3.scaleLinear()
        .domain([minTN - 0.5, maxTN + 0.5]) 
        .range([0, timelineInnerWidth]);

    const bins = d3.bin()
        .value(d => d.TrialNumber)
        .domain(xTrial.domain())
        .thresholds(d3.range(minTN + 0.5, maxTN + 0.5)) 
        (initialFullData);

    const yCount = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([timelineInnerHeight, 0])
        .nice();

    timelineSvg.selectAll("rect.histogram-bar")
        .data(bins)
        .enter().append("rect")
          .attr("class", "histogram-bar") 
          .attr("x", d => xTrial(d.x0) + 1) 
          .attr("width", d => Math.max(0, xTrial(d.x1) - xTrial(d.x0) - 1))
          .attr("y", d => yCount(d.length))
          .attr("height", d => timelineInnerHeight - yCount(d.length));

    const xAxisTicks = d3.range(minTN, maxTN + 1); 
    timelineSvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${timelineInnerHeight})`)
        .call(d3.axisBottom(xTrial)
            .tickValues(xAxisTicks) 
            .tickFormat(d3.format('d')) 
        );
    
    timelineSvg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${timelineInnerWidth / 2}, ${timelineInnerHeight + timelineMargin.bottom - 5})`)
        .text("Trial Number");

    timelineSvg.append("g")
        .attr("class", "y-axis")
        // .call(d3.axisLeft(yCount).ticks(1).tickFormat(d3.format('d'))); 
        .call(d3.axisLeft(yCount).tickValues([0, 180]).tickFormat(d3.format('d')));

     timelineSvg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - timelineMargin.left + 15)
        .attr("x", 0 - (timelineInnerHeight / 2))
        .text("# Data");


    const brush = d3.brushX()
        .extent([[0, 0], [timelineInnerWidth, timelineInnerHeight]])
        .on("brush", brushed); // trigger update only when dragging finishes -> maybe change to 'brush' for real-time update

    const brushG = timelineSvg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.selection) {
            currentFilteredData = [];
        } else {
            const [pixelStart, pixelEnd] = event.selection;
            const [trialStart, trialEnd] = [xTrial.invert(pixelStart), xTrial.invert(pixelEnd)];
            
            currentFilteredData = initialFullData.filter(d => d.TrialNumber >= trialStart && d.TrialNumber <= trialEnd);
        }
        renderVisualization(currentTaskType, currentFilteredData);
    }
    
    brushG.call(brush.move, xTrial.range());
};
