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

// END OF VISUALIZATION 2

// VISUALIZATION 3

d3.csv('data/all_subjects_timed.csv', d => ({
    ...d,
    time_sec: +d.time_sec,
    Response_Time: +d.Response_Time
  })).then((data) => {
    drawGraphThree(data);
})

function drawGraphThree(data) {
    const margin = { top: 20, right: 150, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const subjects = ["3", "4", "8", "11"];
    const colorScale = d3.scaleOrdinal()
        .domain(subjects)
        .range(["blue", "pink", "purple", "green"]);

    // Create SVG
    const svg = d3.select("#viz3")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Reaction Time (ms) vs Session Time");

    // X and Y scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.time_sec)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Response_Time)])
        .range([height, 0]);

    // Add x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Time (in seconds)");

    // Add y-axis label
    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Reaction Time (ms)");

    subjects.forEach(subject => {
        const subjectData = data.filter(d => d.subject_no === subject);
        const lineGenerator = d3.line()
            .x(d => x(d.time_sec))
            .y(d => y(d.Response_Time))
            .curve(d3.curveMonotoneX);

        svg.append('path')
            .datum(subjectData)
            .attr("class", `line-${subject}`)
            .attr("fill", "none")
            .attr("stroke", colorScale(subject))
            .attr("stroke-width", 1.5)
            .attr("d", lineGenerator);
    });

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 20}, 20)`);  // Position it

    subjects.forEach((subject, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`)
            .style("cursor", "pointer")
            .on("click", function () {
                const line = d3.select(`.line-${subject}`);
                const currentlyHidden = line.style("display") === "none";
                line.style("display", currentlyHidden ? null : "none"); // Toggle
                legendRow.style("opacity", currentlyHidden ? 1 : 0.4);
            });

        // Legend color box
        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", colorScale(subject));

        // Legend label
        legendRow.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .text(`Subject #${subject}`)
            .attr("font-size", "12px")
            .attr("alignment-baseline", "middle");
    });
}

// END OF VISUALIZATION 3

// VISUALIZATION 4

d3.csv('data/all_subjects_timed.csv').then((data) => {
    drawGraphFour(data);
})

function drawGraphFour(data) {
    console.log(data)
    const categories = ["Calming - One Back Task", "Calming - Three Back Task",
        "Vexing - One Back Task", "Vexing - Three Back Task"];

    const panelWidth = 400;
    const panelHeight = 200;
    const svgWidth = panelWidth * 2;
    const svgHeight = panelHeight * 2;
    
    const svg = d3.select("#viz4").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const keyboardRows = [
        { keys: "QWERTYUIOP".split(""), y: 0 },
        { keys: "ASDFGHJKL".split(""), y: 1 },
        { keys: "ZXCVBNM".split(""), y: 2 }
        ];
        const keySize = 30;
        const padding = 5;

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "6px 10px")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    categories.forEach((category, idx) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        
        const panel = svg.append("g")
            .attr("transform", `translate(${col * panelWidth + 50}, ${row * panelHeight + 40})`);
        
        // Filter and aggregate for this category
        const mistakes = d3.rollup(
            data.filter(d => d.Response !== d.Correct_Response && d.n_back === category),
            v => v.length,
            d => d.Stimulus_Letter.toUpperCase()
        );
        
        const allKeys = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");
        const heatData = allKeys.map(key => ({
            key,
            count: mistakes.get(key) || 0
        }));
        
        const color = d3.scaleSequential()
            .domain([0, d3.max(heatData, d => d.count)])
            .interpolator(d3.interpolateReds);
        
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
                .attr("fill", color(d.count))
                .style("pointer-events", "all") // Ensure pointer events are on this element
                .on("mouseover", function (event) {
                    d3.select(this).attr("stroke", "#222").attr("stroke-width", 2);
                    tooltip.transition().duration(100).style("opacity", 1);
                    tooltip.html(`<strong>${d.key}</strong>: ${d.count} mistake${d.count !== 1 ? "s" : ""}`)
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
        
        // Add title
        panel.append("text")
            .attr("x", 0)
            .attr("y", -15)
            .text(category.toUpperCase())
            .attr("font-size", "16px")
            .attr("font-weight", "bold");
        });
}

// END OF VISUALIZATION 4


// VISUALIZATION 5

d3.csv("data/reaction_time_combined.csv", function(d) {
    const tr = +d.trial;
    const sess = d.session.trim();
    const block = sess === "Calming"
      ? tr
      : (tr > 8 ? tr - 8 : tr);
    return {
      subject: +d.subject,
      session: sess,
      block: block,
      rt: +d.reaction_time
    };
  }).then(function(data) {
    drawGraphFive(data);
  });
  
  function drawGraphFive(data) {
    const container = d3.select("#viz5");
  
    container.append("h3")
      .text("Mean Reaction Time by Block: Calming vs. Vexing");
    container.append("p")
      .text("Each sparkline shows one subject’s mean RT over the 8 blocks, with Calming on the left and Vexing on the right. " +
            "Green segments mean RT decreased (learning), red segments mean RT increased (fatigue).");
  
    const nested = d3.rollups(
      data,
      v => d3.mean(v, d => d.rt),
      d => d.subject,
      d => d.session,
      d => d.block
    );
    const proc = nested.flatMap(([subject, sessArr]) =>
      sessArr.map(([session, blkArr]) => ({
        subject,
        session,
        values: blkArr
          .map(([block, mean]) => ({ block, mean }))
          .sort((a, b) => a.block - b.block)
      }))
    );
  
    const subjects = Array.from(new Set(proc.map(d => d.subject)))
      .sort((a,b)=>a-b);
  
    const control = container.append("div").attr("class","control");
    control.append("label").text("Subject: ");
    const sel = control.append("select").attr("id","subject-select");
    sel.selectAll("option")
      .data(["All"].concat(subjects))
      .enter().append("option")
      .attr("value", d => d)
      .text(d => d==="All" ? "All Subjects" : "Subject " + d);
    sel.on("change", render);
  
    const grid = container.append("div").attr("class","spark-grid");
    const cw = 400, ch = 100, m = { top:5, right:5, bottom:20, left:5 };
    const sessions = ["Calming","Vexing"];
  
    function render() {
      grid.selectAll(".spark-row").remove();
      const selVal = sel.node().value;
      const filtered = selVal === "All"
        ? proc
        : proc.filter(d => d.subject == +selVal);
  
      const bySubj = d3.group(filtered, d=>d.subject);
      bySubj.forEach((recs, subject) => {
        const row = grid.append("div")
          .attr("class","spark-row")
          .style("display","flex")
          .style("align-items","center");
  
        row.append("div")
          .text("S" + subject)
          .style("width","40px")
          .style("font-size","12px");
  
        sessions.forEach(sess => {
          const rec = recs.find(r=>r.session===sess);
          const vals = rec ? rec.values : [];
          const svg = row.append("svg")
            .attr("width", cw + m.left + m.right)
            .attr("height", ch + m.top + m.bottom)
            .append("g")
            .attr("transform", `translate(${m.left},${m.top})`);
  
          const x = d3.scaleLinear().domain([1,8]).range([0,cw]);
          const y = d3.scaleLinear()
            .domain(vals.length
              ? d3.extent(vals, d=>d.mean)
              : [0,1]
            ).nice()
            .range([ch,0]);
  
          for (let i=1; i<vals.length; i++) {
            const a = vals[i-1], b = vals[i];
            svg.append("path")
              .datum([a,b])
              .attr("fill","none")
              .attr("stroke", b.mean>a.mean ? "red" : "green")
              .attr("stroke-width",1.5)
              .attr("d", d3.line()
                .x(d=>x(d.block))
                .y(d=>y(d.mean))
              );
          }
  
          const xAxis = d3.axisBottom(x)
            .ticks(8)
            .tickFormat(d=>d);
          svg.append("g")
            .attr("transform", `translate(0,${ch})`)
            .call(xAxis)
            .selectAll("text")
              .attr("font-size","8px");
  
          svg.append("text")
            .attr("x", cw/2)
            .attr("y", ch + 15)
            .attr("text-anchor","middle")
            .attr("font-size","8px")
            .text("Block #");
  
          svg.append("rect")
            .attr("width",cw)
            .attr("height",ch)
            .attr("fill","transparent")
            .on("mouseover", () => {
              svg.selectAll("path").attr("stroke-width",3);
              if (vals.length) {
                const slope = vals[vals.length-1].mean - vals[0].mean;
                svg.append("text")
                  .attr("class","slope-label")
                  .attr("x", x(vals[vals.length-1].block))
                  .attr("y", y(vals[vals.length-1].mean) - 5)
                  .attr("font-size","10px")
                  .text(`Δ${slope.toFixed(0)}`);
              }
            })
            .on("mouseout", () => {
              svg.selectAll("path").attr("stroke-width",1.5);
              svg.selectAll(".slope-label").remove();
            });
        });
      });
    }
  
    render();
  }

// END OF VISUALIZATION 5

// VISUALIZATION 6

d3.csv("data/all_subjects_timed.csv", function(d) {
    return {
      subject: +d.subject_no,
      trial: +d.TrialNumber,
      time: +d.time_sec,
      rt: +d.Response_Time,
      correct: d.Response && +d.Response === +d.Correct_Response ? 1 : 0,
      letter: d.Stimulus_Letter,
      session: d.n_back.split(" - ")[0]  
    };
  }).then(function(data) {
    drawGraphSix(data);
  });
  
  function drawGraphSix(data) {
    const bySubj = d3.group(data, d=>d.subject, d=>d.session);
    bySubj.forEach(sessMap => {
      sessMap.forEach(records => {
        records.sort((a,b)=>a.time-b.time);
        let blk = 0;
        records.forEach(d => {
          if (d.trial===1) blk++;
          d.block = blk;
        });
      });
    });
  
    const container = d3.select("#viz6");
  
    container.append("h3")
      .text("Piano-Roll: Trials over Time by Letter");
    container.append("p")
      .text("Dots = trials plotted by time_sec (x) & letter (y), colored by session. " +
            "Brush to zoom, toggle sessions, hover for details.");
  
    const ctrl = container.append("div").attr("class","control");
    ["Calming","Vexing"].forEach(sess => {
      const lbl = ctrl.append("label").style("margin-right","12px");
      lbl.append("input")
        .attr("type","checkbox")
        .attr("checked",true)
        .attr("value",sess)
        .on("change", update);
      lbl.append("span").text(sess);
    });
    ctrl.append("button")
      .text("Reset Zoom")
      .on("click", () => {
        x.domain(extentTime);
        drawPoints();
        gx.call(d3.axisBottom(x));
      });
  
    const fullW = 900, fullH = 400;
    const margin = { top: 10, right: 20, bottom: 50, left: 60 };
    const width = fullW - margin.left - margin.right;
    const height = fullH - margin.top - margin.bottom;
  
    const svg = container.append("svg")
        .attr("width", fullW)
        .attr("height", fullH)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const letters = Array.from(new Set(data.map(d=>d.letter))).sort();
    const extentTime = d3.extent(data, d=>d.time);
    const x = d3.scaleLinear().domain(extentTime).range([0,width]);
    const y = d3.scaleBand().domain(letters).range([0,height]).padding(0.1);
    const color = d3.scaleOrdinal().domain(["Calming","Vexing"])
      .range(["#1f77b4","#ff7f0e"]);
  
    const gx = svg.append("g")
        .attr("class","x-axis")
        .attr("transform",`translate(0,${height})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .attr("class","y-axis")
        .call(d3.axisLeft(y));
  
    svg.append("text")
      .attr("x", width/2).attr("y", height+40)
      .attr("text-anchor","middle")
      .text("Time (sec)");
    svg.append("text")
      .attr("transform","rotate(-90)")
      .attr("x",-height/2).attr("y",-45)
      .attr("text-anchor","middle")
      .text("Stimulus Letter");
  
    svg.append("defs").append("clipPath")
      .attr("id","clip6")
      .append("rect")
        .attr("width",width)
        .attr("height",height);
  
    const brush = d3.brushX()
      .extent([[0,0],[width,height]])
      .on("end", brushed);
    svg.append("g")
      .attr("class","brush")
      .call(brush);
  
    const plot = svg.append("g")
      .attr("clip-path","url(#clip6)");
  
    update();
  
    function update() {
      const active = ctrl.selectAll("input[type=checkbox]")
        .nodes()
        .filter(n=>n.checked)
        .map(n=>n.value);
  
      const filt = data.filter(d=>active.includes(d.session));
  
      const pts = plot.selectAll("circle").data(filt, d=>d.subject+"-"+d.session+"-"+d.time+"-"+d.trial);
  
      pts.exit().remove();
  
      pts.enter().append("circle")
        .attr("r", 4)
        .attr("fill", d=>color(d.session))
        .on("mouseover", function(event,d) {
          const tt = d3.select("body").append("div")
            .attr("class","tooltip")
            .style("position","absolute")
            .style("background","#fff")
            .style("border","1px solid #ccc")
            .style("padding","4px")
            .style("pointer-events","none")
            .html(
              `Subject ${d.subject}<br>
               Letter “${d.letter}”<br>
               RT: ${d.rt.toFixed(0)} ms<br>
               Trial ${d.trial}, Block ${d.block}`
            );
          tt.style("left",(event.pageX+5)+"px")
            .style("top",(event.pageY+5)+"px");
        })
        .on("mouseout", () => d3.selectAll(".tooltip").remove())
      .merge(pts)
        .attr("cx", d=>x(d.time))
        .attr("cy", d=>y(d.letter) + y.bandwidth()/2);
    }
  
    function brushed({selection}) {
      if (!selection) return;
      const [x0,x1] = selection;
      x.domain([ x.invert(x0), x.invert(x1) ]);
      gx.call(d3.axisBottom(x));
      drawPoints();
      svg.select(".brush").call(brush.move,null);
    }
  
    function drawPoints() {
      plot.selectAll("circle")
        .attr("cx", d=>x(d.time))
        .attr("cy", d=>y(d.letter) + y.bandwidth()/2);
    }
  }

  
// d3.csv("data/all_subjects_timed.csv", function(d) {
//     return {
//       subject_no: +d.subject_no,
//       time_sec: +d.time_sec,
//       Response_Time: +d.Response_Time,
//       Stimulus_Letter: d.Stimulus_Letter
//     };
//   }).then(function(data) {
//     drawGraphSix(data);
//   });
  
//   function drawGraphSix(data) {
//     const container = d3.select("#viz6");
  
//     container.append("h3")
//       .text("Reaction Time over Continuous Time with Letter Stimuli");
//     container.append("p")
//       .text("Overlay RT vs. time for Subjects 3, 4, 8, 11. Letters mark each trial. " +
//             "Use checkboxes to toggle subjects, and scroll/drag to zoom & pan.");
  
//     const fullW = 900, fullH = 400;
//     const margin = { top: 30, right: 20, bottom: 50, left: 60 };
//     const width = fullW - margin.left - margin.right;
//     const height = fullH - margin.top - margin.bottom;
  
//     const subjects = [3,4,8,11];
//     const data4 = data.filter(d => subjects.includes(d.subject_no));
  
//     const x = d3.scaleLinear()
//       .domain(d3.extent(data4, d => d.time_sec)).nice()
//       .range([0, width]);
//     const y = d3.scaleLinear()
//       .domain([0, d3.max(data4, d => d.Response_Time)]).nice()
//       .range([height, 0]);
//     const color = d3.scaleOrdinal()
//       .domain(subjects)
//       .range(["#1f77b4","#ff7f0e","#2ca02c","#d62728"]);
  
//     const svg = container.append("svg")
//         .attr("width", fullW)
//         .attr("height", fullH)
//       .append("g")
//         .attr("transform", `translate(${margin.left},${margin.top})`);
  
//     svg.append("defs").append("clipPath")
//         .attr("id","clip6")
//       .append("rect")
//         .attr("width", width)
//         .attr("height", height);
  
//     const gx = svg.append("g")
//         .attr("class","x-axis")
//         .attr("transform", `translate(0,${height})`);
//     const gy = svg.append("g")
//         .attr("class","y-axis");
  
//     svg.append("text")
//         .attr("class","x-label")
//         .attr("x", width/2)
//         .attr("y", height + margin.bottom - 10)
//         .attr("text-anchor","middle")
//         .text("Time (sec)");
//     svg.append("text")
//         .attr("class","y-label")
//         .attr("transform","rotate(-90)")
//         .attr("x", -height/2)
//         .attr("y", -margin.left + 15)
//         .attr("text-anchor","middle")
//         .text("Reaction Time (ms)");
  
//     const gPlot = svg.append("g")
//         .attr("clip-path","url(#clip6)");
  
//     const dataBySubj = d3.group(data4, d => d.subject_no);
  
//     dataBySubj.forEach((records, subj) => {
//       const gSub = gPlot.append("g")
//           .attr("id", "subj" + subj);
  
//       gSub.append("path")
//         .datum(records.sort((a,b) => a.time_sec - b.time_sec))
//         .attr("fill","none")
//         .attr("stroke", color(subj))
//         .attr("stroke-width", 1.5)
//         .attr("d", d3.line()
//           .x(d => x(d.time_sec))
//           .y(d => y(d.Response_Time))
//         );
  
//       gSub.selectAll("text.letter")
//         .data(records)
//         .enter().append("text")
//         .classed("letter",true)
//         .attr("x", d => x(d.time_sec))
//         .attr("y", d => y(d.Response_Time) - 4)
//         .attr("text-anchor","middle")
//         .attr("font-size","8px")
//         .attr("fill", color(subj))
//         .text(d => d.Stimulus_Letter);
//     });
  
//     gx.call(d3.axisBottom(x));
//     gy.call(d3.axisLeft(y));
  
//     const legend = container.append("div")
//       .attr("class","control")
//       .style("margin","8px 0");
  
//     subjects.forEach(subj => {
//       const lbl = legend.append("label").style("margin-right","12px");
//       lbl.append("input")
//         .attr("type","checkbox")
//         .attr("checked",true)
//         .attr("data-subj",subj)
//         .on("change", function() {
//           const on = this.checked;
//           container.select("#subj" + subj)
//             .style("display", on ? null : "none");
//         });
//       lbl.append("span")
//         .text("Subject " + subj)
//         .style("color", color(subj))
//         .style("margin-left","4px");
//     });
  
//     const zoom = d3.zoom()
//       .scaleExtent([1,10])
//       .translateExtent([[0,0],[width,height]])
//       .extent([[0,0],[width,height]])
//       .on("zoom", function(event) {
//         const t = event.transform;
//         const zx = t.rescaleX(x);
//         // update axes
//         gx.call(d3.axisBottom(zx));
//         // update lines & letters
//         dataBySubj.forEach((records, subj) => {
//           gPlot.select("#subj" + subj).select("path")
//             .attr("d", d3.line()
//               .x(d => zx(d.time_sec))
//               .y(d => y(d.Response_Time))
//               (records.sort((a,b) => a.time_sec - b.time_sec))
//             );
//           gPlot.selectAll("#subj" + subj + " text.letter")
//             .attr("x", d => zx(d.time_sec));
//         });
//       });
  
//     svg.call(zoom);
//   }
  
