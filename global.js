// VISUALIZATION 4

d3.csv('data/all_subjects_timed.csv').then((data) => {
    drawGraphFour(data);
})

function drawGraphFour(data) {
    const panelWidth = 400;
    const panelHeight = 200;
    const svgWidth = panelWidth * 2;
    const svgHeight = panelHeight;
    
    const svg = d3.select("#viz").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

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

    const slider = d3.select(".taskToggle")
        .html(`
            <div id="label_one">One Back Task</div>
            <label class="toggle-switch">
                <input type="checkbox" id="one_back"/>
                <span class="slider"></span>
            </label>
            <div id="label_three">Three Back Task</div>`);

    function renderVisualization(taskType) {
        const categories = [`Calming - ${taskType}`, `Vexing - ${taskType}`];
        svg.html('');
        let color = null;

        categories.forEach((category, idx) => {
            const row = Math.floor(idx / 2);
            const col = idx % 2;
            
            const panel = svg.append("g")
                .attr("transform", `translate(${col * panelWidth + 50}, ${row * panelHeight + 40})`);
            
            const filtered_mistakes = data.filter(d => d.Response !== d.Correct_Response && d.n_back === category)

            // Filter and aggregate for this category
            const mistakes = d3.rollup(
                filtered_mistakes,
                v => v.length,
                d => d.Stimulus_Letter.toUpperCase()
            );
            
            const allKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            const heatData = allKeys.map(key => {
                const count = mistakes.get(key) || 0
                return {
                    key, 
                    percent: (filtered_mistakes.length > 0 ? (count / filtered_mistakes.length) * 100 : 0).toFixed(2),
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
                    .attr("fill", color(d.percent))
                    .style("pointer-events", "all") // Ensure pointer events are on this element
                    .on("mouseover", function (event) {
                        d3.select(this).attr("stroke", "#222").attr("stroke-width", 2);
                        tooltip.transition().duration(100).style("opacity", 1);
                        tooltip.html(`<strong>${d.key}</strong>: ${d.percent}% of mistakes`)
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

            const legendWidth = 300;
            const legendHeight = 50;
            const legend = svg.append("g")
                .attr("transform", `translate(${svgWidth / 2 - legendWidth / 2}, ${svgHeight - legendHeight + 10})`);
            const legendThresholds = [0, ...color.domain(), 15];

            // Width of each box
            const boxWidth = legendWidth / color.range().length;

            legend.selectAll("rect")
                .data(color.range())
                .enter()
                .append("rect")
                .attr("x", (d, i) => i * boxWidth)
                .attr("y", 0)
                .attr("width", boxWidth)
                .attr("height", 15)
                .attr("fill", d => d);

            // Add threshold labels
            legend.selectAll("text")
                .data(legendThresholds)
                .enter()
                .append("text")
                .attr("x", (d, i) => i * boxWidth)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .attr("font-size", "11px")
                .text(d => `${d.toFixed(2)}%`);            
            
            // Add title
            panel.append("text")
                .attr("x", 0)
                .attr("y", -15)
                .text(category.toUpperCase())
                .attr("font-size", "16px")
                .attr("font-weight", "bold");
        });
    }

    slider.select('input')
        .on("change", (event) => {
            let taskType = null;
            if (event.target.id === 'one_back') {
                event.target.id = 'three_back';
                taskType = 'Three Back Task';
            }
            else {
                event.target.id = 'one_back';
                taskType = 'One Back Task';
            }
            renderVisualization(taskType);
        });

    renderVisualization('One Back Task');
};