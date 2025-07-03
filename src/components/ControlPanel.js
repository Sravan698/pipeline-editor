import React from "react";

const ControlPanel = ({ nodeName, setNodeName, addNode, applyAutoLayout }) => {
  return (
    <div className="control-panel">
      <input
        type="text"
        value={nodeName}
        onChange={(e) => setNodeName(e.target.value)}
        placeholder="Node name"
      />
      <button onClick={addNode}>Add Node</button>
      <button onClick={applyAutoLayout}>Auto Layout</button>
    </div>
  );
};

export default ControlPanel;
