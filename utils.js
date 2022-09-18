const visitedNodeMemoization = {};

export default function buildD3HierarchyInput(nodes, edges, currentNode, edgeFromParent) {
  if (visitedNodeMemoization[currentNode.id]) {
    return {
      name: currentNode.name,
      id: currentNode.id,
      argumentType: edgeFromParent && edgeFromParent.type,
    };
  } else {
    visitedNodeMemoization[currentNode.id] = true;

    return {
      name: currentNode.name,
      id: currentNode.id,
      argumentType: edgeFromParent && edgeFromParent.type,
      children: edges
        .filter((edge) => edge.targetId === currentNode.id)
        .map((edge) =>
          buildD3HierarchyInput(
            nodes,
            edges,
            nodes.find((node) => node.id === edge.sourceId),
            edge
          )
        ),
    };
  }
}
