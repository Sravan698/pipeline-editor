import React from "react";

const ValidationStatus = ({ isValidDag }) => {
  return (
    <div className="validation-status">
      <h3>DAG Status</h3>
      {isValidDag ? (
        <p style={{ color: isValidDag.isValid ? "green" : "red" }}>
          {isValidDag.message}
        </p>
      ) : (
        <p>Checking...</p>
      )}
    </div>
  );
};

export default ValidationStatus;
