console.log("global.js is working!");
//VISUALIZATION 1 D3 CODE
d3.csv("data/reaction_time_combined.csv").then(function(data) {
    console.log("First 10 rows of data: ", data.slice(0, 10));

    // Clean and format data
    const cleanData = data.filter(d => d.session && d.trial && d.reaction_time)
        .map(d => ({
            session: d.session.trim(),
            trial: +d.trial,
            reaction_time: +d.reaction_time
        }));

    console.log("Cleaned data sample:", cleanData.slice(0, 10));

    // Dimensions and margins
    const margin = { top: 20, right: 150, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const sessions = ["Calming", "Vexing"];
    const colorScale = d3.scaleOrdinal()
        .domain(sessions)
        .range(["blue", "red"]);

    // Create SVG
    const svg = d3.select("#viz1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X and Y scales
    const x = d3.scaleLinear()
        .domain(d3.extent(cleanData, d => d.trial))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(cleanData, d => d.reaction_time)])
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(10))
        .call(g => g.selectAll(".tick line").remove())
        .call(g => g.select(".domain").attr("stroke", "#000"));

    svg.append("g")
        .call(d3.axisLeft(y).ticks(6))
        .call(g => g.selectAll(".tick line").remove())
        .call(g => g.select(".domain").attr("stroke", "#000"));

    // Plot dots for each session in a separate group
    sessions.forEach(session => {
        svg.append("g")
            .attr("class", `dots-${session}`)
            .selectAll("circle")
            .data(cleanData.filter(d => d.session === session))
            .enter()
            .append("circle")
            .attr("cx", d => x(d.trial))
            .attr("cy", d => y(d.reaction_time))
            .attr("r", 4)
            .style("fill", colorScale(session))
            .style("opacity", 0.7);
    });

    // Labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Trial Number");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Reaction Time (ms)");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Reaction Time vs Calming/Vexing Music");

    // Interactive legend
    const legend = svg.selectAll(".legend")
        .data(sessions)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width + 10}, ${i * 25})`)
        .style("cursor", "pointer")
        .on("click", function(event, session) {
            const group = svg.select(`.dots-${session}`);
            const isHidden = group.style("display") === "none";
            group.style("display", isHidden ? "inline" : "none");
        });

    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", d => colorScale(d));

    legend.append("text")
        .attr("x", 18)
        .attr("y", 6)
        .attr("dy", "0.35em")
        .text(d => d)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
});

// END OF VISUALIZATION 1 D3 CODE
