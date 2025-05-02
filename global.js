console.log("global.js is working!");

// VISUALIZATION 1 D3 CODE
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
            .style("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 1);
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`Trial: ${d.trial}<br>Reaction Time: ${d.reaction_time} ms`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0.7);
                tooltip.transition().duration(500).style("opacity", 0);
            });
    });

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

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

// VISUALIZATION 2 D3 CODE

d3.csv("data/correct_responses_summary.csv").then(function(data) {

    // Process data: Group by session and task type, and calculate total correct responses
    const summarizedData = d3.groups(data, d => d.session, d => d.task_type)
        .map(([session, taskGroups]) => ({
            session,
            taskTypes: taskGroups.map(([taskType, entries]) => ({
                taskType,
                correct: d3.sum(entries, d => +d.num_correct),
                count: entries.length
            }))
        }));

    // Log the summarized data to check it
    console.log(summarizedData);

    // Set up the SVG container
    const margin = { top: 40, right: 30, bottom: 60, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#viz2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Color scale for task types (1-back and 3-back)
    const colorScale = d3.scaleOrdinal()
        .domain(["1-back", "3-back"])
        .range(["#1f77b4", "#ff7f0e"]);

    // Calculate the maximum correct responses for scaling the y-axis
    const maxCorrect = d3.max(summarizedData.flatMap(d => d.taskTypes.flatMap(v => v.correct)));
    console.log("Max Correct:", maxCorrect);

    // Scale for the x-axis (session-task combinations)
    const x = d3.scaleBand()
        .domain(summarizedData.flatMap(d => d.taskTypes.map(v => `${d.session} - ${v.taskType}`))) // Flatten to get all session-task combinations
        .range([0, width])
        .padding(0.1);

    // Scale for the y-axis (number of correct responses)
    const y = d3.scaleLinear()
        .domain([0, maxCorrect])  // Y-axis domain based on the maximum correct responses
        .range([height, 0]);

    // Add x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Create bars for each session-task combination
    svg.selectAll(".bar")
        .data(summarizedData.flatMap(d => d.taskTypes.map(v => ({
            session: d.session,
            task_type: v.taskType,
            correct: v.correct,
            label: `${d.session} - ${v.taskType}`  // Label for the session-task combination
        }))))
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("y", d => y(d.correct))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.correct)) // Height is based on the correct responses
        .attr("fill", d => colorScale(d.task_type))  // Apply color scale for task type
        .on("mouseover", function(event, d) {
            d3.select(this).style("opacity", 0.7);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Task Type: ${d.task_type}<br>Correct: ${d.correct}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).style("opacity", 1);
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Number of Correct Responses by Session and Task Type");

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Session - Task Type");

    // Add y-axis label
    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Correct Responses");

    // Interactive legend
    const legend = svg.selectAll(".legend")
        .data(["1-back", "3-back"])
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width + 20}, ${i * 20})`)
        .style("cursor", "pointer")
        .on("click", function(event, taskType) {
            const bars = svg.selectAll(".bar")
                .filter(d => d.task_type === taskType);
            const isHidden = bars.style("display") === "none";
            bars.style("display", isHidden ? "inline" : "none");
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
