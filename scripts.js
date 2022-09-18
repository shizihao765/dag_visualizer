import data from "./data.js";
import buildD3HierarchyInput from "./utils.js";
import * as d3 from "d3";

const nodes = Object.keys(data.thesesMap).map((id) => data.thesesMap[id]);
const edges = Object.keys(data.relationsMap).map((id) => data.relationsMap[id]);

const treeData = buildD3HierarchyInput(
  nodes,
  edges,
  // finding SOME (perhaps not the only) root node
  nodes.filter(
    (node) => edges.find((edge) => edge.sourceId === node.id) === undefined
  )[3]
);

const calculateNodeSizes = (node) => {
  if (node.children) {
    node.children.forEach((child) => {
      calculateNodeSizes(child);
    });
  }
  node.size = calcTileDimensions(node.name);
  node.radius =
    0.5 * Math.sqrt(Math.pow(node.size[0], 2) + Math.pow(node.size[1], 2));
};

calculateNodeSizes(treeData);

let width = window.innerWidth;
let height = window.innerHeight;
let nodeRadius = 200;
let linkNodeRadius = 100;

// setTimeout(function() {
//   for (var i = n * n; i > 0; --i) nodesSimulation.tick();
// }, 1);

const drag = (nodesSimulation, linkNodesSimulation) => {
  function dragstarted(event, d) {
    if (!event.active) {
      nodesSimulation.alphaTarget(0.01).restart();
      linkNodesSimulation.alphaTarget(0.01).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) {
      nodesSimulation.alphaTarget(0);
      linkNodesSimulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};

const chart = () => {
  let root = d3.hierarchy(treeData);
  let links = root.links();
  let nodes = root.descendants();

  const linkNodes = links.map((link) => {
    return {
      source: link.source,
      target: link.target,
      radius: linkNodeRadius
    };
  });

  const zoom = d3.zoom();
  const initialZoom = 0.2;

  const nodesSimulation = d3
    .forceSimulation(nodes.concat(linkNodes))
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(0)
        .strength(1)
    )
    .force("charge", d3.forceManyBody().strength(-10000))
    .force("x", d3.forceX())
    .force("y", d3.forceY());
  // .force(
  //   "collision",
  //   d3.forceCollide().radius((d) => {
  //     return d.radius;
  //   })
  // );

  const linkNodesSimulation = d3.forceSimulation(linkNodes.concat(nodes));
  // .force("charge", d3.forceManyBody().strength(-30))
  // .force("x", d3.forceX())
  // .force("y", d3.forceY())
  // .force(
  //   "collision",
  //   d3.forceCollide().radius((d) => {
  //     console.log(d.radius);
  //     return d.radius || d.data.radius;
  //   })
  // );

  const svg = d3
    .create("svg")
    .attr("class", "canvas")
    .attr("width", width)
    .attr("height", height)
    .attr("xmlns:xhtml", "http://www.w3.org/1999/xhtml");

  function marker(color) {
    svg
      .append("defs")
      .append("marker")
      .attr("id", `arrowhead-${color}`)
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", -80)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 13)
      .attr("markerHeight", 13)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M0,0L10,-5L10,5Z")
      .attr("class", color)
      .style("stroke", "none");

    return color;
  }

  const mainPane = svg
    .append("g")
    .attr("transform", `translate(0, 0) scale(${initialZoom})`);

  const link = mainPane
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", (d) => `link ${d.target.data.argumentType}`)
    .attr(
      "marker-start",
      (d) => `url(#arrowhead-${marker(d.target.data.argumentType)})`
    );

  const node = mainPane
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(nodesSimulation, linkNodesSimulation));

  node
    .append("circle")
    .attr("r", (d) => d.data.radius)
    .attr("stroke", "black")
    .attr("class", "aux")
    .attr("fill", "transparent");

  node
    .append("foreignObject")
    .attr("width", 1)
    .attr("height", 1)
    .style("overflow", "visible")
    .append("xhtml:div")
    .style("display", "inline-block")
    .style("font-size", "16px")
    .style("font-family", "sans-serif")
    .style("box-sizing", "border-box")
    .style("width", "200px")
    .style("border", "1px solid black")
    .style("background", "rgba(255,255,255,1")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("transform", "translate(-50%, -50%)")
    .text((d) => d.data.name)
    .append("xhtml:button")
    .style("width", "100%")
    .text("Add child")
    .on("click", (d) => {});

  const linkNode = mainPane
    .append("g")
    .selectAll("circle")
    .data(linkNodes)
    .join("circle")
    .attr("class", "aux")
    .attr("r", linkNodeRadius)
    .attr("stroke", "green")
    .attr("fill", "transparent");

  nodesSimulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);

    linkNode
      .attr("cx", function (d) {
        return (d.x = (d.source.x + d.target.x) * 0.5);
      })
      .attr("cy", function (d) {
        return (d.y = (d.source.y + d.target.y) * 0.5);
      });
  });

  // linkNodesSimulation.on("tick", () => {
  //   link
  //     .attr("x1", (d) => d.source.x)
  //     .attr("y1", (d) => d.source.y)
  //     .attr("x2", (d) => d.target.x)
  //     .attr("y2", (d) => d.target.y);

  //   node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);

  //   linkNode
  //     .attr("cx", function (d) {
  //       return (d.x = (d.source.x + d.target.x) * 0.5);
  //     })
  //     .attr("cy", function (d) {
  //       return (d.y = (d.source.y + d.target.y) * 0.5);
  //     });
  // });

  //add zoom capabilities
  svg
    .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(initialZoom))
    .call(
      zoom
        .extent([
          [0, 0],
          [width, height]
        ])
        .scaleExtent([0.01, 8])
        .on("zoom", zoomed)
    );

  //Zoom functions
  function zoomed({ transform }) {
    mainPane.attr(
      "transform",
      `translate(${transform.x}, ${transform.y})` + "scale(" + transform.k + ")"
    );
  }

  return svg.node();
};

document.querySelector(".wrapper").appendChild(chart());
