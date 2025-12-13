// Create x-scale (based on dps)
const maxCol = showStars ? "Max" : "Upper";
const xLeft = width > minWidth ? yAxisWidth + margins.left : margins.left;
const xScale = d3
  .scaleLinear()
  .domain([0, d3.max(classData.toArray().map((d) => d[maxCol]))])
  .range([xLeft, width - margins.right]);

// Create y-scale (categorical for each class)
const yScale = d3
  .scaleBand()
  .domain(classData.toArray().map((d) => d.BuildAndCount))
  .range([margins.top, height - margins.bottom - xAxisHeight])
  .padding(0.2);

// Create SVG container
const svg = d3
  .create("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background", "transparent");

if (selectedBoss) {
  const g = svg.append("g").selectAll("g").data(classData.toArray()).join("g");

  // Add main box
  g.append("rect")
    .attr("x", (d) => {
      return xScale(d.Q1);
    })
    .attr("y", (d) => yScale(d.BuildAndCount))
    .attr("width", (d) => xScale(d.Q3) - xScale(d.Q1))
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => classColors.get(d.spec.split(" (")[0]));

  // Add median line
  g.append("line")
    .attr("x1", (d) => xScale(d.Median))
    .attr("x2", (d) => xScale(d.Median))
    .attr("y1", (d) => yScale(d.BuildAndCount))
    .attr("y2", (d) => yScale(d.BuildAndCount) + yScale.bandwidth())
    .attr("stroke", "white");

  // Add mean dot
  g.append("circle")
    .attr("cx", (d) => xScale(d.Mean))
    .attr("cy", (d) => yScale(d.BuildAndCount) + yScale.bandwidth() / 2)
    .attr("r", 3)
    .attr("fill", "white");

  // Add lower whisker
  g.append("line")
    .attr("x1", (d) => xScale(d.Lower))
    .attr("x2", (d) => xScale(d.Q1))
    .attr("y1", (d) => yScale(d.BuildAndCount) + yScale.bandwidth() / 2)
    .attr("y2", (d) => yScale(d.BuildAndCount) + yScale.bandwidth() / 2)
    .attr("stroke", "var(--theme-foreground)");

  // Add whisker cap
  g.append("line")
    .attr("x1", (d) => xScale(d.Lower))
    .attr("x2", (d) => xScale(d.Lower))
    .attr("y1", (d) => yScale(d.BuildAndCount) + yScale.bandwidth() / 4)
    .attr("y2", (d) => yScale(d.BuildAndCount) + (yScale.bandwidth() * 3) / 4)
    .attr("stroke", "var(--theme-foreground)");

  // Add upper whisker
  g.append("line")
    .attr("x1", (d) => xScale(d.Q3))
    .attr("x2", (d) => xScale(d.Upper))
    .attr("y1", (d) => yScale(d.BuildAndCount) + yScale.bandwidth() / 2)
    .attr("y2", (d) => yScale(d.BuildAndCount) + yScale.bandwidth() / 2)
    .attr("stroke", "var(--theme-foreground)");

  // Add whisker cap
  g.append("line")
    .attr("x1", (d) => xScale(d.Upper))
    .attr("x2", (d) => xScale(d.Upper))
    .attr("y1", (d) => yScale(d.BuildAndCount) + yScale.bandwidth() / 4)
    .attr("y2", (d) => yScale(d.BuildAndCount) + (yScale.bandwidth() * 3) / 4)
    .attr("stroke", "var(--theme-foreground)");

  // Create x-axis
  const xAxis = d3.axisBottom(xScale).ticks(10, "s");
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margins.bottom - xAxisHeight})`)
    .call(xAxis);

  // Add x-axis label
  svg
    .append("text")
    .attr(
      "transform",
      `translate(${
        width > minWidth ? (width - yAxisWidth) / 2 + yAxisWidth : width / 2
      }, ${height - margins.bottom - xAxisHeight / 2})`
    )
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-family", "var(--sans-serif)")
    .attr("fill", "var(--theme-foreground)")
    .text("DPS (millions)");

  // Create y-axis
  const yAxis = d3.axisLeft(yScale);
  svg
    .append("g")
    .attr("visibility", width > minWidth ? "visible" : "hidden")
    .attr("transform", `translate(${margins.left + yAxisWidth}, 0)`)
    .attr("pointer-events", "none")
    .call(yAxis)
    .selectAll("text")
    .attr("font-size", "14px")
    .attr("visibility", "visible")
    .attr("opacity", width > minWidth ? 1 : 0.25)
    .attr("text-anchor", width > minWidth ? "end" : "start")
    .attr("transform", width > minWidth ? "" : `translate(${-yAxisWidth}, 0)`)
    .text((d) => (width > minWidth ? d : d.split(" (")[0]));

  // Add y axis label
  svg
    .append("text")
    .attr("visibility", width > minWidth ? "visible" : "hidden")
    .attr(
      "transform",
      `translate(${margins.left}, ${plotHeight / 2}) rotate(-90.1)`
    )
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("fill", "var(--theme-foreground)")
    .attr("font-family", "var(--sans-serif)")
    .text("Build (Logs)");

  // Add branding at the bottom right
  let brandString = `Raided.pro Lost Ark - ${new Date().toLocaleDateString()} - ${selectedBoss}`;
  if (difficulty) {
    brandString += ` - ${difficulty[0]}M - G${gate}`;
  }
  // Add ilevel
  brandString += ` - ${iLevelMin}-${iLevelMax}`;
  svg
    .append("text")
    .attr(
      "transform",
      `translate(${
        width > minWidth ? yAxisWidth + 25 : width - margins.left
      }, ${height - xAxisHeight - margins.bottom - 5}) rotate(-90.1)`
    )
    .attr("text-anchor", "start")
    .attr("font-family", "var(--sans-serif)")
    .attr("font-size", "12px")
    .attr("fill", "var(--theme-foreground-faintest)")
    .attr("pointer-events", "none")
    .text(brandString);

  // Prepare tooltip
  const tooltip = d3
    .select("main")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0);

  // Draw vertical line following mouse
  svg
    .append("rect")
    .attr("class", "mouseLine")
    .attr("fill", "black")
    .attr("pointer-events", "none");

  // Add invisible box to support mouse over
  g.append("rect")
    .attr("class", "rowMouseBox")
    .attr("x", (d) => xScale.range()[0] - yAxisWidth + 25)
    .attr("y", (d) => yScale(d.BuildAndCount))
    .attr(
      "width",
      (d) => xScale.range()[1] - xScale.range()[0] + yAxisWidth - 25
    )
    .attr("height", yScale.bandwidth())
    .attr("fill", "transparent")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).html(`
      <div class="card" style="padding: 7px;">
        <div>Rank ${
          classData
            .toArray()
            .map((x) => x.spec)
            .indexOf(d.spec) + 1
        }/${classData.toArray().length}</div>
        <div>${d.spec}</div>
        <div>${d.Logs} logs</div>
        <br/>
        <div>Worst: ${d3.format(".3s")(d.Min)}</div>
        <div>Floor: ${d3.format(".3s")(d.Lower)}</div>
        <div>Q1: ${d3.format(".3s")(d.Q1)}</div>
        <div>Median: ${d3.format(".3s")(d.Median)}</div>
        <div>Mean: ${d3.format(".3s")(d.Mean)}</div>
        <div>Q3: ${d3.format(".3s")(d.Q3)}</div>
        <div>Ceiling: ${d3.format(".3s")(d.Upper)}</div>
        <div>Best: ${d3.format(".3s")(d.Max)}</div>
      </div>
    `);
      // Darken row
      d3.select(event.target)
        .attr("fill", "var(--theme-foreground-muted)")
        .attr("opacity", "0.25");

      // Change mouse
      d3.select(this).style("cursor", "pointer");

      // Keep updating line
      svg.selectAll(".mouseLine").attr("visibility", "visible");
    })
    .on("mouseout", () => {
      d3.selectAll(".tooltip").attr("opacity", 0).style("left", "-9999px");

      // Lighten row
      g.selectAll(".rowMouseBox").attr("fill", "transparent");
    })
    .on("mousemove", (event) => {
      if (event.offsetX > width / 2) {
        tooltip.style("left", event.offsetX - 140 + "px");
      } else {
        tooltip.style("left", event.offsetX + 30 + "px");
      }

      tooltip.style("top", event.pageY - 30 + "px");
    });

  g.append("path")
    .attr("d", d3.symbol(d3.symbolStar).size(60))
    .attr(
      "transform",
      (d) =>
        `translate(${xScale(d.Max)}, ${
          yScale(d.BuildAndCount) + yScale.bandwidth() / 2
        })`
    )
    .attr("fill", "var(--theme-foreground-focus)")
    .attr("opacity", "0.5")
    .attr("visibility", (d) => (showStars ? "visible" : "hidden"))
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      d3.select(event.target).attr("opacity", "1");

      // Find the link to the best log
      let bestLink = "https://logs.snow.xyz/logs/";
      bestLink += d.BestLog;
      tooltip.style("opacity", 1).html(`
      <div class="card" style="padding: 7px;">
        <div>${d.spec}</div>
        <div>Item Level: ${d3.format("4.0d")(d.BestGearscore)}</div>
        <div>${d3.format(".3s")(d.Max)} DPS</div>
        <div>${bestLink}</div>
      </div>
    `);
    })
    .on("mouseout", (event, d) => {
      d3.select(event.target).attr("opacity", "0.5");
      d3.select(this).style("cursor", "");

      // Hide tooltip
      d3.selectAll(".tooltip").attr("opacity", 0).style("left", "-9999px");
    })
    .on("mousemove", (event) => {
      if (event.offsetX > width / 2) {
        tooltip.style("left", event.offsetX - 140 + "px");
      } else {
        tooltip.style("left", event.offsetX + 30 + "px");
      }

      tooltip.style("top", event.pageY - 30 + "px");
    })
    .on("click", (event, d) => {
      window.open(`https://logs.snow.xyz/logs/${d.BestLog}`, "_blank");
    });

  svg
    .on("mousemove", (event) => {
      const x = event.offsetX;
      const y = event.offsetY;

      // Update line
      svg
        .selectAll(".mouseLine")
        .attr("x", x + 1)
        .attr("y", margins.top)
        .attr("width", 1)
        .attr("height", height - xAxisHeight - margins.bottom)
        .attr("fill", "var(--theme-foreground-muted)")
        .attr("opacity", 0.5)
        .attr("visibility", x > yAxisWidth ? "visible" : "hidden");
    })
    .on("mouseout", () => {
      svg.selectAll(".mouseLine").attr("visibility", "hidden");
    });

  // Add latest log date string
  svg
    .append("text")
    .attr(
      "transform",
      `translate(${width - margins.right}, ${height - margins.bottom - 5})`
    )
    .attr("text-anchor", "end")
    .attr("font-family", "var(--sans-serif)")
    .attr("font-size", "12px")
    .attr("fill", "var(--theme-foreground-faintest)")
    .text(`Latest log: ${latestLog.toLocaleDateString()}`);

  // Add total logs string
  svg
    .append("text")
    .attr(
      "transform",
      `translate(${width - margins.right}, ${height - margins.bottom - 20})`
    )
    .attr("text-anchor", "end")
    .attr("font-family", "var(--sans-serif)")
    .attr("font-size", "12px")
    .attr("fill", "var(--theme-foreground-faintest)")
    .text(`Total logs: ${nLogs}`);

  // Add button to copy url to clipboard
  svg
    .append("text")
    .attr("transform", `translate(${margins.left}, ${height - margins.bottom})`)
    .attr("text-anchor", "start")
    .attr("font-family", "var(--sans-serif)")
    .attr("fill", "var(--theme-foreground-focus)")
    .attr("font-size", "12px")
    .text("Share: Copy URL")
    .style("cursor", "pointer")
    .on("click", (event) => {
      navigator.clipboard.writeText(queryUrl);

      // Change our text to "copied"
      d3.select(event.target).text("Share: Copied!");
    });

  display(svg.node());
}