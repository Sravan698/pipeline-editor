import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import dagre from "dagre";
import CustomNode from "./components/CustomNode";
import ValidationStatus from "./components/ValidationStatus";
import ControlPanel from "./components/ControlPanel";
import "reactflow/dist/style.css";
import "./App.css";

const initialNodes = [];
const initialEdges = [];

const nodeTypes = { custom: CustomNode };

const App = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [nodeName, setNodeName] = useState("");
  const [isValidDag, setIsValidDag] = useState(null);
  const { fitView } = useReactFlow();

  // Add a new node
  const addNode = useCallback(() => {
    if (!nodeName) {
      alert("Please enter a node name");
      return;
    }
    const id = `${+new Date()}`;
    const newNode = {
      id,
      type: "custom",
      data: { label: nodeName },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
    };
    setNodes((nds) => nds.concat(newNode));
    setNodeName("");
  }, [nodeName]);

  // Handle edge connection
  const onConnect = useCallback((params) => {
    if (params.source === params.target) {
      alert("Self-connections are not allowed");
      return;
    }
    setEdges((eds) => [
      ...eds,
      { id: `e${params.source}-${params.target}`, ...params, animated: true },
    ]);
  }, []);

  // Delete selected nodes or edges
  const onDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, []);

  // Handle key press for deletion
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Delete") {
        onDelete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDelete]);

  // Auto-layout with dagre
  const applyAutoLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
      () => ({})
    );
    dagreGraph.setGraph({ rankdir: "LR" });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 150, height: 50 });
    });
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 150 / 2,
          y: nodeWithPosition.y - 50 / 2,
        },
      };
    });

    setNodes(layoutedNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [nodes, edges, fitView]);

  // DAG validation
  const validateDag = useCallback(() => {
    if (nodes.length < 2) {
      return { isValid: false, message: "DAG must have at least 2 nodes" };
    }

    // Check for cycles using DFS
    const adjacencyList = {};
    nodes.forEach((node) => {
      adjacencyList[node.id] = [];
    });
    edges.forEach((edge) => {
      adjacencyList[edge.source].push(edge.target);
    });

    const visited = new Set();
    const recStack = new Set();

    const dfs = (node) => {
      visited.add(node);
      recStack.add(node);

      for (const neighbor of adjacencyList[node]) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true; // Cycle detected
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) {
          return { isValid: false, message: "Cycle detected in the graph" };
        }
      }
    }

    // Check if all nodes are connected
    const connectedNodes = new Set();
    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    if (nodes.some((node) => !connectedNodes.has(node.id))) {
      return { isValid: false, message: "Not all nodes are connected" };
    }

    return { isValid: true, message: "Valid DAG" };
  }, [nodes, edges]);

  useEffect(() => {
    const result = validateDag();
    setIsValidDag(result);
  }, [nodes, edges, validateDag]);

  return (
    <div className="app">
      <ControlPanel
        nodeName={nodeName}
        setNodeName={setNodeName}
        addNode={addNode}
        applyAutoLayout={applyAutoLayout}
      />
      <ValidationStatus isValidDag={isValidDag} />
      <div className="json-preview">
        <h3>DAG JSON Preview</h3>
        <pre>{JSON.stringify({ nodes, edges }, null, 2)}</pre>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        onNodesChange={(changes) =>
          setNodes((nds) => applyNodeChanges(changes, nds))
        }
        onEdgesChange={(changes) =>
          setEdges((eds) => applyEdgeChanges(changes, eds))
        }
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);
