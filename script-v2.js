const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#map-container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", resetZoom);

const g = svg.append("g");
const tooltip = d3.select("#tooltip");

const projection = d3.geoMercator()
    .center([100.5, 13.5])
    .scale(height * 2.8)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
        g.selectAll(".province").style("stroke-width", (0.5 / event.transform.k) + "px");
        g.selectAll(".province-name").style("font-size", (8 / event.transform.k) + "px");
    });

svg.call(zoom);

// ใช้ Promise.all เพื่อดึงข้อมูลทั้งแผนที่และ JSON ร้านค้ามาพร้อมกัน
Promise.all([
    d3.json("https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json"),
    d3.json("data.json") // ดึงข้อมูลจากไฟล์ data.json
]).then(function([th, storeData]) {
    
    const provinces = topojson.feature(th, th.objects.thai_prov).features;

    g.selectAll("path")
        .data(provinces)
        .enter().append("path")
        .attr("class", "province")
        .attr("d", path)
        .on("mouseover", function(event, d) {
            const provinceName = d.properties.name;
            const storeCount = storeData[provinceName] || 0;
            
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<h4>${provinceName}</h4><p>จำนวนร้านค้า: <b>${storeCount}</b> สาขา</p>`)
                   .style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", clicked);

    g.selectAll("text")
        .data(provinces)
        .enter().append("text")
        .attr("class", "province-name")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function(d) { return d.properties.name; });

}).catch(function(error) {
    console.error("Error loading data: ", error);
    alert("ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบว่ามีไฟล์ data.json อยู่ในโฟลเดอร์เดียวกันและรันผ่าน Server");
});

function clicked(event, d) {
    event.stopPropagation();
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    
    svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, svg.node())
    );
}

function resetZoom() {
    svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
}
