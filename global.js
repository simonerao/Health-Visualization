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
            
            const category_responses = dataToRender.filter(d => d.n_back === category);
            const filtered_mistakes = dataToRender.filter(d => d.Response !== d.Correct_Response && d.n_back === category);
            let overall_error_p = (filtered_mistakes.length / category_responses.length * 100).toFixed(2);
            overall_error_p = overall_error_p === 'NaN' ? '-.--' : overall_error_p;

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
            
            const text = panel.append("text")
                .attr("x", panelWidth / 2 - 25) 
                .attr("text-anchor", "middle")
                .attr("y", -25)
                .attr("font-size", "16px")
                .attr("font-weight", "bold");

            text.append("tspan")
                .attr("x", panelWidth / 2 - 25)
                .attr("dy", "0em")
                .text(category.toUpperCase());

            text.append("tspan")
                .attr("x", panelWidth / 2 - 25)
                .attr("dy", "1.5em")
                .style("font-size", "11px")
                .style('font-weight', 'normal')
                .style("font-style", "italic")
                .text(`Overall Error Rate: ${overall_error_p}%`);
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
    
    // (a) split out the errors
const errorData = initialFullData.filter(d => d.Response !== d.Correct_Response);

// (b) roll up counts by TrialNumber
const totalByTrial = d3.rollup(initialFullData, v => v.length, d => d.TrialNumber);
const errorByTrial = d3.rollup(errorData,       v => v.length, d => d.TrialNumber);

// (c) build an array for every trial number
const trialNumbers = d3.range(minTN, maxTN + 1);
const barData = trialNumbers.map(trial => ({
  trial,
  total: totalByTrial.get(trial) || 0,
  errors: errorByTrial.get(trial)   || 0
}));

// (d) y-scale based on the maximum *total* trials
const maxTotal = d3.max(barData, d => d.total);
const y = d3.scaleLinear()
    .domain([0, maxTotal])
    .range([timelineInnerHeight, 0])
    .nice();


    const bins = d3.bin()
        .value(d => d.TrialNumber)
        .domain(xTrial.domain())
        .thresholds(d3.range(minTN + 0.5, maxTN + 0.5)) 
        (initialFullData);

    const yCount = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([timelineInnerHeight, 0])
        .nice();

    
    // for each trial, make a tiny <g> and draw two rects
timelineSvg.selectAll(".bar-group")
  .data(barData)
  .enter().append("g")
    .attr("class", "bar-group")
    .attr("transform", d => `translate(${xTrial(d.trial - 0.5) + 1},0)`) 
  .each(function(d) {
    const g = d3.select(this);
    const barW = Math.max(0, xTrial(d.trial + 0.5) - xTrial(d.trial - 0.5) - 1);

    const yErr = y(d.errors);
    const hErr = timelineInnerHeight - yErr;
    g.append("rect")
      .attr("class", "bar-errors")
      .attr("x", 0)
      .attr("y", yErr)
      .attr("width", barW)
      .attr("height", hErr)
      .attr("fill", "tomato");         

    const yTot = y(d.total);
    const hCorr = yErr - yTot;
    g.append("rect")
      .attr("class", "bar-correct")
      .attr("x", 0)
      .attr("y", yTot)
      .attr("width", barW)
      .attr("height", hCorr)
      .attr("fill", "#ccc");          
  });


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
        .call(d3.axisLeft(yCount).tickValues([0, 90, 180]).tickFormat(d3.format('d')));

//     timelineSvg.append("g")
//   .attr("class", "y-axis")
//   .call(d3.axisLeft(y).ticks(null, "d"));

     timelineSvg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - timelineMargin.left + 15)
        .attr("x", 0 - (timelineInnerHeight / 2))
        .text("# Data");
    
        timelineSvg.append("text")
        .attr("class", "axis-note")
        .attr("y", timelineMargin.left + 12)
        .attr("x", timelineInnerHeight - 50)
        .attr("font-size", "10px")
        .attr("font-style", "italic")
        .text("*includes all trials (one back & three back)*");


const legendData = [
  { label: "Errors",        color: "tomato" },
  { label: "Total Tests", color: "#ccc" }
];

const legendX = timelineInnerWidth - 150;      
const legendY = timelineInnerHeight + 25;           

const legend = timelineSvg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${legendX}, ${legendY})`);

const items = legend.selectAll(".legend-item")
  .data(legendData)
  .enter().append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(${i * 70}, 0)`);

items.append("rect")
  .attr("width", 12)
  .attr("height", 12)
  .attr("fill", d => d.color);

items.append("text")
  .attr("x", 16)
  .attr("y", 6)
  .attr("dy", "0.35em")
  .attr("font-size", "12px")
  .text(d => d.label);



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
 
